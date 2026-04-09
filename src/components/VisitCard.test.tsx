import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { VisitCard } from "./VisitCard"
import type { Visit } from "@/lib/storage/types"

const base: Visit = {
  id: "1",
  restaurantName: "Trattoria Roma",
  date: "2026-03-26",
  mealType: null,
  rating: null,
  note: null,
  createdAt: "2026-03-26T19:00:00.000Z",
}

describe("VisitCard", () => {
  it("renders restaurant name and date", () => {
    render(<VisitCard visit={base} onClick={() => {}} />)
    expect(screen.getByText("Trattoria Roma")).toBeInTheDocument()
    expect(screen.getByText("2026-03-26")).toBeInTheDocument()
  })

  it("shows meal type when set", () => {
    render(
      <VisitCard visit={{ ...base, mealType: "dinner" }} onClick={() => {}} />
    )
    expect(screen.getByText("Dinner")).toBeInTheDocument()
  })

  it("hides meal type when null", () => {
    render(<VisitCard visit={base} onClick={() => {}} />)
    expect(screen.queryByTestId("meal-type")).not.toBeInTheDocument()
  })

  it("shows note when set", () => {
    render(
      <VisitCard visit={{ ...base, note: "Great pasta" }} onClick={() => {}} />
    )
    expect(screen.getByText("Great pasta")).toBeInTheDocument()
  })

  it("shows rating when set", () => {
    render(<VisitCard visit={{ ...base, rating: 3 }} onClick={() => {}} />)
    expect(screen.getByTestId("rating")).toBeInTheDocument()
  })

  it("hides rating when null", () => {
    render(<VisitCard visit={base} onClick={() => {}} />)
    expect(screen.queryByTestId("rating")).not.toBeInTheDocument()
  })
})
