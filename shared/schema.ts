import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Agents table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("agent"),
  streak: integer("streak").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  ticketsResolved: integer("tickets_resolved").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatarUrl: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Priority levels
export const priorityLevels = ["low", "medium", "high", "critical"] as const;
export type Priority = typeof priorityLevels[number];

// Ticket status
export const ticketStatuses = ["open", "assigned", "in_progress", "resolved", "escalated"] as const;
export type TicketStatus = typeof ticketStatuses[number];

// Categories
export const categories = ["hardware", "software", "network", "access", "other"] as const;
export type Category = typeof categories[number];

// Tickets table
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  category: text("category").notNull().default("other"),
  requesterId: varchar("requester_id").notNull(),
  requesterName: text("requester_name").notNull(),
  requesterAvatar: text("requester_avatar"),
  assigneeId: varchar("assignee_id"),
  assigneeName: text("assignee_name"),
  assetTag: text("asset_tag"),
  assetName: text("asset_name"),
  slaDeadline: timestamp("sla_deadline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  hasBounty: boolean("has_bounty").notNull().default(false),
  bountyAmount: integer("bounty_amount").default(0),
  viewCount: integer("view_count").notNull().default(0),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  viewCount: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// Activity/Comments table
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  userId: varchar("user_id").notNull(),
  userName: text("user_name").notNull(),
  userAvatar: text("user_avatar"),
  type: text("type").notNull(), // "comment", "status_change", "assignment", "video_reply"
  content: text("content").notNull(),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Agent stats for gamification
export interface AgentStats {
  streak: number;
  coins: number;
  ticketsResolved: number;
  ticketsAssigned: number;
  avgResponseTime: string;
  rank: number;
}

// Feed ticket with calculated fields
export interface FeedTicket extends Ticket {
  slaRemaining?: string;
  isUrgent?: boolean;
  activityCount?: number;
}

// Leaderboard user with rank
export interface LeaderboardUser extends User {
  rank: number;
}

// Organization type for multi-tenancy
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  domain?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ITSM Configuration types
export interface SlaPolicy {
  id: string;
  organizationId: string;
  name: string;
  priority: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  isDefault: boolean;
}

export interface TicketCategory {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
}

export interface PriorityLevel {
  id: string;
  organizationId: string;
  name: string;
  level: number;
  color: string;
  slaMultiplier: number;
}

// Profile type
export interface Profile {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  department?: string | null;
  role: string;
  organizationId?: string | null;
  organizationName?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Post type for social feed
export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  title?: string | null;
  content: string;
  imageUrl?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  type: "post";
}

// Post comment type
export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  content: string;
  createdAt: string;
}

// Mixed feed item (ticket or post)
export type FeedItem = (FeedTicket & { type: "ticket" }) | Post;

// Activity creation schema for validation
export const createActivitySchema = z.object({
  content: z.string().min(1, "Content is required"),
  type: z.enum(["comment", "status_change", "assignment", "video_reply", "escalation"]).default("comment"),
  videoUrl: z.string().url().optional().nullable(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
