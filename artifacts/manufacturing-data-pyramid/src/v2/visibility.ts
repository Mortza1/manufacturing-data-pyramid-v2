import type { V2Case, V2Object } from './types';

export type V2DataDensity = 1 | 2 | 3 | 'all';

export function filterV2ObjectsByDensity(objects: V2Object[], density: V2DataDensity) {
  if (density === 'all') return objects;
  const counts = new Map<string, number>();
  return [...objects]
    .sort((a, b) => a.grid_y - b.grid_y || a.grid_x - b.grid_x || a.id.localeCompare(b.id))
    .filter((object) => {
      const count = counts.get(object.sector_id) ?? 0;
      if (count >= density) return false;
      counts.set(object.sector_id, count + 1);
      return true;
    });
}

export function getLoopObjectIds(activeCase: V2Case, loopId: string | null) {
  if (!loopId) return null;
  const ids = new Set<string>();
  activeCase.overlays.connectivity
    .filter((connection) => connection.loop_id === loopId)
    .forEach((connection) => {
      ids.add(connection.source_object_id);
      ids.add(connection.target_object_id);
    });
  return ids;
}

export function getVisibleV2ObjectIds(
  activeCase: V2Case,
  density: V2DataDensity,
  onlyLevelId: string | null,
  hiddenSectorIds: string[],
  showOnlyLoopId: string | null = null,
) {
  const visibleIds = new Set<string>();
  const loopObjectIds = getLoopObjectIds(activeCase, showOnlyLoopId);
  activeCase.levels.forEach((level) => {
    const levelObjects = activeCase.overlays.data.filter((object) => object.level_id === level.id);
    filterV2ObjectsByDensity(levelObjects, density).forEach((object) => {
      if (
        (onlyLevelId === null || onlyLevelId === level.id) &&
        !hiddenSectorIds.includes(object.sector_id) &&
        (!loopObjectIds || loopObjectIds.has(object.id))
      ) {
        visibleIds.add(object.id);
      }
    });
  });
  return visibleIds;
}