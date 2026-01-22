import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Video, AtSign, MessageSquare, UserPlus, CheckCircle, AlertTriangle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Activity } from "@shared/schema";

interface ActivitySheetProps {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const activityIcons = {
  comment: MessageSquare,
  status_change: CheckCircle,
  assignment: UserPlus,
  video_reply: Video,
  escalation: AlertTriangle,
};

export function ActivitySheet({ ticketId, open, onOpenChange }: ActivitySheetProps) {
  const [newComment, setNewComment] = useState("");

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/tickets', ticketId, 'activities'],
    enabled: !!ticketId && open,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/tickets/${ticketId}/activities`, {
        content,
        type: 'comment',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId, 'activities'] });
      setNewComment("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type: string) => {
    const Icon = activityIcons[type as keyof typeof activityIcons] || MessageSquare;
    return Icon;
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'status_change': return 'text-green-400';
      case 'assignment': return 'text-blue-400';
      case 'video_reply': return 'text-primary';
      case 'escalation': return 'text-orange-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Activity
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-140px)] py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex gap-3" data-testid={`activity-item-${activity.id}`}>
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={activity.userAvatar || undefined} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                          {getInitials(activity.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm" data-testid={`text-activity-user-${activity.id}`}>
                          {activity.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(activity.createdAt)}
                        </span>
                      </div>
                      <div className="bg-secondary rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap" data-testid={`text-activity-content-${activity.id}`}>
                          {activity.content}
                        </p>
                        {activity.videoUrl && (
                          <div className="mt-2 relative aspect-video bg-black rounded-lg overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Video className="w-8 h-8 text-white/50" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No activity yet</p>
              <p className="text-sm text-muted-foreground/70">Be the first to comment!</p>
            </div>
          )}
        </ScrollArea>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment... Use @name to tag others"
                className="min-h-[44px] max-h-32 resize-none pr-10"
                data-testid="input-comment"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1"
                data-testid="button-mention"
              >
                <AtSign className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              <Button 
                type="submit" 
                size="icon"
                disabled={!newComment.trim() || addCommentMutation.isPending}
                data-testid="button-send-comment"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                data-testid="button-video-reply"
              >
                <Video className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
