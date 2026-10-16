import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Html, Line } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { KIND_STYLE, levelStartFraction, type GraphLevel, type GraphNode, type NodeKind } from './graphTypes';
import { RealisticModel, type MaterialFn } from './RealisticModels';
import { getTourSteps, isProposed, useAdvancedStore, useHighlight, useSample, useVisibleGraph, type LoadedSample } from './store';

// A true pyramid tapering to a point; the apex level is taller (see GraphLevel weights).
const TOTAL_HEIGHT = 7;
const BASE_RADIUS = 6;
const EXPLODE_GAP = 0.85;

function radiusAt(y: number) {
  return BASE_RADIUS * (1 - y / TOTAL_HEIGHT);
}

// The square pyramid is a 4-segment cylinder rotated by π/4, so face i is centred on angle (i+1)·π/2,
// using three.js's cylinder convention x = sin θ, z = cos θ.
function faceAngle(sector: number) {
  return ((sector + 1) * Math.PI) / 2;
}

function polar(theta: number, distance: number, y: number) {
  return new THREE.Vector3(Math.sin(theta) * distance, y, Math.cos(theta) * distance);
}

export function getLevelFrame(levels: GraphLevel[], level: number, exploded: boolean) {
  const bottom = levelStartFraction(levels, level) * TOTAL_HEIGHT;
  const top = level === levels.length ? TOTAL_HEIGHT : levelStartFraction(levels, level + 1) * TOTAL_HEIGHT;
  const offset = exploded ? (level - 1) * EXPLODE_GAP : 0;
  const height = top - bottom;
  // Nodes sit in the lower part of the slab, where the level is widest.
  const nodeLocalY = Math.min(0.45, height * 0.3);
  return {
    y: bottom + height / 2 + offset,
    height,
    base: radiusAt(bottom),
    top: radiusAt(top),
    nodeY: bottom + nodeLocalY + offset,
    nodeRadius: radiusAt(bottom + nodeLocalY),
  };
}

function spread(count: number, index: number, step: number) {
  return (index - (count - 1) / 2) * step;
}

function layoutNodes(levels: GraphLevel[], nodes: GraphNode[], exploded: boolean) {
  const positions = new Map<string, THREE.Vector3>();
  for (const { level } of levels) {
    const frame = getLevelFrame(levels, level, exploded);
    const onLevel = nodes.filter((node) => node.level === level);
    const insideFace = frame.nodeRadius * Math.SQRT1_2; // distance from the axis to a face at the nodes' height

    // Nodes without a sector share a ring in the middle of the level.
    const ringNodes = onLevel.filter((node) => node.sector === undefined && node.kind !== 'agent');
    const ring = ringNodes.length <= 1 ? 0 : insideFace * 0.75;
    ringNodes.forEach((node, i) => {
      positions.set(node.id, polar((i / ringNodes.length) * Math.PI * 2 + level * 0.55, ring, frame.nodeY));
    });

    // Nodes with a sector sit inside their face's wedge; agents float just outside that face.
    for (let sector = 0; sector < 4; sector += 1) {
      const inWedge = onLevel.filter((node) => node.sector === sector && node.kind !== 'agent');
      const step = Math.min(0.5, 1.1 / Math.max(1, inWedge.length));
      inWedge.forEach((node, i) => {
        const depth = inWedge.length > 3 ? (i % 2 ? 0.45 : 0.75) : 0.62;
        positions.set(node.id, polar(faceAngle(sector) + spread(inWedge.length, i, step), insideFace * depth, frame.nodeY));
      });
      const agents = onLevel.filter((node) => (node.sector ?? 0) === sector && node.kind === 'agent');
      agents.forEach((node, i) => {
        positions.set(node.id, polar(faceAngle(sector) + spread(agents.length, i, 0.35), insideFace + 0.9, frame.nodeY + 0.25));
      });
    }
  }
  // Agents without a level orbit above the apex.
  const agentY = TOTAL_HEIGHT + (exploded ? (levels.length - 1) * EXPLODE_GAP : 0) + 1.2;
  const agents = nodes.filter((node) => node.level === null);
  agents.forEach((node, i) => {
    const angle = (i / Math.max(1, agents.length)) * Math.PI * 2 - Math.PI / 4;
    positions.set(node.id, new THREE.Vector3(Math.cos(angle) * 2.4, agentY, Math.sin(angle) * 2.4));
  });
  return { positions, agentY };
}

function curveFor(start: THREE.Vector3, end: THREE.Vector3, id: string) {
  const mid = start.clone().lerp(end, 0.5);
  const dir = end.clone().sub(start);
  const lateral = new THREE.Vector3(-dir.z, 0, dir.x);
  if (lateral.lengthSq() < 0.001) lateral.set(1, 0, 0);
  lateral.normalize();
  const lane = ((id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % 3) - 1) * 0.25;
  const control = mid.addScaledVector(lateral, lane).add(new THREE.Vector3(0, 0.35 + Math.min(dir.length() * 0.1, 0.6), 0));
  return new THREE.QuadraticBezierCurve3(start, control, end);
}

function NodeShape({ kind }: { kind: NodeKind }) {
  switch (kind) {
    case 'context': return <boxGeometry args={[0.3, 0.3, 0.3]} />;
    case 'evidence': return <cylinderGeometry args={[0.16, 0.16, 0.34, 14]} />;
    case 'event': return <tetrahedronGeometry args={[0.26]} />;
    case 'person': return <capsuleGeometry args={[0.1, 0.2, 4, 12]} />;
    case 'summary': return <octahedronGeometry args={[0.24]} />;
    case 'finding': return <icosahedronGeometry args={[0.21]} />;
    case 'model': return <torusKnotGeometry args={[0.12, 0.045, 48, 8]} />;
    case 'decision': return <coneGeometry args={[0.19, 0.36, 4]} />;
    case 'outcome': return <sphereGeometry args={[0.19, 20, 16]} />;
    case 'agent': return <dodecahedronGeometry args={[0.3]} />;
  }
}

function GraphNodeMesh({ node, position, dimmed, secondary, highlighted, highlightColor, proposed }: {
  node: GraphNode;
  position: THREE.Vector3;
  dimmed: boolean;
  secondary: boolean;
  highlighted: boolean;
  highlightColor: string;
  proposed: boolean;
}) {
  const selectedNodeId = useAdvancedStore((state) => state.selectedNodeId);
  const selectNode = useAdvancedStore((state) => state.selectNode);
  const showLabels = useAdvancedStore((state) => state.showLabels);
  const realistic = useAdvancedStore((state) => state.realistic);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const selected = selectedNodeId === node.id;
  const color = KIND_STYLE[node.kind].color;
  const lit = highlighted || selected;
  // Shared material for the realistic models: true colours, with the kind colour as glowing accents.
  const material: MaterialFn = (base, extra) => ({
    color: base,
    emissive: extra?.emissive ? base : color,
    emissiveIntensity: extra?.emissive ? (dimmed ? 0.15 : lit ? 1.2 : 0.7) : (lit ? 0.22 : 0),
    roughness: 0.45,
    metalness: 0.3,
    transparent: true,
    opacity: dimmed ? 0.18 : proposed ? 0.55 : 1,
    wireframe: proposed,
    depthWrite: !dimmed,
    toneMapped: !extra?.emissive,
  });

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Abstract agents spin; realistic robot heads just look around.
    ref.current.rotation.y = node.kind !== 'agent' ? 0 : realistic ? Math.sin(clock.elapsedTime * 0.8) * 0.6 : clock.elapsedTime * 0.6;
    const pulse = proposed ? 1 + Math.sin(clock.elapsedTime * 3) * 0.08 : 1;
    ref.current.scale.setScalar((selected ? 1.35 : hovered ? 1.15 : 1) * pulse * (realistic ? 1.35 : 1));
  });

  return (
    <group
      position={position}
      onClick={(event) => { event.stopPropagation(); selectNode(selected ? null : node.id); }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
    >
      <group ref={ref}>
        {realistic ? <RealisticModel node={node} accent={color} m={material} /> : (
          <mesh castShadow>
            <NodeShape kind={node.kind} />
            <meshStandardMaterial
              color={selected ? '#ffffff' : color}
              emissive={color}
              emissiveIntensity={dimmed ? 0.1 : lit ? 1.1 : 0.55}
              transparent
              opacity={dimmed ? 0.18 : proposed ? 0.55 : 1}
              wireframe={proposed}
              depthWrite={!dimmed}
              toneMapped={false}
            />
          </mesh>
        )}
        {(highlighted || selected) && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.38, 0.022, 8, 32]} />
            <meshBasicMaterial color={selected ? '#ffffff' : highlightColor} toneMapped={false} />
          </mesh>
        )}
      </group>
      {((showLabels && !dimmed && !secondary) || selected || hovered) && (
        <Html position={[0, 0.42, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }} zIndexRange={[55, 0]}>
          <div className={`whitespace-nowrap rounded border px-2 py-0.5 text-[15px] font-semibold shadow-lg ${selected ? 'border-white bg-[#06131c] text-white' : 'border-white/15 bg-[#06131c]/90 text-slate-100'} ${proposed ? 'border-dashed' : ''}`}>
            <span className="mr-1.5 font-mono text-[11px] uppercase" style={{ color }}>{node.label}</span>
            {node.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function FlowPulse({ curve, color }: { curve: THREE.QuadraticBezierCurve3; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = useMemo(() => Math.random(), []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.copy(curve.getPoint((clock.elapsedTime * 0.35 + offset) % 1));
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 10, 8]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

// The graph group sits at y=-2.2 inside the scene group at y=-0.5.
const WORLD_OFFSET = new THREE.Vector3(0, -2.7, 0);
type Controls = THREE.EventDispatcher<{ start: object }> & { target: THREE.Vector3; update: () => void };

function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

// Flies the camera to each story step, then keeps a slow orbit going until the next step.
function TourCamera({ sample, positions }: { sample: LoadedSample; positions: Map<string, THREE.Vector3> }) {
  const tour = useAdvancedStore((state) => state.tour);
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as Controls | null;
  const anim = useRef<{ fromTarget: THREE.Vector3; toTarget: THREE.Vector3; from: THREE.Spherical; to: THREE.Spherical; t: number } | null>(null);
  const userMoved = useRef(false);
  const stepKey = tour ? `${tour.workflowId}:${tour.index}` : null;

  useEffect(() => {
    if (!controls) return;
    const onStart = () => { userMoved.current = true; anim.current = null; };
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
  }, [controls]);

  useEffect(() => {
    if (!tour || !controls) { anim.current = null; return; }
    const step = getTourSteps(sample, tour.workflowId)[tour.index];
    if (!step) return;
    userMoved.current = false;
    const current = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    let focus = new THREE.Vector3(0, 4, 0);
    let theta = current.theta + (step.kind === 'intro' ? 0.5 : 0.9);
    let radius = 20;
    let phi = 1.1;
    if (step.kind === 'rel') {
      const rel = sample.rels.find((item) => item.id === step.relId);
      const a = rel && positions.get(rel.source);
      const b = rel && positions.get(rel.target);
      if (!a || !b) return;
      const mid = a.clone().lerp(b, 0.5);
      focus = mid.clone();
      const edge = b.clone().sub(a);
      const horizontal = Math.hypot(edge.x, edge.z);
      if (horizontal > 0.4) {
        // Look at the connection side-on, from the side where the nodes are.
        // Spherical theta is measured from +Z towards +X, hence atan2(x, z).
        const sideA = Math.atan2(edge.z, -edge.x);
        const sideB = wrapAngle(sideA + Math.PI);
        const outward = Math.hypot(mid.x, mid.z) > 0.3 ? Math.atan2(mid.x, mid.z) : current.theta;
        theta = Math.abs(wrapAngle(sideA - outward)) < Math.abs(wrapAngle(sideB - outward)) ? sideA : sideB;
      } else if (Math.hypot(mid.x, mid.z) > 0.3) {
        theta = Math.atan2(mid.x, mid.z);
      } else {
        theta = current.theta + 0.6;
      }
      radius = THREE.MathUtils.clamp(edge.length() * 1.8 + 8.5, 11, 15);
      phi = horizontal > 0.4 ? 1.08 : 1.2;
    }
    // Aim below the subject so it sits in the upper part of the screen, clear of the storyboard card.
    const target = focus.add(WORLD_OFFSET).sub(new THREE.Vector3(0, radius * 0.12, 0));
    // Always turn a little so every step reads as movement.
    let delta = wrapAngle(theta - current.theta);
    if (Math.abs(delta) < 0.35) delta += delta >= 0 ? 0.35 : -0.35;
    anim.current = {
      fromTarget: controls.target.clone(),
      toTarget: target,
      from: current,
      to: new THREE.Spherical(radius, phi, current.theta + delta),
      t: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, positions, controls, sample]);

  useFrame((_, dt) => {
    if (!tour || !controls) return;
    const a = anim.current;
    if (a) {
      a.t = Math.min(1, a.t + dt / 1.7);
      const e = a.t < 0.5 ? 4 * a.t ** 3 : 1 - (-2 * a.t + 2) ** 3 / 2;
      controls.target.lerpVectors(a.fromTarget, a.toTarget, e);
      const s = new THREE.Spherical(
        THREE.MathUtils.lerp(a.from.radius, a.to.radius, e),
        THREE.MathUtils.lerp(a.from.phi, a.to.phi, e),
        THREE.MathUtils.lerp(a.from.theta, a.to.theta, e),
      );
      camera.position.setFromSpherical(s).add(controls.target);
      if (a.t >= 1) anim.current = null;
    } else if (!userMoved.current) {
      const s = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      s.theta += dt * 0.07;
      camera.position.setFromSpherical(s).add(controls.target);
    }
    controls.update();
  });

  return null;
}

export function AdvancedGraphPyramid() {
  const exploded = useAdvancedStore((state) => state.exploded);
  const showLabels = useAdvancedStore((state) => state.showLabels);
  const proposals = useAdvancedStore((state) => state.proposals);
  const selectedRelId = useAdvancedStore((state) => state.selectedRelId);
  const selectRel = useAdvancedStore((state) => state.selectRel);
  const sample = useSample();
  const { nodes, rels } = useVisibleGraph();
  const highlight = useHighlight();
  const { positions, agentY } = useMemo(() => layoutNodes(sample.levels, nodes, exploded), [sample, nodes, exploded]);
  // Level labels sit off a corner so they don't collide with agents floating beside the faces.
  const labelAngle = (3 * Math.PI) / 4;
  // During a story, only label the levels the current step touches; the camera gets close and labels grow.
  const touring = useAdvancedStore((state) => Boolean(state.tour));
  const touredLevels = touring && highlight
    ? new Set(Array.from(highlight.nodeIds).map((id) => sample.nodeById.get(id)?.level))
    : null;

  return (
    <group position={[0, -2.2, 0]}>
      <TourCamera sample={sample} positions={positions} />
      {sample.levels.map(({ level, name, color }) => {
        const frame = getLevelFrame(sample.levels, level, exploded);
        const geometry = new THREE.CylinderGeometry(frame.top, frame.base, frame.height * 0.96, 4, 1, true);
        return (
          <group key={level} position={[0, frame.y, 0]}>
            {sample.sectors ? sample.sectors.map((sector, i) => (
              <mesh key={sector.name} rotation={[0, Math.PI / 4, 0]}>
                <cylinderGeometry args={[frame.top, frame.base, frame.height * 0.96, 1, 1, true, (i * Math.PI) / 2, Math.PI / 2]} />
                <meshStandardMaterial color={sector.color} emissive={sector.color} emissiveIntensity={0.15} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            )) : (
              <mesh rotation={[0, Math.PI / 4, 0]} geometry={geometry}>
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} transparent opacity={0.09} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
            )}
            <lineSegments rotation={[0, Math.PI / 4, 0]}>
              <edgesGeometry args={[geometry]} />
              <lineBasicMaterial color={color} transparent opacity={0.45} />
            </lineSegments>
            {(!touredLevels || touredLevels.has(level)) && <Html position={polar(labelAngle, frame.base + 0.8, 0).toArray()} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
              <div className="whitespace-nowrap rounded border border-cyan-300/30 bg-[#06131c]/90 px-2 py-1 text-[17px] font-semibold text-cyan-100">
                L{level} · {name}
              </div>
            </Html>}
          </group>
        );
      })}

      {/* Sector (face) labels with scale badges, around the base */}
      {!touring && sample.sectors?.map((sector, i) => (
        <Html key={sector.name} position={polar(faceAngle(i), BASE_RADIUS * Math.SQRT1_2 + 1.7, 0.05).toArray()} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-lg border px-2.5 py-1 text-center shadow-lg" style={{ borderColor: `${sector.color}88`, background: '#0a1020e8' }}>
            <div className="text-[17px] font-semibold" style={{ color: sector.color }}>{sector.name}</div>
            <div className="text-[12px] text-slate-400">{sector.stat}</div>
          </div>
        </Html>
      ))}

      {/* Agent layer: a halo above the apex */}
      {nodes.some((node) => node.level === null) && (
        <group position={[0, agentY, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.4, 0.015, 8, 96]} />
            <meshBasicMaterial color="#f472b6" transparent opacity={0.5} toneMapped={false} />
          </mesh>
          <Html position={[-2.4 - 0.6, 0, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap rounded-full border border-pink-300/40 bg-[#1a0716]/90 px-2.5 py-1 text-[16px] font-semibold text-pink-200">Agent layer</div>
          </Html>
        </group>
      )}

      {rels.map((rel) => {
        const start = positions.get(rel.source);
        const end = positions.get(rel.target);
        if (!start || !end) return null;
        const curve = curveFor(start, end, rel.id);
        const points = curve.getSpacedPoints(48);
        const isAgentEdge = rel.source.startsWith('agent-');
        const proposed = isProposed(rel, proposals);
        const lit = highlight ? highlight.relIds.has(rel.id) : false;
        const secondary = !lit && Boolean(highlight?.secondaryRelIds?.has(rel.id));
        const selected = selectedRelId === rel.id;
        const baseColor = isAgentEdge ? '#f472b6' : '#94a3b8';
        const color = selected ? '#ffffff' : lit || secondary ? highlight!.color : baseColor;
        const opacity = lit || selected ? 0.95 : secondary ? 0.4 : highlight ? 0.07 : isAgentEdge ? 0.35 : 0.45;
        const light = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.55);
        const dark = new THREE.Color(color).lerp(new THREE.Color('#000000'), 0.35);
        const vertexColors = points.map((_, i) => light.clone().lerp(dark, i / (points.length - 1)).toArray() as [number, number, number]);
        const showRelLabel = selected || (lit && showLabels && highlight!.relIds.size <= 12);
        return (
          <group key={rel.id} onClick={(event) => { event.stopPropagation(); selectRel(selected ? null : rel.id); }}>
            <Line
              points={points}
              vertexColors={lit || selected ? vertexColors : undefined}
              color={color}
              lineWidth={selected ? 3.6 : lit ? 2.6 : 1.2}
              transparent
              opacity={opacity}
              dashed={isAgentEdge || proposed}
              dashSize={0.12}
              gapSize={0.08}
              depthWrite={false}
            />
            <Line points={points} color="#ffffff" lineWidth={10} transparent opacity={0} depthWrite={false} />
            {lit && <FlowPulse curve={curve} color={highlight!.color} />}
            {showRelLabel && (
              <Html position={curve.getPoint(0.5)} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                <div className="whitespace-nowrap rounded-full border border-white/15 bg-black/80 px-1.5 py-0.5 font-mono text-[11px] text-slate-200">{rel.type}</div>
              </Html>
            )}
          </group>
        );
      })}

      {nodes.map((node) => {
        const position = positions.get(node.id);
        if (!position) return null;
        const lit = highlight ? highlight.nodeIds.has(node.id) : false;
        const secondary = !lit && Boolean(highlight?.secondaryNodeIds?.has(node.id));
        return (
          <GraphNodeMesh
            key={node.id}
            node={node}
            position={position}
            dimmed={Boolean(highlight) && !lit && !secondary}
            secondary={secondary}
            highlighted={lit}
            highlightColor={highlight?.color ?? '#ffffff'}
            proposed={isProposed(node, proposals)}
          />
        );
      })}
    </group>
  );
}
