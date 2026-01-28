import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Play,
  Cpu,
  Monitor,
  Wifi,
  Key,
  HelpCircle,
  Coins,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { mcpClient, QueueFilters } from "@/lib/mcp-client";
import { useToast } from "@/hooks/use-toast";
import type { FeedTicket } from "@shared/schema";

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

export default function Queue() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const filters: QueueFilters = useMemo(() => ({
    priority: priorityFilter && priorityFilter !== "all" ? priorityFilter : undefined,
    category: categoryFilter && categoryFilter !== "all" ? categoryFilter : undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
  }), [priorityFilter, categoryFilter, search, sortBy, sortOrder]);

  const { data: tickets, isLoading } = useQuery<FeedTicket[]>({
    queryKey: ['/mcp/tickets/queue', filters],
    queryFn: () => mcpClient.getQueue(filters) as Promise<FeedTicket[]>,
  });

  const resolveMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return mcpClient.resolveTicket(ticketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/resolved'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/agent/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/activity/events'] });
      toast({
        title: "Ticket Resolved",
        description: "Great job! Your streak continues.",
      });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return mcpClient.escalateTicket(ticketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/escalated'] });
      toast({
        title: "Ticket Escalated",
        description: "This ticket has been sent to Tier 2.",
      });
    },
  });

  const clearFilters = () => {
    setSearch("");
    setPriorityFilter("");
    setCategoryFilter("");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  const hasActiveFilters = search || priorityFilter || categoryFilter || sortBy !== "created_at";

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatSlaRemaining = (deadline: string | Date | null) => {
    if (!deadline) return null;
    const now = new Date();
    const d = new Date(deadline);
    const diff = d.getTime() - now.getTime();
    
    if (diff < 0) return { text: "OVERDUE", urgent: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: `${days}d ${hours % 24}h`, urgent: false };
    }
    
    return { text: `${hours}h ${minutes}m`, urgent: hours < 2 };
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="page-queue">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">My Queue</h1>
          <p className="text-muted-foreground">Tickets assigned to you</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2" data-testid="badge-queue-count">
          {tickets?.length || 0} tickets
        </Badge>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} data-testid="button-clear-filters">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32" data-testid="select-priority">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32" data-testid="select-category">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="sla_deadline">SLA Deadline</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Order</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="w-24"
                data-testid="button-sort-order"
              >
                <ArrowUpDown className="w-3 h-3 mr-1" />
                {sortOrder === "asc" ? "Oldest" : "Newest"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        {tickets && tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const CategoryIcon = categoryIcons[ticket.category as keyof typeof categoryIcons] || HelpCircle;
              const priority = ticket.priority as keyof typeof priorityColors;
              const slaInfo = formatSlaRemaining(ticket.slaDeadline);

              return (
                <Card key={ticket.id} className="hover-elevate" data-testid={`card-ticket-${ticket.id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        {ticket.thumbnailUrl ? (
                          <img 
                            src={ticket.thumbnailUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <CategoryIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                        {ticket.videoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

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
                            {ticket.hasBounty && (
                              <Badge className="bounty-shimmer text-black border-0">
                                <Coins className="w-3 h-3 mr-1" />
                                {ticket.bountyAmount}
                              </Badge>
                            )}
                          </div>
                          {slaInfo && (
                            <Badge 
                              variant={slaInfo.urgent ? "destructive" : "secondary"}
                              className="flex-shrink-0"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {slaInfo.text}
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold mb-1 line-clamp-1" data-testid={`text-title-${ticket.id}`}>
                          {ticket.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {ticket.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={ticket.requesterAvatar || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(ticket.requesterName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {ticket.requesterName}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => escalateMutation.mutate(ticket.id)}
                              disabled={escalateMutation.isPending}
                              data-testid={`button-escalate-${ticket.id}`}
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Escalate
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => resolveMutation.mutate(ticket.id)}
                              disabled={resolveMutation.isPending}
                              data-testid={`button-resolve-${ticket.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Resolve
                            </Button>
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
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">
                {hasActiveFilters ? "No matching tickets" : "No tickets in queue"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more tickets."
                  : "Head to \"For You\" to pick up some tickets!"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
}
