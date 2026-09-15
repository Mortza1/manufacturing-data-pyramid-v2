import React, { useState } from 'react';
import { useStore } from '../store';
import { DataCategory } from '../data';
import { Plus, X } from 'lucide-react';
import { CategoryIcon, CategoryColor } from './LibraryPanel';

export function AddDataDialog() {
  const { placeObject, journeyActive, presentationMode, levelNames } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [source, setSource] = useState('');
  const [level, setLevel] = useState(1);
  const [category, setCategory] = useState<DataCategory>('signal');
  const [description, setDescription] = useState('');

  if (journeyActive || presentationMode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine random place in level
    const bases = [5.4, 4.35, 3.35, 2.35, 1.35];
    const tops = [4.35, 3.35, 2.35, 1.35, 0.15];
    const base = bases[level - 1];
    const top = tops[level - 1];
    
    const angle = Math.random() * Math.PI * 2;
    const radius = (base + top) / 2 * 0.7;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    placeObject({
      name, type, source, level, category, description: description || undefined
    }, [x, 0, z], level);
    
    setIsOpen(false);
    // Reset
    setName(''); setType(''); setSource(''); setLevel(1); setCategory('signal'); setDescription('');
  };

  const categories: DataCategory[] = ['signal', 'time-series', 'event', 'model', 'document', 'record', 'insight', 'agent'];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg z-20"
      >
        <Plus size={16} /> <span className="hidden sm:inline">Add Data</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="add-data-title">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50 rounded-t-xl">
          <h2 id="add-data-title" className="text-lg font-bold text-foreground">Add Custom Data</h2>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spindle Vib" className="w-full bg-background border border-border rounded p-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Type</label>
                <input required value={type} onChange={e => setType(e.target.value)} placeholder="e.g. 100Hz Raw Data" className="w-full bg-background border border-border rounded p-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Source/System</label>
                <input required value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. CNC Machine 1" className="w-full bg-background border border-border rounded p-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Level</label>
                <select value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full bg-background border border-border rounded p-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer">
                  {[1, 2, 3, 4, 5].map((levelId) => (
                    <option key={levelId} value={levelId}>{levelId} - {levelNames[levelId]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Category</label>
              <div className="grid grid-cols-4 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${category === cat ? CategoryColor(cat) + ' border-transparent shadow-sm' : 'bg-background border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-secondary'}`}
                  >
                    <CategoryIcon category={cat} className="w-5 h-5 mb-2" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Description (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-background border border-border rounded p-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-20 transition-all" />
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-card/95 backdrop-blur-sm">
              <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 text-sm font-bold bg-primary text-primary-foreground rounded shadow hover:bg-primary/90 hover:shadow-lg transition-all">
                Add to Pyramid
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}