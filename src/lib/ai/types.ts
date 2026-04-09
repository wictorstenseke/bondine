export type ChatRole = "user" | "assistant" | "system"

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface MappedError {
  message: string
  retryable: boolean
}

export type StreamChunk =
  | { type: "content"; delta: string }
  | { type: "tool_call"; name: string; argsJson: string }

export interface OpenRouterToolFunction {
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

export interface OpenRouterTool {
  type: "function"
  function: OpenRouterToolFunction
}

export interface StreamRequest {
  apiKey: string
  model: string
  messages: ChatMessage[]
  signal?: AbortSignal
  tools?: OpenRouterTool[]
}
