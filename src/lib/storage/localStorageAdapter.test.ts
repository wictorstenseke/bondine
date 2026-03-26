import { describe, it, expect, beforeEach } from "vitest"
import { localStorageAdapter } from "./localStorageAdapter"

beforeEach(() => {
  localStorage.clear()
})

describe("localStorageAdapter", () => {
  it("returns empty array when storage is empty", () => {
    expect(localStorageAdapter.getVisits()).toEqual([])
  })

  it("deleteVisit removes a visit by id", () => {
    const a = {
      id: "1",
      restaurantName: "Trattoria Roma",
      date: "2026-03-26",
      mealType: null,
      rating: null,
      note: null,
      createdAt: "2026-03-26T19:00:00.000Z",
    }
    const b = { ...a, id: "2", restaurantName: "Sushi Palace" }
    localStorageAdapter.addVisit(a)
    localStorageAdapter.addVisit(b)
    localStorageAdapter.deleteVisit("1")
    expect(localStorageAdapter.getVisits()).toEqual([b])
  })

  it("updateVisit replaces a visit by id", () => {
    const original = {
      id: "1",
      restaurantName: "Trattoria Roma",
      date: "2026-03-26",
      mealType: "dinner",
      rating: 4,
      note: null,
      createdAt: "2026-03-26T19:00:00.000Z",
    }
    const updated = { ...original, rating: 5, note: "Even better on reflection" }
    localStorageAdapter.addVisit(original)
    localStorageAdapter.updateVisit(updated)
    expect(localStorageAdapter.getVisits()).toEqual([updated])
  })

  it("persists a visit and returns it", () => {
    const visit = {
      id: "1",
      restaurantName: "Trattoria Roma",
      date: "2026-03-26",
      mealType: "dinner",
      rating: 4,
      note: "Great pasta",
      createdAt: "2026-03-26T19:00:00.000Z",
    }
    localStorageAdapter.addVisit(visit)
    expect(localStorageAdapter.getVisits()).toEqual([visit])
  })
})
