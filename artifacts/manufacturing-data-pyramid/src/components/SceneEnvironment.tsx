import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SceneEnvironment() {
  const ringRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.015;
  });

  return (
    <group>
      <mesh position={[0, -3.08, 0]} receiveShadow>
        <cylinderGeometry args={[6.8, 7.2, 0.22, 64]} />
        <meshPhysicalMaterial color="#08131c" roughness={0.56} metalness={0.82} clearcoat={0.4} clearcoatRoughness={0.25} />
      </mesh>
      <mesh position={[0, -2.94, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.2, 6.2, 96]} />
        <meshBasicMaterial color="#123042" transparent opacity={0.34} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <group ref={ringRef} position={[0, -2.9, 0]}>
        {[2.1, 3.2, 4.3, 5.5].map((radius, index) => (
          <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius, index === 3 ? 0.014 : 0.008, 6, 96]} />
            <meshBasicMaterial color={index === 3 ? '#2dd4bf' : '#1e5061'} transparent opacity={index === 3 ? 0.44 : 0.25} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((x) => [-1, 1].map((z) => (
        <mesh key={`${x}-${z}`} position={[x * 5.4, -1.75, z * 5.4]}>
          <cylinderGeometry args={[0.035, 0.035, 2.4, 8]} />
          <meshBasicMaterial color="#1e5061" transparent opacity={0.2} toneMapped={false} />
        </mesh>
      )))}
    </group>
  );
}