import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { CreateTicketDialog } from "@/components/create-ticket-dialog";
import { 
  Home, 
  PlayCircle, 
  Inbox, 
  CheckCircle, 
  AlertTriangle, 
  Trophy, 
  Settings,
  Flame,
  Bell,
  LogOut
} from "lucide-react";

const mainMenuItems = [
  { title: "For You", url: "/", icon: Home, badge: null },
  { title: "My Queue", url: "/queue", icon: Inbox, badge: null },
  { title: "Resolved", url: "/resolved", icon: CheckCircle, badge: null },
  { title: "Escalated", url: "/escalated", icon: AlertTriangle, badge: null },
];

const discoverItems = [
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Knowledge Base", url: "/knowledge", icon: PlayCircle },
];

interface AppSidebarProps {
  streak?: number;
  coins?: number;
}

export function AppSidebar({ streak = 0, coins = 0 }: AppSidebarProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const getInitials = (name: string) => {
    return name.split(/[\s@]/).map(n => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <PlayCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg" data-testid="text-app-name">StreamOps</h1>
            <p className="text-xs text-sidebar-foreground/60">The Feed is the Work</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Actions */}
        <div className="p-3">
          <CreateTicketDialog />
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto bg-primary/20 text-primary border-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Discover */}
        <SidebarGroup>
          <SidebarGroupLabel>Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {discoverItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Stats Quick View */}
        <SidebarGroup>
          <SidebarGroupLabel>Your Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50">
                <div className="flex items-center gap-2">
                  <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">Streak</span>
                </div>
                <span className="font-bold" data-testid="sidebar-streak">{streak}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">Coins</span>
                </div>
                <span className="font-bold" data-testid="sidebar-coins">{coins}</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 rounded-lg hover-elevate">
          <Avatar className="w-9 h-9">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user ? getInitials(user.displayName || user.email) : 'AG'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="sidebar-user-name">
              {user?.displayName || user?.email?.split('@')[0] || 'Agent'}
            </p>
            <p className="text-xs text-sidebar-foreground/60">Tier 1 Support</p>
          </div>
          <Button size="icon" variant="ghost" data-testid="button-notifications">
            <Bell className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => signOut()}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
