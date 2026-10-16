import React from 'react';
import { useV2Store } from '../store';
import { Rocket, GraduationCap, Map } from 'lucide-react';

export function ModeSelector() {
  const { mode, setMode } = useV2Store();

  return (
    <div className="absolute top-4 left-4 z-50 flex gap-1 p-1.5 bg-[#050508]/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl pointer-events-auto">
      <button
        onClick={() => setMode('explorer')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
          mode === 'explorer'
            ? 'bg-cyan-400/20 text-cyan-200 shadow-sm'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        }`}
      >
        <Map size={14} /> Explorer
      </button>
      <button
        onClick={() => setMode('walkthrough')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
          mode === 'walkthrough'
            ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        }`}
      >
        <GraduationCap size={14} /> Walkthrough
      </button>
      <button
        onClick={() => setMode('advanced')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
          mode === 'advanced'
            ? 'bg-fuchsia-500/20 text-fuchsia-200 shadow-sm'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        }`}
        title="Knowledge graph prototype"
      >
        <Rocket size={14} /> Advanced
      </button>
    </div>
  );
}
