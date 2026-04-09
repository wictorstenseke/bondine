# AI-Driven Visit Creation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers-extended-cc:subagent-driven-development (if subagents available) or superpowers-extended-cc:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users log restaurant visits by chatting with the AI assistant — the LLM extracts fields, asks for anything missing, then shows an inline preview card before saving.

**Architecture:** Use OpenRouter's tool calling API. A `create_visit` tool is defined and passed with every request. The LLM calls it when it has enough info. The stream parser accumulates tool call argument chunks and emits a typed `tool_call` event. `useAssistantChat` catches that event, stores a `pendingVisit` draft, and the chat UI renders an inline `VisitDraftCard` with Confirm/Cancel.

**Tech Stack:** React, TypeScript, Vitest, OpenRouter (OpenAI-compatible tool calling format), existing Bondine storage layer (`useVisits`).

---

## File Map

| File                                    | Action     | Responsibility                                                                 |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `src/lib/ai/tools.ts`                   | **Create** | `create_visit` tool definition                                                 |
| `src/lib/ai/types.ts`                   | **Modify** | Add `StreamChunk` union, extend `StreamRequest` with `tools`                   |
| `src/lib/ai/openrouterClient.ts`        | **Modify** | Pass tools, parse `tool_calls` SSE chunks, yield `StreamChunk`                 |
| `src/lib/ai/openrouterClient.test.ts`   | **Modify** | Update existing tests for new yield type, add tool_call tests                  |
| `src/lib/ai/buildChatContext.ts`        | **Modify** | Add `create_visit` instruction to system prompt                                |
| `src/lib/ai/buildChatContext.test.ts`   | **Modify** | Verify instruction appears in context output                                   |
| `src/hooks/useAssistantChat.ts`         | **Modify** | Handle `StreamChunk` union, `pendingVisit` state, `confirmVisit`/`cancelVisit` |
| `src/hooks/useAssistantChat.test.ts`    | **Modify** | Tests for tool call detection, pendingVisit lifecycle                          |
| `src/components/AssistantChat.tsx`      | **Modify** | Accept `addVisit` prop, render `VisitDraftCard` when draft pending             |
| `src/components/AssistantChat.test.tsx` | **Create** | Tests for `VisitDraftCard` component                                           |
| `src/components/AssistantDrawer.tsx`    | **Modify** | Pass `addVisit` prop to `AssistantChat`                                        |

---

### Task 1: Define `create_visit` tool + extend stream types

**Goal:** Create the tool definition and typed stream chunk union that the rest of the implementation depends on.

**Files:**

- Create: `src/lib/ai/tools.ts`
- Modify: `src/lib/ai/types.ts`

**Acceptance Criteria:**

- [ ] `VISIT_TOOLS` is an array with a single `create_visit` function tool
- [ ] Tool schema has `restaurantName` (required), `date`, `mealType`, `rating`, `note` (all optional)
- [ ] `StreamChunk` is a discriminated union `{ type: 'content'; delta: string } | { type: 'tool_call'; name: string; argsJson: string }`
- [ ] `StreamRequest` has optional `tools` field

**Verify:** `npm run typecheck` → no errors

**Steps:**

- [ ] **Step 1: Create `src/lib/ai/tools.ts`**

```ts
export const VISIT_TOOLS = [
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
```

- [ ] **Step 2: Extend `src/lib/ai/types.ts`**

Add `StreamChunk` and extend `StreamRequest`:

```ts
export type StreamChunk =
  | { type: "content"; delta: string }
  | { type: "tool_call"; name: string; argsJson: string }

export interface StreamRequest {
  apiKey: string
  model: string
  messages: ChatMessage[]
  signal?: AbortSignal
  tools?: unknown[] // add this field
}
```

- [ ] **Step 3: Verify**

```bash
npm run typecheck
```

Expected: no errors.

```bash
git add src/lib/ai/tools.ts src/lib/ai/types.ts
git commit -m "feat: add create_visit tool definition and StreamChunk type"
```

---

### Task 2: Extend `openrouterClient` to parse tool calls

**Goal:** `streamChat` passes tools to OpenRouter and yields `StreamChunk` (content deltas and a final tool_call chunk) instead of raw strings.

**Files:**

- Modify: `src/lib/ai/openrouterClient.ts`
- Modify: `src/lib/ai/openrouterClient.test.ts`

**Acceptance Criteria:**

- [ ] `streamChat` return type is `AsyncGenerator<StreamChunk>`
- [ ] Tools array is included in the request body when provided
- [ ] Content deltas yield `{ type: 'content', delta }` chunks
- [ ] When LLM calls a tool, a single `{ type: 'tool_call', name, argsJson }` chunk is yielded after all argument fragments are accumulated
- [ ] Existing tests pass (updated to use `.delta` accessor)
- [ ] New tests cover tool_call detection and accumulation

**Verify:** `npm test -- openrouterClient` → all tests pass

**Steps:**

- [ ] **Step 1: Write new tests for tool_call behavior**

Note: `streamFromChunks`, `sseFrame`, and `mockFetch` helpers are already defined at the top of `src/lib/ai/openrouterClient.test.ts` — do not redefine them.

Add `import type { StreamChunk } from "./types"` at the top, then add after existing describe block:

```ts
describe("streamChat — tool calls", () => {
  it("yields a tool_call chunk when the LLM calls a function", async () => {
    // OpenRouter streams tool call args in fragments then sends [DONE]
    const body = streamFromChunks([
      sseFrame({
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  function: {
                    name: "create_visit",
                    arguments: '{"restaurantN',
                  },
                },
              ],
            },
          },
        ],
      }),
      sseFrame({
        choices: [
          {
            delta: {
              tool_calls: [
                { index: 0, function: { name: "", arguments: 'ame":"Noma"}' } },
              ],
            },
          },
        ],
      }),
      "data: [DONE]\n\n",
    ])
    vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

    const chunks: StreamChunk[] = []
    for await (const chunk of streamChat({
      apiKey: "k",
      model: "m",
      messages: [],
    })) {
      chunks.push(chunk)
    }
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toEqual({
      type: "tool_call",
      name: "create_visit",
      argsJson: '{"restaurantName":"Noma"}',
    })
  })

  it("yields content chunks when no tool call", async () => {
    const body = streamFromChunks([
      sseFrame({ choices: [{ delta: { content: "Hello" } }] }),
      "data: [DONE]\n\n",
    ])
    vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

    const chunks: StreamChunk[] = []
    for await (const chunk of streamChat({
      apiKey: "k",
      model: "m",
      messages: [],
    })) {
      chunks.push(chunk)
    }
    expect(chunks).toEqual([{ type: "content", delta: "Hello" }])
  })

  it("yields content chunks AND tool_call when LLM replies then calls tool", async () => {
    // Mixed: LLM emits a text reply fragment followed by a tool call
    const body = streamFromChunks([
      sseFrame({ choices: [{ delta: { content: "Saving that for you." } }] }),
      sseFrame({
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  function: {
                    name: "create_visit",
                    arguments: '{"restaurantName":"Noma"}',
                  },
                },
              ],
            },
          },
        ],
      }),
      "data: [DONE]\n\n",
    ])
    vi.stubGlobal("fetch", mockFetch(new Response(body, { status: 200 })))

    const chunks: StreamChunk[] = []
    for await (const chunk of streamChat({
      apiKey: "k",
      model: "m",
      messages: [],
    })) {
      chunks.push(chunk)
    }
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toEqual({
      type: "content",
      delta: "Saving that for you.",
    })
    expect(chunks[1]).toEqual({
      type: "tool_call",
      name: "create_visit",
      argsJson: '{"restaurantName":"Noma"}',
    })
  })
})
```

Also update all existing tests to handle the new `StreamChunk` yield type. Add this helper at the top of the test file, below the existing helpers:

```ts
function contentChunks(chunks: StreamChunk[]): string[] {
  return chunks
    .filter(
      (c): c is { type: "content"; delta: string } => c.type === "content"
    )
    .map((c) => c.delta)
}
```

Then in every existing `it(...)` block that collects `out.push(delta)`:

1. Rename the array: `const out: string[]` → `const chunks: StreamChunk[]`
2. Change the push: `out.push(delta)` → `chunks.push(chunk)` (and update the loop variable from `delta` to `chunk`)
3. Change the assertion: `expect(out).toEqual([...])` → `expect(contentChunks(chunks)).toEqual([...])`

This covers all 5 existing tests: "yields content deltas", "stops cleanly on [DONE]", "throws OpenRouterError", "handles frames split", "ignores malformed frames".

- [ ] **Step 2: Update `openrouterClient.ts`**

Change the signature and stream parsing:

```ts
import type { StreamRequest, StreamChunk } from "./types"

export async function* streamChat(
  req: StreamRequest
): AsyncGenerator<StreamChunk, void, unknown> {
  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.apiKey}`,
      "HTTP-Referer":
        typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "Bondine",
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      stream: true,
      ...(req.tools && req.tools.length > 0 ? { tools: req.tools } : {}),
    }),
    signal: req.signal,
  })

  // ... error handling unchanged ...

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  // Accumulate tool call data across fragments
  let toolCallName = ""
  let toolCallArgs = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let sepIdx: number
      while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sepIdx)
        buffer = buffer.slice(sepIdx + 2)

        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue
          const payload = line.slice(5).trim()
          if (!payload) continue
          if (payload === "[DONE]") {
            // Emit accumulated tool call if any
            if (toolCallName) {
              yield {
                type: "tool_call",
                name: toolCallName,
                argsJson: toolCallArgs,
              }
            }
            return
          }

          try {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{
                delta?: {
                  content?: string
                  tool_calls?: Array<{
                    index?: number
                    function?: { name?: string; arguments?: string }
                  }>
                }
              }>
            }
            const delta = parsed.choices?.[0]?.delta
            if (!delta) continue

            // Content delta
            if (typeof delta.content === "string" && delta.content.length > 0) {
              yield { type: "content", delta: delta.content }
            }

            // Tool call fragment — accumulate name and args
            const tc = delta.tool_calls?.[0]
            if (tc?.function) {
              if (tc.function.name) toolCallName += tc.function.name
              if (tc.function.arguments) toolCallArgs += tc.function.arguments
            }
          } catch {
            // Ignore malformed frames
          }
        }
      }
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // ignore
    }
  }
}
```

- [ ] **Step 3: Run tests and commit**

```bash
npm test -- openrouterClient
```

Expected: all tests pass.

```bash
git add src/lib/ai/openrouterClient.ts src/lib/ai/openrouterClient.test.ts
git commit -m "feat: extend streamChat to yield StreamChunk and handle tool calls"
```

---

### Task 3: Add `create_visit` instruction to system prompt + pass tools

**Goal:** The LLM knows it has a `create_visit` tool and when to use it; tools are passed with every chat request.

**Files:**

- Modify: `src/lib/ai/buildChatContext.ts`
- Modify: `src/lib/ai/buildChatContext.test.ts`

**Acceptance Criteria:**

- [ ] System prompt instructs the LLM to call `create_visit` when user wants to log a visit
- [ ] Default to today's date if not mentioned
- [ ] Only ask for `restaurantName` if missing before calling the tool
- [ ] Test verifies the instruction is present in the built context

**Verify:** `npm test -- buildChatContext` → all tests pass

**Steps:**

- [ ] **Step 1: Add test for the new instruction**

In `src/lib/ai/buildChatContext.test.ts`, add:

```ts
it("includes create_visit tool instruction in system prompt", () => {
  const ctx = buildChatContext([], new Date("2026-04-09T12:00:00"))
  expect(ctx).toContain("create_visit")
})
```

Run — it should fail (red).

- [ ] **Step 2: Add instruction to `buildChatContext.ts`**

In `GROUNDING_RULE`, append a new numbered rule:

```ts
const GROUNDING_RULE = `You are Bondine's assistant. You reason over the user's personal restaurant visit history. Strict rules:

1. Only recommend restaurants that appear in the table below. Never invent places. If the user asks for something and nothing in the table fits, say so plainly instead of making something up.
2. Ratings are on a 0–5 flame scale; higher is better. A blank rating means the user didn't rate that visit.
3. A blank meal column means the user didn't categorize that visit.
4. Use the user's own notes as taste signal — they know what they like.
5. If the user wants to log a visit, extract what you can from their message and call the create_visit tool. If the restaurant name is missing, ask the user for it — do not call the tool until you have it. All other fields are optional. Use today's date if no date is mentioned.`
```

- [ ] **Step 3: Run tests and commit**

```bash
npm test -- buildChatContext
```

Expected: all tests pass.

```bash
git add src/lib/ai/buildChatContext.ts src/lib/ai/buildChatContext.test.ts
git commit -m "feat: add create_visit tool instruction to system prompt"
```

---

### Task 4: Update `useAssistantChat` to manage `pendingVisit`

**Goal:** The hook handles `StreamChunk` union, detects tool calls, stores `pendingVisit`, and exposes `confirmVisit`/`cancelVisit`.

**Files:**

- Modify: `src/hooks/useAssistantChat.ts`
- Modify: `src/hooks/useAssistantChat.test.ts`

**Acceptance Criteria:**

- [ ] `pendingVisit: CreateVisitArgs | null` exposed from the hook
- [ ] When stream yields a `tool_call` chunk with name `create_visit`, `pendingVisit` is set
- [ ] `confirmVisit(addVisit)` calls `addVisit` with the draft data (filling `date` default to today if missing) then clears `pendingVisit`
- [ ] `cancelVisit()` clears `pendingVisit`
- [ ] Sending a new message while a draft is pending clears the draft first
- [ ] Content deltas still accumulate into the assistant message as before
- [ ] All existing tests pass

**Verify:** `npm test -- useAssistantChat` → all tests pass

**Steps:**

- [ ] **Step 1: Write tests for new behavior**

Check the existing `src/hooks/useAssistantChat.test.ts` for the existing test setup (imports of `renderHook`, `act`, `vi` from vitest/react). Add these imports at the top alongside existing ones:

```ts
import type { StreamChunk } from "@/lib/ai/types"
import type { CreateVisitArgs } from "@/lib/ai/tools"
import type { Visit } from "@/lib/storage/types"
```

Add a helper after existing helpers in the file:

```ts
async function* chunkStream(chunks: StreamChunk[]): AsyncIterable<StreamChunk> {
  for (const c of chunks) yield c
}
```

Add this describe block:

```ts
describe("tool call — create_visit", () => {
  const argsJson = JSON.stringify({
    restaurantName: "Noma",
    rating: 4,
  } satisfies Partial<CreateVisitArgs>)

  function makeHook() {
    const stream = vi
      .fn()
      .mockReturnValue(
        chunkStream([{ type: "tool_call", name: "create_visit", argsJson }])
      )
    const { result } = renderHook(() =>
      useAssistantChat({ apiKey: "k", getVisits: () => [], stream })
    )
    return result
  }

  it("sets pendingVisit when stream yields a tool_call chunk", async () => {
    const result = makeHook()
    await act(async () => {
      await result.current.send("I went to Noma last night, 4 flames")
    })
    expect(result.current.pendingVisit).toEqual({
      restaurantName: "Noma",
      rating: 4,
    })
  })

  it("clears pendingVisit on cancelVisit", async () => {
    const result = makeHook()
    await act(async () => {
      await result.current.send("went to Noma")
    })
    await act(async () => {
      result.current.cancelVisit()
    })
    expect(result.current.pendingVisit).toBeNull()
  })

  it("calls addVisit with a full Visit and clears pendingVisit on confirmVisit", async () => {
    const result = makeHook()
    await act(async () => {
      await result.current.send("went to Noma")
    })
    const addVisit = vi.fn()
    await act(async () => {
      result.current.confirmVisit(addVisit)
    })
    expect(addVisit).toHaveBeenCalledOnce()
    const calledWith = addVisit.mock.calls[0][0] as Visit
    expect(calledWith.restaurantName).toBe("Noma")
    expect(calledWith.rating).toBe(4)
    expect(calledWith.id).toBeDefined()
    expect(calledWith.createdAt).toBeDefined()
    expect(result.current.pendingVisit).toBeNull()
  })

  it("clears pendingVisit when user sends a new message", async () => {
    const stream = vi
      .fn()
      .mockReturnValueOnce(
        chunkStream([{ type: "tool_call", name: "create_visit", argsJson }])
      )
      .mockReturnValueOnce(chunkStream([{ type: "content", delta: "ok" }]))
    const { result } = renderHook(() =>
      useAssistantChat({ apiKey: "k", getVisits: () => [], stream })
    )
    await act(async () => {
      await result.current.send("went to Noma")
    })
    expect(result.current.pendingVisit).not.toBeNull()
    await act(async () => {
      await result.current.send("what about tomorrow?")
    })
    expect(result.current.pendingVisit).toBeNull()
  })
})
```

Run tests — they should fail (red).

- [ ] **Step 2: Update `useAssistantChat.ts`**

Add these imports at the top (alongside existing imports):

```ts
import { nanoid } from "nanoid"
import { VISIT_TOOLS, type CreateVisitArgs } from "@/lib/ai/tools"
import type { StreamChunk } from "@/lib/ai/types"
import type { Visit } from "@/lib/storage/types"
```

Key changes to the hook body:

```ts
// Change StreamFn type
type StreamFn = (req: StreamRequest) => AsyncIterable<StreamChunk>

// Add pendingVisit state inside the hook
const [pendingVisit, setPendingVisit] = useState<CreateVisitArgs | null>(null)

// In runTurn, pass VISIT_TOOLS and handle StreamChunk union:
for await (const chunk of streamFn({ ...req, tools: VISIT_TOOLS })) {
  if (chunk.type === "content") {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId ? { ...m, content: m.content + chunk.delta } : m
      )
    )
  } else if (chunk.type === "tool_call" && chunk.name === "create_visit") {
    try {
      const args = JSON.parse(chunk.argsJson) as CreateVisitArgs
      setPendingVisit(args)
    } catch {
      // ignore malformed tool call args
    }
  }
}

// In send(), clear pendingVisit before the user message is sent:
const send = useCallback(async (text: string) => {
  const trimmed = text.trim()
  if (!trimmed || isStreaming) return
  setPendingVisit(null)   // clear any pending draft
  // ... rest of send unchanged ...
}, [...])

// Add confirmVisit — generates id/createdAt and calls addVisit with a full Visit:
const confirmVisit = useCallback(
  (addVisit: (visit: Visit) => void) => {
    if (!pendingVisit) return
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC
    addVisit({
      id: nanoid(),
      restaurantName: pendingVisit.restaurantName,
      date: pendingVisit.date ?? today,
      mealType: pendingVisit.mealType ?? null,
      rating: pendingVisit.rating ?? null,
      note: pendingVisit.note ?? null,
      createdAt: new Date().toISOString(),
    })
    setPendingVisit(null)
  },
  [pendingVisit]
)

const cancelVisit = useCallback(() => {
  setPendingVisit(null)
}, [])

// Full return value (extends existing returns):
return { messages, isStreaming, send, retry, reset, pendingVisit, confirmVisit, cancelVisit }
// Note: messages, isStreaming, send, retry, reset are unchanged from the existing hook.
// pendingVisit, confirmVisit, cancelVisit are new additions.
```

- [ ] **Step 3: Run tests and commit**

```bash
npm test -- useAssistantChat
```

Expected: all tests pass.

```bash
git add src/hooks/useAssistantChat.ts src/hooks/useAssistantChat.test.ts
git commit -m "feat: add pendingVisit state and confirmVisit/cancelVisit to useAssistantChat"
```

---

### Task 5: Render `VisitDraftCard` in `AssistantChat`

**Goal:** When `pendingVisit` is set, the chat renders an inline card showing the draft fields with Confirm and Cancel buttons.

**Files:**

- Modify: `src/components/AssistantChat.tsx`
- Create: `src/components/AssistantChat.test.tsx`
- Modify: `src/components/AssistantDrawer.tsx`

**Acceptance Criteria:**

- [ ] `AssistantChat` accepts an `addVisit` prop
- [ ] When `pendingVisit` is non-null, `VisitDraftCard` renders below the last message
- [ ] `VisitDraftCard` shows: restaurant name, date (formatted), meal type (if set), rating as flame count (if set), note (if set)
- [ ] Confirm button calls `confirmVisit(addVisit)` and closes the card
- [ ] Cancel button calls `cancelVisit()`
- [ ] Card is not visible when `pendingVisit` is null
- [ ] `VisitDraftCard` unit tests pass (render, confirm, cancel, rating flames)
- [ ] `AssistantDrawer` passes `activeAdapter.addVisit` as `addVisit` prop

**Verify:** `npm run typecheck && npm test -- AssistantChat && npm run build` → all pass

**Steps:**

- [ ] **Step 1: Update `AssistantChat` props and wire up the hook**

Add `addVisit` prop to the `Props` interface:

```ts
interface Props {
  apiKey: string
  getVisits: () => Visit[]
  addVisit: (data: Omit<Visit, "id" | "createdAt">) => void
}
```

Destructure `pendingVisit`, `confirmVisit`, `cancelVisit` from `useAssistantChat`:

```ts
const {
  messages,
  isStreaming,
  send,
  retry,
  pendingVisit,
  confirmVisit,
  cancelVisit,
} = useAssistantChat({ apiKey, getVisits })
```

- [ ] **Step 2: Add `VisitDraftCard` local component**

Add below the `AssistantMessage` component at the bottom of the file:

```tsx
interface VisitDraftCardProps {
  draft: CreateVisitArgs
  onConfirm: () => void
  onCancel: () => void
}

function VisitDraftCard({ draft, onConfirm, onCancel }: VisitDraftCardProps) {
  const dateLabel = draft.date
    ? new Date(draft.date + "T00:00:00").toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Today"

  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-sm">
      <p className="font-medium">{draft.restaurantName}</p>
      <p className="text-muted-foreground">{dateLabel}</p>
      {draft.mealType && (
        <p className="text-muted-foreground capitalize">{draft.mealType}</p>
      )}
      {draft.rating != null && (
        <div className="mt-1 flex gap-0.5">
          {Array.from({ length: draft.rating }).map((_, i) => (
            <FlameIcon key={i} className="size-4 text-amber-400" />
          ))}
        </div>
      )}
      {draft.note && (
        <p className="mt-1 text-muted-foreground italic">{draft.note}</p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={onConfirm}>
          Save visit
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Render card in `AssistantChat`**

Inside the `ConversationContent`, after the messages list and shimmer, add:

```tsx
{
  pendingVisit && (
    <VisitDraftCard
      draft={pendingVisit}
      onConfirm={() => confirmVisit(addVisit)}
      onCancel={cancelVisit}
    />
  )
}
```

Also add the import at the top:

```ts
import type { CreateVisitArgs } from "@/lib/ai/tools"
```

- [ ] **Step 4: Update call site in `src/components/AssistantDrawer.tsx`**

`AssistantChat` is rendered on line 96 of `src/components/AssistantDrawer.tsx`:

```tsx
// Before:
return <AssistantChat apiKey={key!} getVisits={getVisits} />

// After — activeAdapter.addVisit takes a full Visit (id + createdAt generated by confirmVisit):
return (
  <AssistantChat
    apiKey={key!}
    getVisits={getVisits}
    addVisit={activeAdapter.addVisit}
  />
)
```

No extra import needed — `activeAdapter` is already imported on line 32 of `AssistantDrawer.tsx`.

- [ ] **Step 5: Export `VisitDraftCard` for testing and write tests**

`VisitDraftCard` must be exported so it can be tested. Change the declaration:

```ts
// Before:
function VisitDraftCard(...

// After:
export function VisitDraftCard(...
```

`AssistantChat.tsx` has no test file. Create `src/components/AssistantChat.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { VisitDraftCard } from "./AssistantChat"

describe("VisitDraftCard", () => {
  it("shows restaurant name, date, and Save/Cancel buttons", () => {
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

  it("renders rating flames when rating is provided", () => {
    const { container } = render(
      <VisitDraftCard
        draft={{ restaurantName: "Noma", rating: 3 }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    // FlameIcon renders SVGs — check that there are 3 of them
    expect(container.querySelectorAll("svg")).toHaveLength(3)
  })
})
```

Run — should fail (red) since `VisitDraftCard` doesn't exist yet.

Note: `FlameIcon` is already imported in `AssistantChat.tsx` (line 24) — no new import needed. `CreateVisitArgs` import needed at top of AssistantChat.tsx:

```ts
import type { CreateVisitArgs } from "@/lib/ai/tools"
```

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck && npm test -- AssistantChat && npm run build
```

Expected: all tests pass, no build errors.

```bash
git add src/components/AssistantChat.tsx src/components/AssistantChat.test.tsx src/components/AssistantDrawer.tsx
git commit -m "feat: render VisitDraftCard in chat when AI proposes a visit"
```

---

## Done

All five tasks produce a working AI-driven visit creation flow. The manual form (`VisitForm` / `AddVisitModal`) is untouched. The tool definition and system prompt instruction are easy to update independently — just edit `tools.ts` and the rule string in `buildChatContext.ts`.
