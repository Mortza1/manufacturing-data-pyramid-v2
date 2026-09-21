import React, { useMemo, useState } from 'react';
import { useV2Store } from '../store';
import { getVisibleV2ObjectIds } from '../visibility';
import type { V2Connection, V2Level, V2Object, V2Sector } from '../types';

const SECTOR_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'];
const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 700;
const PLOT = { left: 170, right: 950, top: 54, bottom: 640, apexHalf: 18, baseHalf: 350 };

type Point = { x: number; y: number };
type Band = {
  level: V2Level;
  index: number;
  top: number;
  bottom: number;
  center: number;
  leftTop: number;
  rightTop: number;
  leftBottom: number;
  rightBottom: number;
};
type NodeLayout = {
  object: V2Object;
  level: V2Level;
  sector: V2Sector;
  sectorIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
type RoutedConnection = {
  connection: V2Connection;
  loopColor: string;
  path: string;
  tip: Point;
  base: Point;
  arrowPoints: string;
  opacity: number;
  selected: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function stableHash(value: string) {
  return Array.from(value).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function halfWidthAt(y: number) {
  const progress = clamp((y - PLOT.top) / (PLOT.bottom - PLOT.top), 0, 1);
  return PLOT.apexHalf + (PLOT.baseHalf - PLOT.apexHalf) * progress;
}

function getBands(levels: V2Level[]): Band[] {
  const height = (PLOT.bottom - PLOT.top) / Math.max(1, levels.length);
  return levels.map((level, index) => {
    const bottom = PLOT.bottom - index * height;
    const top = bottom - height;
    return {
      level,
      index,
      top,
      bottom,
      center: (top + bottom) / 2,
      leftTop: VIEWBOX_WIDTH / 2 - halfWidthAt(top),
      rightTop: VIEWBOX_WIDTH / 2 + halfWidthAt(top),
      leftBottom: VIEWBOX_WIDTH / 2 - halfWidthAt(bottom),
      rightBottom: VIEWBOX_WIDTH / 2 + halfWidthAt(bottom),
    };
  });
}

function sectorPath(band: Band, sectorIndex: number, sectorCount: number) {
  const start = sectorIndex / sectorCount;
  const end = (sectorIndex + 1) / sectorCount;
  const topWidth = band.rightTop - band.leftTop;
  const bottomWidth = band.rightBottom - band.leftBottom;
  const x1 = band.leftTop + topWidth * start;
  const x2 = band.leftTop + topWidth * end;
  const x3 = band.leftBottom + bottomWidth * end;
  const x4 = band.leftBottom + bottomWidth * start;
  return `M ${x1} ${band.top} L ${x2} ${band.top} L ${x3} ${band.bottom} L ${x4} ${band.bottom} Z`;
}

function pointOnRectBoundary(center: Point, toward: Point, width: number, height: number) {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const scale = Math.min(
    Math.abs(dx) > 0.001 ? (width / 2) / Math.abs(dx) : Number.POSITIVE_INFINITY,
    Math.abs(dy) > 0.001 ? (height / 2) / Math.abs(dy) : Number.POSITIVE_INFINITY,
  );
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

function unitVector(from: Point, to: Point) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function routeConnection(source: NodeLayout, target: NodeLayout, connection: V2Connection) {
  const direct = unitVector(source, target);
  const sourcePoint = pointOnRectBoundary(source, target, source.width, source.height);
  const targetPoint = pointOnRectBoundary(target, source, target.width, target.height);
  const arrowLength = 10;
  const base = {
    x: targetPoint.x - direct.x * arrowLength,
    y: targetPoint.y - direct.y * arrowLength,
  };
  const lane = ((stableHash(connection.id) % 3) - 1) * 14;
  const sameBand = Math.abs(source.y - target.y) < 32;
  let controlOne: Point;
  let controlTwo: Point;
  if (sameBand) {
    const direction = source.y <= target.y ? -1 : 1;
    controlOne = { x: sourcePoint.x + (base.x - sourcePoint.x) * 0.32, y: sourcePoint.y + direction * (28 + lane) };
    controlTwo = { x: sourcePoint.x + (base.x - sourcePoint.x) * 0.72, y: base.y + direction * (28 + lane) };
  } else {
    const middleY = (sourcePoint.y + base.y) / 2;
    controlOne = { x: sourcePoint.x + lane, y: middleY };
    controlTwo = { x: base.x + lane, y: middleY };
  }
  const finalDirection = unitVector(controlTwo, base);
  const perpendicular = { x: -finalDirection.y, y: finalDirection.x };
  const arrowBaseHalfWidth = 5;
  const arrowPoints = [
    targetPoint,
    { x: base.x + perpendicular.x * arrowBaseHalfWidth, y: base.y + perpendicular.y * arrowBaseHalfWidth },
    { x: base.x - perpendicular.x * arrowBaseHalfWidth, y: base.y - perpendicular.y * arrowBaseHalfWidth },
  ].map((point) => `${point.x},${point.y}`).join(' ');
  const path = `M ${sourcePoint.x} ${sourcePoint.y} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${base.x} ${base.y}`;
  return { path, tip: targetPoint, base, arrowPoints };
}

function V2CrossSection() {
  const activeCase = useV2Store((state) => state.activeCase);
  const visualiseDataDensity = useV2Store((state) => state.visualiseDataDensity);
  const visualiseOnlyLevelId = useV2Store((state) => state.visualiseOnlyLevelId);
  const visualiseHiddenSectorIds = useV2Store((state) => state.visualiseHiddenSectorIds);
  const selectedLoopId = useV2Store((state) => state.selectedLoopId);
  const showOnlyLoopId = useV2Store((state) => state.showOnlyLoopId);
  const loopSectorContext = useV2Store((state) => state.loopSectorContext);
  const selectedConnectionId = useV2Store((state) => state.selectedConnectionId);
  const selectedVisualiseObjectId = useV2Store((state) => state.selectedVisualiseObjectId);
  const loopBuilder = useV2Store((state) => state.loopBuilder);
  const setSelectedVisualiseObjectId = useV2Store((state) => state.setSelectedVisualiseObjectId);
  const selectConnection = useV2Store((state) => state.selectConnection);
  const selectLoopObject = useV2Store((state) => state.selectLoopObject);
  const [showLabels, setShowLabels] = useState(true);
  const [fitVersion, setFitVersion] = useState(0);

  const layout = useMemo(() => {
    if (!activeCase) return null;
    const bands = getBands(activeCase.levels);
    const levelMap = new Map(activeCase.levels.map((level, index) => [level.id, { level, index, band: bands[index] }]));
    const sectorMap = new Map(activeCase.sectors.map((sector, index) => [sector.id, { sector, index }]));
    const visibleIds = getVisibleV2ObjectIds(
      activeCase,
      showOnlyLoopId ? 'all' : visualiseDataDensity,
      showOnlyLoopId ? null : visualiseOnlyLevelId,
      showOnlyLoopId ? [] : visualiseHiddenSectorIds,
      showOnlyLoopId,
    );
    const nodeLayouts = new Map<string, NodeLayout>();
    activeCase.overlays.data
      .filter((object) => object.overlay === 'data' && visibleIds.has(object.id))
      .forEach((object) => {
        const levelEntry = levelMap.get(object.level_id);
        const sectorEntry = sectorMap.get(object.sector_id);
        if (!levelEntry || !sectorEntry) return;
        const { band } = levelEntry;
        const normalizedX = clamp((object.grid_x + 0.5) / Math.max(1, activeCase.grid.width), 0.08, 0.92);
        const normalizedY = clamp((object.grid_y + 0.5) / Math.max(1, activeCase.grid.height), 0.08, 0.92);
        const y = band.center + (normalizedY - 0.5) * Math.min(26, (band.bottom - band.top) * 0.3);
        const nodeHalfWidth = halfWidthAt(y);
        const nodeLeft = VIEWBOX_WIDTH / 2 - nodeHalfWidth;
        const nodeWidth = nodeHalfWidth * 2;
        const x = nodeLeft + nodeWidth * ((sectorEntry.index + normalizedX) / Math.max(1, activeCase.sectors.length));
        nodeLayouts.set(object.id, {
          object,
          level: levelEntry.level,
          sector: sectorEntry.sector,
          sectorIndex: sectorEntry.index,
          x,
          y,
          width: 86,
          height: 24,
        });
      });

    const loops = new Map(activeCase.overlays.loops.map((loop) => [loop.id, loop]));
    const effectiveLoopId = showOnlyLoopId ?? selectedLoopId;
    const connections = activeCase.overlays.connectivity
      .filter((connection) => !showOnlyLoopId || connection.loop_id === showOnlyLoopId)
      .filter((connection) => nodeLayouts.has(connection.source_object_id) && nodeLayouts.has(connection.target_object_id))
      .sort((a, b) => a.loop_id.localeCompare(b.loop_id) || a.sequence - b.sequence || a.id.localeCompare(b.id))
      .map((connection) => {
        const source = nodeLayouts.get(connection.source_object_id)!;
        const target = nodeLayouts.get(connection.target_object_id)!;
        const route = routeConnection(source, target, connection);
        const selected = selectedConnectionId === connection.id;
        const relevant = !effectiveLoopId || connection.loop_id === effectiveLoopId;
        return {
          connection,
          loopColor: loops.get(connection.loop_id)?.color || '#67e8f9',
          path: route.path,
          tip: route.tip,
          base: route.base,
          arrowPoints: route.arrowPoints,
          selected,
          opacity: selected ? 1 : relevant ? 0.9 : 0.16,
        };
      });

    const participatingByLevel = new Map<string, Set<string>>();
    if (showOnlyLoopId) {
      activeCase.overlays.connectivity
        .filter((connection) => connection.loop_id === showOnlyLoopId)
        .flatMap((connection) => [connection.source_object_id, connection.target_object_id])
        .map((objectId) => activeCase.overlays.data.find((object) => object.id === objectId))
        .filter((object): object is V2Object => Boolean(object))
        .forEach((object) => {
          const sectorIds = participatingByLevel.get(object.level_id) ?? new Set<string>();
          sectorIds.add(object.sector_id);
          participatingByLevel.set(object.level_id, sectorIds);
        });
    }
    const visibleLoops = new Set(connections.map((item) => item.connection.loop_id));
    return { bands, nodeLayouts, connections, loops, visibleLoops, participatingByLevel };
  }, [activeCase, visualiseDataDensity, visualiseOnlyLevelId, visualiseHiddenSectorIds, selectedLoopId, showOnlyLoopId, selectedConnectionId]);

  if (!activeCase || !layout) return null;
  const effectiveLoopId = showOnlyLoopId ?? selectedLoopId;
  const onNodeClick = (objectId: string) => {
    if (loopBuilder) {
      selectLoopObject(objectId);
    } else {
      setSelectedVisualiseObjectId(selectedVisualiseObjectId === objectId ? null : objectId);
    }
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-[5] flex items-center p-4 md:pr-[48vw]">
      <div className="flex h-[calc(100dvh-2rem)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#060b14]/95 shadow-2xl backdrop-blur-xl">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-cyan-300/15 px-5 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/75">Stage 4 / Cross-section</p>
            <h2 className="text-lg font-bold text-cyan-50">Loop topology</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLabels((value) => !value)} className="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10">{showLabels ? 'Hide node labels' : 'Show node labels'}</button>
            <button onClick={() => setFitVersion((value) => value + 1)} className="rounded border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-300/20">Fit view</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 p-3 md:p-5">
          <svg key={`${layout.bands.length}-${fitVersion}`} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full" role="img" aria-label="Triangular pyramid cross-section showing data objects and loop connections">
            <title>Stage 4 loop cross-section</title>
            <polygon points={`${VIEWBOX_WIDTH / 2 - PLOT.apexHalf},${PLOT.top} ${VIEWBOX_WIDTH / 2 + PLOT.apexHalf},${PLOT.top} ${VIEWBOX_WIDTH / 2 + PLOT.baseHalf},${PLOT.bottom} ${VIEWBOX_WIDTH / 2 - PLOT.baseHalf},${PLOT.bottom}`} fill="#07131e" stroke="#7dd3fc" strokeOpacity="0.55" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {layout.bands.map((band) => (
              <g key={band.level.id}>
                {activeCase.sectors.map((sector, sectorIndex) => {
                  const participating = !showOnlyLoopId || layout.participatingByLevel.get(band.level.id)?.has(sector.id);
                  const hidden = visualiseHiddenSectorIds.includes(sector.id);
                  if (hidden || (showOnlyLoopId && loopSectorContext === 'active' && !participating)) return null;
                  return <path key={`${band.level.id}-${sector.id}`} d={sectorPath(band, sectorIndex, activeCase.sectors.length)} fill={SECTOR_COLORS[sectorIndex % SECTOR_COLORS.length]} fillOpacity={participating ? 0.15 : 0.035} stroke={SECTOR_COLORS[sectorIndex % SECTOR_COLORS.length]} strokeOpacity={participating ? 0.35 : 0.08} strokeWidth="1" vectorEffect="non-scaling-stroke" />;
                })}
                <line x1={band.leftTop} y1={band.top} x2={band.rightTop} y2={band.top} stroke="#bae6fd" strokeOpacity="0.28" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <text x="22" y={band.center + 4} fill="#dbeafe" fillOpacity="0.85" fontSize="14" fontWeight="600">{truncate(band.level.name, 22)}</text>
                <text x="22" y={band.center - 11} fill="#67e8f9" fillOpacity="0.55" fontSize="9" fontFamily="monospace">L{band.index + 1}</text>
              </g>
            ))}
            {layout.connections.map((item) => (
              <g
                key={item.connection.id}
                opacity={item.opacity}
                className="cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  selectConnection(item.connection.id);
                }}
              >
                <path d={item.path} fill="none" stroke={item.loopColor} strokeWidth={item.selected ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                <path d={item.path} fill="none" stroke="transparent" strokeWidth="18" strokeLinecap="round" pointerEvents="stroke" />
                <polygon points={item.arrowPoints} fill={item.loopColor} stroke={item.loopColor} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                <title>{item.connection.label || `${item.connection.sequence + 1}. ${item.connection.source_object_id} → ${item.connection.target_object_id}`}</title>
              </g>
            ))}
            {Array.from(layout.nodeLayouts.values()).map((node) => {
              const selected = selectedVisualiseObjectId === node.object.id;
              const highlighted = Boolean(effectiveLoopId && layout.connections.some((item) => item.connection.loop_id === effectiveLoopId && (item.connection.source_object_id === node.object.id || item.connection.target_object_id === node.object.id)));
              return (
                <g key={node.object.id} onClick={(event) => { event.stopPropagation(); onNodeClick(node.object.id); }} className="cursor-pointer">
                  <title>{`${node.object.name} · ${node.level.name} · ${node.sector.name} · cell (${node.object.grid_x}, ${node.object.grid_y})`}</title>
                  <rect x={node.x - node.width / 2} y={node.y - node.height / 2} width={node.width} height={node.height} rx="7" fill={SECTOR_COLORS[node.sectorIndex % SECTOR_COLORS.length]} fillOpacity={selected || highlighted ? 0.3 : 0.14} stroke={selected ? '#ffffff' : highlighted ? '#f8fafc' : SECTOR_COLORS[node.sectorIndex % SECTOR_COLORS.length]} strokeOpacity={selected || highlighted ? 0.95 : 0.65} strokeWidth={selected ? 2 : 1.2} vectorEffect="non-scaling-stroke" />
                  {showLabels && <text x={node.x} y={node.y + 3.5} textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="600">{truncate(node.object.name, 16)}</text>}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="grid shrink-0 gap-3 border-t border-cyan-300/15 px-5 py-3 text-[10px] md:grid-cols-2">
          <div>
            <p className="mb-1 uppercase tracking-[0.16em] text-muted-foreground">Sectors · node colour</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {activeCase.sectors.map((sector, index) => <span key={sector.id} className="flex items-center gap-1.5 text-cyan-50/75"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length] }} />{sector.name}</span>)}
            </div>
          </div>
          <div>
            <p className="mb-1 uppercase tracking-[0.16em] text-muted-foreground">Loops · arrow colour</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {Array.from(layout.visibleLoops).map((loopId) => {
                const loop = layout.loops.get(loopId);
                return loop ? <span key={loop.id} className={`flex items-center gap-1.5 ${effectiveLoopId && effectiveLoopId !== loop.id ? 'text-cyan-50/35' : 'text-cyan-50/75'}`}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: loop.color }} />{loop.name}</span> : null;
              })}
              {layout.visibleLoops.size === 0 && <span className="text-muted-foreground">No visible connections</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { V2CrossSection };