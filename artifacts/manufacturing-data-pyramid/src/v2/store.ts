import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { V2Case, V2Object } from './types';
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
  walkthroughStage: 'structure' | 'data';
  dataLevelIndex: number;
  skippedLevelIds: string[];
  dataAutoFillNotice: string | null;
  showV2Labels: boolean;
  setIsEditingStructure: (isEditing: boolean) => void;
  setWalkthroughStage: (stage: 'structure' | 'data') => void;
  setDataLevelIndex: (index: number) => void;
  setShowV2Labels: (show: boolean) => void;

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
      setIsEditingStructure: (isEditing) => set({ isEditingStructure: isEditing }),
      setWalkthroughStage: (walkthroughStage) => set({ walkthroughStage }),
      setDataLevelIndex: (dataLevelIndex) => set({ dataLevelIndex: Math.max(0, dataLevelIndex), dataAutoFillNotice: null }),
      setShowV2Labels: (showV2Labels) => set({ showV2Labels }),

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
        const newCase: V2Case = {
          id: activeCase?.id || `case_${uuidv4()}`,
          name: activeCase?.name || 'Untitled Pyramid Case',
          levels: newLevels,
          sectors: newSectors,
          grid: activeCase?.grid || { width: 8, height: 8 },
          overlays: activeCase ? {
            ...activeCase.overlays,
            data: preservedData,
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
        return {
          ...state,
          dataAutoFillNotice: null,
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
    }),
    {
      name: 'manufacturing-v2-case-storage',
      version: 4,
      migrate: (persistedState: any) => {
        const activeCase = persistedState?.activeCase;
        const isEditingStructure = activeCase
          ? persistedState?.isEditingStructure === true
          : persistedState?.isEditingStructure ?? true;
        return {
          ...persistedState,
          isEditingStructure,
          walkthroughStage: activeCase && !isEditingStructure && persistedState?.walkthroughStage === 'data'
            ? 'data'
            : 'structure',
          autoFillLevelNames: persistedState?.autoFillLevelNames ?? true,
          showV2Labels: persistedState?.showV2Labels ?? true,
          activeCase: activeCase ? {
            ...activeCase,
              id: activeCase.id || `case_${uuidv4()}`,
              name: activeCase.name || 'Untitled Pyramid Case',
              overlays: activeCase.overlays || {
                data: activeCase.objects || [],
                models: [],
                agents: [],
                decisions: [],
                connectivity: [],
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
        autoFillLevelNames: state.autoFillLevelNames,
        showV2Labels: state.showV2Labels,
        draft: state.draft,
      }),
    }
  )
);
