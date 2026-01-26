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

def get_user_organization_id(user_id: str) -> Optional[str]:
    """Get the organization_id for a user from their profile"""
    if not user_id:
        return None
    try:
        supabase = get_supabase()
        result = supabase.table("profiles").select("organization_id").eq("user_id", user_id).execute()
        if result.data and result.data[0].get("organization_id"):
            return result.data[0]["organization_id"]
    except Exception as e:
        print(f"Get org_id error: {e}")
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

class OrganizationCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    domain: Optional[str] = None
    logoUrl: Optional[str] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    logoUrl: Optional[str] = None
    domain: Optional[str] = None

class SlaPolicyCreate(BaseModel):
    name: str
    priority: str
    responseTimeMinutes: int
    resolutionTimeMinutes: int
    isDefault: bool = False

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    isActive: bool = True

class KnowledgeVideoCreate(BaseModel):
    title: str
    description: str
    category: str
    videoUrl: str

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
        "organizationId": row.get("organization_id"),
        "organizationName": row.get("organization_name"),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"]
    }

def db_to_organization(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "slug": row["slug"],
        "logoUrl": row.get("logo_url"),
        "domain": row.get("domain"),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"]
    }

def db_to_sla_policy(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "organizationId": row["organization_id"],
        "name": row["name"],
        "priority": row["priority"],
        "responseTimeMinutes": row["response_time_minutes"],
        "resolutionTimeMinutes": row["resolution_time_minutes"],
        "isDefault": row.get("is_default", False)
    }

def db_to_category(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "organizationId": row["organization_id"],
        "name": row["name"],
        "description": row.get("description"),
        "icon": row.get("icon"),
        "isActive": row.get("is_active", True)
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
    org_id = get_user_organization_id(user_id) if user else None
    
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
    if org_id:
        new_ticket["organization_id"] = org_id
    
    result = supabase.table("tickets").insert(new_ticket).execute()
    if result.data:
        return db_to_ticket(result.data[0])
    raise HTTPException(status_code=500, detail="Failed to create ticket")

@app.get("/mcp/tickets/feed")
async def get_feed(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    org_id = get_user_organization_id(user_id) if user_id else None
    
    try:
        query = supabase.table("tickets")\
            .select("*")\
            .eq("status", "open")\
            .is_("assignee_id", "null")
        
        if org_id:
            query = query.eq("organization_id", org_id)
        
        result = query.execute()
        
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
    org_id = get_user_organization_id(user_id) if user else None
    
    query = supabase.table("tickets")\
        .select("*")\
        .eq("assignee_id", user_id)\
        .in_("status", ["assigned", "in_progress"])
    
    if org_id:
        query = query.eq("organization_id", org_id)
    
    result = query.execute()
    return [db_to_ticket(row) for row in result.data]

@app.get("/mcp/tickets/resolved")
async def get_resolved(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else "default"
    org_id = get_user_organization_id(user_id) if user else None
    
    query = supabase.table("tickets")\
        .select("*")\
        .eq("assignee_id", user_id)\
        .eq("status", "resolved")\
        .order("resolved_at", desc=True)
    
    if org_id:
        query = query.eq("organization_id", org_id)
    
    result = query.execute()
    return [db_to_ticket(row) for row in result.data]

@app.get("/mcp/tickets/escalated")
async def get_escalated(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    org_id = get_user_organization_id(user_id) if user_id else None
    
    query = supabase.table("tickets")\
        .select("*")\
        .eq("status", "escalated")
    
    if org_id:
        query = query.eq("organization_id", org_id)
    
    result = query.execute()
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
    
    org_id = get_user_organization_id(user_id) if user else None
    
    stats_result = supabase.table("agent_stats").select("*").eq("agent_id", user_id).execute()
    if stats_result.data:
        current_stats = stats_result.data[0]
        update_stats = {
            "tickets_assigned": current_stats["tickets_assigned"] + 1,
            "updated_at": datetime.utcnow().isoformat()
        }
        if org_id and not current_stats.get("organization_id"):
            update_stats["organization_id"] = org_id
        supabase.table("agent_stats")\
            .update(update_stats)\
            .eq("agent_id", user_id)\
            .execute()
    else:
        new_stats = {
            "agent_id": user_id,
            "agent_name": user_name,
            "tickets_assigned": 1,
            "tickets_resolved": 0,
            "streak": 0,
            "coins": 0
        }
        if org_id:
            new_stats["organization_id"] = org_id
        supabase.table("agent_stats").insert(new_stats).execute()
    
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
    org_id = get_user_organization_id(user_id) if user else None
    
    stats_result = supabase.table("agent_stats").select("*").eq("agent_id", user_id).execute()
    if stats_result.data:
        current_stats = stats_result.data[0]
        update_stats = {
            "tickets_resolved": current_stats["tickets_resolved"] + 1,
            "streak": current_stats["streak"] + 1,
            "coins": current_stats["coins"] + 25 + bounty_coins,
            "updated_at": now
        }
        if org_id and not current_stats.get("organization_id"):
            update_stats["organization_id"] = org_id
        supabase.table("agent_stats")\
            .update(update_stats)\
            .eq("agent_id", user_id)\
            .execute()
    else:
        new_stats = {
            "agent_id": user_id,
            "agent_name": user_name,
            "tickets_assigned": 0,
            "tickets_resolved": 1,
            "streak": 1,
            "coins": 25 + bounty_coins
        }
        if org_id:
            new_stats["organization_id"] = org_id
        supabase.table("agent_stats").insert(new_stats).execute()
    
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
async def get_leaderboard(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    org_id = get_user_organization_id(user_id) if user_id else None
    
    query = supabase.table("agent_stats")\
        .select("*")\
        .order("tickets_resolved", desc=True)\
        .limit(20)
    
    if org_id:
        query = query.eq("organization_id", org_id)
    
    result = query.execute()
    
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
async def get_mixed_feed(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    org_id = get_user_organization_id(user_id) if user_id else None
    
    try:
        tickets_query = supabase.table("tickets")\
            .select("*")\
            .eq("status", "open")\
            .is_("assignee_id", "null")
        
        if org_id:
            tickets_query = tickets_query.eq("organization_id", org_id)
        
        tickets_result = tickets_query.execute()
        
        posts_query = supabase.table("posts")\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(50)
        
        if org_id:
            posts_query = posts_query.eq("organization_id", org_id)
        
        posts_result = posts_query.execute()
        
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
    avatarUrl: Optional[str] = None

@app.get("/mcp/profiles")
async def get_all_profiles(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    org_id = get_user_organization_id(user_id) if user_id else None
    
    try:
        query = supabase.table("profiles")\
            .select("*")\
            .order("display_name")
        
        if org_id:
            query = query.eq("organization_id", org_id)
        
        result = query.execute()
        return [db_to_profile(row) for row in result.data]
    except Exception as e:
        print(f"Profiles error: {e}")
        return []

@app.post("/mcp/profiles")
async def create_member(data: CreateMemberData, user = Depends(get_current_user)):
    supabase = get_supabase()
    current_user_id = user.id if user else None
    org_id = get_user_organization_id(current_user_id) if current_user_id else None
    
    try:
        profile = supabase.table("profiles").select("organization_name").eq("user_id", current_user_id).execute()
        org_name = profile.data[0].get("organization_name") if profile.data else None
    except:
        org_name = None
    
    try:
        import uuid
        new_profile = {
            "user_id": str(uuid.uuid4()),
            "email": data.email,
            "display_name": data.displayName,
            "department": data.department,
            "role": data.role or "Agent",
            "avatar_url": data.avatarUrl,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        if org_id:
            new_profile["organization_id"] = org_id
            new_profile["organization_name"] = org_name
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
async def get_posts(user_id: Optional[str] = None, user = Depends(get_current_user)):
    supabase = get_supabase()
    current_user_id = user.id if user else None
    org_id = get_user_organization_id(current_user_id) if current_user_id else None
    
    try:
        query = supabase.table("posts").select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        if org_id:
            query = query.eq("organization_id", org_id)
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
    org_id = get_user_organization_id(user_id) if user else None
    
    new_post = {
        "user_id": user_id,
        "user_name": user_name,
        "title": post.title,
        "content": post.content,
        "image_url": post.imageUrl,
    }
    if org_id:
        new_post["organization_id"] = org_id
    
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

# Organization endpoints for multi-tenancy
@app.get("/mcp/organizations/my")
async def get_my_organization(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    if not user_id:
        return None
    
    try:
        profile = supabase.table("profiles").select("organization_id").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("organization_id"):
            return None
        
        org_id = profile.data[0]["organization_id"]
        org = supabase.table("organizations").select("*").eq("id", org_id).execute()
        if org.data:
            return db_to_organization(org.data[0])
    except Exception as e:
        print(f"Get org error: {e}")
    return None

@app.post("/mcp/organizations")
async def create_organization(data: OrganizationCreate, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        import uuid
        import re
        slug = data.slug or re.sub(r'[^a-z0-9]+', '-', data.name.lower()).strip('-')
        
        new_org = {
            "id": str(uuid.uuid4()),
            "name": data.name,
            "slug": slug,
            "logo_url": data.logoUrl,
            "domain": data.domain,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        result = supabase.table("organizations").insert(new_org).execute()
        
        if result.data:
            org_id = result.data[0]["id"]
            
            # Check if profile exists, create if not
            profile_check = supabase.table("profiles").select("user_id").eq("user_id", user_id).execute()
            if not profile_check.data:
                # Create profile with organization
                supabase.table("profiles").insert({
                    "user_id": user_id,
                    "email": user.email,
                    "display_name": user.email.split("@")[0] if user.email else "User",
                    "organization_id": org_id,
                    "organization_name": data.name,
                    "role": "Admin",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }).execute()
            else:
                # Update existing profile
                supabase.table("profiles").update({
                    "organization_id": org_id,
                    "organization_name": data.name,
                    "role": "Admin",
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("user_id", user_id).execute()
            
            # Create default ITSM configuration
            default_slas = [
                {"organization_id": org_id, "name": "Critical", "priority": "critical", "response_time_minutes": 15, "resolution_time_minutes": 120, "is_default": True},
                {"organization_id": org_id, "name": "High", "priority": "high", "response_time_minutes": 60, "resolution_time_minutes": 480, "is_default": True},
                {"organization_id": org_id, "name": "Medium", "priority": "medium", "response_time_minutes": 240, "resolution_time_minutes": 1440, "is_default": True},
                {"organization_id": org_id, "name": "Low", "priority": "low", "response_time_minutes": 480, "resolution_time_minutes": 2880, "is_default": True},
            ]
            supabase.table("sla_policies").insert(default_slas).execute()
            
            default_categories = [
                {"organization_id": org_id, "name": "Hardware", "icon": "cpu", "is_active": True},
                {"organization_id": org_id, "name": "Software", "icon": "monitor", "is_active": True},
                {"organization_id": org_id, "name": "Network", "icon": "wifi", "is_active": True},
                {"organization_id": org_id, "name": "Access", "icon": "key", "is_active": True},
                {"organization_id": org_id, "name": "Other", "icon": "help-circle", "is_active": True},
            ]
            supabase.table("ticket_categories").insert(default_categories).execute()
            
            return db_to_organization(result.data[0])
        raise HTTPException(status_code=400, detail="Failed to create organization")
    except Exception as e:
        print(f"Create org error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/mcp/organizations/my")
async def update_organization(data: OrganizationUpdate, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        profile = supabase.table("profiles").select("organization_id, role").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("organization_id"):
            raise HTTPException(status_code=404, detail="No organization found")
        
        if profile.data[0].get("role") not in ["Admin", "Manager"]:
            raise HTTPException(status_code=403, detail="Admin or Manager role required")
        
        org_id = profile.data[0]["organization_id"]
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        if data.name:
            update_data["name"] = data.name
        if data.logoUrl is not None:
            update_data["logo_url"] = data.logoUrl
        if data.domain is not None:
            update_data["domain"] = data.domain
        
        result = supabase.table("organizations").update(update_data).eq("id", org_id).execute()
        if result.data:
            if data.name:
                supabase.table("profiles").update({
                    "organization_name": data.name,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("organization_id", org_id).execute()
            return db_to_organization(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update org error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/mcp/organizations/join")
async def join_organization(slug: str, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        org = supabase.table("organizations").select("*").eq("slug", slug).execute()
        if not org.data:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        org_data = org.data[0]
        
        # Check if profile exists, create if not
        profile_check = supabase.table("profiles").select("user_id").eq("user_id", user_id).execute()
        if not profile_check.data:
            # Create profile with organization
            supabase.table("profiles").insert({
                "user_id": user_id,
                "email": user.email,
                "display_name": user.email.split("@")[0] if user.email else "User",
                "organization_id": org_data["id"],
                "organization_name": org_data["name"],
                "role": "Agent",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
        else:
            # Update existing profile
            supabase.table("profiles").update({
                "organization_id": org_data["id"],
                "organization_name": org_data["name"],
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
        
        return db_to_organization(org_data)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Join org error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ITSM Configuration endpoints
@app.get("/mcp/config/sla-policies")
async def get_sla_policies(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    if not user_id:
        return []
    
    try:
        profile = supabase.table("profiles").select("organization_id").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("organization_id"):
            return []
        
        org_id = profile.data[0]["organization_id"]
        result = supabase.table("sla_policies").select("*").eq("organization_id", org_id).execute()
        return [db_to_sla_policy(row) for row in result.data]
    except Exception as e:
        print(f"Get SLA policies error: {e}")
        return []

@app.post("/mcp/config/sla-policies")
async def create_sla_policy(data: SlaPolicyCreate, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        profile = supabase.table("profiles").select("organization_id, role").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("organization_id"):
            raise HTTPException(status_code=404, detail="No organization found")
        
        if profile.data[0].get("role") not in ["Admin", "Manager"]:
            raise HTTPException(status_code=403, detail="Admin or Manager role required")
        
        org_id = profile.data[0]["organization_id"]
        import uuid
        new_policy = {
            "id": str(uuid.uuid4()),
            "organization_id": org_id,
            "name": data.name,
            "priority": data.priority,
            "response_time_minutes": data.responseTimeMinutes,
            "resolution_time_minutes": data.resolutionTimeMinutes,
            "is_default": data.isDefault,
        }
        result = supabase.table("sla_policies").insert(new_policy).execute()
        if result.data:
            return db_to_sla_policy(result.data[0])
        raise HTTPException(status_code=400, detail="Failed to create SLA policy")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create SLA policy error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/mcp/config/categories")
async def get_categories(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    if not user_id:
        return []
    
    try:
        profile = supabase.table("profiles").select("organization_id").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("organization_id"):
            return []
        
        org_id = profile.data[0]["organization_id"]
        result = supabase.table("ticket_categories").select("*").eq("organization_id", org_id).execute()
        return [db_to_category(row) for row in result.data]
    except Exception as e:
        print(f"Get categories error: {e}")
        return []

@app.post("/mcp/config/categories")
async def create_category(data: CategoryCreate, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        profile = supabase.table("profiles").select("organization_id, role").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("organization_id"):
            raise HTTPException(status_code=404, detail="No organization found")
        
        if profile.data[0].get("role") not in ["Admin", "Manager"]:
            raise HTTPException(status_code=403, detail="Admin or Manager role required")
        
        org_id = profile.data[0]["organization_id"]
        import uuid
        new_category = {
            "id": str(uuid.uuid4()),
            "organization_id": org_id,
            "name": data.name,
            "description": data.description,
            "icon": data.icon,
            "is_active": data.isActive,
        }
        result = supabase.table("ticket_categories").insert(new_category).execute()
        if result.data:
            return db_to_category(result.data[0])
        raise HTTPException(status_code=400, detail="Failed to create category")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create category error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/mcp/knowledge/videos")
async def get_knowledge_videos(user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    org_id = get_user_organization_id(user_id) if user_id else None
    
    try:
        query = supabase.table("knowledge_videos").select("*").order("created_at", desc=True)
        if org_id:
            query = query.eq("organization_id", org_id)
        result = query.execute()
        
        videos = []
        for row in result.data:
            videos.append({
                "id": str(row["id"]),
                "title": row.get("title", ""),
                "description": row.get("description", ""),
                "thumbnailUrl": row.get("thumbnail_url"),
                "videoUrl": row.get("video_url"),
                "category": row.get("category", "other"),
                "authorName": row.get("author_name", "Unknown"),
                "authorAvatar": row.get("author_avatar"),
                "views": row.get("views", 0),
                "likes": row.get("likes", 0),
                "duration": row.get("duration", "0:00"),
                "coinsEarned": row.get("coins_earned", 0),
                "createdAt": str(row.get("created_at", ""))
            })
        return videos
    except Exception as e:
        print(f"Get knowledge videos error: {e}")
        return []

@app.post("/mcp/knowledge/videos")
async def create_knowledge_video(data: KnowledgeVideoCreate, user = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = user.id if user else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        profile = supabase.table("profiles").select("organization_id, display_name, avatar_url").eq("user_id", user_id).execute()
        if not profile.data or not profile.data[0].get("organization_id"):
            raise HTTPException(status_code=404, detail="No organization found")
        
        org_id = profile.data[0]["organization_id"]
        author_name = profile.data[0].get("display_name", "Unknown")
        author_avatar = profile.data[0].get("avatar_url")
        
        import uuid
        new_video = {
            "id": str(uuid.uuid4()),
            "organization_id": org_id,
            "title": data.title,
            "description": data.description,
            "category": data.category,
            "video_url": data.videoUrl,
            "author_id": user_id,
            "author_name": author_name,
            "author_avatar": author_avatar,
            "views": 0,
            "likes": 0,
            "duration": "0:00",
            "coins_earned": 0,
        }
        result = supabase.table("knowledge_videos").insert(new_video).execute()
        if result.data:
            row = result.data[0]
            return {
                "id": str(row["id"]),
                "title": row.get("title", ""),
                "description": row.get("description", ""),
                "videoUrl": row.get("video_url"),
                "category": row.get("category", "other"),
                "authorName": author_name,
            }
        raise HTTPException(status_code=400, detail="Failed to create video")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create knowledge video error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/mcp/organizations")
async def get_all_organizations(user = Depends(get_current_user)):
    supabase = get_supabase()
    
    try:
        result = supabase.table("organizations").select("id, name, slug, logo_url, domain, created_at").order("name").execute()
        orgs = []
        for row in result.data:
            orgs.append({
                "id": str(row["id"]),
                "name": row.get("name", ""),
                "slug": row.get("slug", ""),
                "logoUrl": row.get("logo_url"),
                "domain": row.get("domain"),
                "createdAt": str(row.get("created_at", ""))
            })
        return orgs
    except Exception as e:
        print(f"Get organizations error: {e}")
        return []

@app.get("/mcp/health")
async def health_check():
    return {"status": "ok", "service": "StreamOps MCP Server"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
