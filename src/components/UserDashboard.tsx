import React, { useState } from 'react';
import { Ticket } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronRight, 
  Inbox, 
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface UserDashboardProps {
  tickets: Ticket[];
  loading: boolean;
  onSelectTicket: (ticketId: string) => void;
  onOpenNewTicket: () => void;
}

export function UserDashboard({
  tickets,
  loading,
  onSelectTicket,
  onOpenNewTicket
}: UserDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const counts = {
    all: tickets.length,
    inProgress: tickets.filter(t => t.status === 'In Progress' || t.status === 'AI Reviewed').length,
    escalated: tickets.filter(t => t.status === 'Escalated' || t.escalationDetails?.isEscalated).length,
    resolved: tickets.filter(t => t.status === 'Resolved').length
  };

  const categories = Array.from(new Set(tickets.map(t => t.category))).filter(Boolean);

  return (
    <div className="flex-1 flex flex-col bg-[#121212] text-[#F5F0E6] overflow-y-auto">
      {/* Hero / Action Bar */}
      <div className="p-6 sm:p-8 border-b border-[#242424] bg-[#161616]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C0392B]/20 text-[#E74C3C] text-[11px] font-bold uppercase tracking-wider border border-[#C0392B]/30">
                Service Desk Portal
              </span>
              <span className="text-xs text-[#8A8175]">&bull;</span>
              <span className="text-xs text-[#8A8175]">Live Real-time Queue</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F0E6] tracking-tight">
              Support Requests & Complaints
            </h1>
            <p className="text-xs sm:text-sm text-[#8A8175] mt-1">
              Submit issues, review automated AI triage suggestions, and monitor real-time SLA progress.
            </p>
          </div>

          <button
            onClick={onOpenNewTicket}
            className="self-start sm:self-center px-6 py-3.5 rounded-xl bg-[#C0392B] hover:bg-[#A93226] text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xl shadow-red-950/50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>

        {/* Quick Stat Metric Pills */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <button
            onClick={() => setStatusFilter('All')}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-[#222222] border-[#C0392B] text-[#F5F0E6]'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#D1C7B7] hover:border-[#383838]'
            }`}
          >
            <div className="text-[11px] text-[#8A8175] uppercase font-bold tracking-wider">Total Tickets</div>
            <div className="text-xl font-extrabold text-[#F5F0E6] mt-1">{counts.all}</div>
          </button>

          <button
            onClick={() => setStatusFilter('In Progress')}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              statusFilter === 'In Progress'
                ? 'bg-[#222222] border-blue-500 text-[#F5F0E6]'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#D1C7B7] hover:border-[#383838]'
            }`}
          >
            <div className="text-[11px] text-[#8A8175] uppercase font-bold tracking-wider">Active / In Progress</div>
            <div className="text-xl font-extrabold text-blue-400 mt-1">{counts.inProgress}</div>
          </button>

          <button
            onClick={() => setStatusFilter('Escalated')}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              statusFilter === 'Escalated'
                ? 'bg-[#222222] border-[#C0392B] text-[#F5F0E6]'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#D1C7B7] hover:border-[#383838]'
            }`}
          >
            <div className="text-[11px] text-[#8A8175] uppercase font-bold tracking-wider">Escalated Tickets</div>
            <div className="text-xl font-extrabold text-[#E74C3C] mt-1">{counts.escalated}</div>
          </button>

          <button
            onClick={() => setStatusFilter('Resolved')}
            className={`p-4 rounded-xl border text-left transition cursor-pointer ${
              statusFilter === 'Resolved'
                ? 'bg-[#222222] border-emerald-500 text-[#F5F0E6]'
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#D1C7B7] hover:border-[#383838]'
            }`}
          >
            <div className="text-[11px] text-[#8A8175] uppercase font-bold tracking-wider">Resolved</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">{counts.resolved}</div>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#8A8175] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, keyword, category..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#181818] border border-[#2D2D2D] focus:border-[#C0392B] rounded-xl text-xs text-[#F5F0E6] placeholder-[#555] outline-none transition"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#181818] border border-[#2D2D2D] rounded-xl text-xs text-[#D1C7B7] outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="AI Reviewed">AI Reviewed</option>
              <option value="In Progress">In Progress</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#181818] border border-[#2D2D2D] rounded-xl text-xs text-[#D1C7B7] outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#C0392B]/30 border-t-[#C0392B] rounded-full animate-spin" />
            <p className="text-xs text-[#8A8175]">Loading your tickets from MongoDB...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-[#181818] border border-[#262626] rounded-2xl p-12 text-center max-w-lg mx-auto my-10">
            <div className="w-12 h-12 rounded-2xl bg-[#C0392B]/10 border border-[#C0392B]/30 flex items-center justify-center text-[#E74C3C] mx-auto mb-4">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#F5F0E6] mb-1">No Tickets Found</h3>
            <p className="text-xs text-[#8A8175] mb-6">
              {searchTerm || statusFilter !== 'All' 
                ? 'No service tickets match your active filter criteria.' 
                : 'You have not submitted any service tickets yet. Submit your first request to receive automated AI diagnostics.'}
            </p>
            <button
              onClick={onOpenNewTicket}
              className="px-5 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-semibold transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Ticket</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((t) => {
              const isEscalated = t.status === 'Escalated' || t.escalationDetails?.isEscalated;
              const isResolved = t.status === 'Resolved';
              const isOverdue = !isResolved && new Date(t.slaDeadline).getTime() < Date.now();

              return (
                <div
                  key={t.ticketId}
                  onClick={() => onSelectTicket(t.ticketId)}
                  className="bg-[#181818] hover:bg-[#1F1F1F] border border-[#282828] hover:border-[#383838] rounded-2xl p-5 transition cursor-pointer shadow-md group animate-fadeIn"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#C0392B] bg-[#251818] px-2 py-0.5 rounded-lg border border-[#C0392B]/30">
                        {t.ticketId}
                      </span>
                      <span className="text-xs font-semibold text-[#8A8175]">
                        {t.category}
                      </span>
                      <span className="text-xs text-[#555]">&bull;</span>
                      <span className="text-xs text-[#8A8175]">
                        {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.priority === 'Critical' ? 'bg-red-950/80 text-red-400 border border-red-800/60' :
                        t.priority === 'High' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {t.priority}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isResolved ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' :
                        isEscalated ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse' :
                        'bg-[#2A2A2A] text-[#D1C7B7] border border-[#3A3A3A]'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#F5F0E6] group-hover:text-white transition tracking-tight">
                    {t.title}
                  </h3>

                  <p className="text-xs text-[#8A8175] line-clamp-2 mt-1.5 mb-3 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="pt-3 border-t border-[#242424] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[#D1C7B7]">
                        <Sparkles className="w-3.5 h-3.5 text-[#C0392B]" />
                        <span className="text-[11px]">AI Reviewed & Triage Active</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[#8A8175]">
                        <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-[#E74C3C]' : 'text-emerald-500'}`} />
                        <span className={`text-[11px] font-mono ${isOverdue ? 'text-[#E74C3C] font-semibold' : ''}`}>
                          {isResolved 
                            ? 'Resolved' 
                            : isOverdue 
                            ? 'SLA Breached' 
                            : `SLA Deadline: ${new Date(t.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-semibold text-[#C0392B] group-hover:translate-x-1 transition-transform duration-150">
                      <span>View Thread ({t.messages?.length || 0})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
