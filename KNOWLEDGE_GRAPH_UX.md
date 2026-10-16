# From Loops to a Knowledge Graph — UX and Flow Changes

This document looks at what would change **for the user** if the app moved from today's linear loops to a knowledge graph like the RTM Spoiler sample. That sample links a material (K203), a machining visit, inspections, findings, a plan, actions, outcomes and a proposed AI agent with typed relationships.

It covers user experience and flows, not code. For the underlying data-model trade-offs see [`DATA_MODEL.md`](DATA_MODEL.md).

---

## 1. What the sample asks for that the app can't do today

| Sample needs | Today's app | Gap the user would feel |
|---|---|---|
| **Typed nodes**: Material, Hole, MachiningVisit, Inspection, Dataset, Summary, Finding, Plan, Action, Outcome, Agent | One kind of thing, a "data element", with the same 11 text fields | No way to say *what* something is; the fields don't fit (an Action has no "sensing settings") |
| **Definitions vs. records**: *Hole Inspection Dataset* (a source) vs *INS-0121* (one record) | Everything is one element in one grid cell | 200 inspections would mean 200 hand-placed cells |
| **Shared entities**: *Material K203* reused by many investigations | Each project is a closed world | Same material re-typed in every project, with no link between them |
| **Typed relationships**: USES_MATERIAL, EVIDENCE_FOR, SUPPORTS, INFORMS … | Untyped segments that exist only inside a loop | Can't record a fact like "INS-0121 inspects P01-H121" unless it's part of a story |
| **Many-to-many**: 3 findings support 1 plan; 1 summary aggregates many inspections | Loops are simple paths (no branching, no revisits) | Branching evidence can't be drawn |
| **Workflows as paths through a shared graph** | A loop *is* the connections | Workflows and facts are tangled together |
| **Numbers**: 200 inspected, 82 defective, 41.0 % | Free-text fields | Nothing computed, compared or checked |
| **Agents** with tools and access rights | Not modelled (`agents` overlay reserved, unused) | No place for them |
| **Questions**: "What evidence supports F01?" | Visual inspection only | No query or Q&A |

Most of this is a **new way of working**, not a few extra fields. Today the user's mental model is *"place data, then draw the story."* The sample's model is *"describe what exists and how it relates, then trace stories and ask questions."*

---

## 2. Where it fits: one product, graph underneath

There is no separate "advanced user". The pyramid's primary consumers are **agents**; humans build, curate and audit it (see [`WHY_GRAPH_AND_AGENTS.md`](WHY_GRAPH_AND_AGENTS.md)). So **every project is a graph**, and the modes are different ways of working with it:

| Mode | Role |
|---|---|
| **Explorer** | Teaching and presentation view (unchanged) |
| **Walkthrough** | The guided way to *build* the graph: structure, vocabulary, key entities, relationships, workflows |
| **(Advanced slot)** | Could become the **agent control room**: agent activity, proposals awaiting review, answer paths |

Existing Walkthrough projects migrate automatically: each element becomes a node with a generic type, and each loop becomes a workflow over newly created relationships.

---

## 3. Flow changes, stage by stage

Today's flow is linear: **Structure → Data → Visualise → Connections → Save.**
A knowledge graph is built iteratively: you add a finding, realise you need its evidence, add that, link it, and so on. So after the first guided pass, the Walkthrough should open into a **workspace with tabs/panels** that you can move between freely. The stage sequence remains as a *first-time checklist*.

### 3.1 Structure → *Structure + Vocabulary*

What stays: define levels (and optionally sectors).

What's new: **choose the vocabulary**, meaning which node types and relationship types this project uses.
- Start from a **template**: *Quality Investigation*, *Predictive Maintenance*, *Process Optimisation*, *Blank*. The RTM sample would be the *Quality Investigation* template.
- Each node type has a **default level** (Inspection → L1, Summary → L2, Finding → L3, Plan/Action → L4, Outcome → L5), an icon/colour, and its own fields. That keeps the pyramid meaningful without the user placing everything by hand.
- Each relationship type states **which node types it can connect** (e.g. `EVIDENCE_FOR`: Summary → Finding). The UI later uses this to offer only sensible choices.
- **Sectors become optional.** The sample doesn't use them. Users could also choose to slice by another attribute, such as material or asset.

> UX risk: asking a newcomer to design an ontology is a wall. Templates are essential; "edit vocabulary" should be an advanced option, not step 1.

### 3.2 Data → *Entities* (two kinds)

The board-and-grid placement works for a handful of items per level. It breaks for a graph with hundreds of records. Split entities into two kinds:

**a) Context and definitions** (few, hand-made): Material K203, Machining Visit 1, Hole Inspection Dataset, Agent.
- Created through a form with **type-specific fields** (Material: grade, supplier; Dataset: source system, frequency, owner).
- **"Use existing"** search first: *"Material K203 already exists in the shared library (used in 2 projects) — link it?"* This is the user-facing side of "don't duplicate shared entities."

**b) Records** (many, imported): INS-0121 … INS-0320.
- **Import from CSV/Excel** with column mapping ("this column is the hole ID; this one is the result").
- During import, **auto-link** by key ("each row inspects a hole; each hole uses a material; group by material + visit"). This replaces hand-drawing hundreds of edges.
- Records are shown **collapsed under their dataset** by default ("Hole Inspection Dataset · 200 records") and expand on demand.

**Placement changes:** the level comes from the type, and the position in the level is auto-laid-out. Manual grid placement becomes an optional "arrange" action, not a required step for each item.

### 3.3 New stage: *Relationships*

This doesn't exist today, because connections only exist inside loops. Users need to record **facts**, independent of any story:
- **Draw a link**: pick source → pick target → the app offers only the relationship types valid for that pair → optional properties (e.g. `GROUPING_KEY: material`).
- **Bulk link** from a selection ("these 200 inspections → AGGREGATED_INTO → K203/Visit 1 Summary").
- A **relationship table** (filter by type, source, target), because a big graph is easier to audit as a list than in 3D.
- **Warnings, not blocks**: "Finding F04 has no evidence," "Outcome not linked to any action," "Link skips from L1 to L5."

### 3.4 Connections → *Workflows*

Loops become **workflows**: named paths **through existing relationships** (the sample's `:Workflow` / `:WorkflowStep`).

What changes for the user:
- **Building**: clicking A then B **reuses** the existing A→B relationship. If there isn't one, the app asks: *"No relationship between these. Create one? Type: [INFORMS ▾]."* Building a workflow can therefore also grow the graph, but the user sees it happen.
- **Steps carry the story**: each step has its own narrative label ("Step 3: compare K203 to K178"). That's separate from the relationship's own properties, which stay factual.
- **Branching and revisits allowed**: a step can fan out (3 findings → 1 plan) and a workflow can pass through a hub twice.
- **Coarse vs. detailed views**: the sample's L1→L5 "first-visit loop" (Station Visit Records → … → Consistent Machining Performance) is a **summary workflow**. The detailed graph sits beneath it, so a workflow step can **drill down** into the subgraph that justifies it.
- **Deleting is safer and more explicit**: deleting a workflow never deletes facts. Deleting a relationship used by workflows shows *"Used in 2 workflows — remove from them too?"*

### 3.5 Visualise → *multiple views of one graph*

The 3D pyramid stays the signature view, but a dense graph needs more:

| View | Purpose |
|---|---|
| **Pyramid (3D)** | Where things sit by level; workflows as glowing paths. Records stay collapsed so it doesn't become a hairball. |
| **Graph (2D network)** | Readable layout of nodes and typed, labelled edges, like the sample diagram. Level can be kept as horizontal bands. |
| **Neighbourhood** | Click any node → show it plus 1–2 hops; expand step by step. The main way to explore a large graph. |
| **Evidence trail** | Pick a Finding/Outcome → highlight everything upstream that supports it (Finding → Summary → Inspections). |
| **Table** | Nodes and relationships as filterable lists. |

Filters: node type, relationship type, level, workflow, project, and "records shown/collapsed."

### 3.6 New: *Ask* (guided questions and agent Q&A)

This turns the graph from a diagram into a tool.
- **Guided questions** (no typing needed), offered depending on what's selected:
  - *"What evidence supports this finding?"*
  - *"Which actions came from this finding?"*
  - *"How was this verified?"*
  - *"What depends on this record?"* (impact analysis)

  The answer is shown as a **highlighted path in the views** plus a short list.
- **Ask in natural language** (agent): *"Why was the K203 first visit investigated, and was it fixed?"*

  The answer should **cite the nodes it used** (clickable), highlight them in the pyramid, and state its limits, as the sample does: *"shows improvement, does not establish which action caused it."* Users must be able to see that answers come from the graph, not invention.

### 3.7 Agents as first-class citizens

- Agents shown in a **separate layer** (e.g. a ring or halo above or beside the pyramid, as in the sample's "proposed AI agent layer"), not forced into a level.
- An agent's panel shows **what it can access** (its subgraph, highlighted), its **tools**, and which workflows it takes part in.
- Clear labelling of **proposed vs. operating** agents, so a planning model isn't mistaken for a live system.

### 3.8 Save → *Save, share and reuse*

Shared entities change what "save" means:
- A project still saves an **immutable version** (today's model).
- But Material K203 now lives in a **shared library** used by several projects. Editing it raises a choice: *"This entity is used in 3 projects. Update everywhere / Only this project (make a copy)."*
- The version history should show **what changed**: nodes/relationships added or removed, workflows changed.
- Possible **export** to Neo4j/Cypher, GraphML or CSV for people who want to query outside the app.

---

## 4. Numbers and derived results

The sample's summary node (200 inspected, 82 defective, 41.0 %) is **derived** from records. UX choices:
- **Manual**: the user types the figures (simple, but they can go stale).
- **Computed**: the summary is defined as "group inspections by material + visit; rate = fails / total," and the app calculates it. Show *"derived from 200 records, updated just now"*, with drill-down to the records.

Computed summaries are where a graph earns its keep. Start with manual figures plus a **"source records" link**, and add computation later.

---

## 5. Risks and tensions

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Complexity wall** | Today's strength is that anyone can build a pyramid in minutes | Templates; guided first pass; progressive disclosure; agents and imports do the bulk population |
| **Pyramid metaphor weakens** | In a graph, many edges are sideways (Hole → Material), not "up the pyramid" | Keep level as a type default; show cross-level progression in workflows; draw same-level links subtly |
| **Visual overload** | Hundreds of records in 3D are unreadable | Collapse records under datasets; neighbourhood view; 2D graph view |
| **Ontology debates** | Users may argue over "is this a Finding or a Summary?" | Templates with clear examples; allow a generic node type |
| **Shared-entity edits surprise people** | Changing K203 in one project changes others | Explicit "update everywhere vs. copy" prompt; show usage count |
| **Over-trust in agent answers** | Correlation presented as causation | Mandatory citations, stated limitations, "proposed" labelling |

---

## 6. Suggested rollout

The graph DB is the foundation, not the last step, because agents are the primary consumer:

1. **Graph DB as source of truth** plus a migration of existing projects (elements → nodes, loops → workflows over relationships). Decide versioning (temporal facts plus snapshot exports).
2. **Relationships separate from workflows** (§3.3, §3.4) and **typed nodes with templates** (§3.1, §3.2a): *Quality Investigation* template with the RTM sample as the demo project.
3. **Agent tool interface** (read-only first: schema, find, neighbourhood, paths) plus **answer paths highlighted in the pyramid** (§3.6).
4. **Neighbourhood, evidence-trail and graph views** (§3.5).
5. **CSV import of records and computed summaries** (§3.2b, §4).
6. **Agent write-back as proposals**, a review queue, and the agent layer (§3.7).
7. **Shared entity library across projects** (§3.8).

---

## 7. Questions to settle before designing screens

1. Which agents come first (quality investigation? predictive maintenance?), and what questions must they answer? That decides the first template and vocabulary.
2. Must every node sit on a pyramid level, or can context entities (Material, Asset) and agents sit outside it?
3. Are records (INS-0121) shown individually at all, or only as datasets plus summaries?
4. Is the shared library per user, per team, or global?
5. Should agents be able to **write** to the graph (propose findings or links), or only read and answer?
