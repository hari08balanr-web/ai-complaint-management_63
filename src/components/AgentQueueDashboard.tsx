import React, { useState } from 'react';
import { Ticket, AppUser } from '../types';
import { 
  assignTicketAgent 
} from '../lib/firebase';
import { 
  Search, 
  Clock, 
  AlertTriangle, 
  ArrowUpDown, 
  UserCheck, 
  ChevronRight,
  Filter,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface AgentQueueDashboardProps {
  tickets: Ticket[];
  currentUser: AppUser | null;
  onSelectTicket: (ticketId: string) => void;
  onOpenNewTicket: () => void;
  selectedStatusFilter: string | null;
}

type SortOption = 'sla' | 'priority' | 'date';

export const AgentQueueDashboard: React.FC<AgentQueueDashboardProps> = ({
  tickets,
  currentUser,
  onSelectTicket,
  selectedStatusFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all-open' | 'assigned-me' | 'escalated' | 'resolved'>('all-open');
  const [sortBy, setSortBy] = useState<SortOption>('sla');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const now = Date.now();

  // Filter
  const filteredTickets = tickets.filter((t) => {
    if (selectedStatusFilter === 'assigned-me' && t.assignedAgentId !== currentUser?.uid) {
      return false;
    }
    if (selectedStatusFilter && selectedStatusFilter !== 'assigned-me' && t.status !== selectedStatusFilter) {
      return false;
    }

    if (activeTab === 'all-open' && (t.status === 'Resolved' || t.status === 'Closed')) return false;
    if (activeTab === 'assigned-me' && t.assignedAgentId !== currentUser?.uid) return false;
    if (activeTab === 'escalated' && t.status !== 'Escalated') return false;
    if (activeTab === 'resolved' && (t.status !== 'Resolved' && t.status !== 'Closed')) return false;

    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ticketId.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q) ||
        t.requesterEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'sla') {
      return a.slaDeadline - b.slaDeadline;
    }
    if (sortBy === 'priority') {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    }
    return b.createdAt - a.createdAt;
  });

  // Quick assign
  const handleQuickAssign = async (e: React.MouseEvent, ticket: Ticket) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      await assignTicketAgent(ticket.id, currentUser.uid, currentUser.name);
    } catch (err) {
      console.error('Error assigning:', err);
    }
  };

  const categories = Array.from(new Set(tickets.map(t => t.category)));

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto p-6 sm:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Support Desk Triage Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Agent View
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage incoming inquiries, triage SLAs, and collaborate with AI diagnostics
          </p>
        </div>
      </div>

      {/* Control Bar: Tabs, Search, Filters & Sorting */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Queue Tabs */}
        <div className="flex flex-wrap rounded-xl bg-slate-100 p-1 text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('all-open')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'all-open' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Open ({tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length})
          </button>
          <button
            onClick={() => setActiveTab('assigned-me')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'assigned-me' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Assigned to Me ({tickets.filter(t => t.assignedAgentId === currentUser?.uid && t.status !== 'Resolved').length})
          </button>
          <button
            onClick={() => setActiveTab('escalated')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'escalated' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Escalations ({tickets.filter(t => t.status === 'Escalated').length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'resolved' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Right filters: Search, Category, Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl px-2.5 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none text-xs"
            >
              <option value="sla">Sort: SLA Urgent First</option>
              <option value="priority">Sort: Priority</option>
              <option value="date">Sort: Newest First</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by customer or title..."
              className="w-full px-3 py-1.5 pl-8 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Requester</th>
                <th className="py-3.5 px-4">Status & Priority</th>
                <th className="py-3.5 px-4">SLA Time Remaining</th>
                <th className="py-3.5 px-4">Assignee</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {sortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No tickets found matching the selected queue filters.
                  </td>
                </tr>
              ) : (
                sortedTickets.map((ticket) => {
                  const isBreached = (ticket.status === 'Open' || ticket.status === 'In Progress' || ticket.status === 'Escalated') && ticket.slaDeadline < now;
                  const diff = ticket.slaDeadline - now;
                  const hoursLeft = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
                  const minsLeft = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket.id)}
                      className="hover:bg-blue-50/40 transition cursor-pointer"
                    >
                      {/* Ticket Summary */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {ticket.ticketId}
                          </span>
                          <span className="font-semibold text-slate-900 truncate max-w-xs block">
                            {ticket.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {ticket.category}
                        </div>
                      </td>

                      {/* Requester */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{ticket.requesterName}</div>
                        <div className="text-[11px] text-slate-400">{ticket.requesterEmail}</div>
                      </td>

                      {/* Status & Priority */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                            ticket.status === 'Escalated' ? 'bg-rose-100 text-rose-800 font-bold' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ticket.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            ticket.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                        {ticket.escalationLevel > 0 && (
                          <div className="text-[10px] font-bold text-rose-600 mt-0.5 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Tier {ticket.escalationLevel} Escalated</span>
                          </div>
                        )}
                      </td>

                      {/* SLA Remaining */}
                      <td className="py-3.5 px-4">
                        {ticket.status === 'Resolved' || ticket.status === 'Closed' ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolved
                          </span>
                        ) : isBreached ? (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px] inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Overdue by {hoursLeft}h {minsLeft}m
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {hoursLeft}h {minsLeft}m left
                          </span>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="py-3.5 px-4">
                        {ticket.assignedAgentName ? (
                          <span className="font-semibold text-slate-800">
                            {ticket.assignedAgentName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Quick Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!ticket.assignedAgentId && (
                            <button
                              onClick={(e) => handleQuickAssign(e, ticket)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition"
                            >
                              Assign Me
                            </button>
                          )}
                          <div className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
