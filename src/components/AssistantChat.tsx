import { useEffect, useRef, useState } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { Suggestion } from "@/components/ai-elements/suggestion"
import { Button } from "@/components/ui/button"
import { FlameIcon } from "@/components/FlameIcon"
import { useAssistantChat } from "@/hooks/useAssistantChat"
import type { UiMessage } from "@/hooks/useAssistantChat"
import type { Visit } from "@/lib/storage/types"

interface Props {
  apiKey: string
  getVisits: () => Visit[]
}

const STARTER_SUGGESTIONS = [
  "Good lunch spot today?",
  "Where should I go for dinner tonight?",
  "Somewhere I haven't been in a while",
]

export function AssistantChat({ apiKey, getVisits }: Props) {
  const { messages, isStreaming, send, retry } = useAssistantChat({
    apiKey,
    getVisits,
  })
  const [draft, setDraft] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus()
    }
  }, [isStreaming])

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim()
    if (!text || isStreaming) return
    setDraft("")
    void send(text)
  }

  const handleSuggestion = (suggestion: string) => {
    if (isStreaming) return
    setDraft("")
    void send(suggestion)
  }

  const lastMessage = messages.at(-1)
  const isAssistantWorking =
    isStreaming &&
    (!lastMessage || lastMessage.role !== "assistant" || !lastMessage.content)

  return (
    <div className="flex h-[60vh] w-full min-w-0 flex-col md:h-[500px]">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-6 p-2">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<FlameIcon className="size-8 text-amber-400" />}
              title="Ask me about your visits"
              description="Pick a starter below — or type your own."
            />
          ) : (
            messages.map((m) => (
              <AssistantMessage
                key={m.id}
                message={m}
                onRetry={retry}
                isStreaming={isStreaming}
              />
            ))
          )}

          {isAssistantWorking && (
            <div className="flex items-center gap-2 px-1 text-xs">
              <FlameIcon className="size-4 animate-pulse text-amber-400" />
              <Shimmer>Stoking the embers…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {messages.length === 0 && (
        <div className="mt-2 flex flex-col items-start gap-2">
          {STARTER_SUGGESTIONS.map((s) => (
            <Suggestion key={s} suggestion={s} onClick={handleSuggestion} />
          ))}
        </div>
      )}

      <PromptInput
        onSubmit={handleSubmit}
        className="mt-2 [&>[data-slot=input-group]]:h-auto [&>[data-slot=input-group]]:items-stretch"
      >
        <PromptInputBody>
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus
            placeholder="Ask about your visits…"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            disabled={isStreaming}
            aria-label="Ask Bondine"
            className="min-h-[72px] text-sm leading-relaxed md:text-sm"
          />
          <PromptInputSubmit
            status={isStreaming ? "streaming" : undefined}
            disabled={!draft.trim() || isStreaming}
            className="m-2 self-end"
          />
        </PromptInputBody>
      </PromptInput>
    </div>
  )
}

interface AssistantMessageProps {
  message: UiMessage
  onRetry: () => void
  isStreaming: boolean
}

function AssistantMessage({
  message,
  onRetry,
  isStreaming,
}: AssistantMessageProps) {
  const hasContent = message.content.length > 0
  const isAssistant = message.role === "assistant"

  return (
    <Message from={message.role}>
      <MessageContent className="text-sm leading-relaxed">
        {hasContent &&
          (isAssistant ? (
            <MessageResponse>{message.content}</MessageResponse>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ))}

        {message.error && (
          <div
            className={`flex items-start gap-2 text-destructive ${
              hasContent ? "mt-2 border-t border-destructive/30 pt-2" : ""
            }`}
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              <p className="text-xs">{message.error.message}</p>
              {message.error.retryable && !isStreaming && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 h-7 gap-1"
                  onClick={onRetry}
                >
                  <RefreshCw className="size-3" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        )}
      </MessageContent>
    </Message>
  )
}
