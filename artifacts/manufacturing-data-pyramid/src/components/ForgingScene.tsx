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
  opacity,
  cutaway,
  sectionLevel,
}: {
  level: typeof FORGING_LEVELS[number];
  exploded: boolean;
  separateSectors: boolean;
  showLabels: boolean;
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
  const tileGap = Math.min(0.12, tileSize * 0.08);

  return (
    <group position={[0, y, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={level.color}
          transparent
          opacity={opacity * (separateSectors ? 0.28 : 0.7)}
          roughness={0.28}
          metalness={0.72}
          transmission={0}
          clippingPlanes={cutaway ? [sectionClipPlane] : []}
          side={THREE.DoubleSide}
        />
        <Edges color={level.edgeColor} threshold={15} opacity={separateSectors ? 0.25 : 0.9} transparent />
      </mesh>

      {FORGING_SECTORS.map((sector) => {
        const isLeft = sector === 'product' || sector === 'process';
        const isBack = sector === 'product' || sector === 'machine';
        const offset = separateSectors ? FORGING_SECTOR_OFFSETS[sector] : [0, 0];
        return (
          <mesh
            key={sector}
            position={[
              (isLeft ? -1 : 1) * tileSize / 2 + offset[0],
              level.height / 2 + 0.035,
              (isBack ? -1 : 1) * tileSize / 2 + offset[1],
            ]}
            receiveShadow
          >
            <boxGeometry args={[tileSize - tileGap, 0.055, tileSize - tileGap]} />
            <meshStandardMaterial
              color={FORGING_SECTOR_COLORS[sector]}
              emissive={FORGING_SECTOR_COLORS[sector]}
              emissiveIntensity={separateSectors ? 0.22 : 0.08}
              transparent
              opacity={opacity * (separateSectors ? 0.64 : 0.3)}
              toneMapped={false}
            />
            <Html
              position={[0, 0.08, 0]}
              center
              style={{ pointerEvents: 'none', opacity: showLabels ? 0.75 : 0 }}
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
          </mesh>
        );
      })}

      <Html
        position={[level.base + 0.9, 0.05, 0]}
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
  const { forgingExploded, forgingSeparateSectors, forgingShowLabels, forgingPyramidOpacity, forgingCutaway, forgingSectionLevel } = useStore();
  return (
    <group position={[0, -2.5, 0]}>
      {FORGING_LEVELS.map((level) => (
        <ForgingLevel
          key={level.id}
          level={level}
          exploded={forgingExploded}
          separateSectors={forgingSeparateSectors}
          showLabels={forgingShowLabels}
          opacity={forgingPyramidOpacity}
          cutaway={forgingCutaway}
          sectionLevel={forgingSectionLevel}
        />
      ))}
    </group>
  );
}

function ForgingObjectMesh({ object }: { object: any }) {
  const { selectedObjectId, setSelectedObjectId, forgingExploded, forgingSeparateSectors, forgingShowLabels } = useStore();
  const selected = selectedObjectId === object.id;
  const innerRef = useRef<THREE.Group>(null);
  const sector = getSector(object);
  const color = FORGING_SECTOR_COLORS[sector];
  const targetPosition = getObjectPosition(object, forgingExploded, forgingSeparateSectors);
  const { position, scale, opacity } = useSpring({
    position: targetPosition,
    scale: selected ? [1.32, 1.32, 1.32] : [1.08, 1.08, 1.08],
    opacity: 1,
    config: { mass: 1, tension: 190, friction: 22 },
  });

  useFrame(() => {
    if (innerRef.current) innerRef.current.rotation.y += selected ? 0.012 : 0.003;
  });

  return (
    <a.group
      position={position as any}
      scale={scale as any}
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
        />
      </group>
      {selected && (
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {(forgingShowLabels || selected) && (
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
  const { forgingObjects } = useStore();
  return (
    <group position={[0, -2.5, 0]}>
      {forgingObjects.map((object) => <ForgingObjectMesh key={object.id} object={object} />)}
    </group>
  );
}

function getLoopLines(loops: ConnectionLoop[], objects: any[], exploded: boolean, separateSectors: boolean) {
  const objectMap = new Map(objects.map((object) => [object.id, object]));
  return loops.flatMap((loop) => loop.visible
    ? loop.relationships.flatMap((relationship) => {
      const source = objectMap.get(relationship.sourceId);
      const target = objectMap.get(relationship.targetId);
      if (!source || !target) return [];
      return [{
        loop,
        relationship,
        start: new THREE.Vector3(...getObjectPosition(source, exploded, separateSectors)),
        end: new THREE.Vector3(...getObjectPosition(target, exploded, separateSectors)),
      }];
    })
    : []);
}

export function ForgingConnections() {
  const { forgingLoops, forgingObjects, forgingExploded, forgingSeparateSectors, selectedRelationshipId, setSelectedRelationshipId } = useStore();
  const lines = useMemo(
    () => getLoopLines(forgingLoops, forgingObjects, forgingExploded, forgingSeparateSectors),
    [forgingLoops, forgingObjects, forgingExploded, forgingSeparateSectors],
  );

  return (
    <group position={[0, -2.5, 0]}>
      {lines.map(({ loop, relationship, start, end }) => {
        const selected = selectedRelationshipId === relationship.id;
        return (
          <React.Fragment key={relationship.id}>
            <Line
              points={[start, end]}
              color={selected ? '#ffffff' : loop.color}
              lineWidth={selected ? 5 : 2.5}
              transparent
              opacity={selected ? 1 : 0.72}
              dashed
              dashSize={0.2}
              dashScale={0.1}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedRelationshipId(relationship.id);
              }}
            />
            <Line
              points={[start, end]}
              color="#000"
              lineWidth={18}
              opacity={0}
              transparent
              depthWrite={false}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedRelationshipId(relationship.id);
              }}
            />
          </React.Fragment>
        );
      })}
    </group>
  );
}