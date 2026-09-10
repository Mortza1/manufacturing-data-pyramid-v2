import React, { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, a } from '@react-spring/three';
import * as THREE from 'three';
import { useStore } from '../store';
import { DataObject } from '../data';
import { COURSES } from '../data';
import { Html, Line } from '@react-three/drei';

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
      clippingPlanes={[]}
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
           <a.meshBasicMaterial color={getColor()} transparent opacity={opacity.to(o => o * 0.2)} depthWrite={false} />
        </mesh>
      )}

      {isVisible && <ObjectLabel obj={obj} showLabel={showLabel} isSelected={isSelected} />}
    </a.group>
  );
}

export function PlacedObjects() {
  const { placedObjects, focusLevel, isolateLevel, exploded, cutaway, courseMode, selectedObjectId, selectedLevelId, journeyActive, journeyStep } = useStore();
  const relationships = COURSES[courseMode].relationships;
  const journeyLevel = journeyActive
    ? COURSES[courseMode].journeySteps[Math.min(journeyStep, COURSES[courseMode].journeySteps.length - 1)]?.level ?? null
    : null;

  return (
    <group position={[0, -2.5, 0]}>
      {placedObjects.map((obj) => (
        <React.Fragment key={obj.id}>
        <ObjectMesh
          key={obj.id}
          obj={obj}
          isFocused={focusLevel === null && (journeyLevel === null || journeyLevel === obj.level) || focusLevel === obj.level}
          isRelated={!!selectedObjectId && relationships.some((rel) => (rel.sourceId === selectedObjectId || rel.targetId === selectedObjectId) && (rel.sourceId === obj.id || rel.targetId === obj.id))}
          isVisible={isolateLevel === null || isolateLevel === obj.level}
          showLabel={focusLevel === obj.level || isolateLevel === obj.level || journeyLevel === obj.level || !!obj.isUserAdded || obj.id === 'ds-2' || obj.id === 'ds-15'}
          isExploded={exploded}
          isCutaway={cutaway}
          mode={courseMode}
        />
        {exploded && <LevelAnchor obj={obj} />}
        </React.Fragment>
      ))}
      <LevelDataFan placedObjects={placedObjects} selectedLevelId={selectedLevelId} selectedObjectId={selectedObjectId} />
    </group>
  );
}

const LEVEL_ACCENTS: Record<number, string> = {
  1: '#64748b',
  2: '#2dd4bf',
  3: '#60a5fa',
  4: '#a78bfa',
  5: '#67e8f9',
};

function LevelAnchor({ obj }: { obj: DataObject }) {
  const targetY = (obj.level - 0.5) + (obj.level - 1) * 0.8;
  const accent = LEVEL_ACCENTS[obj.level] ?? '#67e8f9';
  return (
    <group position={[obj.position?.[0] ?? 0, targetY, obj.position?.[2] ?? 0]}>
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.7, 8]} />
        <meshBasicMaterial color={accent} transparent opacity={0.65} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.26, 0.018, 8, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0.75} toneMapped={false} />
      </mesh>
      <Html position={[0.32, -0.74, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[35, 0]}>
        <span className="rounded-full border border-white/15 bg-[#071018]/80 px-1.5 py-0.5 text-[8px] font-mono font-bold text-white/70">
          L{obj.level}
        </span>
      </Html>
    </group>
  );
}

function FanObject({ obj, index, count, isOpen, isSelected, onSelect }: {
  obj: DataObject;
  index: number;
  count: number;
  isOpen: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const levelY = obj.level - 0.5;
  const angle = count === 1 ? 0 : ((index / (count - 1)) - 0.5) * 1.45;
  const radius = 1.7;
  const openPosition: [number, number, number] = [5.15 + Math.cos(angle) * radius, levelY + Math.sin(angle) * radius, 0];
  const closedPosition: [number, number, number] = [5.2, levelY, 0];
  const { reducedMotion } = useStore();
  const { position, scale, opacity } = useSpring({
    position: (isOpen ? openPosition : closedPosition) as [number, number, number],
    scale: isOpen ? (isSelected ? [1.3, 1.3, 1.3] : [0.96, 0.96, 0.96]) : [0.01, 0.01, 0.01],
    opacity: isOpen ? 1 : 0,
    config: { mass: 0.8, tension: 190, friction: 22 },
    immediate: reducedMotion,
  });

  return (
    <a.group
      position={position as any}
      scale={scale as any}
      visible={opacity.to(value => value > 0.01)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <DataGlyph obj={obj} color={LEVEL_ACCENTS[obj.level] ?? '#67e8f9'} opacity={opacity} isSelected={isSelected} isDataScience={false} isCutaway={false} />
      <ObjectLabel obj={obj} showLabel={isOpen} isSelected={isSelected} />
    </a.group>
  );
}

function LevelDataFan({ placedObjects, selectedLevelId, selectedObjectId }: {
  placedObjects: DataObject[];
  selectedLevelId: number | null;
  selectedObjectId: string | null;
}) {
  const [displayLevel, setDisplayLevel] = React.useState<number | null>(selectedLevelId);

  React.useEffect(() => {
    if (selectedLevelId !== null) {
      setDisplayLevel(selectedLevelId);
      return;
    }
    const timer = window.setTimeout(() => setDisplayLevel(null), 420);
    return () => window.clearTimeout(timer);
  }, [selectedLevelId]);

  if (displayLevel === null) return null;
  const objects = placedObjects.filter(obj => obj.level === displayLevel);
  const isOpen = selectedLevelId === displayLevel && selectedObjectId === null;
  const levelY = displayLevel - 0.5;
  const accent = LEVEL_ACCENTS[displayLevel] ?? '#67e8f9';

  return (
    <group>
      <mesh position={[5.05, levelY, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={accent} transparent opacity={isOpen ? 0.9 : 0} toneMapped={false} />
      </mesh>
      {objects.map((obj, index) => {
        const angle = objects.length === 1 ? 0 : ((index / (objects.length - 1)) - 0.5) * 1.45;
        const end: [number, number, number] = [5.15 + Math.cos(angle) * 1.7, levelY + Math.sin(angle) * 1.7, 0];
        return (
          <React.Fragment key={`fan-${obj.id}`}>
            <Line points={[[5.05, levelY, 0], end]} color={accent} lineWidth={1.5} transparent opacity={isOpen ? 0.45 : 0} />
            <FanObject
              obj={obj}
              index={index}
              count={objects.length}
              isOpen={isOpen}
              isSelected={selectedObjectId === obj.id}
              onSelect={() => useStore.getState().setSelectedObjectId(selectedObjectId === obj.id ? null : obj.id)}
            />
          </React.Fragment>
        );
      })}
    </group>
  );
}