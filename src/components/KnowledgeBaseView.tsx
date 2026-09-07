import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  FileCode, 
  ShieldCheck, 
  Layers,
  Bot
} from 'lucide-react';
import { ActiveView } from '../types';

interface KnowledgeBaseViewProps {
  setActiveView: (view: ActiveView) => void;
  onOpenNewTicketWithData?: (data: { title?: string; description?: string }) => void;
}

interface RunbookArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  symptoms: string[];
  verificationCommand?: string;
  steps: string[];
  targetTeam: string;
}

const RUNBOOKS: RunbookArticle[] = [
  {
    id: 'rb-504',
    title: 'Resolving NGINX Ingress 504 Gateway Timeout',
    category: 'Cloud & Infrastructure',
    summary: 'Occurs when upstream services (e.g. Node or Python backends) fail to respond within the default 60s proxy timeout window.',
    symptoms: [
      'HTTP 504 Gateway Timeout error page displayed to web clients',
      'Ingress controller error logs: "110: Connection timed out while reading response header from upstream"'
    ],
    verificationCommand: 'kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=100 | grep -i "timed out"',
    steps: [
      'Inspect upstream pod CPU/memory utilization using `kubectl top pods -n prod`.',
      'Check for slow database queries holding upstream HTTP threads locked.',
      'If legitimate long-polling or file export is expected, adjust ingress annotation `nginx.ingress.kubernetes.io/proxy-read-timeout: "180"`.'
    ],
    targetTeam: 'Cloud Operations'
  },
  {
    id: 'rb-saml',
    title: 'Okta / Azure AD SAML SSO "Invalid Signature" & Expired Certs',
    category: 'Account & Authentication',
    summary: 'Caused by certificate rotation mismatch between Identity Provider (IdP) metadata and the Service Provider (SP) trust store.',
    symptoms: [
      'Users redirected back to login screen with error `SAMLResponse: signature validation failed`',
      'Audit log code: `AUTH_SAML_INVALID_KEY_CREDENTIAL`'
    ],
    verificationCommand: 'openssl x509 -in /etc/ssl/idp_cert.pem -text -noout | grep "Not After"',
    steps: [
      'Log into the Okta/Azure Admin console and verify the X.509 signing certificate expiry date.',
      'Download updated IdP metadata XML.',
      'Re-upload the new public signing certificate into Nexus Identity Configuration.',
      'Trigger a test SSO cycle in an incognito window.'
    ],
    targetTeam: 'SecOps & IAM'
  },
  {
    id: 'rb-pgpool',
    title: 'PostgreSQL Connection Pool Exhaustion (FATAL: Remaining slots reserved)',
    category: 'Performance & Latency',
    summary: 'Occurs when microservices open orphaned database connections without releasing them back to PgBouncer or the internal connection pool.',
    symptoms: [
      'Backend logs show: `timeout exceeded when attempting to acquire client from pool`',
      'Spike in database connections reaching `max_connections` limit'
    ],
    verificationCommand: `psql -c "SELECT pid, usename, state, query_start, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start ASC LIMIT 10;"`,
    steps: [
      'Terminate long-running unindexed transactions using `SELECT pg_terminate_backend(pid)`.',
      'Inspect application connection pool configurations (`pool.max` and `idleTimeoutMillis`).',
      'Ensure PgBouncer transaction pooling mode (`pool_mode = transaction`) is active.'
    ],
    targetTeam: 'Database Infrastructure'
  },
  {
    id: 'rb-stripe',
    title: 'Stripe Webhook Signature Verification Failures & Duplicate Billing',
    category: 'Billing & Invoicing',
    summary: 'Occurs when the webhook signing secret is rotated or raw request body is parsed by express.json() before signature verification.',
    symptoms: [
      'Stripe dashboard displays webhook delivery failure with HTTP 400',
      'Customer charges succeed but user account entitlements fail to unlock'
    ],
    verificationCommand: 'curl -s https://api.nexusops.internal/api/health | jq .billingWebhookStatus',
    steps: [
      'Confirm endpoint accepts raw buffer bytes before standard JSON body parsers are mounted.',
      'Verify `STRIPE_WEBHOOK_SECRET` in environment variables matches endpoint webhook key.',
      'Resend failed events from the Stripe developer event log once verified.'
    ],
    targetTeam: 'Billing Engineering'
  }
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  setActiveView,
  onOpenNewTicketWithData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const categories = ['All', 'Cloud & Infrastructure', 'Account & Authentication', 'Performance & Latency', 'Billing & Invoicing'];

  const filteredRunbooks = RUNBOOKS.filter((rb) => {
    const matchesSearch = 
      rb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rb.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rb.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || rb.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Engineering Runbooks & Troubleshooting Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Verified incident resolution playbooks, debugging terminal commands, and self-service runbooks for common technical failures.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('chat')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs self-start sm:self-auto shrink-0"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>Ask AI Troubleshooter</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search runbooks by keyword, error code, or system..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Runbooks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredRunbooks.map((rb) => (
          <div
            key={rb.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {rb.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {rb.targetTeam}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {rb.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {rb.summary}
                </p>
              </div>

              {/* Symptoms */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Key Symptoms:
                </p>
                <ul className="space-y-1">
                  {rb.symptoms.map((sym, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{sym}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Verification Command */}
              {rb.verificationCommand && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase">
                    <span>Diagnosis Command</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(rb.id, rb.verificationCommand!)}
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
                    >
                      {copiedCmd === rb.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                    {rb.verificationCommand}
                  </pre>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Resolution Runbook:
                </p>
                <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-700">
                  {rb.steps.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveView('chat')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test in AI Chat</span>
              </button>

              {onOpenNewTicketWithData && (
                <button
                  type="button"
                  onClick={() => onOpenNewTicketWithData({
                    title: `Escalation: ${rb.title}`,
                    description: `Issue matches runbook ${rb.id}. Steps attempted, requires senior engineering intervention.`
                  })}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  File Ticket with Context
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
