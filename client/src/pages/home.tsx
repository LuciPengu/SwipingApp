import { useQuery, useMutation } from "@tanstack/react-query";
import { TicketFeed } from "@/components/ticket-feed";
import { AgentStats } from "@/components/agent-stats";
import { CreateTicketDialog } from "@/components/create-ticket-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { mcpClient } from "@/lib/mcp-client";
import type { FeedTicket, AgentStats as AgentStatsType } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();

  const { data: tickets, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery<FeedTicket[]>({
    queryKey: ['/mcp/tickets/feed'],
    queryFn: () => mcpClient.getFeed() as Promise<FeedTicket[]>,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AgentStatsType>({
    queryKey: ['/mcp/agent/stats'],
    queryFn: () => mcpClient.getAgentStats() as Promise<AgentStatsType>,
  });

  const assignMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return mcpClient.assignTicket(ticketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/agent/stats'] });
      toast({
        title: "Ticket Assigned",
        description: "This ticket is now in your queue.",
      });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      return mcpClient.resolveTicket(ticketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/resolved'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/agent/stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/mcp/tickets/escalated'] });
      toast({
        title: "Ticket Escalated",
        description: "This ticket has been sent to Tier 2.",
      });
    },
  });

  const handleAssign = (ticketId: string) => {
    assignMutation.mutate(ticketId);
  };

  const handleResolve = (ticketId: string) => {
    resolveMutation.mutate(ticketId);
  };

  const handleEscalate = (ticketId: string) => {
    escalateMutation.mutate(ticketId);
  };

  const handleRefresh = () => {
    refetchTickets();
  };

  const defaultStats: AgentStatsType = {
    streak: 0,
    coins: 0,
    ticketsResolved: 0,
    ticketsAssigned: 0,
    avgResponseTime: "0m",
    rank: 0,
  };

  return (
    <div className="flex h-full" data-testid="page-home">
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-semibold">Ticket Feed</h1>
          <CreateTicketDialog />
        </div>
        <div className="flex-1 overflow-hidden">
        <TicketFeed
          tickets={tickets || []}
          isLoading={ticketsLoading}
          onAssign={handleAssign}
          onResolve={handleResolve}
          onEscalate={handleEscalate}
          onRefresh={handleRefresh}
        />
        </div>
      </div>

      <div className="hidden lg:block w-80 border-l border-border p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Your Performance</h2>
        <AgentStats 
          stats={stats || defaultStats} 
          isLoading={statsLoading}
        />
      </div>
    </div>
  );
}
