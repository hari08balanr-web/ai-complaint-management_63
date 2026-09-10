import mongoose, { Schema, Document, Model } from 'mongoose';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Submitted' | 'AI Reviewed' | 'In Progress' | 'Escalated' | 'Resolved';

export interface ITicketMessage {
  id: string;
  sender: string;
  senderEmail: string;
  text: string;
  timestamp: Date;
  isAi: boolean;
}

export interface ITicketEscalation {
  isEscalated: boolean;
  escalatedAt?: Date;
  reason?: string;
  notifiedEmail?: string;
  channel?: string;
}

export interface ITicket extends Document {
  ticketId: string;
  userId: string;
  requesterName: string;
  requesterEmail: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  slaDeadline: Date;
  slaHours: number;
  aiSuggestedResponse?: string;
  attachment?: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  };
  messages: ITicketMessage[];
  escalationDetails?: ITicketEscalation;
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true },
  senderEmail: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isAi: { type: Boolean, default: false }
}, { _id: false });

const TicketEscalationSchema = new Schema({
  isEscalated: { type: Boolean, default: false },
  escalatedAt: { type: Date },
  reason: { type: String },
  notifiedEmail: { type: String },
  channel: { type: String, default: 'Email Webhook' }
}, { _id: false });

const TicketSchema = new Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  requesterName: { type: String, required: true },
  requesterEmail: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  status: { 
    type: String, 
    enum: ['Submitted', 'AI Reviewed', 'In Progress', 'Escalated', 'Resolved'], 
    default: 'Submitted' 
  },
  slaDeadline: { type: Date, required: true },
  slaHours: { type: Number, default: 24 },
  aiSuggestedResponse: { type: String },
  attachment: {
    name: { type: String },
    url: { type: String },
    type: { type: String },
    size: { type: Number }
  },
  messages: [TicketMessageSchema],
  escalationDetails: TicketEscalationSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Ticket: Model<ITicket> = (mongoose.models.Ticket as Model<ITicket>) || mongoose.model<ITicket>('Ticket', TicketSchema);
