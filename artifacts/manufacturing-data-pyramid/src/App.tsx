import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { PyramidScene } from './components/PyramidScene';
import { LibraryPanel } from './components/LibraryPanel';
import { ContextCard } from './components/ContextCard';
import { Controls } from './components/Controls';
import { AddDataDialog } from './components/AddDataDialog';
import { ForgingControls } from './components/ForgingControls';
import { useStore } from './store';
import { ModeSelector } from './v2/components/ModeSelector';
import { WalkthroughUI } from './v2/components/WalkthroughUI';
import { useV2Store } from './v2/store';

const queryClient = new QueryClient();

function Home() {
  const presentationMode = useStore((state) => state.presentationMode);
  const forgingCaseStudy = useStore((state) => state.forgingCaseStudy);
  const enterForgingCaseStudy = useStore((state) => state.enterForgingCaseStudy);
  const exitForgingCaseStudy = useStore((state) => state.exitForgingCaseStudy);
  
  const v2Mode = useV2Store((state) => state.mode);
  const walkthroughStage = useV2Store((state) => state.walkthroughStage);
  const connectionsView = useV2Store((state) => state.connectionsView);
  const isV2 = v2Mode !== 'explorer';
  const showCrossSection = v2Mode === 'walkthrough' && walkthroughStage === 'connections' && connectionsView === '2d';

  return (
    <div className={`h-[100dvh] w-full relative bg-background text-foreground font-sans overflow-hidden ${presentationMode ? 'presentation-stage' : ''}`}>
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        {!showCrossSection && <PyramidScene />}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        <ModeSelector />

        {/* Header */}
        <header className={`absolute ${presentationMode ? 'top-4 md:top-5' : 'top-4 md:top-6'} left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-20 w-full px-4`}>
          <h1 className={`${presentationMode ? 'text-sm md:text-lg opacity-80' : 'text-xl md:text-3xl'} font-extrabold tracking-tight bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent text-center drop-shadow-sm whitespace-nowrap`}>
            Data Pyramid
          </h1>
          <p className={`${presentationMode ? 'text-[8px] md:text-[10px]' : 'text-[10px] md:text-xs'} text-primary uppercase font-mono tracking-[0.2em] mt-1 md:mt-2 whitespace-nowrap`}>
            Data to Decision Intelligence
          </p>
        </header>

        {!isV2 ? (
          <>
            {/* Main-pyramid entry point and case-study exit action */}
            <div className="absolute top-16 right-4 pointer-events-auto z-30 flex items-start gap-2 md:top-6 md:right-8">
              {forgingCaseStudy ? (
                <button
                  onClick={exitForgingCaseStudy}
                  className="rounded-md border border-rose-300/40 bg-rose-400/15 px-3 py-2 text-xs font-semibold text-rose-100 shadow-lg transition-colors hover:bg-rose-400/25"
                >
                  <span className="hidden sm:inline">Return to Main Pyramid</span>
                  <span className="sm:hidden">Exit Case Study</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={enterForgingCaseStudy}
                    className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 shadow-lg transition-colors hover:bg-cyan-300/20"
                  >
                    <span className="hidden sm:inline">Forging Case Study</span>
                    <span className="sm:hidden">Forging</span>
                  </button>
                  <AddDataDialog />
                </>
              )}
            </div>

            {/* Panels and Controls */}
            {!forgingCaseStudy && <LibraryPanel />}
            <ContextCard />
            {forgingCaseStudy ? <ForgingControls /> : <Controls />}
          </>
        ) : (
          v2Mode === 'walkthrough' && <WalkthroughUI />
        )}
      </div>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;