import { supabase } from './supabase';

const MCP_BASE_URL = '/mcp';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function mcpRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: unknown
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${MCP_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export interface CreateTicketData {
  title: string;
  description: string;
  priority: string;
  category: string;
  assetTag?: string;
  assetName?: string;
  hasBounty?: boolean;
  bountyAmount?: number;
}

export interface CreatePostData {
  title?: string;
  content: string;
  imageUrl?: string;
}

export interface CreateMemberData {
  email: string;
  displayName: string;
  department?: string;
  role?: string;
  avatarUrl?: string;
}

export const mcpClient = {
  getFeed: () => mcpRequest('GET', '/tickets/feed'),
  getMixedFeed: () => mcpRequest('GET', '/feed/mixed'),
  getQueue: () => mcpRequest('GET', '/tickets/queue'),
  getResolved: () => mcpRequest('GET', '/tickets/resolved'),
  getEscalated: () => mcpRequest('GET', '/tickets/escalated'),
  createTicket: (data: CreateTicketData) => mcpRequest('POST', '/tickets', data),
  assignTicket: (ticketId: string) => mcpRequest('POST', `/tickets/${ticketId}/assign`),
  resolveTicket: (ticketId: string) => mcpRequest('POST', `/tickets/${ticketId}/resolve`),
  escalateTicket: (ticketId: string) => mcpRequest('POST', `/tickets/${ticketId}/escalate`),
  getActivities: (ticketId: string) => mcpRequest('GET', `/tickets/${ticketId}/activities`),
  addActivity: (ticketId: string, data: { type: string; content: string }) => 
    mcpRequest('POST', `/tickets/${ticketId}/activities`, data),
  getAgentStats: () => mcpRequest('GET', '/agent/stats'),
  getLeaderboard: () => mcpRequest('GET', '/leaderboard'),
  
  getProfiles: () => mcpRequest('GET', '/profiles'),
  getProfile: (userId: string) => mcpRequest('GET', `/profiles/${userId}`),
  getMyProfile: () => mcpRequest('GET', '/profiles/me'),
  updateMyProfile: (data: { displayName?: string; bio?: string; department?: string; avatarUrl?: string }) => 
    mcpRequest('PUT', '/profiles/me', data),
  createMember: (data: CreateMemberData) => mcpRequest('POST', '/profiles', data),
  
  getPosts: (userId?: string) => mcpRequest('GET', userId ? `/posts?user_id=${userId}` : '/posts'),
  createPost: (data: CreatePostData) => mcpRequest('POST', '/posts', data),
  likePost: (postId: string) => mcpRequest('POST', `/posts/${postId}/like`),
  getPostComments: (postId: string) => mcpRequest('GET', `/posts/${postId}/comments`),
  addPostComment: (postId: string, data: { content: string }) => 
    mcpRequest('POST', `/posts/${postId}/comments`, data),
};
