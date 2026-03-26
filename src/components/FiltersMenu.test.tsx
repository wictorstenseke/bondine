import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FiltersMenu } from "./FiltersMenu"

async function openMenu(mode: "feed" | "restaurants" = "feed") {
  const name = mode === "feed" ? /filter visits/i : /filter and sort/i
  await userEvent.click(screen.getByRole("button", { name }))
}

describe("FiltersMenu", () => {
  it("shows filter summary on the trigger", () => {
    render(
      <FiltersMenu
        mealTypes={[]}
        activeFilter={null}
        onFilterChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: /filter visits/i })).toHaveTextContent(
      "All meals",
    )
  })

  it("includes sort summary when sort props are passed", () => {
    render(
      <FiltersMenu
        mealTypes={[]}
        activeFilter={null}
        onFilterChange={vi.fn()}
        sort="visits"
        onSortChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("button", { name: /filter and sort/i })).toHaveTextContent(
      "Most visited",
    )
  })

  it("opens menu with Filter options and calls onFilterChange", async () => {
    const onFilterChange = vi.fn()
    render(
      <FiltersMenu
        mealTypes={["lunch"]}
        activeFilter={null}
        onFilterChange={onFilterChange}
      />,
    )
    await openMenu("feed")
    expect(screen.getByRole("menuitemradio", { name: /^All$/i })).toBeInTheDocument()
    expect(screen.getByRole("menuitemradio", { name: /^lunch$/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("menuitemradio", { name: /^lunch$/i }))
    expect(onFilterChange).toHaveBeenCalledWith("lunch")
  })

  it("calls onFilterChange with null when All is chosen", async () => {
    const onFilterChange = vi.fn()
    render(
      <FiltersMenu
        mealTypes={["lunch"]}
        activeFilter="lunch"
        onFilterChange={onFilterChange}
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /filter visits/i }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: /^All$/i }))
    expect(onFilterChange).toHaveBeenCalledWith(null)
  })

  it("shows Sort section when sort props are passed", async () => {
    render(
      <FiltersMenu
        mealTypes={[]}
        activeFilter={null}
        onFilterChange={vi.fn()}
        sort="recent"
        onSortChange={vi.fn()}
      />,
    )
    await openMenu("restaurants")
    expect(screen.getByText("Sort")).toBeInTheDocument()
    expect(
      screen.getByRole("menuitemradio", { name: /most visited/i }),
    ).toBeInTheDocument()
  })
})
