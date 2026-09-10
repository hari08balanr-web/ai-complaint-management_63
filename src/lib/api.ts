import { AuthUser, Ticket, MongoStatus } from '../types';

const TOKEN_KEY = 'resolvedesk_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    removeStoredToken();
    // Dispatch event for UI to react to session expiry
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
}

export async function apiSignup(name: string, email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to sign up');
  }
  setStoredToken(data.token);
  return data;
}

export async function apiLogin(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to log in');
  }
  setStoredToken(data.token);
  return data;
}

export async function apiGetMe(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetchWithAuth('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function apiGetTickets(): Promise<Ticket[]> {
  const res = await fetchWithAuth('/api/tickets');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch tickets');
  }
  return data.tickets;
}

export async function apiGetTicket(id: string): Promise<Ticket> {
  const res = await fetchWithAuth(`/api/tickets/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch ticket');
  }
  return data.ticket;
}

export async function apiCreateTicket(payload: {
  title: string;
  description: string;
  category: string;
  attachment?: { name: string; url: string; type?: string; size?: number };
}): Promise<Ticket> {
  const res = await fetchWithAuth('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit ticket');
  }
  return data.ticket;
}

export async function apiPostTicketMessage(
  ticketId: string, 
  text: string, 
  askAi: boolean = false
): Promise<{ message: any; aiMessage?: any; ticket: Ticket }> {
  const res = await fetchWithAuth(`/api/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, askAi })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to post message');
  }
  return data;
}

export async function apiAskAiReply(
  ticketId: string, 
  query?: string
): Promise<{ message: any; ticket: Ticket }> {
  const res = await fetchWithAuth(`/api/tickets/${ticketId}/ai-reply`, {
    method: 'POST',
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to request AI response');
  }
  return data;
}

export async function apiEscalateTicket(ticketId: string, reason: string): Promise<Ticket> {
  const res = await fetchWithAuth(`/api/tickets/${ticketId}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to escalate ticket');
  }
  return data.ticket;
}

export async function apiResolveTicket(ticketId: string): Promise<Ticket> {
  const res = await fetchWithAuth(`/api/tickets/${ticketId}/resolve`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to resolve ticket');
  }
  return data.ticket;
}

export async function apiGetDbStatus(): Promise<MongoStatus> {
  try {
    const res = await fetch('/api/db-status');
    return await res.json();
  } catch {
    return {
      isConnected: false,
      connectionType: 'fallback_memory',
      readyState: 0,
      connectionError: 'Could not contact status endpoint',
      uriConfigured: false
    };
  }
}

export async function apiRetryDbConnection(): Promise<MongoStatus & { retryResult?: { success: boolean; message: string } }> {
  try {
    const res = await fetch('/api/db-status/retry', { method: 'POST' });
    return await res.json();
  } catch (err: any) {
    return {
      isConnected: false,
      connectionType: 'fallback_memory',
      readyState: 0,
      connectionError: err?.message || 'Failed to retry connection',
      uriConfigured: false
    };
  }
}
