import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useAddVisit } from "@/context/AddVisitContext"

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
      </Button>
    </header>
  )
}
