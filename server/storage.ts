import { 
  type User, 
  type InsertUser, 
  type Ticket, 
  type InsertTicket, 
  type Activity, 
  type InsertActivity,
  type FeedTicket,
  type AgentStats,
  type LeaderboardUser
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(userId: string, updates: Partial<User>): Promise<User | undefined>;
  getLeaderboard(): Promise<LeaderboardUser[]>;

  // Tickets
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketFeed(agentId?: string): Promise<FeedTicket[]>;
  getAgentQueue(agentId: string): Promise<FeedTicket[]>;
  getResolvedTickets(agentId: string): Promise<Ticket[]>;
  getEscalatedTickets(agentId: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  assignTicket(ticketId: string, agentId: string, agentName: string): Promise<Ticket | undefined>;
  resolveTicket(ticketId: string): Promise<Ticket | undefined>;
  escalateTicket(ticketId: string): Promise<Ticket | undefined>;

  // Activities
  getActivities(ticketId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Agent Stats
  getAgentStats(agentId: string): Promise<AgentStats>;
}

// Default agent for demo
const defaultAgent: User = {
  id: "agent-1",
  username: "mike",
  password: "demo",
  displayName: "Agent Mike",
  avatarUrl: null,
  role: "agent",
  streak: 3,
  coins: 450,
  ticketsResolved: 27,
};


export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tickets: Map<string, Ticket>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.activities = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      displayName: insertUser.displayName,
      avatarUrl: insertUser.avatarUrl || null,
      role: insertUser.role || "agent",
      streak: 0,
      coins: 0,
      ticketsResolved: 0,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStats(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates };
    this.users.set(userId, updated);
    return updated;
  }

  async getLeaderboard(): Promise<LeaderboardUser[]> {
    return Array.from(this.users.values())
      .filter(u => u.role === "agent")
      .sort((a, b) => b.ticketsResolved - a.ticketsResolved)
      .map((user, idx): LeaderboardUser => ({ ...user, rank: idx + 1 }));
  }

  // Tickets
  async getTicket(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketFeed(agentId?: string): Promise<FeedTicket[]> {
    const tickets = Array.from(this.tickets.values())
      .filter(t => t.status === "open" && !t.assigneeId)
      .sort((a, b) => {
        // Sort by priority then by SLA
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Then by SLA deadline
        if (a.slaDeadline && b.slaDeadline) {
          return new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
        }
        return 0;
      });

    return tickets.map(t => ({
      ...t,
      activityCount: Array.from(this.activities.values()).filter(a => a.ticketId === t.id).length,
    }));
  }

  async getAgentQueue(agentId: string): Promise<FeedTicket[]> {
    const tickets = Array.from(this.tickets.values())
      .filter(t => t.assigneeId === agentId && (t.status === "assigned" || t.status === "in_progress"))
      .sort((a, b) => {
        if (a.slaDeadline && b.slaDeadline) {
          return new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
        }
        return 0;
      });

    return tickets.map(t => ({
      ...t,
      activityCount: Array.from(this.activities.values()).filter(a => a.ticketId === t.id).length,
    }));
  }

  async getResolvedTickets(agentId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(t => t.assigneeId === agentId && t.status === "resolved")
      .sort((a, b) => {
        if (a.resolvedAt && b.resolvedAt) {
          return new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime();
        }
        return 0;
      });
  }

  async getEscalatedTickets(agentId: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(t => t.status === "escalated")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = randomUUID();
    const now = new Date();
    const ticket: Ticket = {
      id,
      title: insertTicket.title,
      description: insertTicket.description,
      videoUrl: insertTicket.videoUrl || null,
      thumbnailUrl: insertTicket.thumbnailUrl || null,
      priority: insertTicket.priority || "medium",
      status: insertTicket.status || "open",
      category: insertTicket.category || "other",
      requesterId: insertTicket.requesterId,
      requesterName: insertTicket.requesterName,
      requesterAvatar: insertTicket.requesterAvatar || null,
      assigneeId: insertTicket.assigneeId || null,
      assigneeName: insertTicket.assigneeName || null,
      assetTag: insertTicket.assetTag || null,
      assetName: insertTicket.assetName || null,
      slaDeadline: insertTicket.slaDeadline || null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      hasBounty: insertTicket.hasBounty || false,
      bountyAmount: insertTicket.bountyAmount || 0,
      viewCount: 0,
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async assignTicket(ticketId: string, agentId: string, agentName: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    const updated: Ticket = {
      ...ticket,
      assigneeId: agentId,
      assigneeName: agentName,
      status: "assigned",
      updatedAt: new Date(),
    };
    this.tickets.set(ticketId, updated);

    // Add activity
    await this.createActivity({
      ticketId,
      userId: agentId,
      userName: agentName,
      userAvatar: null,
      type: "assignment",
      content: `${agentName} assigned this ticket to themselves`,
      videoUrl: null,
    });

    return updated;
  }

  async resolveTicket(ticketId: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    const now = new Date();
    const updated: Ticket = {
      ...ticket,
      status: "resolved",
      resolvedAt: now,
      updatedAt: now,
    };
    this.tickets.set(ticketId, updated);

    // Update agent stats
    if (ticket.assigneeId) {
      const agent = this.users.get(ticket.assigneeId);
      if (agent) {
        const withinSla = ticket.slaDeadline ? now < new Date(ticket.slaDeadline) : true;
        await this.updateUserStats(ticket.assigneeId, {
          ticketsResolved: agent.ticketsResolved + 1,
          streak: withinSla ? agent.streak + 1 : 0,
          coins: agent.coins + (ticket.bountyAmount || 10),
        });
      }

      // Add activity
      await this.createActivity({
        ticketId,
        userId: ticket.assigneeId,
        userName: ticket.assigneeName || "Agent",
        userAvatar: null,
        type: "status_change",
        content: `Ticket resolved by ${ticket.assigneeName}`,
        videoUrl: null,
      });
    }

    return updated;
  }

  async escalateTicket(ticketId: string): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    const updated: Ticket = {
      ...ticket,
      status: "escalated",
      updatedAt: new Date(),
    };
    this.tickets.set(ticketId, updated);

    // Add activity
    await this.createActivity({
      ticketId,
      userId: ticket.assigneeId || "system",
      userName: ticket.assigneeName || "System",
      userAvatar: null,
      type: "escalation",
      content: "Ticket escalated to Tier 2 support",
      videoUrl: null,
    });

    return updated;
  }

  // Activities
  async getActivities(ticketId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.ticketId === ticketId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      id,
      ticketId: insertActivity.ticketId,
      userId: insertActivity.userId,
      userName: insertActivity.userName,
      userAvatar: insertActivity.userAvatar || null,
      type: insertActivity.type,
      content: insertActivity.content,
      videoUrl: insertActivity.videoUrl || null,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Agent Stats
  async getAgentStats(agentId: string): Promise<AgentStats> {
    const agent = this.users.get(agentId) || defaultAgent;
    const assignedTickets = Array.from(this.tickets.values())
      .filter(t => t.assigneeId === agentId && (t.status === "assigned" || t.status === "in_progress"));
    
    const allAgents = await this.getLeaderboard();
    const rank = allAgents.findIndex(a => a.id === agentId) + 1;

    return {
      streak: agent.streak,
      coins: agent.coins,
      ticketsResolved: agent.ticketsResolved,
      ticketsAssigned: assignedTickets.length,
      avgResponseTime: "15m",
      rank: rank || allAgents.length + 1,
    };
  }
}

export const storage = new MemStorage();
