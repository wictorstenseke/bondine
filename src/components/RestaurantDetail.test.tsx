import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RestaurantDetail } from "./RestaurantDetail"
import { AddVisitProvider } from "@/context/AddVisitContext"
import type { Visit } from "@/lib/storage/types"

const visits: Visit[] = [
  {
    id: "1",
    restaurantName: "Trattoria Roma",
    date: "2026-03-26",
    mealType: "dinner",
    rating: 4,
    note: "Great pasta",
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
]

function renderDetail(onAddVisit = vi.fn()) {
  return render(
    <AddVisitProvider>
      <RestaurantDetail
        name="Trattoria Roma"
        visits={visits}
        onAddVisit={onAddVisit}
      />
    </AddVisitProvider>,
  )
}

describe("RestaurantDetail", () => {
  it("shows restaurant name and visit count", () => {
    renderDetail()
    expect(screen.getByRole("heading", { name: "Trattoria Roma" })).toBeInTheDocument()
    expect(screen.getByText(/2 visits/i)).toBeInTheDocument()
  })

  it("shows average rating when visits have ratings", () => {
    renderDetail()
    expect(screen.getByText(/avg 3\.0/i)).toBeInTheDocument()
  })

  it("renders a card for each visit", () => {
    renderDetail()
    expect(screen.getByText("Great pasta")).toBeInTheDocument()
    expect(screen.getByText("2026-03-20")).toBeInTheDocument()
  })

  it("calls onAddVisit with the restaurant name pre-filled when Add visit is clicked", async () => {
    const onAddVisit = vi.fn()
    renderDetail(onAddVisit)
    await userEvent.click(screen.getByRole("button", { name: /add visit/i }))
    expect(onAddVisit).toHaveBeenCalledWith("Trattoria Roma")
  })
})
