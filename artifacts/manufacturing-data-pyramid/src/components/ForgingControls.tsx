import React, { useMemo, useState } from 'react';
import {
  BoxSelect,
  Check,
  Eye,
  EyeOff,
  Layers3,
  Maximize2,
  Merge,
  Minimize2,
  MonitorPlay,
  Plus,
  SlidersHorizontal,
  Split,
  X,
} from 'lucide-react';
import { useStore } from '../store';
import { FORGING_LEVELS, FORGING_SECTOR_COLORS, FORGING_SECTOR_LABELS, ForgingSector } from '../data';

const SECTORS: ForgingSector[] = ['product', 'machine', 'process', 'resources'];

export function ForgingControls() {
  const {
    forgingObjects,
    forgingLoops,
    forgingExploded,
    setForgingExploded,
    forgingCutaway,
    setForgingCutaway,
    forgingSectionLevel,
    setForgingSectionLevel,
    forgingSeparateSectors,
    setForgingSeparateSectors,
    forgingShowLabels,
    setForgingShowLabels,
    forgingPyramidOpacity,
    setForgingPyramidOpacity,
    toggleForgingLoop,
    createForgingLoop,
    addForgingConnection,
    exitForgingCaseStudy,
    presentationMode,
    setPresentationMode,
  } = useStore();
  const [legendOpen, setLegendOpen] = useState(true);
  const [loopEditorOpen, setLoopEditorOpen] = useState(false);
  const [loopName, setLoopName] = useState('');
  const [loopColor, setLoopColor] = useState('#facc15');
  const [selectedLoopId, setSelectedLoopId] = useState(forgingLoops[0]?.id ?? '');
  const [sourceId, setSourceId] = useState(forgingObjects[0]?.id ?? '');
  const [targetId, setTargetId] = useState(forgingObjects[1]?.id ?? '');

  const levelOptions = useMemo(
    () => FORGING_LEVELS.map((level) => ({ id: level.id, label: `L${level.id - 1}` })),
    [],
  );

  const addConnection = (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;
    if (selectedLoopId) {
      addForgingConnection(selectedLoopId, sourceId, targetId);
    } else {
      createForgingLoop(loopName, loopColor, sourceId, targetId);
      setLoopName('');
    }
    setLoopEditorOpen(false);
  };

  const openNewLoop = () => {
    setSelectedLoopId('');
    setLoopName('');
    setLoopColor('#facc15');
    setLoopEditorOpen(true);
  };

  return (
    <div className="pointer-events-auto absolute bottom-4 md:bottom-8 left-1/2 z-30 flex w-[96vw] -translate-x-1/2 flex-col items-center gap-2 md:w-auto">
      <div className="flex max-w-[96vw] flex-wrap items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-[#071018]/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
        <div className="mr-1 flex items-center gap-2 text-left">
          <div className="rounded-md bg-cyan-300/10 p-1.5 text-cyan-200"><Layers3 size={15} /></div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-100">Forging Case Study</div>
            <div className="text-[9px] text-muted-foreground">Five levels · four sectors · two loops</div>
          </div>
        </div>
        <span className="h-6 w-px bg-white/15" />
        <button
          onClick={() => setForgingExploded(!forgingExploded)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold ${forgingExploded ? 'bg-cyan-300/15 text-cyan-100' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
        >
          {forgingExploded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {forgingExploded ? 'Assemble Levels' : 'Explode Levels'}
        </button>
        <button
          onClick={() => setForgingSeparateSectors(!forgingSeparateSectors)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold ${forgingSeparateSectors ? 'bg-cyan-300/15 text-cyan-100' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
        >
          {forgingSeparateSectors ? <Merge size={13} /> : <Split size={13} />}
          {forgingSeparateSectors ? 'Assemble Sectors' : 'Separate Sectors'}
        </button>
        <button
          onClick={() => setForgingCutaway(!forgingCutaway)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold ${forgingCutaway ? 'bg-cyan-300/15 text-cyan-100' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
        >
          <BoxSelect size={13} /> Section
        </button>
        {forgingCutaway && (
          <div className="flex items-center gap-1">
            {levelOptions.map((level) => (
              <button
                key={level.id}
                onClick={() => setForgingSectionLevel(level.id)}
                className={`h-6 w-6 rounded text-[9px] font-mono ${forgingSectionLevel === level.id ? 'bg-cyan-300 text-slate-950' : 'bg-white/10 text-muted-foreground hover:text-foreground'}`}
              >
                {level.label}
              </button>
            ))}
          </div>
        )}
        <span className="h-6 w-px bg-white/15" />
        <button
          onClick={() => setLoopEditorOpen(!loopEditorOpen)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold ${loopEditorOpen ? 'bg-amber-300/15 text-amber-100' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
        >
          <Plus size={13} /> Add Connection
        </button>
        <button
          onClick={() => setLegendOpen(!legendOpen)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          {legendOpen ? <EyeOff size={13} /> : <Eye size={13} />} Legend
        </button>
        <button
          onClick={() => setForgingShowLabels(!forgingShowLabels)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold ${forgingShowLabels ? 'text-cyan-200' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {forgingShowLabels ? <Eye size={13} /> : <EyeOff size={13} />} Labels
        </button>
        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground" title="Case study pyramid opacity">
          <SlidersHorizontal size={13} />
          <input
            aria-label="Forging pyramid surface opacity"
            type="range"
            min="0.18"
            max="1"
            step="0.01"
            value={forgingPyramidOpacity}
            onChange={(event) => setForgingPyramidOpacity(Number(event.target.value))}
            className="h-1 w-16 accent-cyan-400"
          />
        </label>
        <button
          onClick={() => setPresentationMode(!presentationMode)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          <MonitorPlay size={13} /> {presentationMode ? 'Exit Presentation' : 'Presentation'}
        </button>
        <button
          onClick={exitForgingCaseStudy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold text-rose-200 hover:bg-rose-300/10"
        >
          <X size={13} /> Exit Case Study
        </button>
      </div>

      {legendOpen && (
        <div className="flex max-w-[96vw] flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-lg border border-white/10 bg-[#071018]/85 px-3 py-2 text-[9px] shadow-xl backdrop-blur-xl">
          {SECTORS.map((sector) => (
            <span key={sector} className="flex items-center gap-1 text-white/70">
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: FORGING_SECTOR_COLORS[sector] }} />
              {FORGING_SECTOR_LABELS[sector]}
            </span>
          ))}
          <span className="mx-1 h-3 w-px bg-white/15" />
          {forgingLoops.map((loop) => (
            <button
              key={loop.id}
              onClick={() => toggleForgingLoop(loop.id)}
              className={`flex items-center gap-1 transition-colors ${loop.visible ? 'text-white/80' : 'text-white/30 line-through'}`}
              title={loop.visible ? `Hide ${loop.name}` : `Show ${loop.name}`}
            >
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: loop.color }} />
              {loop.name}
            </button>
          ))}
        </div>
      )}

      {loopEditorOpen && (
        <form
          onSubmit={addConnection}
          className="absolute bottom-full mb-2 grid w-[min(94vw,42rem)] grid-cols-1 gap-2 rounded-lg border border-amber-300/25 bg-[#071018]/95 p-3 text-xs shadow-2xl backdrop-blur-xl md:grid-cols-2"
        >
          <div className="md:col-span-2 flex items-center justify-between">
            <div>
              <div className="font-semibold text-amber-100">{selectedLoopId ? 'Add Connection to Loop' : 'New Loop'}</div>
              <div className="text-[10px] text-muted-foreground">Choose source and target elements locally.</div>
            </div>
            <button type="button" onClick={() => setLoopEditorOpen(false)} className="p-1 text-muted-foreground hover:text-foreground"><X size={15} /></button>
          </div>
          <select value={selectedLoopId} onChange={(event) => setSelectedLoopId(event.target.value)} className="rounded border border-white/10 bg-black/30 px-2 py-2 text-foreground">
            <option value="">Create a new loop…</option>
            {forgingLoops.map((loop) => <option key={loop.id} value={loop.id}>{loop.name}</option>)}
          </select>
          {!selectedLoopId ? (
            <div className="flex gap-2">
              <input value={loopName} onChange={(event) => setLoopName(event.target.value)} placeholder="Loop name" required className="min-w-0 flex-1 rounded border border-white/10 bg-black/30 px-2 py-2 text-foreground outline-none" />
              <input aria-label="Loop colour" type="color" value={loopColor} onChange={(event) => setLoopColor(event.target.value)} className="h-9 w-11 rounded border border-white/10 bg-black/30 p-1" />
            </div>
          ) : (
            <div className="rounded border border-white/10 bg-black/20 px-2 py-2 text-[10px] text-muted-foreground">
              New connections inherit the selected loop colour.
            </div>
          )}
          <select value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="rounded border border-white/10 bg-black/30 px-2 py-2 text-foreground">
            {forgingObjects.map((object) => <option key={object.id} value={object.id}>From · {object.name}</option>)}
          </select>
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="rounded border border-white/10 bg-black/30 px-2 py-2 text-foreground">
            {forgingObjects.map((object) => <option key={object.id} value={object.id}>To · {object.name}</option>)}
          </select>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="flex items-center gap-1.5 rounded bg-amber-300 px-3 py-2 text-[10px] font-bold text-slate-950 hover:bg-amber-200">
              <Check size={13} /> {selectedLoopId ? 'Add Connection' : 'Create Loop'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}