import React, { useState } from 'react';
import { AppUser, UserRole, ToastNotification } from '../types';
import { updateUserRole, logOut } from '../lib/firebase';
import { 
  Shield, 
  Bell, 
  LogOut, 
  ChevronDown, 
  CheckCircle2, 
  Activity, 
  User as UserIcon,
  HelpCircle,
  X
} from 'lucide-react';

interface NavbarProps {
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onOpenHelp: () => void;
  notifications: ToastNotification[];
  onClearNotifications: () => void;
  onSelectTicketFromToast: (ticketId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenHelp,
  notifications,
  onClearNotifications,
  onSelectTicketFromToast
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const handleSwitchRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    setUpdatingRole(true);
    try {
      await updateUserRole(currentUser.uid, newRole);
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setUpdatingRole(false);
      setShowRoleMenu(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            Admin
          </span>
        );
      case 'agent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Support Agent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            End User
          </span>
        );
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
              ResolveDesk <span className="text-blue-600">AI</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
              Live Firestore
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden md:block">
            Autonomous Triage & Incident Escalation Engine
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenHelp}
          title="System Help & SLA Documentation"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition relative"
            title="Real-time Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-3 px-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">Real-time Activity</span>
                  {notifications.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={onClearNotifications}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.ticketId) onSelectTicketFromToast(n.ticketId);
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50/50 border border-slate-150 cursor-pointer transition text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {/* Role dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition text-left"
                title="Switch role view for testing"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    {currentUser.email}
                  </div>
                </div>
                {getRoleBadge(currentUser.role)}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role switcher menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch Active Role
                  </div>
                  <div className="space-y-1 my-1">
                    <button
                      onClick={() => handleSwitchRole('user')}
                      disabled={updatingRole}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${
                        currentUser.role === 'user' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-medium">End User</span>
                        <span className="text-[10px] text-slate-500">Submit & track personal tickets</span>
                      </div>
                      {currentUser.role === 'user' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>

                    <button
                      onClick={() => handleSwitchRole('agent')}
                      disabled={updatingRole}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${
                        currentUser.role === 'agent' ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-medium">Support Agent</span>
                        <span className="text-[10px] text-slate-500">Manage queue, reply & escalate</span>
                      </div>
                      {currentUser.role === 'agent' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </button>

                    <button
                      onClick={() => handleSwitchRole('admin')}
                      disabled={updatingRole}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${
                        currentUser.role === 'admin' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-medium">Administrator</span>
                        <span className="text-[10px] text-slate-500">All tickets, SLAs & user roles</span>
                      </div>
                      {currentUser.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={logOut}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={logOut}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition shadow-sm"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
