# Manufacturing Data Pyramid — App Guide

> **Data to Decision Intelligence.** An interactive 3D web app for mapping how manufacturing data flows from raw shop-floor signals up to executive decisions, organised as a pyramid of **levels** (vertical) × **sectors** (horizontal slices).

This document explains what the app is, how to use each mode, how it is built, and how data is stored. For developer commands and repo conventions see [`CLAUDE.md`](CLAUDE.md).

---

## 1. The core idea

Manufacturing data lives in many systems — sensors, PLCs, historians, MES, PLM/CAD, ERP, CMMS, dashboards. The pyramid gives that data a shared spatial frame:

| Level | Default name | Purpose | Example systems |
|---|---|---|---|
| 1 | Raw Signals / Signal-Physical | Sense the physical process | Sensors, PLCs, actuators, vision cameras |
| 2 | Operations / Operational | Contextualise the run | MES, SCADA, historians, LIMS |
| 3 | Engineering | Compare with design intent | PLM, CAD, CAM, FEA/CFD simulation |
| 4 | Enterprise / Management | Plan the system | ERP, SCM, CMMS, CRM |
| 5 | Decisions / Executive | Act with intelligence | Control towers, agentic orchestrators, AI planners |

Each level is a frustum (slice) of the pyramid. Sectors divide the pyramid around its vertical axis (e.g. *Product, Resources, Machines, People*), so every data element has a place: **which level × which sector × which grid cell**.

On top of placement, the app models **loops** — ordered paths of connections between elements (e.g. *signal → context → analysis → decision → back to the physical process*) that show how data closes into a feedback cycle.

---

## 2. Modes

A **mode selector** at the top of the screen switches between:

| Mode | Status | What it is |
|---|---|---|
| **Explorer** | Available | The original guided/teaching pyramid with a fixed 5-level structure, data library, course journeys and a forging case study. |
| **Walkthrough** | Available | A staged builder where you define your own pyramid, place data, create loops and save versioned projects. |
| **Advanced** | Disabled ("Coming Soon") | Placeholder. |

The two available modes use **separate state stores** and do not share data.

---

## 3. Explorer mode

### 3.1 Data library & placement
- **Data Library** panel (left): a palette of representative manufacturing data items (vibration signal, historian archive, MES event log, CAD drawing, point cloud, ERP order, maintenance record, agentic dispatcher, …), each tagged with a level and a category.
- **Drag to place** items onto a pyramid level in 3D (touch: tap to select, then tap the pyramid).
- **Add Data** dialog: create a custom item with name, type, source/system, level, category and optional description.
- Categories: `signal`, `time-series`, `event`, `model`, `document`, `record`, `insight`, `agent` — each rendered with its own visual style.

### 3.2 Courses & Journey
Three built-in courses, each with its own starter objects, relationships and step-by-step journey:

| Course | Journey steps |
|---|---|
| **Data Science** | Sources → Storage → Contextualisation → Quality → Analysis → Decision |
| **Fundamentals of AI** | Image → Vision · Time series → Forecasting · Tabular → Classification · Text → NLP |
| **Agentic AI** | Sensing data → Retrieving knowledge → Invoking tools → Taking action |

**Journey** plays through the steps (play/pause, previous/next), highlighting the level, objects and relationships for each stage, with a summary card.

### 3.3 View controls
- **Inspect** — click objects/levels to see the **Context Card** (name, type, source, description; for levels: purpose and example systems).
- **Connect** — show relationship lines between objects (animated data streams).
- **Explode** — pull levels apart vertically.
- **Section / cutaway** — cut the pyramid to look inside a chosen level.
- **Isolate Level** / **focus level** — show one level alone.
- **Active Only** — hide representative examples and show only placed/active data.
- **Pyramid surface opacity** slider, **level labels** toggle, **Edit level names**.
- **Auto-fill demo** (populate all five levels) and **Reset / clear active data**.
- **Focus Camera** and **Presentation mode** (a cleaner, reduced-chrome stage for teaching or recording).
- Respects **reduced motion**.

### 3.4 Forging Case Study
A self-contained worked example (button top-right) of a forging press:
- 5 levels: Signal/Physical → Operational → Engineering → Management → Executive.
- 4 sectors: **Product/Quality**, **Machine/Maintenance**, **Process/Operations**, **Resources/Organisation**, each colour-coded.
- 26 pre-placed elements (thermocouple, press force, displacement, microstructure images, process settings, simulation, product geometry, reliability, cost, sustainability, maintenance decision, profit, …).
- Two pre-built loops: **Process Optimisation Loop** and **Predictive Maintenance Loop**.
- Controls: separate sectors, explode, cutaway, labels and label distance, surface opacity, focus a single sector, create/edit/delete loops (deleting a loop keeps its data elements), arrow colour and thickness.
- **Return to Main Pyramid** exits.

---

## 4. Walkthrough mode

A five-stage guided builder. A side panel walks you through each stage (it can be collapsed); the 3D scene shows the pyramid as you build it.

### Stage 1 — Structure: *"Define the structural frame"*
- Choose the number and names of **vertical levels** and **sectors/edges**.
- Defaults: levels *Signal/Physical, Operational, Engineering, Management, Executive*; sectors *Product, Resources, Machines, People*.
- Optional auto-fill of level names. **Confirm Structure** locks it (it can be reopened later).

### Stage 2 — Data
Work level by level (**Next level**, skip, reset, clear):
- A top-down **data board** (grid) per level, with each grid cell belonging to a sector by its angle around the centre. Cells show **Free / Occupied / Selected** and a sector colour key.
- **Add data element** with rich metadata: name, description, availability, source, protocol, format, data type, frequency, sensing settings, preprocessing, intended use.
- Placing on an occupied cell offers the nearest free cell.
- **Move on Data Board**, **Edit metadata**, remove.
- **Auto-fill** adds representative elements per sector from a built-in catalogue (e.g. *Spindle Vibration*, *Machine State*, *CAD Geometry*, *OEE*, *Profitability*) — it never overwrites manual entries.

### Stage 3 — Visualise: *"Inspect visualisations"*
- Explode levels, focus a level or **Show Only** one level / **Show All Levels**.
- Toggle sectors on/off (**Show All Sectors**).
- **Surface opacity**, **data density** (1, 2, 3 or all elements per sector), **object size**, **label size**.
- Select an element to see its metadata.

### Stage 4 — Connections: *"Map the data flow"*
Loops are first-class objects (name, description, colour, open/closed) made of ordered, directional segments.
- **Create New Loop** → **Start Loop and Select First Element** → click elements in order; each click adds a segment.
- **Undo Last Segment**, **Finish Loop**, **Close to First Element** (closed loop), **Cancel Loop**. Self-links and repeated segments are rejected.
- **Loop table**: expand a loop to see its ordered path, label/describe segments, delete segments or loops, edit loop name/colour.
- **Example loops** can be added automatically.
- **3D view**: selecting a loop emphasises it; **All Loops / Show Only This Loop** isolates it. Sector context can show only sectors the loop touches or all. Routes are dense curved paths with a light→dark gradient to show direction; adjustable **connection thickness**.
- **2D view**: a *top-down cross-section* of the pyramid showing loops and nodes in plan view. 2D selection is independent of 3D isolation.

### Stage 5 — Save: *"Review your complete pyramid"*
- Project review summary.
- **Select existing user** (or create one).
- **Save As New Project** (starts at version 1) or **Save to Existing Project** (appends a new version), with an optional version note.
- **Saved project browser**: pick user → project → version and reopen it exactly as saved.

The working draft is also kept in the browser (localStorage), so a page refresh doesn't lose work.

---

## 5. Architecture

### 5.1 Monorepo
pnpm workspace, Node 24, TypeScript 5.9.

```
artifacts/
  manufacturing-data-pyramid/       Main React app (Vite, Tailwind v4, shadcn/ui, Zustand, wouter)
  api-server/                       Express 5 API mounted at /api
  manufacturing-data-pyramid-deck/  Slide-deck app
  mockup-sandbox/                   UI mockup playground (not product)
lib/
  db/                               Drizzle schema + client (PostgreSQL)
  api-spec/                         OpenAPI contract (openapi.yaml)
  api-zod/, api-client-react/       Generated (Orval) validators and React hooks
scripts/
  dev-local.sh                      Local full stack (Postgres in Docker + API + app)
  create-pyramid-video.mjs          Narrated video builder
```

### 5.2 Frontend
- **3D rendering**: react-three-fiber / three.js. Key components: `PyramidScene`, `Pyramid`, `PlacedObjects`, `Connections`, `DataStreams`, `ForgingScene`, `SceneEnvironment`; walkthrough previews in `v2/components/V2PreviewPyramid.tsx`.
- **2D cross-section**: `v2/components/V2CrossSection.tsx` (the 3D scene is unmounted while it's shown).
- **State**:
  - `src/store.ts` + `src/data.ts` — Explorer mode (library, courses, journey, forging case study).
  - `src/v2/store.ts` — Walkthrough mode. Builds a `V2Case` (`src/v2/types.ts`). Persisted to localStorage as `manufacturing-v2-case-storage` with a numbered `version` and `migrate` function.
- **Geometry** (`src/v2/geometry.ts`): maps a grid cell to a sector by angle from the grid centre, and grid cells to 3D positions on a level.
- **Visibility** (`src/v2/visibility.ts`): density filtering and loop-based object/sector filtering.

### 5.3 Data model (`V2Case`)
```ts
V2Case {
  id, name
  levels:  { id, index, name }[]
  sectors: { id, index, name }[]
  grid:    { width, height }
  overlays: {
    data | models | agents | decisions: V2Object[]   // placed elements + metadata
    loops:        { id, name, description, color, closed }[]
    connectivity: { id, loop_id, sequence, source_object_id, target_object_id,
                    direction: 'source_to_target', label?, description? }[]
  }
}
```
Each `V2Object` has `level_id`, `sector_id`, `grid_x`, `grid_y` plus the metadata fields listed in Stage 2.

Design rules:
- Loops are first-class; segments reference `loop_id` and carry a `sequence`. Segment and endpoint IDs are preserved; legacy grouped connections are migrated without data loss.
- Presentation state (2D selection, 3D isolation, panel collapse, camera) is kept out of the persisted case.

### 5.4 Backend & persistence
Express 5 API (`artifacts/api-server/src/routes/v2Save.ts`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/healthz` | Health check |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| GET | `/api/users/:userId/projects` | List a user's projects |
| POST | `/api/projects` | Create project (+ version 1) |
| GET | `/api/projects/:projectId` | Get project |
| POST | `/api/projects/:projectId/versions` | Append a new version |
| GET | `/api/projects/:projectId/versions` | List versions |
| GET | `/api/projects/:projectId/versions/:versionId` | Get one version's snapshot |

PostgreSQL via Drizzle (`lib/db`): `v2_users` → `v2_projects` → `v2_project_versions`.
- Each version stores the **whole case as an immutable JSONB snapshot** (`format: 'manufacturing-data-pyramid-v2'`, `schemaVersion: 1`). Versions are appended, never updated.
- The server validates snapshots before insert: format/schema version, unique object IDs, objects reference real levels/sectors and lie inside the grid, segments reference real loops, no duplicate sequence numbers within a loop.
- Three separate version counters: DB project version number, snapshot `schemaVersion`, Zustand persist `version`.

---

## 6. Companion outputs

- **Slide deck** (`artifacts/manufacturing-data-pyramid-deck`): a presentation of the pyramid concept, with a slide validator (`validate-slides`).
- **Narrated video** (`scripts/create-pyramid-video.mjs`): turns slide images in `attached_assets/` into `output/Pyramid_Paradigm_Narrated_Presentation.mp4` using Piper TTS for narration and FFmpeg for assembly, with frame-accurate timing so narration never outlasts its slide.

---

## 7. Running it

```sh
pnpm install
sh scripts/dev-local.sh          # Postgres (Docker) + API on :5000 + app on :5173
```
Or individually (see `CLAUDE.md`): the app needs `PORT` and `BASE_PATH`; the API needs `DATABASE_URL`. Explorer and Walkthrough stages 1–4 work without the API; only Stage 5 saving/loading needs it.
