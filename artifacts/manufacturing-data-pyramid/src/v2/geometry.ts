export function getSectorForAngle(angle: number, numSectors: number): number {
  let a = angle % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  const sectorAngle = (2 * Math.PI) / numSectors;
  return Math.floor(a / sectorAngle) % numSectors;
}

export function getSectorForGridCell(
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number,
  numSectors: number
): number {
  const cx = gridWidth / 2;
  const cy = gridHeight / 2;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  const angle = Math.atan2(dy, dx);
  return getSectorForAngle(angle, numSectors);
}

export function getSectorIdForGridCell(
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number,
  sectorIds: string[]
): string | null {
  if (sectorIds.length === 0) return null;
  return sectorIds[getSectorForGridCell(x, y, gridWidth, gridHeight, sectorIds.length)] ?? null;
}

export function gridCellToRenderPosition(
  gridX: number,
  gridY: number,
  gridWidth: number,
  gridHeight: number,
  levelIndex: number,
  totalLevels: number
): [number, number, number] {
  const { base, y } = getLevelBaseTop(levelIndex, totalLevels);
  const usableWidth = base * 0.82;
  const x = ((gridX + 0.5) / gridWidth - 0.5) * usableWidth;
  const z = ((gridY + 0.5) / gridHeight - 0.5) * usableWidth;
  return [x, y, z];
}

export function getLevelBaseTop(
  levelIndex: number,
  totalLevels: number
): { base: number; top: number; height: number; y: number } {
  const totalHeight = 8.0;
  const baseWidth = 5.4;
  const topWidth = 0.15;

  const levelHeight = totalHeight / totalLevels;
  const bottomY = levelIndex * levelHeight;
  const topY = bottomY + levelHeight;

  const bottomRadius = baseWidth - (baseWidth - topWidth) * (bottomY / totalHeight);
  const topRadius = baseWidth - (baseWidth - topWidth) * (topY / totalHeight);

  return {
    base: bottomRadius,
    top: topRadius,
    height: levelHeight * 0.95,
    y: bottomY + levelHeight / 2,
  };
}
