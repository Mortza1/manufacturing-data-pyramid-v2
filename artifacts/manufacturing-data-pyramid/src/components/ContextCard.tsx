import React from 'react';
import { useStore } from '../store';
import { CategoryIcon, CategoryColor } from './LibraryPanel';
import { Trash2, X, Network, Pencil, Save } from 'lucide-react';
import { COURSES, DataObject, FORGING_LEVELS, FORGING_SECTOR_COLORS, FORGING_SECTOR_LABELS, ForgingSector, LEVEL_CONTEXTS } from '../data';

export function ContextCard() {
  const {
    selectedObjectId,
    selectedRelationshipId,
    selectedLevelId,
    placedObjects,
    removeObject,
    setSelectedObjectId,
    setSelectedRelationshipId,
    setSelectedLevelId,
    courseMode,
    presentationMode,
    journeyActive,
    focusLevel,
    setFocusLevel,
    isolateLevel,
    setIsolateLevel,
    levelNames,
    forgingCaseStudy,
    forgingObjects,
    forgingLoops,
    setForgingObject,
    removeForgingObject,
  } = useStore();

  if (forgingCaseStudy) {
    if (selectedRelationshipId) {
      const loop = forgingLoops.find((candidate) => candidate.relationships.some((relationship) => relationship.id === selectedRelationshipId));
      const relationship = loop?.relationships.find((candidate) => candidate.id === selectedRelationshipId);
      if (!loop || !relationship) return null;
      const source = forgingObjects.find((object) => object.id === relationship.sourceId);
      const target = forgingObjects.find((object) => object.id === relationship.targetId);
      return (
        <div className="pointer-events-auto absolute right-4 top-24 z-20 flex w-72 max-w-[85vw] flex-col rounded-lg border border-primary/40 bg-card/95 shadow-2xl backdrop-blur-xl md:w-80">
          <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-muted/30 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-primary"><Network size={16} /> {loop.name}</h3>
            <button onClick={() => setSelectedRelationshipId(null)} className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="space-y-3 p-4 text-xs">
            <div className="rounded bg-secondary/50 p-2 font-mono text-muted-foreground">
              <div><span className="font-semibold text-foreground">From:</span> {source?.name ?? 'Unknown source'}</div>
              <div><span className="font-semibold text-foreground">To:</span> {target?.name ?? 'Unknown target'}</div>
            </div>
            <p className="leading-relaxed text-foreground">{relationship.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: loop.color }} />
              {loop.name}
            </div>
          </div>
        </div>
      );
    }

    if (selectedObjectId) {
      const object = forgingObjects.find((candidate) => candidate.id === selectedObjectId);
      if (!object) return null;
      return (
        <ForgingObjectCard
          object={object}
          onClose={() => setSelectedObjectId(null)}
          onSave={(patch) => setForgingObject(object.id, patch)}
          onRemove={() => removeForgingObject(object.id)}
        />
      );
    }
    return null;
  }

  if (journeyActive) return null;

  if (selectedRelationshipId) {
    const rels = COURSES[courseMode].relationships;
    const rel = rels.find(r => r.id === selectedRelationshipId);
    if (!rel) return null;
    const source = placedObjects.find(o => o.id === rel.sourceId);
    const target = placedObjects.find(o => o.id === rel.targetId);

    return (
      <div className="pointer-events-auto absolute right-4 top-24 w-72 md:w-80 max-w-[85vw] bg-card/95 backdrop-blur-xl border border-primary/50 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.15)] flex flex-col animate-in slide-in-from-right-8 z-20">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 rounded-t-lg">
          <h3 className="font-bold text-primary text-sm flex items-center gap-2"><Network size={16}/> Relationship Context</h3>
          <button onClick={() => setSelectedRelationshipId(null)} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-white/10 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-2 text-xs font-mono text-muted-foreground bg-secondary/50 p-2 rounded">
            <div><span className="text-foreground font-semibold">From:</span> {source?.name || 'Unknown source'}</div>
            <div><span className="text-foreground font-semibold">To:</span> {target?.name || 'Unknown target'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Purpose</div>
            <p className="text-sm text-foreground leading-relaxed">{rel.description}</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedObjectId) {
    const obj = placedObjects.find(o => o.id === selectedObjectId);
    if (!obj) return null;

    return (
      <div className="pointer-events-auto absolute right-4 top-24 w-72 md:w-80 max-w-[85vw] bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl flex flex-col animate-in slide-in-from-right-8 z-20">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${CategoryColor(obj.category)}`}>
              <CategoryIcon category={obj.category} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">{obj.name}</h3>
              <div className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider mt-0.5">
                Level {obj.level}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setSelectedObjectId(null)}
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Data Type</div>
              <div className="text-xs font-mono bg-secondary px-2 py-1 rounded border border-border">{obj.type}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Source</div>
              <div className="text-xs bg-secondary px-2 py-1 rounded border border-border truncate" title={obj.source}>{obj.source}</div>
            </div>
          </div>

          {obj.description && (
            <div>
              <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Context</div>
              <p className="text-sm text-foreground leading-relaxed">{obj.description}</p>
            </div>
          )}
        </div>

        {!presentationMode && (
          <div className="p-3 border-t border-border bg-muted/20 rounded-b-lg flex justify-end">
            <button
              onClick={() => removeObject(obj.id)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-destructive hover:text-foreground hover:bg-destructive rounded transition-colors"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        )}
      </div>
    );
  }

  if (selectedLevelId && !presentationMode) {
    const context = LEVEL_CONTEXTS[selectedLevelId];
    if (!context) return null;
    
    const isFocused = focusLevel === selectedLevelId;
    const isIsolated = isolateLevel === selectedLevelId;
    
    return (
      <div className="pointer-events-auto absolute right-4 top-24 w-72 md:w-80 max-w-[85vw] bg-card/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl flex flex-col animate-in slide-in-from-right-8 z-20">
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 rounded-t-lg">
           <h3 className="font-bold text-foreground text-sm flex items-center gap-2">Level {selectedLevelId}: {levelNames[selectedLevelId] ?? context.name}</h3>
          <button onClick={() => setSelectedLevelId(null)} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-white/10 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Purpose</div>
            <p className="text-sm text-foreground leading-relaxed">{context.purpose}</p>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Example Systems</div>
            <p className="text-xs font-mono text-primary/80 bg-primary/10 p-2 rounded">{context.examples}</p>
          </div>
        </div>
        <div className="p-3 border-t border-border bg-muted/20 rounded-b-lg flex justify-between gap-2">
           <button 
             onClick={() => setFocusLevel(isFocused ? null : selectedLevelId)}
             className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${isFocused ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'}`}
           >
             {isFocused ? 'Clear Focus' : 'Focus Level'}
           </button>
           <button 
             onClick={() => setIsolateLevel(isIsolated ? null : selectedLevelId)}
             className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${isIsolated ? 'bg-primary text-primary-foreground shadow' : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'}`}
           >
             {isIsolated ? 'Return to All' : 'Isolate Level'}
           </button>
        </div>
      </div>
    );
  }

  return null;
}

function ForgingObjectCard({
  object,
  onClose,
  onSave,
  onRemove,
}: {
  object: DataObject;
  onClose: () => void;
  onSave: (patch: Partial<Pick<DataObject, 'name' | 'level' | 'sector' | 'type' | 'source' | 'description' | 'category'>>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({
    name: object.name,
    level: object.level,
    sector: object.sector ?? 'resources' as ForgingSector,
    type: object.type,
    source: object.source,
    description: object.description ?? '',
    category: object.category,
  });

  React.useEffect(() => {
    setEditing(false);
    setDraft({
      name: object.name,
      level: object.level,
      sector: object.sector ?? 'resources',
      type: object.type,
      source: object.source,
      description: object.description ?? '',
      category: object.category,
    });
  }, [object.id]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      name: draft.name.trim() || object.name,
      level: draft.level,
      sector: draft.sector,
      type: draft.type.trim() || object.type,
      source: draft.source.trim() || object.source,
      description: draft.description.trim() || undefined,
      category: draft.category,
    });
    setEditing(false);
  };

  return (
    <div className="pointer-events-auto absolute right-4 top-24 z-20 flex w-80 max-w-[85vw] flex-col rounded-lg border border-border bg-card/95 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-muted/30 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-md p-2" style={{ color: FORGING_SECTOR_COLORS[object.sector ?? 'resources'], backgroundColor: `${FORGING_SECTOR_COLORS[object.sector ?? 'resources']}22` }}>
            <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: FORGING_SECTOR_COLORS[object.sector ?? 'resources'] }} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-foreground">{object.name}</h3>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              L{object.level - 1} · {FORGING_LEVELS[object.level - 1]?.name}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"><X size={16} /></button>
      </div>

      {!editing ? (
        <>
          <div className="space-y-3 p-4 text-xs">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: FORGING_SECTOR_COLORS[object.sector ?? 'resources'] }}>
              <i className="h-2 w-2 rounded-full" style={{ backgroundColor: FORGING_SECTOR_COLORS[object.sector ?? 'resources'] }} />
              {FORGING_SECTOR_LABELS[object.sector ?? 'resources']}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><div className="mb-1 text-[10px] uppercase text-muted-foreground">Type</div><div className="rounded border border-border bg-secondary px-2 py-1 font-mono">{object.type}</div></div>
              <div><div className="mb-1 text-[10px] uppercase text-muted-foreground">Source</div><div className="truncate rounded border border-border bg-secondary px-2 py-1" title={object.source}>{object.source}</div></div>
            </div>
            {object.description && <div><div className="mb-1 text-[10px] uppercase text-muted-foreground">Description</div><p className="leading-relaxed text-foreground">{object.description}</p></div>}
          </div>
          <div className="flex justify-between gap-2 rounded-b-lg border-t border-border bg-muted/20 p-3">
            <button onClick={onRemove} className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-destructive hover:bg-destructive hover:text-foreground"><Trash2 size={14} /> Remove</button>
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"><Pencil size={14} /> Edit Data</button>
          </div>
        </>
      ) : (
        <form onSubmit={save} className="space-y-3 p-4">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary" /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Level<select value={draft.level} onChange={(event) => setDraft({ ...draft, level: Number(event.target.value) })} className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none">{FORGING_LEVELS.map((level) => <option key={level.id} value={level.id}>L{level.id - 1} · {level.name}</option>)}</select></label>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sector<select value={draft.sector} onChange={(event) => setDraft({ ...draft, sector: event.target.value as ForgingSector })} className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none">{(Object.keys(FORGING_SECTOR_LABELS) as ForgingSector[]).map((sector) => <option key={sector} value={sector}>{FORGING_SECTOR_LABELS[sector].split(' / ')[0]}</option>)}</select></label>
          </div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type<input value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary" /></label>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Source<input value={draft.source} onChange={(event) => setDraft({ ...draft, source: event.target.value })} className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary" /></label>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} className="mt-1 w-full resize-none rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary" /></label>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button type="button" onClick={() => setEditing(false)} className="rounded px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground">Cancel</button>
            <button type="submit" className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"><Save size={14} /> Save</button>
          </div>
        </form>
      )}
    </div>
  );
}