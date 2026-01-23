from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from supabase import create_client, Client
import os

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

class ActivityCreate(BaseModel):
    type: str
    content: str

class PostCreate(BaseModel):
    title: Optional[str] = None
    content: str
    imageUrl: Optional[str] = None

class ProfileUpdate(BaseModel):
    displayName: Optional[str] = None
    bio: Optional[str] = None
    department: Optional[str] = None
    avatarUrl: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

class TicketCreate(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    category: str = "other"
    assetTag: Optional[str] = None
    assetName: Optional[str] = None
    hasBounty: bool = False
    bountyAmount: int = 0

def db_to_ticket(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "description": row["description"],
        "priority": row["priority"],
        "status": row["status"],
        "category": row["category"],
        "requesterId": row["requester_id"],
        "requesterName": row["requester_name"],
        "requesterAvatar": row.get("requester_avatar"),
        "assigneeId": row.get("assignee_id"),
        "assigneeName": row.get("assignee_name"),
        "assetTag": row.get("asset_tag"),
        "assetName": row.get("asset_name"),
        "slaDeadline": row["sla_deadline"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "resolvedAt": row.get("resolved_at"),
        "hasBounty": row.get("has_bounty", False),
        "bountyAmount": row.get("bounty_amount", 0),
        "viewCount": row.get("view_count", 0),
        "activityCount": row.get("activity_count", 0)
    }

def db_to_activity(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "ticketId": str(row["ticket_id"]),
        "userId": row["user_id"],
        "userName": row["user_name"],
        "userAvatar": row.get("user_avatar"),
        "type": row["type"],
        "content": row["content"],
        "createdAt": row["created_at"]
    }

def db_to_profile(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "userId": row["user_id"],
        "email": row["email"],
        "displayName": row["display_name"],
        "avatarUrl": row.get("avatar_url"),
        "bio": row.get("bio"),
        "department": row.get("department"),
        "role": row.get("role", "Agent"),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"]
    }

def db_to_post(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "userId": row["user_id"],
        "userName": row["user_name"],
        "userAvatar": row.get("user_avatar"),
        "title": row.get("title"),
        "content": row["content"],
        "imageUrl": row.get("image_url"),
        "likesCount": row.get("likes_count", 0),
        "commentsCount": row.get("comments_count", 0),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "type": "post"
    }

def db_to_comment(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "postId": str(row["post_id"]),
        "userId": row["user_id"],
        "userName": row["user_name"],
        "userAvatar": row.get("user_avatar"),
        "content": row["content"],
        "createdAt": row["created_at"]
    }

@app.post("/mcp/tickets")
async def create_ticket(ticket: TicketCreate, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "anonymous"
    user_email = user.email if user else "Anonymous User"
    
    now = datetime.utcnow()
    sla_hours = {"critical": 2, "high": 4, "medium": 8, "low": 24}
    sla_deadline = now + timedelta(hours=sla_hours.get(ticket.priority, 8))
    
    new_ticket = {
        "title": ticket.title,
        "description": ticket.description,
        "priority": ticket.priority,
        "status": "open",
        "category": ticket.category,
        "requester_id": user_id,
        "requester_name": user_email,
        "asset_tag": ticket.assetTag,
        "asset_name": ticket.assetName,
        "sla_deadline": sla_deadline.isoformat(),
        "has_bounty": ticket.hasBounty,
        "bounty_amount": ticket.bountyAmount,
    }
    
    result = supabase.table("tickets").insert(new_ticket).execute()
    if result.data:
        return db_to_ticket(result.data[0])
    raise HTTPException(status_code=500, detail="Failed to create ticket")

@app.get("/mcp/tickets/feed")
async def get_feed():
    supabase = get_supabase()
    try:
        result = supabase.table("tickets")\
            .select("*")\
            .eq("status", "open")\
            .is_("assignee_id", "null")\
            .execute()
        
        tickets = [db_to_ticket(row) for row in result.data]
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        tickets.sort(key=lambda x: (priority_order.get(x["priority"], 4), x["slaDeadline"]))
        return tickets
    except Exception as e:
        print(f"Feed error: {e}")
        return []

@app.get("/mcp/tickets/queue")
async def get_queue(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "default"
    
    result = supabase.table("tickets")\
        .select("*")\
        .eq("assignee_id", user_id)\
        .in_("status", ["assigned", "in_progress"])\
        .execute()
    
    return [db_to_ticket(row) for row in result.data]

@app.get("/mcp/tickets/resolved")
async def get_resolved(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "default"
    
    result = supabase.table("tickets")\
        .select("*")\
        .eq("assignee_id", user_id)\
        .eq("status", "resolved")\
        .order("resolved_at", desc=True)\
        .execute()
    
    return [db_to_ticket(row) for row in result.data]

@app.get("/mcp/tickets/escalated")
async def get_escalated():
    supabase = get_supabase()
    result = supabase.table("tickets")\
        .select("*")\
        .eq("status", "escalated")\
        .execute()
    
    return [db_to_ticket(row) for row in result.data]

@app.post("/mcp/tickets/{ticket_id}/assign")
async def assign_ticket(ticket_id: str, user = Depends(get_current_user)):
    supabase = get_supabase()
    
    ticket_result = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
    if not ticket_result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    user_id = user.id if user else "default"
    user_name = user.email if user else "Agent Mike"
    
    update_result = supabase.table("tickets")\
        .update({
            "assignee_id": user_id,
            "assignee_name": user_name,
            "status": "assigned",
            "updated_at": datetime.utcnow().isoformat()
        })\
        .eq("id", ticket_id)\
        .execute()
    
    stats_result = supabase.table("agent_stats").select("*").eq("agent_id", user_id).execute()
    if stats_result.data:
        current_stats = stats_result.data[0]
        supabase.table("agent_stats")\
            .update({
                "tickets_assigned": current_stats["tickets_assigned"] + 1,
                "updated_at": datetime.utcnow().isoformat()
            })\
            .eq("agent_id", user_id)\
            .execute()
    else:
        supabase.table("agent_stats").insert({
            "agent_id": user_id,
            "agent_name": user_name,
            "tickets_assigned": 1,
            "tickets_resolved": 0,
            "streak": 0,
            "coins": 0
        }).execute()
    
    if update_result.data:
        return db_to_ticket(update_result.data[0])
    raise HTTPException(status_code=500, detail="Failed to assign ticket")

@app.post("/mcp/tickets/{ticket_id}/resolve")
async def resolve_ticket(ticket_id: str, user = Depends(get_current_user)):
    supabase = get_supabase()
    
    ticket_result = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
    if not ticket_result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket = ticket_result.data[0]
    user_id = user.id if user else "default"
    user_name = user.email if user else "Agent Mike"
    now = datetime.utcnow().isoformat()
    
    update_data = {
        "status": "resolved",
        "resolved_at": now,
        "updated_at": now
    }
    if not ticket.get("assignee_id"):
        update_data["assignee_id"] = user_id
        update_data["assignee_name"] = user_name
    
    update_result = supabase.table("tickets")\
        .update(update_data)\
        .eq("id", ticket_id)\
        .execute()
    
    bounty_coins = ticket.get("bounty_amount", 0) if ticket.get("has_bounty") else 0
    
    stats_result = supabase.table("agent_stats").select("*").eq("agent_id", user_id).execute()
    if stats_result.data:
        current_stats = stats_result.data[0]
        supabase.table("agent_stats")\
            .update({
                "tickets_resolved": current_stats["tickets_resolved"] + 1,
                "streak": current_stats["streak"] + 1,
                "coins": current_stats["coins"] + 25 + bounty_coins,
                "updated_at": now
            })\
            .eq("agent_id", user_id)\
            .execute()
    else:
        supabase.table("agent_stats").insert({
            "agent_id": user_id,
            "agent_name": user_name,
            "tickets_assigned": 0,
            "tickets_resolved": 1,
            "streak": 1,
            "coins": 25 + bounty_coins
        }).execute()
    
    if update_result.data:
        return db_to_ticket(update_result.data[0])
    raise HTTPException(status_code=500, detail="Failed to resolve ticket")

@app.post("/mcp/tickets/{ticket_id}/escalate")
async def escalate_ticket(ticket_id: str):
    supabase = get_supabase()
    
    ticket_result = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
    if not ticket_result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_result = supabase.table("tickets")\
        .update({
            "status": "escalated",
            "updated_at": datetime.utcnow().isoformat()
        })\
        .eq("id", ticket_id)\
        .execute()
    
    if update_result.data:
        return db_to_ticket(update_result.data[0])
    raise HTTPException(status_code=500, detail="Failed to escalate ticket")

@app.get("/mcp/tickets/{ticket_id}/activities")
async def get_activities(ticket_id: str):
    supabase = get_supabase()
    result = supabase.table("activities")\
        .select("*")\
        .eq("ticket_id", ticket_id)\
        .order("created_at")\
        .execute()
    
    return [db_to_activity(row) for row in result.data]

@app.post("/mcp/tickets/{ticket_id}/activities")
async def add_activity(ticket_id: str, activity: ActivityCreate, user = Depends(get_current_user)):
    supabase = get_supabase()
    
    ticket_result = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
    if not ticket_result.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    user_id = user.id if user else "default"
    user_name = user.email if user else "Agent Mike"
    
    new_activity = {
        "ticket_id": ticket_id,
        "user_id": user_id,
        "user_name": user_name,
        "type": activity.type,
        "content": activity.content,
    }
    
    result = supabase.table("activities").insert(new_activity).execute()
    
    ticket = ticket_result.data[0]
    supabase.table("tickets")\
        .update({"activity_count": ticket.get("activity_count", 0) + 1})\
        .eq("id", ticket_id)\
        .execute()
    
    if result.data:
        return db_to_activity(result.data[0])
    raise HTTPException(status_code=500, detail="Failed to add activity")

@app.get("/mcp/agent/stats")
async def get_agent_stats(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "default"
    
    result = supabase.table("agent_stats").select("*").eq("agent_id", user_id).execute()
    
    if result.data:
        stats = result.data[0]
        return {
            "streak": stats.get("streak", 0),
            "coins": stats.get("coins", 0),
            "ticketsResolved": stats.get("tickets_resolved", 0),
            "ticketsAssigned": stats.get("tickets_assigned", 0),
            "avgResponseTime": "0m",
            "rank": 1
        }
    
    return {
        "streak": 0,
        "coins": 0,
        "ticketsResolved": 0,
        "ticketsAssigned": 0,
        "avgResponseTime": "0m",
        "rank": 0
    }

@app.get("/mcp/leaderboard")
async def get_leaderboard():
    supabase = get_supabase()
    
    result = supabase.table("agent_stats")\
        .select("*")\
        .order("tickets_resolved", desc=True)\
        .limit(20)\
        .execute()
    
    leaderboard = []
    for i, row in enumerate(result.data):
        leaderboard.append({
            "id": row["agent_id"],
            "username": row["agent_name"].split("@")[0] if "@" in row["agent_name"] else row["agent_name"],
            "displayName": row["agent_name"],
            "avatar": None,
            "ticketsResolved": row.get("tickets_resolved", 0),
            "streak": row.get("streak", 0),
            "coins": row.get("coins", 0),
            "rank": i + 1
        })
    
    return leaderboard

@app.get("/mcp/feed/mixed")
async def get_mixed_feed():
    supabase = get_supabase()
    try:
        tickets_result = supabase.table("tickets")\
            .select("*")\
            .eq("status", "open")\
            .is_("assignee_id", "null")\
            .execute()
        
        posts_result = supabase.table("posts")\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(50)\
            .execute()
        
        tickets = [db_to_ticket(row) for row in tickets_result.data]
        for t in tickets:
            t["type"] = "ticket"
        
        posts = [db_to_post(row) for row in posts_result.data]
        
        mixed = tickets + posts
        mixed.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        
        return mixed
    except Exception as e:
        print(f"Mixed feed error: {e}")
        return []

class CreateMemberData(BaseModel):
    email: str
    displayName: str
    department: Optional[str] = None
    role: Optional[str] = "Agent"

@app.get("/mcp/profiles")
async def get_all_profiles():
    supabase = get_supabase()
    try:
        result = supabase.table("profiles")\
            .select("*")\
            .order("display_name")\
            .execute()
        return [db_to_profile(row) for row in result.data]
    except Exception as e:
        print(f"Profiles error: {e}")
        return []

@app.post("/mcp/profiles")
async def create_member(data: CreateMemberData):
    supabase = get_supabase()
    try:
        import uuid
        new_profile = {
            "user_id": str(uuid.uuid4()),
            "email": data.email,
            "display_name": data.displayName,
            "department": data.department,
            "role": data.role or "Agent",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        result = supabase.table("profiles").insert(new_profile).execute()
        if result.data:
            return db_to_profile(result.data[0])
        raise HTTPException(status_code=400, detail="Failed to create member")
    except Exception as e:
        print(f"Create member error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/mcp/profiles/{user_id}")
async def get_profile(user_id: str):
    supabase = get_supabase()
    try:
        result = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
        if result.data:
            return db_to_profile(result.data[0])
    except Exception as e:
        print(f"Profile error: {e}")
    raise HTTPException(status_code=404, detail="Profile not found")

@app.get("/mcp/profiles/me")
async def get_my_profile(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "default"
    
    result = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
    
    if result.data:
        return db_to_profile(result.data[0])
    
    if user:
        new_profile = {
            "user_id": user_id,
            "email": user.email,
            "display_name": user.email.split("@")[0] if user.email else "User",
        }
        insert_result = supabase.table("profiles").insert(new_profile).execute()
        if insert_result.data:
            return db_to_profile(insert_result.data[0])
    
    return {
        "userId": user_id,
        "email": "",
        "displayName": "Guest",
        "avatarUrl": None,
        "bio": None,
        "department": None,
        "role": "Agent"
    }

@app.put("/mcp/profiles/me")
async def update_my_profile(profile: ProfileUpdate, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "default"
    
    update_data = {}
    if profile.displayName:
        update_data["display_name"] = profile.displayName
    if profile.bio is not None:
        update_data["bio"] = profile.bio
    if profile.department is not None:
        update_data["department"] = profile.department
    if profile.avatarUrl is not None:
        update_data["avatar_url"] = profile.avatarUrl
    
    if update_data:
        update_data["updated_at"] = datetime.utcnow().isoformat()
        result = supabase.table("profiles")\
            .update(update_data)\
            .eq("user_id", user_id)\
            .execute()
        
        if result.data:
            return db_to_profile(result.data[0])
    
    raise HTTPException(status_code=400, detail="No updates provided")

@app.get("/mcp/posts")
async def get_posts(user_id: Optional[str] = None):
    supabase = get_supabase()
    try:
        query = supabase.table("posts").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        result = query.order("created_at", desc=True).limit(50).execute()
        return [db_to_post(row) for row in result.data]
    except Exception as e:
        print(f"Posts error: {e}")
        return []

@app.post("/mcp/posts")
async def create_post(post: PostCreate, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "anonymous"
    user_name = user.email if user else "Anonymous"
    
    new_post = {
        "user_id": user_id,
        "user_name": user_name,
        "title": post.title,
        "content": post.content,
        "image_url": post.imageUrl,
    }
    
    result = supabase.table("posts").insert(new_post).execute()
    if result.data:
        return db_to_post(result.data[0])
    raise HTTPException(status_code=500, detail="Failed to create post")

@app.post("/mcp/posts/{post_id}/like")
async def like_post(post_id: str, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "default"
    
    existing = supabase.table("post_likes")\
        .select("*")\
        .eq("post_id", post_id)\
        .eq("user_id", user_id)\
        .execute()
    
    if existing.data:
        supabase.table("post_likes")\
            .delete()\
            .eq("post_id", post_id)\
            .eq("user_id", user_id)\
            .execute()
        
        post = supabase.table("posts").select("likes_count").eq("id", post_id).execute()
        if post.data:
            new_count = max(0, post.data[0].get("likes_count", 1) - 1)
            supabase.table("posts").update({"likes_count": new_count}).eq("id", post_id).execute()
        
        return {"liked": False}
    else:
        supabase.table("post_likes").insert({
            "post_id": post_id,
            "user_id": user_id
        }).execute()
        
        post = supabase.table("posts").select("likes_count").eq("id", post_id).execute()
        if post.data:
            new_count = post.data[0].get("likes_count", 0) + 1
            supabase.table("posts").update({"likes_count": new_count}).eq("id", post_id).execute()
        
        return {"liked": True}

@app.get("/mcp/posts/{post_id}/comments")
async def get_post_comments(post_id: str):
    supabase = get_supabase()
    result = supabase.table("post_comments")\
        .select("*")\
        .eq("post_id", post_id)\
        .order("created_at")\
        .execute()
    
    return [db_to_comment(row) for row in result.data]

@app.post("/mcp/posts/{post_id}/comments")
async def add_post_comment(post_id: str, comment: CommentCreate, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "anonymous"
    user_name = user.email if user else "Anonymous"
    
    new_comment = {
        "post_id": post_id,
        "user_id": user_id,
        "user_name": user_name,
        "content": comment.content,
    }
    
    result = supabase.table("post_comments").insert(new_comment).execute()
    
    post = supabase.table("posts").select("comments_count").eq("id", post_id).execute()
    if post.data:
        new_count = post.data[0].get("comments_count", 0) + 1
        supabase.table("posts").update({"comments_count": new_count}).eq("id", post_id).execute()
    
    if result.data:
        return db_to_comment(result.data[0])
    raise HTTPException(status_code=500, detail="Failed to add comment")

@app.get("/mcp/health")
async def health_check():
    return {"status": "ok", "service": "StreamOps MCP Server"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
