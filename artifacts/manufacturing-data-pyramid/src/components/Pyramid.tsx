import React, { useRef, useMemo, useState } from 'react';
import { useStore } from '../store';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { Edges, Html } from '@react-three/drei';

const LEVELS = [
  { id: 1, name: 'Shop-Floor Signals', color: '#1e293b', edgeColor: '#475569', height: 1, base: 4.0, top: 3.2, y: 0.5 },
  { id: 2, name: 'Operational Context', color: '#0f172a', edgeColor: '#334155', height: 1, base: 3.2, top: 2.4, y: 1.5 },
  { id: 3, name: 'Engineering Knowledge', color: '#172554', edgeColor: '#3b82f6', height: 1, base: 2.4, top: 1.6, y: 2.5 },
  { id: 4, name: 'Enterprise Information', color: '#1e3a8a', edgeColor: '#60a5fa', height: 1, base: 1.6, top: 0.8, y: 3.5 },
  { id: 5, name: 'Decision Intelligence', color: '#0891b2', edgeColor: '#22d3ee', height: 1, base: 0.8, top: 0, y: 4.5 },
];

const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 1).normalize(), 0);

function PyramidLevel({ level, isActive, isVisible, isExploded, isCutaway, onDoubleClick, onPointerDown, onPointerOver, onPointerOut, mode }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { reducedMotion, draggedLibraryItem, dragHoveredLevelId, placeObject, setDraggedLibraryItem, touchSelectedItem, setTouchSelectedItem, selectedLevelId, setSelectedLevelId } = useStore();

  const targetY = isExploded ? level.y + (level.id - 1) * 0.8 : level.y;
  
  const pendingItem = draggedLibraryItem || touchSelectedItem;
  const isValidDrop = !!pendingItem;
  const isDropTargetHovered = isValidDrop && (hovered || dragHoveredLevelId === level.id || !!touchSelectedItem);
  const isSelectedLevel = selectedLevelId === level.id;

  const targetOpacity = !isVisible ? 0 : (!isActive ? 0.1 : (isDropTargetHovered ? 1 : ((hovered || dragHoveredLevelId === level.id) ? 0.9 : (isSelectedLevel ? 0.8 : ((selectedLevelId !== null && !pendingItem) ? 0.3 : 0.6)))));
  const isHighlighted = isDropTargetHovered || isSelectedLevel;
  const targetScale = (isHighlighted || (isActive && (hovered || dragHoveredLevelId === level.id))) ? [1.02, 1.02, 1.02] : [1, 1, 1];

  const { position, opacity, scale } = useSpring({
    position: [0, targetY, 0] as [number, number, number],
    opacity: targetOpacity,
    scale: targetScale as [number, number, number],
    config: { mass: 1, tension: 170, friction: 26, precision: 0.001 },
    immediate: reducedMotion
  });

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(
      level.top * Math.SQRT2, 
      level.base * Math.SQRT2, 
      level.height, 
      4,
      1
    );
    geo.rotateY(Math.PI / 4);
    return geo;
  }, [level.top, level.base, level.height]);

  // Use a slightly larger invisible geometry for reliable raycasting
  const hitGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(
      (level.top + 0.1) * Math.SQRT2, 
      (level.base + 0.1) * Math.SQRT2, 
      level.height + 0.05, 
      4,
      1
    );
    geo.rotateY(Math.PI / 4);
    return geo;
  }, [level.top, level.base, level.height]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (!isVisible) return;
    if (isValidDrop && pendingItem) {
      // Place item
      const angle = Math.random() * Math.PI * 2;
      const radius = (level.base + level.top) / 2 * 0.6; 
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      placeObject(pendingItem, [x, 0, z], level.id);
      setDraggedLibraryItem(null);
      setTouchSelectedItem(null);
    } else {
      setSelectedLevelId(isSelectedLevel ? null : level.id);
      if (onPointerDown) onPointerDown();
    }
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (!isVisible) return;
    if (onDoubleClick) onDoubleClick();
  };

  const isDataScience = mode === 'data-science';

  return (
    <a.group position={position as any} scale={scale as any} visible={opacity.to(o => o > 0.01)}>
      
      {/* Level Label using HTML */}
      <Html 
        position={[(level.base + level.top) / 2 * 0.9, 0, (level.base + level.top) / 2 * 0.9]} 
        center 
        style={{ pointerEvents: 'none', transition: 'opacity 0.2s', opacity: isVisible ? 1 : 0 }}
        zIndexRange={[40, 0]}
      >
        <div className={`px-2 py-1 rounded bg-black/60 backdrop-blur-sm border ${isSelectedLevel ? 'border-primary text-primary shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'border-white/10 text-white/60'} text-[10px] sm:text-xs whitespace-nowrap font-bold uppercase tracking-wider`}>
          L{level.id}: {level.name}
        </div>
      </Html>

      {/* Invisible Hit Mesh for reliable raycasting and dropping */}
      <mesh
        geometry={hitGeometry}
        userData={{ levelId: level.id }}
        onClick={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onPointerOver={(e) => { e.stopPropagation(); if (isVisible) { setHovered(true); onPointerOver(); } }}
        onPointerOut={(e) => { setHovered(false); onPointerOut(); }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} toneMapped={false} />
      </mesh>

      {/* Inner solid core for cutaway effect, only visible when cutaway is true */}
      {isCutaway && (
         <mesh geometry={geometry} castShadow receiveShadow raycast={() => null}>
           <a.meshStandardMaterial 
              color={level.color} 
              roughness={0.7} 
              metalness={0.2}
              clippingPlanes={[clipPlane]}
              side={THREE.DoubleSide}
              transparent
              opacity={opacity}
           />
         </mesh>
      )}

      {/* Outer Glass Shell */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        castShadow
        receiveShadow
        raycast={() => null} // Handled by hit mesh
      >
        <a.meshPhysicalMaterial
          color={isHighlighted ? "#22d3ee" : level.color}
          transparent
          opacity={opacity}
          transmission={isDataScience ? 0.9 : 0.6}
          roughness={isDataScience ? 0.1 : 0.3}
          metalness={isDataScience ? 0.5 : 0.8}
          thickness={0.5}
          ior={1.5}
          envMapIntensity={isDataScience ? 2 : 1.5}
          emissive={isHighlighted ? "#22d3ee" : level.edgeColor}
          emissiveIntensity={isHighlighted ? 0.8 : (isDataScience ? 0.2 : 0.05)}
          clippingPlanes={isCutaway ? [clipPlane] : []}
          side={isCutaway ? THREE.DoubleSide : THREE.FrontSide}
        />
        
        {/* Metallic Wireframe Edges */}
        <Edges 
           scale={1} 
           threshold={15} 
           color={isHighlighted ? "#ffffff" : (isActive ? level.edgeColor : "#334155")} 
           opacity={isActive ? (isDataScience ? 1 : 0.8) : 0.2} 
           transparent 
        />
      </mesh>
    </a.group>
  );
}

export function Pyramid() {
  const { focusLevel, isolateLevel, setFocusLevel, exploded, cutaway, courseMode } = useStore();
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  
  return (
    <group position={[0, -2.5, 0]}>
      {LEVELS.map((level) => {
        const isActive = focusLevel === null || focusLevel === level.id;
        const isVisible = isolateLevel === null || isolateLevel === level.id;
        return (
          <PyramidLevel
            key={level.id}
            level={level}
            isActive={isActive}
            isVisible={isVisible}
            isExploded={exploded}
            isCutaway={cutaway}
            mode={courseMode}
            onPointerDown={() => {}} // Could be used to click to select if we want
            onDoubleClick={() => setFocusLevel(focusLevel === level.id ? null : level.id)}
            onPointerOver={() => setHoveredLevel(level.id)}
            onPointerOut={() => setHoveredLevel(null)}
          />
        );
      })}
    </group>
  );
}