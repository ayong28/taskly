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
| **Updating external MCP client configs** that point at a path this repo controls (e.g. a Hermes agent's `~/.hermes/config.yaml`, Claude Desktop's config) | Those files live outside the repo, on the user's machine, in another tool's config format the agent shouldn't assume it can freely rewrite without being asked each time | Update `.mcp.json` (in-repo) directly; for out-of-repo configs, list the exact path/diff needed in the handoff doc and ask before editing, even if a prior session already established a pattern for it — don't silently propagate a path change into another tool's config |

## 1. Token optimization for unattended runs

No one is watching this terminal, so verbose output is pure token cost with
no readability benefit. That said, the real cost-explosion risk in this
project is a **stuck retry loop** (e.g. repeatedly re-running the same
failing Playwright spec, or looping on a flaky `moveCard`/position-math
test), not chatty output — configure both, but treat the loop-control items
as the actual safeguard.

**Quiet output (real, bounded savings — configure once, up front):**
- `npm ci --silent` / `--quiet` for installs.
- `npx jest --silent` and Playwright's `--reporter=dot` (or `line`) — never
  the HTML reporter, which opens a browser and is meant for a human.
- Pipe any command whose output isn't immediately actionable through
  `grep -E "FAIL|Error"` or `tail -n 50` rather than reading it in full.
- `git` commands run with `-q` by default; only surface output on failure.
- No `DEBUG=*` or verbose env vars left on outside of actively diagnosing
  one specific failing step.

**Loop/cost containment (higher priority — this is what actually prevents
an exploding bill):**
- **Retry cap of 2 attempts** per failing test/build/lint command before
  stopping that step, recording the failure in the handoff doc, and moving
  to the next Build Order step (or halting entirely if the step is
  load-bearing, e.g. DB schema/migrations).
- **Commit atomically per red→green TDD cycle**, not once per Build Order
  step (Section 6) — a step like "create/edit cards via a dedicated modal"
  is several distinct behaviors; each gets its own test-then-commit. This
  is the actual recovery mechanism if the run is interrupted: resume from
  the last committed *behavior*, not re-derive a whole multi-part step.
- **Use `git bisect run` for regressions** instead of manually re-reading
  diffs. This only works because commits are atomic and always green (see
  Section 6's commit-discipline note) — e.g. if the Playwright suite
  regresses after the Step 15 redesign pass, `git bisect run npx playwright
  test <spec>` finds the exact offending commit non-interactively, the same
  way the actual Step 15 regression in this project's history (six specs
  still targeting the old inline card-title input) would have been findable
  in one command instead of a manual review.
- **No unscoped subagent delegation** (e.g. `playwright-test-healer` runs)
  — always give it a specific failing spec/file, per the pattern already
  used in this project's own sessions, never an open-ended "fix whatever's
  broken" with no bound on how long it searches.
- If a step's automated verification can't be made to pass within the
  retry cap, that is itself a signal worth flagging in the handoff doc as
  a candidate real bug — not a reason to keep spending tokens retrying
  variations of the same fix.

## 2. Tech stack

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

## 3. Request-flow pattern (apply on every feature, not just once)

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

## 4. Data model

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

## 5. Project structure

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

## 6. Build order

**Commit discipline for every step below**: red→green→commit at the
smallest unit of behavior, not once per numbered step. E.g. Step 6
(archive/restore) is at least four separate commits (board two-step
archive, card archive-and-move, list-delete-archives-cards, card restore)
each with its own test landing in the same commit as its implementation —
never a single "implement archive/restore" commit, and never a commit where
the test suite is red. See Section 1 for why: this is what makes the
history both cheaply resumable and bisectable.

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
    - As part of installing Playwright, also run
      `npx playwright init-agents --loop=claude` once — it generates the
      `playwright-test-generator`/`-healer`/`-planner` agent definitions
      under `.claude/agents/` used throughout this plan's testing steps and
      wires up the `playwright-test` MCP server in `.mcp.json`. These
      generated agent files are reproducible from this one command, so
      `.claude/agents/` is gitignored rather than committed — re-run the
      command (it's idempotent) rather than hand-editing files there if an
      agent definition needs to change upstream.
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
16. **MCP server for agent access to tasks** (`mcp/taskly-server.ts`) — before
    building this, first extract the mutation logic out of `lib/actions/*.ts`
    into framework-agnostic `lib/core/*.ts` functions (no `"use server"`, no
    `revalidatePath`), since server actions can't run outside a live Next.js
    request and the MCP server is a separate Node process. `lib/actions/*`
    then become thin wrappers: call the matching `lib/core` function, then
    `revalidatePath`. Verify the refactor changed nothing by running the full
    Jest + Playwright suites before writing a single MCP tool — this step is
    a pure extraction, not new behavior, so both suites should be unaffected.
    Register tools (`list_boards`, `list_lists`, `list_cards`, `get_card`,
    `create_card`, `update_card`, `move_card`, `archive_card`,
    `restore_card`, `delete_card`) against `lib/core`, wire the server into
    `.mcp.json`, and add an `npm run mcp:taskly` script. See
    `docs/ARCHITECTURE.md`'s "External/agent access (MCP)" section for the
    design tradeoffs (no auth, `delete_card` doesn't enforce the UI's
    archive-first rule, shares the live DB by default).
17. **Extract `@taskly/core` as a real npm-workspace package, and move the
    MCP server out of `mcp/` into a sibling workspace package** (major
    feature upgrade — branch: `feature/mcp-workspace-extraction`).

    **Why**: `mcp/taskly-server.ts` currently lives as a subfolder of the
    Next.js app and imports `lib/core/*`/`lib/db`/`lib/schema` via this
    repo's own `@/*` tsconfig path alias. That only works because the MCP
    server happens to sit inside the app's own directory tree — it isn't a
    real dependency boundary. Researched community practice for MCP servers
    (Anthropic's reference servers, `@playwright/mcp`, and monorepo examples
    like `sap-mcp-servers`) is consistent: **standalone MCP servers don't
    reach into another app's source tree via relative/alias imports — they
    depend on a properly published or workspace-declared package.** Even
    when the pattern is a monorepo (not a fully separate repo), the shared
    logic is extracted into its own package that every consumer — app and
    MCP server alike — depends on explicitly, not path-reached-into.

    **Why not a fully separate repo**: this app is a personal, unpublished,
    single-user tool — there's no case for publishing `@taskly/core` to a
    registry or splitting git history across repos. An **npm workspaces
    monorepo** gets the real benefit (a genuine package boundary, atomic
    commits across both consumers, no more relative-path reach-through)
    without the cost (two repos to keep in sync, cross-repo versioning).
    This mirrors how `@playwright/mcp` itself is structured internally
    (`packages/*` in one repo) even though it *also* happens to publish
    externally — the workspace boundary is the part that matters here, not
    external publishing.

    **Target structure** (Next.js app stays at the repo root — deliberately
    *not* moved into `packages/app/`, since that would touch deploy config,
    docs, and CI for no benefit to the actual problem being solved):
    ```
    project-manager-01/
      app/, components/, e2e/ ...        ← Next.js app, unchanged location
      package.json                       ← workspace root + still the app's own package.json
      packages/
        core/                            ← @taskly/core: lib/core + lib/schema + lib/db, moved here verbatim
        mcp-server/                      ← @taskly/mcp-server: mcp/taskly-server.ts, moved here, depends on @taskly/core
    ```

    **Atomic commits** (per Section 6's TDD/commit discipline — verify the
    full Jest + Playwright suites after every single one of these, since
    this entire step is a pure restructuring with zero intended behavior
    change; any test failure means the extraction broke something, not that
    a test needs updating):
    - [ ] 17a. Add `"workspaces": ["packages/*"]` to the root `package.json`;
          create empty `packages/core/` and `packages/mcp-server/` with
          minimal `package.json` files (`@taskly/core`, `@taskly/mcp-server`,
          both `"private": true`, no publish intent). Run `npm install` and
          confirm the root app still builds/tests untouched — this commit
          adds workspace *plumbing* only, moves zero files yet.
    - [ ] 17b. Move `lib/schema.ts` into `packages/core/schema.ts` (git mv,
          preserve history), update its own internal imports if any. No
          other file changes yet — this commit will fail typecheck
          elsewhere, which is expected and fixed in 17c; commit anyway if
          the plan's discipline requires every commit green — **exception**:
          for a multi-file mechanical move where splitting further adds no
          real checkpoint value, 17b+17c may land as one commit instead,
          but never leave the tree red across a commit *boundary* looked at
          in isolation from the rest of this numbered step.
    - [ ] 17c. Move `lib/db.ts` and `lib/core/*.ts` into `packages/core/`,
          update their internal imports to match. **Technical risk to
          verify explicitly here**: `lib/db.ts`'s default `DATABASE_PATH`
          resolution uses `process.cwd()` — once this file lives inside
          `packages/core/`, `process.cwd()` at runtime is *the invoking
          process's* cwd (the app root when run via `next dev`/`next
          build` from the repo root, but potentially something else for
          the MCP server depending on how it's launched). Do not assume
          this "just works" post-move — explicitly test both consumers
          (`npm run dev` and the MCP server smoke test from
          `mcp/taskly-server.ts`'s original build) resolve to the *same*
          `data/project-manager.db` file before/after, or make the path
          resolution anchor to the package's own file location
          (`import.meta.url`-relative) instead of `process.cwd()` if they
          don't.
    - [ ] 17d. Set up `packages/core/package.json`'s `exports` field
          pointing at the `.ts` sources directly (no build step — Next.js,
          Jest, and `tsx` all already transpile TS on the fly, matching how
          this repo already handles `lib/`). Update the root app's
          `tsconfig.json` and every `app/`/`components/`/`lib/actions`
          import from `@/lib/core/...`, `@/lib/db`, `@/lib/schema` to
          `@taskly/core/...`. Run the full Jest suite here specifically —
          **known gotcha to check for**: Jest's default
          `transformIgnorePatterns` skips `node_modules`, and npm
          workspaces symlink `packages/core` *into* `node_modules/@taskly/core`
          — if Jest refuses to transform the workspace package's `.ts`
          files because of this, that's the fix needed (adjust
          `transformIgnorePatterns` to allow the `@taskly` scope), not a
          reason to add a build step to `packages/core`.
    - [ ] 17e. Delete the now-empty `lib/core/` directory once nothing
          references it. `lib/actions/*.ts` remain in the app (they're
          `"use server"` wrappers, inherently Next.js-specific) but now
          import their core functions from `@taskly/core` instead of
          `@/lib/core`.
    - [ ] 17f. Move `mcp/taskly-server.ts` into `packages/mcp-server/index.ts`
          (or similar), update its imports to `@taskly/core`, add it as a
          real dependency in `packages/mcp-server/package.json`
          (`"@taskly/core": "*"`, resolved via the workspace). Delete the
          old `mcp/` directory.
    - [ ] 17g. Update `.mcp.json`'s `taskly` entry to the new path/command
          (e.g. `npx tsx packages/mcp-server/index.ts`, still launched with
          the repo root as cwd). Re-run the same create→update→list→
          archive→delete smoke test used when the MCP server was first
          built, against a throwaway `DATABASE_PATH`.
    - [ ] 17h. Full Jest + Playwright suites green one final time. Update
          `docs/ARCHITECTURE.md`'s "External/agent access (MCP)" section to
          describe the new package boundary instead of `mcp/`+`lib/core`.
          **Decided for this run (2026-07-19, user going AFK)**: do **not**
          edit `~/.hermes/config.yaml` — leave it pointing at the old path.
          Instead, write the exact before/after diff for its `taskly`
          entry into the handoff doc for the user to apply themselves. Do
          not push the branch at the end either — leave all commits local
          on `feature/mcp-workspace-extraction` for review.

## 7. Build checklist

The live, checkable status of Section 6, reflecting the app as it actually
stands today (not a from-scratch execution) — kept at commit granularity
where a step decomposed into more than one, per the commit-discipline note
above. Check an item the moment its commit lands; don't batch. Anything
still unchecked here is genuine remaining work, not a fictional restart.

- [x] 1. DB schema + ORM setup, migrations auto-applied on process start
- [x] 2. App layout — sidebar + main area
- [x] 3. Create / rename / delete boards and lists
- [x] 4. Board view with static lists and cards
- [x] 5. Create / edit cards via a dedicated modal (title, description, due date)
- [x] 6. Archive/restore model
  - [x] 6a. Board two-step archive → delete
  - [x] 6b. Card archive-and-move into per-board Archived list
  - [x] 6c. List deletion archives its cards first
  - [x] 6d. Card restore to original list or per-board Restored list
- [x] 7. Drag-and-drop (cards within/between lists, list reorder)
  - [x] 7a. Headless-menu keydown gotcha fixed in `LabelPicker`
- [x] 8. Labels — global management + assign to cards
- [x] 9a. Filter bar by label
- [ ] 9b. Filter bar by priority — **blocked on there being no priority UI
      at all yet (see 10a below); do not build this until 10a lands**
- [ ] 10. Due date handling
  - [x] 10a. Due date field settable on create/edit (part of Step 5)
  - [ ] 10b. Overdue red badge rendered on card tiles — schema/field exists,
        no UI reads it yet
  - [ ] 10c. Priority field UI (picker on the card modal) — schema field
        exists (`cards.priority`), nothing renders or sets it yet; 9b
        depends on this landing first
- [x] 11. Testing setup (Jest unit + Playwright E2E, POM structure, dedicated
      test DB, `init-agents` scaffolding)
- [x] 12. Design system tokens (`docs/design-system.md`, `app/globals.css`)
- [x] 13/14. New Card modal fields (folded into Step 5)
- [x] 15. Full UI pass applying design-system tokens across every component
- [x] 16. MCP server for agent access to tasks
  - [x] 16a. Extracted `lib/core/{cards,lists,queries}.ts`; `lib/actions/*`
        refactored to thin wrappers, Jest + Playwright suites reverified green
  - [x] 16b. `mcp/taskly-server.ts` registered in `.mcp.json`, tools smoke-
        tested end-to-end (create → update → list → archive → delete)
- [ ] 17. Extract `@taskly/core` npm-workspace package; relocate MCP server
      out of `mcp/` (branch: `feature/mcp-workspace-extraction`)
  - [ ] 17a. Workspace plumbing (`workspaces` field, empty package dirs)
  - [ ] 17b/17c. Move `lib/schema.ts`, `lib/db.ts`, `lib/core/*` into
        `packages/core/`; verify DB path resolution still matches for both
        the app and the MCP server
  - [ ] 17d. `packages/core` exports wired up; app imports updated to
        `@taskly/core`; Jest `transformIgnorePatterns` verified against the
        workspace symlink
  - [ ] 17e. Old `lib/core/` deleted
  - [ ] 17f. MCP server moved into `packages/mcp-server/`, depends on
        `@taskly/core`
  - [ ] 17g. `.mcp.json` updated to new path, smoke test re-run
  - [ ] 17h. Full suites green; `ARCHITECTURE.md` updated; external MCP
        client configs (e.g. Hermes) flagged, not silently edited

## 8. Definition of done (per step, and for the whole plan)

- All Jest and Playwright suites green, run non-interactively
  (`playwright test`, not `playwright test --ui`).
- History is bisectable: every commit passes its own tests (Section 6's
  commit discipline) — spot-check with `git log --oneline` that no commit
  message reads like a mid-work checkpoint ("wip", "more fixes").
- No TODO/FIXME left for a decision that was actually resolved during the
  run — resolve it and record the decision in the handoff doc instead.
- A handoff doc written at the end of the run (see project's existing
  `docs/handoff/` convention) listing: what was built, what was deliberately
  deferred, any placeholder assets that need swapping, and any step from
  Section 0's table that was hit and how it was worked around.
- Nothing in the diff was committed with `--no-verify` or force-push.
