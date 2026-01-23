import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import { queryClient } from "@/lib/queryClient";
import type { PostComment } from "@shared/schema";

interface PostCommentsSheetProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostCommentsSheet({ postId, open, onOpenChange }: PostCommentsSheetProps) {
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ['/mcp/posts', postId, 'comments'],
    queryFn: async () => {
      const result = await mcpClient.getPostComments(postId!);
      return result as PostComment[];
    },
    enabled: !!postId && open,
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => mcpClient.addPostComment(postId!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/posts', postId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/feed/mixed'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/posts'] });
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
        <SheetHeader className="pb-2">
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4" data-testid="container-comments">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </>
            ) : comments?.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            ) : (
              comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={comment.userAvatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(comment.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-sm">
                        {comment.userName.split("@")[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1"
              data-testid="input-comment"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newComment.trim() || addCommentMutation.isPending}
              data-testid="button-send-comment"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
