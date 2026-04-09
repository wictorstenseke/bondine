import { OPENROUTER_ENDPOINT } from "./config"
import { OpenRouterError } from "./errorMapper"
import type { StreamChunk, StreamRequest } from "./types"

/**
 * Stream chat completions from OpenRouter as an async iterable of StreamChunk.
 * Yields `{ type: "content", delta }` for text tokens and a single
 * `{ type: "tool_call", name, argsJson }` when a tool call completes at [DONE].
 *
 * This module knows nothing about Bondine, visits, or React. It takes a
 * well-formed request and yields chunks — nothing more. That makes it
 * trivially mockable in tests by stubbing global `fetch`.
 */
export async function* streamChat(
  req: StreamRequest
): AsyncGenerator<StreamChunk, void, unknown> {
  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.apiKey}`,
      // OpenRouter asks referrers to identify themselves; harmless if absent.
      "HTTP-Referer":
        typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "Bondine",
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      stream: true,
      ...(req.tools && req.tools.length > 0 ? { tools: req.tools } : {}),
    }),
    signal: req.signal,
  })

  if (!res.ok) {
    let body = ""
    try {
      body = await res.text()
    } catch {
      // ignore body read failures; status alone is enough for the error mapper
    }
    throw new OpenRouterError(res.status, body || res.statusText)
  }

  if (!res.body) {
    throw new OpenRouterError(0, "No response body")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  let toolCallName = ""
  let toolCallArgs = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        // Stream closed without [DONE] — emit any accumulated tool call so
        // callers don't silently lose a partial result (e.g. on network drop).
        if (toolCallName) {
          yield {
            type: "tool_call",
            name: toolCallName,
            argsJson: toolCallArgs,
          }
        }
        break
      }
      buffer += decoder.decode(value, { stream: true })

      // SSE frames are separated by double newlines. Process every complete
      // frame currently in the buffer and leave any partial frame for the
      // next iteration.
      let sepIdx: number
      while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sepIdx)
        buffer = buffer.slice(sepIdx + 2)

        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue
          const payload = line.slice(5).trim()
          if (!payload) continue
          if (payload === "[DONE]") {
            if (toolCallName) {
              yield {
                type: "tool_call",
                name: toolCallName,
                argsJson: toolCallArgs,
              }
            }
            return
          }

          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{
                delta?: {
                  content?: string
                  tool_calls?: Array<{
                    index: number
                    function?: { name?: string; arguments?: string }
                  }>
                }
              }>
            }
            const delta = parsed.choices?.[0]?.delta

            if (delta?.content != null && delta.content.length > 0) {
              yield { type: "content", delta: delta.content }
            }

            if (delta?.tool_calls) {
              // Only index 0 is supported; parallel multi-tool responses
              // would corrupt name/args. OpenRouter currently sends one tool
              // call at a time, so this is safe for the current use case.
              for (const tc of delta.tool_calls) {
                if (tc.function?.name) {
                  toolCallName += tc.function.name
                }
                if (tc.function?.arguments) {
                  toolCallArgs += tc.function.arguments
                }
              }
            }
          } catch {
            // Ignore malformed frames — OpenRouter occasionally emits
            // keep-alive comments that are not JSON.
          }
        }
      }
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // releaseLock can throw if the reader is already released; ignore.
    }
  }
}
