export type ChatRole = "user" | "assistant" | "system"

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface MappedError {
  message: string
  retryable: boolean
}

export interface StreamRequest {
  apiKey: string
  model: string
  messages: ChatMessage[]
  signal?: AbortSignal
}
