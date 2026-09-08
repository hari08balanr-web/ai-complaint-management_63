import React from 'react';
import { ToastNotification } from '../types';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface ToastContainerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  onSelectTicket: (ticketId: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onDismiss,
  onSelectTicket
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.slice(-4).map((n) => {
        const isError = n.type === 'error';
        const isSuccess = n.type === 'success';
        const isWarning = n.type === 'warning';

        return (
          <div
            key={n.id}
            onClick={() => {
              if (n.ticketId) onSelectTicket(n.ticketId);
              onDismiss(n.id);
            }}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 cursor-pointer flex items-start justify-between gap-3 ${
              isError ? 'bg-rose-900/90 border-rose-700 text-white' :
              isWarning ? 'bg-amber-900/90 border-amber-700 text-white' :
              isSuccess ? 'bg-emerald-900/90 border-emerald-700 text-white' :
              'bg-slate-900/90 border-slate-700 text-white'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isError ? <AlertCircle className="w-5 h-5 text-rose-400" /> :
               isWarning ? <AlertTriangle className="w-5 h-5 text-amber-400" /> :
               isSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
               <Info className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 text-xs">
              <h4 className="font-bold text-sm tracking-tight">{n.title}</h4>
              <p className="mt-0.5 opacity-90 leading-snug">{n.message}</p>
              {n.ticketId && (
                <span className="inline-block mt-1 text-[11px] underline font-medium opacity-80 hover:opacity-100">
                  Click to view ticket details →
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(n.id);
              }}
              className="text-white/60 hover:text-white shrink-0 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
