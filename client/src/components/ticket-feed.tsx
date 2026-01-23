import { useState } from "react";
import { TicketCard } from "./ticket-card";
import { ActivitySheet } from "./activity-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedTicket } from "@shared/schema";

interface TicketFeedProps {
  tickets: FeedTicket[];
  isLoading?: boolean;
  onAssign: (ticketId: string) => void;
  onResolve: (ticketId: string) => void;
  onEscalate: (ticketId: string) => void;
  onRefresh: () => void;
}

export function TicketFeed({ 
  tickets, 
  isLoading,
  onAssign, 
  onResolve, 
  onEscalate,
  onRefresh 
}: TicketFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);

  const handleSkip = (ticketId: string) => {
    if (currentIndex < tickets.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onRefresh();
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

  if (tickets.length === 0) {
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
          No open tickets in your queue. Your streak is safe for now. 
          Check back soon for new issues.
        </p>
      </div>
    );
  }

  const currentTicket = tickets[currentIndex];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4" data-testid="container-ticket-feed">
      {/* Feed Progress Indicator */}
      <div className="w-full max-w-md mb-3 flex gap-1">
        {tickets.map((_, idx) => (
          <div 
            key={idx}
            className={`h-1 flex-1 rounded-full transition-colors ${
              idx === currentIndex 
                ? 'bg-primary' 
                : idx < currentIndex 
                  ? 'bg-muted-foreground/50' 
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Ticket Counter */}
      <div className="w-full max-w-md mb-2 flex justify-between items-center text-sm text-muted-foreground">
        <span data-testid="text-ticket-counter">{currentIndex + 1} of {tickets.length}</span>
        <span className="text-xs">Swipe to navigate</span>
      </div>

      {/* Main Feed Card */}
      <div className="h-[calc(100vh-180px)] aspect-[9/16] relative">
        {currentTicket && (
          <TicketCard
            key={currentTicket.id}
            ticket={currentTicket}
            onAssign={handleAssign}
            onResolve={handleResolve}
            onEscalate={handleEscalate}
            onSkip={handleSkip}
            onViewActivity={handleViewActivity}
            isActive={true}
          />
        )}
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
          <span>Assign to Me</span>
        </div>
      </div>

      {/* Activity Sheet */}
      <ActivitySheet
        ticketId={selectedTicketId}
        open={activityOpen}
        onOpenChange={setActivityOpen}
      />
    </div>
  );
}
