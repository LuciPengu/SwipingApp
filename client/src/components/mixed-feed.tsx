import { useState } from "react";
import { TicketCard } from "./ticket-card";
import { PostCard } from "./post-card";
import { ActivitySheet } from "./activity-sheet";
import { PostCommentsSheet } from "./post-comments-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedTicket, Post, FeedItem } from "@shared/schema";

interface MixedFeedProps {
  items: FeedItem[];
  isLoading?: boolean;
  onAssign: (ticketId: string) => void;
  onResolve: (ticketId: string) => void;
  onEscalate: (ticketId: string) => void;
  onLikePost: (postId: string) => void;
  onRefresh: () => void;
}

export function MixedFeed({ 
  items, 
  isLoading,
  onAssign, 
  onResolve, 
  onEscalate,
  onLikePost,
  onRefresh 
}: MixedFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleSkip = (itemId: string) => {
    if (items.length <= 1) return;
    
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleAssign = (ticketId: string) => {
    onAssign(ticketId);
  };

  const handleResolve = (ticketId: string) => {
    onResolve(ticketId);
    handleSkip(ticketId);
  };

  const handleEscalate = (ticketId: string) => {
    onEscalate(ticketId);
    handleSkip(ticketId);
  };

  const handleViewActivity = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActivityOpen(true);
  };

  const handleViewPostComments = (postId: string) => {
    setSelectedPostId(postId);
    setCommentsOpen(true);
  };

  const handleLikePost = (postId: string) => {
    onLikePost(postId);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="h-[calc(100vh-180px)] aspect-[9/16] relative">
          <Skeleton className="w-full h-full rounded-lg" />
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="absolute right-3 bottom-32 flex flex-col gap-5">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
          <svg 
            className="w-12 h-12 text-muted-foreground" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" data-testid="text-empty-title">All caught up!</h2>
        <p className="text-muted-foreground max-w-sm" data-testid="text-empty-description">
          No content in your feed right now. Create a post or check back soon!
        </p>
      </div>
    );
  }

  const currentItem = items[currentIndex];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2" data-testid="container-mixed-feed">
      {/* Main Feed Card */}
      <div className="h-[calc(100vh-100px)] aspect-[9/16] relative">
        {currentItem && currentItem.type === "ticket" ? (
          <TicketCard
            key={currentItem.id}
            ticket={currentItem as FeedTicket}
            onAssign={handleAssign}
            onResolve={handleResolve}
            onEscalate={handleEscalate}
            onSkip={handleSkip}
            onViewActivity={handleViewActivity}
            isActive={true}
            currentIndex={currentIndex}
            totalCount={items.length}
            canSkip={items.length > 1}
          />
        ) : currentItem && currentItem.type === "post" ? (
          <PostCard
            key={currentItem.id}
            post={currentItem as Post}
            onLike={handleLikePost}
            onComment={handleViewPostComments}
            onSkip={handleSkip}
            isActive={true}
            currentIndex={currentIndex}
            totalCount={items.length}
            canSkip={items.length > 1}
          />
        ) : null}
      </div>

      {/* Swipe Instructions */}
      <div className="w-full max-w-md mt-4 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-1">
          <span className="text-orange-400">Swipe Left</span>
          <span>Escalate</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-green-400">Swipe Right</span>
          <span>Quick Resolve</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-blue-400">Swipe Up</span>
          <span>Skip</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-primary">Double Tap</span>
          <span>Like/Assign</span>
        </div>
      </div>

      {/* Activity Sheet for Tickets */}
      <ActivitySheet
        ticketId={selectedTicketId}
        open={activityOpen}
        onOpenChange={setActivityOpen}
      />

      {/* Comments Sheet for Posts */}
      <PostCommentsSheet
        postId={selectedPostId}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </div>
  );
}
