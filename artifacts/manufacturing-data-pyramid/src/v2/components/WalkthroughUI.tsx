import React from 'react';
import { useV2Store } from '../store';
import { Check, Edit2, Lock, ChevronRight, Wand2, GraduationCap } from 'lucide-react';

const STAGES = ['Structure', 'Data', 'Visualise', 'Connections', 'Save'];

export function WalkthroughUI() {
  const {
    draft,
    setDraftLevels,
    setDraftSectors,
    confirmStructure,
    reopenStructure,
    activeCase,
    isEditingStructure,
  } = useV2Store();

  const isConfirmed = activeCase !== null && !isEditingStructure;
  const currentStage = isConfirmed ? 1 : 0;

  const handleAutoFill = () => {
    setDraftLevels(
      draft.levels.map((level, index) => ({
        id: level.id,
        name: `Level ${index + 1}`,
      }))
    );
    if (draft.sectors.length === 4) {
      setDraftSectors([
        { id: draft.sectors[0]?.id, name: 'Product' },
        { id: draft.sectors[1]?.id, name: 'Resources' },
        { id: draft.sectors[2]?.id, name: 'Machines' },
        { id: draft.sectors[3]?.id, name: 'People' },
      ]);
    } else {
      setDraftSectors(
        draft.sectors.map((sector, index) => ({
          id: sector.id,
          name: `Sector ${index + 1}`,
        }))
      );
    }
  };

  const handleConfirm = () => {
    if (draft.levels.some((l) => !l.name.trim()) || draft.sectors.some((s) => !s.name.trim())) {
      return;
    }
    confirmStructure();
  };

  return (
    <div className="absolute right-4 top-24 bottom-8 w-96 bg-[#070b14]/95 backdrop-blur-xl border border-indigo-500/20 rounded-xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-indigo-500/20 bg-indigo-500/10 shrink-0">
        <h2 className="text-xl font-bold text-indigo-100 flex items-center gap-2">
          <GraduationCap className="text-indigo-400" /> Walkthrough
        </h2>
        <p className="text-sm text-indigo-200/70 mt-1">
          Define your manufacturing data strategy step by step.
        </p>
      </div>

      {/* Stepper */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-1 bg-black/20 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden">
        {STAGES.map((stage, idx) => {
          const isActive = idx === currentStage;
          const isPast = idx < currentStage;
          return (
            <div
              key={stage}
              className={`flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${
                isActive ? 'text-indigo-400' : isPast ? 'text-emerald-400' : 'text-muted-foreground'
              }`}
            >
              <span
                className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center border ${
                  isActive
                    ? 'border-indigo-400 bg-indigo-400/20'
                    : isPast
                    ? 'border-emerald-400 bg-emerald-400/20'
                    : 'border-white/10 bg-black/40'
                }`}
              >
                {isPast ? <Check size={12} /> : idx > 0 && !isActive ? <Lock size={10} /> : idx + 1}
              </span>
              <span className={idx > 0 && !isActive && !isPast ? 'hidden sm:inline' : 'inline'}>
                {stage}
              </span>
              {idx < STAGES.length - 1 && (
                <ChevronRight size={14} className="text-white/10 ml-1 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 relative">
        {!isConfirmed ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Define Structure</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set the foundation of your data pyramid by defining the vertical levels and horizontal
                sectors.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-indigo-100">
                  Vertical Levels ({draft.levels.length})
                </label>
                <div className="flex gap-1 bg-black/40 p-1 rounded-md border border-white/5">
                  <button
                    onClick={() => setDraftLevels(draft.levels.slice(0, -1))}
                    disabled={draft.levels.length <= 1}
                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-colors"
                  >
                    -
                  </button>
                  <button
                    onClick={() =>
                      setDraftLevels([...draft.levels, { name: `Level ${draft.levels.length + 1}` }])
                    }
                    disabled={draft.levels.length >= 8}
                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden">
                {draft.levels.map((lvl, idx) => (
                  <div key={idx} className="relative flex items-center group">
                    <span className="absolute left-3 text-[10px] font-mono text-indigo-400/50">
                      L{idx + 1}
                    </span>
                    <input
                      value={lvl.name}
                      onChange={(e) => {
                        const newLevels = [...draft.levels];
                        newLevels[idx].name = e.target.value;
                        setDraftLevels(newLevels);
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-md pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                      placeholder={`Level ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-5 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-indigo-100">
                  Horizontal Sectors ({draft.sectors.length})
                </label>
                <div className="flex gap-1 bg-black/40 p-1 rounded-md border border-white/5">
                  <button
                    onClick={() => setDraftSectors(draft.sectors.slice(0, -1))}
                    disabled={draft.sectors.length <= 3}
                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-colors"
                  >
                    -
                  </button>
                  <button
                    onClick={() =>
                      setDraftSectors([
                        ...draft.sectors,
                        { name: `Sector ${draft.sectors.length + 1}` },
                      ])
                    }
                    disabled={draft.sectors.length >= 8}
                    className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={handleAutoFill}
                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md border border-indigo-500/30 transition-all active:scale-[0.98]"
              >
                <Wand2 size={13} /> Auto-fill Names
                <span className="font-normal text-indigo-200/60">
                  ({draft.sectors.length === 4 ? 'Manufacturing preset' : 'Neutral'})
                </span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                {draft.sectors.map((sec, idx) => (
                  <input
                    key={idx}
                    value={sec.name}
                    onChange={(e) => {
                      const newSectors = [...draft.sectors];
                      newSectors[idx].name = e.target.value;
                      setDraftSectors(newSectors);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all text-center"
                    placeholder={`Sector ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Check size={28} />
              </div>
              <h3 className="text-xl font-bold text-emerald-100">Structure Confirmed</h3>
              <p className="text-sm text-emerald-200/70 mt-2 leading-relaxed">
                Your base pyramid with {activeCase?.levels.length} levels and{' '}
                {activeCase?.sectors.length} sectors is ready.
              </p>
              <button
                onClick={reopenStructure}
                className="mt-6 px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/10 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors text-muted-foreground hover:text-foreground"
              >
                <Edit2 size={14} /> Revise Structure
              </button>
            </div>

            <div className="flex-1 min-h-[140px] p-6 border border-white/5 rounded-xl bg-black/20 text-center flex flex-col items-center justify-center">
              <Lock size={28} className="text-muted-foreground mb-4 opacity-40" />
              <h4 className="text-sm font-semibold text-muted-foreground">Data Stage Locked</h4>
              <p className="text-xs text-muted-foreground/60 mt-2 max-w-[200px] leading-relaxed">
                This stage will be available in future updates. Keep exploring the main visualisations.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isConfirmed && (
        <div className="p-5 border-t border-white/5 bg-black/40 flex justify-end shrink-0">
          <button
            onClick={handleConfirm}
            disabled={
              draft.levels.some((l) => !l.name.trim()) ||
              draft.sectors.some((s) => !s.name.trim())
            }
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            Confirm Structure <Check size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
