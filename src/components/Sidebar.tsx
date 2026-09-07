import React from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  AlertTriangle, 
  Cpu, 
  MessageSquareCode, 
  ShieldAlert, 
  BookOpen, 
  Sparkles, 
  PlusCircle, 
  User as UserIcon, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  ChevronRight, 
  RefreshCw,
  CheckCircle2,
  Activity,
  Layers
} from 'lucide-react';
import { ActiveView, ServiceTicket } from '../types';
import { User, loginWithGoogle, logOut } from '../lib/firebase';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  role: 'customer' | 'support_agent';
  setRole: (role: 'customer' | 'support_agent') => void;
  tickets: ServiceTicket[];
  user: User | null;
  onOpenNewTicket: () => void;
  onResetData: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  role,
  setRole,
  tickets,
  user,
  onOpenNewTicket,
  onResetData,
  isMobileOpen,
  setIsMobileOpen
}) => {
  // Counts
  const totalTickets = tickets.length;
  const escalatedCount = tickets.filter(t => t.status === 'Escalated' || t.escalation?.isEscalated).length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
  const complaintsCount = tickets.filter(t => t.category === 'Service Complaint' || t.category === 'Billing & Invoicing').length;

  const navItems = [
    {
      group: 'Core Operations',
      items: [
        {
          id: 'dashboard' as ActiveView,
          label: 'Executive Dashboard',
          icon: LayoutDashboard,
          badge: null
        },
        {
          id: 'tickets' as ActiveView,
          label: 'Service Desk & Tickets',
          icon: Ticket,
          badge: totalTickets > 0 ? String(totalTickets) : null,
          badgeColor: 'bg-slate-700 text-slate-200'
        },
        {
          id: 'escalations' as ActiveView,
          label: 'Tier 2 Escalations',
          icon: AlertTriangle,
          badge: escalatedCount > 0 ? String(escalatedCount) : null,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }
      ]
    },
    {
      group: 'AI Intelligence & Triage',
      items: [
        {
          id: 'diagnostics' as ActiveView,
          label: 'AI Diagnostics Hub',
          icon: Cpu,
          badge: 'Gemini',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
        },
        {
          id: 'chat' as ActiveView,
          label: 'AI Troubleshooter',
          icon: MessageSquareCode,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }
      ]
    },
    {
      group: 'Quality & Runbooks',
      items: [
        {
          id: 'complaints' as ActiveView,
          label: 'Complaints & SLA Monitor',
          icon: ShieldAlert,
          badge: complaintsCount > 0 ? String(complaintsCount) : null,
          badgeColor: 'bg-amber-500/20 text-amber-300'
        },
        {
          id: 'knowledge' as ActiveView,
          label: 'Knowledge & Runbooks',
          icon: BookOpen,
          badge: null
        }
      ]
    }
  ];

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800/90 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Nexus<span className="text-indigo-400">Desk</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                AI Service Desk & Triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 pb-2">
          <button
            type="button"
            onClick={() => {
              onOpenNewTicket();
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-700/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-6">
          {navItems.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.group}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Perspective & Role Switcher */}
        <div className="p-3 border-t border-slate-800/90 bg-slate-950/40">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2 flex items-center justify-between">
            <span>Workspace View</span>
            <span className="text-[10px] font-normal text-slate-400 capitalize">{role.replace('_', ' ')}</span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                role === 'customer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserIcon className="w-3 h-3" />
              <span>User</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('support_agent')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                role === 'support_agent'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Agent</span>
            </button>
          </div>
        </div>

        {/* User Account & System Status Footer */}
        <div className="p-3 border-t border-slate-800/90 flex items-center justify-between gap-2">
          {user ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-500/30 shrink-0 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {user.displayName || user.email?.split('@')[0] || 'Enterprise User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user.email || 'user@organization.internal'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => logOut()}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign out of enterprise session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                title="Sign in with Google Workspace"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Enterprise Sign In</span>
              </button>
            </div>
          )}

          {/* Sync Workspace Data button */}
          <button
            type="button"
            onClick={onResetData}
            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title="Sync Workspace Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </>
  );
};
