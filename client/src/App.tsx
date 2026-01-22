import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Queue from "@/pages/queue";
import Resolved from "@/pages/resolved";
import Escalated from "@/pages/escalated";
import Leaderboard from "@/pages/leaderboard";
import Knowledge from "@/pages/knowledge";
import type { AgentStats } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/queue" component={Queue} />
      <Route path="/resolved" component={Resolved} />
      <Route path="/escalated" component={Escalated} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/knowledge" component={Knowledge} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { data: stats } = useQuery<AgentStats>({
    queryKey: ['/api/agent/stats'],
  });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar streak={stats?.streak || 0} coins={stats?.coins || 0} />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between p-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <span className="text-sm text-muted-foreground hidden sm:block">
                Swipe through tickets. Resolve with style.
              </span>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-hidden">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
