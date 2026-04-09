import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOpenRouterKey } from "@/hooks/useOpenRouterKey"
import { ExternalLink } from "lucide-react"

function maskKey(key: string): string {
  if (key.length <= 10) return "••••"
  return `${key.slice(0, 7)}…${key.slice(-4)}`
}

interface Props {
  onClose: () => void
}

export function AssistantSettings({ onClose }: Props) {
  const { key, hasKey, setKey, clearKey } = useOpenRouterKey()
  const [editing, setEditing] = useState(!hasKey)
  const [draft, setDraft] = useState("")

  const handleSave = () => {
    if (!draft.trim()) return
    setKey(draft)
    setDraft("")
    setEditing(false)
  }

  const handleRemove = () => {
    clearKey()
    setEditing(true)
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="openrouter-key">OpenRouter API key</Label>

      {editing || !hasKey ? (
        <div className="flex flex-col gap-2">
          <Input
            id="openrouter-key"
            type="password"
            placeholder="sk-or-v1-…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSave()
              }
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!draft.trim()}>
              Save
            </Button>
            {hasKey && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false)
                  setDraft("")
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <code className="text-sm text-muted-foreground">
            {maskKey(key ?? "")}
          </code>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(true)
                setDraft("")
              }}
            >
              Replace
            </Button>
            <Button size="sm" variant="ghost" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Your visit history is sent to OpenRouter with each question so the
        assistant can reason over it. Nothing is stored on any server we
        control.
      </p>

      <a
        href="https://openrouter.ai/keys"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
      >
        Get an OpenRouter key
        <ExternalLink className="size-3" />
      </a>

      {hasKey && !editing && (
        <Button size="sm" variant="outline" onClick={onClose}>
          Back to chat
        </Button>
      )}
    </div>
  )
}
