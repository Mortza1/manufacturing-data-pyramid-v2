import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, Bot, Box, Briefcase, CalendarClock, Car, CircleDot, ClipboardCheck, ClipboardList, Cpu, Database, Factory, FileText, Flag, Gauge, Layers, Search, Siren, User, Wrench, type LucideIcon, Check, ChevronLeft, ChevronRight, Crosshair, Expand, Footprints, GitBranch, Network, Pause, Play, Sparkles, Table2, Tag, Workflow, X, Shapes } from 'lucide-react';
import { KIND_STYLE, levelStartFraction, type GraphNode, type GraphRel, type NodeKind } from './graphTypes';
import { SAMPLES, getTourSteps, isProposed, useAdvancedStore, useHighlight, useSample, useVisibleGraph, workflowSets, type AdvancedTab } from './store';

// Icons for Realistic mode, mirroring the 3D models in RealisticModels.tsx.
const LABEL_ICONS: Record<string, LucideIcon> = {
  Machine: Factory, DataStream: Activity, Dataset: Database, Inspection: ClipboardList, FollowUp: ClipboardList,
  Plan: ClipboardCheck, Decision: ClipboardCheck, Event: Siren, KPI: Gauge, Summary: BarChart3, Report: FileText,
  Finding: Search, AnalysisModel: Cpu, Action: Wrench, Outcome: Flag, Role: User, Agent: Bot, Material: Layers,
  Hole: CircleDot, MachiningVisit: CalendarClock, Asset: Car, Project: Briefcase,
};

function NodeIcon({ node, size }: { node: GraphNode; size: number }) {
  const Icon = LABEL_ICONS[node.label] ?? CircleDot;
  return <Icon size={size} style={{ color: KIND_STYLE[node.kind].color }} className="shrink-0" />;
}

const panel = 'pointer-events-auto rounded-xl border border-fuchsia-300/20 bg-[#0a0812]/95 shadow-2xl backdrop-blur-xl';

function KindDot({ kind }: { kind: NodeKind }) {
  return <i className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: KIND_STYLE[kind].color }} />;
}

function NodeChip({ id }: { id: string }) {
  const sample = useSample();
  const selectNode = useAdvancedStore((state) => state.selectNode);
  const node = sample.nodeById.get(id);
  if (!node) return null;
  return (
    <button onClick={() => selectNode(id)} className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-200 hover:border-white/30">
      <KindDot kind={node.kind} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function RelRow({ rel, compact }: { rel: GraphRel; compact?: boolean }) {
  const sample = useSample();
  const selectedRelId = useAdvancedStore((state) => state.selectedRelId);
  const selectRel = useAdvancedStore((state) => state.selectRel);
  const proposals = useAdvancedStore((state) => state.proposals);
  const usedBy = sample.workflows.filter((workflow) => workflow.stages.some((stage) => stage.relIds.includes(rel.id)));
  return (
    <button
      onClick={() => selectRel(selectedRelId === rel.id ? null : rel.id)}
      className={`flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors ${selectedRelId === rel.id ? 'border-white/40 bg-white/10' : 'border-white/5 bg-white/[0.02] hover:border-white/20'} ${isProposed(rel, proposals) ? 'border-dashed' : ''}`}
    >
      <span className="min-w-0 flex-1 truncate text-slate-200">{sample.nodeById.get(rel.source)?.name}</span>
      <span className="shrink-0 rounded bg-black/50 px-1 font-mono text-[9px] text-fuchsia-200">{rel.type} →</span>
      <span className="min-w-0 flex-1 truncate text-right text-slate-200">{sample.nodeById.get(rel.target)?.name}</span>
      {!compact && usedBy.map((workflow) => <i key={workflow.id} title={workflow.name} className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: workflow.color }} />)}
    </button>
  );
}

function WorkflowsTab() {
  const sample = useSample();
  const activeWorkflowId = useAdvancedStore((state) => state.activeWorkflowId);
  const setActiveWorkflow = useAdvancedStore((state) => state.setActiveWorkflow);
  const startTour = useAdvancedStore((state) => state.startTour);
  const relById = new Map(sample.rels.map((rel) => [rel.id, rel]));
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-slate-400">Workflows are agent playbooks: ordered routes through <em>shared</em> relationships. Stages can branch and merge, and a node can appear in many workflows.</p>
      {sample.workflows.map((workflow) => {
        const active = workflow.id === activeWorkflowId;
        const { nodeIds } = workflowSets(sample, workflow.id);
        const shared = sample.workflows.filter((other) => other.id !== workflow.id)
          .flatMap((other) => Array.from(workflowSets(sample, other.id).nodeIds))
          .filter((id) => nodeIds.has(id));
        return (
          <div key={workflow.id} className={`relative rounded-lg border transition-colors ${active ? 'bg-white/[0.04]' : 'border-white/10 hover:border-white/25'}`} style={active ? { borderColor: `${workflow.color}88` } : undefined}>
            <button
              onClick={() => startTour(workflow.id)}
              title="Play this workflow as a story"
              className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-black shadow"
              style={{ backgroundColor: workflow.color }}
            >
              <Play size={11} />Story
            </button>
            <button onClick={() => setActiveWorkflow(active ? null : workflow.id)} className="w-full p-3 pr-20 text-left">
              <div className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: workflow.color, boxShadow: `0 0 10px ${workflow.color}` }} />
                <span className="text-sm font-semibold text-slate-100">{workflow.name}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{workflow.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">{workflow.stages.length} stages</span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">{nodeIds.size} nodes</span>
                {shared.length > 0 && <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-amber-200">{new Set(shared).size} shared with other workflows</span>}
              </div>
            </button>
            {active && (
              <ol className="space-y-2 border-t border-white/10 p-3">
                {workflow.stages.map((stage, index) => (
                  <li key={stage.title}>
                    <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-slate-300">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-black" style={{ backgroundColor: workflow.color }}>{index + 1}</span>
                      {stage.title}
                      {stage.relIds.length > 1 && <span className="flex items-center gap-0.5 text-[9px] font-normal text-slate-500"><GitBranch size={10} />branches</span>}
                    </div>
                    <div className="space-y-1 pl-6">
                      {stage.relIds.map((id) => relById.get(id)).filter((rel): rel is GraphRel => Boolean(rel)).map((rel) => <RelRow key={rel.id} rel={rel} compact />)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        );
      })}
      <button disabled className="w-full rounded-lg border border-dashed border-white/15 py-2 text-xs text-slate-500">+ New workflow (prototype)</button>
    </div>
  );
}

function RelationshipsTab() {
  const { rels } = useVisibleGraph();
  const [type, setType] = useState('all');
  const types = Array.from(new Set(rels.map((rel) => rel.type))).sort();
  const shown = rels.filter((rel) => type === 'all' || rel.type === type);
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-slate-400">Relationships are facts, independent of any workflow. Dots show which workflows reuse each one.</p>
      <div className="flex items-center gap-2">
        <select value={type} onChange={(event) => setType(event.target.value)} className="flex-1 rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-xs text-slate-200">
          <option value="all">All types ({rels.length})</option>
          {types.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button disabled className="rounded-md border border-dashed border-white/15 px-2 py-1.5 text-xs text-slate-500">+ Link</button>
      </div>
      <div className="space-y-1">{shown.map((rel) => <RelRow key={rel.id} rel={rel} />)}</div>
    </div>
  );
}

function AskTab() {
  const sample = useSample();
  const answerId = useAdvancedStore((state) => state.answerId);
  const setAnswer = useAdvancedStore((state) => state.setAnswer);
  const answer = sample.ask.find((item) => item.id === answerId);
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-slate-400">Guided questions are graph traversals; the answer path lights up in the pyramid. Prototype answers are canned.</p>
      <div className="space-y-1.5">
        {sample.ask.map((item) => (
          <button
            key={item.id}
            onClick={() => setAnswer(answerId === item.id ? null : item.id)}
            className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${answerId === item.id ? 'border-pink-300/60 bg-pink-400/10 text-pink-50' : 'border-white/10 text-slate-200 hover:border-white/25'}`}
          >
            {item.agent ? <Bot size={14} className="mt-0.5 shrink-0 text-pink-300" /> : <Footprints size={14} className="mt-0.5 shrink-0 text-slate-400" />}
            {item.question}
          </button>
        ))}
      </div>
      {answer && (
        <div className="rounded-lg border border-pink-300/30 bg-pink-400/[0.06] p-3">
          <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-pink-300">
            {answer.agent ? <><Bot size={12} />Quality Investigation Agent</> : <><Footprints size={12} />Graph traversal</>}
          </p>
          <p className="text-xs leading-relaxed text-slate-100">{answer.answer}</p>
          {answer.caveat && <p className="mt-2 rounded border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[11px] text-amber-100">⚠ {answer.caveat}</p>}
          <p className="mt-3 mb-1 text-[10px] uppercase tracking-wider text-slate-500">Cited nodes ({answer.nodeIds.length})</p>
          <div className="flex flex-wrap gap-1">{answer.nodeIds.map((id) => <NodeChip key={id} id={id} />)}</div>
        </div>
      )}
      <div className="flex gap-2">
        <input disabled placeholder="Ask the agent… (prototype)" className="flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs placeholder:text-slate-600" />
        <button disabled className="rounded-md bg-pink-400/20 px-2 text-pink-200/50"><Sparkles size={14} /></button>
      </div>
    </div>
  );
}

function AgentsTab() {
  const sample = useSample();
  const setFocus = useAdvancedStore((state) => state.setFocus);
  const proposals = useAdvancedStore((state) => state.proposals);
  const setProposal = useAdvancedStore((state) => state.setProposal);
  const agents = sample.nodes.filter((node) => node.kind === 'agent');
  const proposedNodes = sample.nodes.filter((node) => node.status === 'proposed');
  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <div key={agent.id} className="rounded-lg border border-pink-300/25 bg-pink-400/[0.05] p-3">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-pink-300" />
            <span className="text-sm font-semibold text-pink-50">{agent.name}</span>
            <span className="ml-auto rounded bg-amber-300/15 px-1.5 py-0.5 text-[9px] uppercase text-amber-200">{agent.props.autonomy ?? 'Proposed'}</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">{agent.level ? `L${agent.level}` : 'Agent layer'}{agent.sector !== undefined && sample.sectors ? ` · ${sample.sectors[agent.sector].name}` : ''}{agent.props.cadence ? ` · ${agent.props.cadence}` : ''}</p>
          <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Tools</p>
          <div className="mt-1 flex flex-wrap gap-1">{(agent.props.tools ?? '').split(', ').filter(Boolean).map((tool) => <code key={tool} className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-pink-100">{tool}</code>)}</div>
          <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">Access</p>
          <div className="mt-1 space-y-1">
            {sample.rels.filter((rel) => rel.source === agent.id).map((rel) => (
              <div key={rel.id} className="flex items-center gap-1.5 text-[11px]"><code className="w-20 shrink-0 text-[9px] text-pink-300">{rel.type}</code><NodeChip id={rel.target} /></div>
            ))}
          </div>
          <button onClick={() => setFocus({ kind: 'neighbourhood', nodeId: agent.id, hops: 1 })} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-pink-300/30 py-1.5 text-xs text-pink-100 hover:bg-pink-400/10">
            <Crosshair size={12} />Show access scope
          </button>
        </div>
      ))}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Proposals awaiting review</p>
        {proposedNodes.map((node) => {
          const status = proposals[node.id];
          return (
            <div key={node.id} className="rounded-lg border border-dashed border-white/20 p-3">
              <div className="flex items-center gap-1.5"><KindDot kind={node.kind} /><span className="text-xs font-semibold text-slate-100">{node.name}</span></div>
              <p className="mt-1 text-[11px] text-slate-400">{node.props.statement}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                by {node.createdBy}
                {sample.rels.filter((item) => item.status === 'proposed' && (item.source === node.id || item.target === node.id)).map((item) => (
                  <span key={item.id}> · {item.source === node.id ? `${item.type} → ${sample.nodeById.get(item.target)?.name}` : `${sample.nodeById.get(item.source)?.name} ${item.type} →`}</span>
                ))}
              </p>
              {status === 'proposed' ? (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setProposal(node.id, 'approved')} className="flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-400/15 py-1 text-xs text-emerald-200 hover:bg-emerald-400/25"><Check size={12} />Approve</button>
                  <button onClick={() => setProposal(node.id, 'rejected')} className="flex flex-1 items-center justify-center gap-1 rounded-md bg-rose-400/15 py-1 text-xs text-rose-200 hover:bg-rose-400/25"><X size={12} />Reject</button>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className={status === 'approved' ? 'text-emerald-300' : 'text-rose-300'}>{status === 'approved' ? 'Approved — now part of the graph' : 'Rejected — hidden'}</span>
                  <button onClick={() => setProposal(node.id, 'proposed')} className="text-slate-400 underline">Undo</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TABS: { id: AdvancedTab; label: string; icon: React.ReactNode }[] = [
  { id: 'workflows', label: 'Workflows', icon: <Workflow size={13} /> },
  { id: 'relationships', label: 'Relations', icon: <Network size={13} /> },
  { id: 'ask', label: 'Ask', icon: <Sparkles size={13} /> },
  { id: 'agents', label: 'Agents', icon: <Bot size={13} /> },
];

function SidePanel() {
  const sample = useSample();
  const tab = useAdvancedStore((state) => state.tab);
  const setTab = useAdvancedStore((state) => state.setTab);
  const setSample = useAdvancedStore((state) => state.setSample);
  return (
    <aside className={`${panel} absolute left-4 top-16 bottom-4 z-20 flex w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden`}>
      <header className="shrink-0 border-b border-fuchsia-300/15 bg-fuchsia-400/[0.06] px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-300/80">Advanced / Knowledge Graph</p>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-black/30 p-1">
          {SAMPLES.map((item) => (
            <button key={item.id} onClick={() => setSample(item.id)} className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${item.id === sample.id ? 'bg-fuchsia-400/20 text-fuchsia-50' : 'text-slate-400 hover:bg-white/5'}`}>
              {item.title}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">{sample.subtitle} · {sample.nodes.length} nodes · {sample.rels.length} relationships</p>
      </header>
      <nav className="grid shrink-0 grid-cols-4 gap-1 border-b border-white/10 p-1.5">
        {TABS.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors ${tab === item.id ? 'bg-fuchsia-400/20 text-fuchsia-100' : 'text-slate-400 hover:bg-white/5'}`}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === 'workflows' && <WorkflowsTab />}
        {tab === 'relationships' && <RelationshipsTab />}
        {tab === 'ask' && <AskTab />}
        {tab === 'agents' && <AgentsTab />}
      </div>
    </aside>
  );
}

function Inspector() {
  const sample = useSample();
  const selectedNodeId = useAdvancedStore((state) => state.selectedNodeId);
  const selectedRelId = useAdvancedStore((state) => state.selectedRelId);
  const selectNode = useAdvancedStore((state) => state.selectNode);
  const selectRel = useAdvancedStore((state) => state.selectRel);
  const setFocus = useAdvancedStore((state) => state.setFocus);
  const proposals = useAdvancedStore((state) => state.proposals);
  const rel = sample.rels.find((item) => item.id === selectedRelId);
  const node = selectedNodeId ? sample.nodeById.get(selectedNodeId) : undefined;
  if (!node && !rel) return null;

  if (rel) {
    const usedBy = sample.workflows.filter((workflow) => workflow.stages.some((stage) => stage.relIds.includes(rel.id)));
    return (
      <aside className={`${panel} absolute right-4 top-16 z-20 w-[min(320px,calc(100vw-2rem))] p-4`}>
        <div className="flex items-start justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-300/80">Relationship</p>
          <button onClick={() => selectRel(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
        <p className="mt-2 font-mono text-lg font-bold text-fuchsia-50">{rel.type}</p>
        {isProposed(rel, proposals) && <p className="text-[11px] text-amber-200">Proposed by agent · awaiting review</p>}
        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex items-center gap-2"><span className="w-12 text-slate-500">From</span><NodeChip id={rel.source} /></div>
          <div className="flex items-center gap-2"><span className="w-12 text-slate-500">To</span><NodeChip id={rel.target} /></div>
        </div>
        <p className="mt-4 mb-1 text-[10px] uppercase tracking-wider text-slate-500">Used by workflows</p>
        {usedBy.length ? usedBy.map((workflow) => (
          <div key={workflow.id} className="flex items-center gap-2 text-xs text-slate-200"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: workflow.color }} />{workflow.name}</div>
        )) : <p className="text-xs text-slate-500">None — a standalone fact.</p>}
      </aside>
    );
  }

  if (!node) return null;
  const outgoing = sample.rels.filter((item) => item.source === node.id);
  const incoming = sample.rels.filter((item) => item.target === node.id);
  const workflows = sample.workflows.filter((workflow) => workflowSets(sample, workflow.id).nodeIds.has(node.id));
  const level = sample.levels.find((item) => item.level === node.level);
  return (
    <aside className={`${panel} absolute right-4 top-16 bottom-24 z-20 flex w-[min(320px,calc(100vw-2rem))] flex-col overflow-hidden`}>
      <header className="shrink-0 border-b border-white/10 p-4">
        <div className="flex items-start justify-between">
          <span className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase" style={{ backgroundColor: `${KIND_STYLE[node.kind].color}22`, color: KIND_STYLE[node.kind].color }}>:{node.label}</span>
          <button onClick={() => selectNode(null)} className="text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
        <h3 className="mt-2 text-lg font-bold text-slate-50">{node.name}</h3>
        <p className="text-[11px] text-slate-400">{KIND_STYLE[node.kind].title} · {level ? `L${level.level} ${level.name}` : 'Agent layer (outside the pyramid)'}{node.sector !== undefined && sample.sectors ? ` · ${sample.sectors[node.sector].name}` : ''}</p>
        {isProposed(node, proposals) && <p className="mt-1 text-[11px] text-amber-200">Proposed by agent · awaiting review</p>}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <button onClick={() => setFocus({ kind: 'neighbourhood', nodeId: node.id, hops: 1 })} className="rounded-md border border-yellow-300/30 py-1.5 text-[11px] text-yellow-100 hover:bg-yellow-300/10">1 hop</button>
          <button onClick={() => setFocus({ kind: 'neighbourhood', nodeId: node.id, hops: 2 })} className="rounded-md border border-yellow-300/30 py-1.5 text-[11px] text-yellow-100 hover:bg-yellow-300/10">2 hops</button>
          <button onClick={() => setFocus({ kind: 'evidence', nodeId: node.id, hops: 0 })} className="rounded-md border border-orange-300/30 py-1.5 text-[11px] text-orange-100 hover:bg-orange-300/10">Evidence</button>
        </div>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <section>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Properties</p>
          <dl className="space-y-1 text-xs">
            {Object.entries(node.props).map(([key, value]) => (
              <div key={key} className="flex gap-2"><dt className="w-24 shrink-0 font-mono text-[10px] text-slate-500">{key}</dt><dd className="text-slate-200">{value}</dd></div>
            ))}
            <div className="flex gap-2"><dt className="w-24 shrink-0 font-mono text-[10px] text-slate-500">created_by</dt><dd className="text-slate-400">{node.createdBy}</dd></div>
          </dl>
        </section>
        <section>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Outgoing ({outgoing.length})</p>
          <div className="space-y-1">{outgoing.map((item) => <div key={item.id} className="flex items-center gap-1.5"><code className="shrink-0 text-[9px] text-fuchsia-300">{item.type} →</code><NodeChip id={item.target} /></div>)}</div>
        </section>
        <section>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Incoming ({incoming.length})</p>
          <div className="space-y-1">{incoming.map((item) => <div key={item.id} className="flex items-center gap-1.5"><NodeChip id={item.source} /><code className="shrink-0 text-[9px] text-fuchsia-300">→ {item.type}</code></div>)}</div>
        </section>
        <section>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">In workflows</p>
          {workflows.length ? workflows.map((workflow) => (
            <div key={workflow.id} className="flex items-center gap-2 text-xs text-slate-200"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: workflow.color }} />{workflow.name}</div>
          )) : <p className="text-xs text-slate-500">Not part of any workflow.</p>}
        </section>
      </div>
    </aside>
  );
}

function Toolbar() {
  const sample = useSample();
  const view = useAdvancedStore((state) => state.view);
  const setView = useAdvancedStore((state) => state.setView);
  const exploded = useAdvancedStore((state) => state.exploded);
  const setExploded = useAdvancedStore((state) => state.setExploded);
  const showLabels = useAdvancedStore((state) => state.showLabels);
  const setShowLabels = useAdvancedStore((state) => state.setShowLabels);
  const hiddenKinds = useAdvancedStore((state) => state.hiddenKinds);
  const toggleKind = useAdvancedStore((state) => state.toggleKind);
  const clearHighlight = useAdvancedStore((state) => state.clearHighlight);
  const realistic = useAdvancedStore((state) => state.realistic);
  const setRealistic = useAdvancedStore((state) => state.setRealistic);
  const startTour = useAdvancedStore((state) => state.startTour);
  const activeWorkflowId = useAdvancedStore((state) => state.activeWorkflowId);
  const highlight = useHighlight();
  const viewButton = (id: typeof view, label: string, icon: React.ReactNode) => (
    <button onClick={() => setView(id)} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${view === id ? 'bg-fuchsia-400/20 text-fuchsia-100' : 'text-slate-400 hover:bg-white/5'}`}>{icon}{label}</button>
  );
  const toggle = (active: boolean, onClick: () => void, label: string, icon: React.ReactNode) => (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}>{icon}{label}</button>
  );
  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex flex-col items-center gap-2 md:left-[388px]">
      <div className={`${panel} flex flex-wrap items-center justify-center gap-1 px-2 py-1.5`}>
        {(Object.keys(KIND_STYLE) as NodeKind[]).filter((kind) => sample.nodes.some((node) => node.kind === kind)).map((kind) => (
          <button key={kind} onClick={() => toggleKind(kind)} className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] ${hiddenKinds.includes(kind) ? 'text-slate-600 line-through' : 'text-slate-300 hover:bg-white/5'}`}>
            <KindDot kind={kind} />{KIND_STYLE[kind].title}
          </button>
        ))}
      </div>
      <div className={`${panel} flex flex-wrap items-center justify-center gap-1 p-1.5`}>
        {viewButton('3d', 'Pyramid', <Box size={13} />)}
        {viewButton('network', 'Network', <Network size={13} />)}
        {viewButton('table', 'Table', <Table2 size={13} />)}
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button onClick={() => startTour(activeWorkflowId ?? sample.workflows[0].id)} title="Walk through the workflow step by step" className="flex items-center gap-1.5 rounded-md bg-cyan-400/15 px-2.5 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/25"><Play size={13} />Story</button>
        {toggle(exploded, () => setExploded(!exploded), 'Explode', <Expand size={13} />)}
        {toggle(showLabels, () => setShowLabels(!showLabels), 'Labels', <Tag size={13} />)}
        {toggle(realistic, () => setRealistic(!realistic), 'Realistic', <Shapes size={13} />)}
        {highlight && (
          <>
            <span className="mx-1 h-5 w-px bg-white/10" />
            <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs" style={{ color: highlight.color, backgroundColor: `${highlight.color}1a` }}>
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: highlight.color }} />{highlight.source}
            </span>
            <button onClick={clearHighlight} title="Show whole graph" className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"><X size={13} /></button>
          </>
        )}
      </div>
    </div>
  );
}

function useInspectorOpen() {
  return useAdvancedStore((state) => Boolean(state.selectedNodeId || state.selectedRelId));
}

function NetworkView() {
  const sample = useSample();
  const { nodes, rels } = useVisibleGraph();
  const highlight = useHighlight();
  const selectedNodeId = useAdvancedStore((state) => state.selectedNodeId);
  const selectedRelId = useAdvancedStore((state) => state.selectedRelId);
  const selectNode = useAdvancedStore((state) => state.selectNode);
  const selectRel = useAdvancedStore((state) => state.selectRel);
  const proposals = useAdvancedStore((state) => state.proposals);
  const realistic = useAdvancedStore((state) => state.realistic);
  const W = 1000;
  // Triangle: apex at `top`, base at `top + H`, same level weights as the 3D pyramid.
  const top = 80;
  const H = 620;
  const halfAt = (y: number) => 480 * ((y - top) / H);
  const band = (level: number) => ({
    y1: top + H * (1 - (level === sample.levels.length ? 1 : levelStartFraction(sample.levels, level + 1))),
    y2: top + H * (1 - levelStartFraction(sample.levels, level)),
  });
  const pos = new Map<string, { x: number; y: number; labelAbove?: boolean; small?: boolean }>();
  sample.levels.forEach(({ level }) => {
    const onLevel = nodes.filter((node) => node.level === level).sort((a, b) => (a.sector ?? 9) - (b.sector ?? 9) || Number(a.kind === 'agent') - Number(b.kind === 'agent'));
    const { y1, y2 } = band(level);
    const cy = y2 - Math.min(60, (y2 - y1) * 0.4);
    const half = halfAt(cy) - 30;
    onLevel.forEach((node, i) => {
      const x = onLevel.length === 1 ? W / 2 : W / 2 - half + (2 * half * i) / (onLevel.length - 1);
      // Crowded levels stagger nodes up/down and put labels on the outer side of each row.
      const crowded = onLevel.length > 3;
      pos.set(node.id, { x, y: cy + (crowded ? (i % 2 ? 18 : -18) : 0), labelAbove: crowded && i % 2 === 0, small: onLevel.length > 5 });
    });
  });
  nodes.filter((node) => node.level === null).forEach((node, i) => pos.set(node.id, { x: W / 2 + 260 + i * 120, y: 50 }));

  return (
    <div className={`pointer-events-auto absolute inset-x-4 top-24 bottom-28 md:left-[388px] ${useInspectorOpen() ? 'md:right-[344px]' : 'md:right-4'}`}>
      <svg viewBox="0 0 1000 720" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="adv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke" /></marker>
        </defs>
        {sample.levels.map(({ level, name, color }) => {
          const { y1, y2 } = band(level);
          const points = `${W / 2 - halfAt(y1)},${y1} ${W / 2 + halfAt(y1)},${y1} ${W / 2 + halfAt(y2)},${y2} ${W / 2 - halfAt(y2)},${y2}`;
          const labelY = (y1 + y2) / 2;
          return (
            <g key={level}>
              <polygon points={points} fill={color} fillOpacity={0.06} stroke={color} strokeOpacity={0.35} />
              <text x={W / 2 - halfAt(y2) - 10} y={labelY} textAnchor="end" fontSize="13" fill="#a5f3fc" fontWeight={600}>L{level}</text>
              <text x={W / 2 - halfAt(y2) - 10} y={labelY + 15} textAnchor="end" fontSize="10" fill="#64748b">{name}</text>
            </g>
          );
        })}
        {nodes.some((node) => node.level === null) && <text x={W / 2 + 200} y={54} textAnchor="end" fontSize="11" fill="#f9a8d4">Agent layer</text>}
        {rels.map((rel) => {
          const a = pos.get(rel.source);
          const b = pos.get(rel.target);
          if (!a || !b) return null;
          const lit = highlight?.relIds.has(rel.id) ?? false;
          const selected = rel.id === selectedRelId;
          const agentEdge = rel.source.startsWith('agent-');
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const length = Math.hypot(dx, dy) || 1;
          const ex = b.x - (dx / length) * 15;
          const ey = b.y - (dy / length) * 15;
          const cx = (a.x + ex) / 2 - (dy / length) * 30;
          const cy = (a.y + ey) / 2 + (dx / length) * 30;
          const stroke = selected ? '#ffffff' : lit ? highlight!.color : agentEdge ? '#f472b6' : '#64748b';
          const faded = highlight && !lit && !selected;
          return (
            <g key={rel.id} onClick={() => selectRel(selected ? null : rel.id)} className="cursor-pointer">
              <path d={`M${a.x},${a.y} Q${cx},${cy} ${ex},${ey}`} fill="none" stroke="transparent" strokeWidth={10} />
              <path d={`M${a.x},${a.y} Q${cx},${cy} ${ex},${ey}`} fill="none" stroke={stroke} strokeWidth={selected ? 2.5 : lit ? 2 : 1} strokeOpacity={faded ? 0.12 : 0.85} strokeDasharray={agentEdge || isProposed(rel, proposals) ? '4 3' : undefined} markerEnd="url(#adv-arrow)" />
              {(lit || selected) && <text x={(a.x + 2 * cx + ex) / 4} y={(a.y + 2 * cy + ey) / 4} textAnchor="middle" fontSize="8" fill="#e2e8f0" stroke="#000" strokeWidth={3} paintOrder="stroke" fontFamily="monospace">{rel.type}</text>}
            </g>
          );
        })}
        {nodes.map((node) => {
          const p = pos.get(node.id);
          if (!p) return null;
          const lit = highlight?.nodeIds.has(node.id) ?? false;
          const faded = highlight && !lit;
          const selected = node.id === selectedNodeId;
          return (
            <g key={node.id} transform={`translate(${p.x},${p.y})`} onClick={() => selectNode(selected ? null : node.id)} className="cursor-pointer" opacity={faded ? 0.25 : 1}>
              <circle r={realistic ? (selected ? 15 : 12) : selected ? 13 : 10} fill={realistic ? '#0b1220' : KIND_STYLE[node.kind].color} fillOpacity={isProposed(node, proposals) ? 0.25 : 0.9} stroke={selected ? '#fff' : lit ? highlight!.color : '#0f172a'} strokeWidth={selected || lit ? 3 : 1.5} strokeDasharray={isProposed(node, proposals) ? '3 2' : undefined} />
              {realistic && (() => { const Icon = LABEL_ICONS[node.label] ?? CircleDot; return <Icon x={-8} y={-8} width={16} height={16} color={KIND_STYLE[node.kind].color} strokeWidth={2} />; })()}
              <text y={p.labelAbove ? -16 : 24} textAnchor="middle" fontSize={p.small ? 8.5 : 10} fill="#e2e8f0" stroke="#05070d" strokeWidth={3} paintOrder="stroke">{node.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TableView() {
  const { nodes, rels } = useVisibleGraph();
  const selectNode = useAdvancedStore((state) => state.selectNode);
  const selectedNodeId = useAdvancedStore((state) => state.selectedNodeId);
  const level = (node: GraphNode) => node.level ? `L${node.level}` : 'Agent';
  return (
    <div className={`pointer-events-auto absolute inset-x-4 top-24 bottom-28 grid gap-3 overflow-hidden md:left-[388px] md:grid-cols-2 ${useInspectorOpen() ? 'md:right-[344px]' : 'md:right-4'}`}>
      <div className={`${panel} flex min-h-0 flex-col overflow-hidden`}>
        <p className="shrink-0 border-b border-white/10 px-3 py-2 text-xs font-semibold text-slate-200">Nodes ({nodes.length})</p>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-[#0a0812] text-slate-500"><tr><th className="px-3 py-1.5">Name</th><th>Label</th><th>Level</th><th>Created by</th></tr></thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id} onClick={() => selectNode(node.id)} className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${selectedNodeId === node.id ? 'bg-white/10' : ''}`}>
                  <td className="px-3 py-1.5 text-slate-100"><span className="flex items-center gap-1.5"><KindDot kind={node.kind} />{node.name}</span></td>
                  <td className="font-mono text-slate-400">{node.label}</td>
                  <td className="text-slate-400">{level(node)}</td>
                  <td className="text-slate-500">{node.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={`${panel} flex min-h-0 flex-col overflow-hidden`}>
        <p className="shrink-0 border-b border-white/10 px-3 py-2 text-xs font-semibold text-slate-200">Relationships ({rels.length})</p>
        <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">{rels.map((rel) => <RelRow key={rel.id} rel={rel} />)}</div>
      </div>
    </div>
  );
}

function StoryBoard() {
  const sample = useSample();
  const tour = useAdvancedStore((state) => state.tour)!;
  const stepTour = useAdvancedStore((state) => state.stepTour);
  const setTourPlaying = useAdvancedStore((state) => state.setTourPlaying);
  const endTour = useAdvancedStore((state) => state.endTour);
  const workflow = sample.workflows.find((item) => item.id === tour.workflowId);
  const steps = getTourSteps(sample, tour.workflowId);
  const step = steps[tour.index];
  const last = tour.index === steps.length - 1;

  useEffect(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === ' ' || event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        stepTour(event.shiftKey ? -1 : 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'Backspace' || event.key === 'PageUp') {
        event.preventDefault();
        stepTour(-1);
      } else if (event.key === 'Escape') {
        endTour();
      } else if (event.key.toLowerCase() === 'p') {
        setTourPlaying(!useAdvancedStore.getState().tour?.playing);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepTour, endTour, setTourPlaying]);

  useEffect(() => {
    if (!tour.playing) return;
    const timer = window.setTimeout(() => stepTour(1), 6000);
    return () => window.clearTimeout(timer);
  }, [tour.playing, tour.index, stepTour]);

  if (!workflow || !step) return null;
  const rel = step.kind === 'rel' ? sample.rels.find((item) => item.id === step.relId) : undefined;
  const source = rel && sample.nodeById.get(rel.source);
  const target = rel && sample.nodeById.get(rel.target);
  const realistic = useAdvancedStore((state) => state.realistic);
  const pill = (node: GraphNode) => (
    <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-semibold text-slate-50" style={{ borderColor: `${KIND_STYLE[node.kind].color}66`, backgroundColor: `${KIND_STYLE[node.kind].color}14` }}>
      {realistic ? <NodeIcon node={node} size={15} /> : <KindDot kind={node.kind} />}{node.name}
      <span className="font-mono text-[10px] font-normal text-slate-400">{node.level ? `L${node.level}` : 'Agent'}</span>
    </span>
  );

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-6 z-30 flex justify-center">
      <div key={tour.index} className={`${panel} w-[min(760px,100%)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500`} style={{ borderColor: `${workflow.color}55` }}>
        <div className="flex h-1 w-full gap-px bg-black/40">
          {steps.map((_, index) => (
            <i key={index} className="h-full flex-1 transition-colors" style={{ backgroundColor: index <= tour.index ? workflow.color : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <i className="h-2 w-2 rounded-full" style={{ backgroundColor: workflow.color, boxShadow: `0 0 10px ${workflow.color}` }} />
            <span className="font-semibold text-slate-200">{workflow.name}</span>
            {step.kind === 'rel' && <span className="rounded bg-white/5 px-1.5 py-0.5 text-slate-400">{step.stage}</span>}
            <span className="ml-auto font-mono text-slate-500">{tour.index + 1} / {steps.length}</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">{step.title}</h2>
          {source && target && rel && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {pill(source)}
              <span className="font-mono text-xs" style={{ color: workflow.color }}>—{rel.type}→</span>
              {pill(target)}
            </div>
          )}
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.text}</p>
          <div className="pointer-events-auto mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => stepTour(-1)} disabled={tour.index === 0} className="flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/5 disabled:opacity-30"><ChevronLeft size={14} />Back</button>
            <button onClick={() => (last ? endTour() : stepTour(1))} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-black" style={{ backgroundColor: workflow.color }}>
              {last ? 'Finish' : 'Next'}<ChevronRight size={14} />
            </button>
            <button onClick={() => setTourPlaying(!tour.playing)} disabled={last} className="flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/5 disabled:opacity-30">
              {tour.playing ? <><Pause size={13} />Pause</> : <><Play size={13} />Auto-play</>}
            </button>
            <span className="ml-auto hidden text-[11px] text-slate-500 sm:inline">
              <kbd className="rounded border border-white/15 px-1">Space</kbd> next · <kbd className="rounded border border-white/15 px-1">←</kbd> back · <kbd className="rounded border border-white/15 px-1">P</kbd> play · <kbd className="rounded border border-white/15 px-1">Esc</kbd> exit
            </span>
            <button onClick={endTour} className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" title="Exit story (Esc)"><X size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdvancedUI() {
  const view = useAdvancedStore((state) => state.view);
  const touring = useAdvancedStore((state) => Boolean(state.tour));
  if (touring) return <StoryBoard />;
  return (
    <>
      {view === 'network' && <NetworkView />}
      {view === 'table' && <TableView />}
      <SidePanel />
      <Inspector />
      <Toolbar />
    </>
  );
}
