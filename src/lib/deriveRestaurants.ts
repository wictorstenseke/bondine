import type { Visit } from "./storage/types"

export type SortOrder = "recent" | "visits" | "rating" | "alpha"

export interface RestaurantSummary {
  name: string
  visitCount: number
  avgRating: number | null
  lastVisited: string
}

export function deriveRestaurants(
  visits: Visit[],
  sort: SortOrder = "recent"
): RestaurantSummary[] {
  const map = new Map<string, { dates: string[]; ratings: number[] }>()

  for (const v of visits) {
    if (!map.has(v.restaurantName)) {
      map.set(v.restaurantName, { dates: [], ratings: [] })
    }
    const entry = map.get(v.restaurantName)!
    entry.dates.push(v.date)
    if (v.rating !== null) entry.ratings.push(v.rating)
  }

  const summaries: RestaurantSummary[] = []
  for (const [name, { dates, ratings }] of map) {
    summaries.push({
      name,
      visitCount: dates.length,
      avgRating:
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null,
      lastVisited: dates.slice().sort().reverse()[0],
    })
  }

  return summaries.sort((a, b) => {
    if (sort === "recent") return b.lastVisited.localeCompare(a.lastVisited)
    if (sort === "visits") return b.visitCount - a.visitCount
    if (sort === "rating") {
      const ra = a.avgRating ?? -1
      const rb = b.avgRating ?? -1
      return rb - ra
    }
    if (sort === "alpha") return a.name.localeCompare(b.name)
    return 0
  })
}
