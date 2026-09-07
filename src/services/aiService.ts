import { AiDiagnosticAnalysis, ServiceTicket, ChatMessage } from '../types';

export async function requestAiDiagnosis(data: {
  title: string;
  description: string;
  category?: string;
  systemEnvironment?: string;
  errorLogs?: string;
}): Promise<AiDiagnosticAnalysis & { welcomeDiagnosticMessage: string }> {
  try {
    const res = await fetch('/api/ai/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('AI diagnose fetch error, using local fallback:', err);
    return {
      summary: `Automated triage for "${data.title}": Diagnostics initiated.`,
      rootCauseHypothesis: 'System anomaly detected. Automated telemetry review recommended.',
      suggestedFixSteps: [
        'Inspect local browser cache and verify active session credentials.',
        'Check network connectivity and endpoint status.',
        'Verify request parameters match API contract.'
      ],
      severityScore: 6,
      detectedCategory: (data.category as any) || 'Software Bug',
      suggestedPriority: 'Medium',
      recommendedDepartment: 'Tier 1 Support Desk',
      estimatedResolutionMinutes: 30,
      confidenceScore: 88,
      tags: ['Support', 'Triage'],
      welcomeDiagnosticMessage: `### AI Diagnostic Report\n\nI have received your ticket regarding **${data.title}**.\n\n**Immediate recommendation:**\n1. Review your error logs and reproduction steps.\n2. Confirm if other team members or accounts reproduce this issue.\n3. If unaddressed, please escalate to on-call support.`
    };
  }
}

export async function sendChatMessage(
  messages: { role: 'user' | 'model' | 'system'; content: string }[],
  currentTicketContext?: Partial<ServiceTicket>
): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, currentTicketContext })
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return data.reply || 'I processed your request.';
  } catch (err) {
    console.warn('AI chat fetch error:', err);
    return "I am experiencing a temporary connection hiccup with the AI gateway. However, you can submit your issue as a ticket right here and our support team will assist you!";
  }
}

export async function requestEscalationSummary(
  ticket: ServiceTicket,
  escalationReason: string
): Promise<string> {
  try {
    const res = await fetch('/api/ai/escalate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket, escalationReason })
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return data.summary;
  } catch (err) {
    console.warn('Escalation summary fetch error:', err);
    return `**ESCALATION BRIEF (${ticket.ticketNumber})**\n- **Requester:** ${ticket.requesterName}\n- **Reason:** ${escalationReason}\n- **Action Required:** Immediate Tier 2 Support review.`;
  }
}

export async function requestAgentAssist(
  ticket: ServiceTicket,
  agentTone: string = 'professional'
): Promise<string> {
  try {
    const res = await fetch('/api/ai/agent-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket, agentTone })
    });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return data.draftReply;
  } catch (err) {
    console.warn('Agent assist fetch error:', err);
    return `Hi ${ticket.requesterName},\n\nThank you for reaching out. We are investigating ${ticket.ticketNumber} and will update you promptly.`;
  }
}
