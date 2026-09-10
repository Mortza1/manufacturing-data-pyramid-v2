import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { DataCategory } from '../data';
import { LIBRARY_ITEMS } from '../data';
import { GripVertical, Activity, Clock, FileText, Database, Brain, ArrowRight, Zap, Target, MousePointer2, Touchpad, X } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  if (journeyActive || presentationMode) return null;

  return (
    <div className={`pointer-events-auto absolute left-4 top-28 bottom-[180px] md:bottom-24 w-[calc(100vw-64px)] md:w-72 max-w-[288px] bg-[#071018]/90 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl z-40 ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'}`}>
      
      {/* Toggle Tab */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute -right-10 top-12 bg-[#071018]/95 backdrop-blur-xl border border-l-0 border-white/10 rounded-r-lg w-10 h-28 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-card transition-colors shadow-[4px_0_15px_rgba(0,0,0,0.2)] group`}
      >
        <GripVertical size={16} className={`transition-transform ${isOpen ? '' : 'text-primary'}`} />
        <span style={{ writingMode: 'vertical-rl' }} className={`text-[10px] uppercase font-bold tracking-widest ${isOpen ? '' : 'text-primary'}`}>Data</span>
      </button>

      <div className="p-4 border-b border-white/10 flex justify-between items-center rounded-t-2xl shrink-0">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-primary/80">Palette / drag to place</div>
          <h2 className="text-sm font-bold tracking-wider text-foreground uppercase mt-1">Data Library</h2>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden text-muted-foreground hover:text-foreground p-1 bg-secondary/50 rounded"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
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
             className={`group flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer active:cursor-grabbing transition-all ${
              isSelected 
                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                : 'bg-secondary/50 border-border hover:border-muted-foreground/50 hover:bg-secondary'
            }`}
          >
             <div className={`shrink-0 p-2 rounded-lg ${CategoryColor(item.category)}`}>
               <CategoryIcon category={item.category} className="w-5 h-5" />
             </div>
             <div className="min-w-0 flex-1">
               <div className="flex items-center justify-between gap-2">
                 <span className="text-xs font-semibold text-foreground truncate">{item.name}</span>
                 <span className="shrink-0 text-[9px] uppercase font-mono text-muted-foreground tracking-wider bg-background/70 px-1.5 py-0.5 rounded border border-border">L{item.level}</span>
               </div>
               <div className="mt-1 text-[10px] text-muted-foreground truncate">{item.type} · {item.source}</div>
             </div>
          </div>
        )})}
      </div>
      
       <div className="p-3 border-t border-white/10 text-[10px] text-muted-foreground text-center flex items-center justify-center gap-3 rounded-b-2xl">
        <span className="flex items-center gap-1.5"><MousePointer2 size={14} /> Drag</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1.5"><Touchpad size={14} /> Tap to Select</span>
      </div>
    </div>
  );
}

export { CategoryIcon, CategoryColor };