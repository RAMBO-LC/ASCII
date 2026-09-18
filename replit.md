# MargUp

A focused AI learning coach for Indian college students learning programming and technology. Topic-based mentoring (Gemini), activity tracking, curated roadmaps and career playbooks in one encouraging workspace.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/MargUp run dev` — run the web app (port 24619, needs `PORT=24619 BASE_PATH=/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec (also re-runs `typecheck:libs`)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

Local frontend dev proxies `/api` to `http://localhost:8080` (override with `API_PROXY_TARGET`).

## Required env

One file holds every secret: copy the template and fill in real keys (never commit `.env`).

- `cp .env.example .env` (repo root)
  - `PORT` — API port, e.g. `8080`
  - `DATABASE_URL` — Postgres connection string
  - `GEMINI_API_KEY` — Google AI Studio key (mentor replies; without it chat and roadmap advice return 503)
  - `GEMINI_MODEL` — override only (default `gemini-3.6-flash`; Gemini retires old models for new keys, so this may need bumping again one day)
  - `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — server-side Clerk keys
  - `VITE_CLERK_PUBLISHABLE_KEY` — same Clerk app, frontend key (Vite reads `VITE_*` from the root `.env`)
  - `API_PROXY_TARGET` — local dev only, where `vite dev` forwards `/api` (default `http://localhost:8080`)

Without `VITE_CLERK_PUBLISHABLE_KEY` the web app shows a setup screen instead of crashing.

## First-time setup

1. Create a Clerk application at https://dashboard.clerk.com and copy its keys.
2. Create a Postgres database and set `DATABASE_URL`.
3. `pnpm install` then `pnpm --filter @workspace/db run push` to create tables.
4. Get a Gemini key at https://aistudio.google.com and set `GEMINI_API_KEY`.
5. Fill in the single root `.env` from `.env.example`.
6. Run the API server, then the web app. Sign in with any Clerk-enabled method.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract (topics CRUD incl. auto-titled chats, roadmap catalog + opt-in AI advice, resources, career playbooks)
- `lib/api-client-react` / `lib/api-zod` — Orval-generated hooks and validators (do not edit; run `codegen`)
- `lib/db/src/schema` — Drizzle tables: `MargUp_users`, `MargUp_topics`, `MargUp_messages`
- `artifacts/api-server/src/routes/MargUp.ts` — all endpoint implementations
- `artifacts/MargUp/src` — React app: `pages/`, `components/`, `lib/api.ts` (thin adapter over generated hooks)

## Architecture decisions

- OpenAPI-first: the frontend only consumes generated hooks, so client/server can never drift.
- Auth is Clerk end-to-end: the app sends the session JWT as a Bearer token; the API verifies via `requireAuth`.
- Roadmaps/playbooks/resources are curated statics on the server; per-user state (topics, messages) is Postgres-backed.
- Roadmap checklist progress stays in `localStorage` — it is a UI preference, not learning data.

## Product

- Dashboard: greeting, goal, real stat strip (topics, paths, resources), continue-learning card, explore links, real activity calendar, timeline, paths.
- AI Mentor: one chat thread per topic, auto-titled from the first message with roadmap-lane inference. Guided-coach system prompt: paths and hint ladders, never full solutions upfront.
- Activity: the dashboard calendar and timeline render real message activity only.
- Roadmaps (core selling point): 9 full paths (frontend, backend, devops, javascript, react, python, dsa, aiml, placements) with level/audience/outcomes and checklists. AI appears only via per-phase opt-in (`POST /roadmaps/:slug/advice`).
- Playbooks (core selling point): separate career section — LinkedIn, X, GitHub posting systems for beginners.
- Resources: curated, searchable docs/courses/guides.

## User preferences

- Dark, Linear-style UI: hairline surfaces, Space Grotesk display type, single lime accent.

## Gotchas

- `pnpm-workspace.yaml` excludes macOS rollup/esbuild binaries (Replit deploys linux-x64). To build or `vite dev` on a Mac, remove the `darwin-*` override lines and reinstall.
- `vite.config.ts` requires `PORT` and `BASE_PATH` env vars.
- Orval codegen wipes `lib/*/src/generated` (`clean: true`) — never hand-edit those files.
- Deleting a topic cascades to its messages via `ON DELETE CASCADE`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
