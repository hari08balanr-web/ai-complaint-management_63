import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles,
  Layers
} from 'lucide-react';
import { ServiceTicket } from '../types';

interface AnalyticsBarProps {
  tickets: ServiceTicket[];
}

export const AnalyticsBar: React.FC<AnalyticsBarProps> = ({ tickets }) => {
  const total = tickets.length;
  const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const escalated = tickets.filter(t => t.status === 'Escalated' || t.escalation?.isEscalated).length;
  const inDiagnostics = tickets.filter(t => t.status === 'AI Diagnostics' || t.status === 'New').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
  
  const aiResolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      
      {/* 1. Total Active Cases */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Tickets
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{total}</span>
            <span className="text-xs text-slate-500 font-medium">({total - resolved} active)</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      {/* 2. AI Diagnostics & Resolution */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Auto-Triage
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">100%</span>
            <span className="text-xs text-indigo-500 font-medium">instant scan</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Escalations to Support Team */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">
            Tier 2 Escalations
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{escalated}</span>
            {criticalCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                {criticalCount} Critical
              </span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Resolved Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-1">
            Resolution Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{aiResolvedRate}%</span>
            <span className="text-xs text-emerald-600 font-medium">{resolved} closed</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

    </div>
  );
};
