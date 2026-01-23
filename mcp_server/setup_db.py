"""
Setup script to create Supabase tables for StreamOps
Run this once to initialize the database schema.
"""
from supabase import create_client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

def setup_tables():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    sql = """
    -- Create tickets table
    CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'open',
        category TEXT NOT NULL DEFAULT 'other',
        requester_id TEXT NOT NULL,
        requester_name TEXT NOT NULL,
        requester_avatar TEXT,
        assignee_id TEXT,
        assignee_name TEXT,
        asset_tag TEXT,
        asset_name TEXT,
        sla_deadline TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,
        has_bounty BOOLEAN DEFAULT FALSE,
        bounty_amount INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        activity_count INTEGER DEFAULT 0
    );

    -- Create agent_stats table
    CREATE TABLE IF NOT EXISTS agent_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id TEXT NOT NULL UNIQUE,
        agent_name TEXT NOT NULL,
        tickets_resolved INTEGER DEFAULT 0,
        tickets_assigned INTEGER DEFAULT 0,
        avg_resolution_time INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 0,
        rank INTEGER DEFAULT 1,
        level INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create activities table
    CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_avatar TEXT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_activities_ticket ON activities(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_agent_stats_agent ON agent_stats(agent_id);

    -- Enable RLS (Row Level Security) but allow all operations for now
    ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;
    ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

    -- Create policies for public access (adjust as needed for security)
    DROP POLICY IF EXISTS "Allow all on tickets" ON tickets;
    CREATE POLICY "Allow all on tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Allow all on agent_stats" ON agent_stats;
    CREATE POLICY "Allow all on agent_stats" ON agent_stats FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Allow all on activities" ON activities;
    CREATE POLICY "Allow all on activities" ON activities FOR ALL USING (true) WITH CHECK (true);
    """
    
    try:
        result = supabase.postgrest.rpc('exec_sql', {'sql': sql}).execute()
        print("Tables created successfully!")
        return True
    except Exception as e:
        print(f"Error creating tables via RPC: {e}")
        print("Please run the SQL manually in Supabase SQL Editor:")
        print(sql)
        return False

if __name__ == "__main__":
    setup_tables()
