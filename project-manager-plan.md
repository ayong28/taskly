# Project Manager App — Plan

## Overview
A lightweight single-user Trello clone for project management, built full-stack with Next.js and SQLite. No authentication required.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite via `better-sqlite3` |
| ORM | Drizzle ORM |
| Drag & Drop | `@dnd-kit/core` |
| Client State | Zustand |
| Data Mutations | Next.js Server Actions |
| E2E Testing | Playwright |

## Feature Set

| Feature | Decision |
|---|---|
| Users | Single user, no auth |
| Boards | Per-project, colour-coded (preset palette), archivable |
| Lists | Freeform columns, default template (To Do / In Progress / Done) |
| Cards | Tasks with Title, Description, Due Date, Labels, Priority |
| Labels | Global, colour-coded, reused across all boards |
| Archive | Soft-delete for boards and cards, restorable |
| Navigation | Persistent sidebar + main area, opens to last active board |
| Drag & Drop | Cards within list, cards between lists, lists within board |
| Cross-board move | Via "Move to Board" action in card detail |
| Filter | Within board: by Label and/or Priority |
| Due dates | Red badge on overdue cards, no notifications |
| Backgrounds | Solid colour, preset palette (8–12 colours) |
| Export/Backup | None — user manages SQLite file directly |

## Data Model (SQLite)

```sql
boards (id, title, color, archived, created_at)
lists  (id, board_id, title, position)
cards  (id, list_id, title, description, due_date, priority, position, archived)
labels (id, name, color)
card_labels (card_id, label_id)
```

**Notes:**
- `boards.color` — one of a preset palette (e.g. `slate`, `red`, `blue`...)
- `cards.priority` — enum: `high | medium | low`
- `cards.archived` / `boards.archived` — soft-delete flag; hard delete also supported
- `labels` is global (not scoped to a board); linked to cards via `card_labels` join table

## Project Structure

```
/app
  /board/[id]       ← Board view with lists and cards
  /                 ← Redirects to last active board
/lib
  /db.ts            ← Drizzle + SQLite setup
  /schema.ts        ← Drizzle schema
/components
  /Board            ← Board layout + filter bar
  /List             ← List column + card stack
  /Card             ← Card tile (draggable)
  /CardModal        ← Card detail modal
  /Sidebar          ← Board navigation
  /DragLayer        ← dnd-kit drag overlay
```

## Build Order

1. ✅ DB schema + Drizzle setup
2. ✅ App layout — sidebar + main area
3. Create / rename / delete boards and lists
4. Board view with static lists and cards
5. Create / edit / delete cards (card detail modal)
6. Drag-and-drop (cards within list, between lists, list reorder)
7. ✅ Labels — global management + assign to cards
8. ✅ Filter bar (by label — priority filter deferred, no UI exists yet to set a card's priority)
9. ✅ Archive (boards and cards) — two-step: archive first (default, restorable), hard delete only reachable once archived. Card archiving physically moves the card into a per-board "Archived" list (auto-created, protected from rename/delete, persists even when empty). Deleting a list archives all its cards into the Archived list first. Restoring a card returns it to its original list if that list still exists, else into a per-board "Restored" list (auto-created, protected, unique per board).
10. Due date red badge for overdue cards
11. Playwright E2E tests — core flows (create board, add card, drag-and-drop, archive)
12. Design system — derived from the Agentic FM channel design brief (**blocked: brief not yet uploaded**)
13. New Card modal — dedicated creation modal for cards (today, `AddCardButton` only takes a title inline; no modal exists for creation, only for editing via `CardModal`)
14. Add Description and Due Date fields to card creation — Description sized to a standard Trello-like character allowance; `cards.description`/`cards.due_date` already exist in the schema but neither is settable anywhere yet (creation or edit)
15. Re-design the app's UI using the `frontend-design` skill, applied against the design system from Step 12 (depends on Step 12)
