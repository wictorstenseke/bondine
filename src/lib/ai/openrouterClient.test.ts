import { describe, it, expect, afterEach, vi } from "vitest"
import { streamChat } from "./openrouterClient"
import { OpenRouterError } from "./errorMapper"
import type { StreamChunk } from "./types"

function sseFrame(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`
}

function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let i = 0
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i]!))
        i++
      } else {
        controller.close()
      }
    },
  })
}

function mockFetch(response: Response) {
  return vi.fn().mockResolvedValue(response)
}

function contentChunks(chunks: StreamChunk[]): string[] {
  return chunks
    .filter(
      (c): c is { type: "content"; delta: string } => c.type === "content"
    )
    .map((c) => c.delta)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("streamChat", () => {
  it("yields content deltas in order from SSE frames", async () => {
    const body = streamFromChunks([
      sseFrame({ choices: [{ delta: { content: "Hello" } }] }),
      sseFrame({ choices: [{ delta: { content: ", " } }] }),
      sseFrame({ choices: [{ delta: { content: "world" } }] }),
      "data: [DONE]\n\n",
    ])
    vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

    const chunks: StreamChunk[] = []
    for await (const chunk of streamChat({
      apiKey: "k",
      model: "m",
      messages: [{ role: "user", content: "hi" }],
    })) {
      chunks.push(chunk)
    }
    expect(contentChunks(chunks)).toEqual(["Hello", ", ", "world"])
  })

  it("stops cleanly on [DONE]", async () => {
    const body = streamFromChunks([
      sseFrame({ choices: [{ delta: { content: "one" } }] }),
      "data: [DONE]\n\n",
      // Content after [DONE] should not be yielded.
      sseFrame({ choices: [{ delta: { content: "two" } }] }),
    ])
    vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

    const chunks: StreamChunk[] = []
    for await (const chunk of streamChat({
      apiKey: "k",
      model: "m",
      messages: [],
    })) {
      chunks.push(chunk)
    }
    expect(contentChunks(chunks)).toEqual(["one"])
  })

  it("throws OpenRouterError with status on non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(new Response("unauthorized", { status: 401 }))
    )

    await expect(async () => {
      for await (const _ of streamChat({
        apiKey: "bad",
        model: "m",
        messages: [],
      })) {
        void _
      }
    }).rejects.toBeInstanceOf(OpenRouterError)
  })

  it("handles frames split across multiple chunks", async () => {
    // One logical SSE frame broken across two network chunks.
    const body = streamFromChunks([
      'data: {"choices":[{"delta":{"content":"Hel',
      'lo"}}]}\n\n',
      "data: [DONE]\n\n",
    ])
    vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

    const chunks: StreamChunk[] = []
    for await (const chunk of streamChat({
      apiKey: "k",
      model: "m",
      messages: [],
    })) {
      chunks.push(chunk)
    }
    expect(contentChunks(chunks)).toEqual(["Hello"])
  })

  it("ignores malformed SSE frames", async () => {
    const body = streamFromChunks([
      "data: not-json\n\n",
      sseFrame({ choices: [{ delta: { content: "ok" } }] }),
      "data: [DONE]\n\n",
    ])
    vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

    const chunks: StreamChunk[] = []
    for await (const chunk of streamChat({
      apiKey: "k",
      model: "m",
      messages: [],
    })) {
      chunks.push(chunk)
    }
    expect(contentChunks(chunks)).toEqual(["ok"])
  })

  it("honors AbortSignal passed through to fetch", async () => {
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      // Simulate fetch rejecting when the signal aborts.
      return new Promise((_resolve, reject) => {
        const signal = (init as RequestInit).signal
        if (signal) {
          signal.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError"))
          )
        }
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const controller = new AbortController()
    const promise = (async () => {
      for await (const _ of streamChat({
        apiKey: "k",
        model: "m",
        messages: [],
        signal: controller.signal,
      })) {
        void _
      }
    })()
    controller.abort()
    await expect(promise).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalled()
  })

  describe("tool_call chunks", () => {
    it("yields a tool_call chunk with accumulated args from fragmented SSE frames", async () => {
      const body = streamFromChunks([
        sseFrame({
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    function: { name: "create_visit", arguments: '{"res' },
                  },
                ],
              },
            },
          ],
        }),
        sseFrame({
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    function: { name: "", arguments: 'taurant":"Pizza Hut"}' },
                  },
                ],
              },
            },
          ],
        }),
        "data: [DONE]\n\n",
      ])
      vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

      const chunks: StreamChunk[] = []
      for await (const chunk of streamChat({
        apiKey: "k",
        model: "m",
        messages: [],
      })) {
        chunks.push(chunk)
      }

      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toEqual({
        type: "tool_call",
        name: "create_visit",
        argsJson: '{"restaurant":"Pizza Hut"}',
      })
    })

    it("yields only content chunks when no tool calls are present", async () => {
      const body = streamFromChunks([
        sseFrame({ choices: [{ delta: { content: "Sure" } }] }),
        sseFrame({ choices: [{ delta: { content: "!" } }] }),
        "data: [DONE]\n\n",
      ])
      vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

      const chunks: StreamChunk[] = []
      for await (const chunk of streamChat({
        apiKey: "k",
        model: "m",
        messages: [],
      })) {
        chunks.push(chunk)
      }

      expect(chunks.every((c) => c.type === "content")).toBe(true)
      expect(contentChunks(chunks)).toEqual(["Sure", "!"])
    })

    it("yields mixed content + tool_call chunks", async () => {
      const body = streamFromChunks([
        sseFrame({ choices: [{ delta: { content: "Adding" } }] }),
        sseFrame({
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    function: { name: "create_visit", arguments: '{"r":"X"}' },
                  },
                ],
              },
            },
          ],
        }),
        "data: [DONE]\n\n",
      ])
      vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

      const chunks: StreamChunk[] = []
      for await (const chunk of streamChat({
        apiKey: "k",
        model: "m",
        messages: [],
      })) {
        chunks.push(chunk)
      }

      expect(chunks).toHaveLength(2)
      expect(chunks[0]).toEqual({ type: "content", delta: "Adding" })
      expect(chunks[1]).toEqual({
        type: "tool_call",
        name: "create_visit",
        argsJson: '{"r":"X"}',
      })
    })
  })
})
