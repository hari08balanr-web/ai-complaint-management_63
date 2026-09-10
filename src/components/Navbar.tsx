import React, { useState } from 'react';
import { AuthUser, MongoStatus } from '../types';
import { Sparkles, LogOut, Database } from 'lucide-react';
import { DatabaseStatusModal } from './DatabaseStatusModal';

interface NavbarProps {
  currentUser: AuthUser;
  onLogout: () => void;
  mongoStatus: MongoStatus | null;
  socketConnected: boolean;
  onStatusUpdated?: (status: MongoStatus) => void;
}

export function Navbar({
  currentUser,
  onLogout,
  mongoStatus,
  socketConnected,
  onStatusUpdated
}: NavbarProps) {
  const [dbModalOpen, setDbModalOpen] = useState(false);

  return (
    <>
      <header className="px-6 py-4 border-b border-[#242424] bg-[#161616] flex items-center justify-between text-[#F5F0E6] select-none">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#C0392B] flex items-center justify-center shadow-lg shadow-red-950/50 border border-red-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#F5F0E6]">ResolveDesk</span>
              <span className="px-2 py-0.5 rounded-full bg-[#242424] border border-[#333] text-[10px] font-bold text-[#D1C7B7] uppercase tracking-wider">
                Portal
              </span>
            </div>
            <p className="text-[11px] text-[#8A8175] hidden sm:block">
              AI-Powered Technical Support & Complaint Management
            </p>
          </div>
        </div>

        {/* Center Status Indicators */}
        <div className="flex items-center gap-3">
          {/* Realtime Socket Status */}
          <div 
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#2B2B2B] text-[11px]"
            title="Socket.io Real-time WebSocket connection status"
          >
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[#8A8175] font-mono">
              {socketConnected ? 'Socket.io Live' : 'Connecting...'}
            </span>
          </div>

          {/* MongoDB Status Pill Button */}
          <button 
            onClick={() => setDbModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] hover:bg-[#222] border border-[#2B2B2B] hover:border-[#3E3E3E] text-[11px] transition cursor-pointer"
            title="Click to view Database Architecture & Connection Settings"
          >
            <Database className={`w-3.5 h-3.5 ${mongoStatus?.isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-[#D1C7B7] font-mono">
              {mongoStatus?.isConnected 
                ? 'MongoDB Atlas: Connected' 
                : 'Storage: Local Active'}
            </span>
          </button>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3 pl-2 border-l border-[#262626]">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#F5F0E6] truncate max-w-[150px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-[#8A8175] truncate max-w-[150px]">
                {currentUser.email}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-[#8A8175] hover:text-[#C0392B] border border-[#2D2D2D] transition cursor-pointer"
              title="Sign out of your session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Database Modal */}
      <DatabaseStatusModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
        status={mongoStatus}
        onStatusUpdated={(newStatus) => {
          if (onStatusUpdated) onStatusUpdated(newStatus);
        }}
      />
    </>
  );
}
