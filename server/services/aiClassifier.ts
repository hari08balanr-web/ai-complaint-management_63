import { GoogleGenAI, Type } from '@google/genai';

export interface ClassifyResult {
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  suggestedResponse: string;
  slaHours: number;
}

const VALID_CATEGORIES = [
  'Software Bug',
  'Network & Connectivity',
  'Cloud & Infrastructure',
  'Account & Authentication',
  'Billing & Invoicing',
  'Performance & Latency',
  'Hardware Issue',
  'Service Complaint'
] as const;

const VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

/**
 * Directly classifies a technical support ticket using Gemini 3.8 Flash.
 * Determines category, incident priority, SLA response window, and generates
 * an empathetic, actionable first diagnostic reply.
 */
export async function classifyTicketWithAI(
  title: string, 
  description: string, 
  category?: string
): Promise<ClassifyResult> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Analyze this technical support service request / complaint:
Title: ${title}
Description: ${description}
User-Selected Category: ${category || 'Unspecified'}

Perform the following:
1. Determine the accurate technical category from: Software Bug, Network & Connectivity, Cloud & Infrastructure, Account & Authentication, Billing & Invoicing, Performance & Latency, Hardware Issue, Service Complaint.
2. Determine incident priority level: Critical (system-wide outage / data loss / production blocker), High (major business disruption / security issue / severe performance degradation), Medium (standard bug / partial functional disruption / account issue), Low (minor defect / cosmetic / general inquiry).
3. Assign target SLA response hours: Critical = 1, High = 4, Medium = 24, Low = 48.
4. Generate a professional, empathetic, and actionable first response from the ResolveDesk AI Assistant directly to the user. Acknowledge their issue, explain the probable root cause or triage direction, and provide 1-3 immediate diagnostic checks they can verify while engineering reviews the incident.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are a Principal Technical Support Dispatcher and Incident Response Lead at ResolveDesk. Output strictly valid JSON conforming to the requested schema.',
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: 'Categorized incident domain'
              },
              priority: {
                type: Type.STRING,
                description: 'One of: Critical, High, Medium, Low'
              },
              slaHours: {
                type: Type.INTEGER,
                description: 'Target SLA deadline hours: 1, 4, 24, or 48'
              },
              suggestedResponse: {
                type: Type.STRING,
                description: 'Actionable, empathetic first technical response in Markdown'
              }
            },
            required: ['category', 'priority', 'slaHours', 'suggestedResponse']
          }
        }
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      const matchedCategory = VALID_CATEGORIES.find(
        (c) => c.toLowerCase() === (parsed.category || '').toLowerCase()
      ) || category || 'Software Bug';

      const pri = (VALID_PRIORITIES as readonly string[]).includes(parsed.priority) 
        ? (parsed.priority as 'Critical' | 'High' | 'Medium' | 'Low') 
        : 'Medium';

      const slaMap = { Critical: 1, High: 4, Medium: 24, Low: 48 };
      const sla = parsed.slaHours && [1, 4, 24, 48].includes(Number(parsed.slaHours))
        ? Number(parsed.slaHours)
        : slaMap[pri];

      console.log(`[AI Classifier] Gemini classified ticket "${title}" -> ${matchedCategory} (${pri}, SLA: ${sla}h)`);

      return {
        category: matchedCategory,
        priority: pri,
        suggestedResponse: parsed.suggestedResponse || `Thank you for contacting technical support regarding "${title}". We have logged your request.`,
        slaHours: sla
      };
    } catch (modelErr: any) {
      console.log('[AI Classifier] Gemini API notice (falling back to heuristic engine):', modelErr?.message || modelErr);
    }
  } else {
    console.log('[AI Classifier] GEMINI_API_KEY not configured or in standby. Using heuristic classification engine.');
  }

  // Graceful heuristic classifier fallback
  const text = `${title} ${description}`.toLowerCase();
  let detectedCategory = category || 'Software Bug';
  let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
  let slaHours = 24;

  if (text.includes('outage') || text.includes('down') || text.includes('critical') || text.includes('crash') || text.includes('504') || text.includes('fatal') || text.includes('unreachable')) {
    detectedCategory = 'Cloud & Infrastructure';
    priority = 'Critical';
    slaHours = 1;
  } else if (text.includes('sso') || text.includes('auth') || text.includes('login') || text.includes('security') || text.includes('token') || text.includes('saml') || text.includes('password')) {
    detectedCategory = 'Account & Authentication';
    priority = 'High';
    slaHours = 4;
  } else if (text.includes('billing') || text.includes('invoice') || text.includes('refund') || text.includes('charge') || text.includes('payment') || text.includes('credit card')) {
    detectedCategory = 'Billing & Invoicing';
    priority = 'Medium';
    slaHours = 24;
  } else if (text.includes('latency') || text.includes('slow') || text.includes('timeout') || text.includes('lag') || text.includes('loading')) {
    detectedCategory = 'Performance & Latency';
    priority = 'High';
    slaHours = 4;
  } else if (text.includes('network') || text.includes('vpn') || text.includes('dns') || text.includes('gateway') || text.includes('wifi')) {
    detectedCategory = 'Network & Connectivity';
    priority = 'High';
    slaHours = 4;
  } else if (text.includes('hardware') || text.includes('cable') || text.includes('port') || text.includes('device') || text.includes('server fan')) {
    detectedCategory = 'Hardware Issue';
    priority = 'Medium';
    slaHours = 24;
  }

  const suggestedResponse = `Hello, thank you for submitting your service request regarding "${title}".

Based on automated AI triage analysis, this issue has been categorized under **${detectedCategory}** with **${priority}** priority (Target SLA response window: within ${slaHours} hour${slaHours > 1 ? 's' : ''}).

**Immediate Diagnostic Checks:**
1. Our automated systems have logged this ticket and queued it for the on-duty engineering team.
2. If this is an intermittent issue, please provide reproduction steps, browser/system logs, or error codes directly in this thread.
3. If self-service diagnostic suggestions are not sufficient, your ticket will proceed to support engineering or automatic escalation.

Best regards,  
**ResolveDesk AI Assistant**`;

  return {
    category: detectedCategory,
    priority,
    suggestedResponse,
    slaHours
  };
}

/**
 * Directly generates an intelligent AI follow-up response for a ticket thread
 * using Gemini 3.8 Flash based on user question and conversation history.
 */
export async function generateAiThreadReply(
  ticket: {
    ticketId: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    messages: Array<{ sender: string; text: string; isAi: boolean }>;
  },
  userLatestMessage: string
): Promise<string> {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const historyContext = ticket.messages
        .slice(-6)
        .map((m) => `${m.sender} (${m.isAi ? 'AI Support' : 'User'}): ${m.text}`)
        .join('\n\n');

      const prompt = `You are the ResolveDesk Technical Support AI Assistant.
The user is asking for assistance or updating details on Ticket #${ticket.ticketId}:
- Title: ${ticket.title}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Original Description: ${ticket.description}

Recent Discussion History:
${historyContext}

User's Latest Update / Question:
"${userLatestMessage}"

Provide a concise, helpful, and technically accurate troubleshooting response. 
- Acknowledge what the user said
- Give direct concrete next steps, command line checks, or configuration advice if applicable
- Offer clear instructions on what logs or outputs to collect if further diagnosis is needed
- Keep the tone polite, professional, and reassuring.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are ResolveDesk AI Assistant, a tier-2 technical support engineer. Provide helpful, formatted markdown responses.',
          temperature: 0.3
        }
      });

      if (response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.log('[AI Thread Reply] Gemini generation notice:', err?.message || err);
    }
  }

  // Graceful fallback response if Gemini is unavailable
  return `Thank you for the update regarding Ticket #${ticket.ticketId}.

Our technical support team has received your message:
> "${userLatestMessage.length > 80 ? userLatestMessage.slice(0, 80) + '...' : userLatestMessage}"

**Next Steps:**
- Your additional notes have been attached to the incident timeline.
- An engineer will review this update against the **${ticket.priority}** priority SLA window.
- If this issue is blocking critical production workloads, you may use the **Escalate Ticket** button in the header to request immediate on-call intervention.`;
}
