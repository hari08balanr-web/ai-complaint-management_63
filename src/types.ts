export type UserRole = 'user' | 'agent' | 'admin';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketStatus = 'Open' | 'In Progress' | 'Escalated' | 'Resolved' | 'Closed';

export type TicketCategory =
  | 'Software Bug'
  | 'Network & Connectivity'
  | 'Cloud & Infrastructure'
  | 'Account & Authentication'
  | 'Billing & Invoicing'
  | 'Performance & Latency'
  | 'Hardware Issue'
  | 'Service Complaint';

export interface Ticket {
  id: string; // Firestore document ID
  ticketId: string; // Formatted ID e.g. "TSC-2026-4891"
  userId: string;
  requesterName: string;
  requesterEmail: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  slaDeadline: number; // epoch ms
  escalationLevel: number; // 0, 1, 2, 3
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'agent' | 'AI';
  content: string;
  timestamp: number;
}

export interface EscalationLogEntry {
  id: string;
  fromLevel: number;
  toLevel: number;
  reason: string;
  triggeredBy: string;
  timestamp: number;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  ticketId?: string;
  timestamp: number;
}

export type ActiveNavTab = 'tickets' | 'new-ticket' | 'queue' | 'agents' | 'analytics' | 'faq';
