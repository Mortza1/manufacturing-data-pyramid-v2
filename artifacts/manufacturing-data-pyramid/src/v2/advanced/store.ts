import { create } from 'zustand';
import type { GraphNode, GraphRel, GraphSample, NodeKind } from './graphTypes';
import { RTM_SAMPLE } from './sampleGraph';
import { INSTITUTE_SAMPLE } from './instituteSample';

export type LoadedSample = GraphSample & { nodeById: Map<string, GraphNode> };

export const SAMPLES: LoadedSample[] = [RTM_SAMPLE, INSTITUTE_SAMPLE].map((sample) => ({
  ...sample,
  nodeById: new Map(sample.nodes.map((node) => [node.id, node])),
}));

export function getSample(id: string) {
  return SAMPLES.find((sample) => sample.id === id) ?? SAMPLES[0];
}

// Presentation-only state for the Advanced prototype; intentionally not persisted.
export type AdvancedView = '3d' | 'network' | 'table';
export type AdvancedTab = 'workflows' | 'relationships' | 'ask' | 'agents';
export type Focus = { kind: 'neighbourhood' | 'evidence'; nodeId: string; hops: number } | null;
export type ProposalStatus = 'proposed' | 'approved' | 'rejected';

function initialProposals(sample: GraphSample) {
  const proposals: Record<string, ProposalStatus> = {};
  [...sample.nodes, ...sample.rels].filter((item) => item.status === 'proposed').forEach((item) => { proposals[item.id] = 'proposed'; });
  return proposals;
}

function sampleState(sample: GraphSample) {
  return {
    sampleId: sample.id,
    selectedNodeId: null,
    selectedRelId: null,
    activeWorkflowId: sample.workflows[0]?.id ?? null,
    focus: null,
    answerId: null,
    hiddenKinds: [] as NodeKind[],
    proposals: initialProposals(sample),
    tour: null,
  };
}

interface AdvancedState {
  sampleId: string;
  view: AdvancedView;
  tab: AdvancedTab;
  selectedNodeId: string | null;
  selectedRelId: string | null;
  activeWorkflowId: string | null;
  focus: Focus;
  answerId: string | null;
  exploded: boolean;
  showLabels: boolean;
  realistic: boolean;
  hiddenKinds: NodeKind[];
  proposals: Record<string, ProposalStatus>;
  tour: { workflowId: string; index: number; playing: boolean } | null;
  setSample: (id: string) => void;
  startTour: (workflowId: string) => void;
  stepTour: (delta: number) => void;
  setTourPlaying: (playing: boolean) => void;
  endTour: () => void;
  setView: (view: AdvancedView) => void;
  setTab: (tab: AdvancedTab) => void;
  selectNode: (id: string | null) => void;
  selectRel: (id: string | null) => void;
  setActiveWorkflow: (id: string | null) => void;
  setFocus: (focus: Focus) => void;
  setAnswer: (id: string | null) => void;
  setExploded: (exploded: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setRealistic: (realistic: boolean) => void;
  toggleKind: (kind: NodeKind) => void;
  setProposal: (id: string, status: ProposalStatus) => void;
  clearHighlight: () => void;
}

export const useAdvancedStore = create<AdvancedState>((set) => ({
  ...sampleState(SAMPLES[0]),
  view: '3d',
  tab: 'workflows',
  exploded: false,
  showLabels: true,
  realistic: false,
  setSample: (id) => set(sampleState(getSample(id))),
  startTour: (workflowId) => set({
    tour: { workflowId, index: 0, playing: false },
    view: '3d',
    activeWorkflowId: workflowId,
    selectedNodeId: null,
    selectedRelId: null,
    focus: null,
    answerId: null,
  }),
  stepTour: (delta) => set((state) => {
    if (!state.tour) return {};
    const last = getTourSteps(getSample(state.sampleId), state.tour.workflowId).length - 1;
    const index = Math.min(last, Math.max(0, state.tour.index + delta));
    return { tour: { ...state.tour, index, playing: state.tour.playing && index < last } };
  }),
  setTourPlaying: (playing) => set((state) => (state.tour ? { tour: { ...state.tour, playing } } : {})),
  endTour: () => set({ tour: null }),
  setView: (view) => set({ view }),
  setTab: (tab) => set({ tab }),
  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedRelId: null }),
  selectRel: (selectedRelId) => set({ selectedRelId }),
  setActiveWorkflow: (activeWorkflowId) => set({ activeWorkflowId, focus: null, answerId: null }),
  setFocus: (focus) => set({ focus, answerId: null }),
  setAnswer: (answerId) => set({ answerId, focus: null }),
  setExploded: (exploded) => set({ exploded }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setRealistic: (realistic) => set({ realistic }),
  toggleKind: (kind) => set((state) => ({
    hiddenKinds: state.hiddenKinds.includes(kind)
      ? state.hiddenKinds.filter((item) => item !== kind)
      : [...state.hiddenKinds, kind],
  })),
  // Approving a proposed node also approves its proposed relationships (and vice versa for rejection).
  setProposal: (id, status) => set((state) => {
    const proposals = { ...state.proposals, [id]: status };
    getSample(state.sampleId).rels
      .filter((rel) => rel.status === 'proposed' && (rel.source === id || rel.target === id))
      .forEach((rel) => { proposals[rel.id] = status; });
    return { proposals };
  }),
  clearHighlight: () => set({ focus: null, answerId: null, activeWorkflowId: null }),
}));

export function useSample() {
  return getSample(useAdvancedStore((state) => state.sampleId));
}

export function useVisibleGraph() {
  const sample = useSample();
  const hiddenKinds = useAdvancedStore((state) => state.hiddenKinds);
  const proposals = useAdvancedStore((state) => state.proposals);
  const nodes = sample.nodes.filter((node) => !hiddenKinds.includes(node.kind) && proposals[node.id] !== 'rejected');
  const ids = new Set(nodes.map((node) => node.id));
  const rels = sample.rels.filter((rel) => ids.has(rel.source) && ids.has(rel.target) && proposals[rel.id] !== 'rejected');
  return { nodes, rels };
}

export function isProposed(item: GraphNode | GraphRel, proposals: Record<string, ProposalStatus>) {
  return item.status === 'proposed' && proposals[item.id] !== 'approved';
}

function neighbourhood(sample: LoadedSample, nodeId: string, hops: number) {
  const nodeIds = new Set([nodeId]);
  const relIds = new Set<string>();
  let frontier = [nodeId];
  for (let hop = 0; hop < hops; hop += 1) {
    const next: string[] = [];
    for (const rel of sample.rels) {
      for (const [from, to] of [[rel.source, rel.target], [rel.target, rel.source]]) {
        if (frontier.includes(from)) {
          relIds.add(rel.id);
          if (!nodeIds.has(to)) { nodeIds.add(to); next.push(to); }
        }
      }
    }
    frontier = next;
  }
  return { nodeIds, relIds };
}

// Upstream trail: follow incoming relationships (what feeds or supports this node), ignoring agent and people edges.
function evidenceTrail(sample: LoadedSample, nodeId: string) {
  const nodeIds = new Set([nodeId]);
  const relIds = new Set<string>();
  const queue = [nodeId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const rel of sample.rels) {
      const sourceKind = sample.nodeById.get(rel.source)?.kind;
      if (rel.target !== current || sourceKind === 'agent' || sourceKind === 'person') continue;
      relIds.add(rel.id);
      if (!nodeIds.has(rel.source)) { nodeIds.add(rel.source); queue.push(rel.source); }
    }
  }
  return { nodeIds, relIds };
}

export function workflowSets(sample: GraphSample, workflowId: string) {
  const workflow = sample.workflows.find((item) => item.id === workflowId);
  const relIds = new Set(workflow?.stages.flatMap((stage) => stage.relIds) ?? []);
  const nodeIds = new Set(sample.rels.filter((rel) => relIds.has(rel.id)).flatMap((rel) => [rel.source, rel.target]));
  return { nodeIds, relIds };
}

export type TourStep =
  | { kind: 'intro' | 'outro'; title: string; text: string }
  | { kind: 'rel'; relId: string; stage: string; title: string; text: string };

export function getTourSteps(sample: GraphSample, workflowId: string): TourStep[] {
  const workflow = sample.workflows.find((item) => item.id === workflowId);
  if (!workflow) return [];
  const relCount = workflow.stages.reduce((sum, stage) => sum + stage.relIds.length, 0);
  return [
    { kind: 'intro', title: workflow.name, text: `${workflow.description} ${relCount} connections across ${workflow.stages.length} stages. Press Space to walk through them.` },
    ...workflow.stages.flatMap((stage) => stage.relIds.map((relId): TourStep => ({
      kind: 'rel',
      relId,
      stage: stage.title,
      title: sample.story[relId]?.title ?? stage.title,
      text: sample.story[relId]?.text ?? '',
    }))),
    { kind: 'outro', title: 'The whole pipeline', text: 'Every step is a typed relationship in one shared graph. An agent can follow this playbook, and cite each node it passed through.' },
  ];
}

export type Highlight = {
  nodeIds: Set<string>;
  relIds: Set<string>;
  // Shown faintly as context (e.g. tour steps already visited).
  secondaryNodeIds?: Set<string>;
  secondaryRelIds?: Set<string>;
  color: string;
  source: string;
} | null;

export function useHighlight(): Highlight {
  const sample = useSample();
  const answerId = useAdvancedStore((state) => state.answerId);
  const focus = useAdvancedStore((state) => state.focus);
  const activeWorkflowId = useAdvancedStore((state) => state.activeWorkflowId);
  const tour = useAdvancedStore((state) => state.tour);
  if (tour) {
    const workflow = sample.workflows.find((item) => item.id === tour.workflowId);
    const steps = getTourSteps(sample, tour.workflowId);
    const step = steps[tour.index];
    const color = workflow?.color ?? '#22d3ee';
    if (!step || step.kind !== 'rel') return { ...workflowSets(sample, tour.workflowId), color, source: 'Story' };
    const rel = sample.rels.find((item) => item.id === step.relId)!;
    const visited = steps.slice(1, tour.index).flatMap((item) => (item.kind === 'rel' ? [item.relId] : []));
    const visitedRels = sample.rels.filter((item) => visited.includes(item.id));
    return {
      nodeIds: new Set([rel.source, rel.target]),
      relIds: new Set([rel.id]),
      secondaryNodeIds: new Set(visitedRels.flatMap((item) => [item.source, item.target])),
      secondaryRelIds: new Set(visited),
      color,
      source: 'Story',
    };
  }
  if (answerId) {
    const answer = sample.ask.find((item) => item.id === answerId);
    if (answer) return { nodeIds: new Set(answer.nodeIds), relIds: new Set(answer.relIds), color: '#f472b6', source: 'Answer path' };
  }
  if (focus) {
    const sets = focus.kind === 'neighbourhood' ? neighbourhood(sample, focus.nodeId, focus.hops) : evidenceTrail(sample, focus.nodeId);
    return { ...sets, color: focus.kind === 'neighbourhood' ? '#facc15' : '#fb923c', source: focus.kind === 'neighbourhood' ? `Neighbourhood · ${focus.hops} hop${focus.hops > 1 ? 's' : ''}` : 'Evidence trail' };
  }
  if (activeWorkflowId) {
    const workflow = sample.workflows.find((item) => item.id === activeWorkflowId);
    if (workflow) return { ...workflowSets(sample, workflow.id), color: workflow.color, source: workflow.name };
  }
  return null;
}
