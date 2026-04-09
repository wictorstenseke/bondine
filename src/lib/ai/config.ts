// Default model for Ask Bondine. Gemini Flash — fast and cheap, good at
// reasoning over structured personal data. Users may override later via a
// settings picker; today this is a single source of truth.
export const DEFAULT_MODEL = "google/gemini-2.5-flash"

export const OPENROUTER_ENDPOINT =
  "https://openrouter.ai/api/v1/chat/completions"

export const OPENROUTER_KEY_STORAGE_KEY = "bondine_openrouter_key"
