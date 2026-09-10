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

const queryClient = new QueryClient();

function Home() {
  return (
    <div className="min-h-[100dvh] w-full relative bg-background text-foreground font-sans overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <PyramidScene />
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none h-full">
        
        {/* Header */}
        <header className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent text-center drop-shadow-sm">
            Manufacturing Data Pyramid
          </h1>
          <p className="text-[10px] md:text-xs text-primary uppercase font-mono tracking-[0.2em] mt-2">
            Data to Decision Intelligence
          </p>
        </header>

        {/* Floating Add Data button & dialog */}
        <div className="pointer-events-auto">
          <AddDataDialog />
        </div>

        {/* Panels */}
        <div className="pointer-events-auto">
          <LibraryPanel />
        </div>

        <div className="pointer-events-auto">
          <ContextCard />
        </div>

        {/* Controls */}
        <div className="pointer-events-auto">
          <Controls />
        </div>
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