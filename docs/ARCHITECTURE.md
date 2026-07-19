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
2. Interactive pieces are **client components** (`"use client"`) that hold local UI state (e.g. `BoardCanvas` holds the in-memory `cardsByList` map for optimistic drag-and-drop). The same split applies to route-awareness: `Sidebar` is an async server component that queries boards directly, but each row is rendered by `components/Sidebar/BoardLink.tsx` — a tiny client component that calls `usePathname()` to know whether *it* is the active board. Keep server components doing data fetching and push only the bit that genuinely needs browser APIs (route, DOM events, etc.) into a client child, rather than converting the whole parent.
3. Mutations go through **server actions** in `lib/actions/*.ts` — plain async functions marked `"use server"`, called directly from client components (no fetch/JSON layer). Each action calls `revalidatePath(...)` so the next server render picks up the change, and callers typically also call `router.refresh()` after awaiting the action to force that re-render immediately.

```
app/board/[id]/page.tsx (server, queries via Drizzle)
        │ props
        ▼
components/Board/BoardCanvas.tsx (client, holds DnD state)
        │ calls
        ▼
lib/actions/*.ts ("use server", revalidatePath)
        │ calls
        ▼
lib/core/*.ts (plain functions, mutates via Drizzle — no Next.js dependency)
```

There's no separate DTO/serialization layer — Drizzle row types flow straight from query to component props to action arguments.

The mutation logic itself lives in `lib/core/*.ts` as plain async functions with no `"use server"` and no `revalidatePath` call — `lib/actions/*.ts` are thin wrappers that call the matching `lib/core` function and then revalidate. This split exists because `revalidatePath` only works inside a live Next.js request and can't run in a standalone process; keeping the actual DB logic framework-agnostic is what lets `mcp/taskly-server.ts` (see "External/agent access" below) reuse it directly instead of duplicating it. When adding a new mutation, write the logic in `lib/core/`, then add a `lib/actions/` wrapper — never put real logic directly in a server action if it's something the MCP server (or any future non-Next.js caller) might also need.

**Gotcha**: a `"use server"` file may only export async functions — Next.js's build fails the whole app (not just that route) if it sees a bare re-export like `export { x } from "./core"` in one, even if `x` itself is async, because the re-export statement itself isn't a function declaration. If a `lib/actions/*.ts` file needs to expose a `lib/core` helper to other server-action callers, wrap it (`export async function x(...args) { return coreX(...args); }`), don't re-export it directly. This broke the full Playwright suite once (every spec failed with a Next.js "Build Error" overlay, not a real behavioral bug) before being caught.

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
- **Cards**: archiving a card **moves it** into a per-board "Archived" list (auto-created on first use via `getOrCreateSpecialList` in `lib/core/lists.ts`), recording `originalListId` so it can find its way back. `CardModal`'s footer is gated on the card's `archived` state: active → "Archive" only; archived (sitting in the Archived list) → "Restore" and "Delete" (permanent) side by side. (Title/description/due-date edits go through the separate `updateCard` action — archiving/restoring don't touch those fields.)
- **Deleting a list** archives all its cards into the Archived list first, then deletes the (now-empty) list — it no longer hard-deletes cards via cascade.
- **Restoring a card** returns it to `originalListId` if that list still exists on the board; otherwise it goes into a single per-board "Restored" list (same `getOrCreateSpecialList` helper, uniqueness enforced by looking up an existing `special` list with that title before creating one).
- Because the Archived/Restored lists are just ordinary rows in the `lists` table, `BoardCanvas` needs no special-casing to render their cards — a card's current `listId` alone determines where it shows up.

## Card creation and editing

`AddCardButton` opens `components/List/NewCardModal.tsx` (title, description, due date — calls `createCard`) rather than the single-line inline input it used to. Editing an existing card (`components/CardModal/index.tsx`, opened from `CardTile`) shares the same three fields and saves them together via `updateCard` — there's no separate rename action anymore. Both modals are otherwise independent components (no shared form component yet); keep their field sets in sync by hand if either changes.

## Drag and drop

`@dnd-kit` `DndContext` wraps the whole board in `BoardCanvas`. Each list is a `SortableContext`; an empty list gets its own `useDroppable` zone (`ListDropZone`) so a card can still be dropped into it. Card moves are optimistic: `handleDragEnd` updates local `cardsByList` state immediately, then fires the `moveCard` server action in the background. `computePosition` picks a new `position` by averaging the two neighboring cards' positions rather than renumbering.

## External/agent access (MCP)

`packages/mcp-server/index.ts` is a standalone MCP (Model Context Protocol) server package (`@taskly/mcp-server`) that lets an AI agent (or any MCP client) list boards/lists/cards and create/edit/move/archive/restore/delete cards outside the browser UI. It's registered in `.mcp.json` as the `taskly` server, launched via `npx tsx packages/mcp-server/index.ts` (also runnable directly as `npm run mcp:taskly`). See [`mcp-server-setup.md`](mcp-server-setup.md) for ready-to-copy registration snippets for Claude Code, Claude Desktop, Codex CLI, Gemini CLI/Antigravity, and a Hermes agent.

The app's own DB/mutation logic (`lib/schema.ts`, `lib/db.ts`, and what used to be `lib/core/*.ts`) lives in its own npm-workspace package, `packages/core` (`@taskly/core`) — not inside the Next.js app's directory tree. Both the app (via `lib/actions/*` and a few remaining server-component queries) and the MCP server depend on `@taskly/core` explicitly, resolved through npm workspaces rather than one reaching into the other's source via a relative or `@/` alias path. This mirrors how established MCP servers are actually structured (Anthropic's reference servers, `@playwright/mcp`, and monorepo examples like `sap-mcp-servers` all extract a shared package rather than importing across an unrelated app's internals) — see `project-manager-plan.md`'s Step 17 for the full migration writeup and rationale. `packages/core/package.json` exposes its modules via a subpath `exports` map (`@taskly/core/db`, `@taskly/core/schema`, `@taskly/core/cards`, `@taskly/core/lists`, `@taskly/core/queries`) since there's no build step — every consumer (Next.js/Turbopack, Jest, `tsx`) resolves straight to the `.ts` sources.

- The MCP server imports `@taskly/core`'s functions directly — the same ones `lib/actions/*` calls — so behavior (including the archive/restore rules above) is identical whether a card is edited through the UI or through an agent. It does **not** import from `lib/actions/*` (those are `"use server"` and depend on a live Next.js request for `revalidatePath`, which a standalone Node process doesn't have).
- It talks to the same SQLite file the dev/prod server uses (`packages/core/db.ts`'s default `DATABASE_PATH` resolution, which is `process.cwd()`-relative) unless `DATABASE_PATH` is overridden in its environment — an agent using it against a running dev server is editing live data, not a separate copy. Point `DATABASE_PATH` at the Playwright test DB (or another throwaway file) when experimenting. Because the path is `process.cwd()`-relative rather than anchored to the package's own file location, both the app and the MCP server must always be launched with the repo root as their working directory — confirmed still true after the `packages/core` move (see Step 17c/17h).
- `delete_card` is a hard delete and does **not** enforce the UI's rule that a card must already be archived before it can be permanently deleted — the tool description says so explicitly, but nothing stops a caller from hard-deleting an active card. This is a deliberate tradeoff (the UI's two-step gate is a safety nudge in a human-editable form, not a data invariant) rather than an oversight; don't "fix" it by adding an archived-check without also reconsidering whether the UI gate should move into `@taskly/core` for both callers.
- Adding a new MCP tool: implement the logic in `packages/core/` first (or reuse existing core functions, as all current tools do), export it via `packages/core/package.json`'s `exports` map if it's a new module, then add a thin `server.registerTool(...)` wrapper in `packages/mcp-server/index.ts` — don't write DB queries directly in the MCP server file.
- Any external MCP client config that hardcodes the server's launch path (e.g. a Hermes agent's `~/.hermes/config.yaml`, Claude Desktop's config) needs updating after this move — from `mcp/taskly-server.ts` to `packages/mcp-server/index.ts`. This repo's own `.mcp.json` is already updated; external configs are not touched automatically (see the latest handoff doc for the exact diff needed).

## Testing

- **Jest + Testing Library** for component/logic unit tests. Server actions and `next/navigation` are mocked; dnd-kit is mocked entirely (jsdom can't produce real pointer/layout events) — see `components/Board/BoardCanvas.test.tsx` for the established mocking pattern.
- **Playwright** (`e2e/`) for real end-to-end flows against a dedicated `data/test.db`, wiped automatically before each run by `e2e/global-setup.ts`. `playwright.config.ts` runs its own dev server on port 3001 with `workers: 1` (the test DB doesn't tolerate concurrent writers).
- No unit tests exist for `lib/actions/*` or `lib/core/*` directly — that logic is exercised through Playwright instead, since it's thin wrappers around Drizzle queries. If `lib/core` logic grows real branching beyond thin CRUD (as archive/restore's target-list resolution already has), that's exactly the case for unit-testing `lib/core` directly rather than only via Playwright.

## What's deliberately not here

- No authentication — single user, by design. The MCP server inherits this: anyone who can run it locally has full read/write access, same as the browser UI.
- No REST/GraphQL API routes — server actions are the app's only in-browser mutation path; the MCP server (above) is a separate, explicit exception for agent access, not a general-purpose API.
- No client-side data-fetching/caching library — server components + `revalidatePath` + `router.refresh()` covers it.
- No overdue-badge UI for due dates yet (the *field* is settable — see above — but nothing renders an overdue indicator) and no priority UI at all, despite `cards.priority` existing in the schema — don't assume a schema field has a corresponding UI affordance without checking `project-manager-plan.md`'s current status.
- No theme toggle — the design system (see [`design-system.md`](design-system.md)) is dark-only by the brand brief's own rules, not a placeholder for a future light mode.
