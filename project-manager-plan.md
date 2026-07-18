# Project Manager App — Implementation Plan (v2)

Rewritten from the as-built system (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
[`docs/design-system.md`](docs/design-system.md), [`CONTEXT.md`](CONTEXT.md)) plus one
recorded bug ([`docs/notes/base-ui-menu-typeahead-keydown-bug.md`](docs/notes/base-ui-menu-typeahead-keydown-bug.md)).
This version is written to be **executed end-to-end by an AI agent with no
human in the loop** — every step either has a fully autonomous path or an
explicit workaround. The original v1 plan (kept in git history) undersold two
things that mattered a lot in practice: the archive/restore data model, and a
headless-UI keyboard-event footgun that cost a full debugging cycle. Both are
now first-class steps below instead of things discovered mid-build.

## 0. Autonomous-execution preconditions

Read this section before starting Step 1. The agent is expected to run
unattended (the user is asleep) — nothing below may block on a human.

### Settings required before the run starts

- **Permission mode**: run in an auto-accept mode (e.g. Claude Code's
  `--dangerously-skip-permissions` / an allowlisted `.claude/settings.json`)
  scoped to this repo's directory only. Without this, every `Write`/`Edit`/
  `Bash` call in a fresh repo stalls on a confirmation prompt with nobody to
  answer it.
- **Pre-authenticate any CLI the plan touches**, before the unattended run
  starts, since interactive login flows (OAuth browser popups, device codes)
  cannot be completed by the agent itself:
  - `gh auth login` (if a GitHub repo/push is in scope)
  - any package-registry auth (`npm login`, private registry tokens) if the
    project needs non-public packages
- **No secrets requiring interactive input**: if `.env` values are needed
  (none are, for this app — it's local-SQLite, no external services), they
  must be written to disk before the run, not solicited during it.
- **Network access** must be available (npm install, `npx playwright
  install`) — confirm once up front rather than discovering a firewall
  mid-run.
- **Ports pre-declared and free**: this plan fixes dev on `3000` and the
  Playwright test server on `3001` (see Step 11) specifically so the agent
  never has to ask "which port is free?" — a question with no one to answer
  it at 3am.

### Steps that cannot be fully autonomous, and their workaround

| Step | Why it needs a human | Workaround for unattended execution |
|---|---|---|
| Creating a **public/private GitHub remote** | First-time `gh` auth is an interactive OAuth flow | Pre-authenticate `gh` before the run (see above); if no remote exists yet and auth wasn't done in advance, the agent should commit locally and leave a clear note in the handoff doc rather than guessing at repo visibility/ownership |
| **Visual/design review** ("does this look right") | Aesthetic judgment is inherently subjective | Use programmatic screenshot capture (Playwright `browser_take_screenshot`, not the interactive `claude-in-chrome` extension, which needs the user's own logged-in browser session) and compare against explicit, written acceptance criteria (contrast ratios, specific token values from `design-system.md`) instead of "eyeballing" it |
| **Sourcing brand assets** (logos, custom imagery) | The user's actual brand files live outside the repo (e.g. an Obsidian vault) and can't be fetched by an agent with no access to that filesystem/account | Generate a placeholder asset (e.g. via the `frontend-design` skill) sized and positioned per spec, and flag it explicitly as swap-out-later in the handoff doc — never block the build on an asset only the user can supply |
| **Ambiguous product decisions** not already resolved in `CONTEXT.md` | Only the user knows their own intent | Make the smallest reasonable default choice, document it and the alternative considered in the handoff doc, and move on — do not stop the run to ask |
| **Destructive git operations** (force-push, history rewrite) | Explicitly gated by this project's own safety rules | Never do these unattended; if the plan seems to require one, stop that step, leave the working tree clean and committed, and flag it |

## 1. Tech stack

| Layer | Choice | Why (vs. plausible alternatives) |
|---|---|---|
| Framework | Next.js (App Router), React, TypeScript | Server components + server actions avoid needing a separate API layer for a single-user app |
| Styling | Tailwind CSS v4, CSS custom properties in `app/globals.css` | Design tokens as CSS vars (not JS theme objects) keep Tailwind utilities themeable with zero component changes |
| Fonts | Loaded via `next/font/google` in the root layout | Avoids manual `<link>` tags / FOUT handling |
| UI primitives | Headless component library (`@base-ui/react` or equivalent — Radix, react-aria are peers) + an icon set | **Gotcha, read before using any menu/combobox primitive**: see Step 7a |
| Database | SQLite via a native driver (`better-sqlite3`) | Zero-ops for a single-user local app — no server process, no connection pooling |
| ORM / migrations | Drizzle ORM + `drizzle-kit`, migrations auto-applied on process start | No manual migration step for the agent (or the user) to remember to run |
| Drag & drop | `@dnd-kit/core` + `@dnd-kit/sortable` | Optimistic local state + background server action, not a client-state library |
| Data mutations | Server Actions only, no REST/GraphQL routes | One fewer layer to design, serialize through, and keep in sync |
| Testing | Jest + Testing Library (unit), Playwright (E2E) | See Step 11 for the specific patterns that avoid known pitfalls |

Do **not** introduce a client-side data store (Redux/Zustand/React Query) —
the request-flow pattern in Step 2 covers every case this app needs without
one. If a future feature seems to need one, treat that as a signal the
feature doesn't fit this architecture, not as a reason to add the library.

## 2. Request-flow pattern (apply on every feature, not just once)

1. A route under `app/` is an **async server component** — it queries the
   ORM directly and passes plain data down as props. No fetch/JSON layer.
2. Interactive pieces are **client components** holding only the local UI
   state they actually need (e.g. optimistic drag state). Split off just the
   part that needs a browser API (route awareness, DOM events) into a small
   client child — do not convert an entire parent to `"use client"` because
   one row needs `usePathname()`.
3. Mutations are **server actions** (`"use server"`) called directly from
   client components. Each action calls the framework's path-revalidation
   API; callers additionally force an immediate re-render after awaiting the
   action rather than waiting for the next natural navigation.

## 3. Data model

```
boards (id, title, color, archived, created_at)
lists  (id, board_id, title, position, special)
cards  (id, list_id, title, description, due_date, priority, position, archived, original_list_id)
labels (id, name, color)
card_labels (card_id, label_id)   -- join table, labels are global (not board-scoped)
```

Decisions worth carrying forward as-is (each cost real debugging/design time
the first time around):

- **`position` is a float, not an integer index.** Reordering only ever
  needs to average two neighboring positions — never renumber a whole list.
  Implement this before drag-and-drop, not after; retrofitting it later means
  rewriting every existing reorder call site.
- **`lists.special`** flags the two auto-created, protected lists ("Archived",
  "Restored" — see Step 6). List UI must check this flag and hide
  rename/delete for such rows.
- **`cards.original_list_id` is a plain integer, deliberately not a foreign
  key.** It must survive the referenced list being deleted, so restore logic
  detects "that list is gone" by a failed lookup, not by an FK-nulled column.
  Making it an FK is the single most likely accidental regression here —
  call this out in a code comment at the schema definition, not only in docs.
- **`archived` flags on both `boards` and `cards`** — card archiving also
  *physically moves* the card (Step 6); keep the flag and list-membership
  change in the same server action so they can never drift out of sync.

## 4. Project structure

```
/app
  /board/[id]       ← Board view with lists and cards
  /                 ← Redirects to last active board
/lib
  /db.ts            ← ORM + SQLite setup, runs pending migrations on open
  /schema.ts        ← ORM schema
  /actions/*.ts     ← Server actions, one file per entity
/components
  /Board            ← Board layout + filter bar
  /List             ← List column + card stack
  /Card             ← Card tile (draggable)
  /CardModal        ← Card detail modal
  /Label            ← Label picker/management (see Step 7a gotcha)
  /Sidebar          ← Board navigation
/e2e
  /pages            ← Playwright Page Object Model (see Step 11)
```

## 5. Build order

1. DB schema + ORM setup, with migrations auto-applied on process start —
   verify by starting the dev process fresh against an empty DB file and
   confirming tables exist, no manual `migrate` command required.
2. App layout — persistent sidebar + main area.
3. Create / rename / delete boards and lists.
4. Board view with static lists and cards.
5. Create / edit cards via a dedicated modal (title, description, due date) —
   build the create and edit modals against the same field set from the
   start; a title-only first pass that gets description/due-date "added
   later" means two modals drift out of sync in the meantime (this happened
   in v1 — Steps 13/14 were originally separate and cost a sync pass).
6. **Archive/restore model** (the most non-obvious subsystem — implement
   exactly this shape, not a simpler version that will need reworking):
   - Boards: two-step. Active → "Archive Board" only. Archived → "Delete
     Board" (hard delete, cascades to lists/cards). Archiving a board bulk-
     flags its cards `archived = true` *in place* (no move — the board is
     already inaccessible from navigation).
   - Cards: archiving **moves** the card into a per-board "Archived" list
     (auto-created on first use, `special = true`), recording
     `original_list_id`. An archived card's detail view offers "Restore" and
     hard "Delete" side by side; an active card offers "Archive" only.
   - Deleting a list archives all its cards into the Archived list first,
     then deletes the now-empty list — never cascade-delete cards via FK.
   - Restoring a card returns it to `original_list_id` if that list still
     exists, else into a single per-board "Restored" list (same
     auto-create-on-first-use helper, uniqueness enforced by looking up an
     existing `special` list with that title first).
7. Drag-and-drop: cards within a list, between lists, list reorder. Optimistic
   local state update, then a background server action call. An empty list
   needs its own droppable zone (not just the sortable list wrapper) so a
   card can still be dropped into it.
   - **7a. Headless-menu keyboard gotcha — read before building the Label
     picker (or any dropdown containing a real `<input>`/`<textarea>`)**:
     headless menu primitives (base-ui, Radix, react-aria all have this
     failure mode) attach a keydown listener at the menu-popup level for
     typeahead navigation and arrow-key list nav, and it does not
     special-case "this descendant is a real text input." A `<input>` nested
     inside a dropdown/menu content component will have every keystroke's
     default text-insertion behavior swallowed by the ancestor's
     `preventDefault()`, even though the input itself has no bug. **Fix
     up front**: any input rendered inside a menu/dropdown content component
     must have `onKeyDown={(e) => e.stopPropagation()}`. **Test up front**:
     the corresponding Playwright test must use `locator.pressSequentially()`,
     not `.fill()` — `.fill()` sets the DOM value directly via CDP and never
     dispatches real per-character `keydown` events, so it cannot catch this
     class of bug (a real regression here shipped past a green test suite
     the first time, because the test used `.fill()`). Treat this as a
     project-wide convention, not a one-off patch: grep for the
     dropdown/menu content component whenever adding any new nested form
     control, and default new tests for such fields to `pressSequentially`.
8. Labels — global management + assign to cards (apply the 7a convention
   here directly, since this is exactly where it was first discovered).
9. Filter bar (by label, and by priority if the priority field has UI by this
   point — do not assume a schema field has a corresponding UI affordance
   without checking this plan's current step status first).
10. Due date badge for overdue cards.
11. **Testing setup** (build this alongside Step 5–7, not as a lump at the
    end — a growing untested surface is exactly what an unattended agent run
    cannot safely refactor against):
    - Jest + Testing Library for component/logic unit tests. Mock server
      actions and router/navigation hooks; mock the drag-and-drop library
      entirely (headless DOM environments can't produce real pointer/layout
      events for it).
    - Playwright for E2E, against a **dedicated test database file**, wiped
      automatically in a global-setup hook before each run — never share the
      dev DB with the test run. Run the test dev server on a **different
      fixed port** than the normal dev server, with `workers: 1` — a SQLite
      file does not tolerate concurrent writers, and flaky cross-worker
      failures are hard to distinguish from real bugs.
    - Structure E2E specs with a **Page Object Model** (`e2e/pages/`) — one
      class per page (`HomePage`, `BoardPage`) and one per reusable UI
      component (`CardModal`, `FilterBar`, `Sidebar`, dialogs, menus) rather
      than raw locators inlined in every spec. This is what makes specs
      resilient to markup changes and readable as user actions instead of
      DOM queries.
    - No unit tests are required for thin server-action wrappers around ORM
      queries — exercise those through E2E instead; reserve unit tests for
      actual logic (position math, restore-target resolution).
12. Design system — tokens only (colors, typography, gradients/glows) as CSS
    custom properties + `next/font/google`, driven by a written brand brief
    if one exists. Document the mapping and the *why* behind any deviation
    from the brief (e.g. "muted, not neon, for filled surfaces — full
    neon fails contrast at body-copy sizes") in `docs/design-system.md` as
    you go, not retroactively.
13. New Card modal, title-first only if truly necessary for sequencing —
    prefer folding this into Step 5 directly per the note there.
14. (Folded into Step 5 — kept as a numbered placeholder only if the team
    building this deliberately wants a title-only intermediate milestone for
    early review; default is to skip it.)
15. Full UI pass applying the Step 12 tokens across every component,
    verified via **programmatic** screenshots (Playwright), not an
    interactive browser session, since no human is available to look at an
    interactive one during an unattended run. Verify every dialog, the
    active-nav-item state, and any other "emphasis moment" the design system
    doc calls out explicitly, rather than spot-checking one page and
    assuming the rest matches.

## 6. Definition of done (per step, and for the whole plan)

- All Jest and Playwright suites green, run non-interactively
  (`playwright test`, not `playwright test --ui`).
- No TODO/FIXME left for a decision that was actually resolved during the
  run — resolve it and record the decision in the handoff doc instead.
- A handoff doc written at the end of the run (see project's existing
  `docs/handoff/` convention) listing: what was built, what was deliberately
  deferred, any placeholder assets that need swapping, and any step from
  Section 0's table that was hit and how it was worked around.
- Nothing in the diff was committed with `--no-verify` or force-push.
