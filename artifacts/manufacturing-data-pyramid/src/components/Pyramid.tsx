import React, { useRef, useMemo, useState } from 'react';
import { useStore } from '../store';
import { COURSES } from '../data';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { Edges, Html } from '@react-three/drei';

const LEVELS = [
  { id: 1, name: 'Raw Signals', subtitle: 'Sense the physical process', color: '#17212d', edgeColor: '#64748b', height: 1.05, base: 5.4, top: 4.35, y: 0.5 },
  { id: 2, name: 'Operations', subtitle: 'Contextualise the run', color: '#122336', edgeColor: '#2dd4bf', height: 1.05, base: 4.35, top: 3.35, y: 1.65 },
  { id: 3, name: 'Engineering', subtitle: 'Compare with intent', color: '#172b4d', edgeColor: '#60a5fa', height: 1.05, base: 3.35, top: 2.35, y: 2.8 },
  { id: 4, name: 'Enterprise', subtitle: 'Plan the system', color: '#24345f', edgeColor: '#a78bfa', height: 1.05, base: 2.35, top: 1.35, y: 3.95 },
  { id: 5, name: 'Decisions', subtitle: 'Act with intelligence', color: '#0b5364', edgeColor: '#67e8f9', height: 1.05, base: 1.35, top: 0.15, y: 5.1 },
];

function PyramidLevel({ level, isActive, isVisible, isExploded, isCutaway, sectionLevel, showLabels, surfaceOpacity, onDoubleClick, onPointerDown, onPointerOver, onPointerOut, mode }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { reducedMotion, draggedLibraryItem, dragHoveredLevelId, placeObject, setDraggedLibraryItem, touchSelectedItem, setTouchSelectedItem, selectedLevelId, setSelectedLevelId } = useStore();
  const sectionClipPlane = useMemo(() => {
    const plane = new THREE.Plane(new THREE.Vector3(-1, 0, 1).normalize(), 0);
    plane.constant = ((sectionLevel ?? 3) - 3) * 0.75;
    return plane;
  }, [sectionLevel]);

  const targetY = isExploded ? level.y + (level.id - 1) * 1.15 : level.y;
  
  const pendingItem = draggedLibraryItem || touchSelectedItem;
  const isValidDrop = !!pendingItem;
  const isDropTargetHovered = isValidDrop && (hovered || dragHoveredLevelId === level.id || !!touchSelectedItem);
  const isSelectedLevel = selectedLevelId === level.id;

  const targetOpacity = !isVisible ? 0.08 : (!isActive ? 0.1 : (isDropTargetHovered ? 1 : ((hovered || dragHoveredLevelId === level.id) ? 0.9 : (isSelectedLevel ? 0.8 : ((selectedLevelId !== null && !pendingItem) ? 0.3 : 0.72)))));
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
  const modeAccent = mode === 'fundamentals-ai' ? '#22d3ee' : mode === 'agentic-ai' ? '#d946ef' : level.edgeColor;

  return (
    <a.group position={position as any} scale={scale as any} visible={opacity.to(o => o > 0.01)}>
      
      {/* Level Label using HTML */}
      <Html 
        position={[(level.base + level.top) / 2 * 0.9, 0, (level.base + level.top) / 2 * 0.9]} 
        center 
        style={{ pointerEvents: 'none', transition: 'opacity 0.2s', opacity: isVisible && showLabels ? 1 : 0 }}
        zIndexRange={[40, 0]}
      >
          <div className={`px-3 py-2 rounded-lg bg-[#071018]/80 backdrop-blur-md border ${isSelectedLevel ? 'border-primary text-primary shadow-[0_0_16px_rgba(34,211,238,0.35)]' : 'border-white/15 text-white/80'} whitespace-nowrap shadow-xl`}>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em]">L{level.id} · {level.name}</div>
            <div className="mt-0.5 text-[9px] font-mono normal-case tracking-normal text-white/45">{level.subtitle}</div>
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
              clippingPlanes={[sectionClipPlane]}
              side={THREE.DoubleSide}
              transparent
              opacity={opacity.to((value) => value * surfaceOpacity)}
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
          opacity={opacity.to((value) => value * surfaceOpacity)}
          transmission={isDataScience ? 0.9 : 0.6}
          roughness={isDataScience ? 0.1 : 0.3}
          metalness={isDataScience ? 0.5 : 0.8}
          thickness={0.5}
          ior={1.5}
          envMapIntensity={isDataScience ? 2 : 1.5}
           emissive={isHighlighted ? "#ffffff" : modeAccent}
          emissiveIntensity={isHighlighted ? 0.8 : (isDataScience ? 0.2 : 0.05)}
          clippingPlanes={isCutaway ? [sectionClipPlane] : []}
          side={isCutaway ? THREE.DoubleSide : THREE.FrontSide}
        />
        
        {/* Metallic Wireframe Edges */}
        <Edges 
           scale={1} 
           threshold={15} 
            color={isHighlighted ? "#ffffff" : (isActive ? modeAccent : "#334155")} 
           opacity={isActive ? (isDataScience ? 1 : 0.8) : 0.2} 
           transparent 
        />
      </mesh>
    </a.group>
  );
}

export function Pyramid() {
  const { focusLevel, isolateLevel, setFocusLevel, exploded, cutaway, sectionLevel, showLevelLabels, pyramidOpacity, courseMode, journeyActive, journeyStep } = useStore();
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const journeyLevel = journeyActive
    ? COURSES[courseMode].journeySteps[Math.min(journeyStep, COURSES[courseMode].journeySteps.length - 1)]?.level ?? null
    : null;
  
  return (
    <group position={[0, -2.5, 0]}>
      {LEVELS.map((level) => {
        const isActive = focusLevel === null
          ? journeyLevel === null || journeyLevel === level.id
          : focusLevel === level.id;
        const isVisible = isolateLevel === null || isolateLevel === level.id;
        return (
          <PyramidLevel
            key={level.id}
            level={level}
            isActive={isActive}
            isVisible={isVisible}
            isExploded={exploded}
            isCutaway={cutaway}
            sectionLevel={sectionLevel}
            showLabels={showLevelLabels}
            surfaceOpacity={pyramidOpacity}
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