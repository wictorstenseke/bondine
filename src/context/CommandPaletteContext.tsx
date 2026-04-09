import { createContext, useContext, useEffect, useState } from "react"

interface CommandPaletteContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
)

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  // Single app-wide Cmd/Ctrl+K listener. The palette is the only owner of
  // this shortcut — individual features are reached as palette items.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === "k" || e.key === "K")) {
        const target = e.target as HTMLElement | null
        const tag = target?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable)
          return
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx)
    throw new Error(
      "useCommandPalette must be used within CommandPaletteProvider"
    )
  return ctx
}
