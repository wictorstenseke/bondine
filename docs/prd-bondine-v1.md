# PRD: Bondine v1

## Problem Statement

People who enjoy dining out have no simple, personal way to track the restaurants they've visited, how they rated the experience, and what type of meal it was. Generic note-taking apps lack structure, and full-featured restaurant apps like Yelp are public and review-focused rather than personal and journal-like. There is no lightweight tool that feels like a personal feed of dining memories — fast to log, easy to browse, and owned entirely by the user.

## Solution

Bondine is a personal restaurant visit tracking web app. It presents a Strava-inspired feed of logged visits, allows quick entry of a new visit through a form in a responsive drawer/dialog, and provides a restaurant list view with aggregate stats. The app runs entirely in the browser using localStorage in v1, with a storage adapter pattern that makes it trivial to swap to a cloud backend (Firebase) later.

## User Stories

1. As a user, I want to open the app and immediately see my most recent restaurant visits in a feed, so that I can get a quick overview of where I've been lately.
2. As a user, I want to add a new visit via a button in the header, so that I can log a meal without leaving the feed.
3. As a user, I want the "Add visit" form to appear as a drawer on mobile and a dialog on desktop, so that the experience feels native on any device.
4. As a user, I want to type a restaurant name and see autocomplete suggestions from my previous visits, so that I can quickly log a return visit without retyping.
5. As a user, I want the date field to default to today, so that I don't have to manually select it for same-day logging.
6. As a user, I want to select a meal type using quick-select pills (Lunch, Dinner), so that I can categorize a visit in one tap.
7. As a user, I want to type a custom meal type (e.g. Breakfast, Catered, Café) if the preset options don't fit, so that I'm not constrained by a fixed list.
8. As a user, I want to leave the meal type blank if it's not relevant, so that I'm not forced to categorize every visit.
9. As a user, I want to rate a visit using a flame picker from 0 to 5, so that I can express how much I enjoyed the meal in a way that feels on-brand.
10. As a user, I want to leave the rating blank if I don't want to rate a visit, so that rating is always optional.
11. As a user, I want to add a free-text note to a visit, so that I can capture specific memories, dishes, or context.
12. As a user, I want the note field to be optional, so that I can log quick visits without writing anything.
13. As a user, I want to see all my visits in a chronological feed, newest first, so that my most recent dining is always at the top.
14. As a user, I want each visit card to show the restaurant name, date, meal type (if set), flame rating (if set), and note, so that I can scan the feed at a glance.
15. As a user, I want to filter the feed by meal type using dynamically generated pills, so that I can see only Lunch visits, only Dinner visits, or any custom type I've logged.
16. As a user, I want an "All" pill that clears the meal type filter, so that I can always get back to the full feed.
17. As a user, I want to tap a visit card to open its full detail in a drawer/dialog, so that I can read the full note and access edit/delete actions.
18. As a user, I want to edit a visit from its detail view, so that I can correct mistakes or update my rating after reflection.
19. As a user, I want the edit form to be pre-filled with the visit's existing data, so that I only have to change what needs changing.
20. As a user, I want to delete a visit from its detail view, so that I can remove entries I no longer want.
21. As a user, I want a confirmation dialog before a visit is deleted, so that I don't accidentally lose data.
22. As a user, I want to navigate to a restaurant list view, so that I can see every restaurant I've visited in one place.
23. As a user, I want each restaurant row to show the name, number of visits, average flame rating, and last visited date, so that I can quickly assess my history with each place.
24. As a user, I want to sort the restaurant list by most visited, highest rated, or most recent, so that I can find restaurants in the order most useful to me.
25. As a user, I want to tap a restaurant row to open its detail in a drawer/dialog, so that I can see all my visits to that place in one view.
26. As a user, I want the restaurant detail to show aggregate stats (total visits, average flames) and a list of all visits to that restaurant, so that I get a complete picture of my history there.
27. As a user, I want to add a new visit directly from the restaurant detail view, so that I can log a return visit while already looking at that restaurant.
28. As a user, I want the "Add visit" form to pre-fill the restaurant name when triggered from a restaurant's detail view, so that I don't have to type it again.
29. As a user, I want a collapsible sidebar for navigation, so that I can move between the Feed and Restaurant list on any screen size.
30. As a user, I want the sidebar to collapse behind a menu button on mobile, so that it doesn't take up screen space on small devices.
31. As a user, I want to see the app name "Bondine" in the sidebar, so that the navigation feels branded.
32. As a user, I want a theme toggle in the sidebar, so that I can switch between dark and light mode.
33. As a user, I want the app to default to dark mode, so that it feels intentional and polished from first load.
34. As a user, I want to see a meaningful empty state when I have no visits yet, so that the app guides me toward adding my first entry.
35. As a user, I want to see a meaningful empty state in the restaurant list when no visits exist, so that the list never feels broken.
36. As a user, I want my visits to persist across page refreshes, so that I don't lose my data.
37. As a user, I want the app to feel fast and responsive on mobile, so that I can log a visit right after a meal without friction.

## Implementation Decisions

### Storage Adapter Pattern

- A `StorageAdapter` interface defines four methods: `getVisits()`, `addVisit()`, `updateVisit()`, `deleteVisit()`
- `localStorageAdapter` implements this interface using the browser's localStorage
- An `index.ts` file exports the active adapter — swapping this file is the only change needed to move to Firebase
- All data access in the app goes through a `useVisits()` custom hook that wraps the active adapter

### Visit Data Model

- `id`: nanoid-generated string
- `restaurantName`: string (required)
- `date`: ISO date string, e.g. `"2026-03-26"` (required)
- `mealType`: string | null — free text, null when unspecified
- `rating`: number | null — integer 0–5, null when unrated
- `note`: string | null — free text, null when empty
- `createdAt`: ISO timestamp string — used for internal sorting

### Restaurant Entity

- There is no separate Restaurant data model
- Restaurant data (name, visit count, average rating, last visited date) is derived by grouping and aggregating visits at read time
- This keeps the storage model simple and avoids sync complexity

### Routing

- React Router v7
- Two routes: `/` (Feed) and `/restaurants` (Restaurant list)
- No dedicated detail routes — all detail views (visit detail, restaurant detail) open in a responsive drawer/dialog

### Responsive Drawer/Dialog Pattern

- A shared `ResponsiveModal` component renders a `Drawer` (vaul, shadcn) on mobile and a `Dialog` (shadcn) on desktop
- Breakpoint detection via a `useMediaQuery` hook
- Used consistently for: Add visit form, Edit visit form, Visit detail, Restaurant detail

### Add Visit Form

- Restaurant name: combobox with autocomplete from existing `restaurantName` values in visits
- Date: date picker defaulting to today's date
- Meal type: quick-select pills (Lunch, Dinner) + "Other..." option that reveals a text input; stored as string | null
- Rating: custom flame picker, 0–5 clickable flames, clearable (null = unrated); fire icon to be finalized post-v1
- Note: textarea, optional
- Context-aware: pre-fills `restaurantName` when triggered from a restaurant detail view

### Feed

- Sorted by `date` descending, then `createdAt` descending as tiebreaker
- Filter pills derived dynamically from all distinct `mealType` values present in visits
- "All" pill always first, clears the filter
- Meal type chip on card hidden when `mealType` is null
- Flame rating on card hidden when `rating` is null

### Restaurant List

- Derived from visits by grouping on `restaurantName`
- Each row shows: name, visit count, average flame rating, last visited date
- Sort options: Most visited / Highest rated / Most recent
- Default sort: Most recent

### Sidebar Navigation

- Contains: app name ("Bondine"), Feed link, Restaurants link, theme toggle at bottom
- Collapsible on mobile via a menu button in the header
- Theme toggle switches between dark (default) and light mode

### Edit and Delete

- Edit re-opens the Add visit form pre-filled with existing visit data, calls `updateVisit()`
- Delete triggers shadcn `AlertDialog` for confirmation before calling `deleteVisit()`
- Both actions accessible from the visit detail drawer

### ID Generation

- Use `nanoid` for generating visit IDs (already present in the project's dependency tree)

### shadcn Components to Use

- `Dialog`, `Drawer` — responsive modal pattern
- `AlertDialog` — delete confirmation
- `Command` / `Combobox` — restaurant name autocomplete
- `Popover` + `Calendar` — date picker
- `Tabs` or pills (custom) — meal type selector and filter bar
- `Textarea`, `Input`, `Button`, `Select` — form primitives
- Empty state block — for empty feed and restaurant list

## Testing Decisions

- Good tests verify external behavior and outcomes, not implementation details or internal state
- Tests should be written against the `StorageAdapter` interface, not the localStorage implementation directly — this ensures the interface contract is solid before swapping adapters
- The `useVisits()` hook should be tested with a mock adapter to verify that UI-facing behavior (add, update, delete, filter, sort) works correctly without touching localStorage
- The visit aggregation logic (grouping visits into restaurant summaries) is a pure function and should be unit tested in isolation
- The flame picker component should be tested for: selecting a value, clearing a value, rendering the correct filled/empty state

## Out of Scope

- Firebase / cloud sync (v2)
- User authentication or accounts
- Social features, sharing, or public profiles
- Push notifications or reminders
- Photo attachments to visits
- Map or location integration
- Offline PWA support
- Import/export of visit data
- Multiple users or household sharing
- Search across visits
- Visit statistics dashboard or charts
- Sort controls on the feed (feed is always newest first)

## Further Notes

- The app name "Bondine" is a product of the parent brand "Bonfire" — the flame/fire metaphor should be carried through the design (fire picker, amber accent color)
- The fire icon for the rating picker is a placeholder in v1 — the exact icon asset will be finalized and swapped in post-launch
- The storage adapter pattern is the key architectural decision that makes this app evolvable — it should be treated as a first-class concern, not an afterthought
- Dark mode is the designed-for default; light mode is a toggle option but the design language (amber on dark) is optimized for dark
