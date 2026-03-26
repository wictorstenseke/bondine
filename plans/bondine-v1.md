# Plan: Bondine v1

> Source PRD: docs/prd-bondine-v1.md

## Architectural decisions

- **Routes**: `/` (Feed), `/restaurants` (Restaurant list) — all detail views open in responsive drawer/dialog, no additional routes
- **Schema**: `Visit { id: string, restaurantName: string, date: string, mealType: string | null, rating: number | null, note: string | null, createdAt: string }`
- **Key models**: `Visit` (single entity — restaurants are derived by grouping visits, no separate model)
- **Storage**: `StorageAdapter` interface → `localStorageAdapter` → exported from `index.ts` (swap this file to change backends)
- **Data hook**: `useVisits()` wraps the active adapter — all UI data access goes through this hook
- **Responsive modal**: single `ResponsiveModal` component renders `Drawer` on mobile, `Dialog` on desktop via `useMediaQuery`
- **ID generation**: nanoid
- **Router**: React Router v7
- **Theme**: ThemeProvider already exists in codebase with dark/light/system support

---

## Phase 1: Foundation — storage layer + routing skeleton

**User stories**: 36

### What to build

Wire up the complete data layer and app shell before any real UI exists. Define the `StorageAdapter` interface and implement it with localStorage. Build the `useVisits()` hook that wraps the active adapter. Set up React Router v7 with two routes (`/` and `/restaurants`) and a basic layout shell that includes a header with a placeholder "Add visit" button. No visit UI yet — but every layer is connected end-to-end.

### Acceptance criteria

- [ ] `StorageAdapter` interface defines `getVisits()`, `addVisit()`, `updateVisit()`, `deleteVisit()`
- [ ] `localStorageAdapter` correctly persists visits to localStorage and retrieves them across page refreshes
- [ ] `useVisits()` hook exposes visits, addVisit, updateVisit, deleteVisit and reflects adapter state
- [ ] React Router v7 renders two distinct routes: `/` and `/restaurants`
- [ ] Basic app shell renders with a header on both routes
- [ ] Adding a visit via `useVisits()` in dev tools / test persists correctly to localStorage

---

## Phase 2: Add visit form + basic feed

**User stories**: 1, 3, 4 (plain input only), 5, 6, 7, 8, 9 (placeholder), 10, 11, 12, 13, 14, 34, 37

### What to build

The first fully demoable slice. Implement the "Add visit" responsive drawer/dialog triggered from the header button. The form includes all five fields: restaurant name (plain text input for now), date picker defaulting to today, meal type quick-select pills (Lunch, Dinner) + "Other..." text input, flame picker (placeholder — numeric or star, fire icon TBD), and note textarea. On submit, the visit is saved via `useVisits()` and appears immediately in the feed on `/`. The feed renders visit cards (name, date, meal type if set, flames if set, note) newest first. An empty state is shown when no visits exist.

### Acceptance criteria

- [ ] "Add visit" button in header opens a drawer on mobile and a dialog on desktop
- [ ] All five form fields are present and functional
- [ ] Date field defaults to today's date
- [ ] Meal type pills show Lunch and Dinner; "Other..." reveals a free-text input
- [ ] Flame picker accepts 0–5 and can be left unset (null)
- [ ] Submitting the form saves the visit and closes the modal
- [ ] Feed on `/` shows all visits newest first
- [ ] Visit card shows name, date, meal type (hidden when null), flames (hidden when null), note
- [ ] Empty state is shown when no visits exist
- [ ] Visits persist across page refresh

---

## Phase 3: Feed filter bar

**User stories**: 15, 16

### What to build

Add a sticky filter strip below the header on the feed. Derive the list of available meal type pills dynamically from the `mealType` values present in the user's visits. "All" is always the first pill and clears the filter. Selecting a pill filters the feed to show only visits with that meal type.

### Acceptance criteria

- [ ] Filter strip appears below the header on `/`
- [ ] "All" pill is always present and selected by default
- [ ] Pills are generated from distinct `mealType` values in the current visit data
- [ ] Selecting a pill filters the feed to matching visits only
- [ ] "All" clears the filter and shows the full feed
- [ ] No pills shown other than "All" when all visits have null meal type

---

## Phase 4: Visit detail, edit, and delete

**User stories**: 17, 18, 19, 20, 21

### What to build

Make visit cards tappable. Tapping a card opens a responsive drawer/dialog showing the visit's full detail. The detail view includes an edit button (re-opens the add form pre-filled with existing data, saves via `updateVisit()`) and a delete button (triggers a confirmation dialog before calling `deleteVisit()`). After edit or delete the modal closes and the feed updates.

### Acceptance criteria

- [ ] Tapping a visit card opens a detail drawer/dialog
- [ ] Detail view shows all visit fields
- [ ] Edit button opens the form pre-filled with existing visit data
- [ ] Saving the edit updates the visit in the feed
- [ ] Delete button shows a confirmation dialog
- [ ] Confirming delete removes the visit from the feed
- [ ] Cancelling delete leaves the visit unchanged

---

## Phase 5: Restaurant name autocomplete

**User stories**: 4

### What to build

Upgrade the restaurant name field in the add/edit form from a plain text input to a combobox. As the user types, show matching restaurant names from their existing visits. The user can select a suggestion or continue typing to enter a new name freely.

### Acceptance criteria

- [ ] Restaurant name field shows suggestions from existing visit data as the user types
- [ ] Selecting a suggestion populates the field
- [ ] Typing a name not in suggestions still works (free entry)
- [ ] Autocomplete works in both the add and edit form
- [ ] No suggestions shown when no visits exist yet

---

## Phase 6: Restaurant list

**User stories**: 22, 23, 24, 35

### What to build

Build the `/restaurants` route. Derive a list of restaurants by grouping visits on `restaurantName`. Each row shows: name, visit count, average flame rating, last visited date. Add sort controls (Most visited / Highest rated / Most recent) as pills or a dropdown. Default sort is Most recent. Show an empty state when no visits exist.

### Acceptance criteria

- [ ] `/restaurants` route renders a list of restaurants derived from visit data
- [ ] Each row shows name, visit count, average flame rating, last visited date
- [ ] Average flame rating is hidden when no visits for that restaurant have a rating
- [ ] Sort options: Most visited, Highest rated, Most recent
- [ ] Default sort is Most recent
- [ ] Sorting updates the list immediately
- [ ] Empty state shown when no visits exist

---

## Phase 7: Restaurant detail + context-aware add

**User stories**: 25, 26, 27, 28

### What to build

Make restaurant rows tappable. Tapping a row opens a responsive drawer/dialog showing that restaurant's detail: aggregate stats (total visits, average flames) and a list of all visits to that restaurant using the same card style as the feed. Include an "Add visit" button that opens the add form with the restaurant name pre-filled.

### Acceptance criteria

- [ ] Tapping a restaurant row opens a detail drawer/dialog
- [ ] Detail shows total visit count and average flame rating for that restaurant
- [ ] Detail lists all visits to that restaurant, newest first, using feed card style
- [ ] "Add visit" button in detail view opens the form with restaurant name pre-filled
- [ ] Submitting the pre-filled form saves correctly and the detail view reflects the new visit

---

## Phase 8: Sidebar + theme toggle

**User stories**: 29, 30, 31, 32, 33

### What to build

Replace the minimal layout shell with a full sidebar navigation. The sidebar contains the "Bondine" app name at the top, Feed and Restaurants nav links, and a theme toggle at the bottom. On desktop the sidebar is always visible. On mobile it is hidden behind a menu button in the header that toggles it open. Wire the theme toggle to the existing `ThemeProvider` (already in codebase). Default theme is dark.

### Acceptance criteria

- [ ] Sidebar renders with "Bondine" name, Feed link, Restaurants link, theme toggle
- [ ] Active route is visually indicated in the sidebar
- [ ] On desktop the sidebar is always visible
- [ ] On mobile a menu button in the header opens/closes the sidebar
- [ ] Theme toggle switches between dark and light mode
- [ ] App defaults to dark theme on first load
- [ ] Theme preference persists across page refresh (ThemeProvider already handles this)
