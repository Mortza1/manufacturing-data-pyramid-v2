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

interface V2State {
  mode: 'explorer' | 'walkthrough' | 'advanced';
  setMode: (mode: 'explorer' | 'walkthrough' | 'advanced') => void;

  activeCase: V2Case | null;
  isEditingStructure: boolean;
  walkthroughStage: 'structure' | 'data';
  dataLevelIndex: number;
  skippedLevelIds: string[];
  setIsEditingStructure: (isEditing: boolean) => void;
  setWalkthroughStage: (stage: 'structure' | 'data') => void;
  setDataLevelIndex: (index: number) => void;

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
      setIsEditingStructure: (isEditing) => set({ isEditingStructure: isEditing }),
      setWalkthroughStage: (walkthroughStage) => set({ walkthroughStage }),
      setDataLevelIndex: (dataLevelIndex) => set({ dataLevelIndex: Math.max(0, dataLevelIndex) }),

      draft: {
        levels: Array.from({ length: 5 }).map((_, i) => ({ name: `Level ${i + 1}` })),
        sectors: Array.from({ length: 4 }).map((_, i) => ({ name: `Sector ${i + 1}` })),
      },
      autoFillLevelNames: true,
      setDraftLevels: (levels) => set((state) => ({ draft: { ...state.draft, levels } })),
      setDraftSectors: (sectors) => set((state) => ({ draft: { ...state.draft, sectors } })),
      setAutoFillLevelNames: (enabled) => set((state) => ({
        autoFillLevelNames: enabled,
        draft: enabled
          ? { ...state.draft, levels: state.draft.levels.map((level, index) => ({ ...level, name: `Level ${index + 1}` })) }
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
          walkthroughStage: 'data',
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
        const names = ['Telemetry Signal', 'Production Event', 'Quality Reading', 'Maintenance State', 'Run Context', 'Sensor Snapshot'];
        const additions: V2Object[] = [];
        for (let y = 0; y < activeCase.grid.height && additions.length < names.length; y += 1) {
          for (let x = 0; x < activeCase.grid.width && additions.length < names.length; x += 1) {
            const occupied = activeCase.overlays.data.some((object) =>
              object.level_id === levelId && object.grid_x === x && object.grid_y === y
            );
            if (occupied) continue;
            const sectorId = getSectorIdForGridCell(x, y, activeCase.grid.width, activeCase.grid.height, activeCase.sectors.map((sector) => sector.id));
            if (!sectorId) continue;
            additions.push({
              id: `data_${uuidv4()}`,
              overlay: 'data',
              level_id: levelId,
              sector_id: sectorId,
              grid_x: x,
              grid_y: y,
              name: names[additions.length],
              description: 'Representative data element for the walkthrough.',
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
        set({
          activeCase: {
            ...activeCase,
            overlays: { ...activeCase.overlays, data: [...activeCase.overlays.data, ...additions] },
          },
        });
        return additions.length;
      },
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
          },
        },
      }) : state),
    }),
    {
      name: 'manufacturing-v2-case-storage',
      version: 2,
      migrate: (persistedState: any) => {
        const activeCase = persistedState?.activeCase;
        if (!activeCase) return persistedState;
        return {
          ...persistedState,
          activeCase: {
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
          },
        };
      },
      partialize: (state) => ({
        activeCase: state.activeCase,
        isEditingStructure: state.isEditingStructure,
        walkthroughStage: state.walkthroughStage,
        dataLevelIndex: state.dataLevelIndex,
        skippedLevelIds: state.skippedLevelIds,
        autoFillLevelNames: state.autoFillLevelNames,
        draft: state.draft,
      }),
    }
  )
);
