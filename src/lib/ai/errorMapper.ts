import type { MappedError } from "./types"

export class OpenRouterError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "OpenRouterError"
  }
}

export function mapError(err: unknown): MappedError {
  if (err instanceof OpenRouterError) {
    switch (err.status) {
      case 401:
        return {
          message:
            "Your OpenRouter key looks invalid. Open settings to update it.",
          retryable: false,
        }
      case 402:
        return {
          message: "Your OpenRouter account is out of credits.",
          retryable: false,
        }
      case 404:
        return {
          message: "That model isn't available. Check your settings.",
          retryable: false,
        }
      case 429:
        return {
          message: "Rate limited — try again in a moment.",
          retryable: true,
        }
      default:
        return {
          message: `Something went wrong (${err.status}). Retry?`,
          retryable: true,
        }
    }
  }

  // Aborted streams are a normal flow control signal, not a user-facing error.
  if (err instanceof DOMException && err.name === "AbortError") {
    return { message: "Cancelled.", retryable: true }
  }

  // fetch() throws TypeError on network failures in all browsers.
  if (err instanceof TypeError) {
    return {
      message: "Network problem. Check your connection and retry.",
      retryable: true,
    }
  }

  return { message: "Something went wrong. Retry?", retryable: true }
}
