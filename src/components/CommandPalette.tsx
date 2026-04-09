import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Plus, MessageSquare } from "lucide-react"
import { useCommandPalette } from "@/context/CommandPaletteContext"
import { useAddVisit } from "@/context/AddVisitContext"
import { useAssistant } from "@/context/AssistantContext"

/**
 * App-wide command palette. Opened via Cmd/Ctrl+K (see CommandPaletteProvider)
 * or programmatically. Contains the two day-one actions:
 *   1. Add visit — default-highlighted, preserves Cmd+K→Enter muscle memory.
 *   2. Ask Bondine — opens the chat drawer.
 */
export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const { setOpen: setAddVisitOpen } = useAddVisit()
  const { setOpen: setAssistantOpen } = useAssistant()

  const runAddVisit = () => {
    setOpen(false)
    setAddVisitOpen(true)
  }

  const runAskBondine = () => {
    setOpen(false)
    setAssistantOpen(true)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command…" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem value="add visit new log" onSelect={runAddVisit}>
            <Plus />
            Add visit
          </CommandItem>
          <CommandItem
            value="ask bondine assistant chat ai recommend"
            onSelect={runAskBondine}
          >
            <MessageSquare />
            Ask AI
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
