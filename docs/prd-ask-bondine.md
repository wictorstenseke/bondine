# PRD: Ask Bondine — AI Assistant for Personal Restaurant Recall

## Problem Statement

I have a growing personal log of restaurant visits in Bondine, but when I'm hungry and trying to decide where to eat, scrolling the feed or browsing the restaurant list is slow and shallow. I can't ask my own history questions like "where should I go for lunch today?" or "what's the best place I've been to this month?" My data is right there but I have no way to reason over it conversationally. A generic chatbot can't help me because it doesn't know my visits, and a search box won't help because my questions are fuzzy and taste-driven, not keyword-driven.

## Solution

Ask Bondine is an AI chat assistant built into the app as a responsive drawer. It reads my entire logged visit history and answers questions about it in a conversational, multi-turn way — "what's a good lunch spot?", "something lighter?", "not sushi though." The assistant reasons only over restaurants I've actually been to; it never invents places. It speaks in vivid, food-obsessed, slightly theatrical language so the experience feels like chatting with a hungry friend rather than querying a database. It runs client-side against OpenRouter using a key the user provides themselves, preserving Bondine's local-first, no-backend ethos.

## User Stories

1. As a user, I want to open an AI chat from the header of the app, so that I can ask questions about my visits without leaving whatever page I'm on.
2. As a user, I want to open the chat via `Cmd/Ctrl+K` from a command palette, so that I can reach it with a keystroke from anywhere.
3. As a user, I want the command palette to also contain "Add visit," so that `Cmd+K → Enter` still adds a visit the way it does today.
4. As a user, I want the chat to open in a drawer on mobile and a dialog on desktop, so that it feels native on any device.
5. As a user, I want the chat to onboard me by asking for my OpenRouter API key on first use, so that I understand what I need to do to enable it.
6. As a user, I want a link to `openrouter.ai/keys` in the onboarding state, so that I can get a key without leaving the app.
7. As a user, I want a one-line privacy disclosure next to the key input, so that I understand my visit data is sent to OpenRouter on each question.
8. As a user, I want my OpenRouter key persisted in localStorage, so that I don't have to paste it every session.
9. As a user, I want a settings panel inside the chat drawer (gear icon) where I can view, replace, or remove my key, so that I can manage it without digging into browser devtools.
10. As a user, I want the assistant to reason over my entire visit history, so that it can give recommendations grounded in places I've actually been.
11. As a user, I want the assistant to never invent restaurants, so that I can trust every recommendation is real and personally known to me.
12. As a user, I want the assistant to know today's date, time, and day-of-week, so that questions like "what's good for tonight" or "somewhere I haven't been in a while" make sense.
13. As a user, I want to have a multi-turn conversation, so that I can ask follow-ups like "something cheaper" or "not sushi" without restating context.
14. As a user, I want the conversation to reset when I close the drawer, so that each session starts fresh and I never accidentally resume a stale thread.
15. As a user, I want the assistant's responses to stream token-by-token, so that the answer feels instant even on slower connections.
16. As a user, I want a clear error bubble inside the chat when something fails (bad key, no credits, rate limit, network), so that I know what happened and what to do.
17. As a user, I want a retry button on failed responses, so that I don't have to retype my question.
18. As a user, I want a partial streamed answer to stay visible if streaming is interrupted, so that I don't lose what I already read.
19. As a user, I want a helpful pre-flight message if I have zero visits logged, so that I understand why I can't ask questions yet.
20. As a user, I want the assistant to speak in vivid, food-obsessed, slightly humorous language, so that the feature feels distinctive and fun rather than generic.
21. As a user, I want the assistant to be concise by default, so that I get to the recommendation fast without scrolling through paragraphs.
22. As a user, I want the chat to ignore any active meal-type filter on the Feed, so that the assistant always sees my full history regardless of UI state.
23. As a user, I want the chat drawer to have an input field at the bottom and messages above, so that the UX matches every chat interface I already know.
24. As a user, I want the "send" control to also work on `Enter`, so that typing flows naturally.
25. As a user, I want `Shift+Enter` to add a newline in the input, so that I can write multi-line questions if I want.
26. As a user, I want a visible indicator while the assistant is thinking/streaming, so that I know the app is working.

## Implementation Decisions

### Scope

- Feature name: **Ask Bondine**
- Closed-world personal recall only: the assistant reasons over the user's logged visits. It does not recommend places the user has never been to, and it does not integrate with any map, search, or location API.

### Data Strategy

- The full visit list is serialized and sent in the system prompt on every turn.
- Format: a compact markdown table with columns `date | restaurant | meal | rating | note`, sorted newest-first.
- No RAG, no vector store, no tool calling. The dump approach is correct up to low thousands of visits and is trivial to revisit if that threshold is ever crossed.

### Grounding and Persona

The system prompt is composed from three static parts plus the visit dump:

1. **Grounding rule:** only recommend restaurants from the provided table; never invent places; if nothing fits, say so.
2. **Temporal context:** inject current date, time, and day-of-week on every turn.
3. **Persona:** "food-obsessed friend" voice — vivid, sensory, slightly theatrical, dry humor, concise. Use restaurant-world vocabulary (blistered, unctuous, umami, mise en place). One great sentence beats three mediocre ones.

### API Integration

- **Provider:** OpenRouter (`https://openrouter.ai/api/v1/chat/completions`).
- **Auth model:** BYOK. The user pastes their own API key into the chat drawer's settings panel. The key is stored in `localStorage` under a single well-known key. It never touches any server the product controls.
- **Streaming:** SSE streaming is used for all chat requests. Token deltas are appended to the current assistant message as they arrive.
- **Default model:** deferred — will be chosen after initial testing against a real key. The client is model-agnostic; the model ID is a string passed in the request body and can be swapped without structural changes.
- **No backend proxy.** All requests go directly from the browser to OpenRouter.

### Conversation Model

- **Multi-turn, session-only.** The message list lives in React state inside the drawer. Closing the drawer unmounts the state and wipes history. There is no persistence of chat history and no "clear" button (close-and-reopen is the reset mechanism).
- **Full visit dump re-sent every turn.** The dump is part of the system message; it is not counted against conversation history trimming.

### UI Surface

- The chat lives in the existing `ResponsiveModal` pattern (Drawer on mobile, Dialog on desktop) to match every other focus surface in the app.
- The drawer contains three states driven by `(hasKey, visitCount, error)`:
  1. **Onboarding** — no key set: shows key input, save button, link to `openrouter.ai/keys`, disclosure line.
  2. **Empty history** — key set but zero visits: shows "Log a visit first — I can only recommend from places you've been."
  3. **Chat** — key set and at least one visit: messages area, input, settings gear, working indicator.
- **Error surfacing:** all API errors appear as inline bubbles in the conversation with plain-language copy and a Retry button. Mapping:
  - `401` → "Your OpenRouter key looks invalid. Open settings to update it."
  - `402` → "Your OpenRouter account is out of credits."
  - `429` → "Rate limited — try again in a moment."
  - `404` / bad model → "That model isn't available. Check your settings."
  - network / unknown → "Something went wrong. Retry?"
- **Partial responses** are preserved on stream interruption; the error bubble is appended below the partial, not replacing it.

### Command Palette

- `Cmd/Ctrl+K` now opens a shadcn `CommandDialog` palette instead of jumping directly into the Add Visit drawer.
- The palette contains two items on day one:
  1. **Add visit** — default-highlighted first item, preserving existing `Cmd+K → Enter` muscle memory.
  2. **Ask Bondine** — opens the chat drawer.
- Typing filters the list via the normal shadcn command behavior.
- Future items (jump to Restaurants, toggle theme, etc.) are deliberately out of scope for this PRD but the palette is the natural home.

### Header Entry Point

- A new icon button in the header, placed near "Add visit," opens the chat drawer directly.
- On mobile the icon button remains visible alongside the existing header controls.

### State and Context

- A new React context provider exposes `{ open, setOpen }` for the chat drawer, analogous to the existing `AddVisitContext`.
- The command palette is a sibling concept with its own open/close state, shared via context or lifted into the existing provider — either is acceptable as long as `Cmd+K` routes through the palette, not directly to the drawer.

### Key Management Hook

- A single hook owns all OpenRouter-key concerns: reading from localStorage, writing, clearing, and exposing "is a key set" as a derived boolean. The chat drawer, settings panel, and any future surfaces consume this hook.

### Major Modules (Sketch)

Designed so business logic lives in small, pure, testable modules and the UI components stay thin.

- **OpenRouter streaming client** — a deep module. Pure function / class that takes `{ apiKey, model, messages, signal }` and returns an async iterable of token deltas. Knows nothing about Bondine, visits, or UI. Mockable via `fetch` stubs.
- **Chat context builder** — a pure function that takes `(visits, now)` and returns the system prompt string (grounding rule + temporal context + persona + visit markdown table). Trivially unit-testable.
- **Error mapper** — a pure function that takes an HTTP status or thrown error and returns `{ message, retryable }`. Keeps UI components free of status-code logic.
- **Assistant chat hook** — orchestrates the conversation: holds the `messages` array in state, composes each request via the context builder, streams via the OpenRouter client, appends deltas, routes errors through the error mapper, exposes `send`, `retry`, `isStreaming`.
- **OpenRouter key hook** — reads/writes the API key in localStorage; exposes `{ key, setKey, clearKey, hasKey }`.
- **Assistant drawer component** — thin UI over the assistant chat hook. Renders onboarding, empty-history, or chat state. Contains settings gear that mounts the settings panel.
- **Assistant settings panel component** — key input, save, remove, disclosure text.
- **Command palette component** — shadcn `CommandDialog` with "Add visit" and "Ask Bondine" items, wired to the respective drawers' open setters. Replaces the raw `Cmd+K` listener currently in `AddVisitContext`.
- **Header integration** — a new icon button and its wiring to the assistant drawer's open state.

Existing modules that will be touched but not structurally changed: `Header`, `AddVisitContext` (or replaced by a combined UI context), the top-level `App` providers.

## Testing Decisions

Good tests here verify **external behavior** — what goes over the wire, what the user sees, how the assistant hook responds to simulated API events — not private state or implementation details. Prior art: `deriveRestaurants.test.ts` (pure function testing), `localStorageAdapter.test.ts` (interface-level testing), `useVisits.test.ts` (hook testing with a mock adapter), `VisitCard.test.tsx` / `VisitForm.test.tsx` (React Testing Library behavior tests).

Modules with meaningful test value:

1. **Chat context builder (pure function)** — unit tests:
   - Includes the grounding rule, temporal context, and persona sections.
   - Serializes visits as a markdown table with the correct columns and newest-first ordering.
   - Handles empty notes, null meal types, null ratings correctly.
   - Injects a deterministic current date/time when one is passed in.

2. **Error mapper (pure function)** — unit tests:
   - Each HTTP status maps to the expected human message and retryable flag.
   - Unknown statuses fall through to a generic retryable error.
   - Network errors (`TypeError: Failed to fetch`) map to the network message.

3. **OpenRouter streaming client** — unit tests with a mocked `fetch`:
   - Parses SSE deltas correctly and yields each content chunk in order.
   - Closes the stream cleanly on `[DONE]`.
   - Propagates non-2xx responses as errors before streaming begins.
   - Honors `AbortSignal` to cancel in-flight requests.

4. **Assistant chat hook** — tests with a mocked client:
   - `send` appends a user message and then an assistant message that grows as deltas arrive.
   - `retry` re-sends the last user message and replaces the last errored assistant message.
   - Error from the client surfaces through `state.error` and does not corrupt the message list.
   - A new `send` after an error clears the error.

5. **OpenRouter key hook** — tests:
   - `setKey` writes to localStorage and flips `hasKey` to true.
   - `clearKey` removes from localStorage and flips `hasKey` to false.
   - Reads the existing value on mount.

Tests that are **not** worth writing:

- Tests that assert specific prompt strings verbatim — brittle and low-value; assert presence of key sections instead.
- Snapshot tests of the drawer UI — low signal, high churn.
- Tests that hit the real OpenRouter API — out of scope; the client is mockable and that's the right layer.

## Out of Scope

- Tool calling / function calling. The model cannot query visits programmatically; the full dump is the mechanism.
- RAG / embeddings / vector search. Deferred indefinitely; re-evaluate only if a user crosses low thousands of visits.
- Persisted chat history across sessions. Session-only by design.
- Multi-chat / named conversations. There is one ephemeral chat per drawer open.
- A dedicated Settings page in the sidebar. The key lives inside the drawer's settings panel only. A real Settings page is a future concern when there are 2+ user-level settings to group.
- Server-side proxy for the OpenRouter key. BYOK is the chosen model; a proxy would violate Bondine's local-first architecture.
- Recommendations for new restaurants the user has never visited. The assistant is explicitly closed-world.
- Location / map / distance reasoning. The model has no sense of where the user is.
- Photo / menu / ingredient parsing from visits. Nothing beyond the existing visit schema is fed to the model.
- Model picker UI. The default model is chosen at build time; user-facing model selection is a future concern.
- Token / cost metering UI. BYOK shifts billing to OpenRouter; users can see their usage in OpenRouter's own dashboard.
- Analytics, telemetry, or usage tracking of prompts and completions.
- Voice input / output.
- Internationalization of the assistant persona.

## Further Notes

- **Local-first posture is preserved.** The only new network dependency is OpenRouter, and it is only engaged when the user explicitly pastes their own key. Users who don't opt in never send a byte off-device beyond what Bondine already does (zero).
- **Persona is the product.** The grounding rule protects correctness; the food-obsessed voice is what makes this feature feel like _Bondine's_ assistant rather than a generic chat wrapper. Tuning the persona prompt with concrete example words (blistered, unctuous, etc.) is more effective than abstract instructions like "be fun."
- **Dump-then-reason is the right simplicity bet.** For a personal journal with at most thousands of entries across years, the full-context approach is cheaper in engineering time than any retrieval scheme and produces better answers because the model can reason across the whole history at once.
- **The existing `Cmd+K` shortcut is being reframed**, not removed. Power users who have `Cmd+K → Enter` muscle memory for "add visit" will still get exactly that as long as "Add visit" remains the first item in the palette.
- **Model choice is deliberately deferred.** The architecture is model-agnostic and the decision is cheap to revisit once a real key exists and a few candidate models can be compared side by side on real visit data.
- **The fire / amber brand motif from the parent Bondine design language should carry into the assistant UI** — the working indicator, the send button, and the persona copy are all opportunities to reinforce the flame theme.
