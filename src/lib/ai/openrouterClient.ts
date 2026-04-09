import { OPENROUTER_ENDPOINT } from "./config"
import { OpenRouterError } from "./errorMapper"
import type { StreamRequest } from "./types"

/**
 * Stream chat completions from OpenRouter as an async iterable of content
 * deltas. Each yielded string is a raw token chunk from the model.
 *
 * This module knows nothing about Bondine, visits, or React. It takes a
 * well-formed request and yields deltas — nothing more. That makes it
 * trivially mockable in tests by stubbing global `fetch`.
 */
export async function* streamChat(
  req: StreamRequest
): AsyncGenerator<string, void, unknown> {
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

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
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
          if (payload === "[DONE]") return

          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>
            }
            const delta = parsed.choices?.[0]?.delta?.content
            if (typeof delta === "string" && delta.length > 0) {
              yield delta
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
