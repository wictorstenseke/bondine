import { describe, it, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useAssistantChat } from "./useAssistantChat"
import { OpenRouterError } from "@/lib/ai/errorMapper"
import type { StreamChunk, StreamRequest } from "@/lib/ai/types"
import type { CreateVisitArgs } from "@/lib/ai/tools"
import type { Visit } from "@/lib/storage/types"

const FIXED_NOW = new Date("2026-04-08T12:30:00Z")

const fixtureVisits: Visit[] = [
  {
    id: "v1",
    restaurantName: "Trattoria Roma",
    date: "2026-03-26",
    mealType: "dinner",
    rating: 4,
    note: "great negroni",
    createdAt: "2026-03-26T19:00:00.000Z",
  },
]

function makeStream(chunks: string[]) {
  return async function* (_: StreamRequest): AsyncIterable<StreamChunk> {
    void _
    for (const c of chunks) yield { type: "content", delta: c }
  }
}

function makeErrorStream(err: unknown) {
  // eslint-disable-next-line require-yield
  return async function* (_: StreamRequest): AsyncIterable<StreamChunk> {
    void _
    throw err
  }
}

async function* chunkStream(chunks: StreamChunk[]): AsyncIterable<StreamChunk> {
  for (const c of chunks) yield c
}

describe("useAssistantChat", () => {
  it("send appends a user message and streams the assistant reply", async () => {
    const stream = makeStream(["He", "llo", "!"])
    const { result } = renderHook(() =>
      useAssistantChat({
        apiKey: "k",
        getVisits: () => fixtureVisits,
        getNow: () => FIXED_NOW,
        stream,
      })
    )

    await act(async () => {
      await result.current.send("hi")
    })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })
    expect(result.current.messages[0]!.role).toBe("user")
    expect(result.current.messages[0]!.content).toBe("hi")
    expect(result.current.messages[1]!.role).toBe("assistant")
    expect(result.current.messages[1]!.content).toBe("Hello!")
    expect(result.current.isStreaming).toBe(false)
  })

  it("includes a system message built from visits on every request", async () => {
    const seen: StreamRequest[] = []
    const stream = async function* (
      req: StreamRequest
    ): AsyncIterable<StreamChunk> {
      seen.push(req)
      yield { type: "content", delta: "ok" }
    }
    const { result } = renderHook(() =>
      useAssistantChat({
        apiKey: "k",
        getVisits: () => fixtureVisits,
        getNow: () => FIXED_NOW,
        stream,
      })
    )

    await act(async () => {
      await result.current.send("pick something")
    })

    expect(seen).toHaveLength(1)
    const sysMsg = seen[0]!.messages[0]
    expect(sysMsg!.role).toBe("system")
    expect(sysMsg!.content).toContain("Trattoria Roma")
    expect(sysMsg!.content).toContain("food-obsessed friend")
  })

  it("on error, stores the mapped error on the assistant bubble", async () => {
    const stream = makeErrorStream(new OpenRouterError(401, "unauthorized"))
    const { result } = renderHook(() =>
      useAssistantChat({
        apiKey: "bad",
        getVisits: () => fixtureVisits,
        stream,
      })
    )

    await act(async () => {
      await result.current.send("hi")
    })

    const lastMsg = result.current.messages[result.current.messages.length - 1]
    expect(lastMsg!.error).toBeDefined()
    expect(lastMsg!.error!.retryable).toBe(false)
  })

  it("retry re-sends the last user message and replaces the errored bubble", async () => {
    let call = 0
    const stream = async function* (
      _: StreamRequest
    ): AsyncIterable<StreamChunk> {
      void _
      call++
      if (call === 1) throw new OpenRouterError(429, "rate limited")
      yield { type: "content", delta: "second try succeeded" }
    }
    const { result } = renderHook(() =>
      useAssistantChat({
        apiKey: "k",
        getVisits: () => fixtureVisits,
        stream,
      })
    )

    await act(async () => {
      await result.current.send("hi")
    })
    expect(
      result.current.messages[result.current.messages.length - 1]!.error
    ).toBeDefined()

    await act(async () => {
      await result.current.retry()
    })

    // There should still be exactly one user + one assistant message
    // (no duplicate user message from retry).
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]!.role).toBe("user")
    expect(result.current.messages[1]!.content).toBe("second try succeeded")
    expect(result.current.messages[1]!.error).toBeUndefined()
  })

  it("surfaces an error if send is called with no key", async () => {
    const stream = makeStream(["should not run"])
    const { result } = renderHook(() =>
      useAssistantChat({
        apiKey: null,
        getVisits: () => fixtureVisits,
        stream,
      })
    )

    await act(async () => {
      await result.current.send("hi")
    })

    const lastMsg = result.current.messages[result.current.messages.length - 1]
    expect(lastMsg!.error).toBeDefined()
    expect(lastMsg!.error!.retryable).toBe(false)
  })

  it("multi-turn: second send includes prior assistant reply in the wire messages", async () => {
    const seen: StreamRequest[] = []
    const stream = async function* (
      req: StreamRequest
    ): AsyncIterable<StreamChunk> {
      seen.push(req)
      yield { type: "content", delta: "first answer" }
    }
    const { result } = renderHook(() =>
      useAssistantChat({
        apiKey: "k",
        getVisits: () => fixtureVisits,
        stream,
      })
    )

    await act(async () => {
      await result.current.send("first")
    })
    await act(async () => {
      await result.current.send("second")
    })

    expect(seen).toHaveLength(2)
    const secondWire = seen[1]!.messages
    // system, user("first"), assistant("first answer"), user("second")
    expect(secondWire).toHaveLength(4)
    expect(secondWire[0]!.role).toBe("system")
    expect(secondWire[1]!.content).toBe("first")
    expect(secondWire[2]!.role).toBe("assistant")
    expect(secondWire[2]!.content).toBe("first answer")
    expect(secondWire[3]!.content).toBe("second")
  })

  it("reset clears the message list", async () => {
    const stream = makeStream(["ok"])
    const { result } = renderHook(() =>
      useAssistantChat({
        apiKey: "k",
        getVisits: () => fixtureVisits,
        stream,
      })
    )
    await act(async () => {
      await result.current.send("hi")
    })
    act(() => result.current.reset())
    expect(result.current.messages).toHaveLength(0)
  })

  it("invariance: ignores any external filter state and reads full visits each send", async () => {
    const seen: StreamRequest[] = []
    const stream = async function* (
      req: StreamRequest
    ): AsyncIterable<StreamChunk> {
      seen.push(req)
      yield { type: "content", delta: "ok" }
    }
    const getVisits = vi.fn(() => fixtureVisits)

    const { result } = renderHook(() =>
      useAssistantChat({
        apiKey: "k",
        getVisits,
        stream,
      })
    )
    await act(async () => {
      await result.current.send("hi")
    })

    expect(getVisits).toHaveBeenCalled()
    expect(seen[0]!.messages[0]!.content).toContain("Trattoria Roma")
  })
})

describe("tool call — create_visit", () => {
  const argsJson = JSON.stringify({
    restaurantName: "Noma",
    rating: 4,
  } satisfies Partial<CreateVisitArgs>)

  function makeHook() {
    const stream = vi
      .fn()
      .mockReturnValue(
        chunkStream([{ type: "tool_call", name: "create_visit", argsJson }])
      )
    const { result } = renderHook(() =>
      useAssistantChat({ apiKey: "k", getVisits: () => [], stream })
    )
    return result
  }

  it("sets pendingVisit when stream yields a tool_call chunk", async () => {
    const result = makeHook()
    await act(async () => {
      await result.current.send("went to Noma")
    })
    expect(result.current.pendingVisit).toEqual({
      restaurantName: "Noma",
      rating: 4,
    })
  })

  it("clears pendingVisit on cancelVisit", async () => {
    const result = makeHook()
    await act(async () => {
      await result.current.send("went to Noma")
    })
    await act(async () => {
      result.current.cancelVisit()
    })
    expect(result.current.pendingVisit).toBeNull()
  })

  it("calls addVisit with a full Visit and clears pendingVisit on confirmVisit", async () => {
    const result = makeHook()
    await act(async () => {
      await result.current.send("went to Noma")
    })
    const addVisit = vi.fn()
    await act(async () => {
      result.current.confirmVisit(addVisit)
    })
    expect(addVisit).toHaveBeenCalledOnce()
    const calledWith = addVisit.mock.calls[0][0] as Visit
    expect(calledWith.restaurantName).toBe("Noma")
    expect(calledWith.rating).toBe(4)
    expect(calledWith.id).toBeDefined()
    expect(calledWith.createdAt).toBeDefined()
    expect(result.current.pendingVisit).toBeNull()
  })

  it("clears pendingVisit when user sends a new message", async () => {
    const stream = vi
      .fn()
      .mockReturnValueOnce(
        chunkStream([{ type: "tool_call", name: "create_visit", argsJson }])
      )
      .mockReturnValueOnce(chunkStream([{ type: "content", delta: "ok" }]))
    const { result } = renderHook(() =>
      useAssistantChat({ apiKey: "k", getVisits: () => [], stream })
    )
    await act(async () => {
      await result.current.send("went to Noma")
    })
    expect(result.current.pendingVisit).not.toBeNull()
    await act(async () => {
      await result.current.send("what about tomorrow?")
    })
    expect(result.current.pendingVisit).toBeNull()
  })
})
