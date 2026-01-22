# StreamOps - TikTok-Style IT Helpdesk

## Overview
StreamOps is a modern IT helpdesk system inspired by TikTok's interface. Agents swipe through tickets like a social media feed, resolve issues with style, and compete on leaderboards. Built for the TikTok generation.

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn UI + Framer Motion
- **Backend**: Express.js with in-memory storage
- **Routing**: wouter
- **State Management**: TanStack Query v5
- **Styling**: Custom dark theme with TikTok-inspired colors

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
│   │   ├── queue.tsx     # Assigned tickets
│   │   ├── resolved.tsx  # Resolved tickets history
│   │   ├── escalated.tsx # Escalated tickets
│   │   ├── leaderboard.tsx # Agent rankings
│   │   └── knowledge.tsx # Video knowledge base
│   └── lib/              # Utilities
server/
├── routes.ts             # API endpoints
└── storage.ts            # In-memory data storage
shared/
└── schema.ts             # Data models and types
```

## Key Features
1. **TikTok-Style Feed**: Swipe gestures for ticket actions
   - Swipe Right: Quick Resolve
   - Swipe Left: Escalate
   - Swipe Up: Skip
   - Double Tap: Assign to me

2. **Gamification**: Streaks, coins, leaderboard rankings

3. **Activity Log**: Chat-style comments on tickets

4. **Dark Theme**: TikTok-inspired dark UI with vibrant accents

## API Endpoints
- `GET /api/tickets/feed` - Open tickets for the feed
- `GET /api/tickets/queue` - Agent's assigned tickets
- `GET /api/tickets/resolved` - Resolved tickets
- `GET /api/tickets/escalated` - Escalated tickets
- `POST /api/tickets/:id/assign` - Assign ticket
- `POST /api/tickets/:id/resolve` - Resolve ticket
- `POST /api/tickets/:id/escalate` - Escalate ticket
- `GET /api/tickets/:id/activities` - Get ticket activities
- `POST /api/tickets/:id/activities` - Add comment
- `GET /api/agent/stats` - Current agent stats
- `GET /api/leaderboard` - Agent rankings

## Development
The app runs on port 5000. Start with `npm run dev`.

## Recent Changes
- Initial MVP implementation with feed, queue, and gamification
- Dark theme with TikTok-inspired design
- Swipe gesture support using Framer Motion
- Agent stats and leaderboard
- Knowledge base with video cards
