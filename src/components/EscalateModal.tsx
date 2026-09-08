import React, { useState } from 'react';
import { Ticket } from '../types';
import { escalateTicket } from '../lib/firebase';
import { AlertTriangle, X, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface EscalateModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  triggeredByName: string;
  onSuccess: () => void;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  isOpen,
  onClose,
  ticket,
  triggeredByName,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const currentLevel = ticket.escalationLevel || 0;
  const targetLevel = Math.min(3, currentLevel + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide an explicit escalation justification.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await escalateTicket(ticket.id, currentLevel, reason.trim(), triggeredByName);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Escalation failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        id="escalate-modal-card"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Escalate Service Ticket</h2>
              <p className="text-xs text-rose-700 font-medium">Reassign to Higher Engineering Tier ({ticket.ticketId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Tier Transition Indicator */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Current Status</span>
              <div className="text-sm font-bold text-slate-800">
                Tier {currentLevel} Support
              </div>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Escalated Target</span>
              <div className="text-sm font-bold text-rose-600">
                Tier {targetLevel} Support
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Escalation Justification & Impact <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              id="escalation-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Self-service diagnostics exhausted; customer cannot process payments in production. Requires immediate Tier 2 Cloud Engineering intervention."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Quick preset reasons */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Common Justifications:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Approaching SLA Deadline threshold',
                'Production outage impacting multiple users',
                'Complex bug requires Tier 2 Engineering review',
                'Client requested senior management escalation'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="confirm-escalation-btn"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Escalating...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Confirm Escalation to Tier {targetLevel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
