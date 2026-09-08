import React, { useState } from 'react';
import { Ticket, TicketStatus } from '../types';
import { 
  PlusCircle, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  ChevronRight,
  Filter
} from 'lucide-react';

interface UserDashboardProps {
  tickets: Ticket[];
  onSelectTicket: (ticketId: string) => void;
  onOpenNewTicket: () => void;
  selectedStatusFilter: string | null;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  tickets,
  onSelectTicket,
  onOpenNewTicket,
  selectedStatusFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    // Status filter from sidebar if set
    if (selectedStatusFilter && t.status !== selectedStatusFilter) {
      return false;
    }

    // Tab filter
    if (activeTab === 'open' && t.status !== 'Open') return false;
    if (activeTab === 'in-progress' && t.status !== 'In Progress' && t.status !== 'Escalated') return false;
    if (activeTab === 'resolved' && t.status !== 'Resolved' && t.status !== 'Closed') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ticketId.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Support Tickets
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track real-time status, AI triage diagnostics, and engineer responses
          </p>
        </div>
        <button
          onClick={onOpenNewTicket}
          id="user-dash-create-btn"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'open' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Open ({tickets.filter(t => t.status === 'Open').length})
          </button>
          <button
            onClick={() => setActiveTab('in-progress')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'in-progress' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active ({tickets.filter(t => t.status === 'In Progress' || t.status === 'Escalated').length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'resolved' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Resolved ({tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID or title..."
            className="w-full px-3.5 py-1.5 pl-9 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No support tickets found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No tickets matched your search criteria.'
                : 'You have no open complaints or support requests. Need assistance with software or infrastructure?'}
            </p>
            {!searchQuery && (
              <button
                onClick={onOpenNewTicket}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition shadow-xs inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Your First Ticket</span>
              </button>
            )}
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const now = Date.now();
            const isBreached = (ticket.status === 'Open' || ticket.status === 'In Progress' || ticket.status === 'Escalated') && ticket.slaDeadline < now;

            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {ticket.ticketId}
                    </span>

                    {/* Status Pill */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                      ticket.status === 'Escalated' ? 'bg-rose-100 text-rose-800 font-bold' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ticket.status}
                    </span>

                    {/* Priority Pill */}
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      ticket.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      ticket.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}>
                      {ticket.priority}
                    </span>

                    <span className="text-xs text-slate-500 font-medium">
                      {ticket.category}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {ticket.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {ticket.description}
                  </p>
                </div>

                {/* Right Metadata */}
                <div className="flex items-center gap-4 sm:text-right shrink-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className={`w-3.5 h-3.5 ${isBreached ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span className={isBreached ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        {isBreached ? 'SLA Breached' : `Target: ${new Date(ticket.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
