import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Cpu, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  Building2, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { ServiceTicket } from '../types';
import { updateTicketStatus } from '../services/ticketService';

interface EscalationsViewProps {
  tickets: ServiceTicket[];
  onSelectTicket: (ticketId: string) => void;
  role: 'customer' | 'support_agent';
}

export const EscalationsView: React.FC<EscalationsViewProps> = ({
  tickets,
  onSelectTicket,
  role
}) => {
  // Filter tickets that are escalated or critical
  const escalatedTickets = tickets.filter(
    (t) => t.status === 'Escalated' || t.escalation?.isEscalated || (t.priority === 'Critical' && t.status !== 'Resolved')
  );

  const handleResolveTicket = async (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    try {
      await updateTicketStatus(ticketId, 'Resolved', 'Issue resolved by Tier 2 Engineering.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Tier 2 / Tier 3 Incident Escalation Desk
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                  {escalatedTickets.length} Active Incidents
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Prioritized queue for high-impact complaints, SLA-breach risks, and deep technical outages requiring senior engineering intervention.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Clock className="w-4 h-4 text-rose-500" />
            <span>Target Response: &lt; 1 Hour</span>
          </div>
        </div>
      </div>

      {/* Escalated Incidents List */}
      {escalatedTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No Active Escalations
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            All tier 2 tickets and urgent incidents are resolved or currently within normal Tier 1 triage. Great job!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {escalatedTickets.map((ticket) => {
            const isCritical = ticket.priority === 'Critical';
            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
                  isCritical ? 'border-rose-300 ring-1 ring-rose-200/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top Row: IDs, Priority, SLA */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      ticket.priority === 'Critical'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {ticket.priority} Priority
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {ticket.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <div className="flex items-center gap-1.5 text-rose-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>SLA Window: ~{ticket.escalation?.slaTargetHours || 4}h remaining</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">
                      Assigned to: <strong className="text-slate-800">{ticket.escalation?.assignedTeam || 'Platform Engineering'}</strong>
                    </span>
                  </div>
                </div>

                {/* Body: Title, Description, Root Cause */}
                <div className="py-3.5 space-y-2.5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {ticket.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                      {ticket.description}
                    </p>
                  </div>

                  {/* AI Handover Briefing / Diagnostics */}
                  {ticket.escalation?.aiHandoverSummary ? (
                    <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-1 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gemini AI Engineering Handover Dossier</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                        {ticket.escalation.aiHandoverSummary}
                      </p>
                    </div>
                  ) : ticket.aiAnalysis?.rootCauseHypothesis && (
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950">
                      <span className="font-bold">AI Root Cause Hypothesis: </span>
                      <span>{ticket.aiAnalysis.rootCauseHypothesis}</span>
                    </div>
                  )}

                  {/* System Environment & Requester */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div>
                      Requester: <span className="font-medium text-slate-800">{ticket.requesterName}</span> ({ticket.requesterEmail})
                    </div>
                    {ticket.systemEnvironment && (
                      <div>
                        Environment: <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{ticket.systemEnvironment}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Escalated: {ticket.escalation?.escalatedAt ? new Date(ticket.escalation.escalatedAt).toLocaleTimeString() : 'Recently'}
                  </div>

                  <div className="flex items-center gap-2">
                    {role === 'support_agent' && (
                      <button
                        type="button"
                        onClick={(e) => handleResolveTicket(e, ticket.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-indigo-600 transition-colors shadow-xs"
                    >
                      <span>Inspect Incident</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
