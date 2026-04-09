import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { MessageSquare } from "lucide-react"
import { useCommandPalette } from "@/context/CommandPaletteContext"
import { useAssistant } from "@/context/AssistantContext"

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform)

export function AppHeader() {
  const { setOpen: setPaletteOpen } = useCommandPalette()
  const { setOpen: setAssistantOpen } = useAssistant()

  return (
    <header className="flex items-center justify-between border-b px-3 py-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="font-semibold text-amber-400 md:hidden">Bondine</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAssistantOpen(true)}
        >
          <MessageSquare />
          Ask AI
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaletteOpen(true)}
          className="text-muted-foreground"
        >
          Actions
          <KbdGroup data-icon="inline-end" className="ml-2">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
      </div>
    </header>
  )
}
