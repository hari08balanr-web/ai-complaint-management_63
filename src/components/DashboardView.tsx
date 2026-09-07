import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Cpu, 
  Sparkles, 
  ShieldAlert, 
  ArrowUpRight, 
  FileText, 
  Flame, 
  Layers, 
  Search, 
  ChevronRight,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Bot
} from 'lucide-react';
import { ServiceTicket, ActiveView } from '../types';

interface DashboardViewProps {
  tickets: ServiceTicket[];
  onSelectTicket: (ticketId: string) => void;
  setActiveView: (view: ActiveView) => void;
  onOpenNewTicket: () => void;
  role: 'customer' | 'support_agent';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  onSelectTicket,
  setActiveView,
  onOpenNewTicket,
  role
}) => {
  const total = tickets.length;
  const openCount = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress' || t.status === 'AI Diagnostics').length;
  const escalatedCount = tickets.filter(t => t.status === 'Escalated' || t.escalation?.isEscalated).length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  tickets.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const categoriesSorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  // Urgent tickets
  const urgentTickets = tickets.filter(
    t => (t.priority === 'Critical' || t.status === 'Escalated' || t.escalation?.isEscalated) && t.status !== 'Resolved'
  );

  // Recent tickets
  const recentTickets = [...tickets].slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner with Greeting & Operational Status */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 2.5 Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              IT Operations & Incident Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Real-time telemetry, automated Gemini root-cause diagnosis, SLA monitoring, and seamless Tier 2 engineering escalations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('chat')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 hover:text-white border border-slate-700 transition-colors shadow-xs"
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>AI Troubleshooter</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewTicket}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Service Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Total Volume */}
        <div 
          onClick={() => setActiveView('tickets')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Volume</span>
            <Layers className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{total}</span>
            <span className="text-[11px] font-semibold text-slate-500">tickets</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-1">
            <span>Overall lifecycle count</span>
          </p>
        </div>

        {/* Active Open */}
        <div 
          onClick={() => setActiveView('tickets')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Queue</span>
            <Clock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{openCount}</span>
            <span className="text-[11px] font-semibold text-blue-500">unresolved</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">
            {inProgressCount} in active triage
          </p>
        </div>

        {/* Tier 2 Escalated */}
        <div 
          onClick={() => setActiveView('escalations')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-rose-200 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier 2 Escalations</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{escalatedCount}</span>
            <span className="text-[11px] font-semibold text-rose-500">urgent</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">
            {criticalCount} critical severity
          </p>
        </div>

        {/* SLA Compliance */}
        <div 
          onClick={() => setActiveView('complaints')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">97.8%</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">
            Target SLA &lt; 4h response
          </p>
        </div>

        {/* AI Diagnostics Time */}
        <div 
          onClick={() => setActiveView('diagnostics')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-indigo-200 hover:shadow-xs transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg AI Triage</span>
            <Cpu className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">2.1s</span>
            <span className="text-[11px] font-semibold text-indigo-500">hypotheses</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 font-medium">
            Automated root-cause scoring
          </p>
        </div>

      </div>

      {/* Critical Attention Banner (If critical/escalated exist) */}
      {urgentTickets.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5 sm:mt-0">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                  <span>{urgentTickets.length} High-Impact Incidents Require Immediate Attention</span>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800">
                    SLA Priority
                  </span>
                </h3>
                <p className="text-xs text-rose-800/90 mt-0.5">
                  Critical infrastructure or escalated service complaints with ongoing customer disruption.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('escalations')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors self-start sm:self-auto shrink-0 shadow-xs"
            >
              <span>View Escalation Desk</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Category Matrix + Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Recent Ticket Stream */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Live Incident & Service Request Stream
              </h2>
              <p className="text-xs text-slate-500">
                Latest submissions with Gemini diagnostic ratings and operational status
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('tickets')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All ({tickets.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {recentTickets.map((ticket) => {
              const isUrgent = ticket.priority === 'Critical' || ticket.status === 'Escalated';
              return (
                <div
                  key={ticket.id}
                  onClick={() => {
                    onSelectTicket(ticket.id);
                    setActiveView('tickets');
                  }}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        ticket.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                        ticket.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500 truncate">
                        {ticket.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {ticket.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {ticket.aiAnalysis?.summary || ticket.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                      ticket.status === 'Escalated' ? 'bg-rose-100 text-rose-700 font-extrabold' :
                      ticket.status === 'AI Diagnostics' ? 'bg-indigo-100 text-indigo-700' :
                      ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div
              onClick={() => setActiveView('diagnostics')}
              className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 hover:border-indigo-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Live AI Diagnostic Sandbox</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Paste raw error logs & get root-cause triage</p>
            </div>

            <div
              onClick={() => setActiveView('chat')}
              className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2">
                <Bot className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Interactive Troubleshooter</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Multi-turn AI guidance with 1-click ticket filing</p>
            </div>

            <div
              onClick={() => setActiveView('knowledge')}
              className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100 hover:border-amber-200 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Runbooks & Solutions</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified engineering playbooks & runbooks</p>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Category Distribution & AI Telemetry Stats */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Category Distribution Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Ticket Distribution by Category
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {total} total items
              </span>
            </div>

            <div className="space-y-3">
              {categoriesSorted.map(([category, count]) => {
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate">{category}</span>
                      <span className="font-bold text-slate-900">{count} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Diagnostic Accuracy & Triage Insights */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                AI Diagnostic Telemetry
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500">Root-Cause Confidence</p>
                <p className="text-xl font-black text-slate-900 mt-1">93.4%</p>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">High precision triage</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500">Auto-Resolution Rate</p>
                <p className="text-xl font-black text-slate-900 mt-1">42.8%</p>
                <p className="text-[10px] text-indigo-600 font-medium mt-0.5">First-contact self-service</p>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs space-y-1.5 text-indigo-950">
              <p className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Adaptive Triage Routing Active
              </p>
              <p className="text-indigo-800 text-[11px] leading-relaxed">
                Incoming tickets are parsed using Gemini 2.5 flash. Infras and network timeouts automatically provision Tier 2 escalation briefs with suggested bash commands.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
