import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Ticket, ITicket } from '../models/Ticket';
import { memoryStore } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { classifyTicketWithAI, generateAiThreadReply } from '../services/aiClassifier';
import { 
  emitTicketCreated, 
  emitTicketStatusChanged, 
  emitTicketMessageAdded, 
  emitTicketEscalated 
} from '../socket';

const router = Router();

// Helper to generate formatted ticket ID: TSC-2026-XXXX
function generateTicketId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TSC-2026-${rand}`;
}

// POST /api/tickets - Create ticket & trigger AI classification
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, attachment } = req.body;
    const user = req.user!;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    // Call direct server-side Gemini classification pipeline
    const aiResult = await classifyTicketWithAI(title, description, category);

    const ticketId = generateTicketId();
    const now = new Date();
    const slaDeadline = new Date(now.getTime() + aiResult.slaHours * 60 * 60 * 1000);

    const initialMessages = [
      {
        id: `msg_user_${Date.now()}`,
        sender: user.name,
        senderEmail: user.email,
        text: description,
        timestamp: now,
        isAi: false
      },
      {
        id: `msg_ai_${Date.now() + 200}`,
        sender: 'AI Assistant',
        senderEmail: 'ai-assistant@support.internal',
        text: aiResult.suggestedResponse,
        timestamp: new Date(now.getTime() + 1000),
        isAi: true
      }
    ];

    const ticketData = {
      ticketId,
      userId: user.userId,
      requesterName: user.name,
      requesterEmail: user.email,
      title: title.trim(),
      description: description.trim(),
      category: aiResult.category,
      priority: aiResult.priority,
      status: 'AI Reviewed', // Immediately AI Reviewed upon automated first triage
      slaDeadline,
      slaHours: aiResult.slaHours,
      aiSuggestedResponse: aiResult.suggestedResponse,
      attachment: attachment ? {
        name: attachment.name,
        url: attachment.url,
        type: attachment.type,
        size: attachment.size
      } : undefined,
      messages: initialMessages,
      escalationDetails: {
        isEscalated: false
      },
      createdAt: now,
      updatedAt: now
    };

    let savedTicket: any = null;

    if (mongoose.connection.readyState === 1) {
      const ticket = new Ticket(ticketData);
      savedTicket = await ticket.save();
    } else {
      // Memory store fallback
      savedTicket = {
        ...ticketData,
        _id: `tkt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        id: ticketId
      };
      memoryStore.tickets.set(ticketId, savedTicket);
      memoryStore.persist();
    }

    // Real-time notification via Socket.io
    emitTicketCreated(user.userId, savedTicket);

    return res.status(201).json({ ticket: savedTicket });
  } catch (err: any) {
    console.error('Ticket creation error:', err);
    return res.status(500).json({ error: 'Failed to create and classify ticket.' });
  }
});

// GET /api/tickets - List all tickets belonging to logged-in user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let tickets: any[] = [];

    if (mongoose.connection.readyState === 1) {
      tickets = await Ticket.find({ userId: user.userId }).sort({ createdAt: -1 });
    } else {
      tickets = Array.from(memoryStore.tickets.values())
        .filter((t: any) => t.userId === user.userId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return res.json({ tickets });
  } catch (err: any) {
    console.error('Fetch tickets error:', err);
    return res.status(500).json({ error: 'Failed to load tickets.' });
  }
});

// GET /api/tickets/:id - Get specific ticket details
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    let ticket: any = null;

    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        ticket = await Ticket.findOne({ _id: id, userId: user.userId });
      }
      if (!ticket) {
        ticket = await Ticket.findOne({ ticketId: id, userId: user.userId });
      }
    } else {
      ticket = memoryStore.tickets.get(id);
      if (!ticket) {
        for (const t of memoryStore.tickets.values()) {
          if ((t._id === id || t.ticketId === id) && t.userId === user.userId) {
            ticket = t;
            break;
          }
        }
      }
    }

    if (!ticket || ticket.userId !== user.userId) {
      return res.status(404).json({ error: 'Ticket not found or unauthorized.' });
    }

    return res.json({ ticket });
  } catch (err: any) {
    console.error('Fetch ticket error:', err);
    return res.status(500).json({ error: 'Failed to retrieve ticket.' });
  }
});

// POST /api/tickets/:id/messages - User replies in ticket thread
router.post('/:id/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text, askAi } = req.body;
    const user = req.user!;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sender: user.name,
      senderEmail: user.email,
      text: text.trim(),
      timestamp: new Date(),
      isAi: false
    };

    let updatedTicket: any = null;

    if (mongoose.connection.readyState === 1) {
      const query = mongoose.Types.ObjectId.isValid(id) 
        ? { _id: id, userId: user.userId }
        : { ticketId: id, userId: user.userId };

      const ticket = await Ticket.findOne(query);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }

      ticket.messages.push(newMessage);
      ticket.updatedAt = new Date();
      // If was submitted or AI reviewed, move to In Progress upon human message
      if (ticket.status === 'Submitted' || ticket.status === 'AI Reviewed') {
        ticket.status = 'In Progress';
      }
      updatedTicket = await ticket.save();
    } else {
      let found: any = null;
      for (const t of memoryStore.tickets.values()) {
        if ((t._id === id || t.ticketId === id) && t.userId === user.userId) {
          found = t;
          break;
        }
      }
      if (!found) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }

      found.messages.push(newMessage);
      found.updatedAt = new Date();
      if (found.status === 'Submitted' || found.status === 'AI Reviewed') {
        found.status = 'In Progress';
      }
      memoryStore.tickets.set(found.ticketId, found);
      memoryStore.persist();
      updatedTicket = found;
    }

    emitTicketMessageAdded(user.userId, updatedTicket.ticketId, newMessage, updatedTicket);

    // If user requested AI assistance, directly invoke Gemini for response generation
    let aiMessage: any = null;
    if (askAi) {
      try {
        const aiReplyText = await generateAiThreadReply(updatedTicket, text.trim());
        aiMessage = {
          id: `msg_ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          sender: 'AI Assistant',
          senderEmail: 'ai-assistant@support.internal',
          text: aiReplyText,
          timestamp: new Date(),
          isAi: true
        };

        if (mongoose.connection.readyState === 1) {
          const query = mongoose.Types.ObjectId.isValid(id) 
            ? { _id: id, userId: user.userId }
            : { ticketId: id, userId: user.userId };
          const ticket = await Ticket.findOne(query);
          if (ticket) {
            ticket.messages.push(aiMessage);
            ticket.updatedAt = new Date();
            updatedTicket = await ticket.save();
          }
        } else {
          const found = memoryStore.tickets.get(updatedTicket.ticketId);
          if (found) {
            found.messages.push(aiMessage);
            found.updatedAt = new Date();
            memoryStore.tickets.set(found.ticketId, found);
            memoryStore.persist();
            updatedTicket = found;
          }
        }
        emitTicketMessageAdded(user.userId, updatedTicket.ticketId, aiMessage, updatedTicket);
      } catch (aiErr: any) {
        console.log('[Tickets Route] AI thread reply notice:', aiErr?.message || aiErr);
      }
    }

    return res.json({ message: newMessage, aiMessage, ticket: updatedTicket });
  } catch (err: any) {
    console.error('Post message error:', err);
    return res.status(500).json({ error: 'Failed to post message.' });
  }
});

// POST /api/tickets/:id/ai-reply - Trigger direct on-demand Gemini AI diagnostic advice
router.post('/:id/ai-reply', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { query } = req.body;
    const user = req.user!;

    let currentTicket: any = null;
    if (mongoose.connection.readyState === 1) {
      const dbQuery = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id, userId: user.userId }
        : { ticketId: id, userId: user.userId };
      currentTicket = await Ticket.findOne(dbQuery);
    } else {
      for (const t of memoryStore.tickets.values()) {
        if ((t._id === id || t.ticketId === id) && t.userId === user.userId) {
          currentTicket = t;
          break;
        }
      }
    }

    if (!currentTicket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const promptText = query || 'Please analyze our ticket status and provide actionable technical diagnostic recommendations.';
    const aiReplyText = await generateAiThreadReply(currentTicket, promptText);

    const aiMessage = {
      id: `msg_ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sender: 'AI Assistant',
      senderEmail: 'ai-assistant@support.internal',
      text: aiReplyText,
      timestamp: new Date(),
      isAi: true
    };

    let updatedTicket: any = null;
    if (mongoose.connection.readyState === 1) {
      currentTicket.messages.push(aiMessage);
      currentTicket.updatedAt = new Date();
      updatedTicket = await currentTicket.save();
    } else {
      currentTicket.messages.push(aiMessage);
      currentTicket.updatedAt = new Date();
      memoryStore.tickets.set(currentTicket.ticketId, currentTicket);
      memoryStore.persist();
      updatedTicket = currentTicket;
    }

    emitTicketMessageAdded(user.userId, updatedTicket.ticketId, aiMessage, updatedTicket);
    return res.json({ message: aiMessage, ticket: updatedTicket });
  } catch (err: any) {
    console.error('AI reply generation error:', err);
    return res.status(500).json({ error: 'Failed to generate AI response.' });
  }
});

// POST /api/tickets/:id/escalate - User requests manual escalation
router.post('/:id/escalate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user!;
    const now = new Date();
    const supportEmail = process.env.SUPPORT_TEAM_EMAIL || 'escalations@support.company.com';

    const escalationReason = reason || 'Customer requested direct engineering escalation';

    const escalationMsg = {
      id: `msg_esc_${Date.now()}`,
      sender: 'ResolveDesk Escalation Bot',
      senderEmail: 'system@resolvedesk.internal',
      text: `🚨 **[Manual Escalation Dispatched]** Ticket escalated by **${user.name}**.\n\n**Reason:** ${escalationReason}\n\nOur Senior Support & Engineering Teams have been notified (${supportEmail}).`,
      timestamp: now,
      isAi: true
    };

    let updatedTicket: any = null;

    if (mongoose.connection.readyState === 1) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id, userId: user.userId }
        : { ticketId: id, userId: user.userId };

      const ticket = await Ticket.findOne(query);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }

      ticket.status = 'Escalated';
      ticket.escalationDetails = {
        isEscalated: true,
        escalatedAt: now,
        reason: escalationReason,
        notifiedEmail: supportEmail,
        channel: 'Manual Escalation Webhook & Email'
      };
      ticket.messages.push(escalationMsg);
      ticket.updatedAt = now;
      updatedTicket = await ticket.save();
    } else {
      let found: any = null;
      for (const t of memoryStore.tickets.values()) {
        if ((t._id === id || t.ticketId === id) && t.userId === user.userId) {
          found = t;
          break;
        }
      }
      if (!found) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }

      found.status = 'Escalated';
      found.escalationDetails = {
        isEscalated: true,
        escalatedAt: now,
        reason: escalationReason,
        notifiedEmail: supportEmail,
        channel: 'Manual Escalation Webhook & Email'
      };
      found.messages.push(escalationMsg);
      found.updatedAt = now;
      memoryStore.tickets.set(found.ticketId, found);
      memoryStore.persist();
      updatedTicket = found;
    }

    emitTicketEscalated(user.userId, updatedTicket.ticketId, updatedTicket);
    emitTicketStatusChanged(user.userId, updatedTicket.ticketId, updatedTicket);

    return res.json({ ticket: updatedTicket });
  } catch (err: any) {
    console.error('Escalation error:', err);
    return res.status(500).json({ error: 'Failed to escalate ticket.' });
  }
});

// POST /api/tickets/:id/resolve - User marks ticket resolved
router.post('/:id/resolve', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const now = new Date();

    const resolveMsg = {
      id: `msg_res_${Date.now()}`,
      sender: user.name,
      senderEmail: user.email,
      text: '✅ Ticket marked as **Resolved** by customer.',
      timestamp: now,
      isAi: false
    };

    let updatedTicket: any = null;

    if (mongoose.connection.readyState === 1) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id, userId: user.userId }
        : { ticketId: id, userId: user.userId };

      const ticket = await Ticket.findOne(query);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }

      ticket.status = 'Resolved';
      ticket.messages.push(resolveMsg);
      ticket.updatedAt = now;
      updatedTicket = await ticket.save();
    } else {
      let found: any = null;
      for (const t of memoryStore.tickets.values()) {
        if ((t._id === id || t.ticketId === id) && t.userId === user.userId) {
          found = t;
          break;
        }
      }
      if (!found) {
        return res.status(404).json({ error: 'Ticket not found.' });
      }

      found.status = 'Resolved';
      found.messages.push(resolveMsg);
      found.updatedAt = now;
      memoryStore.tickets.set(found.ticketId, found);
      memoryStore.persist();
      updatedTicket = found;
    }

    emitTicketStatusChanged(user.userId, updatedTicket.ticketId, updatedTicket);

    return res.json({ ticket: updatedTicket });
  } catch (err: any) {
    console.error('Resolve error:', err);
    return res.status(500).json({ error: 'Failed to resolve ticket.' });
  }
});

export default router;
