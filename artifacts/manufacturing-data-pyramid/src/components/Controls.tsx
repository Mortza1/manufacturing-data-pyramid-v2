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
    showRelationships, setShowRelationships,
    focusLevel, setFocusLevel,
    isolateLevel, setIsolateLevel,
    presentationMode, setPresentationMode,
    resetCourse
  } = useStore();

  // Journey interval effect
  useEffect(() => {
    if (!journeyActive || !journeyPlaying) return;
    const timer = setInterval(() => {
      setJourneyStep(useStore.getState().journeyStep + 1);
      // Wait, we need to check bounds. Let's get the current state securely without redefining:
      const state = useStore.getState();
      const steps = COURSES[state.courseMode].journeySteps;
      if (state.journeyStep >= steps.length - 1) {
        setJourneyPlaying(false);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [journeyActive, journeyPlaying, courseMode, setJourneyStep, setJourneyPlaying]);

  if (journeyActive) {
    const steps = COURSES[courseMode].journeySteps;
    return (
      <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-xl border rounded-full flex items-center px-6 py-4 gap-6 shadow-2xl z-30">
        <div className="flex-1 min-w-[250px] md:min-w-[350px]">
          <div className="text-xs text-primary font-mono uppercase tracking-wider mb-1">
            Step {journeyStep + 1} of {steps.length}
          </div>
          <div className="text-sm font-semibold text-foreground">
            {steps[journeyStep].title}
          </div>
          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {steps[journeyStep].desc}
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-r border-border px-6">
          <button 
            disabled={journeyStep === 0}
            onClick={() => setJourneyStep(journeyStep - 1)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full disabled:opacity-30 transition-colors"
          >
            <SkipBack size={20} />
          </button>
          
          <button
            onClick={() => setJourneyPlaying(!journeyPlaying)}
            className="p-2 text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
          >
            {journeyPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button 
            disabled={journeyStep === steps.length - 1}
            onClick={() => setJourneyStep(journeyStep + 1)}
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
            onClick={() => setCutaway(!cutaway)}
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