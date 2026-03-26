import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useVisits } from "./useVisits"
import type { StorageAdapter, Visit } from "./types"

function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: "1",
    restaurantName: "Trattoria Roma",
    date: "2026-03-26",
    mealType: null,
    rating: null,
    note: null,
    createdAt: "2026-03-26T19:00:00.000Z",
    ...overrides,
  }
}

function makeAdapter(visits: Visit[] = []): StorageAdapter {
  const store = [...visits]
  return {
    getVisits: vi.fn(() => [...store]),
    addVisit: vi.fn((v) => store.push(v)),
    updateVisit: vi.fn((v) => {
      const i = store.findIndex((x) => x.id === v.id)
      if (i !== -1) store[i] = v
    }),
    deleteVisit: vi.fn((id) => {
      const i = store.findIndex((x) => x.id === id)
      if (i !== -1) store.splice(i, 1)
    }),
  }
}

describe("useVisits", () => {
  it("exposes visits from the adapter", () => {
    const visit = makeVisit()
    const adapter = makeAdapter([visit])
    const { result } = renderHook(() => useVisits(adapter))
    expect(result.current.visits).toEqual([visit])
  })

  it("addVisit adds a visit to the list", () => {
    const adapter = makeAdapter()
    const { result } = renderHook(() => useVisits(adapter))
    const visit = makeVisit()
    act(() => result.current.addVisit(visit))
    expect(result.current.visits).toEqual([visit])
  })

  it("updateVisit updates a visit in the list", () => {
    const visit = makeVisit()
    const adapter = makeAdapter([visit])
    const { result } = renderHook(() => useVisits(adapter))
    const updated = { ...visit, rating: 5 }
    act(() => result.current.updateVisit(updated))
    expect(result.current.visits).toEqual([updated])
  })

  it("deleteVisit removes a visit from the list", () => {
    const visit = makeVisit()
    const adapter = makeAdapter([visit])
    const { result } = renderHook(() => useVisits(adapter))
    act(() => result.current.deleteVisit(visit.id))
    expect(result.current.visits).toEqual([])
  })
})
