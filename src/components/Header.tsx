import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useAddVisit } from "@/context/AddVisitContext"

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform)

export function AppHeader() {
  const { setOpen } = useAddVisit()

  return (
    <header className="flex items-center justify-between border-b px-3 py-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="font-semibold text-amber-400 md:hidden">Bondine</span>
      </div>
      <Button size="sm" onClick={() => setOpen(true)}>
        Add visit
        <KbdGroup data-icon="inline-end" className="ml-2">
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
    </header>
  )
}
