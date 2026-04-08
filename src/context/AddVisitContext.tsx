import { createContext, useContext, useEffect, useState } from "react"

interface AddVisitContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const AddVisitContext = createContext<AddVisitContextValue | null>(null)

export function AddVisitProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+N on macOS, Ctrl+N on Windows/Linux
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === "k" || e.key === "K")) {
        const target = e.target as HTMLElement | null
        const tag = target?.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable)
          return
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <AddVisitContext.Provider value={{ open, setOpen }}>
      {children}
    </AddVisitContext.Provider>
  )
}

export function useAddVisit() {
  const ctx = useContext(AddVisitContext)
  if (!ctx) throw new Error("useAddVisit must be used within AddVisitProvider")
  return ctx
}
