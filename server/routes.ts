import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createActivitySchema } from "@shared/schema";
import { fromError } from "zod-validation-error";

// Default agent ID for demo (simulating logged-in agent)
const CURRENT_AGENT_ID = "agent-1";
const CURRENT_AGENT_NAME = "Agent Mike";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ========== TICKET FEED ENDPOINTS ==========
  
  // Get ticket feed (For You Page)
  app.get("/api/tickets/feed", async (req, res) => {
    try {
      const tickets = await storage.getTicketFeed();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ error: "Failed to fetch ticket feed" });
    }
  });

  // Get agent's queue (assigned tickets)
  app.get("/api/tickets/queue", async (req, res) => {
    try {
      const tickets = await storage.getAgentQueue(CURRENT_AGENT_ID);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching queue:", error);
      res.status(500).json({ error: "Failed to fetch queue" });
    }
  });

  // Get resolved tickets
  app.get("/api/tickets/resolved", async (req, res) => {
    try {
      const tickets = await storage.getResolvedTickets(CURRENT_AGENT_ID);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching resolved tickets:", error);
      res.status(500).json({ error: "Failed to fetch resolved tickets" });
    }
  });

  // Get escalated tickets
  app.get("/api/tickets/escalated", async (req, res) => {
    try {
      const tickets = await storage.getEscalatedTickets(CURRENT_AGENT_ID);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching escalated tickets:", error);
      res.status(500).json({ error: "Failed to fetch escalated tickets" });
    }
  });

  // Get single ticket
  app.get("/api/tickets/:id", async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });

  // ========== TICKET ACTIONS ==========

  // Assign ticket to current agent
  app.post("/api/tickets/:id/assign", async (req, res) => {
    try {
      const ticket = await storage.assignTicket(
        req.params.id,
        CURRENT_AGENT_ID,
        CURRENT_AGENT_NAME
      );
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ error: "Failed to assign ticket" });
    }
  });

  // Resolve ticket
  app.post("/api/tickets/:id/resolve", async (req, res) => {
    try {
      // First assign if not assigned
      let ticket = await storage.getTicket(req.params.id);
      if (ticket && !ticket.assigneeId) {
        await storage.assignTicket(req.params.id, CURRENT_AGENT_ID, CURRENT_AGENT_NAME);
      }
      
      ticket = await storage.resolveTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error resolving ticket:", error);
      res.status(500).json({ error: "Failed to resolve ticket" });
    }
  });

  // Escalate ticket
  app.post("/api/tickets/:id/escalate", async (req, res) => {
    try {
      const ticket = await storage.escalateTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      console.error("Error escalating ticket:", error);
      res.status(500).json({ error: "Failed to escalate ticket" });
    }
  });

  // ========== ACTIVITY ENDPOINTS ==========

  // Get ticket activities
  app.get("/api/tickets/:id/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities(req.params.id);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Add activity/comment to ticket
  app.post("/api/tickets/:id/activities", async (req, res) => {
    try {
      // Validate request body with Zod
      const parseResult = createActivitySchema.safeParse(req.body);
      
      if (!parseResult.success) {
        const errorMessage = fromError(parseResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const { content, type, videoUrl } = parseResult.data;

      const activity = await storage.createActivity({
        ticketId: req.params.id,
        userId: CURRENT_AGENT_ID,
        userName: CURRENT_AGENT_NAME,
        userAvatar: null,
        type: type || "comment",
        content,
        videoUrl: videoUrl || null,
      });

      res.json(activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  // ========== AGENT STATS ==========

  // Get current agent stats
  app.get("/api/agent/stats", async (req, res) => {
    try {
      const stats = await storage.getAgentStats(CURRENT_AGENT_ID);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching agent stats:", error);
      res.status(500).json({ error: "Failed to fetch agent stats" });
    }
  });

  // ========== LEADERBOARD ==========

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const users = await storage.getLeaderboard();
      res.json(users);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  return httpServer;
}
