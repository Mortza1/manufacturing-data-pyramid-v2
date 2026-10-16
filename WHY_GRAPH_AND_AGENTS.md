# Why a Graph, Why for Agents

The pyramid's real user is going to be **AI agents**: agents that answer questions, investigate problems and recommend or take decisions across a manufacturing operation. Humans build, audit and steer it.

This document explains *why* that points to a graph database, *what the pyramid becomes* in that world, and *what changes* as a result. Companion docs: [`DATA_MODEL.md`](DATA_MODEL.md) (today's model) and [`KNOWLEDGE_GRAPH_UX.md`](KNOWLEDGE_GRAPH_UX.md) (user flows).

---

## 1. Start from what an agent needs

An LLM agent is a reasoner with **no knowledge of your factory**. Everything it knows about K203, Visit 1 or inspection INS-0121 has to be **retrieved and put in front of it** at the moment it reasons. So the questions are:

1. **Can the agent find the right facts?** It needs to go from a question to the relevant facts.
2. **Can it follow how they connect?** "Why" questions are chains: evidence → finding → plan → action → outcome.
3. **Can it show its working?** A human must be able to check where an answer came from.
4. **Can it add what it learns?** Investigations produce new findings, links and outcomes.
5. **Can several agents share it safely?** Quality, maintenance and planning agents look at the same assets and data, each with different permissions.

The way knowledge is stored decides how well each of these works.

---

## 2. Three ways to give an agent knowledge

| | **Documents + vector search (RAG)** | **Relational tables (SQL)** | **Graph (nodes + typed relationships)** |
|---|---|---|---|
| What's stored | Text chunks | Rows in fixed tables | Entities and the named links between them |
| How the agent retrieves | "Find text that sounds like the question" | Write a SQL query; joins per hop | Start at an entity, follow relationships |
| Multi-step "why" questions | Weak: the chain is spread over chunks, and similarity search doesn't follow it | Possible, but each hop is a join and the schema must anticipate it | **Native**: the chain *is* the path |
| Showing its working | Cites passages | Cites rows; the logic is hidden in the query | **The path is the explanation**: nodes and relationships it walked |
| Adding new kinds of things | Easy (more text), but unstructured | Schema migration for every new entity/link type | Add a node label or relationship type; no migration |
| Same entity in many contexts | Repeated in many chunks | Foreign keys, but meaning lives in table names | One node, many relationships: K203 exists once |
| Good at | Unstructured knowledge, manuals | Transactions, aggregates, reporting | **Connected context, provenance, reasoning chains** |

They aren't mutually exclusive. A mature setup uses **graph for structure, vectors for text inside nodes** (e.g. embedding the description of a Finding), and **SQL/time-series for raw high-volume data** (sensor streams stay in the historian; the graph holds a node *pointing to* them).

---

## 3. Why graphs and agents fit so well

### 3.1 Agents' questions are paths
Take the sample question: *"Why was the K203 first visit investigated, what was done, and did it work?"* Answering it means walking a path:

```
Material K203 ─USES_MATERIAL◄─ Holes ◄─INSPECTS─ Inspections ─AGGREGATED_INTO─► Summary (41%)
   Summary ─EVIDENCE_FOR─► Finding F01 ─INFORMS─► Plan PLAN-01 ─INCLUDES─► Actions
   Actions ─GENERATES─► Follow-ups (12% → 10% → 8%) ─EVIDENCE_FOR─► Outcome "verified under tested conditions"
```

In a graph this is one pattern query. In SQL it's 8+ joins someone had to design for in advance. In vector search the chain isn't recoverable at all.

### 3.2 A graph schema fits in a prompt
An agent needs to know the vocabulary to query well. A graph's vocabulary is small and readable: *"node types: Material, Inspection, Summary, Finding, Plan, Action, Outcome; relationships: INSPECTS, AGGREGATED_INTO, EVIDENCE_FOR, INFORMS, INCLUDES …"*. LLMs translate natural language into this ("what supports F01?" → `EVIDENCE_FOR`) far more reliably than into arbitrary table/column names. Typed relationships carry **meaning**; foreign keys only carry **links**.

### 3.3 Bounded, relevant context (GraphRAG)
An agent's context window is limited. A graph gives a principled way to choose what to show it: **start at the entity in question and expand 1–3 hops**. That subgraph is relevant by construction, small enough to fit, and keeps structure that flattened text loses.

### 3.4 Grounded, checkable answers
Every claim in the answer can point at the nodes and relationships it came from. That's what lets a quality engineer trust (or reject) an agent's conclusion. It also lets the app **highlight the agent's reasoning path in the pyramid**, which is the bridge between your visual tool and the agents.

### 3.5 Shared memory that grows
Agents can **write back**: propose a Finding, link it to its evidence, record an Outcome. The next agent, or the same one next week, starts from a richer graph. A graph absorbs new kinds of knowledge (a new node type, a new relationship) without redesigning tables.

### 3.6 Multi-agent coordination and permissions
Agents can be **nodes themselves**: `(:Agent {name:'Quality Investigation Agent'})-[:CAN_READ]->(:Dataset)`, `-[:USES_TOOL]->(:Tool)`, `-[:PARTICIPATES_IN]->(:Workflow)`. The question "what may this agent see?" is answered by a traversal. Several agents share one world model, so the maintenance agent and the quality agent agree on what "Machine 3" is.

### 3.7 Provenance is a first-class citizen
Every fact can record *who or what* created it: human, import, or which agent, plus when and from which evidence. In manufacturing, especially quality and certification, "how do we know this?" matters as much as the answer.

---

## 4. What the pyramid becomes

The pyramid doesn't go away; its **role changes**.

| Today | With a graph and agents |
|---|---|
| The pyramid **is** the data: objects placed in cells | The pyramid is a **lens over the graph**. Level and sector are *properties* of nodes, and the 3D view is one projection of the graph |
| Levels are positions | Levels are **abstraction tiers that agents reason across**: L1 evidence → L3 analysis → L5 decision. "Explain this decision" = traverse down; "what is this signal for?" = traverse up |
| A loop is a **story for humans** | A loop/workflow is an **agent playbook**: the path an agent follows to do a job (sense → contextualise → analyse → decide → act). The *Predictive Maintenance Loop* is literally the procedure a maintenance agent runs |
| Connections exist only inside loops | Relationships are **facts**; workflows are **routes through the facts** |
| Users fill the pyramid | Humans **design the structure and vocabulary, and review**. Agents and imports **populate, query and extend** it |
| The app is for building a diagram | The app is the **control room**: where humans see what agents know, what they did, and why |

That last row is the "why" for keeping the 3D pyramid: agents work on the graph, and **humans need a legible picture of it**. The pyramid, with agent reasoning paths lit up across levels, is that picture.

---

## 5. What changes as a result

### 5.1 One product, not modes for different users
There is no separate "advanced user". Every project **is** a graph:
- **Walkthrough** becomes the guided way to *build* the graph's skeleton (levels, sectors, node and relationship types, key entities).
- **Visualise / Connections** become ways to *see and curate* it (workflows, evidence trails, agent activity).
- **Explorer** stays the teaching view.

### 5.2 Graph DB becomes the source of truth
- Today: one immutable JSONB snapshot per project version in Postgres.
- Next: entities and relationships live in the graph DB, shared across projects and agents. Candidates:
  - **Neo4j** (most mature, Cypher, GraphRAG ecosystem)
  - **Memgraph** (Cypher-compatible, in-memory)
  - **Apache AGE** (Cypher inside the existing Postgres, so one database to run)

### 5.3 Versioning has to be rethought
The current "frozen whole-case snapshot per version" doesn't carry over to a shared, live graph. Options:
- **Temporal facts**: every node and relationship has `valid_from` / `valid_to` and `created_by`. "Show the graph as of version 3" becomes a time filter. Best fit for agents, since history is queryable.
- **Snapshot export**: keep immutable JSON exports of a project's subgraph as named releases (today's mechanism, demoted to "archive").

Likely answer: **temporal facts for the live graph, plus snapshot exports for milestones.**

### 5.4 Agents get a proper interface
Agents shouldn't get raw database access. Expose a small set of **tools**, for example via an MCP server, which is now the standard way to give agents tools:

| Tool | Purpose |
|---|---|
| `describe_schema()` | Node and relationship types, with level meanings |
| `find_entity(text)` | Locate a node by name or description (vector search inside nodes) |
| `neighbourhood(id, hops)` | Bounded context for reasoning |
| `paths(from, to)` | "How does this signal reach this decision?" |
| `run_workflow(id)` | Walk a playbook loop step by step |
| `query(cypher)` | Read-only, for complex questions |
| `propose(node/relationship)` | Write-back as **proposals** a human can approve |

Permissions come from the graph itself (§3.6), and every agent write is stamped with provenance.

### 5.5 New things the app must show
- **Agent activity**: which agent touched which nodes, and its proposals awaiting review.
- **Answer paths**: an agent's answer, with its path highlighted in the pyramid.
- **Proposed vs. confirmed** facts, visually distinct.
- **Agents as a layer** around or above the pyramid, with their access scope visible.

---

## 6. Honest caveats

- **Graphs don't make agents correct.** LLMs still write wrong queries and still confuse correlation with causation (the sample rightly says the improvement "does not establish which action caused the change"). Mitigations: curated tools over free-form queries, mandatory citations, human approval for writes.
- **Schema discipline matters more, not less.** A graph *allows* anything, so a loose vocabulary turns into a mess agents can't navigate. The vocabulary (node and relationship types) needs an owner, and templates.
- **Not everything belongs in the graph.** Raw high-frequency sensor data stays in historians and time-series stores. The graph holds *what it is, where it lives, and what it means*, plus aggregates and findings.
- **Operational cost.** Neo4j or Memgraph is a new service to host and back up; Apache AGE avoids that, at the cost of a less mature ecosystem.
- **Versioning semantics change**, as covered in §5.3. That decision should be made deliberately and early.

---

## 7. One-paragraph answer to "why?"

Agents can only reason over what they're given. Manufacturing knowledge is mostly **relationships**: this inspection, of this hole, in this material, aggregated into this summary, supporting this finding, driving this action. A graph stores those relationships explicitly, with names an LLM understands. That lets agents find bounded relevant context, follow "why" chains as paths, cite their evidence, and add what they learn to a memory they all share. The pyramid becomes the human-readable lens on that graph: levels are the tiers agents reason across, loops are the playbooks they follow, and the 3D view is where people see and trust what the agents are doing.
