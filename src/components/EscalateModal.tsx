import React, { useState } from 'react';
import { apiEscalateTicket } from '../lib/api';
import { Ticket } from '../types';
import { AlertOctagon, X, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface EscalateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onEscalated: (updated: Ticket) => void;
}

export function EscalateModal({ isOpen, onClose, ticket, onEscalated }: EscalateModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updated = await apiEscalateTicket(
        ticket.ticketId,
        reason.trim() || 'Self-service AI troubleshooting was insufficient'
      );
      onEscalated(updated);
      onClose();
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to escalate ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#181818] border border-[#2D2D2D] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black relative text-[#F5F0E6]">
        <div className="flex items-start justify-between pb-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-[#E74C3C]">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F0E6]">Escalate to Engineering Team</h2>
              <p className="text-xs text-[#8A8175]">Ticket ID: {ticket.ticketId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A8175] hover:text-[#F5F0E6] hover:bg-[#252525] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
            {error}
          </div>
        )}

        <div className="my-5 p-4 rounded-xl bg-[#121212] border border-[#262626] text-xs text-[#D1C7B7] space-y-2">
          <p>
            Escalating will flag this ticket as <strong className="text-[#E74C3C]">Escalated</strong>, trigger on-call engineering notifications, and log an escalation event in the ticket audit history.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#8A8175]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Notifies Support Lead via Webhook & Automated Notification</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D1C7B7] mb-2">
              Reason for Escalation
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why automated suggestions were insufficient or describe ongoing business impact..."
              className="w-full px-4 py-3 bg-[#121212] border border-[#2D2D2D] focus:border-[#C0392B] rounded-xl text-sm text-[#F5F0E6] placeholder-[#555] outline-none transition resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-[#333] hover:bg-[#222] text-[#D1C7B7] text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Escalating...</span>
              ) : (
                <>
                  <span>Confirm Escalation</span>
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
