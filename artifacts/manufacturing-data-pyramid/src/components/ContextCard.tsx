import React from 'react';
import { useStore } from '../store';
import { CategoryIcon, CategoryColor } from './LibraryPanel';
import { Trash2, X, Network } from 'lucide-react';
import { COURSES, LEVEL_CONTEXTS } from '../data';

export function ContextCard() {
  const { selectedObjectId, selectedRelationshipId, selectedLevelId, placedObjects, removeObject, setSelectedObjectId, setSelectedRelationshipId, setSelectedLevelId, courseMode, presentationMode, journeyActive, focusLevel, setFocusLevel, isolateLevel, setIsolateLevel } = useStore();

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
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">Level {selectedLevelId}: {context.name}</h3>
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