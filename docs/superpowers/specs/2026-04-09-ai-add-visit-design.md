# AI-Driven Visit Creation — Design Spec

**Date:** 2026-04-09  
**Status:** Approved

## Summary

Allow users to add restaurant visits through the existing AI assistant chat. The LLM extracts visit details from natural language, asks only for missing required info, then shows an inline preview card before saving.

## Data Flow

1. User sends a message in `AssistantChat` (e.g. "had dinner at Noma last night, 4 flames")
2. `useAssistantChat` sends the request to OpenRouter with a `create_visit` tool defined
3. LLM either replies conversationally to ask for missing info, or calls `create_visit` with extracted fields
4. Hook detects the tool call, stores the draft in `pendingVisit` state
5. `AssistantChat` renders an inline `VisitDraftCard` showing filled fields + Confirm / Cancel buttons
6. Confirm → `addVisit()` → draft cleared. Cancel → draft cleared, conversation continues.
7. If user sends another message while a draft is pending, the draft is cleared and the conversation continues normally.

## Tool Definition

Defined in `src/lib/ai/tools.ts` (new file), exported and passed into `useAssistantChat`:

```ts
{
  name: "create_visit",
  description: "Log a restaurant visit the user mentions",
  parameters: {
    restaurantName: string,   // required
    date: string,             // YYYY-MM-DD, optional — default today
    mealType: string,         // optional
    rating: number,           // 1–5, optional
    note: string              // optional
  }
}
```

Easy to extend — just a JS object and a string prompt addition.

## Component & Hook Changes

### `src/lib/ai/tools.ts` (new)

Exports the `create_visit` tool definition.

### `src/lib/ai/buildChatContext.ts`

- Import and include the tool definition
- Append a rule to `GROUNDING_RULE`: if user wants to log a visit, extract what you can and call `create_visit`. Ask for restaurant name if missing. Date defaults to today.

### `src/lib/ai/openrouterClient.ts`

- Extend `StreamRequest` with optional `tools` array
- Pass tools to OpenRouter API call
- Handle `tool_calls` chunk type in the stream parser, accumulate JSON arguments as they arrive

### `src/hooks/useAssistantChat.ts`

- After each streamed response, detect `create_visit` tool call
- Store parsed draft in new `pendingVisit: Partial<VisitFormData> | null` state
- Expose `pendingVisit`, `confirmVisit(addVisit: fn)`, `cancelVisit()` from the hook

### `src/components/AssistantChat.tsx`

- Accept `addVisit` prop
- When `pendingVisit` is set, render inline `VisitDraftCard` below the last message
- `VisitDraftCard` is a local component in the same file (not worth its own file)
- Confirm calls `confirmVisit(addVisit)`, Cancel calls `cancelVisit()`

## What Stays the Same

- Manual `VisitForm` / `AddVisitModal` remain unchanged — this is an additive alternative path
- Existing assistant conversation behavior unchanged when no visit intent is detected
- Storage layer (`useVisits`, `localStorageAdapter`) untouched

## Out of Scope

- Editing an existing visit via chat
- Multi-visit parsing in a single message
- Persisting conversation history across sessions
