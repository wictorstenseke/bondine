import { describe, it, expect, afterEach, vi } from "vitest"
import { streamChat } from "./openrouterClient"
import { OpenRouterError } from "./errorMapper"

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

    const out: string[] = []
    for await (const delta of streamChat({
      apiKey: "k",
      model: "m",
      messages: [{ role: "user", content: "hi" }],
    })) {
      out.push(delta)
    }
    expect(out).toEqual(["Hello", ", ", "world"])
  })

  it("stops cleanly on [DONE]", async () => {
    const body = streamFromChunks([
      sseFrame({ choices: [{ delta: { content: "one" } }] }),
      "data: [DONE]\n\n",
      // Content after [DONE] should not be yielded.
      sseFrame({ choices: [{ delta: { content: "two" } }] }),
    ])
    vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

    const out: string[] = []
    for await (const delta of streamChat({
      apiKey: "k",
      model: "m",
      messages: [],
    })) {
      out.push(delta)
    }
    expect(out).toEqual(["one"])
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

    const out: string[] = []
    for await (const delta of streamChat({
      apiKey: "k",
      model: "m",
      messages: [],
    })) {
      out.push(delta)
    }
    expect(out).toEqual(["Hello"])
  })

  it("ignores malformed SSE frames", async () => {
    const body = streamFromChunks([
      "data: not-json\n\n",
      sseFrame({ choices: [{ delta: { content: "ok" } }] }),
      "data: [DONE]\n\n",
    ])
    vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

    const out: string[] = []
    for await (const delta of streamChat({
      apiKey: "k",
      model: "m",
      messages: [],
    })) {
      out.push(delta)
    }
    expect(out).toEqual(["ok"])
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
})
