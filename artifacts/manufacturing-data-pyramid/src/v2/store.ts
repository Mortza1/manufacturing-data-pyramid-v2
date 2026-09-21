import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { V2Case, V2Connection, V2Object } from './types';
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
export interface V2ConnectionDraft {
  label: string;
  description: string;
  loop: string;
  color: string;
}

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
  connectionSourceObjectId: string | null;
  connectionTargetObjectId: string | null;
  selectedConnectionId: string | null;
  connectionLoopFilter: 'all' | string;
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
  selectConnectionObject: (objectId: string) => void;
  clearConnectionSelection: () => void;
  selectConnection: (connectionId: string) => void;
  createConnection: (draft: V2ConnectionDraft) => string | null;
  updateConnection: (connectionId: string, patch: Partial<V2ConnectionDraft>) => boolean;
  deleteConnection: (connectionId: string) => boolean;
  setConnectionLoopFilter: (loop: 'all' | string) => void;
  setConnectionArrowThickness: (thickness: number) => void;
  addExampleConnections: (visibleObjectIds: string[]) => number;
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
      connectionSourceObjectId: null,
      connectionTargetObjectId: null,
      selectedConnectionId: null,
      connectionLoopFilter: 'all',
      connectionArrowThickness: 1,
      connectionsFinished: false,
      viewResetNonce: 0,
      setIsEditingStructure: (isEditing) => set({ isEditingStructure: isEditing }),
      setWalkthroughStage: (walkthroughStage) => set({ walkthroughStage }),
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
      selectConnectionObject: (objectId) => set((state) => {
        if (!state.activeCase?.overlays.data.some((object) => object.id === objectId)) return state;
        if (!state.connectionSourceObjectId || state.connectionTargetObjectId) {
          return {
            connectionSourceObjectId: objectId,
            connectionTargetObjectId: null,
            selectedConnectionId: null,
          };
        }
        if (state.connectionSourceObjectId === objectId) return state;
        return {
          connectionTargetObjectId: objectId,
          selectedConnectionId: null,
        };
      }),
      clearConnectionSelection: () => set({
        connectionSourceObjectId: null,
        connectionTargetObjectId: null,
        selectedConnectionId: null,
      }),
      selectConnection: (connectionId) => set((state) => {
        const connection = state.activeCase?.overlays.connectivity.find((item) => item.id === connectionId);
        return connection
          ? {
            selectedConnectionId: connection.id,
            connectionSourceObjectId: connection.source_object_id,
            connectionTargetObjectId: connection.target_object_id,
          }
          : state;
      }),
      createConnection: (draft) => {
        const { activeCase, connectionSourceObjectId, connectionTargetObjectId } = get();
        if (!activeCase || !connectionSourceObjectId || !connectionTargetObjectId || connectionSourceObjectId === connectionTargetObjectId) return null;
        const duplicate = activeCase.overlays.connectivity.some((connection) =>
          connection.source_object_id === connectionSourceObjectId &&
          connection.target_object_id === connectionTargetObjectId
        );
        if (duplicate) return null;
        const source = activeCase.overlays.data.find((object) => object.id === connectionSourceObjectId);
        const target = activeCase.overlays.data.find((object) => object.id === connectionTargetObjectId);
        if (!source || !target) return null;
        const connection: V2Connection = {
          id: `connection_${uuidv4()}`,
          source_object_id: source.id,
          target_object_id: target.id,
          direction: 'source_to_target',
          label: draft.label.trim() || `${source.name} → ${target.name}`,
          description: draft.description.trim(),
          loop: draft.loop.trim() || 'Unassigned',
          color: draft.color || '#67e8f9',
        };
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              connectivity: [...activeCase.overlays.connectivity, connection],
            },
          },
          selectedConnectionId: connection.id,
        });
        return connection.id;
      },
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
                  ...(patch.label !== undefined ? { label: patch.label.trim() || item.label } : {}),
                  ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
                  ...(patch.loop !== undefined ? { loop: patch.loop.trim() || 'Unassigned' } : {}),
                  ...(patch.color !== undefined ? { color: patch.color || item.color } : {}),
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
          connectionSourceObjectId: state.selectedConnectionId === connectionId ? null : state.connectionSourceObjectId,
          connectionTargetObjectId: state.selectedConnectionId === connectionId ? null : state.connectionTargetObjectId,
        }));
        return true;
      },
      setConnectionLoopFilter: (connectionLoopFilter) => set({ connectionLoopFilter }),
      setConnectionArrowThickness: (connectionArrowThickness) => set({
        connectionArrowThickness: Math.min(1.8, Math.max(0.7, connectionArrowThickness)),
      }),
      addExampleConnections: (visibleObjectIds) => {
        const { activeCase } = get();
        if (!activeCase) return 0;
        const visible = activeCase.overlays.data
          .filter((object) => visibleObjectIds.includes(object.id))
          .sort((a, b) => a.level_id.localeCompare(b.level_id) || a.sector_id.localeCompare(b.sector_id) || a.grid_y - b.grid_y || a.grid_x - b.grid_x || a.id.localeCompare(b.id));
        const existing = new Set(activeCase.overlays.connectivity.map((connection) => `${connection.source_object_id}->${connection.target_object_id}`));
        const additions: V2Connection[] = [];
        const bySector = new Map<string, V2Object[]>();
        visible.forEach((object) => {
          const list = bySector.get(object.sector_id) ?? [];
          list.push(object);
          bySector.set(object.sector_id, list);
        });
        for (const objects of bySector.values()) {
          const candidates = objects
            .map((object) => ({ object, levelIndex: activeCase.levels.findIndex((level) => level.id === object.level_id) }))
            .sort((a, b) => a.levelIndex - b.levelIndex || a.object.grid_y - b.object.grid_y || a.object.grid_x - b.object.grid_x);
          for (let index = 0; index < candidates.length - 1 && additions.length < 3; index += 1) {
            const source = candidates[index].object;
            const target = candidates[index + 1].object;
            if (candidates[index].levelIndex === candidates[index + 1].levelIndex) continue;
            const key = `${source.id}->${target.id}`;
            if (existing.has(key)) continue;
            existing.add(key);
            additions.push({
              id: `connection_${uuidv4()}`,
              source_object_id: source.id,
              target_object_id: target.id,
              direction: 'source_to_target',
              label: `${source.name} → ${target.name}`,
              description: 'Example relationship generated from adjacent levels in the same sector.',
              loop: 'Example Flow',
              color: '#a78bfa',
            });
          }
          if (additions.length >= 3) break;
        }
        if (additions.length === 0) return 0;
        set({
          activeCase: {
            ...activeCase,
            overlays: {
              ...activeCase.overlays,
              connectivity: [...activeCase.overlays.connectivity, ...additions],
            },
          },
          selectedConnectionId: additions[0].id,
          connectionSourceObjectId: additions[0].source_object_id,
          connectionTargetObjectId: additions[0].target_object_id,
        });
        return additions.length;
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
        const newCase: V2Case = {
          id: activeCase?.id || `case_${uuidv4()}`,
          name: activeCase?.name || 'Untitled Pyramid Case',
          levels: newLevels,
          sectors: newSectors,
          grid: activeCase?.grid || { width: 8, height: 8 },
          overlays: activeCase ? {
            ...activeCase.overlays,
            data: preservedData,
            connectivity: preservedConnectivity,
          } : {
            data: preservedData,
            models: [],
            agents: [],
            decisions: [],
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
          connectionSourceObjectId: null,
          connectionTargetObjectId: null,
          selectedConnectionId: null,
          connectionLoopFilter: 'all',
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
        const selectedConnection = state.activeCase.overlays.connectivity.find((connection) => connection.id === state.selectedConnectionId);
        const selectionAffected = Boolean(
          (state.connectionSourceObjectId && removedIds.has(state.connectionSourceObjectId)) ||
          (state.connectionTargetObjectId && removedIds.has(state.connectionTargetObjectId)) ||
          (selectedConnection && (removedIds.has(selectedConnection.source_object_id) || removedIds.has(selectedConnection.target_object_id))),
        );
        return {
          ...state,
          dataAutoFillNotice: null,
          connectionSourceObjectId: selectionAffected ? null : state.connectionSourceObjectId,
          connectionTargetObjectId: selectionAffected ? null : state.connectionTargetObjectId,
          selectedConnectionId: selectionAffected ? null : state.selectedConnectionId,
          activeCase: {
            ...state.activeCase,
            overlays: {
              ...state.activeCase.overlays,
              data: state.activeCase.overlays.data.filter((object) => object.level_id !== levelId),
              connectivity: state.activeCase.overlays.connectivity.filter((connection) =>
                !removedIds.has(connection.source_object_id) && !removedIds.has(connection.target_object_id)
              ),
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
        connectionSourceObjectId: state.connectionSourceObjectId === objectId ? null : state.connectionSourceObjectId,
        connectionTargetObjectId: state.connectionTargetObjectId === objectId ? null : state.connectionTargetObjectId,
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
       version: 5,
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
           connectionsFinished: persistedState?.connectionsFinished ?? false,
          autoFillLevelNames: persistedState?.autoFillLevelNames ?? true,
          showV2Labels: persistedState?.showV2Labels ?? true,
           selectedVisualiseObjectId: null,
           activeCase: activeCase ? {
             ...activeCase,
               id: activeCase.id || `case_${uuidv4()}`,
               name: activeCase.name || 'Untitled Pyramid Case',
               overlays: {
                 ...(activeCase.overlays || {}),
                 data: activeCase.overlays?.data || activeCase.objects || [],
                 models: activeCase.overlays?.models || [],
                 agents: activeCase.overlays?.agents || [],
                 decisions: activeCase.overlays?.decisions || [],
                 connectivity: (activeCase.overlays?.connectivity || []).map((connection: any) => ({
                   ...connection,
                   direction: connection.direction || 'source_to_target',
                   label: connection.label || connection.name || 'Connection',
                   description: connection.description || '',
                   loop: connection.loop || 'Unassigned',
                   color: connection.color || '#67e8f9',
                 })),
               },
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
