import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { V2Case } from './types';

interface V2Draft {
  levels: { id?: string; name: string }[];
  sectors: { id?: string; name: string }[];
}

interface V2State {
  mode: 'explorer' | 'walkthrough' | 'advanced';
  setMode: (mode: 'explorer' | 'walkthrough' | 'advanced') => void;

  activeCase: V2Case | null;
  isEditingStructure: boolean;
  setIsEditingStructure: (isEditing: boolean) => void;

  draft: V2Draft;
  setDraftLevels: (levels: { id?: string; name: string }[]) => void;
  setDraftSectors: (sectors: { id?: string; name: string }[]) => void;

  confirmStructure: () => void;
  reopenStructure: () => void;
}

export const useV2Store = create<V2State>()(
  persist(
    (set, get) => ({
      mode: 'explorer',
      setMode: (mode) => set({ mode }),

      activeCase: null,
      isEditingStructure: true,
      setIsEditingStructure: (isEditing) => set({ isEditingStructure: isEditing }),

      draft: {
        levels: Array.from({ length: 5 }).map((_, i) => ({ name: `Level ${i + 1}` })),
        sectors: Array.from({ length: 4 }).map((_, i) => ({ name: `Sector ${i + 1}` })),
      },
      setDraftLevels: (levels) => set((state) => ({ draft: { ...state.draft, levels } })),
      setDraftSectors: (sectors) => set((state) => ({ draft: { ...state.draft, sectors } })),

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

        const newCase: V2Case = {
          id: activeCase?.id || `case_${uuidv4()}`,
          name: activeCase?.name || 'Untitled Pyramid Case',
          levels: newLevels,
          sectors: newSectors,
          grid: activeCase?.grid || { width: 8, height: 8 },
          overlays: activeCase?.overlays || {
            data: [],
            models: [],
            agents: [],
            decisions: [],
            connectivity: [],
          },
        };

        set({
          activeCase: newCase,
          isEditingStructure: false,
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
            draft: {
              levels: activeCase.levels,
              sectors: activeCase.sectors,
            },
          });
        }
      },
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
        draft: state.draft,
      }),
    }
  )
);
