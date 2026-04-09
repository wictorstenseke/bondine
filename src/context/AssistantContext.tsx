import { createContext, useContext, useState } from "react"

interface AssistantContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <AssistantContext.Provider value={{ open, setOpen }}>
      {children}
    </AssistantContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAssistant() {
  const ctx = useContext(AssistantContext)
  if (!ctx)
    throw new Error("useAssistant must be used within AssistantProvider")
  return ctx
}
