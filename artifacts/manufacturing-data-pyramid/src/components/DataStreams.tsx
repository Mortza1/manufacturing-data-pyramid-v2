import React, { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { COURSES } from '../data';

const STREAMS = [
  { x: -0.35, z: 1.05, phase: 0.1, color: '#38bdf8' },
  { x: 0.55, z: 0.35, phase: 0.48, color: '#2dd4bf' },
  { x: 0.1, z: -0.4, phase: 0.75, color: '#a78bfa' },
];

function StreamPulse({ x, z, phase, color, exploded, activeHeight, reducedMotion }: {
  x: number;
  z: number;
  phase: number;
  color: string;
  exploded: boolean;
  activeHeight: number;
  reducedMotion: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const travel = useRef(phase);

  useFrame((_, delta) => {
    if (!ref.current || !ringRef.current || reducedMotion) return;
    travel.current = (travel.current + delta * 0.13) % 1;
    const yStart = 0.18;
    const yEnd = Math.max(yStart, activeHeight);
    ref.current.position.y = yStart + (yEnd - yStart) * travel.current;
    ringRef.current.position.y = ref.current.position.y;
    ringRef.current.rotation.y += delta * 1.5;
    const pulse = 1 + Math.sin(travel.current * Math.PI * 2) * 0.16;
    ref.current.scale.setScalar(pulse);
    ringRef.current.scale.setScalar(0.8 + pulse * 0.25);
  });

  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.012, 8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.48} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function DataStreams() {
  const { exploded, journeyActive, journeyStep, courseMode, reducedMotion } = useStore();
  const palette = courseMode === 'fundamentals-ai'
    ? ['#22d3ee', '#60a5fa', '#a5f3fc']
    : courseMode === 'agentic-ai'
      ? ['#d946ef', '#a78bfa', '#22d3ee']
      : ['#38bdf8', '#2dd4bf', '#a78bfa'];
  const activeLevel = journeyActive
    ? COURSES[courseMode].journeySteps[Math.min(journeyStep, COURSES[courseMode].journeySteps.length - 1)].level
    : 5;

  const streamHeight = (level: number) =>
    (level - 0.5) + (exploded ? (level - 1) * 1.15 : 0);

  const paths = useMemo(() => STREAMS.map((stream, index) => ({
    ...stream,
    color: palette[index],
    points: [
      new THREE.Vector3(stream.x, streamHeight(1), stream.z),
      new THREE.Vector3(stream.x, streamHeight(2), stream.z),
      new THREE.Vector3(stream.x, streamHeight(3), stream.z),
      new THREE.Vector3(stream.x, streamHeight(4), stream.z),
      new THREE.Vector3(stream.x, streamHeight(5), stream.z),
    ],
  })), [exploded, palette]);

  return (
    <group position={[0, -2.5, 0]}>
      {paths.map((stream) => (
        <group key={`${stream.x}-${stream.z}`}>
          <Line
            points={stream.points}
            color={stream.color}
            lineWidth={journeyActive ? 3 : 1.5}
            transparent
            opacity={journeyActive ? 0.8 : 0.32}
            dashed
            dashSize={0.16}
            dashScale={0.7}
          />
          <StreamPulse
            x={stream.x}
            z={stream.z}
            phase={stream.phase}
            color={stream.color}
            exploded={exploded}
            activeHeight={streamHeight(activeLevel)}
            reducedMotion={reducedMotion}
          />
        </group>
      ))}
      <mesh position={[0, streamHeight(1) - 0.05, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.018, 8, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}