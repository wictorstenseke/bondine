export interface Visit {
  id: string
  restaurantName: string
  date: string
  mealType: string | null
  rating: number | null
  note: string | null
  createdAt: string
}

export interface StorageAdapter {
  getVisits(): Visit[]
  addVisit(visit: Visit): void
  updateVisit(visit: Visit): void
  deleteVisit(id: string): void
}
