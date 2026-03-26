import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Feed } from "./Feed"
import { AddVisitProvider } from "@/context/AddVisitContext"
import type { StorageAdapter, Visit } from "@/lib/storage/types"

function makeAdapter(visits: Visit[]): StorageAdapter {
  return {
    getVisits: vi.fn(() => visits),
    addVisit: vi.fn(),
    updateVisit: vi.fn(),
    deleteVisit: vi.fn(),
  }
}

const visit1: Visit = {
  id: "1",
  restaurantName: "Trattoria Roma",
  date: "2026-03-26",
  mealType: null,
  rating: null,
  note: null,
  createdAt: "2026-03-26T19:00:00.000Z",
}

const visit2: Visit = {
  id: "2",
  restaurantName: "Sushi Palace",
  date: "2026-03-25",
  mealType: null,
  rating: null,
  note: null,
  createdAt: "2026-03-25T12:00:00.000Z",
}

function renderFeed(adapter: StorageAdapter) {
  return render(
    <AddVisitProvider>
      <Feed adapter={adapter} />
    </AddVisitProvider>,
  )
}

describe("Feed", () => {
  it("renders a card for each visit", () => {
    renderFeed(makeAdapter([visit1, visit2]))
    expect(screen.getByText("Trattoria Roma")).toBeInTheDocument()
    expect(screen.getByText("Sushi Palace")).toBeInTheDocument()
  })

  it("shows empty state when there are no visits", () => {
    renderFeed(makeAdapter([]))
    expect(screen.getByText(/no visits yet/i)).toBeInTheDocument()
  })
})
