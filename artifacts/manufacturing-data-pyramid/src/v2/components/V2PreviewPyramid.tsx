import React, { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { useStore } from '../../store';
import { useV2Store, type V2DataDensity } from '../store';
import { gridCellToRenderPosition, getLevelBaseTop } from '../geometry';
import type { V2Level, V2Object, V2Sector } from '../types';

const SECTOR_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'];
const EXPLODED_LEVEL_SPACING = 0.72;

function filterObjectsByDensity(objects: V2Object[], density: V2DataDensity) {
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

function V2DataObject({
  object,
  position,
  color,
  visible,
  subdued,
  selected,
  showLabel,
  objectScale,
  labelScale,
  onSelect,
}: {
  object: V2Object;
  position: [number, number, number];
  color: string;
  visible: boolean;
  subdued: boolean;
  selected: boolean;
  showLabel: boolean;
  objectScale: number;
  labelScale: number;
  onSelect: () => void;
}) {
  const reducedMotion = useStore((state) => state.reducedMotion);
  const [hovered, setHovered] = useState(false);
  const { scale, opacity } = useSpring({
    scale: selected
      ? [1.35 * objectScale, 1.35 * objectScale, 1.35 * objectScale]
      : [objectScale, objectScale, objectScale],
    opacity: visible ? (subdued ? 0.35 : 1) : 0,
    config: { mass: 0.8, tension: 220, friction: 24 },
    immediate: reducedMotion,
  });

  const kind = `${object.name} ${object.data_type}`.toLowerCase();
  const shape = kind.includes('event') || kind.includes('alarm')
    ? <coneGeometry args={[0.2, 0.42, 6]} />
    : kind.includes('temperature') || kind.includes('vibration') || kind.includes('frequency')
      ? <cylinderGeometry args={[0.18, 0.18, 0.38, 12]} />
      : kind.includes('image') || kind.includes('geometry') || kind.includes('cad')
        ? <octahedronGeometry args={[0.27]} />
        : <boxGeometry args={[0.34, 0.34, 0.34]} />;

  return (
    <a.group
      position={position}
      visible={opacity.to((value) => value > 0.01)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (visible) setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <a.group scale={scale as any}>
        <mesh castShadow>
          {shape}
          <a.meshStandardMaterial
            color={selected ? '#ffffff' : color}
            emissive={color}
            emissiveIntensity={selected ? 1.2 : 0.55}
            transparent
            opacity={opacity}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {visible && (selected || hovered) && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[selected ? 0.42 * objectScale : 0.31 * objectScale, 0.018 * objectScale, 8, 24]} />
            <meshBasicMaterial color={selected ? '#ffffff' : color} transparent opacity={subdued ? 0.35 : 0.8} toneMapped={false} />
          </mesh>
        )}
      </a.group>
      {visible && (showLabel || selected) && (
        <Html position={[0, 0.52, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }} zIndexRange={[55, 0]}>
          <div style={{ transform: `scale(${labelScale})`, transformOrigin: 'center' }} className={`max-w-[150px] rounded border bg-[#06131c]/90 px-2 py-1 text-center text-[9px] font-semibold leading-tight shadow-lg ${selected ? 'border-white text-white shadow-cyan-300/40' : subdued ? 'border-white/10 text-cyan-50/45' : 'border-white/20 text-cyan-50/85'}`}>
            {object.name}
          </div>
        </Html>
      )}
    </a.group>
  );
}

function V2Level({
  level,
  index,
  totalLevels,
  sectors,
  objects,
  activeCase,
  showV2Labels,
  selectedVisualiseObjectId,
  visualiseExploded,
  visualiseFocusedLevelId,
  visualiseOnlyLevelId,
  visualiseHiddenSectorIds,
  visualiseSurfaceOpacity,
  visualiseDataDensity,
  visualiseObjectScale,
  visualiseLabelScale,
  setSelectedVisualiseObjectId,
}: {
  level: V2Level;
  index: number;
  totalLevels: number;
  sectors: V2Sector[];
  objects: V2Object[];
  activeCase: NonNullable<ReturnType<typeof useV2Store.getState>['activeCase']>;
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
  setSelectedVisualiseObjectId: (id: string | null) => void;
}) {
  const { base, top, height, y } = getLevelBaseTop(index, totalLevels);
  const levelNumber = index + 1;
  const levelVisible = visualiseOnlyLevelId === null || visualiseOnlyLevelId === level.id;
  const levelFocused = visualiseFocusedLevelId === null || visualiseFocusedLevelId === level.id;
  const levelOffset = visualiseExploded
    ? (index - (totalLevels - 1) / 2) * EXPLODED_LEVEL_SPACING
    : 0;
  const rotY = sectors.length === 4 ? Math.PI / 4 : 0;
  const sectorAngle = (Math.PI * 2) / Math.max(3, sectors.length);
  const visibleObjects = filterObjectsByDensity(objects, visualiseDataDensity);

  return (
    <group position={[0, y + levelOffset, 0]} rotation={[0, rotY, 0]}>
      {levelVisible && sectors.map((sector, sectorIndex) => {
        if (visualiseHiddenSectorIds.includes(sector.id)) return null;
        const surfaceOpacity = visualiseSurfaceOpacity * (levelFocused ? 1 : 0.28);
        return (
          <React.Fragment key={sector.id}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[top, base, height, 1, 1, false, sectorIndex * sectorAngle, sectorAngle]} />
              <meshStandardMaterial
                color={SECTOR_COLORS[sectorIndex % SECTOR_COLORS.length]}
                transparent
                opacity={surfaceOpacity}
                side={THREE.DoubleSide}
                roughness={0.35}
                metalness={0.35}
              />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.CylinderGeometry(top, base, height, 1, 1, false, sectorIndex * sectorAngle, sectorAngle)]} />
              <lineBasicMaterial color={SECTOR_COLORS[sectorIndex % SECTOR_COLORS.length]} transparent opacity={levelFocused ? 0.7 : 0.25} />
            </lineSegments>
          </React.Fragment>
        );
      })}
      {activeCase && showV2Labels && levelVisible && (
        <Html position={[base + 1.1, 0.05, 0]} center distanceFactor={8} style={{ pointerEvents: 'none', opacity: levelFocused ? 1 : 0.45 }}>
          <div style={{ transform: `scale(${visualiseLabelScale})`, transformOrigin: 'center' }} className="max-w-[155px] rounded border border-cyan-300/35 bg-[#06131c]/90 px-2 py-1 text-center text-[10px] font-semibold leading-tight text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.22)]">
            L{levelNumber} · {level.name}
          </div>
        </Html>
      )}
      {levelVisible && visibleObjects.map((object) => {
        const sectorIndex = sectors.findIndex((sector) => sector.id === object.sector_id);
        const sectorHidden = visualiseHiddenSectorIds.includes(object.sector_id);
        if (sectorIndex < 0 || sectorHidden) return null;
        const renderPosition = gridCellToRenderPosition(
          object.grid_x,
          object.grid_y,
          activeCase.grid.width,
          activeCase.grid.height,
          index,
          totalLevels,
        );
        const selected = object.id === selectedVisualiseObjectId;
        return (
          <V2DataObject
            key={object.id}
            object={object}
            position={[renderPosition[0], 0.24, renderPosition[2]]}
            color={SECTOR_COLORS[sectorIndex % SECTOR_COLORS.length]}
            visible
            subdued={!levelFocused}
            selected={selected}
            showLabel={visibleObjects.length <= 16}
            objectScale={visualiseObjectScale}
            labelScale={visualiseLabelScale}
            onSelect={() => setSelectedVisualiseObjectId(selected ? null : object.id)}
          />
        );
      })}
    </group>
  );
}

export function V2PreviewPyramid() {
  const activeCase = useV2Store((state) => state.activeCase);
  const isEditingStructure = useV2Store((state) => state.isEditingStructure);
  const showV2Labels = useV2Store((state) => state.showV2Labels);
  const selectedVisualiseObjectId = useV2Store((state) => state.selectedVisualiseObjectId);
  const setSelectedVisualiseObjectId = useV2Store((state) => state.setSelectedVisualiseObjectId);
  const visualiseExploded = useV2Store((state) => state.visualiseExploded);
  const visualiseFocusedLevelId = useV2Store((state) => state.visualiseFocusedLevelId);
  const visualiseOnlyLevelId = useV2Store((state) => state.visualiseOnlyLevelId);
  const visualiseHiddenSectorIds = useV2Store((state) => state.visualiseHiddenSectorIds);
  const visualiseSurfaceOpacity = useV2Store((state) => state.visualiseSurfaceOpacity);
  const visualiseDataDensity = useV2Store((state) => state.visualiseDataDensity);
  const visualiseObjectScale = useV2Store((state) => state.visualiseObjectScale);
  const visualiseLabelScale = useV2Store((state) => state.visualiseLabelScale);
  const levels = activeCase && !isEditingStructure ? activeCase.levels : [];
  const sectors = activeCase && !isEditingStructure ? activeCase.sectors : [];
  const objects = activeCase && !isEditingStructure ? activeCase.overlays.data : [];
  const numLevels = levels.length || 1;
  const objectsPerLevel = useMemo(() => new Map(levels.map((level) => [
    level.id,
    objects.filter((object) => object.level_id === level.id),
  ])), [levels, objects]);

  return (
    <group>
      {activeCase && !isEditingStructure && levels.map((level, index) => (
        <V2Level
          key={level.id}
          level={level}
          index={index}
          totalLevels={numLevels}
          sectors={sectors}
          objects={objectsPerLevel.get(level.id) ?? []}
          activeCase={activeCase}
          showV2Labels={showV2Labels}
          selectedVisualiseObjectId={selectedVisualiseObjectId}
          visualiseExploded={visualiseExploded}
          visualiseFocusedLevelId={visualiseFocusedLevelId}
          visualiseOnlyLevelId={visualiseOnlyLevelId}
          visualiseHiddenSectorIds={visualiseHiddenSectorIds}
          visualiseSurfaceOpacity={visualiseSurfaceOpacity}
          visualiseDataDensity={visualiseDataDensity}
          visualiseObjectScale={visualiseObjectScale}
          visualiseLabelScale={visualiseLabelScale}
          setSelectedVisualiseObjectId={setSelectedVisualiseObjectId}
        />
      ))}
      {activeCase && !isEditingStructure && showV2Labels && sectors.map((sector, index) => {
        if (visualiseHiddenSectorIds.includes(sector.id)) return null;
        const numSectors = Math.max(3, sectors.length);
        const angle = ((index + 0.5) * Math.PI * 2) / numSectors + (numSectors === 4 ? Math.PI / 4 : 0);
        const radius = 6.2;
        return (
          <Html key={`sector-label-${sector.id}`} position={[Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div className="max-w-[145px] rounded-full border px-2.5 py-1 text-center text-[10px] font-semibold shadow-[0_0_16px_rgba(99,102,241,0.2)]" style={{ borderColor: `${SECTOR_COLORS[index % SECTOR_COLORS.length]}88`, color: SECTOR_COLORS[index % SECTOR_COLORS.length], background: '#0a1020e8', transform: `scale(${visualiseLabelScale})`, transformOrigin: 'center' }}>
              {sector.name}
            </div>
          </Html>
        );
      })}
    </group>
  );
}