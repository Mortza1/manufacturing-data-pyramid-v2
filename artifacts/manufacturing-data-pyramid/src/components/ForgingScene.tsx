import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Html, Line } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { DataGlyph } from './PlacedObjects';
import { useStore } from '../store';
import {
  ConnectionLoop,
  FORGING_LEVELS,
  FORGING_SECTOR_COLORS,
  FORGING_SECTOR_LABELS,
  FORGING_SECTOR_OFFSETS,
  ForgingSector,
  getDataObjectY,
} from '../data';

const FORGING_SECTORS: ForgingSector[] = ['product', 'machine', 'process', 'resources'];

function getSector(obj: { sector?: ForgingSector }): ForgingSector {
  return obj.sector ?? 'resources';
}

function getObjectPosition(
  object: { position?: [number, number, number]; sector?: ForgingSector; level: number },
  exploded: boolean,
  separateSectors: boolean,
): [number, number, number] {
  const sector = getSector(object);
  const offset = separateSectors ? FORGING_SECTOR_OFFSETS[sector] : [0, 0];
  return [
    (object.position?.[0] ?? 0) + offset[0],
    getDataObjectY(object.level, exploded),
    (object.position?.[2] ?? 0) + offset[1],
  ];
}

function ForgingLevel({
  level,
  exploded,
  separateSectors,
  showLabels,
  labelDistance,
  focusedSector,
  hideOtherSectors,
  opacity,
  cutaway,
  sectionLevel,
}: {
  level: typeof FORGING_LEVELS[number];
  exploded: boolean;
  separateSectors: boolean;
  showLabels: boolean;
  labelDistance: number;
  focusedSector: ForgingSector | null;
  hideOtherSectors: boolean;
  opacity: number;
  cutaway: boolean;
  sectionLevel: number | null;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(level.top * Math.SQRT2, level.base * Math.SQRT2, level.height, 4, 1);
    geo.rotateY(Math.PI / 4);
    return geo;
  }, [level]);
  const sectionClipPlane = useMemo(() => {
    const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 1).normalize(), 0);
    plane.constant = ((sectionLevel ?? 3) - 3) * 0.75;
    return plane;
  }, [sectionLevel]);
  const y = level.y + (exploded ? (level.id - 1) * 1.15 : 0);
  const tileSize = Math.max(level.top * 1.72, 0.82);

  return (
    <group position={[0, y, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={['#111c27', '#152230', '#182736', '#1b2a38', '#1e2d3b'][level.id - 1]}
          transparent
          opacity={opacity * (separateSectors ? 0.28 : 0.7)}
          roughness={0.28}
          metalness={0.72}
          transmission={0}
          clippingPlanes={cutaway ? [sectionClipPlane] : []}
          side={THREE.DoubleSide}
        />
        <Edges color="#8da2b5" threshold={15} opacity={separateSectors ? 0.22 : 0.5} transparent />
      </mesh>

      {FORGING_SECTORS.map((sector) => {
        const isLeft = sector === 'product' || sector === 'process';
        const isBack = sector === 'product' || sector === 'machine';
        const offset = separateSectors ? FORGING_SECTOR_OFFSETS[sector] : [0, 0];
        const isFocused = focusedSector === null || focusedSector === sector;
        const isVisible = !hideOtherSectors || isFocused;
        return (
          <group
            key={sector}
            position={[
              (isLeft ? -1 : 1) * tileSize / 2 + offset[0],
              level.height / 2 + 0.07,
              (isBack ? -1 : 1) * tileSize / 2 + offset[1],
            ]}
          >
            <Html
              position={[0, 0.08, 0]}
              center
               style={{ pointerEvents: 'none', opacity: showLabels && isVisible ? (focusedSector === sector ? 1 : 0.5) : 0 }}
              zIndexRange={[30, 0]}
            >
              <span
                className="rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider whitespace-nowrap"
                style={{
                  color: FORGING_SECTOR_COLORS[sector],
                  borderColor: `${FORGING_SECTOR_COLORS[sector]}55`,
                  background: '#071018cc',
                }}
              >
                {FORGING_SECTOR_LABELS[sector].split(' / ')[0]}
              </span>
            </Html>
          </group>
        );
      })}

      <Html
        position={[level.base + 0.9 + labelDistance, 0.05, 0]}
        center
        style={{ pointerEvents: 'none', opacity: showLabels ? 1 : 0 }}
        zIndexRange={[35, 0]}
      >
        <div className="rounded-lg border border-white/15 bg-[#071018]/90 px-3 py-2 text-left shadow-xl backdrop-blur-md whitespace-nowrap">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/90">
            L{level.id - 1} · {level.name}
          </div>
          <div className="mt-0.5 text-[9px] font-mono text-white/45">{level.subtitle}</div>
        </div>
      </Html>
    </group>
  );
}

export function ForgingPyramid() {
  const {
    forgingExploded,
    forgingSeparateSectors,
    forgingShowLabels,
    forgingLabelDistance,
    forgingPyramidOpacity,
    forgingCutaway,
    forgingSectionLevel,
    forgingFocusedSector,
    forgingHideOtherSectors,
  } = useStore();
  return (
    <group position={[0, -2.5, 0]}>
      {FORGING_LEVELS.map((level) => (
        <ForgingLevel
          key={level.id}
          level={level}
          exploded={forgingExploded}
          separateSectors={forgingSeparateSectors}
          showLabels={forgingShowLabels}
          labelDistance={forgingLabelDistance}
          focusedSector={forgingFocusedSector}
          hideOtherSectors={forgingHideOtherSectors}
          opacity={forgingPyramidOpacity}
          cutaway={forgingCutaway}
          sectionLevel={forgingSectionLevel}
        />
      ))}
    </group>
  );
}

function ForgingObjectMesh({ object }: { object: any }) {
  const {
    selectedObjectId,
    setSelectedObjectId,
    forgingExploded,
    forgingSeparateSectors,
    forgingShowLabels,
    forgingFocusedSector,
    forgingHideOtherSectors,
  } = useStore();
  const loopVisible = object.loopVisible !== false;
  const selected = selectedObjectId === object.id;
  const innerRef = useRef<THREE.Group>(null);
  const sector = getSector(object);
  const color = FORGING_SECTOR_COLORS[sector];
  const isFocusedSector = forgingFocusedSector === null || forgingFocusedSector === sector;
  const sectorVisible = !forgingHideOtherSectors || isFocusedSector;
  const isVisible = sectorVisible && loopVisible;
  const sectorOpacity = selected ? 1 : (forgingFocusedSector === sector ? 1 : (forgingFocusedSector ? 0.16 : 1));
  const targetPosition = getObjectPosition(object, forgingExploded, forgingSeparateSectors);
  const { position, scale, opacity } = useSpring({
    position: targetPosition,
    scale: selected ? [1.32, 1.32, 1.32] : [1.08, 1.08, 1.08],
    opacity: isVisible ? sectorOpacity : 0,
    config: { mass: 1, tension: 190, friction: 22 },
  });

  useFrame(() => {
    if (innerRef.current) innerRef.current.rotation.y += selected ? 0.012 : 0.003;
  });

  return (
    <a.group
      position={position as any}
      scale={scale as any}
      visible={isVisible}
      onClick={(event) => {
        event.stopPropagation();
        setSelectedObjectId(selected ? null : object.id);
      }}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <group ref={innerRef}>
        <DataGlyph
          obj={object}
          color={color}
          opacity={opacity}
          isSelected={selected}
          isJourneyHighlighted={false}
          isDataScience={false}
          isCutaway={false}
           isForging
        />
      </group>
      {selected && (
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {(forgingShowLabels && isFocusedSector && loopVisible || selected) && (
        <Html position={[0, 0.62, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[55, 0]}>
          <div
            className="rounded border px-2 py-1 text-[10px] font-semibold whitespace-nowrap shadow-xl backdrop-blur"
            style={{ color, borderColor: `${color}88`, background: '#05080dcc' }}
          >
            {object.name}
          </div>
        </Html>
      )}
    </a.group>
  );
}

export function ForgingObjects() {
  const { forgingObjects, forgingLoops, forgingShowOnlyLoopId } = useStore();
  const loopObjectIds = useMemo(() => new Set(
    forgingLoops
      .find((loop) => loop.id === forgingShowOnlyLoopId)
      ?.relationships.flatMap((relationship) => [relationship.sourceId, relationship.targetId]) ?? [],
  ), [forgingLoops, forgingShowOnlyLoopId]);
  return (
    <group position={[0, -2.5, 0]}>
      {forgingObjects.map((object) => (
        <ForgingObjectMesh
          key={object.id}
          object={{ ...object, loopVisible: !forgingShowOnlyLoopId || loopObjectIds.has(object.id) }}
        />
      ))}
    </group>
  );
}

function getLoopLines(
  loops: ConnectionLoop[],
  objects: any[],
  exploded: boolean,
  separateSectors: boolean,
  focusedSector: ForgingSector | null,
  hideOtherSectors: boolean,
  showOnlyLoopId: string | null,
) {
  const objectMap = new Map(objects.map((object) => [object.id, object]));
  return loops.flatMap((loop) => loop.visible && (!showOnlyLoopId || loop.id === showOnlyLoopId)
    ? loop.relationships.flatMap((relationship) => {
      const source = objectMap.get(relationship.sourceId);
      const target = objectMap.get(relationship.targetId);
      if (!source || !target) return [];
      const sourceSector = getSector(source);
      const targetSector = getSector(target);
      const relevant = focusedSector === null || sourceSector === focusedSector || targetSector === focusedSector;
      if (hideOtherSectors && focusedSector !== null && !relevant) return [];
      return [{
        loop,
        relationship,
        relevant,
        start: new THREE.Vector3(...getObjectPosition(source, exploded, separateSectors)),
        end: new THREE.Vector3(...getObjectPosition(target, exploded, separateSectors)),
      }];
    })
    : []);
}

function getRoute(start: THREE.Vector3, end: THREE.Vector3, relationshipId: string) {
  const direction = end.clone().sub(start);
  const distance = Math.max(direction.length(), 0.01);
  direction.normalize();
  const attachedStart = start.clone().addScaledVector(direction, 0.38);
  const attachedEnd = end.clone().addScaledVector(direction, -0.48);
  const midpoint = attachedStart.clone().lerp(attachedEnd, 0.5);
  const lateral = new THREE.Vector3(-direction.z, 0, direction.x);
  if (lateral.lengthSq() < 0.01) lateral.set(1, 0, 0);
  lateral.normalize();
  const lane = ((relationshipId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3) - 1) * 0.18;
  const control = midpoint
    .addScaledVector(lateral, lane)
    .add(new THREE.Vector3(0, 0.68 + Math.min(distance * 0.16, 0.8), 0));
  const curve = new THREE.QuadraticBezierCurve3(attachedStart, control, attachedEnd);
  const points = curve.getPoints(24);
  const tangent = curve.getTangent(0.985).normalize();
  const arrowPosition = attachedEnd.clone().addScaledVector(tangent, -0.16);
  const arrowQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  return { points, arrowPosition, arrowQuaternion };
}

export function ForgingConnections() {
  const {
    forgingLoops,
    forgingObjects,
    forgingExploded,
    forgingSeparateSectors,
    forgingFocusedSector,
    forgingHideOtherSectors,
    forgingShowOnlyLoopId,
    forgingArrowThickness,
    selectedRelationshipId,
    selectedForgingLoopId,
    setSelectedRelationshipId,
    setSelectedForgingLoopId,
  } = useStore();
  const lines = useMemo(
    () => getLoopLines(
      forgingLoops,
      forgingObjects,
      forgingExploded,
      forgingSeparateSectors,
      forgingFocusedSector,
      forgingHideOtherSectors,
      forgingShowOnlyLoopId,
    ),
    [forgingLoops, forgingObjects, forgingExploded, forgingSeparateSectors, forgingFocusedSector, forgingHideOtherSectors, forgingShowOnlyLoopId],
  );

  return (
    <group position={[0, -2.5, 0]}>
      {lines.map(({ loop, relationship, relevant, start, end }) => {
        const selected = selectedRelationshipId === relationship.id;
        const dominant = selectedForgingLoopId === loop.id || selected;
        const route = getRoute(start, end, relationship.id);
        const lineOpacity = selectedForgingLoopId || selectedRelationshipId
          ? (dominant ? 1 : (relevant ? 0.2 : 0.06))
          : (relevant ? 0.86 : 0.16);
        const lineWidth = (dominant ? 4.5 : (relevant ? 2.2 : 1)) * forgingArrowThickness;
        return (
          <group
            key={relationship.id}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedForgingLoopId(loop.id);
              setSelectedRelationshipId(relationship.id);
            }}
          >
            <Line
              points={route.points}
              color={selected ? '#ffffff' : loop.color}
              lineWidth={lineWidth * 3.2}
              transparent
              opacity={lineOpacity * 0.14}
              depthTest={false}
              depthWrite={false}
              renderOrder={20}
            />
            <Line
              points={route.points}
              color={selected ? '#ffffff' : loop.color}
              lineWidth={lineWidth}
              transparent
              opacity={lineOpacity}
              depthTest={false}
              depthWrite={false}
              renderOrder={21}
            />
            <Line
              points={route.points}
              color="#000"
              lineWidth={14}
              opacity={0}
              transparent
              depthWrite={false}
              depthTest={false}
              renderOrder={22}
            />
            <mesh position={route.arrowPosition} quaternion={route.arrowQuaternion} renderOrder={22}>
              <coneGeometry args={[(dominant ? 0.16 : 0.12) * forgingArrowThickness, (dominant ? 0.42 : 0.32) * forgingArrowThickness, 8]} />
              <meshBasicMaterial color={selected ? '#ffffff' : loop.color} transparent opacity={lineOpacity} toneMapped={false} depthTest={false} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}