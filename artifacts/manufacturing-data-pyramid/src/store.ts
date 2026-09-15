import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  COURSES,
  DEFAULT_LEVEL_NAMES,
  CourseMode,
  DataObject,
  DataCategory,
  ConnectionLoop,
  FORGING_LOOPS,
  FORGING_OBJECTS,
  ForgingSector,
  FORGING_SECTOR_ANCHORS,
} from './data';

interface MainPyramidSnapshot {
  courseMode: CourseMode;
  journeyActive: boolean;
  journeyStep: number;
  journeyPlaying: boolean;
  presentationMode: boolean;
  focusLevel: number | null;
  isolateLevel: number | null;
  selectedLevelId: number | null;
  exploded: boolean;
  cutaway: boolean;
  showRelationships: boolean;
  showLevelLabels: boolean;
  pyramidOpacity: number;
  sectionLevel: number | null;
  activeDataOnly: boolean;
  levelNames: Record<number, string>;
  selectedObjectId: string | null;
  selectedRelationshipId: string | null;
  placedObjects: DataObject[];
}

const cloneForgingObjects = () => FORGING_OBJECTS.map((object) => ({
  ...object,
  position: object.position ? [...object.position] as [number, number, number] : undefined,
}));

const cloneForgingLoops = () => FORGING_LOOPS.map((loop) => ({
  ...loop,
  relationships: loop.relationships.map((relationship) => ({ ...relationship })),
}));

export interface AppState {
  courseMode: CourseMode;
  journeyActive: boolean;
  journeyStep: number;
  journeyPlaying: boolean;
  presentationMode: boolean;
  
  focusLevel: number | null;
  isolateLevel: number | null;
  selectedLevelId: number | null;
  exploded: boolean;
  cutaway: boolean;
  showRelationships: boolean;
  showLevelLabels: boolean;
  pyramidOpacity: number;
  sectionLevel: number | null;
  activeDataOnly: boolean;
  levelNames: Record<number, string>;
  reducedMotion: boolean;
  
  selectedObjectId: string | null;
  selectedRelationshipId: string | null;
  draggedLibraryItem: Omit<DataObject, 'id'> | null;
  dragHoveredLevelId: number | null;
  dragPosition: [number, number, number] | null;
  touchSelectedItem: Omit<DataObject, 'id'> | null;
  
  placedObjects: DataObject[];
  
  setCourseMode: (mode: CourseMode) => void;
  setJourneyActive: (active: boolean) => void;
  setJourneyStep: (step: number) => void;
  setJourneyPlaying: (playing: boolean) => void;
  setPresentationMode: (active: boolean) => void;
  setFocusLevel: (level: number | null) => void;
  setIsolateLevel: (level: number | null) => void;
  setSelectedLevelId: (level: number | null) => void;
  setExploded: (exploded: boolean) => void;
  setCutaway: (cutaway: boolean) => void;
  setShowRelationships: (show: boolean) => void;
  setShowLevelLabels: (show: boolean) => void;
  setPyramidOpacity: (opacity: number) => void;
  setSectionLevel: (level: number | null) => void;
  setActiveDataOnly: (activeOnly: boolean) => void;
  setLevelName: (level: number, name: string) => void;
  setReducedMotion: (reduced: boolean) => void;
  setSelectedObjectId: (id: string | null) => void;
  setSelectedRelationshipId: (id: string | null) => void;
  setDraggedLibraryItem: (item: Omit<DataObject, 'id'> | null) => void;
  setDragHoveredLevelId: (level: number | null) => void;
  setDragPosition: (position: [number, number, number] | null) => void;
  setTouchSelectedItem: (item: Omit<DataObject, 'id'> | null) => void;
  placeObject: (item: Omit<DataObject, 'id'>, position: [number, number, number], level: number) => void;
  removeObject: (id: string) => void;
  resetCourse: () => void;
  autoFillDemo: () => void;
  clearActiveData: () => void;
  forgingCaseStudy: boolean;
  forgingObjects: DataObject[];
  forgingLoops: ConnectionLoop[];
  forgingSeparateSectors: boolean;
  forgingExploded: boolean;
  forgingCutaway: boolean;
  forgingSectionLevel: number | null;
  forgingShowLabels: boolean;
  forgingLabelDistance: number;
  forgingPyramidOpacity: number;
  forgingFocusedSector: ForgingSector | null;
  forgingHideOtherSectors: boolean;
  selectedForgingLoopId: string | null;
  mainPyramidSnapshot: MainPyramidSnapshot | null;
  enterForgingCaseStudy: () => void;
  exitForgingCaseStudy: () => void;
  setForgingSeparateSectors: (separate: boolean) => void;
  setForgingExploded: (exploded: boolean) => void;
  setForgingCutaway: (cutaway: boolean) => void;
  setForgingSectionLevel: (level: number | null) => void;
  setForgingShowLabels: (show: boolean) => void;
  setForgingLabelDistance: (distance: number) => void;
  setForgingPyramidOpacity: (opacity: number) => void;
  setForgingFocusedSector: (sector: ForgingSector | null) => void;
  setForgingHideOtherSectors: (hide: boolean) => void;
  setForgingObject: (id: string, patch: Partial<Pick<DataObject, 'name' | 'level' | 'sector' | 'type' | 'source' | 'description' | 'category'>>) => void;
  removeForgingObject: (id: string) => void;
  toggleForgingLoop: (id: string) => void;
  setSelectedForgingLoopId: (id: string | null) => void;
  deleteForgingLoop: (id: string) => void;
  createForgingLoop: (name: string, color: string, sourceId: string, targetId: string) => void;
  addForgingConnection: (loopId: string, sourceId: string, targetId: string) => void;
}

const representativeObjects = (mode: CourseMode) =>
  COURSES[mode].initialObjects
    .filter((object) => !['ds-14', 'ds-15'].includes(object.id))
    .map(({ isActive, isUserAdded, ...object }) => object);

const activeDemoObjects = (mode: CourseMode) =>
  COURSES[mode].initialObjects.map((object) => ({ ...object, isActive: true, isUserAdded: false }));

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      courseMode: 'data-science',
      journeyActive: false,
      journeyStep: 0,
      journeyPlaying: false,
      presentationMode: false,
      
      focusLevel: null,
      isolateLevel: null,
      selectedLevelId: null,
      exploded: false,
      cutaway: true,
      showRelationships: false,
      showLevelLabels: true,
      pyramidOpacity: 0.72,
      sectionLevel: 3,
      activeDataOnly: false,
      levelNames: { ...DEFAULT_LEVEL_NAMES },
      reducedMotion: false,
      
      selectedObjectId: null,
      selectedRelationshipId: null,
      draggedLibraryItem: null,
      dragHoveredLevelId: null,
      dragPosition: null,
      touchSelectedItem: null,
      placedObjects: representativeObjects('data-science'),
      forgingCaseStudy: false,
      forgingObjects: cloneForgingObjects(),
      forgingLoops: cloneForgingLoops(),
      forgingSeparateSectors: false,
      forgingExploded: false,
      forgingCutaway: false,
      forgingSectionLevel: 3,
      forgingShowLabels: true,
      forgingLabelDistance: 0.9,
      forgingPyramidOpacity: 0.72,
      forgingFocusedSector: null,
      forgingHideOtherSectors: false,
      selectedForgingLoopId: null,
      mainPyramidSnapshot: null,

      setCourseMode: (mode) => set({ 
        courseMode: mode, 
        journeyStep: 0, 
        journeyActive: false, 
        journeyPlaying: false,
        selectedObjectId: null,
        selectedRelationshipId: null,
        selectedLevelId: null,
         placedObjects: representativeObjects(mode),
         activeDataOnly: false
      }),
      setJourneyActive: (active) => set((state) => ({
        journeyActive: active,
        journeyStep: 0,
        journeyPlaying: active,
        focusLevel: active ? null : state.focusLevel,
        isolateLevel: active ? null : state.isolateLevel,
        selectedObjectId: null,
        selectedRelationshipId: null,
        selectedLevelId: null,
      })),
      setJourneyStep: (step) => set((state) => ({
        journeyStep: step,
        focusLevel: state.journeyActive ? null : state.focusLevel,
        isolateLevel: state.journeyActive ? null : state.isolateLevel,
        selectedObjectId: null,
        selectedRelationshipId: null,
        selectedLevelId: null,
      })),
      setJourneyPlaying: (playing) => set({ journeyPlaying: playing }),
      setPresentationMode: (active) => set({ presentationMode: active }),
      setFocusLevel: (level) => set({ focusLevel: level, selectedLevelId: level }),
      setIsolateLevel: (level) => set({ isolateLevel: level }),
      setSelectedLevelId: (level) => set({ selectedLevelId: level, selectedObjectId: null, selectedRelationshipId: null }),
      setExploded: (exploded) => set({ exploded }),
      setCutaway: (cutaway) => set({ cutaway }),
      setShowRelationships: (showRelationships) => set({ showRelationships }),
      setShowLevelLabels: (showLevelLabels) => set({ showLevelLabels }),
      setPyramidOpacity: (pyramidOpacity) => set({ pyramidOpacity: Math.min(1, Math.max(0.18, pyramidOpacity)) }),
      setSectionLevel: (sectionLevel) => set({ sectionLevel }),
      setActiveDataOnly: (activeDataOnly) => set({ activeDataOnly }),
      setLevelName: (level, name) => set((state) => ({
        levelNames: { ...state.levelNames, [level]: name.trim() || DEFAULT_LEVEL_NAMES[level] },
      })),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setSelectedObjectId: (id) => set({ selectedObjectId: id, selectedRelationshipId: null, selectedLevelId: null }),
      setSelectedRelationshipId: (id) => set({ selectedRelationshipId: id, selectedObjectId: null, selectedLevelId: null }),
      setDraggedLibraryItem: (item) => set({ draggedLibraryItem: item }),
      setDragHoveredLevelId: (level) => set({ dragHoveredLevelId: level }),
      setDragPosition: (position) => set({ dragPosition: position }),
      setTouchSelectedItem: (item) => set({ touchSelectedItem: item }),
      
      placeObject: (item, position, level) => set((state) => ({
        placedObjects: [...state.placedObjects, { ...item, id: uuidv4(), position, level, isUserAdded: true, isActive: true }]
      })),
      
      removeObject: (id) => set((state) => ({
        placedObjects: state.placedObjects.filter(o => o.id !== id),
        selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
      })),

      resetCourse: () => set((state) => ({
        journeyActive: false,
        journeyStep: 0,
        journeyPlaying: false,
        focusLevel: null,
        isolateLevel: null,
        selectedLevelId: null,
        exploded: false,
        cutaway: true,
        sectionLevel: 3,
        activeDataOnly: false,
        showRelationships: false,
        selectedObjectId: null,
        selectedRelationshipId: null,
        dragHoveredLevelId: null,
        dragPosition: null,
        touchSelectedItem: null,
        placedObjects: representativeObjects(state.courseMode)
      })),
      autoFillDemo: () => set((state) => ({
        placedObjects: activeDemoObjects(state.courseMode),
        activeDataOnly: false,
        selectedObjectId: null,
        selectedRelationshipId: null,
        selectedLevelId: null,
      })),
      clearActiveData: () => set((state) => ({
        placedObjects: representativeObjects(state.courseMode),
        activeDataOnly: false,
        selectedObjectId: null,
        selectedRelationshipId: null,
        selectedLevelId: null,
      })),
      enterForgingCaseStudy: () => set((state) => {
        if (state.forgingCaseStudy) return state;
        return {
          forgingCaseStudy: true,
          forgingObjects: cloneForgingObjects(),
          forgingLoops: cloneForgingLoops(),
          forgingSeparateSectors: false,
          forgingExploded: false,
          forgingCutaway: false,
          forgingSectionLevel: 3,
          forgingShowLabels: true,
          forgingLabelDistance: 0.9,
          forgingPyramidOpacity: 0.72,
          forgingFocusedSector: null,
          forgingHideOtherSectors: false,
          selectedForgingLoopId: null,
          mainPyramidSnapshot: {
            courseMode: state.courseMode,
            journeyActive: state.journeyActive,
            journeyStep: state.journeyStep,
            journeyPlaying: state.journeyPlaying,
            presentationMode: state.presentationMode,
            focusLevel: state.focusLevel,
            isolateLevel: state.isolateLevel,
            selectedLevelId: state.selectedLevelId,
            exploded: state.exploded,
            cutaway: state.cutaway,
            showRelationships: state.showRelationships,
            showLevelLabels: state.showLevelLabels,
            pyramidOpacity: state.pyramidOpacity,
            sectionLevel: state.sectionLevel,
            activeDataOnly: state.activeDataOnly,
            levelNames: state.levelNames,
            selectedObjectId: state.selectedObjectId,
            selectedRelationshipId: state.selectedRelationshipId,
            placedObjects: state.placedObjects,
          },
          journeyActive: false,
          journeyPlaying: false,
          presentationMode: false,
          selectedObjectId: null,
          selectedRelationshipId: null,
          selectedLevelId: null,
        };
      }),
      exitForgingCaseStudy: () => set((state) => state.mainPyramidSnapshot
        ? {
          ...state.mainPyramidSnapshot,
          forgingCaseStudy: false,
          mainPyramidSnapshot: null,
        }
        : { forgingCaseStudy: false }),
      setForgingSeparateSectors: (forgingSeparateSectors) => set({ forgingSeparateSectors }),
      setForgingExploded: (forgingExploded) => set({ forgingExploded }),
      setForgingCutaway: (forgingCutaway) => set({ forgingCutaway }),
      setForgingSectionLevel: (forgingSectionLevel) => set({ forgingSectionLevel }),
      setForgingShowLabels: (forgingShowLabels) => set({ forgingShowLabels }),
      setForgingLabelDistance: (forgingLabelDistance) => set({
        forgingLabelDistance: Math.min(3.5, Math.max(0, forgingLabelDistance)),
      }),
      setForgingPyramidOpacity: (forgingPyramidOpacity) => set({
        forgingPyramidOpacity: Math.min(1, Math.max(0.18, forgingPyramidOpacity)),
      }),
      setForgingFocusedSector: (forgingFocusedSector) => set({
        forgingFocusedSector,
        forgingHideOtherSectors: false,
      }),
      setForgingHideOtherSectors: (forgingHideOtherSectors) => set((state) => ({
        forgingHideOtherSectors: state.forgingFocusedSector ? forgingHideOtherSectors : false,
      })),
      setForgingObject: (id, patch) => set((state) => ({
        forgingObjects: state.forgingObjects.map((object) => {
          if (object.id !== id) return object;
          const nextSector = patch.sector ?? object.sector;
          const nextPosition = patch.sector && nextSector
            ? [FORGING_SECTOR_ANCHORS[nextSector][0], 0, FORGING_SECTOR_ANCHORS[nextSector][1]] as [number, number, number]
            : object.position;
          return { ...object, ...patch, position: nextPosition };
        }),
      })),
      removeForgingObject: (id) => set((state) => ({
        forgingObjects: state.forgingObjects.filter((object) => object.id !== id),
        selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
        forgingLoops: state.forgingLoops.map((loop) => ({
          ...loop,
          relationships: loop.relationships.filter((relationship) => relationship.sourceId !== id && relationship.targetId !== id),
        })),
      })),
      toggleForgingLoop: (id) => set((state) => ({
        forgingLoops: state.forgingLoops.map((loop) => loop.id === id ? { ...loop, visible: !loop.visible } : loop),
      })),
      setSelectedForgingLoopId: (selectedForgingLoopId) => set({
        selectedForgingLoopId,
        selectedRelationshipId: null,
      }),
      deleteForgingLoop: (id) => set((state) => {
        const deletingSelectedRelationship = state.forgingLoops
          .find((loop) => loop.id === id)
          ?.relationships.some((relationship) => relationship.id === state.selectedRelationshipId);
        return {
          forgingLoops: state.forgingLoops.filter((loop) => loop.id !== id),
          selectedForgingLoopId: state.selectedForgingLoopId === id ? null : state.selectedForgingLoopId,
          selectedRelationshipId: deletingSelectedRelationship ? null : state.selectedRelationshipId,
        };
      }),
      createForgingLoop: (name, color, sourceId, targetId) => set((state) => ({
        forgingLoops: [
          ...state.forgingLoops,
          {
            id: `forge-loop-${uuidv4()}`,
            name: name.trim() || 'New Loop',
            color: color || '#facc15',
            visible: true,
            relationships: [{
              id: `forge-rel-${uuidv4()}`,
              sourceId,
              targetId,
              description: `${name.trim() || 'New loop'} connection`,
            }],
          },
        ],
      })),
      addForgingConnection: (loopId, sourceId, targetId) => set((state) => ({
        forgingLoops: state.forgingLoops.map((loop) => loop.id === loopId ? {
          ...loop,
          relationships: [
            ...loop.relationships,
            {
              id: `forge-rel-${uuidv4()}`,
              sourceId,
              targetId,
              description: `${loop.name} connection`,
            },
          ],
        } : loop),
      })),
    }),
    {
      name: 'manufacturing-data-pyramid-storage',
      version: 4,
      migrate: (persistedState: any) => {
        const mode = (persistedState?.courseMode || 'data-science') as CourseMode;
        const persistedObjects = Array.isArray(persistedState?.placedObjects)
          ? persistedState.placedObjects
          : [];
        const hasActiveData = persistedObjects.some((object: DataObject) => object.isUserAdded || object.isActive);
        return {
          ...persistedState,
          placedObjects: hasActiveData
            ? persistedObjects.map((object: DataObject) => object.isUserAdded ? { ...object, isActive: true } : object)
            : representativeObjects(mode),
        };
      },
      partialize: (state) => ({ 
        courseMode: state.courseMode,
        placedObjects: state.placedObjects, 
        reducedMotion: state.reducedMotion, 
        presentationMode: state.presentationMode,
        showLevelLabels: state.showLevelLabels,
        pyramidOpacity: state.pyramidOpacity,
        sectionLevel: state.sectionLevel,
        activeDataOnly: state.activeDataOnly,
        levelNames: state.levelNames
      }),
    }
  )
);
