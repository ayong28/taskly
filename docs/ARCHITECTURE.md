# Architecture

A single-user Trello-style project manager. Next.js App Router (server components + server actions) talking directly to a local SQLite file via Drizzle ORM — no API layer, no client-side data-fetching library, no auth.

See [`CONTEXT.md`](../CONTEXT.md) for the domain glossary (Board/List/Card/Label/Archive), [`project-manager-plan.md`](../project-manager-plan.md) for the feature spec and build order, and [`design-system.md`](design-system.md) for the visual design tokens (colors, typography, gradients/glows) applied across every component.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, design tokens in `app/globals.css` (see [`design-system.md`](design-system.md)) |
| Fonts | Orbitron (headings), Rajdhani (body), JetBrains Mono — loaded via `next/font/google` in `app/layout.tsx` |
| UI primitives | `@base-ui/react` (dialogs, dropdown menus), `lucide-react` icons |
| Database | SQLite via `better-sqlite3` |
| ORM / migrations | Drizzle ORM + `drizzle-kit` |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Data mutations | Next.js Server Actions (`"use server"`) — no REST/GraphQL API routes |
| Testing | Jest + Testing Library (component/unit), Playwright (E2E) |

## Request flow

There is no client-side data store (no Redux/Zustand/React Query). The pattern throughout is:

1. A page under `app/` is an **async server component**. It queries Drizzle directly (`lib/db.ts`) and passes plain data down as props.
2. Interactive pieces are **client components** (`"use client"`) that hold local UI state (e.g. `BoardCanvas` holds the in-memory `cardsByList` map for optimistic drag-and-drop).
3. Mutations go through **server actions** in `lib/actions/*.ts` — plain async functions marked `"use server"`, called directly from client components (no fetch/JSON layer). Each action calls `revalidatePath(...)` so the next server render picks up the change, and callers typically also call `router.refresh()` after awaiting the action to force that re-render immediately.

```
app/board/[id]/page.tsx (server, queries via Drizzle)
        │ props
        ▼
components/Board/BoardCanvas.tsx (client, holds DnD state)
        │ calls
        ▼
lib/actions/*.ts ("use server", mutates via Drizzle, revalidatePath)
```

There's no separate DTO/serialization layer — Drizzle row types flow straight from query to component props to action arguments.

## Data model

Defined in `lib/schema.ts`, migrations generated with `npm run db:generate` into `drizzle/` and applied automatically by `migrate()` in `lib/db.ts` the next time any process (dev server, Playwright) opens the DB — no manual migration step.

```
boards (id, title, color, archived, created_at)
lists  (id, board_id, title, position, special)
cards  (id, list_id, title, description, due_date, priority, position, archived, original_list_id)
labels (id, name, color)
card_labels (card_id, label_id)   -- join table, labels are global (not board-scoped)
```

Notes:
- `position` is a `real` (float), not an integer index — reordering/inserting only ever needs to average two neighboring positions, never renumber the whole list.
- `lists.special` marks a list as one of the two auto-created, protected lists ("Archived", "Restored") — see below. `ListHeader` hides the options menu and disables rename for these.
- `cards.originalListId` is a plain integer, **deliberately not a foreign key** — it must survive the referenced list being deleted, so restore logic can detect "that list is gone" by simply failing to find it, rather than the column being nulled out by an FK cascade.
- `boards.archived` / `cards.archived` are booleans; card-level archiving also *physically moves* the card (see below), so the flag and the list membership are kept in sync by the same action.

## The archive/restore model

This is the most non-obvious part of the system, evolved through a few iterations — worth reading before touching anything archive-related.

- **Boards**: two-step. An active board's options menu offers only "Archive Board"; only once archived does the menu switch to "Delete Board" (hard delete, cascades via FK to its lists/cards). `archiveBoard` also bulk-flags all the board's cards `archived = true` **in place** — it does not move them, since the board itself becomes inaccessible from the sidebar anyway.
- **Cards**: archiving a card **moves it** into a per-board "Archived" list (auto-created on first use via `getOrCreateSpecialList` in `lib/actions/lists.ts`), recording `originalListId` so it can find its way back. `CardModal`'s footer is gated on the card's `archived` state: active → "Archive" only; archived (sitting in the Archived list) → "Restore" and "Delete" (permanent) side by side. (Title/description/due-date edits go through the separate `updateCard` action — archiving/restoring don't touch those fields.)
- **Deleting a list** archives all its cards into the Archived list first, then deletes the (now-empty) list — it no longer hard-deletes cards via cascade.
- **Restoring a card** returns it to `originalListId` if that list still exists on the board; otherwise it goes into a single per-board "Restored" list (same `getOrCreateSpecialList` helper, uniqueness enforced by looking up an existing `special` list with that title before creating one).
- Because the Archived/Restored lists are just ordinary rows in the `lists` table, `BoardCanvas` needs no special-casing to render their cards — a card's current `listId` alone determines where it shows up.

## Card creation and editing

`AddCardButton` opens `components/List/NewCardModal.tsx` (title, description, due date — calls `createCard`) rather than the single-line inline input it used to. Editing an existing card (`components/CardModal/index.tsx`, opened from `CardTile`) shares the same three fields and saves them together via `updateCard` — there's no separate rename action anymore. Both modals are otherwise independent components (no shared form component yet); keep their field sets in sync by hand if either changes.

## Drag and drop

`@dnd-kit` `DndContext` wraps the whole board in `BoardCanvas`. Each list is a `SortableContext`; an empty list gets its own `useDroppable` zone (`ListDropZone`) so a card can still be dropped into it. Card moves are optimistic: `handleDragEnd` updates local `cardsByList` state immediately, then fires the `moveCard` server action in the background. `computePosition` picks a new `position` by averaging the two neighboring cards' positions rather than renumbering.

## Testing

- **Jest + Testing Library** for component/logic unit tests. Server actions and `next/navigation` are mocked; dnd-kit is mocked entirely (jsdom can't produce real pointer/layout events) — see `components/Board/BoardCanvas.test.tsx` for the established mocking pattern.
- **Playwright** (`e2e/`) for real end-to-end flows against a dedicated `data/test.db`, wiped automatically before each run by `e2e/global-setup.ts`. `playwright.config.ts` runs its own dev server on port 3001 with `workers: 1` (the test DB doesn't tolerate concurrent writers).
- No unit tests exist for `lib/actions/*` directly — that logic is exercised through Playwright instead, since it's thin wrappers around Drizzle queries.

## What's deliberately not here

- No authentication — single user, by design.
- No API routes — server actions are the only mutation path.
- No client-side data-fetching/caching library — server components + `revalidatePath` + `router.refresh()` covers it.
- No overdue-badge UI for due dates yet (the *field* is settable — see above — but nothing renders an overdue indicator) and no priority UI at all, despite `cards.priority` existing in the schema — don't assume a schema field has a corresponding UI affordance without checking `project-manager-plan.md`'s current status.
- No theme toggle — the design system (see [`design-system.md`](design-system.md)) is dark-only by the brand brief's own rules, not a placeholder for a future light mode.
