import { Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, Check, ChevronLeft, ChevronRight, Database, Edit2, Eye, EyeOff, FolderOpen, Lock, Wand2, GraduationCap, Grid3X3, Link2, Save, SkipForward, Trash2, Move, Maximize2, Minimize2, RotateCcw, X, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useV2Store, EMPTY_DATA_DRAFT, getWalkthroughLevelName, getWalkthroughSectorName, LOOP_COLOR_PALETTE, type V2DataDensity, type V2DataDraft, type V2LoopDraft, type V2MetadataPatch } from '../store';
import { getSectorIdForGridCell } from '../geometry';
import { jsonStructurallyEqual } from '../jsonStructuralEquality';
import { getVisibleV2ObjectIds } from '../visibility';
import { V2CrossSection } from './V2CrossSection';
import { SavedProjectBrowser } from './SavedProjectBrowser';

const STAGES = ['Structure', 'Data', 'Visualise', 'Connections', 'Save'];

function Progress({ currentStage, completedStages = [] }: { currentStage: number; completedStages?: number[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-white/5 bg-black/25 px-5 py-3 [&::-webkit-scrollbar]:hidden">
      {STAGES.map((stage, idx) => {
        const active = idx === currentStage && !completedStages.includes(idx);
        const past = completedStages.includes(idx) || idx < currentStage;
        return (
          <div key={stage} className={`flex shrink-0 items-center gap-1.5 text-[11px] font-semibold ${active ? 'text-indigo-300' : past ? 'text-emerald-300' : 'text-muted-foreground'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? 'border-indigo-300 bg-indigo-400/20' : past ? 'border-emerald-300 bg-emerald-400/20' : 'border-white/10 bg-black/40'}`}>
              {past ? <Check size={11} /> : idx > 0 && !active ? <Lock size={10} /> : idx + 1}
            </span>
            <span>{stage}</span>
            {idx < STAGES.length - 1 && <ChevronRight size={13} className="text-white/15" />}
          </div>
        );
      })}
    </div>
  );
}

function RestartWalkthroughButton({ compact = false }: { compact?: boolean }) {
  const restartWalkthrough = useV2Store((state) => state.restartWalkthrough);
  const restart = () => {
    if (window.confirm('Restart Walkthrough?\n\nThis will clear the current Walkthrough structure, data, loops and progress and return to Stage 1. Explorer and other app modes will not be affected.')) {
      restartWalkthrough();
    }
  };
  return (
    <button
      onClick={restart}
      title="Restart Walkthrough"
      aria-label="Restart Walkthrough"
      className={compact
        ? 'flex h-9 w-9 items-center justify-center rounded border border-rose-300/25 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20'
        : 'flex items-center gap-1.5 rounded border border-rose-300/25 bg-rose-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-rose-100 hover:bg-rose-400/20'}
    >
      <RotateCcw size={compact ? 14 : 12} />
      {!compact && 'Restart Walkthrough'}
    </button>
  );
}

function OpenProjectButton({ compact = false }: { compact?: boolean }) {
  const setProjectBrowserOpen = useV2Store((state) => state.setProjectBrowserOpen);
  return (
    <button
      onClick={() => setProjectBrowserOpen(true)}
      title="Open Project"
      aria-label="Open Project"
      className={compact
        ? 'flex h-9 w-9 items-center justify-center rounded border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'
        : 'flex items-center gap-1.5 rounded border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-300/20'}
    >
      <FolderOpen size={compact ? 14 : 12} />
      {!compact && 'Open Project'}
    </button>
  );
}

function FitWalkthroughViewButton({ compact = false }: { compact?: boolean }) {
  const fitWalkthroughView = useV2Store((state) => state.fitWalkthroughView);
  return (
    <button
      onClick={fitWalkthroughView}
      title="Fit 3D View"
      aria-label="Fit 3D View"
      className={compact
        ? 'flex h-9 w-9 items-center justify-center rounded border border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'
        : 'flex items-center gap-1.5 rounded border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-300/20'}
    >
      <Maximize2 size={compact ? 14 : 12} />
      {!compact && 'Fit 3D View'}
    </button>
  );
}

function CollapsedWalkthroughRail({ embedded = false, showFit = true }: { embedded?: boolean; showFit?: boolean }) {
  return (
    <aside className={`pointer-events-auto flex min-h-0 w-11 flex-col items-center gap-2 rounded-xl border border-indigo-400/20 bg-[#070b14]/95 py-3 shadow-2xl backdrop-blur-xl ${embedded ? 'relative h-full' : 'absolute inset-y-4 right-4 z-20 md:inset-y-6 md:right-6'}`}>
      <button
        onClick={() => useV2Store.getState().setWalkthroughPanelCollapsed(false)}
        title="Expand Walkthrough panel"
        aria-label="Expand Walkthrough panel"
        className="flex h-9 w-9 items-center justify-center rounded border border-indigo-300/25 bg-indigo-300/10 text-indigo-100 hover:bg-indigo-300/20"
      >
        <PanelRightOpen size={15} />
      </button>
      {showFit && <FitWalkthroughViewButton compact />}
      <OpenProjectButton compact />
      <RestartWalkthroughButton compact />
      <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-semibold uppercase tracking-[0.16em] text-indigo-200/70">Walkthrough</span>
    </aside>
  );
}

function StructureStage() {
  const {
    draft, setDraftLevels, setDraftSectors, confirmStructure, activeCase,
    reopenStructure, autoFillLevelNames, setAutoFillLevelNames, isEditingStructure,
    setWalkthroughStage, showV2Labels, setShowV2Labels,
  } = useV2Store();
  const confirmed = activeCase !== null && !isEditingStructure;

  const autoFillSectors = () => setDraftSectors(
    draft.sectors.map((sector, index) => ({ id: sector.id, name: getWalkthroughSectorName(index) })),
  );

  const updateLevelCount = (nextCount: number) => {
    if (nextCount < 1 || nextCount > 8) return;
    const next = Array.from({ length: nextCount }, (_, index) => draft.levels[index] || { name: getWalkthroughLevelName(index, nextCount) });
    setDraftLevels(autoFillLevelNames
      ? next.map((level, index) => ({ ...level, name: getWalkthroughLevelName(index, nextCount) }))
      : next);
  };

  const updateSectorCount = (nextCount: number) => {
    if (nextCount < 2 || nextCount > 8) return;
    setDraftSectors(Array.from({ length: nextCount }, (_, index) => draft.sectors[index] || { name: getWalkthroughSectorName(index) }));
  };

  if (confirmed) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300"><Check size={19} /></div>
            <div>
              <h3 className="font-bold text-emerald-100">Structure confirmed</h3>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100/65">Your frame is ready. Review the configured names below or revise before adding data.</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Configured frame</h3>
            <button onClick={reopenStructure} className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"><Edit2 size={12} /> Revise</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Levels</p>
              <ol className="space-y-1 text-sm text-foreground">{activeCase.levels.map((level) => <li key={level.id} className="flex gap-2"><span className="font-mono text-indigo-300/70">L{level.index + 1}</span>{level.name}</li>)}</ol>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Sectors</p>
              <ol className="space-y-1 text-sm text-foreground">{activeCase.sectors.map((sector) => <li key={sector.id} className="flex gap-2"><span className="font-mono text-indigo-300/70">S{sector.index + 1}</span>{sector.name}</li>)}</ol>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-indigo-400/15 bg-indigo-400/5 p-4">
          <p className="text-xs leading-relaxed text-indigo-100/70">Data is the active next stage. Use the level board to add items to the 8×8 sector-aware snap grid.</p>
        </div>
        <button onClick={() => setShowV2Labels(!showV2Labels)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground">
          {showV2Labels ? <EyeOff size={14} /> : <Eye size={14} />}
          {showV2Labels ? 'Hide pyramid labels' : 'Show pyramid labels'}
        </button>
        <button onClick={() => setWalkthroughStage('data')} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300">Continue to Data <ChevronRight size={17} /></button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Define the structural frame</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Choose the vertical levels and horizontal sectors that will shape this case.</p>
      </div>
      <div className="rounded-lg border border-indigo-400/20 bg-indigo-400/5 p-3 text-xs leading-relaxed text-indigo-100/70">
        Level and sector IDs stay stable when you revise without changing their position. The default 8×8 placement grid is created when you confirm.
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-indigo-100">Vertical levels <span className="font-mono text-indigo-300/70">{draft.levels.length}</span></label>
          <div className="flex gap-1 rounded border border-white/10 bg-black/40 p-1">
            <button aria-label="Remove level" onClick={() => updateLevelCount(draft.levels.length - 1)} disabled={draft.levels.length <= 1} className="h-6 w-6 rounded bg-white/5 text-lg leading-none hover:bg-white/10 disabled:opacity-30">−</button>
            <button aria-label="Add level" onClick={() => updateLevelCount(draft.levels.length + 1)} disabled={draft.levels.length >= 8} className="h-6 w-6 rounded bg-white/5 text-lg leading-none hover:bg-white/10 disabled:opacity-30">+</button>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={autoFillLevelNames} onChange={(event) => setAutoFillLevelNames(event.target.checked)} className="accent-indigo-400" />
          Auto-fill level names
          <span className="text-muted-foreground/60">({autoFillLevelNames ? draft.levels.length === 5 ? 'manufacturing preset' : 'Level 1…N' : 'manual'})</span>
        </label>
        <div className="space-y-2">
          {draft.levels.map((level, index) => (
            <label key={level.id || index} className="relative block">
              <span className="absolute left-3 top-2.5 font-mono text-[10px] text-indigo-300/55">L{index + 1}</span>
              <input value={level.name} onChange={(event) => setDraftLevels(draft.levels.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} className="w-full rounded-md border border-white/10 bg-black/35 py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-indigo-400/60" placeholder={`Level ${index + 1}`} />
            </label>
          ))}
        </div>
      </section>
      <section className="space-y-3 border-t border-white/5 pt-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-indigo-100">Sectors / edges <span className="font-mono text-indigo-300/70">{draft.sectors.length}</span></label>
          <div className="flex gap-1 rounded border border-white/10 bg-black/40 p-1">
            <button aria-label="Remove sector" onClick={() => updateSectorCount(draft.sectors.length - 1)} disabled={draft.sectors.length <= 3} className="h-6 w-6 rounded bg-white/5 text-lg leading-none hover:bg-white/10 disabled:opacity-30">−</button>
            <button aria-label="Add sector" onClick={() => updateSectorCount(draft.sectors.length + 1)} disabled={draft.sectors.length >= 8} className="h-6 w-6 rounded bg-white/5 text-lg leading-none hover:bg-white/10 disabled:opacity-30">+</button>
          </div>
        </div>
        <button onClick={autoFillSectors} className="flex w-full items-center justify-center gap-2 rounded-md border border-indigo-400/25 bg-indigo-400/10 py-2 text-xs font-semibold text-indigo-200 transition-colors hover:bg-indigo-400/20"><Wand2 size={13} /> Auto-fill sector names <span className="font-normal text-indigo-200/55">({draft.sectors.length === 4 ? 'manufacturing preset' : 'neutral'})</span></button>
        <div className="grid grid-cols-2 gap-2">
          {draft.sectors.map((sector, index) => <input key={sector.id || index} value={sector.name} onChange={(event) => setDraftSectors(draft.sectors.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} className="w-full rounded-md border border-white/10 bg-black/35 px-3 py-2.5 text-center text-sm text-foreground outline-none transition-colors focus:border-indigo-400/60" placeholder={`Sector ${index + 1}`} />)}
        </div>
      </section>
      <button onClick={confirmStructure} disabled={draft.levels.some((level) => !level.name.trim()) || draft.sectors.some((sector) => !sector.name.trim())} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">Confirm Structure <Check size={17} /></button>
    </div>
  );
}

function Field({ label, value, onChange, multiline = false, required = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; required?: boolean }) {
  const shared = { value, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), required, className: 'mt-1 w-full rounded border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-foreground outline-none focus:border-cyan-300/60' };
  return <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}{multiline ? <textarea {...shared} rows={2} /> : <input {...shared} />}</label>;
}

function DataEditor({ levelId, sectorId, gridX, gridY, onClose, onCancel }: { levelId: string; sectorId: string; gridX: number; gridY: number; onClose: () => void; onCancel: () => void }) {
  const addDataObject = useV2Store((state) => state.addDataObject);
  const [draft, setDraft] = useState<V2DataDraft>(EMPTY_DATA_DRAFT);
  const update = (key: keyof V2DataDraft) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    addDataObject({ ...draft, name: draft.name.trim() }, levelId, sectorId, gridX, gridY);
    onClose();
  };
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#03050b]/75 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[90%] w-full max-w-2xl overflow-y-auto rounded-xl border border-cyan-300/20 bg-[#08111d] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between"><div><h3 className="text-lg font-bold text-cyan-100">Add data element</h3><p className="mt-1 text-xs text-muted-foreground">Placed at cell ({gridX + 1}, {gridY + 1}).</p></div><button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" value={draft.name} onChange={update('name')} required />
          <Field label="Availability / status" value={draft.availability} onChange={update('availability')} />
          <Field label="Source / system / device" value={draft.source} onChange={update('source')} />
          <Field label="Protocol" value={draft.protocol} onChange={update('protocol')} />
          <Field label="Format" value={draft.format} onChange={update('format')} />
          <Field label="Data type / signal type" value={draft.data_type} onChange={update('data_type')} />
          <Field label="Frequency / sample rate" value={draft.frequency} onChange={update('frequency')} />
          <Field label="Sensing / settings metadata" value={draft.sensing_settings} onChange={update('sensing_settings')} />
          <Field label="Preprocessing / feature extraction" value={draft.preprocessing} onChange={update('preprocessing')} />
          <Field label="Intended use" value={draft.intended_use} onChange={update('intended_use')} />
          <div className="sm:col-span-2"><Field label="Description" value={draft.description} onChange={update('description')} multiline /></div>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded border border-white/10 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5">Cancel</button><button type="submit" className="rounded bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300">Add to board</button></div>
      </form>
    </div>
  );
}

function DataBoard() {
  const { activeCase, dataLevelIndex, setDataLevelIndex, skippedLevelIds, skipDataLevel, autoFillDataLevel, dataAutoFillNotice, clearDataLevel, moveDataObject, removeDataObject, setWalkthroughStage, reopenStructure, selectedVisualiseObjectId, isWalkthroughPanelCollapsed, setWalkthroughPanelCollapsed } = useV2Store();
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(selectedVisualiseObjectId);
  const [editorCell, setEditorCell] = useState<{ x: number; y: number; sectorId: string } | null>(null);
  const [placementMode, setPlacementMode] = useState<'move' | null>(null);
  useEffect(() => {
    if (selectedVisualiseObjectId) setSelectedObjectId(selectedVisualiseObjectId);
  }, [selectedVisualiseObjectId]);
  if (!activeCase) return null;
  if (isWalkthroughPanelCollapsed) return <CollapsedWalkthroughRail />;
  const level = activeCase.levels[dataLevelIndex] || activeCase.levels[0];
  const objects = activeCase.overlays.data.filter((object) => object.level_id === level.id);
  const selectedObject = objects.find((object) => object.id === selectedObjectId);
  const occupied = new Map(objects.map((object) => [`${object.grid_x}:${object.grid_y}`, object]));
  const sectorIds = activeCase.sectors.map((sector) => sector.id);
  const cells = Array.from({ length: activeCase.grid.width * activeCase.grid.height }, (_, index) => ({ x: index % activeCase.grid.width, y: Math.floor(index / activeCase.grid.width) }));
  const boardSector = (x: number, y: number) => getSectorIdForGridCell(x, y, activeCase.grid.width, activeCase.grid.height, sectorIds);
  const chooseNearestFree = (x: number, y: number) => cells
    .filter((cell) => !occupied.has(`${cell.x}:${cell.y}`))
    .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];

  const placeAt = (x: number, y: number) => {
    const sectorId = boardSector(x, y);
    if (!sectorId) return;
    const current = occupied.get(`${x}:${y}`);
    if (current && current.id !== selectedObjectId) {
      const nearest = chooseNearestFree(x, y);
      if (nearest && window.confirm('This cell is occupied. Move to the nearest free cell?')) placeAt(nearest.x, nearest.y);
      return;
    }
    if (selectedObjectId && placementMode === 'move') {
      const currentObject = objects.find((object) => object.id === selectedObjectId);
      if (!currentObject) return;
      if (currentObject.sector_id !== sectorId && !window.confirm('This cell belongs to another sector. Confirm the sector change?')) return;
      moveDataObject(selectedObjectId, level.id, sectorId, x, y);
      setPlacementMode(null);
      return;
    }
  };
  const closeEditor = () => {
    setEditorCell(null);
    setPlacementMode(null);
  };

  const autoFill = () => autoFillDataLevel(level.id);
  const goNext = () => setDataLevelIndex(Math.min(activeCase.levels.length - 1, dataLevelIndex + 1));
  const goPrevious = () => setDataLevelIndex(Math.max(0, dataLevelIndex - 1));

  return (
    <div
      data-walkthrough-panel
      className="pointer-events-auto absolute inset-y-4 right-4 z-20 flex h-[calc(100dvh-2rem)] w-[min(760px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-cyan-300/20 bg-[#050912]/98 text-foreground shadow-2xl backdrop-blur-xl md:inset-y-6 md:right-6 md:h-[calc(100dvh-3rem)]"
    >
      {editorCell && <DataEditor levelId={level.id} sectorId={editorCell.sectorId} gridX={editorCell.x} gridY={editorCell.y} onClose={closeEditor} onCancel={closeEditor} />}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-cyan-300/15 bg-[#07131f] px-5 py-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">Walkthrough / Data</p><h2 className="mt-1 text-xl font-bold text-cyan-50">Add data to {level.name}</h2><p className="mt-1 text-xs text-muted-foreground">One level at a time · {activeCase.grid.width}×{activeCase.grid.height} sector-aware snap grid</p></div>
         <div className="flex flex-wrap gap-2">
           <OpenProjectButton />
           <RestartWalkthroughButton />
            <FitWalkthroughViewButton />
            <button onClick={() => setWalkthroughPanelCollapsed(true)} title="Collapse Panel" aria-label="Collapse Panel" className="flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"><PanelRightClose size={15} /></button>
          <button onClick={reopenStructure} className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground"><Edit2 size={13} className="mr-1.5 inline" /> Revise structure</button>
          <button onClick={() => setWalkthroughStage('data')} className="rounded border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100">Data stage</button>
        </div>
      </header>
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/5 bg-black/20 px-5 py-3 [&::-webkit-scrollbar]:hidden">
        {activeCase.levels.map((item, index) => <button key={item.id} onClick={() => { setDataLevelIndex(index); setSelectedObjectId(null); setPlacementMode(null); }} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${index === dataLevelIndex ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 text-muted-foreground hover:bg-white/5'}`}>L{index + 1} · {item.name}{skippedLevelIds.includes(item.id) ? ' · skipped' : ''}</button>)}
      </div>
      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="rounded-2xl border border-cyan-300/15 bg-[#07111c] p-4 shadow-2xl md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-cyan-100">Top-down cross-section</p><p className="text-[11px] text-muted-foreground">Click an empty cell to add data. Select an item, then choose Move to reposition it.</p></div><span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-mono text-muted-foreground">{objects.length} placed</span></div>
            <div className="mx-auto grid aspect-square w-full max-w-[620px] grid-cols-8 overflow-hidden rounded-lg border-2 border-cyan-300/30 bg-[#050a12]">
              {cells.map((cell) => {
                const key = `${cell.x}:${cell.y}`;
                const item = occupied.get(key);
                const sectorId = boardSector(cell.x, cell.y);
                const sectorIndex = Math.max(0, sectorIds.indexOf(sectorId || ''));
                const selected = item?.id === selectedObjectId;
                const rightBoundary = cell.x < activeCase.grid.width - 1 && boardSector(cell.x + 1, cell.y) !== sectorId;
                const bottomBoundary = cell.y < activeCase.grid.height - 1 && boardSector(cell.x, cell.y + 1) !== sectorId;
                const selectOrPlace = () => {
                  if (item && !placementMode) {
                    setSelectedObjectId(item.id);
                    return;
                  }
                  if (placementMode === 'move') {
                    placeAt(cell.x, cell.y);
                    return;
                  }
                  if (item || !sectorId) return;
                  setSelectedObjectId(null);
                  setEditorCell({ x: cell.x, y: cell.y, sectorId });
                };
                const cellLabel = `${activeCase.sectors[sectorIndex]?.name || 'Sector'} cell ${cell.x + 1}, ${cell.y + 1}`;
                return <button key={key} type="button" onClick={selectOrPlace} aria-label={item ? `Select ${item.name}, ${cellLabel}` : `Add data at ${cellLabel}`} className={`relative min-h-[42px] cursor-pointer border border-white/10 p-1 text-left transition-colors ${rightBoundary ? 'border-r-cyan-200/50' : ''} ${bottomBoundary ? 'border-b-cyan-200/50' : ''} ${item ? selected ? 'bg-cyan-300/35 ring-2 ring-inset ring-cyan-200' : 'bg-amber-300/20' : 'bg-emerald-300/[0.04] hover:bg-cyan-300/15'}`} title={cellLabel}>
                  <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'][sectorIndex % 8] }} />
                  {item && <span className="mt-1 block truncate text-[9px] font-bold text-amber-50">{item.name}</span>}
                </button>;
              })}
            </div>
            <div className="mx-auto mt-3 flex max-w-[620px] flex-wrap gap-3 text-[10px] text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-300/50" />Free</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-300/60" />Occupied</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-300" />Selected</span>{activeCase.sectors.map((sector, index) => <span key={sector.id}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'][index % 8] }} />{sector.name}</span>)}</div>
          </section>
          <aside className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-[#08111d] p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/80">Placement</p>
                <div className="grid gap-2">
                  <button onClick={autoFill} className="flex items-center justify-center gap-2 rounded border border-indigo-300/25 bg-indigo-300/10 px-3 py-2.5 text-xs font-semibold text-indigo-100 hover:bg-indigo-300/20"><Wand2 size={14} /> Auto-fill Data</button>
                  <button onClick={() => { if (window.confirm(`Clear all data from ${level.name}? This removes manual and auto-filled entries on this level.`)) { clearDataLevel(level.id); setSelectedObjectId(null); setPlacementMode(null); } }} className="flex items-center justify-center gap-2 rounded border border-rose-300/25 bg-rose-400/10 px-3 py-2.5 text-xs font-semibold text-rose-100 hover:bg-rose-400/20"><Trash2 size={14} /> Clear Current Level</button>
                </div>
                <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Auto-fill adds two representative data elements per sector where free cells allow. It never overwrites manual entries.</p>
                {dataAutoFillNotice && <p className="mt-3 rounded border border-amber-300/20 bg-amber-300/5 px-2.5 py-2 text-[10px] leading-relaxed text-amber-100/80">{dataAutoFillNotice}</p>}
              </div>
            <div className="rounded-xl border border-white/10 bg-[#08111d] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/80">Sector key</p><Grid3X3 size={15} className="text-cyan-300/70" /></div><div className="space-y-2">{activeCase.sectors.map((sector, index) => <div key={sector.id} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'][index % 8] }} />{sector.name}</div>)}</div></div>
            {selectedObject && <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] uppercase tracking-wider text-cyan-200/65">Selected data</p><h3 className="mt-1 text-sm font-bold text-cyan-50">{selectedObject.name}</h3></div><div className="flex items-center gap-2"><button type="button" onClick={() => setPlacementMode('move')} className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground"><Move size={12} /> Move selected</button><button type="button" onClick={() => { removeDataObject(selectedObject.id); setSelectedObjectId(null); }} title="Remove data" className="text-muted-foreground hover:text-rose-300"><Trash2 size={14} /></button></div></div><p className="mt-2 text-[11px] text-muted-foreground">Cell ({selectedObject.grid_x + 1}, {selectedObject.grid_y + 1}) · {activeCase.sectors.find((sector) => sector.id === selectedObject.sector_id)?.name}</p><p className="mt-2 line-clamp-3 text-xs text-cyan-50/70">{selectedObject.description || 'No description provided.'}</p>{placementMode === 'move' && <p className="mt-2 text-[10px] text-cyan-200/70">Select an empty cell to move this data object.</p>}</div>}
          </aside>
        </div>
      </main>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#07111c] px-5 py-3"><button onClick={goPrevious} disabled={dataLevelIndex === 0} className="flex items-center gap-1.5 rounded border border-white/10 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5 disabled:opacity-30"><ChevronLeft size={14} /> Previous level</button><div className="flex gap-2"><button onClick={skipDataLevel} className="flex items-center gap-1.5 rounded border border-white/10 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5"><SkipForward size={14} /> Skip level</button><button onClick={goNext} disabled={dataLevelIndex >= activeCase.levels.length - 1} className="flex items-center gap-1.5 rounded border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-30">Next level <ChevronRight size={14} /></button><button onClick={() => setWalkthroughStage('visualise')} className="rounded bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300">Finish Data</button></div></footer>
    </div>
  );
}

function MetadataField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const shared = {
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    className: 'mt-1 w-full rounded border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-foreground outline-none focus:border-cyan-300/60',
  };
  return <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}{multiline ? <textarea {...shared} rows={3} /> : <input {...shared} />}</label>;
}

const EDITABLE_METADATA_FIELDS: { key: keyof V2DataDraft; label: string; multiline?: boolean }[] = [
  { key: 'name', label: 'Name' },
  { key: 'availability', label: 'Availability / status' },
  { key: 'source', label: 'Source / system / device' },
  { key: 'protocol', label: 'Protocol' },
  { key: 'format', label: 'Format' },
  { key: 'data_type', label: 'Data type / signal type' },
  { key: 'frequency', label: 'Frequency / sample rate' },
  { key: 'sensing_settings', label: 'Sensing / settings metadata' },
  { key: 'preprocessing', label: 'Preprocessing / feature extraction' },
  { key: 'intended_use', label: 'Intended use' },
  { key: 'description', label: 'Description', multiline: true },
];

function VisualiseStage() {
  const {
    activeCase,
    setWalkthroughStage,
    showV2Labels,
    setShowV2Labels,
    selectedVisualiseObjectId,
    setSelectedVisualiseObjectId,
    visualiseExploded,
    setVisualiseExploded,
    visualiseFocusedLevelId,
    visualiseOnlyLevelId,
    setVisualiseFocusedLevelId,
    setVisualiseOnlyLevelId,
    visualiseHiddenSectorIds,
    toggleVisualiseSector,
    showAllVisualiseSectors,
    visualiseSurfaceOpacity,
    setVisualiseSurfaceOpacity,
    visualiseDataDensity,
    setVisualiseDataDensity,
    visualiseObjectScale,
    setVisualiseObjectScale,
    visualiseLabelScale,
    setVisualiseLabelScale,
    requestViewReset,
    fitWalkthroughView,
    setDataLevelIndex,
    updateDataObjectMetadata,
    isWalkthroughPanelCollapsed,
    setWalkthroughPanelCollapsed,
  } = useV2Store();
  const [editing, setEditing] = useState(false);
  const [metadataDraft, setMetadataDraft] = useState<V2MetadataPatch>({});

  const selectedObject = activeCase?.overlays.data.find((object) => object.id === selectedVisualiseObjectId);
  const selectedLevel = selectedObject ? activeCase?.levels.find((level) => level.id === selectedObject.level_id) : undefined;
  const selectedSector = selectedObject ? activeCase?.sectors.find((sector) => sector.id === selectedObject.sector_id) : undefined;

  useEffect(() => {
    if (!selectedObject) {
      setEditing(false);
      setMetadataDraft({});
      return;
    }
    setEditing(false);
    setMetadataDraft({
      name: selectedObject.name,
      description: selectedObject.description,
      availability: selectedObject.availability,
      source: selectedObject.source,
      protocol: selectedObject.protocol,
      format: selectedObject.format,
      data_type: selectedObject.data_type,
      frequency: selectedObject.frequency,
      sensing_settings: selectedObject.sensing_settings,
      preprocessing: selectedObject.preprocessing,
      intended_use: selectedObject.intended_use,
    });
  }, [selectedObject?.id]);

  if (!activeCase) return null;

  const resetView = () => {
    setVisualiseFocusedLevelId(null);
    setVisualiseOnlyLevelId(null);
    setVisualiseExploded(false);
    setVisualiseSurfaceOpacity(0.2);
    setVisualiseDataDensity('all');
    setVisualiseObjectScale(1);
    setVisualiseLabelScale(1);
    showAllVisualiseSectors();
    requestViewReset();
    setSelectedVisualiseObjectId(null);
  };
  const moveToDataBoard = () => {
    if (!selectedLevel || !selectedObject) return;
    setDataLevelIndex(selectedLevel.index);
    setWalkthroughStage('data');
  };
  const saveMetadata = () => {
    if (!selectedObject || !metadataDraft.name?.trim()) return;
    updateDataObjectMetadata(selectedObject.id, {
      ...metadataDraft,
      name: metadataDraft.name.trim(),
    });
    setEditing(false);
  };
  const metadata = selectedObject ? [
    ['Availability / status', selectedObject.availability],
    ['Source / system / device', selectedObject.source],
    ['Protocol', selectedObject.protocol],
    ['Format', selectedObject.format],
    ['Data type / signal type', selectedObject.data_type],
    ['Frequency / sample rate', selectedObject.frequency],
    ['Sensing / settings', selectedObject.sensing_settings],
    ['Preprocessing / features', selectedObject.preprocessing],
    ['Intended use', selectedObject.intended_use],
  ].filter(([, value]) => value?.trim()) : [];

  if (isWalkthroughPanelCollapsed) return <CollapsedWalkthroughRail />;

  return (
    <div data-walkthrough-panel className="pointer-events-auto absolute inset-y-4 right-4 z-20 flex w-[min(460px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-indigo-400/20 bg-[#070b14]/95 shadow-2xl backdrop-blur-xl md:inset-y-6 md:right-6">
       <div className="shrink-0 border-b border-indigo-400/20 bg-indigo-400/10 p-5">
         <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-300/75">Walkthrough / Visualise</p>
            <h2 className="mt-1 text-xl font-bold text-indigo-100">Review your pyramid</h2>
            <p className="mt-1 text-xs leading-relaxed text-indigo-100/65">Explore the configured frame and inspect each placed data element.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <OpenProjectButton />
            <RestartWalkthroughButton />
            <button onClick={fitWalkthroughView} className="flex items-center gap-1.5 rounded border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-300/20"><Maximize2 size={13} /> Fit 3D View</button>
            <button onClick={() => setWalkthroughPanelCollapsed(true)} title="Collapse Panel" aria-label="Collapse Panel" className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"><PanelRightClose size={15} /></button>
            <button onClick={() => setWalkthroughStage('data')} className="rounded border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-300/20">Back to Data</button>
          </div>
        </div>
      </div>
      <Progress currentStage={2} />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Presentation</p>
              <button onClick={resetView} className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground"><RotateCcw size={12} /> Reset view</button>
            </div>
            <button onClick={() => setVisualiseExploded(!visualiseExploded)} className={`flex w-full items-center justify-center gap-2 rounded border px-2.5 py-2 text-xs font-semibold ${visualiseExploded ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}>{visualiseExploded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}{visualiseExploded ? 'Assemble' : 'Explode'}</button>
            <div className="mt-3 flex items-center gap-2">
              <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">Surface opacity</span>
              <input aria-label="Surface opacity" type="range" min="0.18" max="1" step="0.01" value={visualiseSurfaceOpacity} onChange={(event) => setVisualiseSurfaceOpacity(Number(event.target.value))} className="w-full accent-cyan-300" />
              <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">{Math.round(visualiseSurfaceOpacity * 100)}%</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Data display</span>
              <div className="flex gap-1">
                {([1, 2, 3, 'all'] as V2DataDensity[]).map((density) => (
                  <button key={density} onClick={() => setVisualiseDataDensity(density)} className={`min-w-8 rounded border px-2 py-1 text-[10px] font-semibold ${visualiseDataDensity === density ? 'border-cyan-300/50 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
                    {density === 'all' ? 'All' : density}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">Object size</span>
                <input aria-label="Object size" type="range" min="0.7" max="1.35" step="0.01" value={visualiseObjectScale} onChange={(event) => setVisualiseObjectScale(Number(event.target.value))} className="w-full accent-cyan-300" />
                <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">{Math.round(visualiseObjectScale * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">Label size</span>
                <input aria-label="Label size" type="range" min="0.75" max="1.35" step="0.01" value={visualiseLabelScale} onChange={(event) => setVisualiseLabelScale(Number(event.target.value))} className="w-full accent-cyan-300" />
                <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">{Math.round(visualiseLabelScale * 100)}%</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Levels</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowV2Labels(!showV2Labels)} className="flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">{showV2Labels ? <EyeOff size={12} /> : <Eye size={12} />}{showV2Labels ? 'Hide labels' : 'Show labels'}</button>
                <button onClick={() => { setVisualiseFocusedLevelId(null); setVisualiseOnlyLevelId(null); }} className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">Show All Levels</button>
              </div>
            </div>
            <div className="space-y-2">
              {activeCase.levels.map((level) => (
                <div key={level.id} className="flex items-center justify-between gap-2 rounded border border-white/5 bg-white/[0.02] px-2 py-1.5">
                  <span className="truncate text-xs text-foreground"><span className="mr-2 font-mono text-indigo-300/70">L{level.index + 1}</span>{level.name}</span>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => setVisualiseFocusedLevelId(visualiseFocusedLevelId === level.id ? null : level.id)} className={`rounded border px-2 py-1 text-[10px] font-semibold ${visualiseFocusedLevelId === level.id ? 'border-indigo-300 bg-indigo-300/20 text-indigo-100' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Focus Camera</button>
                    <button onClick={() => setVisualiseOnlyLevelId(visualiseOnlyLevelId === level.id ? null : level.id)} className={`rounded border px-2 py-1 text-[10px] font-semibold ${visualiseOnlyLevelId === level.id ? 'border-amber-300/50 bg-amber-300/15 text-amber-100' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}>Show Only</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Sectors</p>
              <button onClick={showAllVisualiseSectors} className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">Show All Sectors</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {activeCase.sectors.map((sector, index) => {
                const hidden = visualiseHiddenSectorIds.includes(sector.id);
                const color = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'][index % 8];
                return <button key={sector.id} onClick={() => toggleVisualiseSector(sector.id)} className={`flex items-center justify-between rounded border px-2.5 py-2 text-left text-xs font-semibold ${hidden ? 'border-white/10 bg-white/[0.02] text-muted-foreground' : 'border-white/15 bg-white/5 text-foreground hover:bg-white/10'}`}><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color, opacity: hidden ? 0.3 : 1 }} />{sector.name}</span><span className="text-[10px] uppercase tracking-wider">{hidden ? 'Show' : 'Hide'}</span></button>;
              })}
            </div>
          </div>
          {selectedObject && selectedLevel && selectedSector ? (
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/5">
              <div className="flex items-start justify-between gap-3 border-b border-cyan-300/15 p-4">
                <div><p className="text-[10px] uppercase tracking-wider text-cyan-200/65">Selected data element</p><h3 className="mt-1 text-base font-bold text-cyan-50">{selectedObject.name}</h3><p className="mt-1 text-[10px] text-cyan-100/65">L{selectedLevel.index + 1} · {selectedLevel.name} · {selectedSector.name} · cell ({selectedObject.grid_x + 1}, {selectedObject.grid_y + 1})</p></div>
                <button onClick={() => setSelectedVisualiseObjectId(null)} aria-label="Close inspection" className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"><X size={16} /></button>
              </div>
              {editing ? (
                <div className="space-y-3 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">{EDITABLE_METADATA_FIELDS.map((field) => <MetadataField key={field.key} label={field.label} value={metadataDraft[field.key] ?? ''} multiline={field.multiline} onChange={(value) => setMetadataDraft((current) => ({ ...current, [field.key]: value }))} />)}</div>
                  <div className="flex justify-end gap-2"><button onClick={() => setEditing(false)} className="rounded border border-white/10 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5">Cancel</button><button onClick={saveMetadata} disabled={!metadataDraft.name?.trim()} className="rounded bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">Save metadata</button></div>
                </div>
              ) : (
                <>
                  <div className="space-y-3 p-4">
                    {selectedObject.description?.trim() && <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</p><p className="mt-1 text-xs leading-relaxed text-cyan-50/80">{selectedObject.description}</p></div>}
                    {metadata.length > 0 && <dl className="grid gap-2 sm:grid-cols-2">{metadata.map(([label, value]) => <div key={label} className="rounded border border-white/10 bg-black/20 p-2"><dt className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-1 text-[11px] leading-snug text-foreground">{value}</dd></div>)}</dl>}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-cyan-300/15 p-3"><button onClick={() => setEditing(true)} className="rounded border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/20">Edit metadata</button><button onClick={moveToDataBoard} className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">Move on Data Board</button></div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-relaxed text-muted-foreground">Click any glowing data object in the pyramid to inspect its stored metadata. Presentation controls move only the view; the saved grid address remains unchanged.</div>
          )}
          <button onClick={() => setWalkthroughStage('connections')} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-400 py-3 text-sm font-bold text-slate-950 hover:bg-indigo-300"><Link2 size={16} /> Continue to Connections <ChevronRight size={17} /></button>
        </div>
      </div>
    </div>
  );
}

function ConnectionsStage({ embedded = false }: { embedded?: boolean }) {
  const {
    activeCase,
    setWalkthroughStage,
    selectedLoopId,
    showOnlyLoopId,
    loopSectorContext,
    connectionsView,
    connections2DLoopId,
    isWalkthroughPanelCollapsed,
    expandedLoopIds,
    loopBuilder,
    selectedConnectionId,
    connectionArrowThickness,
    setConnectionArrowThickness,
    selectConnection,
    startLoop,
    undoLastSegment,
    finishLoop,
    cancelLoop,
    selectLoop,
    setShowOnlyLoop,
    setLoopSectorContext,
    setConnectionsView,
    setConnections2DLoop,
    setWalkthroughPanelCollapsed,
    toggleLoopExpanded,
    updateConnection,
    updateLoop,
    deleteLoop,
    addExampleLoops,
    finishConnections,
    connectionsFinished,
    visualiseExploded,
    setVisualiseExploded,
    visualiseSurfaceOpacity,
    setVisualiseSurfaceOpacity,
    visualiseDataDensity,
    setVisualiseDataDensity,
    visualiseObjectScale,
    setVisualiseObjectScale,
    visualiseLabelScale,
    setVisualiseLabelScale,
    visualiseOnlyLevelId,
    visualiseHiddenSectorIds,
  } = useV2Store();
  const [draft, setDraft] = useState<V2LoopDraft>({
    name: '',
    description: '',
    color: LOOP_COLOR_PALETTE[0],
  });
  const [segmentDraft, setSegmentDraft] = useState({ label: '', description: '' });
  const [notice, setNotice] = useState<string | null>(null);

  const selectedConnection = activeCase?.overlays.connectivity.find((connection) => connection.id === selectedConnectionId);
  const loops = activeCase?.overlays.loops || [];
  const visibleObjectIds = useMemo(() => activeCase
    ? getVisibleV2ObjectIds(activeCase, visualiseDataDensity, visualiseOnlyLevelId, visualiseHiddenSectorIds)
    : new Set<string>(), [activeCase, visualiseDataDensity, visualiseOnlyLevelId, visualiseHiddenSectorIds]);

  useEffect(() => {
    if (selectedConnection) {
      setSegmentDraft({
        label: selectedConnection.label || '',
        description: selectedConnection.description || '',
      });
    } else {
      setSegmentDraft({ label: '', description: '' });
    }
  }, [selectedConnectionId]);

  if (!activeCase) return null;

  const selectedLoop = loops.find((loop) => loop.id === selectedLoopId) || null;
  const builderSegments = loopBuilder
    ? activeCase.overlays.connectivity
      .filter((connection) => connection.loop_id === loopBuilder.loopId)
      .sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id))
    : [];
  const currentObject = activeCase.overlays.data.find((object) => object.id === loopBuilder?.currentObjectId);
  const firstObject = activeCase.overlays.data.find((object) => object.id === loopBuilder?.firstObjectId);
  const builderPaused = Boolean(loopBuilder?.currentObjectId && !visibleObjectIds.has(loopBuilder.currentObjectId));
  const objectContext = (object: typeof currentObject) => {
    if (!object) return null;
    const level = activeCase.levels.find((item) => item.id === object.level_id);
    const sector = activeCase.sectors.find((item) => item.id === object.sector_id);
    return {
      object,
      levelName: level?.name || object.level_id,
      sectorName: sector?.name || object.sector_id,
    };
  };
  const startNewLoop = () => {
    if (!draft.name.trim()) {
      setNotice('Enter a loop name before starting.');
      return;
    }
    startLoop(draft);
    setNotice('Select the first data element in the pyramid.');
  };
  const finishCurrentLoop = (close = false) => {
    if (!loopBuilder) return;
    if (builderSegments.length === 0) {
      setNotice('Select at least two data elements before finishing a loop.');
      return;
    }
    finishLoop(close);
    setNotice(close ? 'Loop finished and closed.' : 'Loop finished.');
  };
  const startNewLoopForm = () => {
    cancelLoop();
    setDraft({ name: '', description: '', color: LOOP_COLOR_PALETTE[0] });
    setNotice(null);
  };
  const saveSegment = () => {
    if (!selectedConnectionId) return;
    updateConnection(selectedConnectionId, segmentDraft);
    setNotice('Segment details updated.');
  };
  const generateExamples = () => {
    const count = addExampleLoops();
    setNotice(count > 0 ? `Added ${count} example loop${count === 1 ? '' : 's'}.` : 'No complete example loops were available from the currently visible objects.');
  };
  const hasBothExampleLoops = ['Predictive Maintenance', 'Process Optimisation'].every((name) =>
    loops.some((loop) => loop.name.trim().toLowerCase() === name.toLowerCase()),
  );
  const displayLoopId = connectionsView === '2d' ? connections2DLoopId : selectedLoopId;
  const selectDisplayLoop = (loopId: string | null) => {
    if (connectionsView === '2d') {
      setConnections2DLoop(loopId);
    } else {
      selectLoop(loopId);
    }
  };
  if (isWalkthroughPanelCollapsed) return <CollapsedWalkthroughRail embedded={embedded} showFit={connectionsView === '3d'} />;

  return (
    <div data-walkthrough-panel className={`pointer-events-auto flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-indigo-400/20 bg-[#070b14]/95 shadow-2xl backdrop-blur-xl ${embedded ? 'relative h-full w-full' : 'absolute inset-y-4 right-4 z-20 w-[min(760px,calc(100vw-2rem))] md:inset-y-6 md:right-6'}`}>
       <header className="shrink-0 border-b border-indigo-400/20 bg-indigo-400/10 p-5">
         <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-300/75">Walkthrough / Connections</p>
            <h2 className="mt-1 text-xl font-bold text-indigo-100">Map the data flow</h2>
            <p className="mt-1 text-xs leading-relaxed text-indigo-100/65">Build ordered loops by selecting visible data objects directly in the pyramid. Drag to rotate · Right-drag to pan · Scroll to zoom.</p>
          </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
             <OpenProjectButton />
             <RestartWalkthroughButton />
              {connectionsView === '3d' && <FitWalkthroughViewButton />}
              <button onClick={() => setWalkthroughPanelCollapsed(true)} title="Collapse Panel" aria-label="Collapse Panel" className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"><PanelRightClose size={15} /></button>
             <Link2 size={22} className="mt-1 text-indigo-200/70" />
           </div>
        </div>
      </header>
      <div className="shrink-0 border-b border-indigo-400/15 bg-black/20 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="mr-auto text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-200/75">Connections view</span>
          {([
            ['3d', '3D Loop View'],
            ['2d', '2D Cross-Section'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setConnectionsView(value)}
              className={`rounded border px-2.5 py-1.5 text-[10px] font-semibold ${connectionsView === value ? 'border-indigo-300/60 bg-indigo-300/20 text-indigo-100' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Progress currentStage={3} completedStages={connectionsFinished ? [0, 1, 2, 3] : [0, 1, 2]} />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          {connectionsFinished && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4">
              <Check size={17} className="mt-0.5 shrink-0 text-emerald-300" />
              <p className="text-xs leading-relaxed text-emerald-100/80">Connections are complete. A future Review / Save stage will be available here; no database persistence is performed yet.</p>
            </div>
          )}
          <section className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Create New Loop</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{loopBuilder ? 'Select the next data element to extend the current path.' : 'Name and colour the loop, then select its data elements in order.'}</p>
              </div>
              {loopBuilder && <button onClick={startNewLoopForm} className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">Cancel Loop</button>}
            </div>
            {!loopBuilder ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Loop name" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} required />
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Loop colour
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {LOOP_COLOR_PALETTE.map((color) => <button key={color} aria-label={`Use ${color}`} onClick={() => setDraft((current) => ({ ...current, color }))} className={`h-7 w-7 rounded-full border-2 ${draft.color === color ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: color }} />)}
                    </div>
                  </label>
                </div>
                <Field label="Optional loop description" value={draft.description} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} multiline />
                <button onClick={startNewLoop} disabled={!draft.name.trim()} className="w-full rounded bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40">Start Loop and Select First Element</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 p-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedLoop?.color || draft.color }} />
                  <div className="min-w-0"><p className="truncate text-xs font-bold text-foreground">{selectedLoop?.name || draft.name}</p><p className="text-[10px] text-muted-foreground">{firstObject?.name || 'Select the first element'} → {currentObject?.name || 'next element'}</p></div>
                </div>
                <p className={`rounded border px-3 py-2 text-[11px] font-semibold ${builderPaused ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-cyan-300/20 bg-cyan-300/5 text-cyan-100'}`}>{builderPaused ? `Loop paused: the active endpoint ${currentObject?.name || 'object'} is hidden by the current display filter. Restore its level, sector, or data density to continue.` : loopBuilder.currentObjectId ? `Current endpoint: ${currentObject?.name || 'hidden object'}. Select the next data element.` : 'Select the first data element in the pyramid.'}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => undoLastSegment()} className="rounded border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:bg-white/10">Undo Last Segment</button>
                  <button onClick={() => finishCurrentLoop(false)} className="rounded bg-emerald-400 px-3 py-2 text-[10px] font-bold text-slate-950 hover:bg-emerald-300">Finish Loop</button>
                  <button onClick={() => finishCurrentLoop(true)} className="rounded border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[10px] font-semibold text-amber-100 hover:bg-amber-300/20">Close to First Element</button>
                </div>
              </div>
            )}
            {notice && <p className="mt-3 rounded border border-indigo-300/20 bg-indigo-300/5 px-2.5 py-2 text-[10px] leading-relaxed text-indigo-100/80">{notice}</p>}
          </section>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Connection display</p>
              {!hasBothExampleLoops && <button onClick={generateExamples} className="rounded border border-indigo-300/25 bg-indigo-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-100 hover:bg-indigo-300/20"><Wand2 size={12} className="mr-1 inline" /> Add Example Loops</button>}
            </div>
            <div className="flex items-center gap-2">
               <span className="w-28 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">Connection thickness</span>
               <input aria-label="Connection thickness" type="range" min="0.7" max="1.8" step="0.05" value={connectionArrowThickness} onChange={(event) => setConnectionArrowThickness(Number(event.target.value))} className="w-full accent-indigo-300" />
              <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">{Math.round(connectionArrowThickness * 100)}%</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Loop filter</span>
               {connectionsView !== '2d' && <button onClick={() => { selectLoop(null); setShowOnlyLoop(null); }} className={`rounded border px-2 py-1 text-[10px] font-semibold ${!selectedLoopId && !showOnlyLoopId ? 'border-indigo-300/60 bg-indigo-300/20 text-indigo-100' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}>All Loops</button>}
               {loops.map((loop) => <button key={loop.id} onClick={() => selectDisplayLoop(loop.id)} className={`rounded border px-2 py-1 text-[10px] font-semibold ${displayLoopId === loop.id ? 'border-indigo-300/60 bg-indigo-300/20 text-indigo-100' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: loop.color }} />{loop.name}</button>)}
                {connectionsView !== '2d' && selectedLoopId && <button onClick={() => setShowOnlyLoop(showOnlyLoopId ? null : selectedLoopId)} className="rounded border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[10px] font-semibold text-cyan-100">{showOnlyLoopId ? 'Exit Isolation' : 'Isolate Loop'}</button>}
            </div>
             {connectionsView === '2d' && showOnlyLoopId && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sector context</span>
                {([
                  ['active', 'Active only'],
                  ['all', 'Show all'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setLoopSectorContext(value)}
                    className={`rounded border px-2 py-1 text-[10px] font-semibold ${loopSectorContext === value ? 'border-cyan-300/60 bg-cyan-300/20 text-cyan-100' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button onClick={() => setVisualiseExploded(!visualiseExploded)} className="rounded border border-white/10 bg-white/5 px-2.5 py-2 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">{visualiseExploded ? 'Assemble Pyramid' : 'Explode Pyramid'}</button>
              <div className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1">
                <span className="mr-1 text-[10px] uppercase tracking-wider text-muted-foreground">Data</span>
                {([1, 2, 3, 'all'] as V2DataDensity[]).map((density) => <button key={density} onClick={() => setVisualiseDataDensity(density)} className={`min-w-7 rounded px-1.5 py-1 text-[10px] font-semibold ${visualiseDataDensity === density ? 'bg-cyan-300/20 text-cyan-100' : 'text-muted-foreground hover:bg-white/10'}`}>{density === 'all' ? 'All' : density}</button>)}
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">Object size <input aria-label="Connections object size" type="range" min="0.7" max="1.35" step="0.01" value={visualiseObjectScale} onChange={(event) => setVisualiseObjectScale(Number(event.target.value))} className="w-full accent-cyan-300" /></label>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">Label size <input aria-label="Connections label size" type="range" min="0.75" max="1.35" step="0.01" value={visualiseLabelScale} onChange={(event) => setVisualiseLabelScale(Number(event.target.value))} className="w-full accent-cyan-300" /></label>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="w-28 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">Surface opacity</span>
              <input aria-label="Connections surface opacity" type="range" min="0.18" max="1" step="0.01" value={visualiseSurfaceOpacity} onChange={(event) => setVisualiseSurfaceOpacity(Number(event.target.value))} className="w-full accent-cyan-300" />
              <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">{Math.round(visualiseSurfaceOpacity * 100)}%</span>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">Other Visualise controls remain available through Back to Visualise. Hidden endpoints temporarily hide their arrows without deleting connections.</p>
          </section>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Loop table</p><p className="mt-1 text-[10px] text-muted-foreground">{loops.length} stored loop{loops.length === 1 ? '' : 's'} · {activeCase.overlays.connectivity.length} ordered segment{activeCase.overlays.connectivity.length === 1 ? '' : 's'}</p></div>
              <button onClick={startNewLoopForm} className="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">Create New Loop</button>
            </div>
            {loops.length === 0 ? (
              <p className="rounded border border-white/10 bg-black/20 p-3 text-[11px] leading-relaxed text-muted-foreground">No loops yet. Start a loop above or add the deterministic examples.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-white/10">
                <table className="w-full min-w-[780px] text-left text-[10px]">
                  <thead className="bg-white/[0.04] uppercase tracking-wider text-muted-foreground"><tr><th className="px-2 py-2">Loop</th><th className="px-2 py-2">Colour</th><th className="px-2 py-2">Nodes</th><th className="px-2 py-2">Segments</th><th className="px-2 py-2">Levels</th><th className="px-2 py-2">Sectors</th><th className="px-2 py-2">Visibility</th><th className="px-2 py-2">Actions</th></tr></thead>
                  <tbody>
                    {loops.map((loop) => {
                      const segments = activeCase.overlays.connectivity.filter((connection) => connection.loop_id === loop.id).sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
                      const nodeIds = new Set(segments.flatMap((segment) => [segment.source_object_id, segment.target_object_id]));
                      const loopObjects = activeCase.overlays.data.filter((object) => nodeIds.has(object.id));
                      const levels = Array.from(new Set(loopObjects.map((object) => activeCase.levels.find((level) => level.id === object.level_id)?.name || object.level_id)));
                      const sectors = Array.from(new Set(loopObjects.map((object) => activeCase.sectors.find((sector) => sector.id === object.sector_id)?.name || object.sector_id)));
                      const hiddenSegments = segments.filter((segment) => !visibleObjectIds.has(segment.source_object_id) || !visibleObjectIds.has(segment.target_object_id)).length;
                      const expanded = expandedLoopIds.includes(loop.id);
                      const path = segments.length > 0
                        ? [segments[0].source_object_id, ...segments.map((segment) => segment.target_object_id)].map((id) => activeCase.overlays.data.find((object) => object.id === id)?.name || 'Missing object')
                        : [];
                      return (
                        <Fragment key={loop.id}>
                          <tr onClick={() => { selectLoop(loop.id); toggleLoopExpanded(loop.id); }} className={`cursor-pointer border-t border-white/5 ${selectedLoopId === loop.id ? 'bg-indigo-300/15' : 'hover:bg-white/[0.04]'}`}>
                            <td className="px-2 py-2 font-semibold text-foreground"><span className="mr-1 inline-block text-muted-foreground">{expanded ? '▾' : '▸'}</span>{loop.name}</td>
                            <td className="px-2 py-2"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: loop.color }} title={loop.color} /></td>
                            <td className="px-2 py-2">{nodeIds.size}</td><td className="px-2 py-2">{segments.length}</td><td className="px-2 py-2">{levels.join(', ') || '—'}</td><td className="px-2 py-2">{sectors.join(', ') || '—'}</td>
                            <td className="px-2 py-2">{hiddenSegments > 0 ? <span className="text-amber-200">Hidden by display filter</span> : <span className="text-emerald-200">Visible</span>}</td>
                            <td className="px-2 py-2"><div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}><button onClick={() => { const name = window.prompt('Rename loop', loop.name); if (name?.trim()) updateLoop(loop.id, { name }); }} className="rounded border border-white/10 px-1.5 py-1 hover:bg-white/10" title="Rename loop"><Edit2 size={11} /></button><input aria-label={`Change ${loop.name} colour`} type="color" value={loop.color} onChange={(event) => updateLoop(loop.id, { color: event.target.value })} className="h-6 w-6 cursor-pointer rounded border border-white/10 bg-transparent p-0.5" /><button onClick={() => { const description = window.prompt('Edit loop description', loop.description); if (description !== null) updateLoop(loop.id, { description }); }} className="rounded border border-white/10 px-1.5 py-1 hover:bg-white/10" title="Edit description"><Edit2 size={11} /></button><button onClick={() => setShowOnlyLoop(showOnlyLoopId === loop.id ? null : loop.id)} className="rounded border border-cyan-300/25 px-1.5 py-1 text-cyan-100 hover:bg-cyan-400/10" title={showOnlyLoopId === loop.id ? 'Exit isolation' : 'Isolate loop'}>{showOnlyLoopId === loop.id ? <EyeOff size={11} /> : <Eye size={11} />}</button><button onClick={() => { if (window.confirm(`Delete loop "${loop.name}"? Its relationships will be removed, but data objects will remain.`)) deleteLoop(loop.id); }} className="rounded border border-rose-300/25 px-1.5 py-1 text-rose-200 hover:bg-rose-400/10" title="Delete loop"><Trash2 size={11} /></button></div></td>
                          </tr>
                          {expanded && <tr><td colSpan={8} className="bg-black/20 p-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ordered path</p>
                            <p className="mb-3 text-xs font-semibold text-indigo-100">{path.length > 0 ? path.join(' → ') : 'No segments yet'}</p>
                            <div className="space-y-2">
                              {segments.map((segment) => {
                                const sourceObject = activeCase.overlays.data.find((object) => object.id === segment.source_object_id);
                                const targetObject = activeCase.overlays.data.find((object) => object.id === segment.target_object_id);
                                const sourceLevel = activeCase.levels.find((level) => level.id === sourceObject?.level_id);
                                const targetLevel = activeCase.levels.find((level) => level.id === targetObject?.level_id);
                                const sourceSector = activeCase.sectors.find((sector) => sector.id === sourceObject?.sector_id);
                                const targetSector = activeCase.sectors.find((sector) => sector.id === targetObject?.sector_id);
                                return <div key={segment.id} className={`rounded border p-2 ${selectedConnectionId === segment.id ? 'border-indigo-300/40 bg-indigo-300/10' : 'border-white/10 bg-white/[0.02]'}`} onClick={(event) => { event.stopPropagation(); selectConnection(segment.id); }}>
                                  <div className="grid gap-2 text-[10px] sm:grid-cols-7"><span className="font-mono text-indigo-200">#{segment.sequence + 1}</span><span className="text-cyan-100">{sourceObject?.name || 'Missing object'}<br /><span className="text-muted-foreground">{sourceLevel?.name || '—'} · {sourceSector?.name || '—'} · ({sourceObject?.grid_x ?? '—'}, {sourceObject?.grid_y ?? '—'})</span></span><ArrowRight size={13} className="mt-1 text-indigo-300" /><span className="text-amber-100">{targetObject?.name || 'Missing object'}<br /><span className="text-muted-foreground">{targetLevel?.name || '—'} · {targetSector?.name || '—'} · ({targetObject?.grid_x ?? '—'}, {targetObject?.grid_y ?? '—'})</span></span><span className="text-indigo-100">Source → Target</span><span className="text-muted-foreground">{segment.label || '—'}<br />{segment.description || 'No note'}</span><span className={visibleObjectIds.has(segment.source_object_id) && visibleObjectIds.has(segment.target_object_id) ? 'text-emerald-200' : 'text-amber-200'}>{visibleObjectIds.has(segment.source_object_id) && visibleObjectIds.has(segment.target_object_id) ? 'Visible' : 'Hidden by filter'}</span></div>
                                  {selectedConnectionId === segment.id && <div className="mt-2 grid gap-2 border-t border-white/10 pt-2 sm:grid-cols-[1fr_1fr_auto]"><Field label="Segment label" value={segmentDraft.label} onChange={(value) => setSegmentDraft((current) => ({ ...current, label: value }))} /><Field label="Segment note" value={segmentDraft.description} onChange={(value) => setSegmentDraft((current) => ({ ...current, description: value }))} /><button onClick={(event) => { event.stopPropagation(); saveSegment(); }} className="self-end rounded bg-cyan-400 px-3 py-2 text-[10px] font-bold text-slate-950">Save</button></div>}
                                </div>;
                              })}
                            </div>
                          </td></tr>}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#07111c] px-5 py-3">
        <button onClick={() => setWalkthroughStage('visualise')} className="flex items-center gap-1.5 rounded border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/20"><ChevronLeft size={14} /> Back to Visualise</button>
        <button onClick={finishConnections} className="flex items-center gap-1.5 rounded bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300">Finish Connections <Check size={14} /></button>
      </footer>
    </div>
  );
}

type ReviewUser = {
  id: string;
  displayName: string;
};

type ReviewProject = {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  currentVersionId?: string | null;
  updatedAt: string;
};

type SaveTarget = 'existing' | 'new';

type ReviewSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success'; userName: string; projectName: string; versionNumber: number; savedAt: string; verified: boolean }
  | { status: 'error'; message: string };

async function getApiError(response: Response) {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error || `Request failed (${response.status})`;
}

function ReviewSaveStage() {
  const activeCase = useV2Store((state) => state.activeCase);
  const loadedProjectContext = useV2Store((state) => state.loadedProjectContext);
  const setLoadedProjectContext = useV2Store((state) => state.setLoadedProjectContext);
  const setWalkthroughStage = useV2Store((state) => state.setWalkthroughStage);
  const setConnectionsView = useV2Store((state) => state.setConnectionsView);
  const isWalkthroughPanelCollapsed = useV2Store((state) => state.isWalkthroughPanelCollapsed);
  const setWalkthroughPanelCollapsed = useV2Store((state) => state.setWalkthroughPanelCollapsed);
  const fitWalkthroughView = useV2Store((state) => state.fitWalkthroughView);
  const [users, setUsers] = useState<ReviewUser[]>([]);
  const [projects, setProjects] = useState<ReviewProject[]>([]);
  const [userSelection, setUserSelection] = useState(loadedProjectContext?.userId || '__new__');
  const [newUserName, setNewUserName] = useState('');
  const [projectName, setProjectName] = useState(loadedProjectContext?.projectName || activeCase?.name || '');
  const [projectDescription, setProjectDescription] = useState(loadedProjectContext?.projectDescription || '');
  const [versionNote, setVersionNote] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(loadedProjectContext?.projectId || '');
  const [saveTarget, setSaveTarget] = useState<SaveTarget>(loadedProjectContext ? 'existing' : 'new');
  const [projectLoadState, setProjectLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [projectLoadError, setProjectLoadError] = useState('');
  const [saveState, setSaveState] = useState<ReviewSaveState>({ status: 'idle' });
  const saveAsNewProject = saveTarget === 'new';
  const isCreatingUser = userSelection === '__new__';
  const ownerUserId = userSelection === '__new__' ? '' : userSelection;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/users')
      .then(async (response) => {
        if (!response.ok) throw new Error(await getApiError(response));
        return response.json() as Promise<{ users: ReviewUser[] }>;
      })
      .then((result) => {
        if (!cancelled) {
          setUsers(result.users);
        }
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [loadedProjectContext]);

  useEffect(() => {
    if (activeCase && !projectName) setProjectName(activeCase.name);
  }, [activeCase, projectName]);

  useEffect(() => {
    if (!loadedProjectContext) return;
    setUserSelection(loadedProjectContext.userId);
    setProjectName(loadedProjectContext.projectName);
    setProjectDescription(loadedProjectContext.projectDescription);
    setSelectedProjectId(loadedProjectContext.projectId);
    setSaveTarget('existing');
  }, [loadedProjectContext]);

  useEffect(() => {
    if (saveAsNewProject || isCreatingUser || !ownerUserId) {
      setProjects([]);
      setProjectLoadState('idle');
      setProjectLoadError('');
      return;
    }
    let cancelled = false;
    setProjectLoadState('loading');
    setProjectLoadError('');
    fetch(`/api/users/${ownerUserId}/projects`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await getApiError(response));
        return response.json() as Promise<{ projects: ReviewProject[] }>;
      })
      .then((result) => {
        if (cancelled) return;
        setProjects(result.projects);
        setSelectedProjectId((current) => result.projects.some((project) => project.id === current) ? current : '');
        setProjectLoadState('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setProjects([]);
        setSelectedProjectId('');
        setProjectLoadState('error');
        setProjectLoadError(error instanceof Error ? error.message : 'Projects could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [ownerUserId, isCreatingUser, saveAsNewProject]);

  const summary = useMemo(() => {
    if (!activeCase) return null;
    const levels = activeCase.levels.map((level) => ({
      ...level,
      count: activeCase.overlays.data.filter((object) => object.level_id === level.id).length,
    }));
    const sectors = activeCase.sectors.map((sector) => ({
      ...sector,
      count: activeCase.overlays.data.filter((object) => object.sector_id === sector.id).length,
    }));
    const loops = activeCase.overlays.loops.map((loop) => {
      const segments = activeCase.overlays.connectivity
        .filter((connection) => connection.loop_id === loop.id)
        .sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
      const objectIds = new Set(segments.flatMap((segment) => [segment.source_object_id, segment.target_object_id]));
      const objects = activeCase.overlays.data.filter((object) => objectIds.has(object.id));
      return {
        ...loop,
        segmentCount: segments.length,
        levels: Array.from(new Set(objects.map((object) => activeCase.levels.find((level) => level.id === object.level_id)?.name || object.level_id))),
        sectors: Array.from(new Set(objects.map((object) => activeCase.sectors.find((sector) => sector.id === object.sector_id)?.name || object.sector_id))),
      };
    });
    return {
      levels,
      sectors,
      loops,
      dataCount: activeCase.overlays.data.length,
      segmentCount: activeCase.overlays.connectivity.length,
    };
  }, [activeCase]);

  if (!activeCase || !summary) return null;
  if (isWalkthroughPanelCollapsed) return <CollapsedWalkthroughRail />;

  const selectedUser = users.find((user) => user.id === ownerUserId);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const activeUserName = isCreatingUser ? newUserName.trim() : selectedUser?.displayName || loadedProjectContext?.userName || '';
  const snapshot = {
    format: 'manufacturing-data-pyramid-v2' as const,
    schemaVersion: 1 as const,
    case: activeCase,
  };

  const inspectConnections = (view: '3d' | '2d') => {
    setConnectionsView(view);
    setWalkthroughStage('connections');
  };

  const chooseSaveTarget = (target: SaveTarget) => {
    setSaveTarget(target);
    setSaveState({ status: 'idle' });
    if (target === 'existing') {
      if (loadedProjectContext) {
        setUserSelection(loadedProjectContext.userId);
        setSelectedProjectId(loadedProjectContext.projectId);
      } else if (userSelection === '__new__') {
        setUserSelection('');
      }
    } else if (!userSelection && users.length === 0) {
      setUserSelection('__new__');
    }
  };

  const chooseExistingUser = (userId: string) => {
    setUserSelection(userId);
    setSelectedProjectId('');
    setProjects([]);
    setProjectLoadState(userId ? 'loading' : 'idle');
    setProjectLoadError('');
    setSaveState({ status: 'idle' });
  };

  const saveProject = async (branchAsNewProject = saveAsNewProject) => {
    if (!branchAsNewProject && (!ownerUserId || !selectedProjectId)) {
      setSaveState({ status: 'error', message: 'Choose a user and existing project before saving a new version.' });
      return;
    }
    if (branchAsNewProject && !activeUserName) {
      setSaveState({ status: 'error', message: 'Choose an existing user or enter a new user name.' });
      return;
    }
    if (branchAsNewProject && !projectName.trim()) {
      setSaveState({ status: 'error', message: 'Enter a project name before saving.' });
      return;
    }
    setSaveState({ status: 'saving' });
    try {
      const savingToExistingProject = !branchAsNewProject;
      const response = await fetch(savingToExistingProject
        ? `/api/projects/${selectedProjectId}/versions`
        : '/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savingToExistingProject
          ? { creatorUserId: ownerUserId, versionNote: versionNote.trim(), snapshot }
          : {
            ...(ownerUserId ? { ownerUserId } : { userName: activeUserName }),
            projectName: projectName.trim(),
            description: projectDescription.trim(),
            versionNote: versionNote.trim(),
            snapshot,
          }),
      });
      if (!response.ok) throw new Error(await getApiError(response));
      const saved = await response.json() as {
        project: { id: string; ownerUserId: string; name: string; description: string; updatedAt: string };
        version: { id: string; versionNumber: number; createdAt: string; snapshot: unknown };
      };
      const verified = jsonStructurallyEqual(saved.version.snapshot, snapshot);
      if (!verified) throw new Error('The saved version returned a different snapshot and was not loaded into the current project context.');
      const nextUserName = selectedUser?.displayName || activeUserName;
      setLoadedProjectContext({
        userId: saved.project.ownerUserId,
        userName: nextUserName,
        projectId: saved.project.id,
        projectName: saved.project.name,
        projectDescription: saved.project.description,
        sourceVersionId: saved.version.id,
        sourceVersionNumber: saved.version.versionNumber,
        latestVersionNumber: saved.version.versionNumber,
      });
      setSaveTarget('existing');
      setUserSelection(saved.project.ownerUserId);
      setSelectedProjectId(saved.project.id);
      setProjects((current) => [
        saved.project,
        ...current.filter((project) => project.id !== saved.project.id),
      ]);
      setProjectLoadState('ready');
      setProjectLoadError('');
      setProjectName(saved.project.name);
      setProjectDescription(saved.project.description);
      setSaveState({
        status: 'success',
        userName: nextUserName,
        projectName: saved.project.name,
        versionNumber: saved.version.versionNumber,
        savedAt: saved.version.createdAt,
        verified,
      });
    } catch (error) {
      setSaveState({ status: 'error', message: error instanceof Error ? error.message : 'The project could not be saved.' });
    }
  };

  return (
    <div data-walkthrough-panel className="pointer-events-auto absolute inset-y-4 right-4 z-20 flex w-[min(760px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-emerald-400/20 bg-[#070b14]/95 shadow-2xl backdrop-blur-xl md:inset-y-6 md:right-6">
       <header className="shrink-0 border-b border-emerald-400/20 bg-emerald-400/10 p-5">
         <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/75">Walkthrough / Review &amp; Save</p>
            <h2 className="mt-1 text-xl font-bold text-emerald-100">Review your complete pyramid</h2>
            <p className="mt-1 text-xs leading-relaxed text-emerald-100/65">Confirm the project summary, then save an immutable version to PostgreSQL.</p>
          </div>
           <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
             <OpenProjectButton />
             <RestartWalkthroughButton />
             <button onClick={fitWalkthroughView} className="flex items-center gap-1.5 rounded border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-300/20"><Maximize2 size={13} /> Fit 3D View</button>
             <button onClick={() => setWalkthroughPanelCollapsed(true)} title="Collapse Panel" aria-label="Collapse Panel" className="flex h-8 w-8 items-center justify-center rounded border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"><PanelRightClose size={15} /></button>
           </div>
        </div>
      </header>
      <Progress currentStage={4} completedStages={[0, 1, 2, 3]} />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4">
            <p className="text-sm font-bold text-emerald-50">
              {summary.levels.length} levels · {summary.sectors.length} sectors · {summary.dataCount} data elements · {summary.loops.length} loops · {summary.segmentCount} connection segments
            </p>
            <p className="mt-1 text-[11px] text-emerald-100/65">Grid {activeCase.grid.width} × {activeCase.grid.height}</p>
          </div>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200/80">Project review</p>
                <p className="mt-1 text-[10px] text-muted-foreground">The snapshot includes stable IDs, metadata, canonical grid positions, loops, and ordered segments.</p>
              </div>
              <Database size={17} className="text-emerald-300/75" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Levels · {summary.levels.length}</p>
                <div className="space-y-1 text-xs text-foreground">{summary.levels.map((level) => <p key={level.id} className="flex justify-between gap-3"><span>{level.index + 1}. {level.name}</span><span className="font-mono text-cyan-200/70">{level.count}</span></p>)}</div>
              </div>
              <div className="rounded border border-white/10 bg-white/[0.03] p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sectors · {summary.sectors.length}</p>
                <div className="space-y-1 text-xs text-foreground">{summary.sectors.map((sector) => <p key={sector.id} className="flex justify-between gap-3"><span>{sector.index + 1}. {sector.name}</span><span className="font-mono text-cyan-200/70">{sector.count}</span></p>)}</div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200/80">Loops and ordered paths</p>
            {summary.loops.length === 0 ? (
              <p className="rounded border border-white/10 bg-black/20 p-3 text-[11px] text-muted-foreground">No loops or connection segments were created. This pyramid can still be saved.</p>
            ) : (
              <div className="space-y-2">
                {summary.loops.map((loop) => <div key={loop.id} className="rounded border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-foreground"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: loop.color }} />{loop.name}</p><span className="font-mono text-[10px] text-muted-foreground">{loop.segmentCount} segment{loop.segmentCount === 1 ? '' : 's'}</span></div>
                  <p className="mt-1 text-[10px] text-muted-foreground">Levels: {loop.levels.join(', ') || '—'} · Sectors: {loop.sectors.join(', ') || '—'}</p>
                </div>)}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200/80">Inspect visualisations</p><p className="mt-1 text-[10px] text-muted-foreground">Return to the existing views without creating another editing surface.</p></div>
              <div className="flex gap-2">
                <button onClick={() => inspectConnections('3d')} className="rounded border border-indigo-300/25 bg-indigo-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-100 hover:bg-indigo-300/20">3D view</button>
                <button onClick={() => inspectConnections('2d')} className="rounded border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-100 hover:bg-cyan-300/20">2D Cross-Section</button>
              </div>
            </div>
          </section>

           <section className="rounded-xl border border-white/10 bg-black/20 p-4">
             <div className="mb-3">
               <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200/80">Save destination</p>
               <p className="mt-1 text-[10px] text-muted-foreground">Choose whether this snapshot becomes the next version of an existing project or starts a separate project history.</p>
             </div>
             <div className="mb-4 grid gap-2 sm:grid-cols-2">
               <button type="button" onClick={() => chooseSaveTarget('existing')} aria-pressed={!saveAsNewProject} className={`rounded border p-3 text-left transition ${!saveAsNewProject ? 'border-emerald-300/45 bg-emerald-300/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                 <p className="text-xs font-bold text-foreground">Save to Existing Project</p>
                 <p className="mt-1 text-[10px] text-muted-foreground">Create the next immutable version in an existing project history.</p>
               </button>
               <button type="button" onClick={() => chooseSaveTarget('new')} aria-pressed={saveAsNewProject} className={`rounded border p-3 text-left transition ${saveAsNewProject ? 'border-emerald-300/45 bg-emerald-300/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
                 <p className="text-xs font-bold text-foreground">Save As New Project</p>
                 <p className="mt-1 text-[10px] text-muted-foreground">Create a separate project starting at version 1.</p>
               </button>
             </div>
             {!saveAsNewProject ? (
               <div className="grid gap-3 sm:grid-cols-2">
                 <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">User
                   <select value={ownerUserId} onChange={(event) => chooseExistingUser(event.target.value)} disabled={saveState.status === 'saving' || users.length === 0} className="mt-1 w-full rounded border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-foreground outline-none focus:border-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50">
                     <option value="">{users.length === 0 ? 'No existing users' : 'Select user'}</option>
                     {users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
                   </select>
                 </label>
                 <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Project
                   <select value={selectedProjectId} onChange={(event) => { setSelectedProjectId(event.target.value); setSaveState({ status: 'idle' }); }} disabled={!ownerUserId || projectLoadState !== 'ready' || saveState.status === 'saving'} className="mt-1 w-full rounded border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-foreground outline-none focus:border-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50">
                     <option value="">{projectLoadState === 'loading' ? 'Loading projects…' : projectLoadState === 'error' ? 'Projects unavailable' : projects.length === 0 ? 'No projects available' : 'Select project'}</option>
                     {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                   </select>
                 </label>
                 {projectLoadState === 'error' && <p className="sm:col-span-2 rounded border border-rose-300/25 bg-rose-400/10 p-3 text-[10px] text-rose-100">{projectLoadError || 'Projects could not be loaded.'}</p>}
                 {projectLoadState === 'ready' && ownerUserId && projects.length === 0 && <p className="sm:col-span-2 rounded border border-white/10 bg-black/20 p-3 text-[10px] text-muted-foreground">This user has no saved projects yet. Choose Save As New Project to create one.</p>}
                 {selectedProject && <div className="sm:col-span-2 rounded border border-emerald-300/15 bg-emerald-300/5 p-3 text-[10px] text-emerald-100/75"><p className="font-bold text-emerald-50">Next immutable version will be saved to {selectedProject.name}</p><p className="mt-1">{selectedProject.description || 'No project description.'}</p></div>}
                 <div className="sm:col-span-2"><Field label="Version note (optional)" value={versionNote} onChange={setVersionNote} multiline /></div>
               </div>
             ) : (
               <div className="grid gap-3 sm:grid-cols-2">
                 <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">User
                    <select value={userSelection} onChange={(event) => { const value = event.target.value; setUserSelection(value); if (value !== '__new__') setNewUserName(''); setSaveState({ status: 'idle' }); }} disabled={saveState.status === 'saving'} className="mt-1 w-full rounded border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-foreground outline-none focus:border-emerald-300/60 disabled:cursor-not-allowed disabled:opacity-50">
                     <option value="">Select existing user</option>
                     {users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
                     <option value="__new__">+ New User</option>
                   </select>
                 </label>
                  {isCreatingUser && <Field label="New User Name" value={newUserName} onChange={setNewUserName} required />}
                 <Field label="New project name" value={projectName} onChange={setProjectName} required />
                 <div className="sm:col-span-2"><Field label="Project description (optional)" value={projectDescription} onChange={setProjectDescription} multiline /></div>
                 <div className="sm:col-span-2"><Field label="Version note (optional)" value={versionNote} onChange={setVersionNote} multiline /></div>
               </div>
             )}
           </section>

          {saveState.status === 'error' && <div className="flex items-start gap-2 rounded border border-rose-300/25 bg-rose-400/10 p-3 text-xs text-rose-100"><AlertCircle size={15} className="mt-0.5 shrink-0" /> <span>{saveState.message} Your local working draft is unchanged.</span></div>}
          {saveState.status === 'success' && <div className="rounded border border-emerald-300/25 bg-emerald-400/10 p-3 text-xs text-emerald-100"><p className="font-bold">Saved successfully</p><p className="mt-1">{saveState.userName} / {saveState.projectName} / v{saveState.versionNumber}</p><p className="mt-1 text-emerald-100/70">{new Date(saveState.savedAt).toLocaleString()} · {saveState.verified ? 'Exact retrieval verified' : 'Saved, but exact retrieval verification could not complete'}</p></div>}
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#07111c] px-5 py-3">
         <div className="flex flex-wrap items-center gap-2">
           <button onClick={() => setWalkthroughStage('connections')} className="flex items-center gap-1.5 rounded border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/20"><ChevronLeft size={14} /> Back to Connections</button>
         </div>
          <button onClick={() => saveProject(saveAsNewProject)} disabled={saveState.status === 'saving' || (saveAsNewProject ? !activeUserName || !projectName.trim() : !ownerUserId || !selectedProjectId || projectLoadState !== 'ready')} className="flex items-center gap-1.5 rounded bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"><Save size={14} /> {saveState.status === 'saving' ? 'Saving…' : saveAsNewProject ? 'Save as New Project' : 'Save New Version'}</button>
      </footer>
    </div>
  );
}

export function WalkthroughUI() {
  const activeCase = useV2Store((state) => state.activeCase);
  const isEditingStructure = useV2Store((state) => state.isEditingStructure);
  const walkthroughStage = useV2Store((state) => state.walkthroughStage);
  const connectionsView = useV2Store((state) => state.connectionsView);
  const isWalkthroughPanelCollapsed = useV2Store((state) => state.isWalkthroughPanelCollapsed);
  const setWalkthroughPanelCollapsed = useV2Store((state) => state.setWalkthroughPanelCollapsed);
  const previousConnectionsView = useRef<'3d' | '2d' | null>(null);
  useEffect(() => {
    if (walkthroughStage === 'connections' && connectionsView === '2d' && previousConnectionsView.current !== '2d') {
      setWalkthroughPanelCollapsed(true);
    }
    previousConnectionsView.current = connectionsView;
  }, [connectionsView, setWalkthroughPanelCollapsed, walkthroughStage]);
  const currentStage = activeCase && !isEditingStructure
    ? walkthroughStage === 'save' ? 4 : walkthroughStage === 'connections' ? 3 : walkthroughStage === 'visualise' ? 2 : 1
    : 0;
  const isTwoDConnections = walkthroughStage === 'connections' && activeCase && !isEditingStructure && connectionsView === '2d';
  return (
    <div className={`absolute inset-0 z-20 pointer-events-none ${isTwoDConnections ? 'p-4 md:p-6' : 'flex items-center justify-end p-4 md:p-6'}`}>
      <SavedProjectBrowser />
      {walkthroughStage === 'data' && activeCase && !isEditingStructure
        ? <DataBoard />
        : walkthroughStage === 'visualise' && activeCase && !isEditingStructure
          ? <VisualiseStage />
          : walkthroughStage === 'connections' && activeCase && !isEditingStructure
            ? isTwoDConnections
              ? <div className={`pointer-events-auto grid h-full min-h-0 w-full gap-3 ${isWalkthroughPanelCollapsed ? 'grid-rows-[minmax(0,1fr)_44px] md:grid-cols-[minmax(0,1fr)_44px] md:grid-rows-1' : 'grid-rows-[minmax(280px,1fr)_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(360px,760px)] md:grid-rows-1'}`}><V2CrossSection /><ConnectionsStage embedded /></div>
              : <ConnectionsStage />
          : walkthroughStage === 'save' && activeCase && !isEditingStructure
            ? <ReviewSaveStage />
             : isWalkthroughPanelCollapsed
               ? <CollapsedWalkthroughRail />
               : <div data-walkthrough-panel className="pointer-events-auto flex h-[calc(100dvh-7rem)] w-full max-w-[440px] flex-col overflow-hidden rounded-xl border border-indigo-400/20 bg-[#070b14]/95 shadow-2xl backdrop-blur-xl"><div className="flex flex-wrap shrink-0 items-start justify-between gap-3 border-b border-indigo-400/20 bg-indigo-400/10 p-5"><div><h2 className="flex items-center gap-2 text-xl font-bold text-indigo-100"><GraduationCap className="text-indigo-300" /> Walkthrough</h2><p className="mt-1 text-sm text-indigo-100/65">Define your manufacturing data strategy step by step.</p></div><div className="flex flex-wrap items-center justify-end gap-2"><OpenProjectButton /><RestartWalkthroughButton compact={false} /><FitWalkthroughViewButton compact /><button onClick={() => setWalkthroughPanelCollapsed(true)} title="Collapse Panel" aria-label="Collapse Panel" className="flex h-9 w-9 items-center justify-center rounded border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"><PanelRightClose size={15} /></button></div></div><Progress currentStage={currentStage} /><div className="min-h-0 flex-1 overflow-y-auto p-5"><StructureStage /></div></div>}
    </div>
  );
}