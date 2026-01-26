-- StreamOps Database Schema
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- Create organizations table (must be first, as other tables reference it)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    domain TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sla_policies table
CREATE TABLE IF NOT EXISTS sla_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    priority TEXT NOT NULL,
    response_time_minutes INTEGER NOT NULL,
    resolution_time_minutes INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ticket_categories table
CREATE TABLE IF NOT EXISTS ticket_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
    organization_id UUID REFERENCES organizations(id),
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
    organization_id UUID REFERENCES organizations(id),
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

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    department TEXT,
    role TEXT DEFAULT 'Agent',
    organization_id UUID REFERENCES organizations(id),
    organization_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create posts table (social feed posts)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create subscription_plans table (master plan catalog)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    description TEXT,
    monthly_price_cents INTEGER NOT NULL,
    yearly_price_cents INTEGER NOT NULL,
    max_team_members INTEGER NOT NULL,
    max_open_tickets INTEGER NOT NULL,
    max_queues INTEGER NOT NULL,
    feature_alerts BOOLEAN DEFAULT FALSE,
    feature_reports BOOLEAN DEFAULT FALSE,
    feature_api_access BOOLEAN DEFAULT FALSE,
    feature_cmdb_access BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create organization_subscriptions table
CREATE TABLE IF NOT EXISTS organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Create stripe_config table (SuperAdmin only)
CREATE TABLE IF NOT EXISTS stripe_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment TEXT NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'live')),
    publishable_key TEXT,
    secret_key TEXT,
    webhook_secret TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_sla_policies_org ON sla_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_ticket_categories_org ON ticket_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org ON tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_ticket ON activities(ticket_id);
CREATE INDEX IF NOT EXISTS idx_agent_stats_agent ON agent_stats(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_stats_org ON agent_stats(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_org ON posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_display_order ON subscription_plans(display_order);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_id ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_status ON organization_subscriptions(status);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_config ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies (allow all operations for development)
-- IMPORTANT: In production, replace these with proper authorization policies

DROP POLICY IF EXISTS "Allow all on organizations" ON organizations;
CREATE POLICY "Allow all on organizations" ON organizations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on sla_policies" ON sla_policies;
CREATE POLICY "Allow all on sla_policies" ON sla_policies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on ticket_categories" ON ticket_categories;
CREATE POLICY "Allow all on ticket_categories" ON ticket_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on tickets" ON tickets;
CREATE POLICY "Allow all on tickets" ON tickets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on agent_stats" ON agent_stats;
CREATE POLICY "Allow all on agent_stats" ON agent_stats FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on activities" ON activities;
CREATE POLICY "Allow all on activities" ON activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on profiles" ON profiles;
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on posts" ON posts;
CREATE POLICY "Allow all on posts" ON posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on post_likes" ON post_likes;
CREATE POLICY "Allow all on post_likes" ON post_likes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on post_comments" ON post_comments;
CREATE POLICY "Allow all on post_comments" ON post_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on subscription_plans" ON subscription_plans;
CREATE POLICY "Allow all on subscription_plans" ON subscription_plans FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on organization_subscriptions" ON organization_subscriptions;
CREATE POLICY "Allow all on organization_subscriptions" ON organization_subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on stripe_config" ON stripe_config;
CREATE POLICY "Allow all on stripe_config" ON stripe_config FOR ALL USING (true) WITH CHECK (true);

-- Initial data migration: Create default Free plan and assign to all organizations
INSERT INTO subscription_plans (name, key, description, monthly_price_cents, yearly_price_cents, max_team_members, max_open_tickets, max_queues, feature_alerts, feature_reports, feature_api_access, feature_cmdb_access, is_active, is_default, display_order)
VALUES ('Free', 'free', 'Perfect for small teams getting started', 0, 0, 5, 50, 3, true, false, false, false, true, true, 0)
ON CONFLICT (key) DO NOTHING;

-- Assign all existing organizations to Free plan
INSERT INTO organization_subscriptions (organization_id, plan_id, billing_cycle, status, current_period_end)
SELECT o.id, p.id, 'monthly', 'active', NOW() + INTERVAL '365 days'
FROM organizations o
CROSS JOIN subscription_plans p
WHERE p.is_default = true
ON CONFLICT (organization_id) DO NOTHING;
