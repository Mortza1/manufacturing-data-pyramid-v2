// Prototype-only knowledge graph for the Advanced mode visual.
// Based on the RTM Spoiler quality investigation; the "Tool Wear Monitoring" workflow is illustrative.

import { node as n, rel as r, type AskAnswer, type GraphNode, type GraphRel, type GraphSample, type GraphWorkflow } from './graphTypes';

const GRAPH_LEVELS = [
  { level: 1, name: 'Physical & Inspection', color: '#64748b', weight: 1.1 },
  { level: 2, name: 'Operations', color: '#2dd4bf', weight: 1.1 },
  { level: 3, name: 'Engineering Analysis', color: '#60a5fa', weight: 1.2 },
  { level: 4, name: 'Quality Management', color: '#a78bfa', weight: 1.3 },
  { level: 5, name: 'Outcomes', color: '#67e8f9', weight: 2.3 },
];

const NODES: GraphNode[] = [
  // L1 — physical context and inspection evidence
  n('spoiler-p01', 'Asset', 'Spoiler P01', 'context', 1, { part: 'RTM spoiler' }),
  n('hole-p01-h121', 'Hole', 'Hole P01-H121', 'context', 1, { position: 'Upper P-seal' }),
  n('material-k203', 'Material', 'Material K203', 'context', 1, { grade: 'K203' }, 'enterprise library'),
  n('visit-1', 'MachiningVisit', 'Machining Visit 1', 'context', 1, { visit: '1' }),
  n('ins-0121', 'Inspection', 'Inspection INS-0121', 'evidence', 1, { result: 'Fail' }),
  n('hole-dataset', 'Dataset', 'Hole Inspection Dataset', 'evidence', 1, { records: '200', source: 'Hole inspection station' }),
  n('spindle-vibration', 'Dataset', 'Spindle Vibration Stream', 'evidence', 1, { frequency: '1 kHz', note: 'Illustrative' }),
  // L2 — operational summary
  n('summary-k203-v1', 'Summary', 'K203 / Visit 1 Summary', 'summary', 2, { inspected: '200', defective: '82', defect_rate: '41.0%' }, 'aggregation job'),
  // L3 — engineering findings and models
  n('finding-f01', 'Finding', 'Finding F01', 'finding', 3, { statement: 'Visit 1 has the highest K203 defect rate' }, 'quality engineer'),
  n('finding-f04', 'Finding', 'Finding F04', 'finding', 3, { statement: '41.0% K203 vs 5.0% K178 at Visit 1' }, 'quality engineer'),
  n('finding-f05', 'Finding', 'Finding F05', 'finding', 3, { statement: '44 / 50 defects on upper P-seal holes' }, 'quality engineer'),
  n('tool-wear-model', 'AnalysisModel', 'Tool Wear Model', 'model', 3, { method: 'Regression on vibration features', note: 'Illustrative' }),
  // L4 — plan and actions
  n('plan-01', 'Plan', 'Improvement Plan PLAN-01', 'decision', 4, { owner: 'Quality management', status: 'Completed' }),
  n('action-setup', 'Action', 'Setup and Tooling Review', 'decision', 4, { status: 'Completed' }),
  n('action-first-visit', 'Action', 'First-Visit Checks', 'decision', 4, { status: 'Completed' }),
  n('trial-01', 'Action', 'TRIAL-01 Follow-up Inspection', 'decision', 4, { batches: '3' }),
  n('tool-change-policy', 'Plan', 'Tool Change Policy', 'decision', 4, { note: 'Illustrative' }),
  // L5 — outcomes
  n('followup-v01', 'FollowUp', 'Follow-up V01', 'outcome', 5, { defect_rate: '12.0%' }),
  n('followup-v02', 'FollowUp', 'Follow-up V02', 'outcome', 5, { defect_rate: '10.0%' }),
  n('followup-v03', 'FollowUp', 'Follow-up V03', 'outcome', 5, { defect_rate: '8.0%' }),
  n('outcome', 'Outcome', 'Outcome Assessment', 'outcome', 5, { verdict: 'Verified under tested conditions' }, 'quality engineer'),
  // Agent layer
  n('agent-quality', 'Agent', 'Quality Investigation Agent', 'agent', null, { tools: 'find_entity, neighbourhood, paths', mode: 'Read + propose' }, 'platform'),
  // Agent proposal awaiting review
  { ...n('finding-f06', 'Finding', 'Finding F06', 'finding', 3, { statement: 'Upper P-seal defects cluster in the first 20 parts of Visit 1' }, 'Quality Investigation Agent'), status: 'proposed' },
];


const RELS: GraphRel[] = [
  r('r1', 'spoiler-p01', 'HAS_HOLE', 'hole-p01-h121'),
  r('r2', 'spoiler-p01', 'USES_MATERIAL', 'material-k203'),
  r('r3', 'hole-p01-h121', 'MACHINED_AT', 'visit-1'),
  r('r4', 'ins-0121', 'INSPECTS', 'hole-p01-h121'),
  r('r5', 'hole-dataset', 'CONTAINS', 'ins-0121'),
  r('r6', 'hole-dataset', 'AGGREGATED_INTO', 'summary-k203-v1'),
  r('r7', 'summary-k203-v1', 'GROUPING_KEY', 'material-k203'),
  r('r8', 'summary-k203-v1', 'GROUPING_KEY', 'visit-1'),
  r('r9', 'summary-k203-v1', 'SUPPORTS', 'finding-f01'),
  r('r10', 'summary-k203-v1', 'SUPPORTS', 'finding-f04'),
  r('r11', 'summary-k203-v1', 'SUPPORTS', 'finding-f05'),
  r('r12', 'finding-f01', 'INFORMS', 'plan-01'),
  r('r13', 'finding-f04', 'INFORMS', 'plan-01'),
  r('r14', 'finding-f05', 'INFORMS', 'plan-01'),
  r('r15', 'plan-01', 'INCLUDES', 'action-setup'),
  r('r16', 'plan-01', 'INCLUDES', 'action-first-visit'),
  r('r17', 'plan-01', 'INCLUDES', 'trial-01'),
  r('r18', 'trial-01', 'GENERATES', 'followup-v01'),
  r('r19', 'trial-01', 'GENERATES', 'followup-v02'),
  r('r20', 'trial-01', 'GENERATES', 'followup-v03'),
  r('r21', 'followup-v01', 'EVIDENCE_FOR', 'outcome'),
  r('r22', 'followup-v02', 'EVIDENCE_FOR', 'outcome'),
  r('r23', 'followup-v03', 'EVIDENCE_FOR', 'outcome'),
  // Illustrative second workflow reusing shared nodes
  r('r30', 'visit-1', 'MONITORED_BY', 'spindle-vibration'),
  r('r31', 'spindle-vibration', 'FEEDS', 'tool-wear-model'),
  r('r32', 'tool-wear-model', 'INFORMS', 'action-setup'),
  r('r33', 'action-setup', 'DEFINES', 'tool-change-policy'),
  // Agent access
  r('a1', 'agent-quality', 'QUERIES', 'hole-dataset'),
  r('a2', 'agent-quality', 'EXAMINES', 'summary-k203-v1'),
  r('a3', 'agent-quality', 'EXAMINES', 'finding-f01'),
  r('a4', 'agent-quality', 'REVIEWS', 'plan-01'),
  r('a5', 'agent-quality', 'EVALUATES', 'outcome'),
  // Agent proposal
  { ...r('p1', 'summary-k203-v1', 'SUPPORTS', 'finding-f06'), status: 'proposed' },
];

const WORKFLOWS: GraphWorkflow[] = [
  {
    id: 'wf-first-visit',
    name: 'First-Visit Quality Investigation',
    description: 'From inspection records to a verified improvement on K203, machining Visit 1.',
    color: '#22d3ee',
    stages: [
      { title: 'Collect inspection evidence', relIds: ['r5', 'r6'] },
      { title: 'Derive findings', relIds: ['r9', 'r10', 'r11'] },
      { title: 'Plan the improvement', relIds: ['r12', 'r13', 'r14'] },
      { title: 'Act', relIds: ['r15', 'r16', 'r17'] },
      { title: 'Follow up', relIds: ['r18', 'r19', 'r20'] },
      { title: 'Verify the outcome', relIds: ['r21', 'r22', 'r23'] },
    ],
  },
  {
    id: 'wf-tool-wear',
    name: 'Tool Wear Monitoring',
    description: 'Illustrative: reuses Machining Visit 1 and the Setup Review from the investigation.',
    color: '#a78bfa',
    stages: [
      { title: 'Sense', relIds: ['r30'] },
      { title: 'Model', relIds: ['r31'] },
      { title: 'Inform action', relIds: ['r32'] },
      { title: 'Set policy', relIds: ['r33'] },
    ],
  },
];

// Storyboard captions for the guided tour, one per workflow relationship.
const STORY: Record<string, { title: string; text: string }> = {
  r5: { title: 'Evidence starts on the shop floor', text: 'The Hole Inspection Dataset holds 200 hole inspections from the inspection station. INS-0121 is one of them: hole P01-H121 failed inspection.' },
  r6: { title: 'Records become a summary', text: 'Grouping the inspections by material and machining visit produces the K203 / Visit 1 summary: 82 of 200 holes defective, a 41.0% defect rate.' },
  r9: { title: 'The summary supports Finding F01', text: 'Compared across visits, machining Visit 1 shows the highest K203 defect rate.' },
  r10: { title: 'The summary supports Finding F04', text: 'At Visit 1, K203 runs at 41.0% defective against 5.0% for K178, so the material and visit combination stands out.' },
  r11: { title: 'The summary supports Finding F05', text: '44 of the 50 defects sit on upper P-seal holes, pointing at one specific feature.' },
  r12: { title: 'Findings inform a plan', text: 'F01 feeds Improvement Plan PLAN-01: the investigation moves from analysis (L3) into quality management (L4).' },
  r13: { title: 'Evidence accumulates on the plan', text: 'F04 also informs PLAN-01. Several findings converge on one decision; a linear loop could not show this merge.' },
  r14: { title: 'A third finding joins in', text: 'F05 completes the case for PLAN-01, focusing attention on the upper P-seal holes.' },
  r15: { title: 'Action 1: Setup and Tooling Review', text: 'PLAN-01 includes a review of machine setup and tooling for the first machining visit.' },
  r16: { title: 'Action 2: First-Visit Checks', text: 'First-visit checks are introduced so problems are caught on the first parts of each visit.' },
  r17: { title: 'Action 3: Follow-up trial', text: 'TRIAL-01 plans follow-up inspections to test whether the changes worked.' },
  r18: { title: 'Follow-up batch V01', text: 'The first follow-up batch shows a 12.0% defect rate, down from 41.0%.' },
  r19: { title: 'Follow-up batch V02', text: 'The second batch improves further to 10.0%.' },
  r20: { title: 'Follow-up batch V03', text: 'The third batch reaches 8.0%.' },
  r21: { title: 'Evidence for the outcome', text: 'Each follow-up batch becomes evidence for the Outcome Assessment at the top of the pyramid.' },
  r22: { title: 'Evidence for the outcome', text: 'The trend is consistent across batches: 12.0%, then 10.0%, then 8.0%.' },
  r23: { title: 'Outcome: verified under tested conditions', text: 'The improvement is verified under tested conditions. The graph shows the improvement, but not which action caused it.' },
  r30: { title: 'Sensing the machine', text: 'Illustrative: during Machining Visit 1 the spindle is monitored by a vibration stream, so the same visit node is reused from the quality investigation.' },
  r31: { title: 'Signals feed a model', text: 'Illustrative: vibration features feed a Tool Wear Model at the engineering level.' },
  r32: { title: 'The model informs an existing action', text: 'Illustrative: the model informs the Setup and Tooling Review, an action shared with the quality investigation workflow.' },
  r33: { title: 'Action becomes policy', text: 'Illustrative: the review defines a Tool Change Policy, turning one investigation into a standing rule.' },
};


const ASK_ANSWERS: AskAnswer[] = [
  {
    id: 'q-evidence-f01',
    question: 'What evidence supports Finding F01?',
    agent: false,
    answer: 'F01 is supported by the K203 / Visit 1 Summary (82 of 200 defective, 41.0%), aggregated from the Hole Inspection Dataset, which contains records such as INS-0121.',
    nodeIds: ['finding-f01', 'summary-k203-v1', 'hole-dataset', 'ins-0121'],
    relIds: ['r9', 'r6', 'r5'],
  },
  {
    id: 'q-actions',
    question: 'Which actions came from the findings?',
    agent: false,
    answer: 'Findings F01, F04 and F05 inform PLAN-01, which includes the Setup and Tooling Review, First-Visit Checks and the TRIAL-01 follow-up inspection.',
    nodeIds: ['finding-f01', 'finding-f04', 'finding-f05', 'plan-01', 'action-setup', 'action-first-visit', 'trial-01'],
    relIds: ['r12', 'r13', 'r14', 'r15', 'r16', 'r17'],
  },
  {
    id: 'q-verified',
    question: 'How was the improvement verified?',
    agent: false,
    answer: 'TRIAL-01 generated three follow-up batches with defect rates of 12.0%, 10.0% and 8.0%, which are the evidence for the Outcome Assessment.',
    nodeIds: ['trial-01', 'followup-v01', 'followup-v02', 'followup-v03', 'outcome'],
    relIds: ['r18', 'r19', 'r20', 'r21', 'r22', 'r23'],
  },
  {
    id: 'q-agent-k203',
    question: 'Why was the K203 first machining visit investigated, what was done, and was it resolved?',
    agent: true,
    answer: 'K203 at machining Visit 1 recorded 82 defective holes from 200 inspections (41.0%), compared with 5.0% for K178. Setup and tooling were reviewed, first-visit checks were introduced and three follow-up batches were assessed. Follow-up defect rates fell to 12.0%, 10.0% and 8.0%; the outcome was assessed as verified under tested conditions.',
    caveat: 'Shows an improvement, but does not establish which action caused the change.',
    nodeIds: ['material-k203', 'visit-1', 'summary-k203-v1', 'finding-f01', 'finding-f04', 'plan-01', 'action-setup', 'action-first-visit', 'trial-01', 'followup-v01', 'followup-v02', 'followup-v03', 'outcome', 'agent-quality'],
    relIds: ['r7', 'r8', 'r9', 'r10', 'r13', 'r12', 'r15', 'r16', 'r17', 'r18', 'r19', 'r20', 'r21', 'r22', 'r23', 'a2', 'a3', 'a4', 'a5'],
  },
];

export const RTM_SAMPLE: GraphSample = {
  id: 'rtm',
  title: 'RTM Spoiler Investigation',
  subtitle: 'Single use case · quality investigation',
  levels: GRAPH_LEVELS,
  nodes: NODES,
  rels: RELS,
  workflows: WORKFLOWS,
  story: STORY,
  ask: ASK_ANSWERS,
};
