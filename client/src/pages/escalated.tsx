import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Clock,
  Cpu,
  Monitor,
  Wifi,
  Key,
  HelpCircle,
  ArrowUpRight,
  Calendar
} from "lucide-react";
import type { Ticket } from "@shared/schema";

const categoryIcons = {
  hardware: Cpu,
  software: Monitor,
  network: Wifi,
  access: Key,
  other: HelpCircle,
};

const priorityColors = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

export default function Escalated() {
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets/escalated'],
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
    <div className="p-6" data-testid="page-escalated">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Escalated Tickets</h1>
            <p className="text-muted-foreground">Tickets sent to Tier 2</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2 bg-orange-500/20 text-orange-400 border-0">
          {tickets?.length || 0} escalated
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        {tickets && tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const CategoryIcon = categoryIcons[ticket.category as keyof typeof categoryIcons] || HelpCircle;
              const priority = ticket.priority as keyof typeof priorityColors;

              return (
                <Card key={ticket.id} className="hover-elevate border-orange-500/20" data-testid={`card-ticket-${ticket.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Alert Icon */}
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <ArrowUpRight className="w-5 h-5 text-orange-500" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${priorityColors[priority]} text-white border-0`}>
                              {ticket.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className="border-0">
                              <CategoryIcon className="w-3 h-3 mr-1" />
                              {ticket.category}
                            </Badge>
                          </div>
                        </div>

                        <h3 className="font-semibold line-clamp-1 mb-1" data-testid={`text-title-${ticket.id}`}>
                          {ticket.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                          {ticket.description}
                        </p>

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
                            <Calendar className="w-4 h-4" />
                            <span>Escalated {formatDate(ticket.updatedAt)}</span>
                          </div>
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
                <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No escalated tickets</h3>
              <p className="text-sm text-muted-foreground">
                Tickets you escalate will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
}
