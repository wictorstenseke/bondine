import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FilterBar } from "./FilterBar"

describe("FilterBar", () => {
  it("always shows an All pill", () => {
    render(<FilterBar mealTypes={[]} active={null} onChange={vi.fn()} />)
    expect(screen.getByRole("radio", { name: /all/i })).toBeInTheDocument()
  })

  it("renders a pill for each meal type", () => {
    render(
      <FilterBar
        mealTypes={["lunch", "dinner"]}
        active={null}
        onChange={vi.fn()}
      />,
    )
    expect(screen.getByRole("radio", { name: /lunch/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /dinner/i })).toBeInTheDocument()
  })

  it("calls onChange with the meal type when a pill is clicked", async () => {
    const onChange = vi.fn()
    render(
      <FilterBar mealTypes={["lunch"]} active={null} onChange={onChange} />,
    )
    await userEvent.click(screen.getByRole("radio", { name: /lunch/i }))
    expect(onChange).toHaveBeenCalledWith("lunch")
  })

  it("calls onChange with null when All is clicked", async () => {
    const onChange = vi.fn()
    render(<FilterBar mealTypes={["lunch"]} active="lunch" onChange={onChange} />)
    await userEvent.click(screen.getByRole("radio", { name: /all/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
