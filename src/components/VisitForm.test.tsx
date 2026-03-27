import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VisitForm } from "./VisitForm"
import type { Visit } from "@/lib/storage/types"

afterEach(() => {
  vi.useRealTimers()
})

describe("VisitForm", () => {
  it("calls onSubmit with restaurant name and date when submitted", async () => {
    const onSubmit = vi.fn<[Omit<Visit, "id" | "createdAt">], void>()
    render(<VisitForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText(/restaurant/i), "Trattoria Roma")
    await userEvent.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0][0].restaurantName).toBe("Trattoria Roma")
  })

  it("does not submit when restaurant name is empty", async () => {
    const onSubmit = vi.fn()
    render(<VisitForm onSubmit={onSubmit} />)

    await userEvent.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("shows autocomplete suggestions when restaurantSuggestions are provided", async () => {
    const onSubmit = vi.fn()
    render(
      <VisitForm
        onSubmit={onSubmit}
        restaurantSuggestions={["Trattoria Roma", "Sushi Palace"]}
      />
    )
    await userEvent.type(screen.getByLabelText(/restaurant/i), "Trat")
    expect(screen.getByText("Trattoria Roma")).toBeInTheDocument()
  })

  it("fills the restaurant name when a suggestion is selected", async () => {
    const onSubmit = vi.fn()
    render(
      <VisitForm
        onSubmit={onSubmit}
        restaurantSuggestions={["Trattoria Roma"]}
      />
    )
    await userEvent.type(screen.getByLabelText(/restaurant/i), "Trat")
    await userEvent.click(screen.getByText("Trattoria Roma"))
    expect(screen.getByLabelText(/restaurant/i)).toHaveValue("Trattoria Roma")
  })

  it("defaults the date to today", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-26"))

    const onSubmit = vi.fn()
    render(<VisitForm onSubmit={onSubmit} />)

    expect(
      screen.getByRole("button", { name: /march 26, 2026/i })
    ).toBeInTheDocument()
  })
})
