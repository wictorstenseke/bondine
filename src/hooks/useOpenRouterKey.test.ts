import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useOpenRouterKey } from "./useOpenRouterKey"
import { OPENROUTER_KEY_STORAGE_KEY } from "@/lib/ai/config"

beforeEach(() => {
  localStorage.clear()
})

describe("useOpenRouterKey", () => {
  it("starts with no key when localStorage is empty", () => {
    const { result } = renderHook(() => useOpenRouterKey())
    expect(result.current.key).toBeNull()
    expect(result.current.hasKey).toBe(false)
  })

  it("reads an existing key from localStorage on mount", () => {
    localStorage.setItem(OPENROUTER_KEY_STORAGE_KEY, "sk-or-existing")
    const { result } = renderHook(() => useOpenRouterKey())
    expect(result.current.key).toBe("sk-or-existing")
    expect(result.current.hasKey).toBe(true)
  })

  it("setKey writes to localStorage and flips hasKey", () => {
    const { result } = renderHook(() => useOpenRouterKey())
    act(() => result.current.setKey("sk-or-new"))
    expect(result.current.key).toBe("sk-or-new")
    expect(result.current.hasKey).toBe(true)
    expect(localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBe("sk-or-new")
  })

  it("setKey trims whitespace", () => {
    const { result } = renderHook(() => useOpenRouterKey())
    act(() => result.current.setKey("  sk-or-padded  "))
    expect(result.current.key).toBe("sk-or-padded")
  })

  it("setKey ignores an empty string", () => {
    const { result } = renderHook(() => useOpenRouterKey())
    act(() => result.current.setKey("   "))
    expect(result.current.key).toBeNull()
  })

  it("clearKey removes from localStorage and flips hasKey", () => {
    localStorage.setItem(OPENROUTER_KEY_STORAGE_KEY, "sk-or-x")
    const { result } = renderHook(() => useOpenRouterKey())
    act(() => result.current.clearKey())
    expect(result.current.key).toBeNull()
    expect(result.current.hasKey).toBe(false)
    expect(localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBeNull()
  })
})
