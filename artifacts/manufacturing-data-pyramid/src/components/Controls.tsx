import React, { useEffect } from 'react';
import { useStore } from '../store';
import { Layers, Network, Presentation, Maximize2, Minimize2, Play, Pause, SkipBack, SkipForward, X, RotateCcw, BoxSelect, Cpu, Sparkles, SlidersHorizontal, MonitorPlay, Eye, EyeOff } from 'lucide-react';
import { COURSES, CourseMode } from '../data';

export function Controls() {
  const { 
    courseMode, setCourseMode,
    journeyActive, setJourneyActive,
    journeyStep, setJourneyStep,
    journeyPlaying, setJourneyPlaying,
    exploded, setExploded, 
    cutaway, setCutaway,
    sectionLevel, setSectionLevel,
    showRelationships, setShowRelationships,
    showLevelLabels, setShowLevelLabels,
    pyramidOpacity, setPyramidOpacity,
    focusLevel, setFocusLevel,
    isolateLevel, setIsolateLevel,
    presentationMode, setPresentationMode,
    resetCourse
  } = useStore();
  const journeySteps = COURSES[courseMode].journeySteps;
  const lastJourneyStep = Math.max(0, journeySteps.length - 1);
  const currentJourneyStep = Math.min(Math.max(journeyStep, 0), lastJourneyStep);
  const toggleSection = () => {
    if (!cutaway) setSectionLevel(sectionLevel ?? 3);
    setCutaway(!cutaway);
  };

  // Journey interval effect
  useEffect(() => {
    if (!journeyActive || !journeyPlaying) return;
    const timer = setInterval(() => {
      const state = useStore.getState();
      const steps = COURSES[state.courseMode].journeySteps;
      const lastStep = Math.max(0, steps.length - 1);

      if (state.journeyStep >= lastStep) {
        setJourneyPlaying(false);
        return;
      }

      const nextStep = Math.min(state.journeyStep + 1, lastStep);
      setJourneyStep(nextStep);

      if (nextStep === lastStep) {
        setJourneyPlaying(false);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [journeyActive, journeyPlaying, courseMode, setJourneyStep, setJourneyPlaying]);

  if (journeyActive) {
    const steps = journeySteps;
    return (
      <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-xl border rounded-full flex items-center px-6 py-4 gap-6 shadow-2xl z-30">
        <div className="flex-1 min-w-[250px] md:min-w-[350px]">
          <div className="text-xs text-primary font-mono uppercase tracking-wider mb-1">
            Step {currentJourneyStep + 1} of {steps.length}
          </div>
          <div className="text-sm font-semibold text-foreground">
            {steps[currentJourneyStep].title}
          </div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {steps[currentJourneyStep].desc}
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-r border-border px-6">
          <button 
            disabled={currentJourneyStep === 0}
            onClick={() => setJourneyStep(Math.max(0, currentJourneyStep - 1))}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full disabled:opacity-30 transition-colors"
          >
            <SkipBack size={20} />
          </button>
          
          <button
            onClick={() => setJourneyPlaying(
              currentJourneyStep < lastJourneyStep ? !journeyPlaying : false
            )}
            disabled={currentJourneyStep === lastJourneyStep}
            className="p-2 text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
          >
            {journeyPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button 
            disabled={currentJourneyStep === lastJourneyStep}
            onClick={() => {
              const nextStep = Math.min(currentJourneyStep + 1, lastJourneyStep);
              setJourneyStep(nextStep);
              if (nextStep === lastJourneyStep) setJourneyPlaying(false);
            }}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full disabled:opacity-30 transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <button 
          onClick={() => setJourneyActive(false)}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-colors flex items-center gap-2 text-sm"
        >
          <X size={16} /> Exit
        </button>
      </div>
    );
  }

  if (presentationMode) {
    return (
      <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 flex max-w-[96vw] items-center gap-1.5 rounded-full border border-white/15 bg-[#071018]/80 p-1.5 shadow-2xl backdrop-blur-2xl z-30 overflow-x-auto">
        {(['data-science', 'fundamentals-ai', 'agentic-ai'] as CourseMode[]).map(cm => (
          <button key={cm} onClick={() => setCourseMode(cm)} className={`whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-semibold transition-colors ${courseMode === cm ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}>
            {cm === 'data-science' ? 'Data Science' : cm === 'fundamentals-ai' ? 'Fundamentals AI' : 'Agentic AI'}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-white/15" />
        <button onClick={() => setExploded(!exploded)} className="rounded-full px-2.5 py-2 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">{exploded ? 'Assemble' : 'Explode'}</button>
         <button onClick={toggleSection} className={`rounded-full px-2.5 py-2 text-[10px] font-semibold ${cutaway ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}>Section</button>
         {cutaway && [1, 2, 3, 4, 5].map(level => (
           <button key={level} onClick={() => setSectionLevel(level)} className={`h-7 w-7 rounded-full text-[10px] font-mono ${sectionLevel === level ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-muted-foreground hover:text-foreground'}`}>{level}</button>
         ))}
        <button onClick={() => setShowRelationships(!showRelationships)} className={`rounded-full px-2.5 py-2 text-[10px] font-semibold ${showRelationships ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}>Connect</button>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(lvl => <button key={lvl} onClick={() => setFocusLevel(focusLevel === lvl ? null : lvl)} className={`h-7 w-7 rounded-full text-[10px] font-mono ${focusLevel === lvl ? 'bg-foreground text-background' : 'bg-white/10 text-muted-foreground hover:text-foreground'}`}>{lvl}</button>)}
        </div>
        <button onClick={() => setJourneyActive(true)} className="rounded-full px-2.5 py-2 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-300/10">Journey</button>
        <button onClick={resetCourse} className="rounded-full px-2.5 py-2 text-[10px] font-semibold text-muted-foreground hover:bg-white/10 hover:text-foreground">Reset</button>
        <button onClick={() => setPresentationMode(false)} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-semibold text-foreground hover:bg-white/20">Exit</button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30 w-[96vw] md:w-auto">
      
      {/* Course Selector - Always available to switch domain overlays */}
      <div className="flex items-center gap-1 md:gap-2 mb-1 bg-card/95 backdrop-blur-xl border border-border rounded-lg p-1.5 shadow-xl w-full md:w-auto overflow-x-auto snap-x justify-start md:justify-center [&::-webkit-scrollbar]:hidden">
        {(['data-science', 'fundamentals-ai', 'agentic-ai'] as CourseMode[]).map(cm => (
           <button 
             key={cm} 
             onClick={() => setCourseMode(cm)}
             className={`px-3 md:px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap snap-center shrink-0 ${courseMode === cm ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
           >
             {cm === 'data-science' ? 'Data Science' : cm === 'fundamentals-ai' ? 'Fundamentals of AI' : 'Agentic AI'}
           </button>
        ))}
      </div>

      {/* Primary Tool Bar */}
      <div className="bg-card/95 backdrop-blur-xl border rounded-lg flex flex-col md:flex-row p-1.5 md:p-2 gap-1.5 md:gap-2 shadow-2xl w-full md:w-auto pointer-events-auto">
        
        {/* Row 1 on Mobile, Part 1 on Desktop */}
        <div className="flex items-center justify-between md:justify-center gap-1 md:gap-2 w-full md:w-auto">
          <button
            onClick={() => setExploded(!exploded)}
            className={`flex flex-col items-center justify-center flex-1 md:flex-none min-w-[3.5rem] md:min-w-[4rem] h-12 md:h-14 rounded-md transition-colors ${exploded ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
          >
            {exploded ? <Minimize2 size={20} className="mb-0.5" /> : <Maximize2 size={20} className="mb-0.5" />}
            <span className="text-[9px] md:text-[10px] uppercase font-semibold">{exploded ? 'Assemble' : 'Explode'}</span>
          </button>

          <button
             onClick={toggleSection}
            className={`flex flex-col items-center justify-center flex-1 md:flex-none min-w-[3.5rem] md:min-w-[4rem] h-12 md:h-14 rounded-md transition-colors ${cutaway ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
          >
            <BoxSelect size={20} className="mb-0.5" />
            <span className="text-[9px] md:text-[10px] uppercase font-semibold">Section</span>
          </button>

          <button
            onClick={() => setShowRelationships(!showRelationships)}
            className={`flex flex-col items-center justify-center flex-1 md:flex-none min-w-[3.5rem] md:min-w-[4rem] h-12 md:h-14 rounded-md transition-colors ${showRelationships ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
          >
            <Network size={20} className="mb-0.5" />
            <span className="text-[9px] md:text-[10px] uppercase font-semibold">Connect</span>
          </button>

          <div className="hidden md:block w-px h-8 md:h-10 bg-border mx-1 md:mx-2 shrink-0" />

          <div className="flex flex-col items-center justify-center px-1 md:px-2 shrink-0">
            <span className="text-[9px] md:text-[10px] uppercase font-semibold text-muted-foreground mb-1">Focus Camera</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFocusLevel(focusLevel === lvl ? null : lvl)}
                  className={`w-7 h-7 md:w-7 md:h-7 rounded flex items-center justify-center text-xs font-mono transition-colors ${focusLevel === lvl ? 'bg-foreground text-background font-bold' : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider on Mobile */}
        <div className="w-full h-px bg-border md:hidden shrink-0 my-0.5" />

        {/* Row 2 on Mobile, Part 2 on Desktop */}
        <div className="flex items-center justify-between md:justify-center gap-1 md:gap-2 w-full md:w-auto">
          
          <div className="hidden md:block w-px h-8 md:h-10 bg-border mx-1 md:mx-2 shrink-0" />

          <div className="flex flex-col items-center justify-center px-0.5 md:px-2 shrink-0">
            <span className="text-[9px] md:text-[10px] uppercase font-semibold text-muted-foreground mb-1">Isolate Level</span>
            <div className="flex gap-1 items-center">
               {[1, 2, 3, 4, 5].map(lvl => (
                 <button
                   key={lvl}
                   onClick={() => setIsolateLevel(isolateLevel === lvl ? null : lvl)}
                   className={`w-6 h-7 md:w-7 md:h-7 rounded flex items-center justify-center text-[11px] md:text-xs font-mono transition-colors ${isolateLevel === lvl ? 'bg-primary text-primary-foreground font-bold' : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                 >
                   {lvl}
                 </button>
               ))}
               {isolateLevel !== null && (
                 <button onClick={() => setIsolateLevel(null)} className="ml-1 px-1.5 py-1 text-[9px] md:text-[10px] uppercase bg-secondary hover:bg-muted text-foreground rounded font-semibold flex items-center gap-1 transition-colors h-7">
                   <Eye size={12}/> All
                 </button>
               )}
            </div>
          </div>

          <div className="hidden md:block w-px h-8 md:h-10 bg-border mx-1 md:mx-2 shrink-0" />

          <div className="flex gap-1 flex-1 md:flex-none justify-end">
            <button
              onClick={() => setJourneyActive(true)}
              className="flex flex-col items-center justify-center flex-1 md:flex-none min-w-[3.5rem] md:min-w-[4rem] h-12 md:h-14 rounded-md text-emerald-400 hover:bg-emerald-400/10 transition-colors"
            >
              <Presentation size={20} className="mb-0.5" />
              <span className="text-[9px] md:text-[10px] uppercase font-semibold">Journey</span>
            </button>
            
            <button
              onClick={resetCourse}
              className="flex flex-col items-center justify-center flex-1 md:flex-none min-w-[3.5rem] md:min-w-[4rem] h-12 md:h-14 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <RotateCcw size={20} className="mb-0.5" />
              <span className="text-[9px] md:text-[10px] uppercase font-semibold">Reset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto flex max-w-[96vw] flex-wrap items-center justify-center gap-2 rounded-lg border border-border bg-card/90 px-2 py-1.5 shadow-xl backdrop-blur-xl">
        <button
          onClick={() => setShowLevelLabels(!showLevelLabels)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors ${showLevelLabels ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
          aria-label={showLevelLabels ? 'Hide pyramid level labels' : 'Show pyramid level labels'}
        >
          {showLevelLabels ? <Eye size={13} /> : <EyeOff size={13} />}
          Labels
        </button>
        <span className="h-5 w-px bg-border" />
        <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground" title="Pyramid surface opacity">
          <SlidersHorizontal size={13} />
          Surface
          <input
            aria-label="Pyramid surface opacity"
            type="range"
            min="0.18"
            max="1"
            step="0.01"
            value={pyramidOpacity}
            onChange={(event) => setPyramidOpacity(Number(event.target.value))}
            className="h-1 w-20 accent-cyan-400"
          />
          <span className="w-7 text-right font-mono text-[9px]">{Math.round(pyramidOpacity * 100)}%</span>
        </label>
        {cutaway && (
          <>
            <span className="h-5 w-px bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Section</span>
            {[1, 2, 3, 4, 5].map(level => (
              <button key={level} onClick={() => setSectionLevel(level)} className={`h-6 w-6 rounded text-[10px] font-mono ${sectionLevel === level ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{level}</button>
            ))}
          </>
        )}
      </div>

      {/* Presentation Mode Toggle */}
      <button 
        onClick={() => setPresentationMode(!presentationMode)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground hover:text-foreground transition-colors shadow-lg"
      >
        <MonitorPlay size={14} />
        {presentationMode ? 'Exit Presentation' : 'Enter Presentation'}
      </button>
    </div>
  );
}