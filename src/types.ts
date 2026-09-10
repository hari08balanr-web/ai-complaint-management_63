export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketStatus = 'Submitted' | 'AI Reviewed' | 'In Progress' | 'Escalated' | 'Resolved';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface TicketMessage {
  id: string;
  sender: string;
  senderEmail: string;
  text: string;
  timestamp: string | Date;
  isAi: boolean;
}

export interface TicketEscalation {
  isEscalated: boolean;
  escalatedAt?: string | Date;
  reason?: string;
  notifiedEmail?: string;
  channel?: string;
}

export interface Ticket {
  _id?: string;
  ticketId: string;
  userId: string;
  requesterName: string;
  requesterEmail: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  slaDeadline: string | Date;
  slaHours: number;
  aiSuggestedResponse?: string;
  attachment?: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  };
  messages: TicketMessage[];
  escalationDetails?: TicketEscalation;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface MongoStatus {
  isConnected: boolean;
  connectionType: 'atlas' | 'fallback_memory';
  readyState: number;
  connectionError: string | null;
  uriConfigured: boolean;
}

export interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  ticketId?: string;
  timestamp: number;
}
