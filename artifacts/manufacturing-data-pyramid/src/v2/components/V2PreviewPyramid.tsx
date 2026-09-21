import React from 'react';
import { useV2Store } from '../store';
import { getLevelBaseTop } from '../geometry';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function V2PreviewPyramid() {
  const draftLevels = useV2Store((state) => state.draft.levels);
  const draftSectors = useV2Store((state) => state.draft.sectors);
  const activeCase = useV2Store((state) => state.activeCase);
  const isEditingStructure = useV2Store((state) => state.isEditingStructure);
  const showV2Labels = useV2Store((state) => state.showV2Labels);
  const levels = activeCase && !isEditingStructure ? activeCase.levels : draftLevels;
  const sectors = activeCase && !isEditingStructure ? activeCase.sectors : draftSectors;
  const numLevels = levels.length || 1;
  const numSectors = Math.max(3, sectors.length);

  const colors = ['#17212d', '#122336', '#172b4d', '#24345f', '#0b5364', '#0d3b4a', '#082f3a', '#05222b'];
  const edgeColors = ['#64748b', '#2dd4bf', '#60a5fa', '#a78bfa', '#67e8f9', '#4fd1c5', '#38bdf8', '#0ea5e9'];

  return (
    <group>
      {levels.map((lvl, index) => {
        const { base, top, height, y } = getLevelBaseTop(index, numLevels);
        const color = colors[index % colors.length];
        const edgeColor = edgeColors[index % edgeColors.length];

        const rotY = numSectors === 4 ? Math.PI / 4 : 0;

        return (
          <group key={index} position={[0, y, 0]} rotation={[0, rotY, 0]}>
            <mesh>
              <cylinderGeometry args={[top, base, height, numSectors]} />
              <meshStandardMaterial color={color} transparent opacity={0.8} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.CylinderGeometry(top, base, height, numSectors)]} />
              <lineBasicMaterial color={edgeColor} transparent opacity={0.6} />
            </lineSegments>
          </group>
        );
      })}
      {activeCase && !isEditingStructure && showV2Labels && (
        <>
          {levels.map((level, index) => {
            const { base, y } = getLevelBaseTop(index, numLevels);
            return (
              <Html key={`level-label-${level.id}`} position={[base + 1.1, y, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                <div className="max-w-[150px] rounded border border-cyan-300/35 bg-[#06131c]/90 px-2 py-1 text-center text-[10px] font-semibold leading-tight text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.22)]">
                  {level.name}
                </div>
              </Html>
            );
          })}
          {sectors.map((sector, index) => {
            const angle = ((index + 0.5) * Math.PI * 2) / numSectors + (numSectors === 4 ? Math.PI / 4 : 0);
            const radius = 6.2;
            return (
              <Html key={`sector-label-${sector.id}`} position={[Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                <div className="max-w-[145px] rounded-full border border-indigo-300/35 bg-[#0a1020]/90 px-2.5 py-1 text-center text-[10px] font-semibold text-indigo-100 shadow-[0_0_16px_rgba(99,102,241,0.2)]">
                  {sector.name}
                </div>
              </Html>
            );
          })}
        </>
      )}
    </group>
  );
}
