import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { useStore } from '../store';
import { DataObject } from '../data';
import { Html } from '@react-three/drei';

const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 1).normalize(), 0);

function ObjectLabel({ obj, isFocused, isSelected }: { obj: DataObject, isFocused: boolean, isSelected: boolean }) {
  if (!isFocused && !isSelected) return null;
  
  return (
    <Html position={[0, 0.4, 0]} center style={{ pointerEvents: 'none' }}>
      <div className={`px-2 py-1 rounded bg-black/80 backdrop-blur border text-[10px] whitespace-nowrap transition-all ${isSelected ? 'border-primary text-primary font-bold shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'border-white/20 text-white/80'}`}>
        {obj.name}
      </div>
    </Html>
  );
}

function ObjectMesh({ obj, isFocused, isVisible, isExploded, isCutaway, mode }: { obj: DataObject, isFocused: boolean, isVisible: boolean, isExploded: boolean, isCutaway: boolean, mode: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const { selectedObjectId, setSelectedObjectId, reducedMotion, setFocusLevel } = useStore();
  
  const isSelected = selectedObjectId === obj.id;
  const isDataScience = mode === 'data-science';

  const baseLevelY = (obj.level - 0.5); 
  const targetY = isExploded ? baseLevelY + (obj.level - 1) * 0.8 : baseLevelY;

  const { position, scale, opacity } = useSpring({
    position: [obj.position![0], targetY, obj.position![2]] as [number, number, number],
    scale: isSelected ? [1.3, 1.3, 1.3] : [1, 1, 1],
    opacity: isVisible ? (isFocused ? 1 : 0.1) : 0,
    config: { mass: 1, tension: 200, friction: 20 },
    immediate: reducedMotion
  });

  useFrame((state) => {
    if (innerRef.current && !reducedMotion && isVisible) {
      if (isSelected) {
        innerRef.current.rotation.y += 0.02;
        innerRef.current.rotation.x += 0.01;
      } else {
        innerRef.current.rotation.y += 0.005;
      }
    }
  });

  const getGeometry = () => {
    switch (obj.category) {
      case 'signal': return <sphereGeometry args={[0.12, 32, 32]} />;
      case 'time-series': return <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />;
      case 'event': return <coneGeometry args={[0.15, 0.25, 4]} />;
      case 'model': return <dodecahedronGeometry args={[0.15]} />;
      case 'document': return <boxGeometry args={[0.18, 0.05, 0.22]} />;
      case 'record': return <boxGeometry args={[0.15, 0.15, 0.15]} />;
      case 'insight': return <octahedronGeometry args={[0.15]} />;
      case 'agent': return <icosahedronGeometry args={[0.15]} />;
      default: return <boxGeometry args={[0.15, 0.15, 0.15]} />;
    }
  };

  const getColor = () => {
    if (isDataScience) {
       switch (obj.category) {
         case 'agent':
         case 'insight': return '#22d3ee'; // cyan
         default: return '#3b82f6'; // blue
       }
    }
    switch (obj.category) {
      case 'signal': return '#ef4444'; // red
      case 'time-series': return '#f97316'; // orange
      case 'event': return '#eab308'; // amber
      case 'model': return '#10b981'; // emerald
      case 'document': return '#6366f1'; // indigo
      case 'record': return '#8b5cf6'; // violet
      case 'insight': return '#d946ef'; // fuchsia
      case 'agent': return '#06b6d4'; // cyan
      default: return '#9ca3af';
    }
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (!isVisible) return;
    setSelectedObjectId(isSelected ? null : obj.id);
  };

  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (!isVisible) return;
    setFocusLevel(obj.level);
  };

  return (
    <a.group 
      ref={meshRef} 
      position={position as any} 
      scale={scale as any}
      onClick={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      visible={opacity.to(o => o > 0.01)}
    >
      <mesh ref={innerRef} castShadow receiveShadow>
        {getGeometry()}
        <a.meshPhysicalMaterial
          color={getColor()}
          roughness={isDataScience ? 0.1 : 0.4}
          metalness={isDataScience ? 0.9 : 0.6}
          emissive={getColor()}
          emissiveIntensity={isSelected ? (isDataScience ? 1.5 : 0.8) : (isDataScience ? 0.3 : 0.1)}
          transparent
          opacity={opacity}
          clippingPlanes={isCutaway ? [clipPlane] : []}
        />
      </mesh>
      
      {/* Outer subtle glow sphere when selected */}
      {isSelected && !reducedMotion && (
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <a.meshBasicMaterial color={getColor()} transparent opacity={opacity.to(o => o * 0.2)} depthWrite={false} clippingPlanes={isCutaway ? [clipPlane] : []} />
        </mesh>
      )}

      {isVisible && <ObjectLabel obj={obj} isFocused={isFocused} isSelected={isSelected} />}
    </a.group>
  );
}

export function PlacedObjects() {
  const { placedObjects, focusLevel, isolateLevel, exploded, cutaway, courseMode } = useStore();

  return (
    <group position={[0, -2.5, 0]}>
      {placedObjects.map((obj) => (
        <ObjectMesh
          key={obj.id}
          obj={obj}
          isFocused={focusLevel === null || focusLevel === obj.level}
          isVisible={isolateLevel === null || isolateLevel === obj.level}
          isExploded={exploded}
          isCutaway={cutaway}
          mode={courseMode}
        />
      ))}
    </group>
  );
}