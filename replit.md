# StreamOps - TikTok-Style IT Helpdesk

## Overview
StreamOps is a modern IT helpdesk system inspired by TikTok's interface. Agents swipe through tickets like a social media feed, resolve issues with style, and compete on leaderboards. Built for the TikTok generation. Now with Supabase authentication and FastAPI MCP server.

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn UI + Framer Motion
- **Backend**: Express.js (port 5000) + FastAPI MCP Server (port 8000)
- **Authentication**: Supabase Auth
- **Routing**: wouter
- **State Management**: TanStack Query v5
- **Styling**: Custom dark theme with TikTok-inspired colors

## Architecture
```
Browser → Express (5000) → /mcp/* proxy → FastAPI MCP Server (8000)
                        → /api/* Express routes (legacy)
```

The Express server automatically spawns the FastAPI MCP server as a child process on startup. The proxy forwards all `/mcp/*` requests to FastAPI.

## Project Structure
```
client/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Shadcn components
│   │   ├── ticket-card.tsx     # Swipeable ticket card
│   │   ├── ticket-feed.tsx     # Feed container
│   │   ├── activity-sheet.tsx  # Comments/activity panel
│   │   ├── agent-stats.tsx     # Gamification stats
│   │   ├── app-sidebar.tsx     # Navigation sidebar
│   │   └── theme-provider.tsx  # Dark/light mode
│   ├── pages/            # Route components
│   │   ├── home.tsx      # Main feed page
│   │   ├── login.tsx     # Auth login/signup page
│   │   ├── queue.tsx     # Assigned tickets
│   │   ├── resolved.tsx  # Resolved tickets history
│   │   ├── escalated.tsx # Escalated tickets
│   │   ├── leaderboard.tsx # Agent rankings
│   │   └── knowledge.tsx # Video knowledge base
│   └── lib/              # Utilities
│       ├── supabase.ts   # Supabase client
│       ├── auth-context.tsx  # Auth context provider
│       └── mcp-client.ts # MCP API client wrapper
server/
├── index.ts              # Server entry, MCP spawn, proxy
├── routes.ts             # Legacy API endpoints
└── storage.ts            # In-memory data storage
mcp_server/
└── main.py               # FastAPI MCP server
shared/
└── schema.ts             # Data models and types
```

## Key Features
1. **TikTok-Style Feed**: Swipe gestures for ticket actions
   - Swipe Right: Quick Resolve
   - Swipe Left: Escalate
   - Swipe Up: Skip
   - Double Tap: Assign to me

2. **Supabase Authentication**: Email/password login and signup

3. **Gamification**: Streaks, coins, leaderboard rankings

4. **Activity Log**: Chat-style comments on tickets

5. **Dark Theme**: TikTok-inspired dark UI with vibrant accents

## MCP API Endpoints (FastAPI - /mcp/*)
- `GET /mcp/health` - Health check
- `GET /mcp/tickets/feed` - Open tickets for the feed
- `GET /mcp/tickets/queue` - Agent's assigned tickets
- `GET /mcp/tickets/resolved` - Resolved tickets
- `GET /mcp/tickets/escalated` - Escalated tickets
- `POST /mcp/tickets/:id/assign` - Assign ticket
- `POST /mcp/tickets/:id/resolve` - Resolve ticket
- `POST /mcp/tickets/:id/escalate` - Escalate ticket
- `GET /mcp/tickets/:id/activities` - Get ticket activities
- `POST /mcp/tickets/:id/activities` - Add comment
- `GET /mcp/agent/stats` - Current agent stats
- `GET /mcp/leaderboard` - Agent rankings
- `GET /mcp/knowledge/videos` - Get knowledge videos
- `POST /mcp/knowledge/videos` - Create knowledge video
- `GET /mcp/organizations` - Get all organizations

## Environment Variables
Required for frontend (prefix with VITE_):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key

Optional for backend:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key

## Development
The app runs on port 5000. Start with `npm run dev`. The FastAPI MCP server is automatically spawned on port 8000.

## Multi-Tenancy Database Setup
To enable multi-tenancy, run this SQL in your Supabase SQL Editor:

```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add organization columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- SLA Policies table
CREATE TABLE sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  priority TEXT NOT NULL,
  response_time_minutes INTEGER NOT NULL,
  resolution_time_minutes INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket Categories table  
CREATE TABLE ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add organization_id to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Add organization_id to agent_stats
ALTER TABLE agent_stats ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Knowledge Videos table for video-based solutions
CREATE TABLE knowledge_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  category TEXT DEFAULT 'other',
  author_id UUID,
  author_name TEXT,
  author_avatar TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  duration TEXT DEFAULT '0:00',
  coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for knowledge_videos
ALTER TABLE knowledge_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view org videos" ON knowledge_videos FOR SELECT USING (true);
CREATE POLICY "Users can insert videos" ON knowledge_videos FOR INSERT WITH CHECK (true);

-- Priority Configs table for customizable priorities with point values
CREATE TABLE priority_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  color TEXT DEFAULT '#gray',
  base_points INTEGER DEFAULT 25,
  response_time_minutes INTEGER DEFAULT 60,
  resolution_time_minutes INTEGER DEFAULT 480,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for priority_configs
ALTER TABLE priority_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view org priorities" ON priority_configs FOR SELECT USING (true);
CREATE POLICY "Users can insert priorities" ON priority_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update priorities" ON priority_configs FOR UPDATE USING (true);
CREATE POLICY "Users can delete priorities" ON priority_configs FOR DELETE USING (true);

-- Add bonus_points to ticket_categories
ALTER TABLE ticket_categories ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0;

-- Enable RLS for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies (adjust as needed)
CREATE POLICY "Users can view their organization" ON organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert organizations" ON organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their organization" ON organizations FOR UPDATE USING (true);

CREATE POLICY "Users can view org SLA policies" ON sla_policies FOR SELECT USING (true);
CREATE POLICY "Users can insert SLA policies" ON sla_policies FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view org categories" ON ticket_categories FOR SELECT USING (true);
CREATE POLICY "Users can insert categories" ON ticket_categories FOR INSERT WITH CHECK (true);

-- Activity Events table for activity wall/feed
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  organization_id UUID REFERENCES organizations(id),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for activity_events
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view org events" ON activity_events FOR SELECT USING (true);
CREATE POLICY "System can insert events" ON activity_events FOR INSERT WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_activity_events_org_created ON activity_events(organization_id, created_at DESC);
```

## Recent Changes
- Added team member management in settings (view members, update roles, remove members)
- Fixed create ticket dialog to use configured priorities/categories with proper defaults
- Added activity wall/feed showing points earned, tickets resolved, and team activity
- Added ticket filtering and sorting (priority, category, search, sort by date/SLA/priority)
- Added configurable priorities with custom point values per organization
- Added editable priorities and categories UI in settings page
- Resolve ticket now uses org's configured point values for the ticket priority
- Added priority_configs table for customizable priorities
- Added video upload to knowledge base using Replit Object Storage
- Added organization list management in settings page
- Added knowledge_videos table and MCP endpoints for video CRUD
- Added organization_id to agent_stats for leaderboard filtering
- Settings page now shows all organizations with current org highlighted
- Added multi-tenancy support with organizations
- Organization setup flow on first login (create or join)
- ITSM configuration: SLA policies and ticket categories
- Settings page showing org info, SLA policies, categories
- Sidebar shows organization name
- Added Supabase authentication with login/signup pages
- Replaced Express API with FastAPI MCP server
- Express proxy forwards /mcp/* requests to FastAPI
- Protected routes redirect unauthenticated users to login
- MCP server spawns as child process of Express
- User info displayed in sidebar with logout button
