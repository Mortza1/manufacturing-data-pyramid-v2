import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Edit2, Eye, EyeOff, Lock, Wand2, GraduationCap, Grid3X3, Link2, Plus, SkipForward, Trash2, Move, Maximize2, Minimize2, RotateCcw, X } from 'lucide-react';
import { useV2Store, EMPTY_DATA_DRAFT, getWalkthroughLevelName, type V2ConnectionDraft, type V2DataDensity, type V2DataDraft, type V2MetadataPatch } from '../store';
import { getSectorIdForGridCell } from '../geometry';

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

function StructureStage() {
  const {
    draft, setDraftLevels, setDraftSectors, confirmStructure, activeCase,
    reopenStructure, autoFillLevelNames, setAutoFillLevelNames, isEditingStructure,
    setWalkthroughStage, showV2Labels, setShowV2Labels,
  } = useV2Store();
  const confirmed = activeCase !== null && !isEditingStructure;

  const autoFillSectors = () => setDraftSectors(
    draft.sectors.length === 4
      ? ['Product', 'Resources', 'Machines', 'People'].map((name, index) => ({ id: draft.sectors[index]?.id, name }))
      : draft.sectors.map((sector, index) => ({ id: sector.id, name: `Sector ${index + 1}` })),
  );

  const updateLevelCount = (nextCount: number) => {
    if (nextCount < 1 || nextCount > 8) return;
    const next = Array.from({ length: nextCount }, (_, index) => draft.levels[index] || { name: getWalkthroughLevelName(index, nextCount) });
    setDraftLevels(autoFillLevelNames
      ? next.map((level, index) => ({ ...level, name: getWalkthroughLevelName(index, nextCount) }))
      : next);
  };

  const updateSectorCount = (nextCount: number) => {
    if (nextCount < 3 || nextCount > 8) return;
    setDraftSectors(Array.from({ length: nextCount }, (_, index) => draft.sectors[index] || { name: `Sector ${index + 1}` }));
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

function DataEditor({ levelId, sectorId, gridX, gridY, onClose }: { levelId: string; sectorId: string; gridX: number; gridY: number; onClose: () => void }) {
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
        <div className="mb-4 flex items-start justify-between"><div><h3 className="text-lg font-bold text-cyan-100">Add data element</h3><p className="mt-1 text-xs text-muted-foreground">Placed at cell ({gridX + 1}, {gridY + 1}).</p></div><button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button></div>
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
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded border border-white/10 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5">Cancel</button><button type="submit" className="rounded bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300">Add to board</button></div>
      </form>
    </div>
  );
}

function DataBoard() {
  const { activeCase, dataLevelIndex, setDataLevelIndex, skippedLevelIds, skipDataLevel, autoFillDataLevel, dataAutoFillNotice, clearDataLevel, moveDataObject, removeDataObject, setWalkthroughStage, reopenStructure, selectedVisualiseObjectId } = useV2Store();
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(selectedVisualiseObjectId);
  const [editorCell, setEditorCell] = useState<{ x: number; y: number; sectorId: string } | null>(null);
  const [placementMode, setPlacementMode] = useState<'add' | 'move' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => {
    if (selectedVisualiseObjectId) setSelectedObjectId(selectedVisualiseObjectId);
  }, [selectedVisualiseObjectId]);
  if (!activeCase) return null;
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
    if (placementMode === 'add') setEditorCell({ x, y, sectorId });
  };

  const autoFill = () => autoFillDataLevel(level.id);
  const goNext = () => setDataLevelIndex(Math.min(activeCase.levels.length - 1, dataLevelIndex + 1));
  const goPrevious = () => setDataLevelIndex(Math.max(0, dataLevelIndex - 1));

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex flex-col overflow-hidden bg-[#050912]/98 text-foreground">
      {editorCell && <DataEditor levelId={level.id} sectorId={editorCell.sectorId} gridX={editorCell.x} gridY={editorCell.y} onClose={() => setEditorCell(null)} />}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-cyan-300/15 bg-[#07131f] px-5 py-4">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">Walkthrough / Data</p><h2 className="mt-1 text-xl font-bold text-cyan-50">Add data to {level.name}</h2><p className="mt-1 text-xs text-muted-foreground">One level at a time · {activeCase.grid.width}×{activeCase.grid.height} sector-aware snap grid</p></div>
        <div className="flex flex-wrap gap-2">
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-cyan-100">Top-down cross-section</p><p className="text-[11px] text-muted-foreground">Click a free cell to place. Select an item, then choose Move to reposition it.</p></div><span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-mono text-muted-foreground">{objects.length} placed</span></div>
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
                  placeAt(cell.x, cell.y);
                };
                return <button key={key} onPointerDown={() => { setIsDragging(true); selectOrPlace(); }} onPointerEnter={() => { if (isDragging && !item) placeAt(cell.x, cell.y); }} onPointerUp={() => setIsDragging(false)} onClick={selectOrPlace} className={`relative min-h-[42px] border border-white/10 p-1 text-left transition-colors ${rightBoundary ? 'border-r-cyan-200/50' : ''} ${bottomBoundary ? 'border-b-cyan-200/50' : ''} ${item ? selected ? 'bg-cyan-300/35 ring-2 ring-inset ring-cyan-200' : 'bg-amber-300/20' : 'bg-emerald-300/[0.04] hover:bg-cyan-300/15'}`} title={`${activeCase.sectors[sectorIndex]?.name || 'Sector'} · cell ${cell.x + 1}, ${cell.y + 1}`}>
                  <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'][sectorIndex % 8] }} />
                  {item && <span className="mt-1 block truncate text-[9px] font-bold text-amber-50">{item.name}</span>}
                </button>;
              })}
            </div>
            <div className="mx-auto mt-3 flex max-w-[620px] flex-wrap gap-3 text-[10px] text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-300/50" />Free</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-300/60" />Occupied</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-300" />Selected</span>{activeCase.sectors.map((sector, index) => <span key={sector.id}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'][index % 8] }} />{sector.name}</span>)}</div>
          </section>
          <aside className="space-y-4">
             <div className="rounded-xl border border-white/10 bg-[#08111d] p-4"><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/80">Placement</p><div className="grid gap-2"><button onClick={() => { setPlacementMode('add'); setSelectedObjectId(null); }} className={`flex items-center justify-center gap-2 rounded border px-3 py-2.5 text-xs font-bold ${placementMode === 'add' ? 'border-cyan-200 bg-cyan-300/20 text-cyan-100' : 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20'}`}><Plus size={14} /> Add data manually</button><button onClick={() => { if (selectedObjectId) setPlacementMode('move'); }} disabled={!selectedObjectId} className="flex items-center justify-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"><Move size={14} /> Move selected</button><button onClick={autoFill} className="flex items-center justify-center gap-2 rounded border border-indigo-300/25 bg-indigo-300/10 px-3 py-2.5 text-xs font-semibold text-indigo-100 hover:bg-indigo-300/20"><Wand2 size={14} /> Auto-fill free cells</button><button onClick={() => { if (window.confirm(`Clear all data from ${level.name}? This removes manual and auto-filled entries on this level.`)) { clearDataLevel(level.id); setSelectedObjectId(null); setPlacementMode(null); } }} className="flex items-center justify-center gap-2 rounded border border-rose-300/25 bg-rose-400/10 px-3 py-2.5 text-xs font-semibold text-rose-100 hover:bg-rose-400/20"><Trash2 size={14} /> Clear Current Level</button></div><p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Auto-fill adds two representative data elements per sector where free cells allow. It never overwrites manual entries.</p>{dataAutoFillNotice && <p className="mt-3 rounded border border-amber-300/20 bg-amber-300/5 px-2.5 py-2 text-[10px] leading-relaxed text-amber-100/80">{dataAutoFillNotice}</p>}</div>
            <div className="rounded-xl border border-white/10 bg-[#08111d] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/80">Sector key</p><Grid3X3 size={15} className="text-cyan-300/70" /></div><div className="space-y-2">{activeCase.sectors.map((sector, index) => <div key={sector.id} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15', '#2dd4bf', '#818cf8'][index % 8] }} />{sector.name}</div>)}</div></div>
            {selectedObject && <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] uppercase tracking-wider text-cyan-200/65">Selected data</p><h3 className="mt-1 text-sm font-bold text-cyan-50">{selectedObject.name}</h3></div><button onClick={() => { removeDataObject(selectedObject.id); setSelectedObjectId(null); }} title="Remove data" className="text-muted-foreground hover:text-rose-300"><Trash2 size={14} /></button></div><p className="mt-2 text-[11px] text-muted-foreground">Cell ({selectedObject.grid_x + 1}, {selectedObject.grid_y + 1}) · {activeCase.sectors.find((sector) => sector.id === selectedObject.sector_id)?.name}</p><p className="mt-2 line-clamp-3 text-xs text-cyan-50/70">{selectedObject.description || 'No description provided.'}</p></div>}
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
    setDataLevelIndex,
    updateDataObjectMetadata,
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
    setVisualiseSurfaceOpacity(0.72);
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

  return (
    <div className="pointer-events-auto absolute inset-y-4 right-4 z-20 flex w-[min(460px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-indigo-400/20 bg-[#070b14]/95 shadow-2xl backdrop-blur-xl md:inset-y-6 md:right-6">
      <div className="shrink-0 border-b border-indigo-400/20 bg-indigo-400/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-300/75">Walkthrough / Visualise</p>
            <h2 className="mt-1 text-xl font-bold text-indigo-100">Review your pyramid</h2>
            <p className="mt-1 text-xs leading-relaxed text-indigo-100/65">Explore the configured frame and inspect each placed data element.</p>
          </div>
          <button onClick={() => setWalkthroughStage('data')} className="shrink-0 rounded border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-300/20">Back to Data</button>
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

function ConnectionsStage() {
  const {
    activeCase,
    setWalkthroughStage,
    connectionSourceObjectId,
    connectionTargetObjectId,
    selectedConnectionId,
    connectionLoopFilter,
    setConnectionLoopFilter,
    connectionArrowThickness,
    setConnectionArrowThickness,
    selectConnection,
    clearConnectionSelection,
    createConnection,
    updateConnection,
    deleteConnection,
    addExampleConnections,
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
  const [draft, setDraft] = useState<V2ConnectionDraft>({
    label: '',
    description: '',
    loop: '',
    color: '#67e8f9',
  });
  const [notice, setNotice] = useState<string | null>(null);

  const selectedConnection = activeCase?.overlays.connectivity.find((connection) => connection.id === selectedConnectionId);
  const source = activeCase?.overlays.data.find((object) => object.id === connectionSourceObjectId);
  const target = activeCase?.overlays.data.find((object) => object.id === connectionTargetObjectId);
  const loops = Array.from(new Set(activeCase?.overlays.connectivity.map((connection) => connection.loop).filter(Boolean) || []));
  const visibleObjectIds = useMemo(() => {
    if (!activeCase) return new Set<string>();
    const visible = new Set<string>();
    activeCase.levels.forEach((level) => {
      const levelObjects = activeCase.overlays.data.filter((object) => object.level_id === level.id);
      const ordered = visualiseDataDensity === 'all'
        ? levelObjects
        : [...levelObjects]
          .sort((a, b) => a.grid_y - b.grid_y || a.grid_x - b.grid_x || a.id.localeCompare(b.id))
          .filter((object, index, objects) => {
            const sameSectorBefore = objects.slice(0, index).filter((candidate) => candidate.sector_id === object.sector_id).length;
            return sameSectorBefore < visualiseDataDensity;
          });
      ordered.forEach((object) => {
        if ((visualiseOnlyLevelId === null || visualiseOnlyLevelId === level.id) && !visualiseHiddenSectorIds.includes(object.sector_id)) {
          visible.add(object.id);
        }
      });
    });
    return visible;
  }, [activeCase, visualiseDataDensity, visualiseOnlyLevelId, visualiseHiddenSectorIds]);

  useEffect(() => {
    if (selectedConnection) {
      setDraft({
        label: selectedConnection.label,
        description: selectedConnection.description,
        loop: selectedConnection.loop,
        color: selectedConnection.color,
      });
    } else {
      setDraft({ label: '', description: '', loop: '', color: '#67e8f9' });
    }
  }, [selectedConnectionId]);

  if (!activeCase) return null;

  const objectContext = (object: typeof source) => {
    if (!object) return null;
    const level = activeCase.levels.find((item) => item.id === object.level_id);
    const sector = activeCase.sectors.find((item) => item.id === object.sector_id);
    return {
      object,
      levelName: level?.name || object.level_id,
      sectorName: sector?.name || object.sector_id,
    };
  };
  const sourceContext = objectContext(source);
  const targetContext = objectContext(target);
  const submitConnection = () => {
    if (!source || !target) {
      setNotice('Select a source and a different target in the pyramid first.');
      return;
    }
    const result = selectedConnectionId
      ? updateConnection(selectedConnectionId, draft)
      : createConnection(draft);
    if (!result && !selectedConnectionId) {
      setNotice('That source-to-target connection already exists, or the connection details are incomplete.');
      return;
    }
    setNotice(selectedConnectionId ? 'Connection updated.' : 'Connection created.');
  };
  const startNewConnection = () => {
    clearConnectionSelection();
    setNotice(null);
  };
  const removeSelectedConnection = () => {
    if (!selectedConnectionId || !window.confirm('Delete this connection? The endpoint data objects will remain unchanged.')) return;
    deleteConnection(selectedConnectionId);
    setNotice('Connection deleted.');
  };
  const generateExamples = () => {
    const count = addExampleConnections(Array.from(visibleObjectIds));
    setNotice(count > 0 ? `Added ${count} example connection${count === 1 ? '' : 's'}.` : 'No new example connections were available from the currently visible objects.');
  };

  return (
    <div className="pointer-events-auto absolute inset-y-4 right-4 z-20 flex w-[min(760px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-indigo-400/20 bg-[#070b14]/95 shadow-2xl backdrop-blur-xl md:inset-y-6 md:right-6">
      <header className="shrink-0 border-b border-indigo-400/20 bg-indigo-400/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-300/75">Walkthrough / Connections</p>
            <h2 className="mt-1 text-xl font-bold text-indigo-100">Map the data flow</h2>
            <p className="mt-1 text-xs leading-relaxed text-indigo-100/65">Select visible data objects directly in the pyramid, then define a directional relationship.</p>
          </div>
          <Link2 size={22} className="mt-1 shrink-0 text-indigo-200/70" />
        </div>
      </header>
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
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Guided connection</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Select Source → Select Target → Configure → Create</p>
              </div>
              <button onClick={startNewConnection} className="rounded border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">Clear Selection</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[{ label: 'Source', context: sourceContext, accent: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-50' }, { label: 'Target', context: targetContext, accent: 'border-amber-300/40 bg-amber-300/10 text-amber-50' }].map(({ label, context, accent }) => (
                <div key={label} className={`rounded-lg border p-3 ${context ? accent : 'border-white/10 bg-white/[0.02]'}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  {context ? (
                    <>
                      <p className="mt-1 truncate text-xs font-bold">{context.object.name}</p>
                      <p className="mt-1 text-[10px] opacity-75">L{(activeCase.levels.find((item) => item.id === context.object.level_id)?.index ?? 0) + 1} · {context.levelName}</p>
                      <p className="text-[10px] opacity-75">{context.sectorName} · cell ({context.object.grid_x + 1}, {context.object.grid_y + 1})</p>
                    </>
                  ) : <p className="mt-2 text-[11px] text-muted-foreground">Click a visible data object in the 3D view.</p>}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 rounded border border-white/10 bg-black/25 px-3 py-2 text-xs font-bold text-indigo-100">
              <span className="truncate">{source?.name || 'Source Data'}</span>
              <ArrowRight size={15} className="shrink-0 text-indigo-300" />
              <span className="truncate">{target?.name || 'Target Data'}</span>
            </div>
            {source && target && (
              <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Connection label / name" value={draft.label} onChange={(value) => setDraft((current) => ({ ...current, label: value }))} required />
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Loop / group
                    <input list="v2-connection-loops" value={draft.loop} onChange={(event) => setDraft((current) => ({ ...current, loop: event.target.value }))} placeholder="e.g. Quality flow" className="mt-1 w-full rounded border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-foreground outline-none focus:border-cyan-300/60" />
                    <datalist id="v2-connection-loops">{loops.map((loop) => <option key={loop} value={loop} />)}</datalist>
                  </label>
                </div>
                <Field label="Optional description / note" value={draft.description} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} multiline />
                <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Arrow colour
                  <input aria-label="Arrow colour" type="color" value={draft.color} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} className="h-7 w-10 cursor-pointer rounded border border-white/10 bg-transparent p-0.5" />
                  <span className="font-mono normal-case text-muted-foreground/70">{draft.color}</span>
                </label>
                <div className="flex flex-wrap justify-end gap-2">
                  {selectedConnectionId && <button onClick={removeSelectedConnection} className="rounded border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-400/20">Delete Connection</button>}
                  <button onClick={submitConnection} className="rounded bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300">{selectedConnectionId ? 'Update Connection' : 'Create Connection'}</button>
                </div>
              </div>
            )}
            {notice && <p className="mt-3 rounded border border-indigo-300/20 bg-indigo-300/5 px-2.5 py-2 text-[10px] leading-relaxed text-indigo-100/80">{notice}</p>}
          </section>

          <section className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Connection display</p>
              <button onClick={generateExamples} className="rounded border border-indigo-300/25 bg-indigo-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-100 hover:bg-indigo-300/20"><Wand2 size={12} className="mr-1 inline" /> Add Example Connections</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">Arrow thickness</span>
              <input aria-label="Arrow thickness" type="range" min="0.7" max="1.8" step="0.05" value={connectionArrowThickness} onChange={(event) => setConnectionArrowThickness(Number(event.target.value))} className="w-full accent-indigo-300" />
              <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">{Math.round(connectionArrowThickness * 100)}%</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Loop filter</span>
              {['all', ...loops].map((loop) => <button key={loop} onClick={() => setConnectionLoopFilter(loop)} className={`rounded border px-2 py-1 text-[10px] font-semibold ${connectionLoopFilter === loop ? 'border-indigo-300/60 bg-indigo-300/20 text-indigo-100' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}>{loop === 'all' ? 'All Connections' : loop}</button>)}
            </div>
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
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-200/80">Connection table</p><p className="mt-1 text-[10px] text-muted-foreground">{activeCase.overlays.connectivity.length} stored relationship{activeCase.overlays.connectivity.length === 1 ? '' : 's'}</p></div>
              {selectedConnectionId && <button onClick={startNewConnection} className="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">Create New</button>}
            </div>
            {activeCase.overlays.connectivity.length === 0 ? (
              <p className="rounded border border-white/10 bg-black/20 p-3 text-[11px] leading-relaxed text-muted-foreground">No connections yet. Connections are optional; you can finish this stage with zero relationships.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-white/10">
                <table className="w-full min-w-[920px] text-left text-[10px]">
                  <thead className="bg-white/[0.04] uppercase tracking-wider text-muted-foreground"><tr><th className="px-2 py-2">Connection</th><th className="px-2 py-2">Loop / Group</th><th className="px-2 py-2">Source Data</th><th className="px-2 py-2">Source Level</th><th className="px-2 py-2">Source Sector</th><th className="px-2 py-2">Source Cell</th><th className="px-2 py-2">Target Data</th><th className="px-2 py-2">Target Level</th><th className="px-2 py-2">Target Sector</th><th className="px-2 py-2">Target Cell</th><th className="px-2 py-2">Direction</th><th className="px-2 py-2">Colour</th></tr></thead>
                  <tbody>
                    {activeCase.overlays.connectivity.map((connection) => {
                      const sourceObject = activeCase.overlays.data.find((object) => object.id === connection.source_object_id);
                      const targetObject = activeCase.overlays.data.find((object) => object.id === connection.target_object_id);
                      const sourceLevel = activeCase.levels.find((level) => level.id === sourceObject?.level_id);
                      const targetLevel = activeCase.levels.find((level) => level.id === targetObject?.level_id);
                      const sourceSector = activeCase.sectors.find((sector) => sector.id === sourceObject?.sector_id);
                      const targetSector = activeCase.sectors.find((sector) => sector.id === targetObject?.sector_id);
                      return <tr key={connection.id} onClick={() => selectConnection(connection.id)} className={`cursor-pointer border-t border-white/5 ${selectedConnectionId === connection.id ? 'bg-indigo-300/15' : 'hover:bg-white/[0.04]'}`}><td className="max-w-[150px] truncate px-2 py-2 font-semibold text-foreground">{connection.label}</td><td className="px-2 py-2 text-indigo-100/80">{connection.loop}</td><td className="px-2 py-2 text-cyan-100">{sourceObject?.name || 'Missing object'}</td><td className="px-2 py-2">{sourceLevel?.name || '—'}</td><td className="px-2 py-2">{sourceSector?.name || '—'}</td><td className="px-2 py-2 font-mono">({sourceObject ? sourceObject.grid_x + 1 : '—'}, {sourceObject ? sourceObject.grid_y + 1 : '—'})</td><td className="px-2 py-2 text-amber-100">{targetObject?.name || 'Missing object'}</td><td className="px-2 py-2">{targetLevel?.name || '—'}</td><td className="px-2 py-2">{targetSector?.name || '—'}</td><td className="px-2 py-2 font-mono">({targetObject ? targetObject.grid_x + 1 : '—'}, {targetObject ? targetObject.grid_y + 1 : '—'})</td><td className="px-2 py-2 text-indigo-100">Source → Target</td><td className="px-2 py-2"><span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: connection.color }} title={connection.color} /></td></tr>;
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

export function WalkthroughUI() {
  const activeCase = useV2Store((state) => state.activeCase);
  const isEditingStructure = useV2Store((state) => state.isEditingStructure);
  const walkthroughStage = useV2Store((state) => state.walkthroughStage);
  const currentStage = activeCase && !isEditingStructure
    ? walkthroughStage === 'connections' ? 3 : walkthroughStage === 'visualise' ? 2 : 1
    : 0;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-end p-4 md:p-6 pointer-events-none">
      {walkthroughStage === 'data' && activeCase && !isEditingStructure
        ? <DataBoard />
        : walkthroughStage === 'visualise' && activeCase && !isEditingStructure
          ? <VisualiseStage />
          : walkthroughStage === 'connections' && activeCase && !isEditingStructure
            ? <ConnectionsStage />
          : <div className="pointer-events-auto flex h-[calc(100dvh-7rem)] w-full max-w-[440px] flex-col overflow-hidden rounded-xl border border-indigo-400/20 bg-[#070b14]/95 shadow-2xl backdrop-blur-xl"><div className="shrink-0 border-b border-indigo-400/20 bg-indigo-400/10 p-5"><h2 className="flex items-center gap-2 text-xl font-bold text-indigo-100"><GraduationCap className="text-indigo-300" /> Walkthrough</h2><p className="mt-1 text-sm text-indigo-100/65">Define your manufacturing data strategy step by step.</p></div><Progress currentStage={currentStage} /><div className="min-h-0 flex-1 overflow-y-auto p-5"><StructureStage /></div></div>}
    </div>
  );
}