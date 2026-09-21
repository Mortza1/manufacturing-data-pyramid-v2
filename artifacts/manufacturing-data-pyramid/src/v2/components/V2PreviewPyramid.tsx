import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { useStore } from '../../store';
import { useV2Store } from '../store';
import { gridCellToRenderPosition, getLevelBaseTop } from '../geometry';
import type { V2Object } from '../types';

const LEVEL_COLORS = ['#17212d', '#122336', '#172b4d', '#24345f', '#0b5364', '#0d3b4a', '#082f3a', '#05222b'];
const LEVEL_EDGE_COLORS = ['#64748b', '#2dd4bf', '#60a5fa', '#a78bfa', '#67e8f9', '#4fd1c5', '#38bdf8', '#0ea5e9'];
const SECTOR_COLORS = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'];
const EXPLODED_LEVEL_SPACING = 0.72;

function V2DataObject({
  object,
  position,
  color,
  visible,
  selected,
  showLabel,
  cutaway,
  sectionLevel,
  onSelect,
}: {
  object: V2Object;
  position: [number, number, number];
  color: string;
  visible: boolean;
  selected: boolean;
  showLabel: boolean;
  cutaway: boolean;
  sectionLevel: number | null;
  onSelect: () => void;
}) {
  const reducedMotion = useStore((state) => state.reducedMotion);
  const clipPlane = useMemo(() => {
    const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 1).normalize(), 0);
    plane.constant = ((sectionLevel ?? 3) - 3) * 0.75;
    return plane;
  }, [sectionLevel]);
  const { scale, opacity } = useSpring({
    scale: selected ? [1.35, 1.35, 1.35] : [1, 1, 1],
    opacity: visible ? 1 : 0.1,
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
      scale={scale as any}
      visible={opacity.to((value) => value > 0.01)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <mesh castShadow>
        {shape}
        <a.meshStandardMaterial
          color={selected ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={selected ? 1.2 : 0.55}
          transparent
          opacity={opacity}
          depthWrite={false}
          clippingPlanes={cutaway ? [clipPlane] : []}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[selected ? 0.42 : 0.31, 0.018, 8, 24]} />
        <meshBasicMaterial color={selected ? '#ffffff' : color} transparent opacity={0.8} toneMapped={false} />
      </mesh>
      {(showLabel || selected) && (
        <Html position={[0, 0.52, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }} zIndexRange={[55, 0]}>
          <div className={`max-w-[150px] rounded border bg-[#06131c]/90 px-2 py-1 text-center text-[9px] font-semibold leading-tight shadow-lg ${selected ? 'border-white text-white shadow-cyan-300/40' : 'border-white/20 text-cyan-50/85'}`}>
            {object.name}
          </div>
        </Html>
      )}
    </a.group>
  );
}

export function V2PreviewPyramid() {
  const draftLevels = useV2Store((state) => state.draft.levels);
  const draftSectors = useV2Store((state) => state.draft.sectors);
  const activeCase = useV2Store((state) => state.activeCase);
  const isEditingStructure = useV2Store((state) => state.isEditingStructure);
  const showV2Labels = useV2Store((state) => state.showV2Labels);
  const selectedVisualiseObjectId = useV2Store((state) => state.selectedVisualiseObjectId);
  const setSelectedVisualiseObjectId = useV2Store((state) => state.setSelectedVisualiseObjectId);
  const levels = activeCase && !isEditingStructure ? activeCase.levels : draftLevels;
  const sectors = activeCase && !isEditingStructure ? activeCase.sectors : draftSectors;
  const numLevels = levels.length || 1;
  const numSectors = Math.max(3, sectors.length);
  const {
    focusLevel,
    isolateLevel,
    exploded,
    cutaway,
    sectionLevel,
    pyramidOpacity,
  } = useStore();
  const objects = activeCase && !isEditingStructure ? activeCase.overlays.data : [];
  const objectsPerLevel = useMemo(() => new Map(levels.map((level) => [
    level.id,
    objects.filter((object) => object.level_id === level.id),
  ])), [levels, objects]);
  const sectionClipPlane = useMemo(() => {
    const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 1).normalize(), 0);
    plane.constant = ((sectionLevel ?? 3) - 3) * 0.75;
    return plane;
  }, [sectionLevel]);

  return (
    <group>
      {levels.map((level, index) => {
        const { base, top, height, y } = getLevelBaseTop(index, numLevels);
        const levelNumber = index + 1;
        const isFocused = focusLevel === null || focusLevel === levelNumber;
        const isVisible = isolateLevel === null || isolateLevel === levelNumber;
        const levelObjects = objectsPerLevel.get(level.id) ?? [];
        const levelOffset = exploded ? index * EXPLODED_LEVEL_SPACING : 0;
        const color = LEVEL_COLORS[index % LEVEL_COLORS.length];
        const edgeColor = LEVEL_EDGE_COLORS[index % LEVEL_EDGE_COLORS.length];
        const rotY = numSectors === 4 ? Math.PI / 4 : 0;
        return (
          <group key={level.id} position={[0, levelOffset, 0]} rotation={[0, rotY, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[top, base, height, numSectors]} />
              <meshStandardMaterial
                color={isFocused ? color : '#17212d'}
                transparent
                opacity={pyramidOpacity * (isVisible ? 1 : 0.12)}
                clippingPlanes={cutaway ? [sectionClipPlane] : []}
                side={cutaway ? THREE.DoubleSide : THREE.FrontSide}
                roughness={0.35}
                metalness={0.35}
              />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.CylinderGeometry(top, base, height, numSectors)]} />
              <lineBasicMaterial color={edgeColor} transparent opacity={isVisible ? 0.7 : 0.12} />
            </lineSegments>
            {activeCase && !isEditingStructure && showV2Labels && (
              <Html position={[base + 1.1, 0.05, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                <div className={`max-w-[155px] rounded border bg-[#06131c]/90 px-2 py-1 text-center text-[10px] font-semibold leading-tight shadow-[0_0_16px_rgba(34,211,238,0.22)] ${isVisible ? 'border-cyan-300/35 text-cyan-100' : 'border-white/15 text-white/35'}`}>
                  L{levelNumber} · {level.name}
                </div>
              </Html>
            )}
            {levelObjects.map((object) => {
              const renderPosition = gridCellToRenderPosition(
                object.grid_x,
                object.grid_y,
                activeCase?.grid.width ?? 8,
                activeCase?.grid.height ?? 8,
                index,
                numLevels,
              );
              const selected = object.id === selectedVisualiseObjectId;
              const sectorIndex = Math.max(0, sectors.findIndex((sector) => sector.id === object.sector_id));
              return (
                <V2DataObject
                  key={object.id}
                  object={object}
                  position={[renderPosition[0], renderPosition[1] - y + 0.24, renderPosition[2]]}
                  color={SECTOR_COLORS[sectorIndex % SECTOR_COLORS.length]}
                  visible={isVisible && isFocused}
                  selected={selected}
                  showLabel={objects.length <= 16}
                  cutaway={cutaway}
                  sectionLevel={sectionLevel}
                  onSelect={() => setSelectedVisualiseObjectId(selected ? null : object.id)}
                />
              );
            })}
          </group>
        );
      })}
      {activeCase && !isEditingStructure && showV2Labels && sectors.map((sector, index) => {
        const angle = ((index + 0.5) * Math.PI * 2) / numSectors + (numSectors === 4 ? Math.PI / 4 : 0);
        const radius = 6.2;
        return (
          <Html key={`sector-label-${sector.id}`} position={[Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div className="max-w-[145px] rounded-full border px-2.5 py-1 text-center text-[10px] font-semibold shadow-[0_0_16px_rgba(99,102,241,0.2)]" style={{ borderColor: `${SECTOR_COLORS[index % SECTOR_COLORS.length]}88`, color: SECTOR_COLORS[index % SECTOR_COLORS.length], background: '#0a1020e8' }}>
              {sector.name}
            </div>
          </Html>
        );
      })}
    </group>
  );
}