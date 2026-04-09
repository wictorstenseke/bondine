import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { VisitDraftCard } from "./AssistantChat"

describe("VisitDraftCard", () => {
  it("shows restaurant name and Save/Cancel buttons", () => {
    render(
      <VisitDraftCard
        draft={{ restaurantName: "Noma", date: "2026-04-09", rating: 3 }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText("Noma")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /save visit/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
  })

  it("calls onConfirm when Save visit is clicked", async () => {
    const onConfirm = vi.fn()
    render(
      <VisitDraftCard
        draft={{ restaurantName: "Noma" }}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: /save visit/i }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("calls onCancel when Cancel is clicked", async () => {
    const onCancel = vi.fn()
    render(
      <VisitDraftCard
        draft={{ restaurantName: "Noma" }}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it("shows meal type when provided", () => {
    render(
      <VisitDraftCard
        draft={{ restaurantName: "Noma", mealType: "dinner" }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText("dinner")).toBeInTheDocument()
  })

  it("shows note when provided", () => {
    render(
      <VisitDraftCard
        draft={{ restaurantName: "Noma", note: "amazing tasting menu" }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText("amazing tasting menu")).toBeInTheDocument()
  })
})
