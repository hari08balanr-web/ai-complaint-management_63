import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle, RefreshCw, X, ExternalLink, ShieldCheck, HardDrive } from 'lucide-react';
import { MongoStatus } from '../types';
import { apiRetryDbConnection } from '../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  status: MongoStatus | null;
  onStatusUpdated: (newStatus: MongoStatus) => void;
}

export function DatabaseStatusModal({ isOpen, onClose, status, onStatusUpdated }: Props) {
  const [retrying, setRetrying] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAtlasConnected = status?.isConnected;

  const handleRetry = async () => {
    setRetrying(true);
    setRetryFeedback(null);
    try {
      const res = await apiRetryDbConnection();
      onStatusUpdated(res);
      if (res.isConnected) {
        setRetryFeedback('Successfully connected to MongoDB Atlas cluster!');
      } else {
        setRetryFeedback(res.connectionError || 'Atlas cluster still unreachable. Please verify Network Access IP whitelist.');
      }
    } catch (err: any) {
      setRetryFeedback(err.message || 'Connection test failed');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#181818] border border-[#2D2D2D] rounded-2xl shadow-2xl p-6 relative text-[#F5F0E6]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2A] mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAtlasConnected ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950/40 text-amber-400 border border-amber-500/30'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#F5F0E6]">Database Architecture Status</h3>
              <p className="text-xs text-[#8A8175]">ResolveDesk Dual-Tier Persistence Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A8175] hover:text-[#F5F0E6] hover:bg-[#252525] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status Pill */}
        <div className="p-4 rounded-xl bg-[#1F1F1F] border border-[#2F2F2F] mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#8A8175] uppercase tracking-wider">Active Storage Tier</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isAtlasConnected 
                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/40' 
                : 'bg-amber-900/30 text-amber-300 border border-amber-700/40'
            }`}>
              {isAtlasConnected ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  MongoDB Atlas (Cloud Connected)
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5" />
                  Resilient Local Storage (Active)
                </>
              )}
            </span>
          </div>

          <p className="text-xs text-[#C8C0B2] leading-relaxed">
            {isAtlasConnected 
              ? 'All tickets, user accounts, and SLA escalation workflows are persisting directly to your cloud-hosted MongoDB Atlas cluster.'
              : 'The system is actively running in resilient local storage mode. User signups, ticket history, and real-time updates are durably preserved.'}
          </p>
        </div>

        {/* Atlas IP Whitelist Guidance (Shown when Atlas not connected) */}
        {!isAtlasConnected && (
          <div className="p-4 rounded-xl bg-[#151515] border border-[#2B2B2B] mb-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E5DCCB]">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Connecting to your MongoDB Atlas Cluster</span>
            </div>

            <p className="text-xs text-[#9B9284] leading-relaxed">
              Cloud Run containers run on dynamic IP addresses. To grant access from this app to your MongoDB Atlas cluster:
            </p>

            <ol className="text-xs text-[#B5AC9E] space-y-2 list-decimal list-inside bg-[#1A1A1A] p-3 rounded-lg border border-[#262626]">
              <li>Log into your <strong className="text-white">cloud.mongodb.com</strong> console</li>
              <li>Go to <strong className="text-white">Security → Network Access</strong></li>
              <li>Click <strong className="text-white">+ Add IP Address</strong></li>
              <li>Choose <strong className="text-amber-300">Allow Access from Anywhere (0.0.0.0/0)</strong> and confirm</li>
              <li>Click <strong className="text-white">Test & Reconnect</strong> below</li>
            </ol>

            {status?.connectionError && (
              <div className="p-2.5 rounded-lg bg-black/40 border border-[#333] text-[11px] font-mono text-[#D4A373] break-all">
                {status.connectionError}
              </div>
            )}
          </div>
        )}

        {/* Feedback message */}
        {retryFeedback && (
          <div className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
            isAtlasConnected ? 'bg-emerald-950/40 border border-emerald-700/40 text-emerald-300' : 'bg-amber-950/40 border border-amber-700/40 text-amber-300'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{retryFeedback}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
          <a
            href="https://www.mongodb.com/docs/atlas/security-whitelist/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#8A8175] hover:text-[#D1C7B7] flex items-center gap-1 transition"
          >
            Atlas IP Whitelist Docs
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#222] hover:bg-[#2A2A2A] text-xs text-[#CCC] transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="px-4 py-2 rounded-xl bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-semibold flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Connecting...' : 'Test & Reconnect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
