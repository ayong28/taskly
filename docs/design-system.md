# Design System — Agentic FM

Step 12 of `project-manager-plan.md`. Tokens derived from the Agentic FM
channel brand brief, adapted for a dense, dark-only productivity UI. This is
the tokens-only pass — Step 15 (full UI re-design via the `frontend-design`
skill) is what actually applies these tokens across components.

Source brief: `agentic-fm-brand-design-system.md` (Obsidian vault, YouTube
Channel/agentic_fm project).

## Where the tokens live

- `app/globals.css` — CSS custom properties on `:root`/`.dark` (shared, see
  below) plus the `@theme inline` block that maps them to Tailwind v4
  utilities (`bg-background`, `text-foreground`, `font-heading`, etc.).
- `app/layout.tsx` — loads the three brand fonts via `next/font/google` and
  exposes them as CSS variables consumed by `globals.css`.

## Why `:root` and `.dark` share one palette

The brief is explicit: "Always display on a dark background ... Do NOT
recolor beyond the palette." There is no light-mode variant of this brand —
so rather than keep a separate light theme that nothing in the brief
supports, `:root` and `.dark` were merged onto the same dark palette. The app
has no theme toggle today; if one gets added later, it should offer
dark-only variations (e.g. an even lower-contrast "night" mode), not a light
theme.

## Color mapping

| Token | Value | Brand name | Notes |
|---|---|---|---|
| `--background` | `#0D0D1A` | Deep Void | primary surface |
| `--foreground` | `#F0E6FF` | Warm White | primary text |
| `--card` / `--popover` | `#1A1A2E` | Dark Grid | raised surfaces |
| `--primary` | `#00C4D4` | Muted Cyan | **not** the neon `#00F0FF` — see below |
| `--primary-foreground` | `#0D0D1A` | Deep Void | text on primary fills |
| `--secondary` | `#24243A` | interpolated | between Dark Grid and background, for a third layering level the brief doesn't define |
| `--muted-foreground` | `#8899BB` | Cool Gray | secondary text, captions |
| `--accent` | `#D400C0` | Muted Magenta | hover/emphasis, not solid buttons |
| `--border` / `--input` | `#00F0FF` at 15–20% opacity | Neon Cyan | matches the brief's grid-line opacity range |
| `--ring` | `#00F0FF` | Neon Cyan | full-saturation is fine for focus rings — transient, not a fill |
| `--destructive` | unchanged (existing red) | — | functional-only; the brief's "no green/red/orange" rule is scoped to the logo, not app chrome |
| `--chart-1..5` | cyan / magenta / electric blue / muted cyan / muted magenta | — | brief's full accent set, for any future chart/label color needs |

### Why muted, not neon, for fills

The brief's own font-color table only pairs full-saturation `#00F0FF` with
headline text on dark backgrounds — it never uses it as a large filled
surface. Neon cyan text/fills at body-copy sizes measure under WCAG AA
against both the Deep Void background and Warm White foreground. Buttons,
active states, and any solid fill use the brief's own "Muted Cyan"
(`#00C4D4`) / "Muted Magenta" (`#D400C0`) supporting colors instead. Full
neon is reserved for borders, rings, gradients, and glow effects, matching
how the brief itself uses it (glows, grid lines, logo gradient).

### Extras beyond the shadcn token set

```css
--gradient-primary: linear-gradient(135deg, #00f0ff 0%, #ff00e5 100%);
--gradient-background: linear-gradient(180deg, #0d0d1a 0%, #1a1a2e 100%);
--glow-cyan: 0 0 12px color-mix(in oklab, #00f0ff 60%, transparent);
--glow-magenta: 0 0 12px color-mix(in oklab, #ff00e5 60%, transparent);
```

Use `--gradient-primary` sparingly (brand marks, hero/empty-state headings) —
not on interactive controls, where a flat brand color is more legible at
small sizes. Glows are for emphasis moments (active card, drag state), not
default resting UI — the brief itself calls for "light, not busy."

## Typography

| Token | Font | Brief role |
|---|---|---|
| `--font-heading` | Orbitron | headings, titles, brand text |
| `--font-sans` (body) | Rajdhani | body copy, labels, most UI text |
| `--font-mono` | JetBrains Mono | anything code/terminal-flavored (currently unused in-app, kept for parity with the brief) |

Loaded via `next/font/google` in `app/layout.tsx`, so no manual `<link>`
tags or FOUT handling needed. Orbitron is dense and geometric — the brief's
own sizing guide starts headings at 48px+; at typical UI heading sizes
(16–24px) it's still legible but tighter-tracked than Rajdhani, so Step 15
should default to Orbitron only for true headings/titles, not for every
`font-semibold` label.

## Adaptations from the brief (productivity UI vs. video graphics)

The brief was written for thumbnails, intros, and lower-thirds — one-off,
high-impact compositions. A card-list UI is dense and long-lived on screen,
so:

- No scanlines, starfield particles, or grid-overlay backgrounds by default
  — the brief marks these "optional," "used sparingly," and "not mandatory,"
  and they compete with reading dozens of cards at once.
- No default per-element glow — reserved for specific interaction states
  (see `--glow-cyan`/`--glow-magenta` above), not resting cards/buttons.
- Border/ring opacity kept at the low end of the brief's own 10–15% grid-line
  range, since app borders are everywhere (cards, inputs, modals) rather
  than a single decorative overlay.
