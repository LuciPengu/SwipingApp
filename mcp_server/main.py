from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
import uuid

app = FastAPI(title="StreamOps MCP Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    try:
        supabase = get_supabase()
        user = supabase.auth.get_user(token)
        return user.user if user else None
    except Exception:
        return None

class Ticket(BaseModel):
    id: str
    title: str
    description: str
    priority: str
    status: str
    category: str
    requesterId: str
    requesterName: str
    requesterAvatar: Optional[str] = None
    assigneeId: Optional[str] = None
    assigneeName: Optional[str] = None
    assetTag: Optional[str] = None
    assetName: Optional[str] = None
    slaDeadline: str
    createdAt: str
    updatedAt: str
    resolvedAt: Optional[str] = None
    hasBounty: bool = False
    bountyAmount: int = 0
    viewCount: int = 0
    activityCount: int = 0

class Activity(BaseModel):
    id: str
    ticketId: str
    userId: str
    userName: str
    userAvatar: Optional[str] = None
    type: str
    content: str
    createdAt: str

class ActivityCreate(BaseModel):
    type: str
    content: str

class AgentStats(BaseModel):
    streak: int
    coins: int
    ticketsResolved: int
    ticketsAssigned: int
    avgResponseTime: str
    rank: int

class LeaderboardUser(BaseModel):
    id: str
    username: str
    displayName: str
    avatar: Optional[str] = None
    ticketsResolved: int
    streak: int
    coins: int

tickets_db: dict[str, dict] = {}
activities_db: dict[str, dict] = {}
agent_stats_db: dict[str, dict] = {}

def init_sample_data():
    now = datetime.utcnow()
    sample_tickets = [
        {
            "id": "ticket-1",
            "title": "Laptop screen flickering when connected to dock",
            "description": "My Dell laptop screen flickers every few seconds when I connect it to the docking station.",
            "priority": "high",
            "status": "open",
            "category": "hardware",
            "requesterId": "user-1",
            "requesterName": "Sarah Johnson",
            "requesterAvatar": None,
            "assigneeId": None,
            "assigneeName": None,
            "assetTag": "DELL-L5420-0892",
            "assetName": "Dell Latitude 5420",
            "slaDeadline": (now + timedelta(hours=2)).isoformat() + "Z",
            "createdAt": (now - timedelta(minutes=30)).isoformat() + "Z",
            "updatedAt": (now - timedelta(minutes=30)).isoformat() + "Z",
            "resolvedAt": None,
            "hasBounty": False,
            "bountyAmount": 0,
            "viewCount": 12,
            "activityCount": 0
        },
        {
            "id": "ticket-2",
            "title": "VPN disconnects randomly during meetings",
            "description": "I keep getting disconnected from the VPN during video calls.",
            "priority": "critical",
            "status": "open",
            "category": "network",
            "requesterId": "user-2",
            "requesterName": "Michael Chen",
            "requesterAvatar": None,
            "assigneeId": None,
            "assigneeName": None,
            "assetTag": None,
            "assetName": None,
            "slaDeadline": (now + timedelta(hours=1)).isoformat() + "Z",
            "createdAt": (now - timedelta(hours=1, minutes=45)).isoformat() + "Z",
            "updatedAt": (now - timedelta(hours=1, minutes=45)).isoformat() + "Z",
            "resolvedAt": None,
            "hasBounty": True,
            "bountyAmount": 50,
            "viewCount": 34,
            "activityCount": 0
        },
        {
            "id": "ticket-3",
            "title": "Can't access SharePoint folder",
            "description": "I'm getting permission denied when trying to open the Marketing team folder.",
            "priority": "medium",
            "status": "open",
            "category": "access",
            "requesterId": "user-3",
            "requesterName": "Emily Davis",
            "requesterAvatar": None,
            "assigneeId": None,
            "assigneeName": None,
            "assetTag": None,
            "assetName": None,
            "slaDeadline": (now + timedelta(hours=4)).isoformat() + "Z",
            "createdAt": (now - timedelta(minutes=15)).isoformat() + "Z",
            "updatedAt": (now - timedelta(minutes=15)).isoformat() + "Z",
            "resolvedAt": None,
            "hasBounty": False,
            "bountyAmount": 0,
            "viewCount": 8,
            "activityCount": 0
        },
        {
            "id": "ticket-4",
            "title": "Outlook keeps crashing on startup",
            "description": "Microsoft Outlook crashes immediately after I try to open it.",
            "priority": "high",
            "status": "open",
            "category": "software",
            "requesterId": "user-4",
            "requesterName": "David Wilson",
            "requesterAvatar": None,
            "assigneeId": None,
            "assigneeName": None,
            "assetTag": "HP-PRO-4521",
            "assetName": "HP ProBook 450 G8",
            "slaDeadline": (now + timedelta(hours=3)).isoformat() + "Z",
            "createdAt": (now - timedelta(hours=1)).isoformat() + "Z",
            "updatedAt": (now - timedelta(hours=1)).isoformat() + "Z",
            "resolvedAt": None,
            "hasBounty": False,
            "bountyAmount": 0,
            "viewCount": 15,
            "activityCount": 0
        },
        {
            "id": "ticket-5",
            "title": "Printer not showing in available devices",
            "description": "The office printer on 3rd floor isn't appearing in my printer list anymore.",
            "priority": "low",
            "status": "open",
            "category": "hardware",
            "requesterId": "user-5",
            "requesterName": "Lisa Brown",
            "requesterAvatar": None,
            "assigneeId": None,
            "assigneeName": None,
            "assetTag": None,
            "assetName": None,
            "slaDeadline": (now + timedelta(hours=8)).isoformat() + "Z",
            "createdAt": (now - timedelta(hours=2)).isoformat() + "Z",
            "updatedAt": (now - timedelta(hours=2)).isoformat() + "Z",
            "resolvedAt": None,
            "hasBounty": False,
            "bountyAmount": 0,
            "viewCount": 5,
            "activityCount": 0
        }
    ]
    
    for ticket in sample_tickets:
        tickets_db[ticket["id"]] = ticket
    
    agent_stats_db["default"] = {
        "streak": 3,
        "coins": 450,
        "ticketsResolved": 27,
        "ticketsAssigned": 0,
        "avgResponseTime": "15m",
        "rank": 3
    }

init_sample_data()

@app.get("/mcp/tickets/feed")
async def get_feed():
    tickets = [t for t in tickets_db.values() if t["status"] == "open" and t["assigneeId"] is None]
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    tickets.sort(key=lambda x: (priority_order.get(x["priority"], 4), x["slaDeadline"]))
    return tickets

@app.get("/mcp/tickets/queue")
async def get_queue(user = Depends(get_current_user)):
    user_id = user.id if user else "default"
    tickets = [t for t in tickets_db.values() 
               if t["assigneeId"] == user_id and t["status"] in ["assigned", "in_progress"]]
    return tickets

@app.get("/mcp/tickets/resolved")
async def get_resolved(user = Depends(get_current_user)):
    user_id = user.id if user else "default"
    tickets = [t for t in tickets_db.values() 
               if t["assigneeId"] == user_id and t["status"] == "resolved"]
    tickets.sort(key=lambda x: x.get("resolvedAt", ""), reverse=True)
    return tickets

@app.get("/mcp/tickets/escalated")
async def get_escalated():
    tickets = [t for t in tickets_db.values() if t["status"] == "escalated"]
    return tickets

@app.post("/mcp/tickets/{ticket_id}/assign")
async def assign_ticket(ticket_id: str, user = Depends(get_current_user)):
    if ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    user_id = user.id if user else "default"
    user_name = user.email if user else "Agent Mike"
    
    tickets_db[ticket_id]["assigneeId"] = user_id
    tickets_db[ticket_id]["assigneeName"] = user_name
    tickets_db[ticket_id]["status"] = "assigned"
    tickets_db[ticket_id]["updatedAt"] = datetime.utcnow().isoformat() + "Z"
    
    stats = agent_stats_db.get(user_id, agent_stats_db["default"])
    stats["ticketsAssigned"] = stats.get("ticketsAssigned", 0) + 1
    agent_stats_db[user_id] = stats
    
    return tickets_db[ticket_id]

@app.post("/mcp/tickets/{ticket_id}/resolve")
async def resolve_ticket(ticket_id: str, user = Depends(get_current_user)):
    if ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    user_id = user.id if user else "default"
    
    now = datetime.utcnow().isoformat() + "Z"
    tickets_db[ticket_id]["status"] = "resolved"
    tickets_db[ticket_id]["resolvedAt"] = now
    tickets_db[ticket_id]["updatedAt"] = now
    
    if tickets_db[ticket_id]["assigneeId"] is None:
        tickets_db[ticket_id]["assigneeId"] = user_id
        tickets_db[ticket_id]["assigneeName"] = user.email if user else "Agent Mike"
    
    stats = agent_stats_db.get(user_id, agent_stats_db["default"].copy())
    stats["ticketsResolved"] = stats.get("ticketsResolved", 0) + 1
    stats["streak"] = stats.get("streak", 0) + 1
    stats["coins"] = stats.get("coins", 0) + 25
    if tickets_db[ticket_id].get("hasBounty"):
        stats["coins"] = stats.get("coins", 0) + tickets_db[ticket_id].get("bountyAmount", 0)
    agent_stats_db[user_id] = stats
    
    return tickets_db[ticket_id]

@app.post("/mcp/tickets/{ticket_id}/escalate")
async def escalate_ticket(ticket_id: str):
    if ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    tickets_db[ticket_id]["status"] = "escalated"
    tickets_db[ticket_id]["updatedAt"] = datetime.utcnow().isoformat() + "Z"
    
    return tickets_db[ticket_id]

@app.get("/mcp/tickets/{ticket_id}/activities")
async def get_activities(ticket_id: str):
    return [a for a in activities_db.values() if a["ticketId"] == ticket_id]

@app.post("/mcp/tickets/{ticket_id}/activities")
async def add_activity(ticket_id: str, activity: ActivityCreate, user = Depends(get_current_user)):
    if ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    user_id = user.id if user else "default"
    user_name = user.email if user else "Agent Mike"
    
    new_activity = {
        "id": str(uuid.uuid4()),
        "ticketId": ticket_id,
        "userId": user_id,
        "userName": user_name,
        "userAvatar": None,
        "type": activity.type,
        "content": activity.content,
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    activities_db[new_activity["id"]] = new_activity
    tickets_db[ticket_id]["activityCount"] = tickets_db[ticket_id].get("activityCount", 0) + 1
    
    return new_activity

@app.get("/mcp/agent/stats")
async def get_agent_stats(user = Depends(get_current_user)):
    user_id = user.id if user else "default"
    stats = agent_stats_db.get(user_id, agent_stats_db.get("default", {
        "streak": 0,
        "coins": 0,
        "ticketsResolved": 0,
        "ticketsAssigned": 0,
        "avgResponseTime": "0m",
        "rank": 0
    }))
    return stats

@app.get("/mcp/leaderboard")
async def get_leaderboard():
    return [
        {"id": "agent-1", "username": "mike_support", "displayName": "Agent Mike", "avatar": None, "ticketsResolved": 156, "streak": 12, "coins": 3420, "rank": 1},
        {"id": "agent-2", "username": "sarah_tech", "displayName": "Sarah Tech", "avatar": None, "ticketsResolved": 142, "streak": 8, "coins": 2890, "rank": 2},
        {"id": "agent-3", "username": "alex_fix", "displayName": "Alex Fixer", "avatar": None, "ticketsResolved": 128, "streak": 5, "coins": 2450, "rank": 3},
        {"id": "agent-4", "username": "emma_help", "displayName": "Emma Helper", "avatar": None, "ticketsResolved": 98, "streak": 3, "coins": 1820, "rank": 4},
        {"id": "agent-5", "username": "james_it", "displayName": "James IT", "avatar": None, "ticketsResolved": 87, "streak": 2, "coins": 1540, "rank": 5}
    ]

@app.get("/mcp/health")
async def health_check():
    return {"status": "ok", "service": "StreamOps MCP Server"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
