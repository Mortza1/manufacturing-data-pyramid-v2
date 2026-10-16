// Shared shapes for the Advanced (knowledge graph) prototype samples.

export type NodeKind = 'context' | 'evidence' | 'event' | 'summary' | 'finding' | 'model' | 'decision' | 'outcome' | 'person' | 'agent';

export interface GraphNode {
  id: string;
  label: string; // Neo4j-style label, e.g. Material
  name: string;
  kind: NodeKind;
  level: number | null; // 1..5, null = agent halo above the pyramid
  sector?: number; // index into GraphSample.sectors (pyramid face)
  props: Record<string, string>;
  createdBy: string;
  status?: 'proposed';
}

export interface GraphRel {
  id: string;
  type: string;
  source: string;
  target: string;
  status?: 'proposed';
}

export interface GraphWorkflow {
  id: string;
  name: string;
  description: string;
  color: string;
  // Stages may hold several relationships: workflows can branch and merge.
  stages: { title: string; relIds: string[] }[];
}

export interface AskAnswer {
  id: string;
  question: string;
  agent: boolean;
  answer: string;
  caveat?: string;
  nodeIds: string[];
  relIds: string[];
}

export interface GraphLevel {
  level: number;
  name: string;
  color: string;
  weight: number; // relative level height; the apex level is taller so its nodes fit inside the point
}

export interface GraphSample {
  id: string;
  title: string;
  subtitle: string;
  levels: GraphLevel[];
  sectors?: { name: string; color: string; stat: string }[]; // exactly 4: one per pyramid face
  nodes: GraphNode[];
  rels: GraphRel[];
  workflows: GraphWorkflow[];
  story: Record<string, { title: string; text: string }>;
  ask: AskAnswer[];
}

export const KIND_STYLE: Record<NodeKind, { color: string; title: string }> = {
  context: { color: '#2dd4bf', title: 'Manufacturing context' },
  evidence: { color: '#38bdf8', title: 'Recorded evidence' },
  event: { color: '#f87171', title: 'Event / alarm' },
  summary: { color: '#facc15', title: 'KPI / summary' },
  finding: { color: '#fb923c', title: 'Finding' },
  model: { color: '#818cf8', title: 'Analysis model' },
  decision: { color: '#c084fc', title: 'Plan / action' },
  outcome: { color: '#4ade80', title: 'Outcome' },
  person: { color: '#e2e8f0', title: 'Person / role' },
  agent: { color: '#f472b6', title: 'AI agent' },
};

// Fraction of the pyramid height below a level (0 at the base, 1 at the apex).
export function levelStartFraction(levels: GraphLevel[], level: number) {
  const total = levels.reduce((sum, item) => sum + item.weight, 0);
  return levels.filter((item) => item.level < level).reduce((sum, item) => sum + item.weight, 0) / total;
}

export const node = (id: string, label: string, name: string, kind: NodeKind, level: number | null, props: Record<string, string> = {}, createdBy = 'import', sector?: number): GraphNode =>
  ({ id, label, name, kind, level, props, createdBy, sector });

export const rel = (id: string, source: string, type: string, target: string): GraphRel => ({ id, source, type, target });
