import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  Clock,
  Cpu,
  Monitor,
  Wifi,
  Key,
  HelpCircle,
  Coins,
  Calendar
} from "lucide-react";
import { mcpClient } from "@/lib/mcp-client";
import type { Ticket } from "@shared/schema";

const categoryIcons = {
  hardware: Cpu,
  software: Monitor,
  network: Wifi,
  access: Key,
  other: HelpCircle,
};

export default function Resolved() {
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['/mcp/tickets/resolved'],
    queryFn: () => mcpClient.getResolved() as Promise<Ticket[]>,
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateResolutionTime = (created: string | Date, resolved: string | Date | null) => {
    if (!resolved) return null;
    const start = new Date(created);
    const end = new Date(resolved);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="page-resolved">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">Resolved Tickets</h1>
            <p className="text-muted-foreground">Your successfully closed tickets</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2 bg-green-500/20 text-green-400 border-0">
          {tickets?.length || 0} resolved
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        {tickets && tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const CategoryIcon = categoryIcons[ticket.category as keyof typeof categoryIcons] || HelpCircle;
              const resolutionTime = calculateResolutionTime(ticket.createdAt, ticket.resolvedAt);

              return (
                <Card key={ticket.id} className="hover-elevate" data-testid={`card-ticket-${ticket.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Check Icon */}
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold line-clamp-1" data-testid={`text-title-${ticket.id}`}>
                              {ticket.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {ticket.description}
                            </p>
                          </div>
                          {ticket.hasBounty && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0 flex-shrink-0">
                              <Coins className="w-3 h-3 mr-1" />
                              +{ticket.bountyAmount}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={ticket.requesterAvatar || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(ticket.requesterName)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{ticket.requesterName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CategoryIcon className="w-4 h-4" />
                            <span>{ticket.category}</span>
                          </div>
                          {resolutionTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>Resolved in {resolutionTime}</span>
                            </div>
                          )}
                          {ticket.resolvedAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(ticket.resolvedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No resolved tickets yet</h3>
              <p className="text-sm text-muted-foreground">
                Start resolving tickets to see them here!
              </p>
            </CardContent>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
}
