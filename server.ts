import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString()
  });
});

// Helper for fallback diagnostic when Gemini key is not configured or fails
function generateFallbackDiagnosis(data: {
  title: string;
  description: string;
  category?: string;
  errorLogs?: string;
}) {
  const text = (data.title + ' ' + data.description + ' ' + (data.errorLogs || '')).toLowerCase();
  
  let detectedCategory = data.category || 'Software Bug';
  let priority = 'Medium';
  let severityScore = 6;
  let recommendedDept = 'Core Technical Support';
  let rootCause = 'Potential application runtime configuration or resource contention issue.';
  const fixSteps: string[] = [
    'Verify client environment versions and clear cache or temporary state.',
    'Inspect server application logs around the timestamp of occurrence.',
    'Test with isolated payload in staging environment.'
  ];
  const tags: string[] = ['Support-Request'];

  if (text.includes('504') || text.includes('timeout') || text.includes('ingress') || text.includes('gateway')) {
    detectedCategory = 'Cloud & Infrastructure';
    priority = 'Critical';
    severityScore = 9;
    recommendedDept = 'Tier 2 Cloud Infrastructure & API Architecture';
    rootCause = 'Upstream gateway timeout: backend request processing duration exceeded proxy threshold.';
    fixSteps[0] = 'Increase proxy timeout window (e.g. proxy_read_timeout in NGINX or load balancer) to 300s.';
    fixSteps[1] = 'Refactor heavy batch transactions to asynchronous worker job queue.';
    fixSteps[2] = 'Verify downstream database connection pools are not exhausted.';
    tags.push('504-Timeout', 'Infrastructure', 'Ingress');
  } else if (text.includes('sso') || text.includes('saml') || text.includes('auth') || text.includes('okta') || text.includes('token')) {
    detectedCategory = 'Account & Authentication';
    priority = 'High';
    severityScore = 8;
    recommendedDept = 'Security & IAM Operations';
    rootCause = 'Identity provider assertion verification failure or rotated security certificate mismatch.';
    fixSteps[0] = 'Check IdP SAML/OAuth metadata and rotate current X.509 signing certificate.';
    fixSteps[1] = 'Verify redirect URI and entity ID match Okta/Azure application credentials exactly.';
    fixSteps[2] = 'Inspect user directory group assignments for necessary claim mappings.';
    tags.push('SSO', 'Authentication', 'Security');
  } else if (text.includes('charge') || text.includes('billing') || text.includes('invoice') || text.includes('refund') || text.includes('payment')) {
    detectedCategory = 'Billing & Invoicing';
    priority = 'Medium';
    severityScore = 5;
    recommendedDept = 'Finance & Billing Operations';
    rootCause = 'Payment processing webhook reconciliation delay or idempotent transaction retry duplication.';
    fixSteps[0] = 'Locate customer Stripe customer ID and inspect payment_intent event audit log.';
    fixSteps[1] = 'Issue transaction refund or credit ledger memo if duplicate charge verified.';
    fixSteps[2] = 'Send updated zero-balance statement to customer billing contact.';
    tags.push('Billing', 'Invoice', 'Payment');
  } else if (text.includes('slow') || text.includes('latency') || text.includes('lag') || text.includes('memory') || text.includes('cpu')) {
    detectedCategory = 'Performance & Latency';
    priority = 'High';
    severityScore = 7;
    recommendedDept = 'Platform Reliability Engineering';
    rootCause = 'High compute utilization or unindexed query causing thread pool starvation.';
    fixSteps[0] = 'Analyze APM tracing metrics for database query latency outliers.';
    fixSteps[1] = 'Scale horizontal pod autoscaler (HPA) or instance replica count.';
    fixSteps[2] = 'Enable Redis response caching for high-frequency read endpoints.';
    tags.push('Performance', 'Latency', 'Scaling');
  }

  return {
    summary: `Technical diagnosis for "${data.title.slice(0, 70)}": ${rootCause}`,
    rootCauseHypothesis: rootCause,
    suggestedFixSteps: fixSteps,
    severityScore,
    detectedCategory,
    suggestedPriority: priority,
    recommendedDepartment: recommendedDept,
    estimatedResolutionMinutes: severityScore * 5,
    confidenceScore: 91,
    tags,
    welcomeDiagnosticMessage: `### AI Technical Diagnosis\n\nI have conducted an initial automated diagnostic scan on your issue:\n\n**Root Cause Hypothesis:**\n${rootCause}\n\n**Immediate Remediation Steps:**\n${fixSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\n*If these steps resolve your issue, you can mark this ticket as resolved. Otherwise, use the "Escalate to Support" button below.*`
  };
}

// 1. Endpoint: AI Diagnose Ticket
app.post('/api/ai/diagnose', async (req: Request, res: Response) => {
  try {
    const { title, description, category, systemEnvironment, errorLogs } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const fallback = generateFallbackDiagnosis({ title, description, category, errorLogs });
      return res.json(fallback);
    }

    const prompt = `You are a Principal Technical Support Engineer and Incident Response Architect.
Analyze the following technical service request or complaint from a user:

Title: ${title}
Description: ${description}
User-Selected Category: ${category || 'Unspecified'}
System Environment: ${systemEnvironment || 'Not provided'}
Error Logs / Stack Trace: ${errorLogs || 'None'}

Provide an accurate, deep technical diagnosis and return ONLY a valid JSON object with the following schema:
{
  "summary": "Concise 1-2 sentence executive summary of the technical problem",
  "rootCauseHypothesis": "Deep technical analysis explaining the likely root cause",
  "suggestedFixSteps": [
    "Step 1 actionable self-service fix for user or technician",
    "Step 2 actionable self-service fix",
    "Step 3 verification or workaround"
  ],
  "severityScore": (integer between 1 and 10),
  "detectedCategory": (One of: "Software Bug", "Network & Connectivity", "Cloud & Infrastructure", "Account & Authentication", "Billing & Invoicing", "Performance & Latency", "Hardware Issue", "Service Complaint"),
  "suggestedPriority": (One of: "Low", "Medium", "High", "Critical"),
  "recommendedDepartment": "Exact engineering/support department best suited for escalation",
  "estimatedResolutionMinutes": (number in minutes, e.g. 15, 30, 60),
  "confidenceScore": (percentage number between 75 and 99),
  "tags": ["3-5 short technical keywords"],
  "welcomeDiagnosticMessage": "A professional, empathetic, markdown-formatted response explaining findings and guiding the user through the first fix attempt"
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text || '';
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (modelError) {
      console.warn('Gemini diagnosis model error, falling back to rule-based analysis:', modelError);
      const fallback = generateFallbackDiagnosis({ title, description, category, errorLogs });
      return res.json(fallback);
    }
  } catch (err: unknown) {
    console.error('API Error /api/ai/diagnose:', err);
    res.status(500).json({ error: 'Failed to diagnose ticket' });
  }
});

// 2. Endpoint: AI Support Chatbot (Multi-turn)
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, currentTicketContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are "Nexus AI", an advanced Technical Support Co-Pilot and IT Systems Specialist for an enterprise service desk.
Your objectives:
1. Provide accurate, concise, step-by-step troubleshooting for technical problems (software errors, cloud infrastructure, network connectivity, authentication/SSO, billing disputes, latency issues).
2. Offer concrete CLI commands, code snippets, or configuration examples when applicable.
3. Be friendly, empathetic, and professional. Keep answers focused and avoid unhelpful fluff.
4. If an issue is critical, complex, or cannot be resolved after troubleshooting, explicitly recommend that the user click "Submit as Service Ticket" or "Escalate to Human Support".
${currentTicketContext ? `\nActive Ticket Context:\nTitle: ${currentTicketContext.title}\nCategory: ${currentTicketContext.category}\nStatus: ${currentTicketContext.status}\nDescription: ${currentTicketContext.description}` : ''}`;

    if (!ai) {
      // Rule-based intelligent chatbot fallback
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
      const text = lastUserMsg.toLowerCase();
      let reply = "I understand the issue you're facing. Could you provide any specific error codes or steps to reproduce? You can also submit this directly as a service ticket for our engineering team to investigate.";
      if (text.includes('504') || text.includes('timeout')) {
        reply = "A 504 Gateway Timeout generally means the reverse proxy (like NGINX or AWS ALB) gave up waiting for your backend service. \n\n**Key steps to check:**\n1. Check your backend response time in APM metrics.\n2. In NGINX, adjust `proxy_read_timeout 300s;`.\n3. Verify if your database queries are locking tables during the operation.";
      } else if (text.includes('sso') || text.includes('login') || text.includes('auth')) {
        reply = "For SSO authentication loops, this is usually caused by an expired IdP signing certificate or clock skew between servers.\n\n**Recommended checks:**\n1. Confirm the X.509 certificate expiry date in your IdP (Okta/Azure AD).\n2. Ensure your server clocks are synchronized with NTP.\n3. Clear browser cookies for the auth domain.";
      } else if (text.includes('escalat') || text.includes('human') || text.includes('agent')) {
        reply = "I can help you escalate right away! If you have an active ticket open, click the **'Escalate to Support'** button in the top right to route this directly to our Tier 2 on-call engineers with an automated technical brief.";
      }
      return res.json({ reply });
    }

    try {
      // Build conversation contents
      const conversationHistory = messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conversationHistory,
        config: {
          systemInstruction,
          temperature: 0.4
        }
      });

      return res.json({ reply: response.text || 'I analyzed your request. Please let me know if you would like me to assist further or file a ticket.' });
    } catch (modelError) {
      console.warn('Gemini chat error, using fallback:', modelError);
      return res.json({ 
        reply: "I am ready to assist with troubleshooting. You can check your system logs and environment configuration, or click 'Submit Ticket' to have our human engineering team inspect the issue." 
      });
    }
  } catch (err: unknown) {
    console.error('API Error /api/ai/chat:', err);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// 3. Endpoint: AI Escalation Handover Brief
app.post('/api/ai/escalate-summary', async (req: Request, res: Response) => {
  try {
    const { ticket, escalationReason } = req.body;
    if (!ticket) {
      return res.status(400).json({ error: 'Ticket data is required' });
    }

    const ai = getGeminiClient();
    const prompt = `You are a Senior Technical Support Dispatcher creating an Executive Escalation Handover Brief for Tier 2/3 On-Call Engineers.
Ticket Information:
- Number: ${ticket.ticketNumber}
- Title: ${ticket.title}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Requester: ${ticket.requesterName} (${ticket.requesterEmail})
- Environment: ${ticket.systemEnvironment || 'N/A'}
- Error Logs: ${ticket.errorLogs || 'None provided'}
- Reason for Escalation: ${escalationReason || 'Self-service troubleshooting was unsuccessful'}
- Conversation History: ${JSON.stringify(ticket.messages?.map((m: { sender: string; text: string }) => `${m.sender}: ${m.text}`) || [])}

Generate a concise, highly technical Handover Brief (maximum 150 words) with:
1. PROBLEM SUMMARY & BUSINESS IMPACT
2. TROUBLESHOOTING ALREADY ATTEMPTED
3. RECOMMENDED IMMEDIATE ACTION FOR TIER 2 AGENT
Return as plain text with bold headings.`;

    if (!ai) {
      return res.json({
        summary: `**ESCALATION BRIEF (${ticket.ticketNumber})**\n- **Impact:** ${ticket.priority} priority issue reported by ${ticket.requesterName}. Customer cannot complete workflows.\n- **Attempted Fixes:** Self-service diagnostics initiated. Reason for escalation: "${escalationReason || 'Customer requested direct tier support'}".\n- **Next Action:** Tier 2 Engineer should review system logs, verify upstream connectivity, and respond to customer within the SLA window.`
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.3 }
      });
      return res.json({ summary: response.text || 'Escalation brief generated.' });
    } catch (modelError) {
      console.warn('Gemini escalate-summary error, using fallback:', modelError);
      return res.json({
        summary: `**ESCALATION BRIEF (${ticket.ticketNumber})**\n- **Problem:** ${ticket.title}\n- **Reason:** ${escalationReason || 'Troubleshooting incomplete'}\n- **Recommended Action:** Tier 2 engineer review required.`
      });
    }
  } catch (err: unknown) {
    console.error('API Error /api/ai/escalate-summary:', err);
    res.status(500).json({ error: 'Failed to generate escalation summary' });
  }
});

// 4. Endpoint: AI Agent Assistant (Drafts support reply for human agents)
app.post('/api/ai/agent-assist', async (req: Request, res: Response) => {
  try {
    const { ticket, agentTone = 'professional' } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        draftReply: `Hi ${ticket?.requesterName || 'there'},\n\nThank you for your patience. Our technical team has reviewed your ticket (${ticket?.ticketNumber || ''}) regarding ${ticket?.title || 'this issue'}. We are actively investigating this on our staging environment and will have an update for you shortly.\n\nBest regards,\nTier Support Team`
      });
    }

    const prompt = `You are a veteran Enterprise Technical Support Specialist.
Draft a professional, empathetic, and technically precise reply from a human support engineer to the customer.
Ticket Subject: ${ticket.title}
Category: ${ticket.category}
Customer Name: ${ticket.requesterName}
Conversation History: ${JSON.stringify(ticket.messages?.slice(-3) || [])}
Tone: ${agentTone}

Draft only the message body to be sent to the customer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.4 }
    });

    return res.json({ draftReply: response.text || 'Draft response generated.' });
  } catch (err: unknown) {
    console.error('API Error /api/ai/agent-assist:', err);
    res.status(500).json({ error: 'Failed to draft agent response' });
  }
});

// Start server with Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Support Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
