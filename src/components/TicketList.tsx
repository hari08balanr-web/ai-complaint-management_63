import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Sparkles, 
  User, 
  MessageSquare, 
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { ServiceTicket, TicketStatus, TicketPriority, TicketCategory } from '../types';

interface TicketListProps {
  tickets: ServiceTicket[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: ServiceTicket) => void;
  role: 'customer' | 'support_agent';
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  role
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = ticket.title.toLowerCase().includes(query);
        const matchesNumber = ticket.ticketNumber.toLowerCase().includes(query);
        const matchesDesc = ticket.description.toLowerCase().includes(query);
        const matchesRequester = ticket.requesterName.toLowerCase().includes(query);
        const matchesTag = ticket.aiAnalysis?.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesNumber && !matchesDesc && !matchesRequester && !matchesTag) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL') {
        if (ticket.status !== statusFilter) return false;
      }

      // Category
      if (categoryFilter !== 'ALL') {
        if (ticket.category !== categoryFilter) return false;
      }

      // Priority
      if (priorityFilter !== 'ALL') {
        if (ticket.priority !== priorityFilter) return false;
      }

      return true;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter, priorityFilter]);

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: TicketStatus, isEscalated: boolean) => {
    if (isEscalated || status === 'Escalated') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5" />
          Escalated to Tier 2
        </span>
      );
    }
    switch (status) {
      case 'AI Diagnostics':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            AI Diagnostics
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      
      {/* Top Filter & Search Controls */}
      <div className="p-4 border-b border-slate-200/80 space-y-3">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="ticket-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by ID, title, keyword, or requester..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Quick Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {(['ALL', 'AI Diagnostics', 'In Progress', 'Escalated', 'Resolved'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st === 'ALL' ? 'All Tickets' : st}
            </button>
          ))}
        </div>

        {/* Category & Priority selector rows */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex-1">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Software Bug">Software Bug</option>
              <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
              <option value="Network & Connectivity">Network & Connectivity</option>
              <option value="Account & Authentication">Account & Authentication</option>
              <option value="Billing & Invoicing">Billing & Invoicing</option>
              <option value="Performance & Latency">Performance & Latency</option>
              <option value="Service Complaint">Service Complaint</option>
            </select>
          </div>

          <div className="w-32">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

      </div>

      {/* Ticket List Items */}
      <div className="divide-y divide-slate-100 overflow-y-auto flex-1 min-h-[400px]">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-sm">No tickets found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or filter settings.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isSelected = selectedTicketId === ticket.id;
            return (
              <div
                key={ticket.id}
                id={`ticket-row-${ticket.ticketNumber}`}
                onClick={() => onSelectTicket(ticket)}
                className={`p-4 transition-all cursor-pointer hover:bg-slate-50 relative ${
                  isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : ''
                }`}
              >
                {/* Header Row: Ticket #, Priority, Status */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50">
                      {ticket.ticketNumber}
                    </span>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <div>
                    {getStatusBadge(ticket.status, ticket.escalation.isEscalated)}
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">
                  {ticket.title}
                </h4>

                {/* AI Diagnostic preview or description */}
                <p className="text-xs text-slate-500 line-clamp-2 mb-2.5 font-normal">
                  {ticket.aiAnalysis?.summary || ticket.description}
                </p>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-medium text-slate-700 truncate">{ticket.requesterName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">{ticket.category}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {ticket.aiAnalysis && (
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        AI: {ticket.aiAnalysis.severityScore}/10
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {ticket.messages?.length || 0}
                    </span>
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
