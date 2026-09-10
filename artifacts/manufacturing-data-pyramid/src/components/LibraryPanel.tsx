import React, { useState } from 'react';
import { useStore } from '../store';
import { DataCategory } from '../data';
import { LIBRARY_ITEMS } from '../data';
import { GripVertical, Activity, Clock, FileText, Database, Brain, ArrowRight, Zap, Target, MousePointer2, Touchpad } from 'lucide-react';

const CategoryIcon = ({ category, className }: { category: DataCategory, className?: string }) => {
  switch (category) {
    case 'signal': return <Activity className={className} />;
    case 'time-series': return <Clock className={className} />;
    case 'event': return <Zap className={className} />;
    case 'model': return <Target className={className} />;
    case 'document': return <FileText className={className} />;
    case 'record': return <Database className={className} />;
    case 'insight': return <Brain className={className} />;
    case 'agent': return <ArrowRight className={className} />;
    default: return <Database className={className} />;
  }
};

const CategoryColor = (category: DataCategory) => {
  switch (category) {
    case 'signal': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'time-series': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'event': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'model': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'document': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    case 'record': return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
    case 'insight': return 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20';
    case 'agent': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
};

export function LibraryPanel() {
  const { draggedLibraryItem, setDraggedLibraryItem, touchSelectedItem, setTouchSelectedItem, journeyActive, presentationMode } = useStore();
  const [isOpen, setIsOpen] = useState(true);

  if (journeyActive || presentationMode) return null;

  return (
    <div className={`absolute left-0 top-24 bottom-32 md:bottom-24 w-80 max-w-[85vw] bg-card/90 backdrop-blur-xl border-y border-r border-border rounded-r-lg flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-10 ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%-2rem)]'}`}>
      
      {/* Toggle Tab */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-10 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-xl border border-l-0 border-border rounded-r-lg w-10 h-16 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors shadow-xl"
      >
        <GripVertical size={20} />
      </button>

      <div className="p-4 border-b border-border flex justify-between items-center bg-card rounded-tr-lg">
        <h2 className="text-sm font-bold tracking-wider text-foreground uppercase">Data Library</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {LIBRARY_ITEMS.map((item, idx) => {
          const isSelected = draggedLibraryItem?.name === item.name || touchSelectedItem?.name === item.name;
          return (
          <div
            key={idx}
            draggable
            onClick={() => {
               // For touch/accessibility: click to select, then click level to place
               setTouchSelectedItem(isSelected ? null : item);
               setDraggedLibraryItem(null);
            }}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify(item));
              e.dataTransfer.effectAllowed = 'copy';
              setDraggedLibraryItem(item);
              setTouchSelectedItem(null);
            }}
            onDragEnd={() => setDraggedLibraryItem(null)}
            className={`group flex flex-col p-3 rounded-md border cursor-pointer active:cursor-grabbing transition-all ${
              isSelected 
                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                : 'bg-secondary/50 border-border hover:border-muted-foreground/50 hover:bg-secondary'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${CategoryColor(item.category)}`}>
                  <CategoryIcon category={item.category} className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-foreground">{item.name}</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider bg-background px-1.5 py-0.5 rounded border border-border">L{item.level}</span>
            </div>
            <div className="pl-9 flex gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{item.type}</span>
              <span>•</span>
              <span className="truncate">{item.source}</span>
            </div>
          </div>
        )})}
      </div>
      
      <div className="p-4 border-t border-border text-xs text-muted-foreground text-center flex items-center justify-center gap-4 bg-card rounded-br-lg">
        <span className="flex items-center gap-1.5"><MousePointer2 size={14} /> Drag</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1.5"><Touchpad size={14} /> Tap to Select</span>
      </div>
    </div>
  );
}

export { CategoryIcon, CategoryColor };