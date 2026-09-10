import { OrbitControls, Environment, Grid, Sparkles, ContactShadows, BakeShadows } from '@react-three/drei';
import { Pyramid } from './Pyramid';
import { PlacedObjects } from './PlacedObjects';
import { Connections } from './Connections';
import { useStore } from '../store';
import { COURSES } from '../data';
import * as THREE from 'three';
import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

function WebGLFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050508] text-foreground p-6 text-center relative z-50">
      <div className="w-16 h-16 border-2 border-primary/50 bg-primary/10 rounded-xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
        <AlertTriangle className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Hardware Acceleration Required</h2>
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        The Manufacturing Data Pyramid requires WebGL to render its 3D environment. Your current browser or device settings do not support hardware acceleration.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded shadow hover:bg-primary/90 hover:shadow-lg transition-all"
      >
        <RefreshCw size={16} /> Retry Connection
      </button>
    </div>
  );
}

function CameraRig({ isInteracting }: { isInteracting: boolean }) {
  const { journeyActive, journeyStep, focusLevel, isolateLevel, cutaway, courseMode } = useStore();
  const vec = new THREE.Vector3();
  const target = new THREE.Vector3(0, 0, 0);

  useFrame((state) => {
    if (journeyActive) {
      const steps = COURSES[courseMode].journeySteps;
      const lvl = steps[Math.min(journeyStep, steps.length - 1)].level;
      const y = (lvl - 0.5) - 2.5; 
      
      vec.set(4, y + 1.5, 5);
      target.set(0, y, 0);
      
      state.camera.position.lerp(vec, 0.05);
      state.camera.lookAt(target);
      
      const controls = state.controls as any;
      if (controls) {
        controls.target.lerp(target, 0.05);
      }
    } else if (focusLevel !== null || isolateLevel !== null) {
      const targetLvl = isolateLevel !== null ? isolateLevel : focusLevel!;
      const y = (targetLvl - 0.5) - 2.5;
      vec.set(cutaway ? 0 : 3.5, y + 1.5, cutaway ? 6 : 5);
      target.set(0, y, 0);
      state.camera.position.lerp(vec, 0.05);
      
      const controls = state.controls as any;
      if (controls) {
        controls.target.lerp(target, 0.05);
      }
    } else if (cutaway) {
      vec.set(0, 2, 9);
      target.set(0, -0.5, 0);
      state.camera.position.lerp(vec, 0.05);
      const controls = state.controls as any;
      if (controls) {
        controls.target.lerp(target, 0.05);
      }
    }
  });
  return null;
}

function DropHandler() {
  const { draggedLibraryItem, placeObject, setDraggedLibraryItem, setDragHoveredLevelId } = useStore();
  const { camera, raycaster, scene, gl } = useThree();

  React.useEffect(() => {
    let lastLevelId: number | null = null;
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!draggedLibraryItem) return;
      e.dataTransfer!.dropEffect = 'copy';
      
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      let foundLevelId = null;
      for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData && obj.userData.levelId) {
          foundLevelId = obj.userData.levelId;
          break;
        }
      }
      
      if (foundLevelId !== lastLevelId) {
        lastLevelId = foundLevelId;
        setDragHoveredLevelId(foundLevelId);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!draggedLibraryItem) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj.userData && obj.userData.levelId) {
          const pt = intersects[i].point;
          placeObject(draggedLibraryItem, [pt.x, 0, pt.z], obj.userData.levelId);
          break;
        }
      }
      setDraggedLibraryItem(null);
      setDragHoveredLevelId(null);
      lastLevelId = null;
    };
    
    const handleDragLeave = (e: DragEvent) => {
      setDragHoveredLevelId(null);
      lastLevelId = null;
    };

    gl.domElement.addEventListener('dragover', handleDragOver);
    gl.domElement.addEventListener('drop', handleDrop);
    gl.domElement.addEventListener('dragleave', handleDragLeave);
    
    return () => {
      gl.domElement.removeEventListener('dragover', handleDragOver);
      gl.domElement.removeEventListener('drop', handleDrop);
      gl.domElement.removeEventListener('dragleave', handleDragLeave);
    };
  }, [gl, camera, raycaster, scene, draggedLibraryItem, placeObject, setDraggedLibraryItem, setDragHoveredLevelId]);

  return null;
}

export function PyramidScene() {
  const { focusLevel, isolateLevel, selectedObjectId, reducedMotion, courseMode, cutaway, presentationMode, journeyActive } = useStore();
  const controlsRef = useRef<any>(null);
  const [userInteracted, setUserInteracted] = React.useState(false);
  
  const hasWebGL = useMemo(() => isWebGLAvailable(), []);

  if (!hasWebGL) {
    return <WebGLFallback />;
  }

  const isInteracting = selectedObjectId !== null || focusLevel !== null || isolateLevel !== null || journeyActive || cutaway;
  
  const bg = courseMode === 'data-science' ? '#050508' : (courseMode === 'fundamentals-ai' ? '#020617' : '#0a0a0f');
  const sparkleColor = courseMode === 'agentic-ai' ? '#d946ef' : (courseMode === 'fundamentals-ai' ? '#22d3ee' : '#3b82f6');
  const sparkleCount = courseMode === 'agentic-ai' ? 150 : (courseMode === 'fundamentals-ai' ? 120 : 80);

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ position: [8, 5, 8], fov: 45 }}
      className="w-full h-full"
      gl={{ antialias: true, alpha: false, localClippingEnabled: true }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 10, 35]} />

      <ambientLight intensity={courseMode === 'fundamentals-ai' ? 0.3 : 0.6} />
      <spotLight 
        position={[10, 15, 10]} 
        angle={0.4} 
        penumbra={1} 
        intensity={3} 
        castShadow 
        shadow-mapSize={2048} 
        shadow-bias={-0.0001}
      />
      <pointLight position={[-8, 8, -8]} intensity={1.5} color={sparkleColor} />
      <pointLight position={[8, 5, -8]} intensity={1.5} color="#3b82f6" />
      <pointLight position={[0, -2, 0]} intensity={1} color="#10b981" distance={10} />

      <Suspense fallback={null}>
        <DropHandler />
        <group position={[0, -0.5, 0]}>
          <Pyramid />
          <PlacedObjects />
          <Connections />
        </group>
        
        <Environment preset="city" />
        
        {!reducedMotion && (
          <Sparkles 
            count={sparkleCount} 
            scale={10} 
            size={courseMode !== 'data-science' ? 3 : 1.5} 
            speed={0.3} 
            opacity={0.4} 
            color={sparkleColor} 
          />
        )}
        
        <Grid 
          renderOrder={-1} 
          position={[0, -3.0, 0]} 
          infiniteGrid 
          fadeDistance={30} 
          fadeStrength={5} 
          cellColor="#1a1a24" 
          sectionColor="#0a0a10" 
        />
        
        <ContactShadows 
          position={[0, -2.99, 0]} 
          opacity={0.6} 
          scale={20} 
          blur={2.5} 
          far={5} 
          color="#000000"
        />
        
        <CameraRig isInteracting={isInteracting} />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        onStart={() => setUserInteracted(true)}
        autoRotate={!isInteracting && !reducedMotion && !userInteracted}
        autoRotateSpeed={0.3}
        enablePan={!journeyActive}
        enableZoom={!journeyActive}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={4}
        maxDistance={25}
        dampingFactor={0.05}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />
    </Canvas>
  );
}