import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Check, ChevronLeft, ChevronRight, Edit2, Eye, EyeOff, Lock, Wand2, GraduationCap, Grid3X3, Plus, SkipForward, Trash2, Move } from 'lucide-react';
import { useV2Store, EMPTY_DATA_DRAFT, getWalkthroughLevelName, type V2DataDraft } from '../store';
import { getSectorIdForGridCell } from '../geometry';

const STAGES = ['Structure', 'Data', 'Visualise', 'Connections', 'Save'];

function Progress({ currentStage }: { currentStage: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-white/5 bg-black/25 px-5 py-3 [&::-webkit-scrollbar]:hidden">
      {STAGES.map((stage, idx) => {
        const active = idx === currentStage;
        const past = idx < currentStage;
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
  const { activeCase, dataLevelIndex, setDataLevelIndex, skippedLevelIds, skipDataLevel, autoFillDataLevel, dataAutoFillNotice, clearDataLevel, moveDataObject, removeDataObject, setWalkthroughStage, reopenStructure } = useV2Store();
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editorCell, setEditorCell] = useState<{ x: number; y: number; sectorId: string } | null>(null);
  const [placementMode, setPlacementMode] = useState<'add' | 'move' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
       <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#07111c] px-5 py-3"><button onClick={goPrevious} disabled={dataLevelIndex === 0} className="flex items-center gap-1.5 rounded border border-white/10 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5 disabled:opacity-30"><ChevronLeft size={14} /> Previous level</button><div className="flex gap-2"><button onClick={skipDataLevel} className="flex items-center gap-1.5 rounded border border-white/10 px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5"><SkipForward size={14} /> Skip level</button><button onClick={goNext} disabled={dataLevelIndex >= activeCase.levels.length - 1} className="flex items-center gap-1.5 rounded border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/20 disabled:opacity-30">Next level <ChevronRight size={14} /></button><button onClick={() => setWalkthroughStage('structure')} className="rounded bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300">Finish Data</button></div></footer>
    </div>
  );
}

export function WalkthroughUI() {
  const activeCase = useV2Store((state) => state.activeCase);
  const isEditingStructure = useV2Store((state) => state.isEditingStructure);
  const walkthroughStage = useV2Store((state) => state.walkthroughStage);
  const currentStage = activeCase && !isEditingStructure ? 1 : 0;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-end p-4 md:p-6 pointer-events-none">
      {walkthroughStage === 'data' && activeCase && !isEditingStructure ? <DataBoard /> : <div className="pointer-events-auto flex h-[calc(100dvh-7rem)] w-full max-w-[440px] flex-col overflow-hidden rounded-xl border border-indigo-400/20 bg-[#070b14]/95 shadow-2xl backdrop-blur-xl"><div className="shrink-0 border-b border-indigo-400/20 bg-indigo-400/10 p-5"><h2 className="flex items-center gap-2 text-xl font-bold text-indigo-100"><GraduationCap className="text-indigo-300" /> Walkthrough</h2><p className="mt-1 text-sm text-indigo-100/65">Define your manufacturing data strategy step by step.</p></div><Progress currentStage={currentStage} /><div className="min-h-0 flex-1 overflow-y-auto p-5"><StructureStage /></div></div>}
    </div>
  );
}