import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { COURSES, CourseMode, DataObject, DataCategory } from './data';

export interface AppState {
  courseMode: CourseMode;
  journeyActive: boolean;
  journeyStep: number;
  journeyPlaying: boolean;
  presentationMode: boolean;
  
  focusLevel: number | null;
  isolateLevel: number | null;
  exploded: boolean;
  cutaway: boolean;
  showRelationships: boolean;
  reducedMotion: boolean;
  
  selectedObjectId: string | null;
  selectedRelationshipId: string | null;
  draggedLibraryItem: Omit<DataObject, 'id'> | null;
  dragHoveredLevelId: number | null;
  touchSelectedItem: Omit<DataObject, 'id'> | null;
  
  placedObjects: DataObject[];
  
  setCourseMode: (mode: CourseMode) => void;
  setJourneyActive: (active: boolean) => void;
  setJourneyStep: (step: number) => void;
  setJourneyPlaying: (playing: boolean) => void;
  setPresentationMode: (active: boolean) => void;
  setFocusLevel: (level: number | null) => void;
  setIsolateLevel: (level: number | null) => void;
  setExploded: (exploded: boolean) => void;
  setCutaway: (cutaway: boolean) => void;
  setShowRelationships: (show: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setSelectedObjectId: (id: string | null) => void;
  setSelectedRelationshipId: (id: string | null) => void;
  setDraggedLibraryItem: (item: Omit<DataObject, 'id'> | null) => void;
  setDragHoveredLevelId: (level: number | null) => void;
  setTouchSelectedItem: (item: Omit<DataObject, 'id'> | null) => void;
  placeObject: (item: Omit<DataObject, 'id'>, position: [number, number, number], level: number) => void;
  removeObject: (id: string) => void;
  resetCourse: () => void;
}

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
      exploded: false,
      cutaway: false,
      showRelationships: false,
      reducedMotion: false,
      
      selectedObjectId: null,
      selectedRelationshipId: null,
      draggedLibraryItem: null,
      dragHoveredLevelId: null,
      touchSelectedItem: null,
      placedObjects: COURSES['data-science'].initialObjects,

      setCourseMode: (mode) => set({ 
        courseMode: mode, 
        journeyStep: 0, 
        journeyActive: false, 
        journeyPlaying: false,
        selectedObjectId: null,
        selectedRelationshipId: null,
        placedObjects: COURSES[mode].initialObjects 
      }),
      setJourneyActive: (active) => set({ journeyActive: active, journeyStep: 0, journeyPlaying: active }),
      setJourneyStep: (step) => set({ journeyStep: step }),
      setJourneyPlaying: (playing) => set({ journeyPlaying: playing }),
      setPresentationMode: (active) => set({ presentationMode: active }),
      setFocusLevel: (level) => set({ focusLevel: level }),
      setIsolateLevel: (level) => set({ isolateLevel: level }),
      setExploded: (exploded) => set({ exploded }),
      setCutaway: (cutaway) => set({ cutaway }),
      setShowRelationships: (showRelationships) => set({ showRelationships }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setSelectedObjectId: (id) => set({ selectedObjectId: id, selectedRelationshipId: null }),
      setSelectedRelationshipId: (id) => set({ selectedRelationshipId: id, selectedObjectId: null }),
      setDraggedLibraryItem: (item) => set({ draggedLibraryItem: item }),
      setDragHoveredLevelId: (level) => set({ dragHoveredLevelId: level }),
      setTouchSelectedItem: (item) => set({ touchSelectedItem: item }),
      
      placeObject: (item, position, level) => set((state) => ({
        placedObjects: [...state.placedObjects, { ...item, id: uuidv4(), position, level }]
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
        exploded: false,
        cutaway: false,
        showRelationships: false,
        selectedObjectId: null,
        selectedRelationshipId: null,
        dragHoveredLevelId: null,
        touchSelectedItem: null,
        placedObjects: COURSES[state.courseMode].initialObjects
      })),
    }),
    {
      name: 'manufacturing-data-pyramid-storage',
      partialize: (state) => ({ 
        courseMode: state.courseMode,
        placedObjects: state.placedObjects, 
        reducedMotion: state.reducedMotion, 
        presentationMode: state.presentationMode 
      }),
    }
  )
);
