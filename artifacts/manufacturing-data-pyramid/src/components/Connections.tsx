import React, { useMemo, useRef } from 'react';
import { useStore } from '../store';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COURSES, getDataObjectY, getJourneyStep, isActiveDataObject } from '../data';

function RelationshipPulse({ start, end, phase }: { start: THREE.Vector3; end: THREE.Vector3; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const progress = useRef(phase);

  useFrame((_, delta) => {
    if (!ref.current) return;
    progress.current = (progress.current + delta * 0.34) % 1;
    ref.current.position.lerpVectors(start, end, progress.current);
    ref.current.scale.setScalar(0.85 + Math.sin(progress.current * Math.PI * 2) * 0.18);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.07, 12, 12]} />
      <meshBasicMaterial color="#e0f2fe" toneMapped={false} />
    </mesh>
  );
}

export function Connections() {
  const { placedObjects, showRelationships, exploded, cutaway, journeyActive, journeyStep, activeDataOnly, courseMode, selectedObjectId, selectedRelationshipId, setSelectedRelationshipId, isolateLevel } = useStore();

  const isDataScience = courseMode === 'data-science';

  const lines = useMemo(() => {
    if (!showRelationships && !journeyActive) return [];

    const connections: { rel: any, start: THREE.Vector3, end: THREE.Vector3 }[] = [];
    
    const visibleObjects = placedObjects.filter((obj) => !(activeDataOnly && (exploded || cutaway)) || isActiveDataObject(obj));
    const objMap = new Map(visibleObjects.map(obj => [obj.id, obj]));

    // Only draw specific modeled relationships for the current course
    COURSES[courseMode].relationships.forEach(rel => {
      const source = objMap.get(rel.sourceId);
      const target = objMap.get(rel.targetId);
      
      // Handle isolate level logic: if isolateLevel is set, both source and target must be visible.
      // Or at least one? Usually if level is isolated, we hide relationships across levels to keep it clean.
      if (isolateLevel !== null && (source?.level !== isolateLevel || target?.level !== isolateLevel)) {
        return; 
      }

      if (source && target && source.position && target.position) {
          const sY = getDataObjectY(source.level, exploded);
          const tY = getDataObjectY(target.level, exploded);
         
         connections.push({
            rel,
            start: new THREE.Vector3(source.position[0], sY, source.position[2]),
            end: new THREE.Vector3(target.position[0], tY, target.position[2])
         });
      }
    });

    return connections;
  }, [placedObjects, showRelationships, exploded, cutaway, journeyActive, courseMode, isolateLevel, activeDataOnly]);

  if (!showRelationships && !journeyActive) return null;

  const baseColor = isDataScience ? "#22d3ee" : "#3b82f6";
  const selectColor = "#ffffff";

  return (
    <group position={[0, -2.5, 0]}>
      {lines.map((line, idx) => {
        const isSelected = selectedRelationshipId === line.rel.id;
        const isObjectPath = !!selectedObjectId && (line.rel.sourceId === selectedObjectId || line.rel.targetId === selectedObjectId);
        const journeyState = getJourneyStep(COURSES[courseMode], journeyStep);
        const isJourneyPath = journeyActive && (journeyState.relationshipIds?.includes(line.rel.id) ?? false);
        return (
          <group key={idx}>
            <Line
              points={[line.start, line.end]}
              color={isSelected || isJourneyPath || isObjectPath ? selectColor : baseColor}
              lineWidth={isSelected ? 6 : (isJourneyPath || isObjectPath ? 4 : (isDataScience ? 2.5 : 2))}
              dashed={true}
              dashSize={0.2}
              dashScale={0.1}
              opacity={isSelected || isJourneyPath || isObjectPath ? 1 : 0.48}
              transparent
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRelationshipId(line.rel.id);
              }}
            />
            {isJourneyPath && (
              <RelationshipPulse
                start={line.start}
                end={line.end}
                phase={(idx * 0.23) % 1}
              />
            )}
            {/* Invisible thicker line for easier raycasting / clicking */}
            <Line
              points={[line.start, line.end]}
              color="#000"
              lineWidth={20}
              opacity={0}
              transparent
              depthWrite={false}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRelationshipId(line.rel.id);
              }}
            />
          </group>
        );
      })}
    </group>
  );
}