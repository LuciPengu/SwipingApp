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

export const mcpClient = {
  getFeed: () => mcpRequest('GET', '/tickets/feed'),
  getQueue: () => mcpRequest('GET', '/tickets/queue'),
  getResolved: () => mcpRequest('GET', '/tickets/resolved'),
  getEscalated: () => mcpRequest('GET', '/tickets/escalated'),
  assignTicket: (ticketId: string) => mcpRequest('POST', `/tickets/${ticketId}/assign`),
  resolveTicket: (ticketId: string) => mcpRequest('POST', `/tickets/${ticketId}/resolve`),
  escalateTicket: (ticketId: string) => mcpRequest('POST', `/tickets/${ticketId}/escalate`),
  getActivities: (ticketId: string) => mcpRequest('GET', `/tickets/${ticketId}/activities`),
  addActivity: (ticketId: string, data: { type: string; content: string }) => 
    mcpRequest('POST', `/tickets/${ticketId}/activities`, data),
  getAgentStats: () => mcpRequest('GET', '/agent/stats'),
  getLeaderboard: () => mcpRequest('GET', '/leaderboard'),
};
