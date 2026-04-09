import { describe, it, expect } from "vitest"
import { buildChatContext, buildVisitsTable } from "./buildChatContext"
import type { Visit } from "@/lib/storage/types"

function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: "v1",
    restaurantName: "Trattoria Roma",
    date: "2026-03-26",
    mealType: "dinner",
    rating: 4,
    note: "great negroni",
    createdAt: "2026-03-26T19:00:00.000Z",
    ...overrides,
  }
}

describe("buildVisitsTable", () => {
  it("renders columns in the expected order", () => {
    const table = buildVisitsTable([makeVisit()])
    expect(table).toContain("| date | restaurant | meal | rating | note |")
  })

  it("sorts rows newest first by date, then createdAt as tiebreaker", () => {
    const older = makeVisit({
      id: "a",
      restaurantName: "Old",
      date: "2026-03-01",
      createdAt: "2026-03-01T12:00:00.000Z",
    })
    const newerSameDay = makeVisit({
      id: "b",
      restaurantName: "SameDayLate",
      date: "2026-03-26",
      createdAt: "2026-03-26T21:00:00.000Z",
    })
    const newerSameDayEarly = makeVisit({
      id: "c",
      restaurantName: "SameDayEarly",
      date: "2026-03-26",
      createdAt: "2026-03-26T09:00:00.000Z",
    })
    const table = buildVisitsTable([older, newerSameDayEarly, newerSameDay])
    const lines = table.split("\n")
    // Lines 0 and 1 are header and separator.
    expect(lines[2]).toContain("SameDayLate")
    expect(lines[3]).toContain("SameDayEarly")
    expect(lines[4]).toContain("Old")
  })

  it("renders null rating, null mealType, and null note as empty cells", () => {
    const visit = makeVisit({
      mealType: null,
      rating: null,
      note: null,
    })
    const table = buildVisitsTable([visit])
    // Empty cells have padded spaces. The row should not contain the strings
    // "null" or "undefined".
    const row = table.split("\n")[2]
    expect(row).not.toContain("null")
    expect(row).not.toContain("undefined")
    expect(row).toContain("Trattoria Roma")
  })

  it("escapes pipes in field values so rows cannot break the table", () => {
    const visit = makeVisit({
      restaurantName: "Bar | Central",
      note: "had ramen | noodles",
    })
    const table = buildVisitsTable([visit])
    const row = table.split("\n")[2]
    expect(row).toContain("Bar \\| Central")
    expect(row).toContain("had ramen \\| noodles")
  })

  it("collapses newlines in notes to spaces", () => {
    const visit = makeVisit({ note: "line one\nline two" })
    const table = buildVisitsTable([visit])
    const row = table.split("\n")[2]
    expect(row).toContain("line one line two")
  })

  it("produces an empty table with header when given no visits", () => {
    const table = buildVisitsTable([])
    const lines = table.split("\n")
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain("date")
  })
})

describe("buildChatContext", () => {
  const fixedNow = new Date("2026-04-08T12:30:00Z")

  it("includes the grounding rule", () => {
    const out = buildChatContext([makeVisit()], fixedNow)
    expect(out).toContain("Only recommend restaurants that appear in the table")
    expect(out).toContain("Never invent places")
  })

  it("includes the persona section with example vocabulary", () => {
    const out = buildChatContext([makeVisit()], fixedNow)
    expect(out).toContain("food-obsessed friend")
    expect(out).toMatch(/blistered|unctuous|umami/)
  })

  it("includes the temporal line with date and day of week", () => {
    const out = buildChatContext([makeVisit()], fixedNow)
    expect(out).toContain("2026-04-08")
    // April 8, 2026 is a Wednesday.
    expect(out).toContain("Wednesday")
  })

  it("includes the full visits table at the end", () => {
    const out = buildChatContext([makeVisit()], fixedNow)
    expect(out).toContain("| date | restaurant | meal | rating | note |")
    expect(out).toContain("Trattoria Roma")
  })

  it("orders sections: grounding, temporal, persona, table", () => {
    const out = buildChatContext([makeVisit()], fixedNow)
    const groundingIdx = out.indexOf("Only recommend")
    const temporalIdx = out.indexOf("Current date and time")
    const personaIdx = out.indexOf("food-obsessed friend")
    const tableIdx = out.indexOf("| date | restaurant")
    expect(groundingIdx).toBeLessThan(temporalIdx)
    expect(temporalIdx).toBeLessThan(personaIdx)
    expect(personaIdx).toBeLessThan(tableIdx)
  })
})
