import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  HeartHandshake, 
  DollarSign, 
  FileText, 
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { ServiceTicket } from '../types';

interface ComplaintsViewProps {
  tickets: ServiceTicket[];
  onSelectTicket: (ticketId: string) => void;
  onOpenNewTicketWithData?: (data: { title?: string; description?: string }) => void;
}

export const ComplaintsView: React.FC<ComplaintsViewProps> = ({
  tickets,
  onSelectTicket,
  onOpenNewTicketWithData
}) => {
  // Filter for service complaints, billing issues, or priority disputes
  const complaintTickets = tickets.filter(
    (t) => t.category === 'Service Complaint' || t.category === 'Billing & Invoicing'
  );

  const resolvedComplaints = complaintTickets.filter(
    (t) => t.status === 'Resolved' || t.status === 'Closed'
  );

  const pendingComplaints = complaintTickets.filter(
    (t) => t.status !== 'Resolved' && t.status !== 'Closed'
  );

  const csatRating = '94.2%';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Customer Complaints & SLA Compliance Monitor
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {pendingComplaints.length} Under Review
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Auditing customer dissatisfaction, billing charge reconciliations, SLA breach liabilities, and remediation settlements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 shrink-0">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">CSAT Score</p>
              <p className="text-lg font-black text-emerald-600">{csatRating}</p>
            </div>
            <div className="w-px h-7 bg-slate-200" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Resolution SLA</p>
              <p className="text-lg font-black text-slate-900">&lt; 24h</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Complaints</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{pendingComplaints.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting resolution or customer sign-off</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Resolved Complaints</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{resolvedComplaints.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Settled with satisfactory customer outcome</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA Breach Warning</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">0</p>
          <p className="text-[11px] text-slate-500 mt-1">No active breach penalties triggered</p>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Complaint & Billing Audit Log
          </h2>
          <span className="text-xs text-slate-400">
            {complaintTickets.length} cases tracked
          </span>
        </div>

        {complaintTickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            No active complaint or billing dispute tickets found.
          </div>
        ) : (
          <div className="space-y-3">
            {complaintTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs mb-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {ticket.ticketNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      {ticket.category}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {ticket.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {ticket.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {ticket.description}
                </p>

                {ticket.aiAnalysis && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <span className="font-bold text-slate-900">AI Root Cause Assessment: </span>
                    <span>{ticket.aiAnalysis.rootCauseHypothesis}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span>Customer: <strong className="text-slate-700">{ticket.requesterName}</strong></span>
                  <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Review Audit Trail <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
