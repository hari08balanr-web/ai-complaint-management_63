import React from 'react';
import { AppUser, ActiveNavTab, Ticket } from '../types';
import { 
  PlusCircle, 
  Inbox, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  Users, 
  BookOpen, 
  Clock,
  Layers
} from 'lucide-react';

interface SidebarProps {
  currentUser: AppUser | null;
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenNewTicket: () => void;
  tickets: Ticket[];
  selectedStatusFilter: string | null;
  onSelectStatusFilter: (status: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onOpenNewTicket,
  tickets,
  selectedStatusFilter,
  onSelectStatusFilter
}) => {
  const role = currentUser?.role || 'user';

  // Compute status counts
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const escalatedCount = tickets.filter(t => t.status === 'Escalated').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  const assignedToMeCount = currentUser 
    ? tickets.filter(t => t.assignedAgentId === currentUser.uid && t.status !== 'Resolved' && t.status !== 'Closed').length 
    : 0;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Primary Action Button */}
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onOpenNewTicket}
          id="sidebar-new-ticket-btn"
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Main Views */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {role === 'admin' ? 'Administration' : role === 'agent' ? 'Support Desk' : 'Service Portal'}
          </div>

          <nav className="space-y-1">
            {/* User View */}
            {role === 'user' && (
              <>
                <button
                  onClick={() => { onSelectTab('tickets'); onSelectStatusFilter(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'tickets' && !selectedStatusFilter
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4 text-blue-400" />
                    <span>My Tickets</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
                    {tickets.length}
                  </span>
                </button>
              </>
            )}

            {/* Agent Views */}
            {role === 'agent' && (
              <>
                <button
                  onClick={() => { onSelectTab('queue'); onSelectStatusFilter(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'queue' && !selectedStatusFilter
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>All Open Queue</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-900/60 text-blue-300">
                    {openCount + inProgressCount + escalatedCount}
                  </span>
                </button>

                <button
                  onClick={() => { onSelectTab('tickets'); onSelectStatusFilter('assigned-me'); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                    selectedStatusFilter === 'assigned-me'
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Assigned to Me</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
                    {assignedToMeCount}
                  </span>
                </button>
              </>
            )}

            {/* Admin Views */}
            {role === 'admin' && (
              <>
                <button
                  onClick={() => { onSelectTab('tickets'); onSelectStatusFilter(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'tickets' && !selectedStatusFilter
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4 text-blue-400" />
                    <span>All Enterprise Tickets</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300">
                    {tickets.length}
                  </span>
                </button>

                <button
                  onClick={() => onSelectTab('agents')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'agents'
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Agent Management</span>
                </button>

                <button
                  onClick={() => onSelectTab('analytics')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    activeTab === 'analytics'
                      ? 'bg-slate-800 text-white font-semibold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>SLA & Escalations</span>
                </button>
              </>
            )}

            {/* FAQ / Knowledge Guide */}
            <button
              onClick={() => onSelectTab('faq')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'faq'
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>SLA & Escalation Policy</span>
            </button>
          </nav>
        </div>

        {/* Live Filter Section */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quick Status Filters
          </div>
          <div className="space-y-1">
            <button
              onClick={() => { onSelectTab('tickets'); onSelectStatusFilter('Open'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedStatusFilter === 'Open' ? 'bg-blue-900/50 text-blue-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Open / New</span>
              </div>
              <span>{openCount}</span>
            </button>

            <button
              onClick={() => { onSelectTab('tickets'); onSelectStatusFilter('In Progress'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedStatusFilter === 'In Progress' ? 'bg-amber-900/50 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>In Progress</span>
              </div>
              <span>{inProgressCount}</span>
            </button>

            <button
              onClick={() => { onSelectTab('tickets'); onSelectStatusFilter('Escalated'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedStatusFilter === 'Escalated' ? 'bg-rose-900/50 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Escalated (Tier 1-3)</span>
              </div>
              <span className="font-bold text-rose-400">{escalatedCount}</span>
            </button>

            <button
              onClick={() => { onSelectTab('tickets'); onSelectStatusFilter('Resolved'); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedStatusFilter === 'Resolved' ? 'bg-emerald-900/50 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>Resolved & Closed</span>
              </div>
              <span>{resolvedCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer SLA Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span>SLA Auto-Checker: Active (Every 30s)</span>
      </div>
    </aside>
  );
};
