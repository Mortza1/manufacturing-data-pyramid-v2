import React from 'react';
import { useV2Store } from '../store';
import { getLevelBaseTop } from '../geometry';
import * as THREE from 'three';

export function V2PreviewPyramid() {
  const draftLevels = useV2Store((state) => state.draft.levels);
  const draftSectors = useV2Store((state) => state.draft.sectors);
  const numLevels = draftLevels.length || 1;
  const numSectors = Math.max(3, draftSectors.length);

  const colors = ['#17212d', '#122336', '#172b4d', '#24345f', '#0b5364', '#0d3b4a', '#082f3a', '#05222b'];
  const edgeColors = ['#64748b', '#2dd4bf', '#60a5fa', '#a78bfa', '#67e8f9', '#4fd1c5', '#38bdf8', '#0ea5e9'];

  return (
    <group>
      {draftLevels.map((lvl, index) => {
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
    </group>
  );
}
