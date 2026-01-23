import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { mcpClient } from "@/lib/mcp-client";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Queue from "@/pages/queue";
import Resolved from "@/pages/resolved";
import Escalated from "@/pages/escalated";
import Leaderboard from "@/pages/leaderboard";
import Knowledge from "@/pages/knowledge";
import Team from "@/pages/team";
import ProfilePage from "@/pages/profile";
import MyProfilePage from "@/pages/my-profile";
import Login from "@/pages/login";
import type { AgentStats } from "@shared/schema";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/queue">
        <ProtectedRoute component={Queue} />
      </Route>
      <Route path="/resolved">
        <ProtectedRoute component={Resolved} />
      </Route>
      <Route path="/escalated">
        <ProtectedRoute component={Escalated} />
      </Route>
      <Route path="/leaderboard">
        <ProtectedRoute component={Leaderboard} />
      </Route>
      <Route path="/knowledge">
        <ProtectedRoute component={Knowledge} />
      </Route>
      <Route path="/team">
        <ProtectedRoute component={Team} />
      </Route>
      <Route path="/profile/:userId">
        <ProtectedRoute component={ProfilePage} />
      </Route>
      <Route path="/my-profile">
        <ProtectedRoute component={MyProfilePage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  const { data: stats } = useQuery<AgentStats>({
    queryKey: ['/mcp/agent/stats'],
    queryFn: () => mcpClient.getAgentStats() as Promise<AgentStats>,
    enabled: !!user,
  });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || location === '/login') {
    return <Router />;
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar streak={stats?.streak || 0} coins={stats?.coins || 0} />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between p-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
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
          <AuthProvider>
            <AppContent />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
