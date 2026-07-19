# Handoff — project-manager-01 (MCP workspace extraction)

**Date:** 2026-07-19
**Repo:** `/Users/adrian/workspace/2026-projects/project-manager-01`
**Branch:** `feature/mcp-workspace-extraction` (local only — **not merged, not pushed**, per user decision while AFK)

## Where things stand

Completed Step 17 of `project-manager-plan.md` in full: extracted `@taskly/core`
(the app's DB/mutation logic) and `@taskly/mcp-server` (the MCP server) into
real npm-workspace packages, so the MCP server no longer reaches into the
Next.js app's source tree via a relative/`@/`-alias import — it depends on
`@taskly/core` as an explicit package, matching how established MCP servers
(Anthropic's reference servers, `@playwright/mcp`, monorepo examples like
`sap-mcp-servers`) are actually structured. Researched this pattern before
planning the migration (see the Step 17 writeup in `project-manager-plan.md`
for the sources and full rationale).

```
project-manager-01/
  app/, components/, e2e/ ...   ← Next.js app, unchanged location
  packages/
    core/          ← @taskly/core: schema.ts, db.ts, cards.ts, lists.ts, queries.ts
    mcp-server/    ← @taskly/mcp-server: index.ts (was mcp/taskly-server.ts)
```

All of Steps 17a–17h are done and checked off in `project-manager-plan.md`'s
Build Checklist. Every commit was verified green (Jest, a real `npm run
build`, and Playwright — not just `tsc`, per the lesson from the earlier
`"use server"` re-export bug this session's predecessor hit) before landing.

### Package boundary details

- `packages/core/package.json` exposes its modules via a subpath `exports`
  map (`./db`, `./schema`, `./cards`, `./lists`, `./queries`) rather than a
  build step — every consumer (Next.js/Turbopack, Jest, `tsx`) resolves
  straight to the `.ts` sources. Verified this works with zero config
  changes needed in any consumer.
- `packages/mcp-server/package.json` declares its own real dependencies
  (`@taskly/core`, `@modelcontextprotocol/sdk`, `zod`) instead of relying on
  root hoisting. Those two packages were removed from the root
  `package.json` (confirmed zero other consumers via grep first).
  `better-sqlite3`/`drizzle-orm` are additionally declared on
  `packages/core` (which directly imports them) but deliberately **left in**
  the root's own dependencies too, rather than removed — to avoid any risk
  to the untested `npm run db:generate`/`db:migrate`/`db:push` scripts,
  which nothing in this session's test suites exercises.
- `.mcp.json`'s `taskly` entry and the root `mcp:taskly` npm script both
  updated to `packages/mcp-server/index.ts`.

### Two technical risks the plan flagged in advance — both verified, neither needed a fix

1. `packages/core/db.ts`'s default `DATABASE_PATH` resolution is
   `process.cwd()`-relative, not anchored to the package's own file
   location. Confirmed post-move it still resolves correctly, because both
   consumers (the Next.js app and the MCP server) are always launched with
   the repo root as their working directory — this is an invariant to
   preserve, not something the code itself guarantees.
2. Jest's default `transformIgnorePatterns` skips `node_modules`, and npm
   workspaces symlink `packages/core` into `node_modules/@taskly/core` —
   confirmed Jest's resolver handles this and the subpath `exports` map
   with no config changes needed.

### A pre-existing flaky test, found and investigated (not fixed here)

One Playwright run showed a failure in `archive.spec.ts` ("a second card
restored to a missing original list reuses the same Restored list"). Did
not assume it was caused by this migration — checked the actual diff first
(the underlying `restoreCardCore`/`getOrCreateSpecialList` logic is
byte-identical to `master`, only import paths changed), then reproduced the
same intermittent failure on the **pre-migration** commit by running the
full suite twice in place: 40/40 once, 39/40 once, identical code both
times. This is a pre-existing order/timing-dependent flake in that spec,
unrelated to the workspace extraction — worth a real fix in a future
session (start by checking whether `archive.spec.ts`'s tests share state/
IDs across `test.describe` blocks in a way that's sensitive to execution
order), but deliberately not folded into this refactor's scope.

## Manual action needed from you (not done automatically — see below)

**Update `~/.hermes/config.yaml`'s `taskly` MCP server entry.** This repo's
own `.mcp.json` is already updated to the new path, but your Hermes agent's
config lives outside this repo and points at the old one. Per your decision
this session (you were about to go AFK), I did **not** edit it automatically
— apply this diff yourself:

```diff
   taskly:
     command: sh
     args:
     - -c
-    - cd /Users/adrian/workspace/2026-projects/project-manager-01 && npx tsx mcp/taskly-server.ts
+    - cd /Users/adrian/workspace/2026-projects/project-manager-01 && npx tsx packages/mcp-server/index.ts
     timeout: 120
```

Until you apply this, the Hermes agent's `taskly` MCP server will fail to
start once this branch is merged/checked out on `master` (the old
`mcp/taskly-server.ts` path won't exist anymore) — it's currently harmless
because `master` still has the old file and this branch hasn't been merged.

## Commits this session (all local, `feature/mcp-workspace-extraction`, not pushed)

1. `20f975d` docs: plan npm-workspace extraction of MCP server as Step 17
2. `5a6d6f6` docs: lock in AFK-run decisions for Step 17h
3. `66a62cf` chore: add npm workspace plumbing for @taskly/core and @taskly/mcp-server
4. `f55a366` refactor: move schema/db/core into @taskly/core workspace package
5. `e1b5023` refactor: move MCP server into packages/mcp-server workspace package
6. (this handoff doc + checklist updates — committed after this file is written)

## What's left

- **Apply the `~/.hermes/config.yaml` diff above** — the one manual step.
- **Merge/push decision**: branch is intentionally left local and unmerged
  per your instruction. Review the diff (`git log master..feature/mcp-workspace-extraction`)
  and merge to `master` (and push, if desired) whenever you're ready — nothing
  further is planned to happen on this branch automatically.
- **The pre-existing `archive.spec.ts` flake** (see above) — not fixed,
  worth a dedicated investigation session.
- Everything else previously listed as "What's left" in the 2026-07-10 and
  2026-07-19 (POM migration) handoffs is still unaddressed — this session
  only touched the MCP/workspace restructuring.
