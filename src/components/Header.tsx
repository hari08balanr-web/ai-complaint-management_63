import React from 'react';
import { 
  Bot, 
  LifeBuoy, 
  PlusCircle, 
  MessageSquareCode, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  Sparkles,
  Users,
  RefreshCw,
  Menu
} from 'lucide-react';
import { User } from '../lib/firebase';
import { loginWithGoogle, logOut } from '../lib/firebase';

interface HeaderProps {
  user: User | null;
  role: 'customer' | 'support_agent';
  setRole: (role: 'customer' | 'support_agent') => void;
  onOpenNewTicket: () => void;
  onOpenAiChat: () => void;
  onResetData: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  role,
  setRole,
  onOpenNewTicket,
  onOpenAiChat,
  onResetData,
  onToggleMobileSidebar
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            {onToggleMobileSidebar && (
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-100">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Nexus<span className="text-indigo-600">Support</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Technical Service Requests & Complaint Management System
              </p>
            </div>
          </div>

          {/* Center/Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Perspective / Role Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                id="role-customer-btn"
                onClick={() => setRole('customer')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  role === 'customer'
                    ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Customer portal view to submit and track requests"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Requester View</span>
                <span className="md:hidden">User</span>
              </button>
              <button
                type="button"
                id="role-agent-btn"
                onClick={() => setRole('support_agent')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  role === 'support_agent'
                    ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Support agent command center to manage, diagnose and escalate"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Support Agent Desk</span>
                <span className="md:hidden">Agent</span>
              </button>
            </div>

            {/* AI Troubleshooting Chat Trigger */}
            <button
              type="button"
              id="open-ai-chat-btn"
              onClick={onOpenAiChat}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <MessageSquareCode className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">AI Troubleshooter</span>
              <span className="sm:hidden">AI Chat</span>
            </button>

            {/* New Ticket CTA */}
            <button
              type="button"
              id="create-new-ticket-btn"
              onClick={onOpenNewTicket}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Ticket</span>
              <span className="sm:hidden">New</span>
            </button>

            {/* User Auth dropdown / action */}
            <div className="flex items-center pl-1 border-l border-slate-200">
              {user ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200 overflow-hidden"
                    title={user.email || user.displayName || 'Signed In'}
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => logOut()}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="google-signin-btn"
                  onClick={() => loginWithGoogle()}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Sync workspace data helper */}
            <button
              type="button"
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Sync Workspace Tickets"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
