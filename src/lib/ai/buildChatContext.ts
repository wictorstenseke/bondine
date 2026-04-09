import type { Visit } from "@/lib/storage/types"

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

function formatTemporalLine(now: Date): string {
  const date = now.toISOString().slice(0, 10)
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const day = DAYS[now.getDay()]
  return `Current date and time: ${date} ${hours}:${minutes} local time (${day}).`
}

function escapeCell(value: string): string {
  // Replace pipes and newlines so a single row can't break the markdown table.
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ")
}

function formatVisitRow(v: Visit): string {
  const date = escapeCell(v.date)
  const name = escapeCell(v.restaurantName)
  const meal = v.mealType ? escapeCell(v.mealType) : ""
  const rating = v.rating !== null ? String(v.rating) : ""
  const note = v.note ? escapeCell(v.note) : ""
  return `| ${date} | ${name} | ${meal} | ${rating} | ${note} |`
}

export function buildVisitsTable(visits: Visit[]): string {
  const sorted = [...visits].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })
  const header = "| date | restaurant | meal | rating | note |"
  const sep = "|------|------------|------|--------|------|"
  return [header, sep, ...sorted.map(formatVisitRow)].join("\n")
}

const GROUNDING_RULE = `You are Bondine's assistant. You reason over the user's personal restaurant visit history. Strict rules:

1. Only recommend restaurants that appear in the table below. Never invent places. If the user asks for something and nothing in the table fits, say so plainly instead of making something up.
2. Ratings are on a 0–5 flame scale; higher is better. A blank rating means the user didn't rate that visit.
3. A blank meal column means the user didn't categorize that visit.
4. Use the user's own notes as taste signal — they know what they like.`

const PERSONA = `Voice and style:

- Speak like a food-obsessed friend: vivid, sensory, a little theatrical. Favor restaurant-world vocabulary where it fits — "blistered," "unctuous," "umami," "mise en place," "al dente," "caramelized."
- Keep a dry, light humorous touch. Never cheesy. Never corporate.
- Be concise. One great sentence beats three mediocre ones. Don't list every option when one is clearly the answer.
- When recommending, quickly justify the pick by referencing the user's own history — their ratings, their notes, or the date they last went.`

export function buildChatContext(visits: Visit[], now: Date): string {
  const temporal = formatTemporalLine(now)
  const table = buildVisitsTable(visits)
  return `${GROUNDING_RULE}

${temporal}

${PERSONA}

The user's visit history (newest first):

${table}`
}
