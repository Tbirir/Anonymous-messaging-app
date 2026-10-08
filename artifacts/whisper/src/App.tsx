import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@workspace/replit-auth-web';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Mark } from '@/components/brand';
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing';
import InboxPage from '@/pages/inbox';
import SettingsPage from '@/pages/settings';
import PublicProfile from '@/pages/public-profile';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Splash() {
  return (
    <div className="min-h-[100dvh] grid place-items-center">
      <Mark className="h-10 w-10 drift" />
    </div>
  );
}

function Authed({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <Splash />;
  if (!isAuthenticated) return <Landing />;
  return <>{children}</>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/u/:handle" component={PublicProfile} />
        <Route path="/"><Authed><InboxPage /></Authed></Route>
        <Route path="/settings"><Authed><SettingsPage /></Authed></Route>
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
