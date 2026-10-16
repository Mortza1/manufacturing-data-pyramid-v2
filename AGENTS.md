# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Overview

Manufacturing Data Pyramid: a 3D (react-three-fiber) web app for mapping manufacturing data, models, agents and decisions onto a levels × sectors pyramid, plus a slide deck and a narrated-video pipeline. Originally a Replit pnpm-workspace project (`.replit`, `replit.md`); Replit-specific vite plugins only load when `REPL_ID` is set.

## Commands

pnpm only (a `preinstall` hook rejects npm/yarn). Node 24, TypeScript 5.9.

- `pnpm install` — `pnpm-workspace.yaml` enforces `minimumReleaseAge: 1440`; do not remove it.
- `pnpm run typecheck` — `tsc --build` for `lib/*`, then each artifact's `tsc --noEmit`
- `pnpm run build` — typecheck + build everything
- `sh scripts/dev-local.sh` — local (incl. Windows) full stack: Postgres in Docker (`pyramid-db` container), API on :5000, app on :5173 with `API_PROXY_TARGET` proxying `/api` (on Replit the router does this instead).
- `pnpm --filter @workspace/manufacturing-data-pyramid run dev` — main app (Vite). **Requires `PORT` and `BASE_PATH` env vars** or vite.config throws.
- `pnpm --filter @workspace/api-server run dev` — Express API (builds with esbuild to `dist/`, then runs). Requires `DATABASE_URL`.
- `pnpm --filter @workspace/db run push` — push Drizzle schema to Postgres (dev only; also run by `scripts/post-merge.sh`)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate `lib/api-zod` and `lib/api-client-react` from `lib/api-spec/openapi.yaml` (Orval)
- `pnpm --filter @workspace/manufacturing-data-pyramid-deck run validate-slides` — validate deck slide documents
- Tests use `node:test` with no runner configured; run a file directly: `node --test artifacts/manufacturing-data-pyramid/src/v2/jsonStructuralEquality.test.ts`

## Layout

- `artifacts/manufacturing-data-pyramid` — the main React app (Vite, Tailwind v4, shadcn/ui in `components/ui`, Zustand, wouter).
- `artifacts/api-server` — Express 5 API mounted under `/api`; routes in `src/routes/` (`v2Save.ts` holds users/projects/versions).
- `artifacts/manufacturing-data-pyramid-deck` — slide deck app; depends on a generated `src/.sdm/` editor runtime (imported as `@/.sdm/...`).
- `artifacts/mockup-sandbox` — UI mockup playground, not part of the product.
- `lib/db` — Drizzle schema (`users`, `projects`, `project_versions`). `lib/api-spec` / `api-zod` / `api-client-react` — OpenAPI contract and generated code (the frontend currently calls `/api/...` with plain `fetch`, not the generated hooks).
- `scripts/create-pyramid-video.mjs` — builds `output/Pyramid_Paradigm_Narrated_Presentation.mp4` from `attached_assets/` slides using Piper TTS (`work/models/`) and FFmpeg; intermediates go in `work/pyramid-video/`.
- `.agents/memory/` — prior design decisions; read the relevant one before changing Stage 4/5 behaviour or the video pipeline.

## Main app architecture

Two independent Zustand stores drive one UI (`src/App.tsx`):

- `src/store.ts` + `src/data.ts` — the original **explorer** mode (static pyramid, library panel, forging case study, presentation mode).
- `src/v2/store.ts` — the **walkthrough/advanced** modes (`mode !== 'explorer'`). A staged walkthrough builds a `V2Case` (`src/v2/types.ts`): levels, sectors, a grid, objects in four overlays (data/models/agents/decisions), and **loops** of ordered `V2Connection` segments. Persisted to localStorage as `manufacturing-v2-case-storage` with a numbered `version` + `migrate` — bump the version and extend `migrate` whenever the persisted shape changes.
- Stage "connections" has a 3D view (`PyramidScene`/`Connections`) and a 2D view (`v2/components/V2CrossSection.tsx`); the 3D scene is unmounted while the 2D view is shown.

Design rules (from `.agents/memory/`):

- Loops are first-class (`V2Loop`); connections reference `loop_id` and carry a `sequence`. Preserve segment and endpoint IDs; migrate legacy grouped connections without data loss.
- 2D loop selection, 3D loop emphasis/isolation, and panel collapse are presentation state: keep them separate from each other and out of the persisted case/snapshot. Pyramid sector surfaces render independently of `showOnlyLoopId`.
- Server saves store the whole case as an immutable, validated JSONB snapshot (`format: 'manufacturing-data-pyramid-v2'`, `schemaVersion`) in User → Project → Project Version; versions are appended, never updated. DB version numbers, snapshot `schemaVersion`, and the Zustand persist version are three separate counters.
