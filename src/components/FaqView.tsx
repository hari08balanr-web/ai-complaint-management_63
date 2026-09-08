import React from 'react';
import { Clock, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const FaqView: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            SLA Policies & Escalation Architecture
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational standards for the ResolveDesk AI Autonomous Technical Support System
          </p>
        </div>

        {/* SLA Matrix Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Service Level Agreement (SLA) Matrix</h2>
          </div>
          <p className="text-xs text-slate-600">
            Tickets submitted are parsed by the Gemini 3.8 Flash LLM to classify severity and set hard SLA deadlines:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Critical Priority</span>
              <div className="text-2xl font-extrabold text-rose-800">1 Hour SLA</div>
              <p className="text-[11px] text-rose-700">
                Production outage, data loss risk, security incident, catastrophic service failure.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">High Priority</span>
              <div className="text-2xl font-extrabold text-amber-900">4 Hours SLA</div>
              <p className="text-[11px] text-amber-800">
                Major workflow blocked, SSO/auth degradation, high latency affecting transactions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Medium Priority</span>
              <div className="text-2xl font-extrabold text-blue-900">24 Hours SLA</div>
              <p className="text-[11px] text-blue-700">
                Non-blocking bug, billing dispute, standard configuration or integration question.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Low Priority</span>
              <div className="text-2xl font-extrabold text-slate-800">48 Hours SLA</div>
              <p className="text-[11px] text-slate-600">
                Cosmetic issue, feature feedback, general knowledge or product inquiry.
              </p>
            </div>
          </div>
        </div>

        {/* Escalation Tiers */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Support Tiers & Escalation Pathway</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                T0
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Tier 0 — Gemini AI Co-Pilot (Instant)</h3>
                <p className="text-slate-600 mt-0.5">
                  Automated triage on submission: categorizes issue, computes SLA deadline, and drafts an initial diagnostic response directly into the ticket thread within seconds.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                T1
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Tier 1 — Support Engineer Response</h3>
                <p className="text-slate-600 mt-0.5">
                  Frontline human technical support responds, conducts manual troubleshooting, requests diagnostic logs, or verifies customer environment.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                T2
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Tier 2 — Senior Systems & Cloud Engineering</h3>
                <p className="text-slate-600 mt-0.5">
                  Triggered if the ticket reaches SLA deadline or is manually escalated. Routes to specialized backend, DevOps, or database specialists.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
                T3
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Tier 3 — Principal Architect & Incident Commander</h3>
                <p className="text-slate-600 mt-0.5">
                  Maximum severity escalation. Direct engineering review with automated audit logging in Firestore for post-mortem compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
