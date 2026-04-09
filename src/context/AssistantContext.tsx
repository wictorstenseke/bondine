import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { OPENROUTER_KEY_STORAGE_KEY } from "@/lib/ai/config"

function readKey(): string | null {
  try {
    return localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY)
  } catch {
    return null
  }
}

interface AssistantContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  key: string | null
  hasKey: boolean
  setKey: (value: string) => void
  clearKey: () => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [key, setKeyState] = useState<string | null>(() => readKey())

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === OPENROUTER_KEY_STORAGE_KEY) setKeyState(e.newValue)
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const setKey = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    try {
      localStorage.setItem(OPENROUTER_KEY_STORAGE_KEY, trimmed)
    } catch {}
    setKeyState(trimmed)
  }, [])

  const clearKey = useCallback(() => {
    try {
      localStorage.removeItem(OPENROUTER_KEY_STORAGE_KEY)
    } catch {}
    setKeyState(null)
  }, [])

  return (
    <AssistantContext.Provider
      value={{
        open,
        setOpen,
        key,
        hasKey: key !== null && key.length > 0,
        setKey,
        clearKey,
      }}
    >
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
