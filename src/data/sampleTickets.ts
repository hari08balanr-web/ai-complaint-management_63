import { ServiceTicket } from '../types';

export const INITIAL_TICKETS: ServiceTicket[] = [
  {
    id: 'ticket-1042',
    ticketNumber: 'SR-1042',
    title: '504 Gateway Timeout during batch CSV ingestion pipeline',
    description: 'Our daily automated CSV import for enterprise transactions is failing with 504 Gateway Timeout after 60 seconds. This is blocking invoice generation for 45 customers.',
    category: 'Cloud & Infrastructure',
    priority: 'Critical',
    status: 'In Progress',
    requesterId: 'user-enterprise-1',
    requesterName: 'Alex Rivera',
    requesterEmail: 'alex.rivera@fintechcorp.io',
    systemEnvironment: 'Kubernetes EKS v1.28, NGINX Ingress Controller, Node.js v20',
    errorLogs: 'upstream timed out (110: Connection timed out) while reading response header from upstream, client: 10.0.4.21, request: "POST /api/v2/ingest/batch HTTP/1.1"',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    aiAnalysis: {
      summary: 'NGINX ingress proxy timeout caused by synchronous execution of large batch uploads exceeding default 60s timeout.',
      rootCauseHypothesis: 'Client request payload is processed synchronously on Express API thread instead of pushing to an asynchronous worker queue (Redis/BullMQ) with HTTP 202 Accepted response.',
      suggestedFixSteps: [
        'Temporarily increase proxy-read-timeout annotation on Kubernetes ingress to 300s.',
        'Refactor ingestion endpoint to return HTTP 202 with a job ID and dispatch processing to background worker.',
        'Verify database connection pool size is not exhausted under batch insert load.'
      ],
      severityScore: 9,
      detectedCategory: 'Cloud & Infrastructure',
      suggestedPriority: 'Critical',
      recommendedDepartment: 'Tier 2 Cloud Infrastructure & API Architecture',
      estimatedResolutionMinutes: 45,
      confidenceScore: 94,
      tags: ['NGINX', '504-Timeout', 'Batch-Ingestion', 'Kubernetes']
    },
    escalation: {
      isEscalated: true,
      escalatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      escalatedBy: 'Alex Rivera',
      escalationReason: 'Automated AI self-service instructions required cluster ingress annotation changes and customer billing deadline is within 2 hours.',
      assignedTeam: 'Tier 2 Cloud Infrastructure',
      assignedAgent: 'DevOps Lead (Sarah Jenkins)',
      aiHandoverSummary: 'CRITICAL ESCALATION: 45 enterprise accounts blocked. Alex Rivera attempted client-side chunking but Ingress 60s timeout aborts transaction. Automated analysis recommends increasing proxy_read_timeout to 300s while migrating pipeline to async BullMQ.',
      slaTargetHours: 2,
      internalNotes: ['Sarah Jenkins acknowledged ticket at 10:15 AM. Temporary ingress config patch deployed to staging.']
    },
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        senderName: 'Alex Rivera',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        text: 'Our daily automated CSV import for enterprise transactions is failing with 504 Gateway Timeout after 60 seconds.'
      },
      {
        id: 'msg-2',
        sender: 'ai',
        senderName: 'Gemini Support Co-Pilot',
        timestamp: new Date(Date.now() - 3600000 * 4.9).toISOString(),
        text: '### Initial Diagnostic Report\n\nI have analyzed your request and server logs. The error indicates that NGINX timed out waiting for upstream response.\n\n**Immediate Workaround:**\n1. Add `nginx.ingress.kubernetes.io/proxy-read-timeout: "300"` to your Ingress YAML.\n2. In the meantime, break CSV files into batches of under 500 records.\n\nWould you like me to prepare an escalation to the Cloud Infrastructure team if you cannot modify ingress annotations?'
      },
      {
        id: 'msg-3',
        sender: 'user',
        senderName: 'Alex Rivera',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        text: 'We do not have direct access to alter the production Kubernetes ingress annotations. I need to escalate this to Tier 2 support urgently.'
      },
      {
        id: 'msg-4',
        sender: 'agent',
        senderName: 'Sarah Jenkins (DevOps Lead)',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        text: 'Hi Alex, I have received the AI handover brief. I am bumping the ingress proxy timeout to 300s on the production gateway right now. Please retry the upload in 5 minutes.'
      }
    ]
  },
  {
    id: 'ticket-1043',
    ticketNumber: 'SR-1043',
    title: 'SAML SSO login loop for Okta identity provider',
    description: 'Employees in our marketing organization cannot log into the dashboard using Okta SSO. It continuously redirects back to the login page with error state "invalid_signature".',
    category: 'Account & Authentication',
    priority: 'High',
    status: 'AI Diagnostics',
    requesterId: 'user-marketing-2',
    requesterName: 'Elena Rostova',
    requesterEmail: 'e.rostova@techsolutions.org',
    systemEnvironment: 'Okta Identity Cloud, SAML 2.0, Web Application',
    errorLogs: 'SAMLResponse validation error: Signature verification failed using configured X.509 certificate. Expired on 2026-09-06T23:59:59Z.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    aiAnalysis: {
      summary: 'SAML signing certificate expired on 2026-09-06 causing signature verification failure during Okta assertion validation.',
      rootCauseHypothesis: 'The IdP metadata public key stored in the application SSO configuration expired yesterday and has not been updated with Okta\'s newly rotated certificate.',
      suggestedFixSteps: [
        'Log into Okta Admin Console -> Applications -> SAML App -> Sign On tab.',
        'Download the latest active X.509 signing certificate.',
        'Navigate to Organization Settings -> SSO Configuration in our dashboard and paste the new certificate string.',
        'Click "Verify & Save SSO Configuration".'
      ],
      severityScore: 8,
      detectedCategory: 'Account & Authentication',
      suggestedPriority: 'High',
      recommendedDepartment: 'Security & Identity Access Management (IAM)',
      estimatedResolutionMinutes: 15,
      confidenceScore: 98,
      tags: ['SAML', 'SSO', 'Okta', 'Certificate-Expired']
    },
    escalation: {
      isEscalated: false,
      internalNotes: []
    },
    messages: [
      {
        id: 'msg-sso-1',
        sender: 'user',
        senderName: 'Elena Rostova',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        text: 'Employees in our marketing organization cannot log into the dashboard using Okta SSO. Error says invalid_signature.'
      },
      {
        id: 'msg-sso-2',
        sender: 'ai',
        senderName: 'Gemini Support Co-Pilot',
        timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString(),
        text: '### Resolution Found: Certificate Expiration\n\nYour error log confirms: `Signature verification failed using configured X.509 certificate. Expired on 2026-09-06T23:59:59Z`.\n\nTo resolve this immediately without waiting for human tier support:\n1. Your Okta administrator can download the current certificate from Okta Admin Console.\n2. Paste the updated certificate into **Account Settings > SSO**.\n\n*If you are not an administrator with certificate update permissions, click "Escalate to Support" below.*',
        isSolutionProposal: true
      }
    ]
  },
  {
    id: 'ticket-1044',
    ticketNumber: 'SR-1044',
    title: 'Duplicate charge on monthly Pro subscription invoice #INV-8821',
    description: 'We were billed twice ($49.00 x 2) on September 1st on our corporate credit card. Please void the duplicate charge and issue a credit memo.',
    category: 'Billing & Invoicing',
    priority: 'Medium',
    status: 'Resolved',
    requesterId: 'user-billing-3',
    requesterName: 'Marcus Vance',
    requesterEmail: 'marcus@vancedesign.co',
    systemEnvironment: 'Stripe Billing, VISA card ending in 4092',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    aiAnalysis: {
      summary: 'Customer experienced an unintended double charge webhook event for Invoice #INV-8821.',
      rootCauseHypothesis: 'Retry mechanism on webhook payment_intent.succeeded triggered two invoice finalize operations within 15 seconds.',
      suggestedFixSteps: [
        'Verify Stripe charge IDs ch_3P... and ch_3Q... linked to customer cus_8921.',
        'Issue partial refund for charge #2 with reason: "duplicate".',
        'Email confirmation receipt with updated zero-balance ledger statement.'
      ],
      severityScore: 5,
      detectedCategory: 'Billing & Invoicing',
      suggestedPriority: 'Medium',
      recommendedDepartment: 'Finance & Billing Operations',
      estimatedResolutionMinutes: 10,
      confidenceScore: 96,
      tags: ['Billing', 'Refund', 'Duplicate-Invoice', 'Stripe']
    },
    escalation: {
      isEscalated: false,
      assignedAgent: 'Finance Ops (David Chen)',
      slaTargetHours: 24,
      internalNotes: ['Refund issued via Stripe transaction ref re_3P88921102. Confirmed with customer.']
    },
    messages: [
      {
        id: 'msg-bill-1',
        sender: 'user',
        senderName: 'Marcus Vance',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        text: 'We were billed twice ($49.00 x 2) on September 1st on our corporate credit card for invoice #INV-8821.'
      },
      {
        id: 'msg-bill-2',
        sender: 'ai',
        senderName: 'Gemini Support Co-Pilot',
        timestamp: new Date(Date.now() - 3600000 * 23.8).toISOString(),
        text: 'I have logged this billing complaint under priority Medium and flagged invoice #INV-8821 for Finance verification. Automated verification has identified the duplicate payment intent.'
      },
      {
        id: 'msg-bill-3',
        sender: 'agent',
        senderName: 'David Chen (Billing Specialist)',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        text: 'Hi Marcus, the duplicate charge of $49.00 has been refunded to your card ending in 4092. You will see it credited in 2-3 business days.'
      },
      {
        id: 'msg-bill-4',
        sender: 'user',
        senderName: 'Marcus Vance',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        text: 'Thank you David, I see the refund confirmation email now. Issue resolved!'
      }
    ]
  }
];
