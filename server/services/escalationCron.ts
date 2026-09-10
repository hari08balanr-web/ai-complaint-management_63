import cron from 'node-cron';
import { Ticket } from '../models/Ticket';
import { memoryStore } from '../db';
import { emitTicketEscalated } from '../socket';
import mongoose from 'mongoose';

const SUPPORT_EMAIL = process.env.SUPPORT_TEAM_EMAIL || 'escalations@support.company.com';
const WEBHOOK_URL = process.env.NOTIFICATION_WEBHOOK_URL;

async function sendEscalationAlert(ticket: any) {
  const alertPayload = {
    event: 'TICKET_SLA_BREACH',
    ticketId: ticket.ticketId,
    title: ticket.title,
    priority: ticket.priority,
    requester: `${ticket.requesterName} (${ticket.requesterEmail})`,
    slaDeadline: ticket.slaDeadline,
    escalatedAt: new Date().toISOString(),
    recipient: SUPPORT_EMAIL
  };

  console.log(`\n======================================================`);
  console.log(`🚨 [SLA BREACH ALERT] Automated Escalation Triggered!`);
  console.log(`Ticket: ${ticket.ticketId} - "${ticket.title}"`);
  console.log(`Priority: ${ticket.priority} | Requester: ${ticket.requesterEmail}`);
  console.log(`Dispatched Notification to Support Team: ${SUPPORT_EMAIL}`);
  console.log(`======================================================\n`);

  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertPayload)
      });
      console.log(`[Escalation Alert] Webhook payload delivered to ${WEBHOOK_URL}`);
    } catch (err: any) {
      console.warn(`[Escalation Alert] Webhook delivery failed: ${err.message}`);
    }
  }
}

export function startEscalationCron() {
  // Run check every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const now = new Date();

      if (mongoose.connection.readyState === 1) {
        // Query active MongoDB tickets whose SLA deadline is in the past
        const breachedTickets = await Ticket.find({
          status: { $in: ['Submitted', 'AI Reviewed', 'In Progress'] },
          slaDeadline: { $lt: now },
          'escalationDetails.isEscalated': { $ne: true }
        });

        for (const t of breachedTickets) {
          t.status = 'Escalated';
          t.escalationDetails = {
            isEscalated: true,
            escalatedAt: now,
            reason: 'Automated SLA Breach Engine: SLA deadline elapsed without resolution',
            notifiedEmail: SUPPORT_EMAIL,
            channel: 'Support Webhook & Email'
          };
          t.messages.push({
            id: `msg_esc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            sender: 'ResolveDesk Escalation Bot',
            senderEmail: 'system@resolvedesk.internal',
            text: `⚠️ **[Automated SLA Escalation]** The target resolution window for this **${t.priority}** priority issue has elapsed. This ticket has been automatically marked as **Escalated** and dispatched to our Senior Support & Engineering Teams (${SUPPORT_EMAIL}).`,
            timestamp: now,
            isAi: true
          });
          t.updatedAt = now;
          await t.save();

          await sendEscalationAlert(t);
          emitTicketEscalated(t.userId, t.ticketId, t);
        }
      } else {
        // Fallback for memory store
        for (const [id, t] of memoryStore.tickets.entries()) {
          const deadline = new Date(t.slaDeadline);
          if (
            ['Submitted', 'AI Reviewed', 'In Progress'].includes(t.status) &&
            deadline < now &&
            !t.escalationDetails?.isEscalated
          ) {
            t.status = 'Escalated';
            t.escalationDetails = {
              isEscalated: true,
              escalatedAt: now,
              reason: 'Automated SLA Breach Engine: SLA deadline elapsed without resolution',
              notifiedEmail: SUPPORT_EMAIL,
              channel: 'Support Webhook & Email'
            };
            t.messages.push({
              id: `msg_esc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              sender: 'ResolveDesk Escalation Bot',
              senderEmail: 'system@resolvedesk.internal',
              text: `⚠️ **[Automated SLA Escalation]** The target resolution window for this **${t.priority}** priority issue has elapsed. This ticket has been automatically marked as **Escalated** and dispatched to our Senior Support & Engineering Teams (${SUPPORT_EMAIL}).`,
              timestamp: now,
              isAi: true
            });
            t.updatedAt = now;
            memoryStore.tickets.set(id, t);
            memoryStore.persist();

            await sendEscalationAlert(t);
            emitTicketEscalated(t.userId, t.ticketId, t);
          }
        }
      }
    } catch (err: any) {
      console.log('[Escalation Service] Check notice:', err?.message || err);
    }
  });

  console.log('[Escalation Service] Automated node-cron SLA watchdog initialized (30s interval).');
}
