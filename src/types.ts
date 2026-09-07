export type TicketStatus = 
  | 'New'
  | 'AI Diagnostics'
  | 'In Progress'
  | 'Awaiting User'
  | 'Escalated'
  | 'Resolved'
  | 'Closed';

export type ActiveView = 
  | 'dashboard'
  | 'tickets'
  | 'escalations'
  | 'diagnostics'
  | 'chat'
  | 'complaints'
  | 'knowledge';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketCategory =
  | 'Software Bug'
  | 'Network & Connectivity'
  | 'Cloud & Infrastructure'
  | 'Account & Authentication'
  | 'Billing & Invoicing'
  | 'Performance & Latency'
  | 'Hardware Issue'
  | 'Service Complaint';

export interface TicketMessage {
  id: string;
  sender: 'user' | 'ai' | 'agent';
  senderName: string;
  avatar?: string;
  timestamp: string;
  text: string;
  isSolutionProposal?: boolean;
}

export interface AiDiagnosticAnalysis {
  summary: string;
  rootCauseHypothesis: string;
  suggestedFixSteps: string[];
  severityScore: number; // 1 - 10
  detectedCategory: TicketCategory;
  suggestedPriority: TicketPriority;
  recommendedDepartment: string;
  estimatedResolutionMinutes: number;
  confidenceScore: number; // 0 - 100%
  tags: string[];
}

export interface EscalationInfo {
  isEscalated: boolean;
  escalatedAt?: string;
  escalatedBy?: string;
  escalationReason?: string;
  assignedTeam?: string;
  assignedAgent?: string;
  aiHandoverSummary?: string;
  slaTargetHours?: number;
  internalNotes?: string[];
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string; // e.g., "SR-1042"
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  systemEnvironment?: string; // e.g. "Ubuntu 22.04 / Node.js 20 / Chrome 124"
  errorLogs?: string;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: AiDiagnosticAnalysis;
  escalation: EscalationInfo;
  messages: TicketMessage[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'customer' | 'support_agent';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
}
