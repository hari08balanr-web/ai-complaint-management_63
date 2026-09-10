import React from 'react';
import { ToastAlert } from '../types';
import { X, Sparkles, AlertOctagon, CheckCircle2, Info } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
  onSelectTicket?: (ticketId: string) => void;
}

export function ToastContainer({ toasts, onDismiss, onSelectTicket }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl p-4 shadow-2xl shadow-black text-[#F5F0E6] flex items-start gap-3 transition-all animate-fadeIn"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'error' ? (
              <AlertOctagon className="w-5 h-5 text-[#E74C3C]" />
            ) : toast.type === 'warning' ? (
              <AlertOctagon className="w-5 h-5 text-amber-400" />
            ) : toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#C0392B]" />
            )}
          </div>

          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              if (toast.ticketId && onSelectTicket) {
                onSelectTicket(toast.ticketId);
                onDismiss(toast.id);
              }
            }}
          >
            <h4 className="text-xs font-bold text-[#F5F0E6] tracking-tight">{toast.title}</h4>
            <p className="text-[11px] text-[#D1C7B7] mt-0.5 line-clamp-2 leading-relaxed">{toast.message}</p>
            {toast.ticketId && (
              <span className="text-[10px] font-mono text-[#C0392B] underline mt-1 inline-block">
                View Ticket &rarr;
              </span>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[#8A8175] hover:text-[#F5F0E6] transition cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
