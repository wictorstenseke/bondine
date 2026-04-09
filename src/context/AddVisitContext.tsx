import { createContext, useContext, useState } from "react"

interface AddVisitContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const AddVisitContext = createContext<AddVisitContextValue | null>(null)

export function AddVisitProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <AddVisitContext.Provider value={{ open, setOpen }}>
      {children}
    </AddVisitContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAddVisit() {
  const ctx = useContext(AddVisitContext)
  if (!ctx) throw new Error("useAddVisit must be used within AddVisitProvider")
  return ctx
}
