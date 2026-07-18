# Project Implementation Plan — Template

Generic template for a plan an AI agent can execute **unattended** (assume
the requester is asleep/unavailable for the whole run). Derived from
rewriting this repo's own plan (see [`../../project-manager-plan.md`](../../project-manager-plan.md))
after the fact against the real architecture, design-system, and bug docs it
had accumulated — the sections below are exactly the ones that turned out to
matter, not a generic SDLC checklist.

Copy this file to `<project>-plan.md` at the project root and fill in every
`{{...}}` placeholder. Delete a section only if it's genuinely not
applicable — don't delete Section 0, Section 1, Section 2, or Section 8, they're what
makes the plan safe to run without a human.

---

## 0. Intake questionnaire — ask the user before writing anything else

Ask these before drafting a single other section. The plan will be executed
**unattended**, so any gap left here becomes a stall or a guess mid-run with
no one available to answer it — resolve ambiguity now, while a human is
still present. Ask all questions that apply; skip only ones the user has
already answered elsewhere (an existing spec/context doc, a prior message).
Group them, but don't compress them into a single vague prompt — a specific
question gets a usable answer, "any requirements?" doesn't.

**Project goal & scope**
- What is this project, in one or two sentences, and who is the single
  intended user or audience?
- What does "done" look like for the *whole* plan — a specific feature set,
  or an open-ended platform? What is explicitly out of scope for this pass?
- Is there an existing domain glossary/spec (like a `CONTEXT.md`) the agent
  should treat as authoritative, or does one need to be created from this
  conversation?

**Tech stack**
- Is there a required or preferred language/framework, or is the agent free
  to choose? If free, are there any hard exclusions (e.g. "no X" from a past
  bad experience)?
- Data storage: what kind of persistence is expected (none, local file/
  embedded DB, hosted DB, external API as source of truth)? Single-user
  local tool or something with concurrent users?
- Any required integrations (auth provider, payment, email, third-party
  APIs) — and are credentials for them already available (see Preconditions
  below), or does the agent need to stub/mock them for now?
- Any non-negotiable architectural constraint (e.g. "must not add a
  client-side state library", "must be deployable as a single binary")?

**Data model / domain objects**
- What are the core entities and how do they relate? (Even a rough sketch —
  "boards contain lists contain cards" — is enough to seed Section 5.)
- Are there any fields/states with non-obvious lifecycle rules (soft-delete,
  archive/restore, multi-step status, anything that isn't just plain CRUD)?
  These are exactly the parts that need to be nailed down before the agent
  builds against a simpler model it'll have to unwind later.

**Project structure & build order**
- Is there an existing codebase this extends, or is it greenfield?
- Should features be built in a specific priority order (e.g. driven by
  what's riskiest, what's most valuable, or what unblocks the rest), or is
  the agent free to sequence for build efficiency?
- Are there known trouble spots from a prior attempt at this or a similar
  project (bug write-ups, postmortems, "we tried X and it broke Y")? Get
  these named explicitly so they can be inlined at the relevant build step
  instead of rediscovered.

**Autonomous-execution preconditions**
- Will this plan actually run unattended, or will a human be reachable
  mid-run? (If reachable, Section 1's workarounds are optional; if not,
  they're mandatory.)
- What permission/approval mode will the agent run under — is a scoped
  auto-accept setting already configured, or does the user need to set one
  up before starting?
- Which external services/CLIs does the plan need, and are they already
  authenticated (git hosting, package registries, cloud providers, deploy
  targets)? If not yet authenticated, will that happen before the run
  starts, or should the plan assume local-only/no-push?
- Are there secrets/env vars the build needs, and do they already exist on
  disk, or do they need to be created before the run (never plan to prompt
  for them mid-run)?
- Any fixed ports, filenames, or shared resources that should be nailed down
  now to avoid the agent guessing at "what's free"?

**Visual/design & assets**
- Is there a design system, brand brief, or existing visual language to
  follow — and if so, where does it live? If not, should the agent default
  to a plain/utilitarian look rather than inventing a brand?
- Are there real brand assets (logos, imagery) the agent should use, and are
  they accessible from the machine the agent runs on? If not, confirm the
  agent should generate clearly-flagged placeholders instead of blocking.
- How should visual correctness be verified without a human looking at it —
  specific written acceptance criteria (contrast ratios, exact tokens,
  screenshot diffing), or is a human review pass planned for after the
  unattended run completes?

**Testing & definition of done**
- What test types are expected (unit, integration, E2E, none)? Any existing
  test conventions/tools to match rather than introduce a new one?
- What must be true for the agent to consider the whole plan complete and
  stop — all tests green, a specific demo flow working, something else?
- Should the agent produce a handoff/summary doc at the end, and if so,
  where should it live (does the project already have a convention, e.g. a
  `docs/handoff/` directory)?

---

## 1. Autonomous-execution preconditions

Fill this in **before** Step 1 of the actual plan, and re-check it any time
the plan is handed to an agent to execute. An unattended agent that hits a
step requiring human input will either stall indefinitely or guess — this
section exists to make every such point explicit in advance, with a
pre-decided fallback.

### Settings required before the run starts

- **Permission mode**: {{how tool-call approval is handled for this run —
  e.g. an allowlisted settings file scoped to this repo, or a fully
  auto-accepting mode}}. State explicitly what is *not* covered by the
  allowlist (destructive git ops, anything outside the repo directory)
  so the agent knows what should still cause it to stop.
- **Pre-authenticated CLIs/services**: list every CLI or API the plan will
  call that normally requires an interactive login (`gh`, cloud provider
  CLIs, package registries) and confirm each is authenticated *before* the
  run starts. An agent cannot complete an OAuth browser flow or type a 2FA
  code.
- **Secrets**: any `.env`/credential file the plan needs must already exist
  on disk. Never write a plan step that says "ask the user for the API
  key" — there is no one to ask.
- **Network access**: confirm package installation and any external
  registry access works once, up front.
- **Ports / resources pre-declared**: fix every port, filename, or other
  shared resource the plan will use in advance (e.g. dev server port, test
  server port, test database path) so the agent never has to make a
  judgment call about "what's free" with no way to check with anyone.

### Steps that cannot be fully autonomous, and their workaround

Fill in one row per step in the plan below that a first read suggests might
need a human. For each: name the step, name *specifically* why a human was
historically involved, and write the fallback the agent should take instead
of stopping.

| Step | Why it needs a human | Workaround for unattended execution |
|---|---|---|
| {{e.g. creating a hosted repo/remote}} | {{e.g. first-time CLI auth is interactive}} | {{pre-authenticate in advance; if missed, commit locally and note it in the handoff doc rather than guessing}} |
| {{e.g. visual/design review}} | {{aesthetic judgment is subjective}} | {{use programmatic screenshot tooling + written acceptance criteria (specific tokens/contrast ratios) instead of an interactive session/"eyeballing"}} |
| {{e.g. sourcing external brand/user assets}} | {{lives outside the agent's reach — another account, another machine}} | {{generate a clearly-flagged placeholder; note the swap-out in the handoff doc; never block the build on it}} |
| {{e.g. ambiguous product decisions not resolved in the spec}} | {{only the requester knows their own intent}} | {{make the smallest reasonable default, document the decision and the alternative considered, keep moving}} |
| {{destructive/irreversible operations}} | {{explicitly gated by the project's own safety rules}} | {{never perform unattended; stop that step, leave the tree clean, flag it}} |

Add rows freely — this table is the single most valuable output of Phase 1
of writing any plan like this: it converts "the agent might get stuck" into
"here's exactly where, and here's what it does instead."

## 2. Token optimization for unattended runs

An unattended run has no one watching the terminal, so verbose output isn't
buying anyone readability — it's pure token cost, and in a long run it adds
up. But be clear-eyed about where the real risk is: **a stuck retry loop or
a runaway subagent will burn far more tokens than a chatty test reporter
ever will.** Configure both, but treat the loop-control items as the ones
that actually prevent a runaway bill — verbosity settings are a real,
worthwhile trim, not the primary defense.

### Settings to configure before the run starts (real, bounded savings)

- **Quiet flags on every noisy command**: package installs
  (`npm ci --silent` / `--quiet`), test runners (`jest --silent`,
  `playwright test --reporter=dot` or `line`, never a browser-opening HTML
  reporter), linters/build tools set to error-only output. These commands
  run dozens of times over a build; a verbose reporter alone can be
  thousands of tokens per run for output nobody reads.
- **Never dump full logs into context** — redirect verbose output to a file
  and pull back only what's actionable (`grep -E "FAIL|Error"`, `tail -n
  50`, exit code + a one-line summary) instead of the full stdout.
- **Prefer targeted reads over full-file dumps**: grep/line-ranged reads
  instead of printing an entire file to check one function; this is a
  standing habit, not a one-time setting, but worth stating explicitly here
  since an unattended run has no one to notice it's ballooning context.
- **Disable app-level debug/verbose logging** (`DEBUG=*`, verbose flags,
  source-map-heavy stack traces) unless actively debugging a specific
  failure — turn it on only for the duration of diagnosing one failing
  step, then back off.
- **Quiet git**: `-q` on routine `git` commands; only surface output when a
  command fails.

Realistic expectation: these settings meaningfully cut *steady-state*
per-command overhead (often the single largest source of avoidable token
spend across a long build, since it repeats every single command), but they
cap out at removing waste — they can't prevent a pathological case where
the agent itself keeps re-running commands.

### Settings to configure before the run starts (loop/cost containment — higher priority)

These are the ones that actually protect against costs "exploding," and
verbosity settings don't substitute for them:

- **A hard retry cap per step** (e.g. 2–3 attempts at the same failing
  test/build/command), with an explicit rule for what happens next:
  stop that step, record the failure and what was tried in the handoff
  doc, and move on (or halt the whole run, if the step is load-bearing) —
  never "keep trying variations" unboundedly.
- **A wall-clock or turn-count ceiling** for the whole run, checked
  periodically, after which the agent stops and writes a handoff doc
  regardless of how much of the plan is finished. An unattended run that
  can't finish in bounded time should fail visibly, not silently keep
  spending.
- **Checkpoint via commits**, not just at the end — commit after each
  completed build-order step. If the run is killed or hits its ceiling
  mid-way, the recovery cost is "resume from the last committed step," not
  "re-derive everything from scratch," which is itself a token-cost
  control.
- **No open-ended subagent delegation without a scope and a budget** — if
  the plan or the agent spins up subagents/sub-tasks, each one should have
  a bounded, specific goal; an unscoped "figure this out" delegation is how
  a single stuck step turns into an unbounded chain of exploration.

### Net evaluation

Quiet output settings are worth doing — they're free, cost nothing to set
up, and remove real, recurring waste over a long build. But they are a
secondary lever. The primary defense against a token/cost explosion is the
loop-containment list above: a bounded retry policy, a run-level time/turn
ceiling, and commit checkpoints. If a plan implements only the quiet-output
settings and skips retry/ceiling limits, it is not actually protected
against runaway cost — say so explicitly if choosing to skip any of the
loop-containment items for this project.

## 3. Tech stack

| Layer | Choice | Why (vs. plausible alternatives) |
|---|---|---|
| {{layer, e.g. Framework}} | {{choice}} | {{the reason this and not the obvious alternative — this is what lets the agent hold the line on the choice under pressure, e.g. when a library seems to "need" a client store}} |

State explicitly, right after the table, anything the plan deliberately does
**not** use and why (e.g. "no client-side data store — the request-flow
pattern in Section 4 covers every case without one"). A plan that only says
what to use invites the agent to reach for a familiar-but-unnecessary
dependency the first time a feature feels awkward.

## 4. Core architectural pattern

Describe the one pattern that recurs across every feature, so each build
step below can say "apply the Section 4 pattern" instead of re-deriving it.
For a full-stack app this is usually the request/mutation flow (who fetches
data, where interactive state lives, how mutations happen and propagate).
For other project types, substitute the equivalent (e.g. the event/handler
flow for a CLI, the message/state flow for a bot).

## 5. Data model / core domain objects

```
{{schema or core type definitions}}
```

For each field or relationship that isn't self-explanatory from its name,
add a one-line note **at the point of definition**, especially:
- any field that is deliberately *not* what the "obvious" modeling choice
  would be (e.g. a float position instead of an integer index, a
  non-foreign-key reference kept loose on purpose) — these are exactly the
  choices someone will "fix" by accident later without the note
- any flag whose invariant is maintained by application code rather than
  the schema itself (must be kept in sync by hand — say which code path
  is responsible)

## 6. Project structure

```
{{directory layout}}
```

## 7. Build order

Numbered, sequential steps. For each step:

- What gets built, in enough detail that "done" is checkable without asking
  anyone (see Section 8).
- Any known gotcha that historically caused rework, **inlined at the exact
  step where it applies**, not filed separately where it'll be missed. If
  this project has prior incident/bug write-ups, fold their fix *and* their
  root cause *and* the specific test technique that would have caught them
  earlier directly into the relevant build step — a plan that references
  "see bug doc X" instead of quoting the actionable fix will get skipped
  under time pressure.
- Testing for a step should be built alongside it, not deferred to a single
  end-of-plan testing step — call this out explicitly if the plan's own
  structure numbers testing as a late step; note that late testing steps
  are still fine for *infrastructure* decisions (framework choice, fixture
  strategy) but the tests themselves should land with the feature.
- If a step is genuinely a "nice to have later" and not required for the
  core plan, mark it as such explicitly rather than leaving it ambiguous
  whether it's required — an agent executing linearly needs to know which
  numbered steps are load-bearing.

## 8. Definition of done

A short checklist that applies to every step and to the plan as a whole,
written so an agent can self-verify without asking a human to confirm.
Typically includes:

- All automated test suites green, run in a fully non-interactive mode.
- No open decision left unresolved that the agent was actually capable of
  resolving — resolve it and record the decision, don't leave a TODO for a
  human who isn't coming.
- A handoff/summary doc produced at the end of the run: what was built,
  what was deliberately deferred, any placeholder assets/values that need a
  human's follow-up, and which rows (if any) from Section 1's table were
  actually hit during this run and how they were handled.
- Confirm no irreversible/destructive action was taken outside what Section
  1 explicitly allowed.

---

## How to use this template

1. Copy it to the target project as `<project>-plan.md`.
2. Work through Section 0's questionnaire with the user first — don't draft
   any other section from assumptions when a two-line question would settle
   it.
3. Fill Section 1 next, based on the questionnaire answers about permission
   mode, authentication, and unattended-execution constraints.
4. Fill Section 2 — decide the retry cap, run ceiling, and checkpoint
   cadence before any build step runs, not after the first runaway loop.
5. Fill Sections 3–6 from the actual architecture/design decisions already
   made (or being made) for the project — pull from any existing
   architecture/design/bug docs and questionnaire answers rather than
   writing generic best-practice filler.
6. Write Section 7 as the real, ordered build steps, inlining known gotchas
   at their point of use per the guidance above.
7. Before handing the plan to an agent for unattended execution, re-read
   Section 1's table once more and ask: *if the agent hits exactly this
   point at 3am, does the workaround actually let it keep going?* If not,
   that's a plan bug — fix it before the run, not during it.
