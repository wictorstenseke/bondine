import { describe, it, expect } from "vitest"
import { deriveRestaurants } from "./deriveRestaurants"
import type { Visit } from "./storage/types"

const visits: Visit[] = [
  {
    id: "1",
    restaurantName: "Trattoria Roma",
    date: "2026-03-26",
    mealType: null,
    rating: 4,
    note: null,
    createdAt: "2026-03-26T19:00:00.000Z",
  },
  {
    id: "2",
    restaurantName: "Trattoria Roma",
    date: "2026-03-20",
    mealType: null,
    rating: 2,
    note: null,
    createdAt: "2026-03-20T12:00:00.000Z",
  },
  {
    id: "3",
    restaurantName: "Sushi Palace",
    date: "2026-03-25",
    mealType: null,
    rating: null,
    note: null,
    createdAt: "2026-03-25T12:00:00.000Z",
  },
]

describe("deriveRestaurants", () => {
  it("groups visits by restaurant name", () => {
    const result = deriveRestaurants(visits)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.name)).toContain("Trattoria Roma")
    expect(result.map((r) => r.name)).toContain("Sushi Palace")
  })

  it("counts visits per restaurant", () => {
    const result = deriveRestaurants(visits)
    const roma = result.find((r) => r.name === "Trattoria Roma")!
    expect(roma.visitCount).toBe(2)
  })

  it("computes average rating from rated visits only", () => {
    const result = deriveRestaurants(visits)
    const roma = result.find((r) => r.name === "Trattoria Roma")!
    expect(roma.avgRating).toBe(3)
  })

  it("sets avgRating to null when no visits have a rating", () => {
    const result = deriveRestaurants(visits)
    const sushi = result.find((r) => r.name === "Sushi Palace")!
    expect(sushi.avgRating).toBeNull()
  })

  it("tracks the most recent visit date", () => {
    const result = deriveRestaurants(visits)
    const roma = result.find((r) => r.name === "Trattoria Roma")!
    expect(roma.lastVisited).toBe("2026-03-26")
  })

  it("sorts by most recent by default", () => {
    const result = deriveRestaurants(visits, "recent")
    expect(result[0].name).toBe("Trattoria Roma")
    expect(result[1].name).toBe("Sushi Palace")
  })

  it("sorts by most visited", () => {
    const result = deriveRestaurants(visits, "visits")
    expect(result[0].name).toBe("Trattoria Roma")
  })

  it("sorts by highest rated", () => {
    const result = deriveRestaurants(visits, "rating")
    expect(result[0].name).toBe("Trattoria Roma")
  })
})
