import React, { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { useStore } from '../store';
import { DataObject } from '../data';
import { COURSES } from '../data';
import { Html } from '@react-three/drei';

const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 1).normalize(), 0);

function ObjectLabel({ obj, showLabel, isSelected }: { obj: DataObject, showLabel: boolean, isSelected: boolean }) {
  if (!showLabel && !isSelected) return null;
  
  return (
    <Html position={[0, 0.6, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[50, 0]}>
      <div className={`px-2 py-1 rounded bg-black/80 backdrop-blur border text-[10px] whitespace-nowrap transition-all ${isSelected ? 'border-primary text-primary font-bold shadow-[0_0_10px_rgba(34,211,238,0.5)]' : (obj.isUserAdded ? 'border-amber-400/50 text-amber-400/90' : 'border-white/20 text-white/80')}`}>
        {obj.name}
      </div>
    </Html>
  );
}

function GlyphMaterial({ color, opacity, isSelected, isDataScience, isCutaway }: { color: string; opacity: any; isSelected: boolean; isDataScience: boolean; isCutaway: boolean }) {
  return (
    <a.meshPhysicalMaterial
      color={color}
      roughness={isDataScience ? 0.18 : 0.32}
      metalness={isDataScience ? 0.85 : 0.62}
      emissive={color}
      emissiveIntensity={isSelected ? 1.15 : 0.22}
      transparent
      opacity={opacity}
      clippingPlanes={isCutaway ? [clipPlane] : []}
      toneMapped={false}
    />
  );
}

function DataGlyph({ obj, color, opacity, isSelected, isDataScience, isCutaway }: { obj: DataObject; color: string; opacity: any; isSelected: boolean; isDataScience: boolean; isCutaway: boolean }): ReactNode {
  const name = obj.name.toLowerCase();
  const material = <GlyphMaterial color={color} opacity={opacity} isSelected={isSelected} isDataScience={isDataScience} isCutaway={isCutaway} />;
  const accent = isSelected ? '#ffffff' : color;

  if (name.includes('cnc')) {
    return (
      <group>
        <mesh position={[0, 0.05, 0]} castShadow>{<boxGeometry args={[0.9, 0.34, 0.62]} />}{material}</mesh>
        <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[0.68, 0.55, 0.5]} />{material}</mesh>
        <mesh position={[0, 0.44, 0.28]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.15, 0.15, 0.08, 20]} />{material}</mesh>
        <mesh position={[0.28, 0.7, 0]} rotation={[0, 0, -0.35]}><boxGeometry args={[0.12, 0.55, 0.12]} />{material}</mesh>
        <mesh position={[0.48, 0.92, 0]} rotation={[0, 0, 0.7]}><boxGeometry args={[0.1, 0.42, 0.1]} />{material}</mesh>
        <mesh position={[0.58, 1.1, 0]}><sphereGeometry args={[0.11, 12, 12]} />{material}</mesh>
        <mesh position={[0.31, 0.16, 0.31]}><sphereGeometry args={[0.05, 12, 12]} /><meshBasicMaterial color="#f59e0b" toneMapped={false} /></mesh>
      </group>
    );
  }

  if (name.includes('sensor') || name.includes('vibration')) {
    return (
      <group>
        <mesh castShadow>{<cylinderGeometry args={[0.22, 0.27, 0.42, 8]} />}{material}</mesh>
        <mesh position={[0, 0.26, 0]}><sphereGeometry args={[0.13, 16, 16]} />{material}</mesh>
        <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.25, 0.018, 8, 24]} /><meshBasicMaterial color={accent} transparent opacity={0.8} toneMapped={false} /></mesh>
      </group>
    );
  }

  if (name.includes('camera') || name.includes('vision')) {
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.46, 0.34, 0.38]} />{material}</mesh>
        <mesh position={[0, 0, 0.23]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.12, 0.12, 0.08, 20]} /><meshBasicMaterial color="#0b1220" /></mesh>
        <mesh position={[0, 0, 0.28]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.07, 20]} /><meshBasicMaterial color={accent} toneMapped={false} /></mesh>
      </group>
    );
  }

  if (name.includes('historian')) {
    return (
      <group>
        {[-0.18, 0, 0.18].map((y) => <mesh key={y} position={[0, y, 0]} castShadow><cylinderGeometry args={[0.24, 0.24, 0.12, 20]} />{material}</mesh>)}
        <mesh position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.17, 0.02, 8, 20]} /><meshBasicMaterial color={accent} transparent opacity={0.7} toneMapped={false} /></mesh>
      </group>
    );
  }

  if (name.includes('plc') || name.includes('scada')) {
    return (
      <group>
        <mesh castShadow><boxGeometry args={[0.58, 0.4, 0.28]} />{material}</mesh>
        {[[-0.18, 0.12], [0, 0.12], [0.18, 0.12], [-0.18, -0.08], [0, -0.08], [0.18, -0.08]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.16]}><sphereGeometry args={[0.035, 10, 10]} /><meshBasicMaterial color={i % 2 ? '#2dd4bf' : '#f59e0b'} toneMapped={false} /></mesh>
        ))}
      </group>
    );
  }

  if (name.includes('cad') || name.includes('assembly')) {
    return (
      <group rotation={[0.2, 0.3, 0]}>
        <mesh castShadow><boxGeometry args={[0.72, 0.08, 0.5]} />{material}</mesh>
        <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.42, 0.08, 0.8]} />{material}</mesh>
        <lineSegments><edgesGeometry args={[new THREE.BoxGeometry(0.9, 0.66, 0.86)]} /><lineBasicMaterial color={accent} transparent opacity={0.9} toneMapped={false} /></lineSegments>
      </group>
    );
  }

  if (name.includes('fea') || name.includes('simulation')) {
    return (
      <group>
        <mesh castShadow><icosahedronGeometry args={[0.32, 1]} />{material}</mesh>
        <mesh rotation={[Math.PI / 2, 0.2, 0]}><torusGeometry args={[0.46, 0.018, 8, 28]} /><meshBasicMaterial color={accent} transparent opacity={0.7} toneMapped={false} /></mesh>
        <mesh rotation={[0.3, 0, Math.PI / 2]}><torusGeometry args={[0.38, 0.014, 8, 28]} /><meshBasicMaterial color="#f97316" transparent opacity={0.55} toneMapped={false} /></mesh>
      </group>
    );
  }

  if (name.includes('erp') || name.includes('inventory') || name.includes('order')) {
    return (
      <group>
        {[-0.2, 0, 0.2].map((y, i) => <mesh key={y} position={[i % 2 ? 0.05 : -0.05, y, 0]} castShadow><boxGeometry args={[0.7 - i * 0.08, 0.12, 0.5]} />{material}</mesh>)}
        <mesh position={[0.34, 0.16, 0.2]}><boxGeometry args={[0.1, 0.1, 0.1]} /><meshBasicMaterial color="#f59e0b" toneMapped={false} /></mesh>
      </group>
    );
  }

  if (name.includes('statistical') || name.includes('analysis')) {
    return (
      <group>
        <mesh castShadow><octahedronGeometry args={[0.34, 1]} />{material}</mesh>
        {[-0.22, 0, 0.22].map((x, i) => <mesh key={x} position={[x, -0.2 + i * 0.1, 0.18]}><boxGeometry args={[0.09, 0.25 + i * 0.12, 0.08]} /><meshBasicMaterial color={accent} transparent opacity={0.85} toneMapped={false} /></mesh>)}
      </group>
    );
  }

  if (name.includes('ai') || name.includes('decision') || name.includes('management')) {
    return (
      <group>
        <mesh castShadow><icosahedronGeometry args={[0.34, 1]} />{material}</mesh>
        <mesh rotation={[Math.PI / 2, 0.2, 0]}><torusGeometry args={[0.54, 0.025, 8, 32]} /><meshBasicMaterial color={accent} transparent opacity={0.8} toneMapped={false} /></mesh>
        <mesh rotation={[0.2, 0, Math.PI / 2]}><torusGeometry args={[0.42, 0.018, 8, 28]} /><meshBasicMaterial color="#fbbf24" transparent opacity={0.7} toneMapped={false} /></mesh>
      </group>
    );
  }

  switch (obj.category) {
    case 'signal': return <mesh castShadow><sphereGeometry args={[0.26, 20, 20]} />{material}</mesh>;
    case 'time-series': return <mesh castShadow><cylinderGeometry args={[0.24, 0.24, 0.4, 16]} />{material}</mesh>;
    case 'event': return <mesh castShadow><coneGeometry args={[0.3, 0.48, 6]} />{material}</mesh>;
    case 'model': return <mesh castShadow><dodecahedronGeometry args={[0.3]} />{material}</mesh>;
    case 'document': return <mesh castShadow><boxGeometry args={[0.42, 0.12, 0.5]} />{material}</mesh>;
    case 'record': return <mesh castShadow><boxGeometry args={[0.35, 0.35, 0.35]} />{material}</mesh>;
    case 'insight': return <mesh castShadow><octahedronGeometry args={[0.32]} />{material}</mesh>;
    case 'agent': return <mesh castShadow><icosahedronGeometry args={[0.34]} />{material}</mesh>;
    default: return <mesh castShadow><boxGeometry args={[0.35, 0.35, 0.35]} />{material}</mesh>;
  }
}

function ObjectMesh({ obj, isFocused, isRelated, isVisible, showLabel, isExploded, isCutaway, mode }: { obj: DataObject, isFocused: boolean, isRelated: boolean, isVisible: boolean, showLabel: boolean, isExploded: boolean, isCutaway: boolean, mode: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const { selectedObjectId, setSelectedObjectId, reducedMotion, setFocusLevel } = useStore();
  
  const isSelected = selectedObjectId === obj.id;
  const isDataScience = mode === 'data-science';

  const baseLevelY = (obj.level - 0.5); 
  const targetY = isExploded ? baseLevelY + (obj.level - 1) * 0.8 : baseLevelY;

  const { position, scale, opacity } = useSpring({
    position: [obj.position![0], targetY, obj.position![2]] as [number, number, number],
    scale: isSelected ? [1.34, 1.34, 1.34] : [1.08, 1.08, 1.08],
    opacity: isVisible ? (isFocused && (!selectedObjectId || isSelected || isRelated) ? 1 : 0.12) : 0.08,
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
      <group ref={innerRef}>
        <DataGlyph obj={obj} color={getColor()} opacity={opacity} isSelected={isSelected} isDataScience={isDataScience} isCutaway={isCutaway} />
      </group>
      
      {/* Outer subtle glow sphere when selected */}
      {isSelected && !reducedMotion && (
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <a.meshBasicMaterial color={getColor()} transparent opacity={opacity.to(o => o * 0.2)} depthWrite={false} clippingPlanes={isCutaway ? [clipPlane] : []} />
        </mesh>
      )}

      {isVisible && <ObjectLabel obj={obj} showLabel={showLabel} isSelected={isSelected} />}
    </a.group>
  );
}

export function PlacedObjects() {
  const { placedObjects, focusLevel, isolateLevel, exploded, cutaway, courseMode, selectedObjectId } = useStore();
  const relationships = COURSES[courseMode].relationships;

  return (
    <group position={[0, -2.5, 0]}>
      {placedObjects.map((obj) => (
        <ObjectMesh
          key={obj.id}
          obj={obj}
          isFocused={focusLevel === null || focusLevel === obj.level}
          isRelated={!!selectedObjectId && relationships.some((rel) => (rel.sourceId === selectedObjectId || rel.targetId === selectedObjectId) && (rel.sourceId === obj.id || rel.targetId === obj.id))}
          isVisible={isolateLevel === null || isolateLevel === obj.level}
          showLabel={focusLevel === obj.level || isolateLevel === obj.level || !!obj.isUserAdded || obj.id === 'ds-2' || obj.id === 'ds-15'}
          isExploded={exploded}
          isCutaway={cutaway}
          mode={courseMode}
        />
      ))}
    </group>
  );
}