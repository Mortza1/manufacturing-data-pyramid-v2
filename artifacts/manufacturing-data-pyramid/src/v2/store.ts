import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { V2Case, V2Connection, V2Loop, V2Object } from './types';
import { getSectorIdForGridCell } from './geometry';

interface V2Draft {
  levels: { id?: string; name: string }[];
  sectors: { id?: string; name: string }[];
}

export interface V2DataDraft {
  name: string;
  description: string;
  availability: string;
  source: string;
  protocol: string;
  format: string;
  data_type: string;
  frequency: string;
  sensing_settings: string;
  preprocessing: string;
  intended_use: string;
}

export type V2MetadataPatch = Partial<V2DataDraft>;
export type V2DataDensity = 1 | 2 | 3 | 'all';
export interface V2LoopDraft {
  name: string;
  description: string;
  color: string;
}

export const LOOP_COLOR_PALETTE = ['#22d3ee', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15'] as const;

export interface V2LoopBuilder {
  loopId: string;
  firstObjectId: string | null;
  currentObjectId: string | null;
}

export type V2LoopSelectionResult =
  | { status: 'started'; objectId: string }
  | { status: 'segment_created'; connectionId: string }
  | { status: 'rejected'; reason: 'self' | 'repeated' | 'missing' | 'inactive' };

export const EMPTY_DATA_DRAFT: V2DataDraft = {
  name: '',
  description: '',
  availability: 'Available',
  source: '',
  protocol: '',
  format: '',
  data_type: '',
  frequency: '',
  sensing_settings: '',
  preprocessing: '',
  intended_use: '',
};

export const WALKTHROUGH_LEVEL_PRESET = [
  'Signal / Physical',
  'Operational',
  'Engineering',
  'Management',
  'Executive',
] as const;

export function getWalkthroughLevelName(index: number, count: number) {
  return count === WALKTHROUGH_LEVEL_PRESET.length
    ? WALKTHROUGH_LEVEL_PRESET[index] || `Level ${index + 1}`
    : `Level ${index + 1}`;
}

const AUTO_FILL_DATA_CATALOGUE: Record<string, Record<string, string[]>> = {
  'Signal / Physical': {
    Product: ['Product Dimensions', 'Surface Image', 'Product Geometry Snapshot', 'Surface Defect Signal'],
    Resources: ['Material Batch ID', 'Material Temperature', 'Material Composition', 'Material Lot Trace'],
    Machines: ['Spindle Vibration', 'Motor Current', 'Tool Wear Signal', 'Machine Acoustic Signature'],
    People: ['Operator Presence', 'Manual Inspection Input', 'Operator Skill Confirmation', 'Safety Observation'],
  },
  Operational: {
    Product: ['Inspection Result', 'Part Traceability Record', 'Production Quantity', 'Cycle Completion Status'],
    Resources: ['Material Consumption', 'Tool Availability', 'Energy Consumption', 'Consumable Replenishment'],
    Machines: ['Machine State', 'Alarm Event', 'Cycle Time', 'Machine Utilisation'],
    People: ['Operator Assignment', 'Shift Activity', 'Operator Handover', 'Workstation Attendance'],
  },
  Engineering: {
    Product: ['CAD Geometry', 'Simulation Result', 'Tolerance Definition', 'Design Revision Record'],
    Resources: ['Material Specification', 'Process Resource Requirement', 'Material Compatibility', 'Resource Constraint'],
    Machines: ['Machine Capability Model', 'Maintenance Condition Assessment', 'Tooling Capability', 'Equipment Performance Model'],
    People: ['Work Instruction', 'Engineering Approval', 'Design Review Input', 'Process Engineering Change'],
  },
  Management: {
    Product: ['Quality KPI', 'Scrap Rate', 'First Pass Yield', 'Product Conformance Trend'],
    Resources: ['Production Cost', 'Resource Utilisation', 'Material Cost Variance', 'Capacity Constraint'],
    Machines: ['Reliability KPI', 'Maintenance Performance', 'Overall Equipment Effectiveness', 'Downtime Trend'],
    People: ['Workforce Capacity', 'Training Status', 'Staffing Coverage', 'Competency Risk'],
  },
  Executive: {
    Product: ['Product Portfolio Performance', 'Customer Quality Metric', 'Market Quality Position', 'Portfolio Margin'],
    Resources: ['Profitability', 'Investment Requirement', 'Capital Allocation', 'Resource Return'],
    Machines: ['Asset Performance', 'Capital Equipment Risk', 'Asset Investment Outlook', 'Technology Renewal Need'],
    People: ['Workforce Strategy', 'Skills Risk', 'Leadership Capacity', 'Strategic Capability Gap'],
  },
};

function normaliseDataName(value: string) {
  return value.trim().toLowerCase();
}

function getAutoFillNameCandidates(levelName: string, sectorName: string) {
  const levelCatalogue = Object.entries(AUTO_FILL_DATA_CATALOGUE)
    .find(([name]) => normaliseDataName(name) === normaliseDataName(levelName))?.[1];
  const sectorCatalogue = levelCatalogue
    ? Object.entries(levelCatalogue)
      .find(([name]) => normaliseDataName(name) === normaliseDataName(sectorName))?.[1]
    : undefined;
  return sectorCatalogue || [
    `${sectorName} ${levelName} signal`,
    `${sectorName} ${levelName} status`,
    `${sectorName} ${levelName} event`,
    `${sectorName} ${levelName} record`,
  ];
}

function getStableLegacyLoopId(normalisedName: string) {
  let hash = 2166136261;
  for (const char of normalisedName) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `loop_legacy_${(hash >>> 0).toString(16)}`;
}

function normalisePersistedLoops(rawCase: any) {
  const rawConnections = Array.isArray(rawCase?.overlays?.connectivity) ? rawCase.overlays.connectivity : [];
  const rawLoops = Array.isArray(rawCase?.overlays?.loops) ? rawCase.overlays.loops : [];
  const loopsByKey = new Map<string, V2Loop>();
  rawLoops.forEach((rawLoop: any) => {
    const name = String(rawLoop?.name || 'Unassigned').trim() || 'Unassigned';
    const key = normaliseDataName(name);
    const loop: V2Loop = {
      id: rawLoop?.id || getStableLegacyLoopId(key),
      name,
      description: String(rawLoop?.description || ''),
      color: rawLoop?.color || '#67e8f9',
      closed: Boolean(rawLoop?.closed),
    };
    loopsByKey.set(key, loop);
    if (rawLoop?.id) loopsByKey.set(`id:${rawLoop.id}`, loop);
  });
  const rawLoopsById = new Map<string, any>();
  rawLoops.forEach((rawLoop: any) => {
    if (rawLoop?.id) rawLoopsById.set(String(rawLoop.id), rawLoop);
  });
  const grouped = new Map<string, any[]>();
  rawConnections.forEach((rawConnection: any) => {
    const linkedLoop = rawConnection?.loop_id ? rawLoopsById.get(String(rawConnection.loop_id)) : undefined;
    const loopName = String(linkedLoop?.name || rawConnection?.loop || '').trim() || 'Unassigned';
    const key = linkedLoop?.id ? `id:${linkedLoop.id}` : normaliseDataName(loopName);
    if (!loopsByKey.has(key)) {
      loopsByKey.set(key, {
        id: linkedLoop?.id || rawConnection?.loop_id || getStableLegacyLoopId(key),
        name: loopName,
        description: String(linkedLoop?.description || ''),
        color: linkedLoop?.color || rawConnection?.color || '#67e8f9',
        closed: Boolean(linkedLoop?.closed),
      });
    }
    const list = grouped.get(key) ?? [];
    list.push(rawConnection);
    grouped.set(key, list);
  });
  const connectivity = rawConnections.map((rawConnection: any) => {
    const linkedLoop = rawConnection?.loop_id ? rawLoopsById.get(String(rawConnection.loop_id)) : undefined;
    const loopName = String(linkedLoop?.name || rawConnection?.loop || '').trim() || 'Unassigned';
    const key = linkedLoop?.id ? `id:${linkedLoop.id}` : normaliseDataName(loopName);
    const group = grouped.get(key) || [];
    const sequence = Number.isFinite(rawConnection?.sequence)
      ? rawConnection.sequence
      : group.indexOf(rawConnection);
    return {
      id: rawConnection?.id || `connection_${uuidv4()}`,
      loop_id: rawConnection?.loop_id || loopsByKey.get(key)?.id || getStableLegacyLoopId(key),
      sequence,
      source_object_id: rawConnection?.source_object_id,
      target_object_id: rawConnection?.target_object_id,
      direction: 'source_to_target' as const,
      label: rawConnection?.label || '',
      description: rawConnection?.description || '',
    };
  });
  const uniqueLoops = Array.from(new Map(Array.from(loopsByKey.values()).map((loop) => [loop.id, loop])).values());
  return {
    ...rawCase,
    overlays: {
      ...(rawCase?.overlays || {}),
      loops: uniqueLoops,
      connectivity,
    },
  };
}

interface V2State {
  mode: 'explorer' | 'walkthrough' | 'advanced';
  setMode: (mode: 'explorer' | 'walkthrough' | 'advanced') => void;

  activeCase: V2Case | null;
  isEditingStructure: boolean;
  walkthroughStage: 'structure' | 'data' | 'visualise' | 'connections';
  dataLevelIndex: number;
  skippedLevelIds: string[];
  dataAutoFillNotice: string | null;
  showV2Labels: boolean;
  selectedVisualiseObjectId: string | null;
  visualiseExploded: boolean;
  visualiseFocusedLevelId: string | null;
  visualiseOnlyLevelId: string | null;
  visualiseHiddenSectorIds: string[];
  visualiseSurfaceOpacity: number;
  visualiseDataDensity: V2DataDensity;
  visualiseObjectScale: number;
  visualiseLabelScale: number;
  selectedLoopId: string | null;
  showOnlyLoopId: string | null;
  loopSectorContext: 'active' | 'all';
  connectionsView: '3d' | '2d';
  expandedLoopIds: string[];
  loopBuilder: V2LoopBuilder | null;
  selectedConnectionId: string | null;
  connectionArrowThickness: number;
  connectionsFinished: boolean;
  viewResetNonce: number;
  setIsEditingStructure: (isEditing: boolean) => void;
  setWalkthroughStage: (stage: 'structure' | 'data' | 'visualise' | 'connections') => void;
  setDataLevelIndex: (index: number) => void;
  setShowV2Labels: (show: boolean) => void;
  setSelectedVisualiseObjectId: (id: string | null) => void;
  setVisualiseExploded: (exploded: boolean) => void;
  setVisualiseFocusedLevelId: (levelId: string | null) => void;
  setVisualiseOnlyLevelId: (levelId: string | null) => void;
  toggleVisualiseSector: (sectorId: string) => void;
  showAllVisualiseSectors: () => void;
  setVisualiseSurfaceOpacity: (opacity: number) => void;
  setVisualiseDataDensity: (density: V2DataDensity) => void;
  setVisualiseObjectScale: (scale: number) => void;
  setVisualiseLabelScale: (scale: number) => void;
  startLoop: (draft: V2LoopDraft) => string | null;
  selectLoopObject: (objectId: string) => V2LoopSelectionResult;
  undoLastSegment: () => boolean;
  finishLoop: (closeLoop?: boolean) => boolean;
  cancelLoop: () => void;
  selectLoop: (loopId: string | null) => void;
  setShowOnlyLoop: (loopId: string | null) => void;
  setLoopSectorContext: (context: 'active' | 'all') => void;
  setConnectionsView: (view: '3d' | '2d') => void;
  toggleLoopExpanded: (loopId: string) => void;
  selectConnection: (connectionId: string) => void;
  updateConnection: (connectionId: string, patch: Partial<Pick<V2Connection, 'label' | 'description'>>) => boolean;
  deleteConnection: (connectionId: string) => boolean;
  updateLoop: (loopId: string, patch: Partial<V2LoopDraft>) => boolean;
  deleteLoop: (loopId: string) => boolean;
  setConnectionArrowThickness: (thickness: number) => void;
  addExampleLoops: () => number;
  finishConnections: () => void;
  requestViewReset: () => void;

  draft: V2Draft;
  autoFillLevelNames: boolean;
  setDraftLevels: (levels: { id?: string; name: string }[]) => void;
  setDraftSectors: (sectors: { id?: string; name: string }[]) => void;
  setAutoFillLevelNames: (enabled: boolean) => void;

  confirmStructure: () => void;
  reopenStructure: () => void;
  addDataObject: (draft: V2DataDraft, levelId: string, sectorId: string, gridX: number, gridY: number) => string | null;
  moveDataObject: (objectId: string, levelId: string, sectorId: string, gridX: number, gridY: number) => boolean;
  autoFillDataLevel: (levelId: string) => number;
  clearDataLevel: (levelId: string) => void;
  skipDataLevel: () => void;
  resetDataLevel: () => void;
  removeDataObject: (objectId: string) => void;
  updateDataObjectMetadata: (objectId: string, patch: V2MetadataPatch) => boolean;
}

export const useV2Store = create<V2State>()(
  persist(
    (set, get) => ({
      mode: 'explorer',
      setMode: (mode) => set({ mode }),

      activeCase: null,
      isEditingStructure: true,
      walkthroughStage: 'structure',
      dataLevelIndex: 0,
      skippedLevelIds: [],
      dataAutoFillNotice: null,
      showV2Labels: true,
      selectedVisualiseObjectId: null,
      visualiseExploded: false,
      visualiseFocusedLevelId: null,
      visualiseOnlyLevelId: null,
      visualiseHiddenSectorIds: [],
      visualiseSurfaceOpacity: 0.72,
      visualiseDataDensity: 'all',
      visualiseObjectScale: 1,
      visualiseLabelScale: 1,
      selectedLoopId: null,
      showOnlyLoopId: null,
      loopSectorContext: 'active',
      connectionsView: '3d',
      expandedLoopIds: [],
      loopBuilder: null,
      selectedConnectionId: null,
      connectionArrowThickness: 1,
      connectionsFinished: false,
      viewResetNonce: 0,
      setIsEditingStructure: (isEditing) => set({ isEditingStructure: isEditing }),
      setWalkthroughStage: (walkthroughStage) => set((state) => ({
        walkthroughStage,
        visualiseSurfaceOpacity: walkthroughStage === 'connections' && state.walkthroughStage !== 'connections'
          ? 0.2
          : state.visualiseSurfaceOpacity,
      })),
      setDataLevelIndex: (dataLevelIndex) => set({ dataLevelIndex: Math.max(0, dataLevelIndex), dataAutoFillNotice: null }),
      setShowV2Labels: (showV2Labels) => set({ showV2Labels }),
      setSelectedVisualiseObjectId: (selectedVisualiseObjectId) => set({ selectedVisualiseObjectId }),
      setVisualiseExploded: (visualiseExploded) => set({ visualiseExploded }),
      setVisualiseFocusedLevelId: (visualiseFocusedLevelId) => set({
        visualiseFocusedLevelId,
        visualiseOnlyLevelId: null,
      }),
      setVisualiseOnlyLevelId: (visualiseOnlyLevelId) => set({
        visualiseOnlyLevelId,
        visualiseFocusedLevelId: null,
      }),
      toggleVisualiseSector: (sectorId) => set((state) => ({
        visualiseHiddenSectorIds: state.visualiseHiddenSectorIds.includes(sectorId)
          ? state.visualiseHiddenSectorIds.filter((id) => id !== sectorId)
          : [...state.visualiseHiddenSectorIds, sectorId],
      })),
      showAllVisualiseSectors: () => set({ visualiseHiddenSectorIds: [] }),
      setVisualiseSurfaceOpacity: (visualiseSurfaceOpacity) => set({
        visualiseSurfaceOpacity: Math.min(1, Math.max(0.18, visualiseSurfaceOpacity)),
      }),
      setVisualiseDataDensity: (visualiseDataDensity) => set({ visualiseDataDensity }),
      setVisualiseObjectScale: (visualiseObjectScale) => set({
        visualiseObjectScale: Math.min(1.35, Math.max(0.7, visualiseObjectScale)),
      }),
      setVisualiseLabelScale: (visualiseLabelScale) => set({
        visualiseLabelScale: Math.min(1.35, Math.max(0.75, visualiseLabelScale)),
      }),
      startLoop: (draft) => {
        const { activeCase } = get();
        if (!activeCase || !draft.name.trim()) return null;
        const loop: V2Loop = {
          id: `loop_${uuidv4()}`,
          name: draft.name.trim(),
          description: draft.description.trim(),
          color: draft.color || LOOP_COLOR_PALETTE[0],
          closed: false,
        };
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              loops: [...activeCase.overlays.loops, loop],
            },
          },
          selectedLoopId: loop.id,
          showOnlyLoopId: null,
          selectedConnectionId: null,
          loopBuilder: {
            loopId: loop.id,
            firstObjectId: null,
            currentObjectId: null,
          },
        });
        return loop.id;
      },
      selectLoopObject: (objectId) => {
        const { activeCase, loopBuilder } = get();
        if (!activeCase || !loopBuilder) return { status: 'rejected', reason: 'inactive' };
        if (!activeCase.overlays.data.some((object) => object.id === objectId)) return { status: 'rejected', reason: 'missing' };
        if (!loopBuilder.firstObjectId) {
          set({
            loopBuilder: {
              ...loopBuilder,
              firstObjectId: objectId,
              currentObjectId: objectId,
            },
          });
          return { status: 'started', objectId };
        }
        if (loopBuilder.currentObjectId === objectId) return { status: 'rejected', reason: 'self' };
        const existingSegments = activeCase.overlays.connectivity
          .filter((connection) => connection.loop_id === loopBuilder.loopId)
          .sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
        const usedObjectIds = new Set(existingSegments.flatMap((connection) => [
          connection.source_object_id,
          connection.target_object_id,
        ]));
        if (usedObjectIds.has(objectId)) return { status: 'rejected', reason: 'repeated' };
        const duplicate = existingSegments.some((connection) =>
          connection.source_object_id === loopBuilder.currentObjectId &&
          connection.target_object_id === objectId
        );
        if (duplicate) return { status: 'rejected', reason: 'repeated' };
        const sourceObjectId = loopBuilder.currentObjectId;
        if (!sourceObjectId) return { status: 'rejected', reason: 'missing' };
        const connection: V2Connection = {
          id: `connection_${uuidv4()}`,
          loop_id: loopBuilder.loopId,
          sequence: existingSegments.length,
          source_object_id: sourceObjectId,
          target_object_id: objectId,
          direction: 'source_to_target',
          label: `Segment ${existingSegments.length + 1}`,
          description: '',
        };
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              connectivity: [...activeCase.overlays.connectivity, connection],
            },
          },
          selectedLoopId: loopBuilder.loopId,
          selectedConnectionId: connection.id,
          loopBuilder: {
            ...loopBuilder,
            currentObjectId: objectId,
          },
        });
        return { status: 'segment_created', connectionId: connection.id };
      },
      undoLastSegment: () => {
        const { activeCase, loopBuilder } = get();
        if (!activeCase || !loopBuilder) return false;
        const segments = activeCase.overlays.connectivity
          .filter((connection) => connection.loop_id === loopBuilder.loopId)
          .sort((a, b) => b.sequence - a.sequence || b.id.localeCompare(a.id));
        const last = segments[0];
        if (!last) {
          set({
            loopBuilder: {
              ...loopBuilder,
              firstObjectId: null,
              currentObjectId: null,
            },
            selectedConnectionId: null,
          });
          return true;
        }
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              connectivity: activeCase.overlays.connectivity.filter((connection) => connection.id !== last.id),
            },
          },
          selectedConnectionId: null,
          loopBuilder: {
            ...loopBuilder,
            currentObjectId: last.source_object_id,
          },
        });
        return true;
      },
      finishLoop: (closeLoop = false) => {
        const { activeCase, loopBuilder } = get();
        if (!activeCase || !loopBuilder) return false;
        const loop = activeCase.overlays.loops.find((item) => item.id === loopBuilder.loopId);
        if (!loop) return false;
        const segments = activeCase.overlays.connectivity
          .filter((connection) => connection.loop_id === loop.id)
          .sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
        let nextCase = activeCase;
        if (closeLoop && loopBuilder.firstObjectId && loopBuilder.currentObjectId && loopBuilder.firstObjectId !== loopBuilder.currentObjectId) {
          const duplicate = segments.some((connection) =>
            connection.source_object_id === loopBuilder.currentObjectId &&
            connection.target_object_id === loopBuilder.firstObjectId
          );
          if (!duplicate) {
            const closingSegment: V2Connection = {
              id: `connection_${uuidv4()}`,
              loop_id: loop.id,
              sequence: segments.length,
              source_object_id: loopBuilder.currentObjectId,
              target_object_id: loopBuilder.firstObjectId,
              direction: 'source_to_target',
              label: `Segment ${segments.length + 1}`,
              description: 'Closing segment',
            };
            nextCase = {
              ...activeCase,
              overlays: {
                ...activeCase.overlays,
                connectivity: [...activeCase.overlays.connectivity, closingSegment],
              },
            };
          }
        }
        set({
          activeCase: {
            ...nextCase,
            overlays: {
              ...nextCase.overlays,
              loops: nextCase.overlays.loops.map((item) => item.id === loop.id ? { ...item, closed: closeLoop } : item),
            },
          },
          loopBuilder: null,
          selectedLoopId: loop.id,
          selectedConnectionId: null,
        });
        return true;
      },
      cancelLoop: () => set((state) => {
        const builder = state.loopBuilder;
        if (!builder || !state.activeCase) return { loopBuilder: null };
        const remainingConnections = state.activeCase.overlays.connectivity.filter((connection) => connection.loop_id !== builder.loopId);
        const remainingLoops = state.activeCase.overlays.loops.filter((loop) => loop.id !== builder.loopId);
        return {
          activeCase: {
            ...state.activeCase,
            overlays: {
              ...state.activeCase.overlays,
              loops: remainingLoops,
              connectivity: remainingConnections,
            },
          },
          loopBuilder: null,
          selectedLoopId: null,
          selectedConnectionId: null,
        };
      }),
      selectLoop: (selectedLoopId) => set((state) => ({
        selectedLoopId,
        selectedConnectionId: null,
        showOnlyLoopId: state.showOnlyLoopId ? selectedLoopId : state.showOnlyLoopId,
      })),
      setShowOnlyLoop: (showOnlyLoopId) => set({
        showOnlyLoopId,
        selectedLoopId: showOnlyLoopId,
      }),
      setLoopSectorContext: (loopSectorContext) => set({ loopSectorContext }),
      setConnectionsView: (connectionsView) => set({ connectionsView }),
      toggleLoopExpanded: (loopId) => set((state) => ({
        expandedLoopIds: state.expandedLoopIds.includes(loopId)
          ? state.expandedLoopIds.filter((id) => id !== loopId)
          : [...state.expandedLoopIds, loopId],
      })),
      selectConnection: (connectionId) => set((state) => {
        const connection = state.activeCase?.overlays.connectivity.find((item) => item.id === connectionId);
        return connection
          ? {
            selectedConnectionId: connection.id,
            selectedLoopId: connection.loop_id,
          }
          : state;
      }),
      updateConnection: (connectionId, patch) => {
        const { activeCase } = get();
        if (!activeCase) return false;
        const connection = activeCase.overlays.connectivity.find((item) => item.id === connectionId);
        if (!connection) return false;
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              connectivity: activeCase.overlays.connectivity.map((item) => item.id === connectionId
                ? {
                  ...item,
                  ...(patch.label !== undefined ? { label: patch.label?.trim() || item.label } : {}),
                  ...(patch.description !== undefined ? { description: patch.description?.trim() || '' } : {}),
                }
                : item),
            },
          },
        });
        return true;
      },
      deleteConnection: (connectionId) => {
        const { activeCase } = get();
        if (!activeCase || !activeCase.overlays.connectivity.some((connection) => connection.id === connectionId)) return false;
        set((state) => ({
          activeCase: state.activeCase ? {
            ...state.activeCase,
            overlays: {
              ...state.activeCase.overlays,
              connectivity: state.activeCase.overlays.connectivity.filter((connection) => connection.id !== connectionId),
            },
          } : null,
          selectedConnectionId: state.selectedConnectionId === connectionId ? null : state.selectedConnectionId,
        }));
        return true;
      },
      updateLoop: (loopId, patch) => {
        const { activeCase } = get();
        if (!activeCase || !activeCase.overlays.loops.some((loop) => loop.id === loopId)) return false;
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              loops: activeCase.overlays.loops.map((loop) => loop.id === loopId
                ? {
                  ...loop,
                  ...(patch.name !== undefined ? { name: patch.name.trim() || loop.name } : {}),
                  ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
                  ...(patch.color !== undefined ? { color: patch.color || loop.color } : {}),
                }
                : loop),
            },
          },
        });
        return true;
      },
      deleteLoop: (loopId) => {
        const { activeCase } = get();
        if (!activeCase || !activeCase.overlays.loops.some((loop) => loop.id === loopId)) return false;
        set((state) => ({
          activeCase: state.activeCase ? {
            ...state.activeCase,
            overlays: {
              ...state.activeCase.overlays,
              loops: state.activeCase.overlays.loops.filter((loop) => loop.id !== loopId),
              connectivity: state.activeCase.overlays.connectivity.filter((connection) => connection.loop_id !== loopId),
            },
          } : null,
          selectedLoopId: state.selectedLoopId === loopId ? null : state.selectedLoopId,
          showOnlyLoopId: state.showOnlyLoopId === loopId ? null : state.showOnlyLoopId,
          expandedLoopIds: state.expandedLoopIds.filter((id) => id !== loopId),
          loopBuilder: state.loopBuilder?.loopId === loopId ? null : state.loopBuilder,
        }));
        return true;
      },
      setConnectionArrowThickness: (connectionArrowThickness) => set({
        connectionArrowThickness: Math.min(1.8, Math.max(0.7, connectionArrowThickness)),
      }),
      addExampleLoops: () => {
        const { activeCase } = get();
        if (!activeCase) return 0;
        const visible = activeCase.overlays.data;
        const levelIndex = new Map(activeCase.levels.map((level, index) => [level.id, index]));
        const sectorIndex = new Map(activeCase.sectors.map((sector, index) => [sector.id, index]));
        const existingLoopNames = new Set(activeCase.overlays.loops.map((loop) => normaliseDataName(loop.name)));
        const examples = [
          {
            name: 'Predictive Maintenance',
            description: 'Deterministic maintenance path across the available manufacturing levels.',
            color: '#22d3ee',
            terms: ['vibration', 'machine', 'alarm', 'maintenance', 'condition', 'reliability', 'wear', 'asset', 'equipment'],
            sectorTerms: ['machine', 'maintenance'],
          },
          {
            name: 'Process Optimisation',
            description: 'Deterministic process and quality path across the available manufacturing levels.',
            color: '#a78bfa',
            terms: ['temperature', 'signal', 'measurement', 'inspection', 'process', 'simulation', 'quality', 'utilisation', 'cost', 'profitability', 'performance'],
            sectorTerms: ['product', 'resources', 'machine'],
          },
        ];
        const loops: V2Loop[] = [];
        const connections: V2Connection[] = [];
        for (const example of examples) {
          if (existingLoopNames.has(normaliseDataName(example.name))) continue;
          const path: V2Object[] = [];
          for (let index = 0; index < activeCase.levels.length; index += 1) {
            const candidates = visible
              .filter((object) => levelIndex.get(object.level_id) === index && !path.some((selected) => selected.id === object.id))
              .map((object) => {
                const searchable = `${object.name} ${object.data_type} ${object.description}`.toLowerCase();
                const sectorName = activeCase.sectors.find((sector) => sector.id === object.sector_id)?.name.toLowerCase() || '';
                const termScore = example.terms.reduce((score, term) => score + (searchable.includes(term) ? 2 : 0), 0);
                const sectorScore = example.sectorTerms.some((term) => sectorName.includes(term)) ? 1 : 0;
                return { object, score: termScore + sectorScore };
              })
              .sort((a, b) =>
                b.score - a.score ||
                (sectorIndex.get(a.object.sector_id) ?? 0) - (sectorIndex.get(b.object.sector_id) ?? 0) ||
                a.object.grid_y - b.object.grid_y ||
                a.object.grid_x - b.object.grid_x ||
                a.object.id.localeCompare(b.object.id)
              );
            if (candidates[0]) path.push(candidates[0].object);
          }
          if (path.length < 3) continue;
          const loop: V2Loop = {
            id: `loop_${uuidv4()}`,
            name: example.name,
            description: example.description,
            color: example.color,
            closed: false,
          };
          loops.push(loop);
          path.slice(0, -1).forEach((source, index) => {
            const target = path[index + 1];
            connections.push({
              id: `connection_${uuidv4()}`,
              loop_id: loop.id,
              sequence: index,
              source_object_id: source.id,
              target_object_id: target.id,
              direction: 'source_to_target',
              label: `Segment ${index + 1}`,
              description: '',
            });
          });
          existingLoopNames.add(normaliseDataName(example.name));
        }
        if (loops.length === 0) return 0;
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              loops: [...activeCase.overlays.loops, ...loops],
              connectivity: [...activeCase.overlays.connectivity, ...connections],
            },
          },
          selectedLoopId: loops[0].id,
          expandedLoopIds: [...new Set([...get().expandedLoopIds, loops[0].id])],
        });
        return loops.length;
      },
      finishConnections: () => set({ connectionsFinished: true }),
      requestViewReset: () => set((state) => ({ viewResetNonce: state.viewResetNonce + 1 })),

      draft: {
        levels: Array.from({ length: 5 }).map((_, i) => ({ name: getWalkthroughLevelName(i, 5) })),
        sectors: Array.from({ length: 4 }).map((_, i) => ({ name: `Sector ${i + 1}` })),
      },
      autoFillLevelNames: true,
      setDraftLevels: (levels) => set((state) => ({ draft: { ...state.draft, levels } })),
      setDraftSectors: (sectors) => set((state) => ({ draft: { ...state.draft, sectors } })),
      setAutoFillLevelNames: (enabled) => set((state) => ({
        autoFillLevelNames: enabled,
        draft: enabled
          ? {
            ...state.draft,
            levels: state.draft.levels.map((level, index) => ({
              ...level,
              name: getWalkthroughLevelName(index, state.draft.levels.length),
            })),
          }
          : state.draft,
      })),

      confirmStructure: () => {
        const { draft, activeCase } = get();

        const newLevels = draft.levels.map((l, idx) => ({
          id: l.id || `lvl_${uuidv4()}`,
          index: idx,
          name: l.name,
        }));

        const newSectors = draft.sectors.map((s, idx) => ({
          id: s.id || `sec_${uuidv4()}`,
          index: idx,
          name: s.name,
        }));

        const levelIds = new Set(newLevels.map((level) => level.id));
        const sectorIds = new Set(newSectors.map((sector) => sector.id));
        const preservedData = (activeCase?.overlays.data || []).filter((object) =>
          levelIds.has(object.level_id) && sectorIds.has(object.sector_id)
        );
        const preservedDataIds = new Set(preservedData.map((object) => object.id));
        const preservedConnectivity = (activeCase?.overlays.connectivity || []).filter((connection) =>
          preservedDataIds.has(connection.source_object_id) && preservedDataIds.has(connection.target_object_id)
        );
        const preservedLoopIds = new Set(preservedConnectivity.map((connection) => connection.loop_id));
        const preservedLoops = (activeCase?.overlays.loops || []).filter((loop) => preservedLoopIds.has(loop.id));
        const newCase: V2Case = {
          id: activeCase?.id || `case_${uuidv4()}`,
          name: activeCase?.name || 'Untitled Pyramid Case',
          levels: newLevels,
          sectors: newSectors,
          grid: activeCase?.grid || { width: 8, height: 8 },
          overlays: activeCase ? {
            ...activeCase.overlays,
            data: preservedData,
            loops: preservedLoops,
            connectivity: preservedConnectivity,
          } : {
            data: preservedData,
            models: [],
            agents: [],
            decisions: [],
            loops: [],
            connectivity: [],
          },
        };

        set({
          activeCase: newCase,
          isEditingStructure: false,
          walkthroughStage: 'structure',
          dataLevelIndex: 0,
          skippedLevelIds: [],
          selectedVisualiseObjectId: null,
          visualiseExploded: false,
          visualiseFocusedLevelId: null,
          visualiseOnlyLevelId: null,
          visualiseHiddenSectorIds: [],
          visualiseSurfaceOpacity: 0.72,
          visualiseDataDensity: 'all',
          visualiseObjectScale: 1,
          visualiseLabelScale: 1,
          selectedLoopId: null,
          showOnlyLoopId: null,
          expandedLoopIds: [],
          loopBuilder: null,
          selectedConnectionId: null,
          connectionsFinished: false,
          draft: {
            levels: newLevels,
            sectors: newSectors,
          },
        });
      },
      reopenStructure: () => {
        const { activeCase } = get();
        if (activeCase) {
          set({
            isEditingStructure: true,
            walkthroughStage: 'structure',
            draft: {
              levels: activeCase.levels,
              sectors: activeCase.sectors,
            },
          });
        }
      },
      addDataObject: (draft, levelId, sectorId, gridX, gridY) => {
        const { activeCase } = get();
        if (!activeCase) return null;
        const exists = activeCase.overlays.data.some((object) =>
          object.level_id === levelId && object.grid_x === gridX && object.grid_y === gridY
        );
        if (exists) return null;
        const objectId = `data_${uuidv4()}`;
        const object: V2Object = {
          id: objectId,
          overlay: 'data',
          level_id: levelId,
          sector_id: sectorId,
          grid_x: gridX,
          grid_y: gridY,
          ...draft,
        };
        set({ activeCase: { ...activeCase, overlays: { ...activeCase.overlays, data: [...activeCase.overlays.data, object] } } });
        return objectId;
      },
      moveDataObject: (objectId, levelId, sectorId, gridX, gridY) => {
        const { activeCase } = get();
        if (!activeCase) return false;
        const occupied = activeCase.overlays.data.some((object) =>
          object.id !== objectId && object.level_id === levelId && object.grid_x === gridX && object.grid_y === gridY
        );
        if (occupied) return false;
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              data: activeCase.overlays.data.map((object) => object.id === objectId
                ? { ...object, level_id: levelId, sector_id: sectorId, grid_x: gridX, grid_y: gridY }
                : object),
            },
          },
        });
        return true;
      },
      autoFillDataLevel: (levelId) => {
        const { activeCase } = get();
        if (!activeCase) return 0;
        const level = activeCase.levels.find((item) => item.id === levelId);
        if (!level) return 0;
        const sectorIds = activeCase.sectors.map((sector) => sector.id);
        const cells = Array.from({ length: activeCase.grid.width * activeCase.grid.height }, (_, index) => ({
          x: index % activeCase.grid.width,
          y: Math.floor(index / activeCase.grid.width),
        }));
        const occupiedKeys = new Set(
          activeCase.overlays.data
            .filter((object) => object.level_id === levelId)
            .map((object) => `${object.grid_x}:${object.grid_y}`),
        );
        const usedNames = new Set(
          activeCase.overlays.data
            .filter((object) => object.level_id === levelId)
            .map((object) => normaliseDataName(object.name)),
        );
        const additions: V2Object[] = [];
        const fullSectors: string[] = [];
        const targetPerSector = 2;

        for (const sector of activeCase.sectors) {
          const availableCells = cells
            .filter((cell) =>
              !occupiedKeys.has(`${cell.x}:${cell.y}`) &&
              getSectorIdForGridCell(cell.x, cell.y, activeCase.grid.width, activeCase.grid.height, sectorIds) === sector.id
            )
            .sort((a, b) => {
              const aEdge = Math.min(a.x, a.y, activeCase.grid.width - 1 - a.x, activeCase.grid.height - 1 - a.y);
              const bEdge = Math.min(b.x, b.y, activeCase.grid.width - 1 - b.x, activeCase.grid.height - 1 - b.y);
              if (aEdge !== bEdge) return aEdge - bEdge;
              const aRadius = Math.hypot(a.x + 0.5 - activeCase.grid.width / 2, a.y + 0.5 - activeCase.grid.height / 2);
              const bRadius = Math.hypot(b.x + 0.5 - activeCase.grid.width / 2, b.y + 0.5 - activeCase.grid.height / 2);
              if (aRadius !== bRadius) return bRadius - aRadius;
              return a.y - b.y || a.x - b.x;
            });

          if (availableCells.length < targetPerSector) fullSectors.push(sector.name);
          const names = getAutoFillNameCandidates(level.name, sector.name);
          const selectedCells = availableCells.slice(0, targetPerSector);

          for (const cell of selectedCells) {
            let name = names.find((candidate) => !usedNames.has(normaliseDataName(candidate)));
            if (!name) {
              const baseName = `${sector.name} ${level.name} data`;
              name = baseName;
              let suffix = 2;
              while (usedNames.has(normaliseDataName(name))) {
                name = `${baseName} ${suffix}`;
                suffix += 1;
              }
            }
            usedNames.add(normaliseDataName(name));
            occupiedKeys.add(`${cell.x}:${cell.y}`);
            const sectorId = sector.id;
            additions.push({
              id: `data_${uuidv4()}`,
              overlay: 'data',
              level_id: levelId,
              sector_id: sectorId,
              grid_x: cell.x,
              grid_y: cell.y,
              name,
              description: `Representative ${sector.name} data for ${level.name}.`,
              availability: 'Available',
              source: 'Representative source',
              protocol: 'OPC UA',
              format: 'Structured',
              data_type: 'Signal',
              frequency: '1 Hz',
              sensing_settings: 'Default settings',
              preprocessing: 'Basic validation',
              intended_use: 'Explore the data layer',
            });
          }
        }

        const sectorCount = activeCase.sectors.length;
        const expected = targetPerSector * sectorCount;
        const notice = fullSectors.length > 0
          ? `Added ${additions.length} representative data element${additions.length === 1 ? '' : 's'} (${targetPerSector} per sector where available). Full sectors: ${fullSectors.join(', ')}.`
          : `Added ${additions.length} representative data elements (${targetPerSector} per sector across ${sectorCount} sectors).`;
        set({
          activeCase: {
            ...activeCase,
            overlays: { ...activeCase.overlays, data: [...activeCase.overlays.data, ...additions] },
          },
          dataAutoFillNotice: additions.length === expected
            ? notice
            : `${notice} No manual data was overwritten.`,
        });
        return additions.length;
      },
      clearDataLevel: (levelId) => set((state) => {
        if (!state.activeCase) return state;
        const removedIds = new Set(
          state.activeCase.overlays.data
            .filter((object) => object.level_id === levelId)
            .map((object) => object.id),
        );
        if (removedIds.size === 0) {
          return { ...state, dataAutoFillNotice: null };
        }
        const remainingConnectivity = state.activeCase.overlays.connectivity.filter((connection) =>
          !removedIds.has(connection.source_object_id) && !removedIds.has(connection.target_object_id)
        );
        const remainingLoopIds = new Set(remainingConnectivity.map((connection) => connection.loop_id));
        const remainingLoops = state.activeCase.overlays.loops.filter((loop) => remainingLoopIds.has(loop.id));
        const selectionAffected = !remainingConnectivity.some((connection) => connection.id === state.selectedConnectionId);
        return {
          ...state,
          dataAutoFillNotice: null,
          selectedConnectionId: selectionAffected ? null : state.selectedConnectionId,
          selectedLoopId: state.selectedLoopId && remainingLoopIds.has(state.selectedLoopId) ? state.selectedLoopId : null,
          showOnlyLoopId: state.showOnlyLoopId && remainingLoopIds.has(state.showOnlyLoopId) ? state.showOnlyLoopId : null,
          activeCase: {
            ...state.activeCase,
            overlays: {
              ...state.activeCase.overlays,
              data: state.activeCase.overlays.data.filter((object) => object.level_id !== levelId),
              loops: remainingLoops,
              connectivity: remainingConnectivity,
            },
          },
        };
      }),
      skipDataLevel: () => set((state) => {
        const level = state.activeCase?.levels[state.dataLevelIndex];
        return level
          ? { skippedLevelIds: state.skippedLevelIds.includes(level.id) ? state.skippedLevelIds : [...state.skippedLevelIds, level.id] }
          : state;
      }),
      resetDataLevel: () => set({ dataLevelIndex: 0, skippedLevelIds: [] }),
      removeDataObject: (objectId) => set((state) => state.activeCase ? ({
        selectedVisualiseObjectId: state.selectedVisualiseObjectId === objectId ? null : state.selectedVisualiseObjectId,
        selectedConnectionId: state.activeCase.overlays.connectivity.some((connection) =>
          connection.id === state.selectedConnectionId &&
          (connection.source_object_id === objectId || connection.target_object_id === objectId)
        ) ? null : state.selectedConnectionId,
        activeCase: {
          ...state.activeCase,
          overlays: {
            ...state.activeCase.overlays,
            data: state.activeCase.overlays.data.filter((object) => object.id !== objectId),
            connectivity: state.activeCase.overlays.connectivity.filter((connection) =>
              connection.source_object_id !== objectId && connection.target_object_id !== objectId
            ),
            loops: state.activeCase.overlays.loops.filter((loop) =>
              state.activeCase?.overlays.connectivity.some((connection) =>
                connection.loop_id === loop.id &&
                connection.source_object_id !== objectId &&
                connection.target_object_id !== objectId
              )
            ),
          },
        },
      }) : state),
      updateDataObjectMetadata: (objectId, patch) => {
        const { activeCase } = get();
        if (!activeCase) return false;
        const object = activeCase.overlays.data.find((candidate) => candidate.id === objectId);
        if (!object) return false;
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              data: activeCase.overlays.data.map((candidate) => candidate.id === objectId
                ? { ...candidate, ...patch }
                : candidate),
            },
          },
        });
        return true;
      },
    }),
    {
      name: 'manufacturing-v2-case-storage',
        version: 6,
      migrate: (persistedState: any) => {
        const activeCase = persistedState?.activeCase;
        const isEditingStructure = activeCase
          ? persistedState?.isEditingStructure === true
          : persistedState?.isEditingStructure ?? true;
        return {
          ...persistedState,
          isEditingStructure,
           walkthroughStage: activeCase && !isEditingStructure && ['data', 'visualise', 'connections'].includes(persistedState?.walkthroughStage)
             ? persistedState.walkthroughStage
            : 'structure',
           visualiseSurfaceOpacity: activeCase && !isEditingStructure && persistedState?.walkthroughStage === 'connections'
             ? 0.2
             : 0.72,
           connectionsFinished: persistedState?.connectionsFinished ?? false,
          autoFillLevelNames: persistedState?.autoFillLevelNames ?? true,
          showV2Labels: persistedState?.showV2Labels ?? true,
           selectedVisualiseObjectId: null,
           activeCase: activeCase ? {
             ...activeCase,
               id: activeCase.id || `case_${uuidv4()}`,
               name: activeCase.name || 'Untitled Pyramid Case',
               overlays: normalisePersistedLoops({
                 ...(activeCase || {}),
                 overlays: {
                   ...(activeCase.overlays || {}),
                   data: activeCase.overlays?.data || activeCase.objects || [],
                   models: activeCase.overlays?.models || [],
                   agents: activeCase.overlays?.agents || [],
                   decisions: activeCase.overlays?.decisions || [],
                 },
               }).overlays,
           } : null,
        };
      },
      partialize: (state) => ({
        activeCase: state.activeCase,
        isEditingStructure: state.isEditingStructure,
        walkthroughStage: state.walkthroughStage,
        dataLevelIndex: state.dataLevelIndex,
        skippedLevelIds: state.skippedLevelIds,
        connectionsFinished: state.connectionsFinished,
        autoFillLevelNames: state.autoFillLevelNames,
        showV2Labels: state.showV2Labels,
        draft: state.draft,
      }),
    }
  )
);
