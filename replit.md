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

## Environment Variables
Required for frontend (prefix with VITE_):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key

Optional for backend:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key

## Development
The app runs on port 5000. Start with `npm run dev`. The FastAPI MCP server is automatically spawned on port 8000.

## Recent Changes
- Added Supabase authentication with login/signup pages
- Replaced Express API with FastAPI MCP server
- Express proxy forwards /mcp/* requests to FastAPI
- Protected routes redirect unauthenticated users to login
- MCP server spawns as child process of Express
- User info displayed in sidebar with logout button
