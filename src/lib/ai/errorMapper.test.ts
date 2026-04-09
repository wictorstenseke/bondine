import { describe, it, expect } from "vitest"
import { mapError, OpenRouterError } from "./errorMapper"

describe("mapError", () => {
  it("maps 401 to invalid-key, non-retryable", () => {
    const out = mapError(new OpenRouterError(401, "unauthorized"))
    expect(out.message).toMatch(/invalid/i)
    expect(out.retryable).toBe(false)
  })

  it("maps 402 to out-of-credits, non-retryable", () => {
    const out = mapError(new OpenRouterError(402, "payment required"))
    expect(out.message).toMatch(/credit/i)
    expect(out.retryable).toBe(false)
  })

  it("maps 404 to bad-model, non-retryable", () => {
    const out = mapError(new OpenRouterError(404, "not found"))
    expect(out.message).toMatch(/model/i)
    expect(out.retryable).toBe(false)
  })

  it("maps 429 to rate-limited, retryable", () => {
    const out = mapError(new OpenRouterError(429, "rate limited"))
    expect(out.message).toMatch(/rate/i)
    expect(out.retryable).toBe(true)
  })

  it("maps unknown HTTP statuses to a generic retryable error", () => {
    const out = mapError(new OpenRouterError(500, "boom"))
    expect(out.retryable).toBe(true)
    expect(out.message).toMatch(/500/)
  })

  it("maps TypeError (network failure) to a connection message", () => {
    const out = mapError(new TypeError("Failed to fetch"))
    expect(out.message).toMatch(/network/i)
    expect(out.retryable).toBe(true)
  })

  it("maps unknown throwables to a generic retryable error", () => {
    const out = mapError(new Error("???"))
    expect(out.retryable).toBe(true)
  })

  it("treats aborted streams as retryable control signal", () => {
    const abort = new DOMException("aborted", "AbortError")
    const out = mapError(abort)
    expect(out.retryable).toBe(true)
  })
})
