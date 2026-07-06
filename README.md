# Project Manager

A lightweight, single-user Trello-style project manager: boards → lists → cards, drag-and-drop, global labels, and an archive/restore workflow. Built with Next.js (App Router) and SQLite — no auth, no external services.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how it's put together, [`CONTEXT.md`](CONTEXT.md) for the domain glossary, and [`project-manager-plan.md`](project-manager-plan.md) for the feature spec and build order.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database lives at `data/project-manager.db` and is created (and migrated) automatically on first run — no setup step needed.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / run |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:watch` | Jest unit/component tests |
| `npm run test:e2e` | Playwright end-to-end tests (runs its own dev server against `data/test.db`, see `playwright.config.ts`) |
| `npm run db:generate` | Generate a Drizzle migration from `lib/schema.ts` after a schema change |

## Tech stack

Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS v4, `@base-ui/react` for dialogs/menus, `@dnd-kit` for drag-and-drop, Drizzle ORM over `better-sqlite3`, Server Actions for all mutations (no API routes). Jest + Testing Library for unit/component tests, Playwright for E2E.
