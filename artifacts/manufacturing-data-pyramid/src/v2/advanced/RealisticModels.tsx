import React from 'react';
import type { GraphNode } from './graphTypes';

// Low-poly stand-ins for what each node actually is, built from primitives (no model files).
// Each fits roughly a 0.45-unit box centred on the origin. `m` supplies the shared material props.
export type MaterialFn = (color: string, extra?: { emissive?: boolean }) => Record<string, unknown>;
type ModelProps = { accent: string; m: MaterialFn };

const METAL = '#94a3b8';
const DARK = '#334155';
const PAPER = '#e2e8f0';

function CNC({ accent, m }: ModelProps) {
  return (
    <group position={[0, -0.12, 0]}>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.46, 0.08, 0.3]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[-0.14, 0.2, 0]}><boxGeometry args={[0.1, 0.26, 0.22]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0.02, 0.3, 0]}><boxGeometry args={[0.28, 0.07, 0.12]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0.1, 0.2, 0]}><cylinderGeometry args={[0.025, 0.025, 0.14, 10]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      <mesh position={[0.1, 0.1, 0]}><boxGeometry args={[0.16, 0.03, 0.16]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[0.21, 0.2, 0.12]}><boxGeometry args={[0.06, 0.08, 0.01]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
    </group>
  );
}

function Press({ accent, m }: ModelProps) {
  return (
    <group position={[0, -0.14, 0]}>
      <mesh position={[0, 0.03, 0]}><boxGeometry args={[0.36, 0.06, 0.26]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]}><boxGeometry args={[0.06, 0.34, 0.2]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      ))}
      <mesh position={[0, 0.39, 0]}><boxGeometry args={[0.36, 0.06, 0.24]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0, 0.26, 0]}><boxGeometry args={[0.2, 0.08, 0.16]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      <mesh position={[0, 0.09, 0]}><boxGeometry args={[0.18, 0.05, 0.14]} /><meshStandardMaterial {...m(METAL)} /></mesh>
    </group>
  );
}

function RobotArm({ accent, m }: ModelProps) {
  return (
    <group position={[0, -0.16, 0]}>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.12, 0.14, 0.06, 16]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0, 0.16, 0]} rotation={[0, 0, 0.35]}><cylinderGeometry args={[0.035, 0.035, 0.24, 10]} /><meshStandardMaterial {...m(accent)} /></mesh>
      <mesh position={[-0.04, 0.28, 0]}><sphereGeometry args={[0.045, 12, 10]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[0.06, 0.32, 0]} rotation={[0, 0, -1.1]}><cylinderGeometry args={[0.03, 0.03, 0.22, 10]} /><meshStandardMaterial {...m(accent)} /></mesh>
      <mesh position={[0.16, 0.37, 0]}><boxGeometry args={[0.05, 0.06, 0.06]} /><meshStandardMaterial {...m(METAL)} /></mesh>
    </group>
  );
}

function Sensor({ accent, m }: ModelProps) {
  return (
    <group>
      <mesh position={[0, -0.08, 0]}><cylinderGeometry args={[0.09, 0.1, 0.18, 16]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.1, 0.1, 0.03, 16]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.008, 0.008, 0.18, 6]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0, 0.23, 0]}><sphereGeometry args={[0.025, 10, 8]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      {[0.12, 0.17].map((r) => (
        <mesh key={r} position={[0, 0.23, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[r * 0.5, 0.006, 6, 20, Math.PI / 1.5]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      ))}
    </group>
  );
}

function Database({ accent, m }: ModelProps) {
  return (
    <group>
      {[-0.13, 0, 0.13].map((y, i) => (
        <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.16, 0.16, 0.1, 20]} /><meshStandardMaterial {...m(i === 2 ? accent : METAL, { emissive: i === 2 })} /></mesh>
      ))}
    </group>
  );
}

function Clipboard({ accent, m, check }: ModelProps & { check?: boolean }) {
  return (
    <group rotation={[-0.25, 0, 0]}>
      <mesh><boxGeometry args={[0.3, 0.38, 0.03]} /><meshStandardMaterial {...m('#8b6b4a')} /></mesh>
      <mesh position={[0, -0.02, 0.018]}><boxGeometry args={[0.25, 0.3, 0.01]} /><meshStandardMaterial {...m(PAPER)} /></mesh>
      <mesh position={[0, 0.18, 0.025]}><boxGeometry args={[0.12, 0.05, 0.02]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      {check ? (
        <group position={[0, -0.03, 0.03]}>
          <mesh position={[-0.04, -0.02, 0]} rotation={[0, 0, 0.8]}><boxGeometry args={[0.08, 0.025, 0.01]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
          <mesh position={[0.04, 0.02, 0]} rotation={[0, 0, -0.9]}><boxGeometry args={[0.15, 0.025, 0.01]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
        </group>
      ) : [0.05, 0, -0.05, -0.1].map((y) => (
        <mesh key={y} position={[0, y, 0.025]}><boxGeometry args={[0.18, 0.018, 0.005]} /><meshStandardMaterial {...m(accent)} /></mesh>
      ))}
    </group>
  );
}

function Document({ accent, m }: ModelProps) {
  return (
    <group rotation={[-0.2, 0.3, 0]}>
      <mesh position={[0.03, -0.02, -0.02]}><boxGeometry args={[0.28, 0.36, 0.01]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh><boxGeometry args={[0.28, 0.36, 0.01]} /><meshStandardMaterial {...m(PAPER)} /></mesh>
      <mesh position={[0, 0.13, 0.008]}><boxGeometry args={[0.2, 0.035, 0.005]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      {[0.06, 0.02, -0.02, -0.06, -0.1].map((y) => (
        <mesh key={y} position={[0, y, 0.008]}><boxGeometry args={[0.2, 0.012, 0.004]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      ))}
    </group>
  );
}

function Beacon({ accent, m }: ModelProps) {
  return (
    <group>
      <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[0.12, 0.14, 0.08, 16]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0, 0.0, 0]}><sphereGeometry args={[0.12, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      <mesh position={[0, -0.04, 0]}><cylinderGeometry args={[0.12, 0.12, 0.08, 16]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
    </group>
  );
}

function Gauge({ accent, m }: ModelProps) {
  return (
    <group rotation={[-0.3, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.04, 28]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0, 0, 0.022]}><torusGeometry args={[0.15, 0.022, 8, 28, Math.PI]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      <mesh position={[0.04, 0.05, 0.03]} rotation={[0, 0, -0.75]}><boxGeometry args={[0.015, 0.15, 0.01]} /><meshStandardMaterial {...m(PAPER)} /></mesh>
      <mesh position={[0, 0, 0.03]}><cylinderGeometry args={[0.02, 0.02, 0.02, 10]} /><meshStandardMaterial {...m(PAPER)} /></mesh>
    </group>
  );
}

function BarChart({ accent, m }: ModelProps) {
  return (
    <group position={[0, -0.16, 0]}>
      <mesh position={[0, 0.01, 0]}><boxGeometry args={[0.38, 0.02, 0.16]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      {[0.12, 0.2, 0.3].map((h, i) => (
        <mesh key={h} position={[-0.11 + i * 0.11, 0.02 + h / 2, 0]}><boxGeometry args={[0.07, h, 0.08]} /><meshStandardMaterial {...m(i === 2 ? accent : METAL, { emissive: i === 2 })} /></mesh>
      ))}
    </group>
  );
}

function Magnifier({ accent, m }: ModelProps) {
  return (
    <group rotation={[0, 0, -0.6]}>
      <mesh position={[0, 0.06, 0]}><torusGeometry args={[0.11, 0.025, 10, 28]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[0, 0.06, 0]}><circleGeometry args={[0.1, 24]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      <mesh position={[0, -0.13, 0]}><cylinderGeometry args={[0.025, 0.03, 0.18, 10]} /><meshStandardMaterial {...m(DARK)} /></mesh>
    </group>
  );
}

function Chip({ accent, m }: ModelProps) {
  return (
    <group>
      <mesh><boxGeometry args={[0.26, 0.05, 0.26]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0, 0.03, 0]}><boxGeometry args={[0.14, 0.02, 0.14]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      {[-0.08, 0, 0.08].flatMap((offset) => [
        <mesh key={`x${offset}`} position={[0.15, -0.01, offset]}><boxGeometry args={[0.05, 0.015, 0.025]} /><meshStandardMaterial {...m(METAL)} /></mesh>,
        <mesh key={`-x${offset}`} position={[-0.15, -0.01, offset]}><boxGeometry args={[0.05, 0.015, 0.025]} /><meshStandardMaterial {...m(METAL)} /></mesh>,
        <mesh key={`z${offset}`} position={[offset, -0.01, 0.15]}><boxGeometry args={[0.025, 0.015, 0.05]} /><meshStandardMaterial {...m(METAL)} /></mesh>,
        <mesh key={`-z${offset}`} position={[offset, -0.01, -0.15]}><boxGeometry args={[0.025, 0.015, 0.05]} /><meshStandardMaterial {...m(METAL)} /></mesh>,
      ])}
    </group>
  );
}

function Wrench({ accent, m }: ModelProps) {
  return (
    <group rotation={[0, 0, 0.7]}>
      <mesh position={[0, -0.05, 0]}><boxGeometry args={[0.05, 0.3, 0.03]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[0, 0.13, 0]}><torusGeometry args={[0.065, 0.025, 8, 20, Math.PI * 1.5]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[0, -0.16, 0]}><boxGeometry args={[0.06, 0.08, 0.035]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
    </group>
  );
}

function Flag({ accent, m }: ModelProps) {
  return (
    <group position={[-0.06, -0.02, 0]}>
      <mesh><cylinderGeometry args={[0.012, 0.012, 0.44, 8]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[0.1, 0.13, 0]}><boxGeometry args={[0.2, 0.13, 0.008]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      <mesh position={[0, -0.22, 0]}><cylinderGeometry args={[0.07, 0.08, 0.03, 14]} /><meshStandardMaterial {...m(DARK)} /></mesh>
    </group>
  );
}

function Person({ accent, m }: ModelProps) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}><sphereGeometry args={[0.075, 16, 12]} /><meshStandardMaterial {...m('#f1c7a5')} /></mesh>
      <mesh position={[0, -0.05, 0]}><capsuleGeometry args={[0.085, 0.14, 4, 12]} /><meshStandardMaterial {...m(accent === '#e2e8f0' ? '#475569' : accent)} /></mesh>
      <mesh position={[0, 0.02, 0.08]}><boxGeometry args={[0.03, 0.06, 0.01]} /><meshStandardMaterial {...m(PAPER)} /></mesh>
    </group>
  );
}

function RobotHead({ accent, m }: ModelProps) {
  return (
    <group>
      <mesh><boxGeometry args={[0.3, 0.24, 0.24]} /><meshStandardMaterial {...m(PAPER)} /></mesh>
      <mesh position={[0, 0, 0.121]}><boxGeometry args={[0.24, 0.13, 0.005]} /><meshStandardMaterial {...m('#0f172a')} /></mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.005, 0.126]}><sphereGeometry args={[0.025, 10, 8]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      ))}
      <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.008, 0.008, 0.1, 6]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[0, 0.23, 0]}><sphereGeometry args={[0.025, 10, 8]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      {[-0.165, 0.165].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 0.03, 12]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      ))}
    </group>
  );
}

function Ingots({ accent, m }: ModelProps) {
  return (
    <group position={[0, -0.08, 0]}>
      {[[-0.08, 0], [0.08, 0], [0, 0.07]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]}><boxGeometry args={[0.15, 0.065, 0.3]} /><meshStandardMaterial {...m(i === 2 ? accent : METAL, { emissive: i === 2 })} /></mesh>
      ))}
    </group>
  );
}

function HolePlate({ accent, m }: ModelProps) {
  return (
    <group rotation={[0.5, 0, 0]}>
      <mesh><boxGeometry args={[0.34, 0.05, 0.26]} /><meshStandardMaterial {...m(METAL)} /></mesh>
      <mesh position={[0, 0.026, 0]}><cylinderGeometry args={[0.05, 0.05, 0.005, 20]} /><meshStandardMaterial {...m('#020617')} /></mesh>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.065, 0.01, 6, 24]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
    </group>
  );
}

function Clock({ accent, m }: ModelProps) {
  return (
    <group rotation={[-0.2, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 0.04, 28]} /><meshStandardMaterial {...m(PAPER)} /></mesh>
      <mesh position={[0, 0, 0.0]} ><torusGeometry args={[0.18, 0.02, 8, 28]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
      <mesh position={[0, 0.05, 0.025]}><boxGeometry args={[0.015, 0.1, 0.01]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0.035, 0, 0.025]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.015, 0.07, 0.01]} /><meshStandardMaterial {...m(DARK)} /></mesh>
    </group>
  );
}

function Spoiler({ accent, m }: ModelProps) {
  return (
    <group position={[0, -0.06, 0]}>
      <mesh position={[0, 0.12, 0]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.46, 0.025, 0.12]} /><meshStandardMaterial {...m(accent)} /></mesh>
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, 0.04, 0]}><boxGeometry args={[0.025, 0.14, 0.07]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      ))}
      <mesh position={[0, -0.04, 0]}><boxGeometry args={[0.46, 0.03, 0.14]} /><meshStandardMaterial {...m(METAL)} /></mesh>
    </group>
  );
}

function Briefcase({ accent, m }: ModelProps) {
  return (
    <group>
      <mesh position={[0, -0.04, 0]}><boxGeometry args={[0.34, 0.24, 0.12]} /><meshStandardMaterial {...m('#7c4a2d')} /></mesh>
      <mesh position={[0, 0.1, 0]}><torusGeometry args={[0.06, 0.015, 6, 16, Math.PI]} /><meshStandardMaterial {...m(DARK)} /></mesh>
      <mesh position={[0, -0.02, 0.062]}><boxGeometry args={[0.06, 0.04, 0.01]} /><meshStandardMaterial {...m(accent, { emissive: true })} /></mesh>
    </group>
  );
}

export function RealisticModel({ node, accent, m }: { node: GraphNode; accent: string; m: MaterialFn }) {
  const name = node.name.toLowerCase();
  const props = { accent, m };
  switch (node.label) {
    case 'Machine':
      if (name.includes('press')) return <Press {...props} />;
      if (name.includes('robot')) return <RobotArm {...props} />;
      return <CNC {...props} />;
    case 'DataStream': return <Sensor {...props} />;
    case 'Dataset': return <Database {...props} />;
    case 'Inspection':
    case 'FollowUp': return <Clipboard {...props} />;
    case 'Plan':
    case 'Decision': return <Clipboard {...props} check />;
    case 'Event': return <Beacon {...props} />;
    case 'KPI': return <Gauge {...props} />;
    case 'Summary': return <BarChart {...props} />;
    case 'Report': return <Document {...props} />;
    case 'Finding': return <Magnifier {...props} />;
    case 'AnalysisModel': return <Chip {...props} />;
    case 'Action': return <Wrench {...props} />;
    case 'Outcome': return <Flag {...props} />;
    case 'Role': return <Person {...props} />;
    case 'Agent': return <RobotHead {...props} />;
    case 'Material': return <Ingots {...props} />;
    case 'Hole': return <HolePlate {...props} />;
    case 'MachiningVisit': return <Clock {...props} />;
    case 'Asset': return <Spoiler {...props} />;
    case 'Project': return <Briefcase {...props} />;
  }
  // Fallback by kind, for labels added later.
  switch (node.kind) {
    case 'context': return <CNC {...props} />;
    case 'evidence': return <Database {...props} />;
    case 'event': return <Beacon {...props} />;
    case 'summary': return <BarChart {...props} />;
    case 'finding': return <Magnifier {...props} />;
    case 'model': return <Chip {...props} />;
    case 'decision': return <Clipboard {...props} check />;
    case 'outcome': return <Flag {...props} />;
    case 'person': return <Person {...props} />;
    case 'agent': return <RobotHead {...props} />;
  }
}
