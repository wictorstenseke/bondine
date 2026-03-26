import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VisitDetail } from "./VisitDetail"
import type { Visit } from "@/lib/storage/types"

const visit: Visit = {
  id: "1",
  restaurantName: "Trattoria Roma",
  date: "2026-03-26",
  mealType: "dinner",
  rating: 4,
  note: "Great pasta",
  createdAt: "2026-03-26T19:00:00.000Z",
}

describe("VisitDetail", () => {
  it("shows restaurant name, date, meal type, and note", () => {
    render(<VisitDetail visit={visit} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText("Trattoria Roma")).toBeInTheDocument()
    expect(screen.getByText("2026-03-26")).toBeInTheDocument()
    expect(screen.getByText("dinner")).toBeInTheDocument()
    expect(screen.getByText("Great pasta")).toBeInTheDocument()
  })

  it("shows edit form pre-filled when edit button is clicked", async () => {
    render(<VisitDetail visit={visit} onUpdate={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: /edit/i }))
    expect(screen.getByDisplayValue("Trattoria Roma")).toBeInTheDocument()
  })

  it("calls onUpdate with updated data when edit form is saved", async () => {
    const onUpdate = vi.fn()
    render(<VisitDetail visit={visit} onUpdate={onUpdate} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: /edit/i }))
    const input = screen.getByLabelText(/restaurant/i)
    await userEvent.clear(input)
    await userEvent.type(input, "Roma Nuova")
    await userEvent.click(screen.getByRole("button", { name: /save/i }))
    expect(onUpdate).toHaveBeenCalledOnce()
    expect(onUpdate.mock.calls[0][0].restaurantName).toBe("Roma Nuova")
    expect(onUpdate.mock.calls[0][0].id).toBe("1")
  })

  it("calls onDelete when delete is confirmed", async () => {
    const onDelete = vi.fn()
    render(<VisitDetail visit={visit} onUpdate={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole("button", { name: /delete/i }))
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }))
    expect(onDelete).toHaveBeenCalledWith("1")
  })

  it("does not call onDelete when delete is cancelled", async () => {
    const onDelete = vi.fn()
    render(<VisitDetail visit={visit} onUpdate={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole("button", { name: /delete/i }))
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onDelete).not.toHaveBeenCalled()
  })
})
