import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Coins, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Trophy, 
  Award,
  MessageCircle,
  TrendingUp
} from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import type { ActivityEvent } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const eventIcons: Record<string, React.ElementType> = {
  points_earned: Coins,
  ticket_resolved: CheckCircle2,
  ticket_escalated: AlertTriangle,
  streak_achieved: Flame,
  leaderboard_change: Trophy,
  badge_earned: Award,
  post_created: MessageCircle,
};

const eventColors: Record<string, string> = {
  points_earned: "text-yellow-500",
  ticket_resolved: "text-green-500",
  ticket_escalated: "text-orange-500",
  streak_achieved: "text-red-500",
  leaderboard_change: "text-purple-500",
  badge_earned: "text-blue-500",
  post_created: "text-cyan-500",
  default: "text-muted-foreground",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "just now";
  }
}

interface ActivityWallProps {
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

export function ActivityWall({ limit = 20, showTitle = true, className = "" }: ActivityWallProps) {
  const { data: events, isLoading } = useQuery<ActivityEvent[]>({
    queryKey: ['/mcp/activity/events', limit],
    queryFn: () => mcpClient.getActivityEvents(limit) as Promise<ActivityEvent[]>,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {showTitle && <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Activity</h3>}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Activity</h3>}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
          <p className="text-xs text-muted-foreground">Start resolving tickets to see updates!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Activity Feed
        </h3>
      )}
      <ScrollArea className="h-[400px]">
        <div className="space-y-1">
          {events.map((event) => {
            const Icon = eventIcons[event.type] || Coins;
            const iconColor = eventColors[event.type] || eventColors.default;
            
            return (
              <div 
                key={event.id} 
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                data-testid={`activity-event-${event.id}`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={event.userAvatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(event.userName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${iconColor} flex-shrink-0`} />
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{event.userName}</span>
                      {" "}
                      <span className="text-muted-foreground">{event.message}</span>
                    </p>
                  </div>
                  {event.metadata?.points && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Coins className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs font-medium text-yellow-500">+{event.metadata.points}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(event.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
