import { useCallback, useRef, useState } from "react"
import { nanoid } from "nanoid"
import { streamChat } from "@/lib/ai/openrouterClient"
import { buildChatContext } from "@/lib/ai/buildChatContext"
import { mapError } from "@/lib/ai/errorMapper"
import { DEFAULT_MODEL } from "@/lib/ai/config"
import { VISIT_TOOLS, type CreateVisitArgs } from "@/lib/ai/tools"
import type {
  ChatMessage,
  MappedError,
  StreamChunk,
  StreamRequest,
} from "@/lib/ai/types"
import type { Visit } from "@/lib/storage/types"

export interface UiMessage {
  id: string
  role: "user" | "assistant"
  content: string
  error?: MappedError
}

type StreamFn = (req: StreamRequest) => AsyncIterable<StreamChunk>

interface Options {
  apiKey: string | null
  model?: string
  /** Called on every send — lets callers read fresh visits from storage. */
  getVisits: () => Visit[]
  /** Called on every send — lets callers inject a deterministic `now`. */
  getNow?: () => Date
  /** Injectable for tests. Defaults to the real OpenRouter client. */
  stream?: StreamFn
}

let idCounter = 0
const nextId = () => `m${++idCounter}`

/**
 * Orchestrates the assistant conversation: holds the message list, composes
 * each request via the context builder, streams via the OpenRouter client,
 * appends deltas to the current assistant message, and maps errors.
 *
 * Also handles `create_visit` tool calls: when the LLM calls the tool, the
 * parsed args are stored in `pendingVisit`. The caller can confirm (which
 * saves the visit) or cancel.
 *
 * Session-only: there is no persistence. The message list lives in React
 * state and dies with the component.
 */
export function useAssistantChat(opts: Options) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [pendingVisit, setPendingVisit] = useState<CreateVisitArgs | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const runTurn = useCallback(
    async (messageList: UiMessage[], visits: Visit[]) => {
      if (!opts.apiKey) {
        // Surface as an error bubble so the UI doesn't silently fail.
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: "",
            error: {
              message: "No OpenRouter key set. Open settings to add one.",
              retryable: false,
            },
          },
        ])
        return
      }

      const now = opts.getNow ? opts.getNow() : new Date()
      const system = buildChatContext(visits, now)

      // Translate the visible conversation into the wire format. Every turn
      // re-sends the full system message with fresh visit data.
      const wireMessages: ChatMessage[] = [
        { role: "system", content: system },
        ...messageList
          .filter((m) => !m.error) // skip errored assistant bubbles
          .map((m) => ({ role: m.role, content: m.content })),
      ]

      const assistantId = nextId()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ])

      const controller = new AbortController()
      abortRef.current = controller
      setIsStreaming(true)

      const streamFn: StreamFn = opts.stream ?? streamChat
      try {
        for await (const chunk of streamFn({
          apiKey: opts.apiKey,
          model: opts.model ?? DEFAULT_MODEL,
          messages: wireMessages,
          signal: controller.signal,
          tools: VISIT_TOOLS,
        })) {
          if (chunk.type === "content") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + chunk.delta }
                  : m
              )
            )
          } else if (
            chunk.type === "tool_call" &&
            chunk.name === "create_visit"
          ) {
            try {
              const args = JSON.parse(chunk.argsJson) as CreateVisitArgs
              setPendingVisit(args)
            } catch {
              // ignore malformed tool call args
            }
          }
        }
      } catch (err) {
        const mapped = mapError(err)
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, error: mapped } : m))
        )
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [opts]
  )

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      // Clear any pending visit draft when the user sends a new message.
      setPendingVisit(null)

      const userMsg: UiMessage = {
        id: nextId(),
        role: "user",
        content: trimmed,
      }
      const visits = opts.getVisits()

      // Optimistic: append user message immediately so the UI feels snappy.
      const nextMessages = [...messages, userMsg]
      setMessages(nextMessages)
      await runTurn(nextMessages, visits)
    },
    [isStreaming, messages, opts, runTurn]
  )

  const retry = useCallback(async () => {
    if (isStreaming) return
    // Find the last user message — that's what we re-send. Drop any trailing
    // errored assistant bubble so retry replaces it cleanly.
    let lastUserIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]!.role === "user") {
        lastUserIdx = i
        break
      }
    }
    if (lastUserIdx === -1) return

    const trimmed = messages.slice(0, lastUserIdx + 1)
    setMessages(trimmed)
    await runTurn(trimmed, opts.getVisits())
  }, [isStreaming, messages, opts, runTurn])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setMessages([])
    setIsStreaming(false)
  }, [])

  const confirmVisit = useCallback(
    (addVisit: (visit: Visit) => void) => {
      if (!pendingVisit) return
      const today = new Date().toISOString().slice(0, 10)
      addVisit({
        id: nanoid(),
        restaurantName: pendingVisit.restaurantName,
        date: pendingVisit.date ?? today,
        mealType: pendingVisit.mealType ?? null,
        rating: pendingVisit.rating ?? null,
        note: pendingVisit.note ?? null,
        createdAt: new Date().toISOString(),
      })
      setPendingVisit(null)
    },
    [pendingVisit]
  )

  const cancelVisit = useCallback(() => {
    setPendingVisit(null)
  }, [])

  return {
    messages,
    isStreaming,
    send,
    retry,
    reset,
    pendingVisit,
    confirmVisit,
    cancelVisit,
  }
}
