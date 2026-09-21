import { OrbitControls, Environment, Grid, Sparkles, ContactShadows, BakeShadows, Html } from '@react-three/drei';
import { Pyramid } from './Pyramid';
import { PlacedObjects } from './PlacedObjects';
import { Connections } from './Connections';
import { DataStreams } from './DataStreams';
import { ForgingConnections, ForgingObjects, ForgingPyramid } from './ForgingScene';
import { SceneEnvironment } from './SceneEnvironment';
import { useStore } from '../store';
import { useV2Store } from '../v2/store';
import { V2PreviewPyramid } from '../v2/components/V2PreviewPyramid';
import { getLevelBaseTop } from '../v2/geometry';
import { COURSES, getJourneyStep, getLevelY } from '../data';
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

function CameraRig({ cancelRef }: { cancelRef: React.MutableRefObject<(() => void) | null> }) {
  const { camera } = useThree();
  const {
    journeyActive,
    journeyStep,
    focusLevel,
    isolateLevel,
    cutaway,
    exploded,
    courseMode,
    forgingCaseStudy,
    forgingSeparateSectors,
    forgingExploded,
    forgingCutaway,
  } = useStore();
  const v2Mode = useV2Store(state => state.mode);
  const walkthroughStage = useV2Store(state => state.walkthroughStage);
  const v2ActiveCase = useV2Store(state => state.activeCase);
  const visualiseFocusedLevelId = useV2Store(state => state.visualiseFocusedLevelId);
  const visualiseOnlyLevelId = useV2Store(state => state.visualiseOnlyLevelId);
  const viewResetNonce = useV2Store(state => state.viewResetNonce);
  const controlsRef = useRef<any>(null);
  const transitionRef = useRef<{
    from: THREE.Vector3;
    to: THREE.Vector3;
    fromTarget: THREE.Vector3;
    target: THREE.Vector3;
    elapsed: number;
    duration: number;
    active: boolean;
  } | null>(null);

  const modeKey = `${v2Mode}-${walkthroughStage}-${viewResetNonce}-${visualiseFocusedLevelId}-${visualiseOnlyLevelId}-${journeyActive}-${journeyStep}-${focusLevel}-${isolateLevel}-${cutaway}-${exploded}-${courseMode}-${forgingCaseStudy}-${forgingSeparateSectors}-${forgingExploded}-${forgingCutaway}`;

  React.useEffect(() => {
    const controls = controlsRef.current;
    const fromTarget = controls?.target?.clone() ?? new THREE.Vector3(0, 0, 0);
    const target = new THREE.Vector3(0, 0, 0);
    const destination = new THREE.Vector3(10, 6.5, 10);

    if (v2Mode === 'walkthrough' && walkthroughStage === 'visualise' && v2ActiveCase && (visualiseFocusedLevelId || visualiseOnlyLevelId)) {
      const targetLevelId = visualiseOnlyLevelId ?? visualiseFocusedLevelId;
      const targetIndex = v2ActiveCase.levels.findIndex((level) => level.id === targetLevelId);
      if (targetIndex < 0) {
        cancelRef.current?.();
        return;
      }
      const levelGeometry = getLevelBaseTop(targetIndex, v2ActiveCase.levels.length);
      const levelY = levelGeometry.y - 0.5;
      destination.set(10.8, levelY + 5.2, 13.2);
      target.set(0, levelY, 0);
    } else if (v2Mode !== 'explorer') {
      destination.set(12, 8, 14);
      target.set(0, 2, 0);
    } else if (forgingCaseStudy) {
      if (forgingSeparateSectors) {
        destination.set(16, 10, 16);
        target.set(0, 0.25, 0);
      } else if (forgingExploded) {
        destination.set(13, 8.5, 15);
        target.set(0, 0.25, 0);
      } else if (forgingCutaway) {
        destination.set(11, 7.5, 13);
        target.set(0, 0.1, 0);
      } else {
        cancelRef.current?.();
        return;
      }
    } else if (journeyActive) {
      const journeyLevel = getJourneyStep(COURSES[courseMode], journeyStep).level;
      const journeyY = getLevelY(journeyLevel) - 2.5;
      destination.set(12.5, 8.5, 13.5);
      target.set(0, journeyY * 0.34, 0);
    } else if (focusLevel !== null || isolateLevel !== null) {
      const targetLevel = isolateLevel ?? focusLevel ?? 3;
      const y = (targetLevel - 0.5) - 2.5;
      destination.set(cutaway ? 10.5 : 11, y + 4.8, cutaway ? 12.5 : 13);
      target.set(0, y * 0.3, 0);
    } else if (cutaway) {
      destination.set(11, 7.5, 13);
      target.set(0, 0.1, 0);
    } else if (exploded) {
      destination.set(13, 8.5, 15);
      target.set(0, 0.25, 0);
    } else {
      cancelRef.current?.();
      return;
    }

    transitionRef.current = {
      from: camera.position.clone(),
      to: destination,
      fromTarget,
      target,
      elapsed: 0,
       duration: journeyActive ? 900 : 650,
      active: true,
    };
    cancelRef.current = () => {
      if (transitionRef.current) transitionRef.current.active = false;
    };

    return () => {
      if (cancelRef.current === undefined) return;
      cancelRef.current = null;
    };
  }, [camera, cancelRef, modeKey, v2Mode, walkthroughStage, v2ActiveCase, visualiseFocusedLevelId, visualiseOnlyLevelId, viewResetNonce, journeyActive, journeyStep, focusLevel, isolateLevel, cutaway, exploded, courseMode, forgingCaseStudy, forgingSeparateSectors, forgingExploded, forgingCutaway]);

  useFrame((state, delta) => {
    const controls = state.controls as any;
    controlsRef.current = controls;
    const transition = transitionRef.current;
    if (!transition?.active) return;

    transition.elapsed += delta * 1000;
    const progress = Math.min(1, transition.elapsed / transition.duration);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    state.camera.position.lerpVectors(transition.from, transition.to, eased);
    if (controls) {
      controls.target.lerpVectors(transition.fromTarget, transition.target, eased);
      controls.update();
    } else {
      state.camera.lookAt(transition.target);
    }
    if (progress >= 1) transition.active = false;
  });
  return null;
}

function DropHandler() {
  const { draggedLibraryItem, placeObject, setDraggedLibraryItem, setDragHoveredLevelId, setDragPosition } = useStore();
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
      const point = intersects.find((hit) => hit.object.userData?.levelId)?.point;
      setDragPosition(point ? [point.x, point.y, point.z] : null);
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
           setDragPosition(null);
          break;
        }
      }
      setDraggedLibraryItem(null);
      setDragHoveredLevelId(null);
      setDragPosition(null);
      lastLevelId = null;
    };
    
    const handleDragLeave = (e: DragEvent) => {
      setDragHoveredLevelId(null);
      setDragPosition(null);
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
  }, [gl, camera, raycaster, scene, draggedLibraryItem, placeObject, setDraggedLibraryItem, setDragHoveredLevelId, setDragPosition]);

  return null;
}

function DragGhost() {
  const { draggedLibraryItem, dragPosition, dragHoveredLevelId } = useStore();
  if (!draggedLibraryItem || !dragPosition) return null;
  return (
    <group position={dragPosition}>
      <mesh>
        <sphereGeometry args={[0.34, 20, 20]} />
        <meshBasicMaterial color={dragHoveredLevelId ? '#67e8f9' : '#fbbf24'} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.48, 0.025, 8, 28]} />
        <meshBasicMaterial color={dragHoveredLevelId ? '#67e8f9' : '#fbbf24'} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="rounded-full border border-cyan-300/70 bg-[#06141b]/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.45)] whitespace-nowrap">
          {dragHoveredLevelId ? `Drop on L${dragHoveredLevelId}` : 'Place data'}
        </div>
      </Html>
    </group>
  );
}

export function PyramidScene() {
  const {
    focusLevel,
    isolateLevel,
    selectedObjectId,
    reducedMotion,
    courseMode,
    cutaway,
    presentationMode,
    journeyActive,
    exploded,
    forgingCaseStudy,
    forgingSeparateSectors,
    forgingExploded,
    forgingCutaway,
  } = useStore();
  const cancelCameraTransitionRef = useRef<(() => void) | null>(null);
  const [userInteracted, setUserInteracted] = React.useState(false);
  
  const v2Mode = useV2Store(state => state.mode);
  const walkthroughStage = useV2Store(state => state.walkthroughStage);
  
  const hasWebGL = useMemo(() => isWebGLAvailable(), []);

  if (!hasWebGL) {
    return <WebGLFallback />;
  }

  const isInteracting = selectedObjectId !== null || focusLevel !== null || isolateLevel !== null || journeyActive || cutaway || exploded || forgingCaseStudy || forgingSeparateSectors || forgingExploded || forgingCutaway || v2Mode !== 'explorer';
  const bg = courseMode === 'data-science' ? '#050508' : (courseMode === 'fundamentals-ai' ? '#020617' : '#0a0a0f');
  const sparkleColor = courseMode === 'agentic-ai' ? '#d946ef' : (courseMode === 'fundamentals-ai' ? '#22d3ee' : '#3b82f6');
  const sparkleCount = courseMode === 'agentic-ai' ? 150 : (courseMode === 'fundamentals-ai' ? 120 : 80);

  return (
      <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [10, 6.5, 10], fov: 42 }}
      className="w-full h-full"
      gl={{ antialias: true, alpha: false, localClippingEnabled: true }}
    >
      <color attach="background" args={[bg]} />
      {/* Keep atmospheric depth from changing pyramid layer opacity while zooming. */}
      <fog attach="fog" args={[bg, 80, 180]} />

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
        <DragGhost />
        <SceneEnvironment />
        <group position={[0, -0.5, 0]}>
          {v2Mode !== 'explorer' ? (
            <V2PreviewPyramid />
          ) : forgingCaseStudy ? (
            <>
              <ForgingPyramid />
              <ForgingObjects />
              <ForgingConnections />
            </>
          ) : (
            <>
              <Pyramid />
              <PlacedObjects />
              <DataStreams />
              <Connections />
            </>
          )}
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
        
        {(v2Mode === 'explorer' || walkthroughStage !== 'visualise') && <Grid
          renderOrder={-1} 
          position={[0, -3.0, 0]} 
          infiniteGrid 
          fadeDistance={36} 
          fadeStrength={5} 
          cellColor="#233243" 
          sectionColor="#0c1620" 
          cellThickness={0.55}
          sectionThickness={1.2}
        />}
        
        <ContactShadows 
          position={[0, -2.99, 0]} 
          opacity={0.6} 
          scale={24} 
          blur={2.5} 
          far={5} 
          color="#000000"
        />
        
        <CameraRig cancelRef={cancelCameraTransitionRef} />
      </Suspense>

      <OrbitControls
        makeDefault
        onStart={() => {
          cancelCameraTransitionRef.current?.();
          setUserInteracted(true);
        }}
        autoRotate={!isInteracting && !reducedMotion && !userInteracted}
        autoRotateSpeed={0.3}
        enablePan
        enableZoom
        minPolarAngle={0.01}
        maxPolarAngle={Math.PI - 0.01}
        minDistance={3}
        maxDistance={32}
        dampingFactor={0.05}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />
    </Canvas>
  );
}