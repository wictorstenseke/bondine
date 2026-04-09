import { useCallback, useEffect, useState } from "react"
import { OPENROUTER_KEY_STORAGE_KEY } from "@/lib/ai/config"

function readFromStorage(): string | null {
  try {
    return localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY)
  } catch {
    return null
  }
}

export function useOpenRouterKey() {
  const [key, setKeyState] = useState<string | null>(() => readFromStorage())

  // Sync across tabs / other consumers of the same storage key.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === OPENROUTER_KEY_STORAGE_KEY) {
        setKeyState(e.newValue)
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const setKey = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    try {
      localStorage.setItem(OPENROUTER_KEY_STORAGE_KEY, trimmed)
    } catch {
      // ignore storage quota or private-mode failures; feature degrades gracefully
    }
    setKeyState(trimmed)
  }, [])

  const clearKey = useCallback(() => {
    try {
      localStorage.removeItem(OPENROUTER_KEY_STORAGE_KEY)
    } catch {
      // ignore
    }
    setKeyState(null)
  }, [])

  return { key, hasKey: key !== null && key.length > 0, setKey, clearKey }
}
