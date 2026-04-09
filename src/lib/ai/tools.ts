import type { OpenRouterTool } from "./types"

export const VISIT_TOOLS: OpenRouterTool[] = [
  {
    type: "function" as const,
    function: {
      name: "create_visit",
      description:
        "Log a restaurant visit the user mentions. Call this when you have enough information to record a visit. Only restaurantName is required.",
      parameters: {
        type: "object",
        properties: {
          restaurantName: {
            type: "string",
            description: "Name of the restaurant",
          },
          date: {
            type: "string",
            description:
              "Visit date in YYYY-MM-DD format. Default to today if not mentioned.",
          },
          mealType: {
            type: "string",
            description: "Meal type e.g. lunch, dinner, breakfast",
          },
          rating: {
            type: "number",
            description: "Rating from 1 to 5",
          },
          note: {
            type: "string",
            description: "Any notes the user mentioned about the visit",
          },
        },
        required: ["restaurantName"],
      },
    },
  },
]

export type CreateVisitArgs = {
  restaurantName: string
  date?: string
  mealType?: string
  rating?: number
  note?: string
}
