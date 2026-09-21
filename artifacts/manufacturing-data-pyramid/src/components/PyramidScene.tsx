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

function getWalkthroughPanelWidth(stage: string, collapsed: boolean, viewportWidth: number) {
  if (collapsed) return 44;
  const maxWidth = stage === 'structure' ? 440 : stage === 'visualise' ? 460 : 760;
  return Math.min(maxWidth, Math.max(0, viewportWidth - 32));
}

function getWalkthroughFit(
  camera: THREE.PerspectiveCamera,
  viewportHeight: number,
  availableWidth: number,
  levelCount: number,
  exploded: boolean,
) {
  const target = new THREE.Vector3(
    0,
    getLevelBaseTop((levelCount - 1) / 2, levelCount).y - 0.5,
    0,
  );
  const horizontalExtent = 6.5;
  const verticalExtent = 4 + (exploded ? ((levelCount - 1) * 0.72) / 2 : 0.2);
  const radius = Math.hypot(horizontalExtent, verticalExtent, horizontalExtent);
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const aspect = availableWidth / Math.max(1, viewportHeight);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const fitFov = Math.min(verticalFov, horizontalFov);
  const distance = (radius / Math.sin(Math.max(0.1, fitFov / 2))) * 1.08;
  const direction = new THREE.Vector3(11, 7, 13).normalize();

  return {
    target,
    destination: target.clone().addScaledVector(direction, distance),
    availableWidth,
  };
}

function getExpandedWalkthroughViewport(canvas: HTMLCanvasElement, viewportWidth: number, viewportHeight: number) {
  const canvasRect = canvas.getBoundingClientRect();
  const panel = document.querySelector<HTMLElement>('[data-walkthrough-panel]');
  const panelRect = panel?.getBoundingClientRect();
  const fallbackRight = canvasRect.right;
  const panelGap = viewportWidth >= 768 ? 16 : 12;
  const visibleRight = panelRect
    ? Math.min(canvasRect.right, panelRect.left - panelGap)
    : fallbackRight;
  const visibleWidth = Math.max(1, visibleRight - canvasRect.left);

  return {
    canvasRect,
    visibleCenter: (canvasRect.left + visibleRight) / 2,
    availableWidth: Math.min(viewportWidth, visibleWidth),
    viewportHeight: Math.max(1, canvasRect.height || viewportHeight),
  };
}

function getWalkthroughCompositionOffset(
  camera: THREE.PerspectiveCamera,
  canvasRect: DOMRect,
  visibleCenter: number,
  destination: THREE.Vector3,
  target: THREE.Vector3,
) {
  const pixelShift = canvasRect.left + canvasRect.width / 2 - visibleCenter;
  if (Math.abs(pixelShift) < 0.5 || canvasRect.width <= 0 || canvasRect.height <= 0) {
    return new THREE.Vector3();
  }

  const distance = destination.distanceTo(target);
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * (canvasRect.width / canvasRect.height));
  const worldUnitsPerPixel = (2 * distance * Math.tan(horizontalFov / 2)) / canvasRect.width;
  const viewDirection = target.clone().sub(destination).normalize();
  const screenRight = viewDirection.clone().cross(camera.up).normalize();

  return screenRight.multiplyScalar(pixelShift * worldUnitsPerPixel);
}

function CameraRig({
  cancelRef,
  manualInteractionRef,
}: {
  cancelRef: React.MutableRefObject<(() => void) | null>;
  manualInteractionRef: React.MutableRefObject<boolean>;
}) {
  const { camera, gl, size } = useThree();
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
  const isWalkthroughPanelCollapsed = useV2Store(state => state.isWalkthroughPanelCollapsed);
  const visualiseFocusedLevelId = useV2Store(state => state.visualiseFocusedLevelId);
  const visualiseOnlyLevelId = useV2Store(state => state.visualiseOnlyLevelId);
  const viewResetNonce = useV2Store(state => state.viewResetNonce);
  const v2LevelKey = v2ActiveCase?.levels.map((level) => level.id).join('|') ?? '';
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

  const modeKey = `${v2Mode}-${walkthroughStage}-${viewResetNonce}-${visualiseFocusedLevelId}-${visualiseOnlyLevelId}-${isWalkthroughPanelCollapsed}-${size.width}-${size.height}-${journeyActive}-${journeyStep}-${focusLevel}-${isolateLevel}-${cutaway}-${exploded}-${courseMode}-${forgingCaseStudy}-${forgingSeparateSectors}-${forgingExploded}-${forgingCutaway}`;

  React.useEffect(() => {
    let frameId = 0;
    frameId = window.requestAnimationFrame(() => {
      manualInteractionRef.current = false;
      transitionRef.current = null;
      cancelRef.current = null;
      const controls = controlsRef.current;
      const fromTarget = controls?.target?.clone() ?? new THREE.Vector3(0, 0, 0);
      const target = new THREE.Vector3(0, 0, 0);
      const destination = new THREE.Vector3(10, 6.5, 10);

      const perspectiveCamera = camera as THREE.PerspectiveCamera;
      const isWalkthroughScene = v2Mode === 'walkthrough' && v2ActiveCase;
      const canvasRect = gl.domElement.getBoundingClientRect();
      const legacyPanelWidth = getWalkthroughPanelWidth(walkthroughStage, isWalkthroughPanelCollapsed, size.width);
      const legacyAvailableWidth = Math.max(1, size.width - (size.width >= 768 ? 24 : 16) - legacyPanelWidth - 16);
      const expandedViewport = isWalkthroughScene && !isWalkthroughPanelCollapsed
        ? getExpandedWalkthroughViewport(gl.domElement, size.width, size.height)
        : null;
      const availableWidth = expandedViewport?.availableWidth ?? legacyAvailableWidth;
      const fit = isWalkthroughScene
        ? getWalkthroughFit(
          perspectiveCamera,
          expandedViewport?.viewportHeight ?? size.height,
          availableWidth,
          v2ActiveCase.levels.length,
          exploded,
        )
        : null;

      if (isWalkthroughScene) {
        if (isWalkthroughPanelCollapsed) {
          perspectiveCamera.setViewOffset(size.width, size.height, 0, 0, fit!.availableWidth, size.height);
        } else {
          perspectiveCamera.clearViewOffset();
        }
        perspectiveCamera.updateProjectionMatrix();
        target.copy(fit!.target);
        const targetLevelId = visualiseOnlyLevelId ?? visualiseFocusedLevelId;
        if ((walkthroughStage === 'visualise' || walkthroughStage === 'connections') && targetLevelId) {
          const targetIndex = v2ActiveCase.levels.findIndex((level) => level.id === targetLevelId);
          if (targetIndex < 0) {
            transitionRef.current = null;
            return;
          }
          const levelGeometry = getLevelBaseTop(targetIndex, v2ActiveCase.levels.length);
          const levelY = levelGeometry.y - 0.5;
          destination.set(10.8, levelY + 5.2, 13.2);
          target.set(0, levelY, 0);
        } else {
          destination.copy(fit!.destination);
        }
        if (!isWalkthroughPanelCollapsed && expandedViewport) {
          const compositionOffset = getWalkthroughCompositionOffset(
            perspectiveCamera,
            expandedViewport.canvasRect,
            expandedViewport.visibleCenter,
            destination,
            target,
          );
          destination.add(compositionOffset);
          target.add(compositionOffset);
        }
      } else if (v2Mode !== 'explorer') {
        if (perspectiveCamera.view) {
          perspectiveCamera.clearViewOffset();
          perspectiveCamera.updateProjectionMatrix();
        }
        destination.set(12, 8, 14);
        target.set(0, 2, 0);
      } else if (forgingCaseStudy) {
        if (perspectiveCamera.view) {
          perspectiveCamera.clearViewOffset();
          perspectiveCamera.updateProjectionMatrix();
        }
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
          transitionRef.current = null;
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
        transitionRef.current = null;
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
        transitionRef.current = null;
      };
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      transitionRef.current = null;
      cancelRef.current = null;
    };
  }, [camera, cancelRef, gl, modeKey, v2Mode, walkthroughStage, v2LevelKey, visualiseFocusedLevelId, visualiseOnlyLevelId, viewResetNonce, isWalkthroughPanelCollapsed, size.width, size.height, journeyActive, journeyStep, focusLevel, isolateLevel, cutaway, exploded, courseMode, forgingCaseStudy, forgingSeparateSectors, forgingExploded, forgingCutaway]);

  useFrame((state, delta) => {
    const controls = state.controls as any;
    controlsRef.current = controls;
    if (manualInteractionRef.current) return;
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

function CanvasContextMenuGuard() {
  const { gl } = useThree();

  React.useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    gl.domElement.addEventListener('contextmenu', handleContextMenu);
    return () => gl.domElement.removeEventListener('contextmenu', handleContextMenu);
  }, [gl]);

  return null;
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
  const manualCameraInteractionRef = useRef(false);
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
        
        <CameraRig cancelRef={cancelCameraTransitionRef} manualInteractionRef={manualCameraInteractionRef} />
        <CanvasContextMenuGuard />
      </Suspense>

      <OrbitControls
        makeDefault
        onStart={() => {
          manualCameraInteractionRef.current = true;
          cancelCameraTransitionRef.current?.();
          cancelCameraTransitionRef.current = null;
          setUserInteracted(true);
        }}
        autoRotate={!isInteracting && !reducedMotion && !userInteracted}
        autoRotateSpeed={0.3}
        enablePan
        enableZoom
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
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