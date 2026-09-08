import React, { useState, useEffect, useRef } from 'react';
import { 
  AppUser, 
  Ticket, 
  ActiveNavTab, 
  ToastNotification, 
  TicketStatus 
} from './types';
import { 
  auth, 
  getUserProfile, 
  syncUserProfile, 
  subscribeToTickets, 
  createTicketWithAiFirstResponse,
  escalateTicket 
} from './lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { UserDashboard } from './components/UserDashboard';
import { AgentQueueDashboard } from './components/AgentQueueDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TicketDetailView } from './components/TicketDetailView';
import { NewTicketModal } from './components/NewTicketModal';
import { EscalateModal } from './components/EscalateModal';
import { AuthModal } from './components/AuthModal';
import { FaqView } from './components/FaqView';
import { ToastContainer } from './components/ToastContainer';
import { Sparkles, Layers, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [escalatingTicket, setEscalatingTicket] = useState<Ticket | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const previousTicketsRef = useRef<Map<string, TicketStatus>>(new Map());

  // Helper to add toast notification
  const addNotification = (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info', 
    ticketId?: string
  ) => {
    const newToast: ToastNotification = {
      id: `${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      ticketId,
      timestamp: Date.now()
    };
    setNotifications((prev) => [newToast, ...prev].slice(0, 10));

    // Auto remove after 7 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter(n => n.id !== newToast.id));
    }, 7000);
  };

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await syncUserProfile(fbUser);
          setCurrentUser(profile);
        } catch (err) {
          console.error('Failed to sync profile:', err);
        }
      } else {
        // Automatically create or sign into guest session if none exists
        try {
          const res = await signInAnonymously(auth);
          const profile = await syncUserProfile(res.user, 'user');
          setCurrentUser(profile);
        } catch (anonErr) {
          console.warn('Anonymous sign-in error:', anonErr);
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Real-time Tickets listener (Firestore onSnapshot)
  useEffect(() => {
    if (!currentUser) return;

    const unsub = subscribeToTickets(
      currentUser,
      (realtimeTickets) => {
        // Check for status changes to trigger real-time toast notifications
        const prevMap = previousTicketsRef.current;
        realtimeTickets.forEach((t) => {
          const prevStatus = prevMap.get(t.id);
          if (prevStatus && prevStatus !== t.status) {
            let toastType: 'info' | 'success' | 'warning' = 'info';
            if (t.status === 'Resolved') toastType = 'success';
            if (t.status === 'Escalated') toastType = 'warning';

            addNotification(
              `Status Update: ${t.ticketId}`,
              `Ticket status changed from "${prevStatus}" to "${t.status}".`,
              toastType,
              t.id
            );
          }
          prevMap.set(t.id, t.status);
        });

        setTickets(realtimeTickets);
      },
      (error) => {
        console.warn('Subscription error:', error);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // 3. Automated Background SLA Escalation Checker (Every 30 seconds)
  useEffect(() => {
    const checkSlas = async () => {
      if (!tickets.length || !currentUser) return;
      const now = Date.now();

      for (const t of tickets) {
        if ((t.status === 'Open' || t.status === 'In Progress') && t.slaDeadline < now) {
          try {
            await escalateTicket(
              t.id,
              t.escalationLevel || 0,
              'Automated SLA Escalation Engine: Resolution deadline exceeded.',
              'System Scheduler'
            );
            addNotification(
              `⚠️ SLA Breached: ${t.ticketId}`,
              `Ticket exceeded resolution deadline. Automatically escalated to Tier ${(t.escalationLevel || 0) + 1}.`,
              'error',
              t.id
            );
          } catch (err) {
            console.error('Auto-escalation failed:', err);
          }
        }
      }
    };

    const interval = setInterval(checkSlas, 30000);
    return () => clearInterval(interval);
  }, [tickets, currentUser]);

  // Seed sample data if Firestore is empty
  const handleSeedSampleTickets = async () => {
    if (!currentUser) return;
    try {
      const sample1 = await createTicketWithAiFirstResponse({
        userId: currentUser.uid,
        requesterName: currentUser.name,
        requesterEmail: currentUser.email,
        title: 'Production 504 Gateway Timeout during checkout processing',
        description: 'Users report checkout transactions failing with HTTP 504. High latency observed on database connection pool.',
        category: 'Cloud & Infrastructure',
        priority: 'Critical',
        slaHours: 1,
        aiSuggestedResponse: 'Automated Diagnostic Scan: High API proxy latency detected. Investigating upstream microservice health checks and database transaction locks.'
      });

      const sample2 = await createTicketWithAiFirstResponse({
        userId: currentUser.uid,
        requesterName: 'DevOps Lead Alex',
        requesterEmail: 'alex.devops@techcorp.com',
        title: 'SAML 2.0 Single Sign-On redirect loop on corporate portal',
        description: 'Enterprise users are unable to authenticate via Okta IdP. Signature verification is intermittently failing.',
        category: 'Account & Authentication',
        priority: 'High',
        slaHours: 4,
        aiSuggestedResponse: 'Diagnostic Scan: Likely X.509 certificate expiry or clock skew between identity provider and authorization server.'
      });

      addNotification('Tickets Seeded', 'Sample enterprise tickets loaded successfully.', 'success', sample1);
    } catch (err) {
      console.error('Seed error:', err);
    }
  };

  // Status change notification callback
  const handleStatusChangeNotify = (oldStatus: TicketStatus, newStatus: TicketStatus, ticket: Ticket) => {
    addNotification(
      `Status Changed: ${ticket.ticketId}`,
      `Updated from ${oldStatus} to ${newStatus}`,
      newStatus === 'Resolved' ? 'success' : newStatus === 'Escalated' ? 'warning' : 'info',
      ticket.id
    );
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-400">
          Connecting to ResolveDesk Enterprise Firestore...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHelp={() => { setSelectedTicketId(null); setActiveTab('faq'); }}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
        onSelectTicketFromToast={(tid) => setSelectedTicketId(tid)}
      />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setSelectedTicketId(null);
            setActiveTab(tab);
          }}
          onOpenNewTicket={() => setIsNewTicketOpen(true)}
          tickets={tickets}
          selectedStatusFilter={selectedStatusFilter}
          onSelectStatusFilter={(status) => {
            setSelectedTicketId(null);
            setSelectedStatusFilter(status);
          }}
        />

        {/* Content View Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Quick Empty-Database Helper Banner */}
          {tickets.length === 0 && !selectedTicketId && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-2.5 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Welcome to ResolveDesk! Firestore is currently clear. You can submit a real ticket or load enterprise sample cases.
                </span>
              </div>
              <button
                onClick={handleSeedSampleTickets}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-2xs"
              >
                Load Demo Tickets
              </button>
            </div>
          )}

          {/* Render Active View */}
          {selectedTicketId ? (
            <TicketDetailView
              ticketId={selectedTicketId}
              currentUser={currentUser}
              onBack={() => setSelectedTicketId(null)}
              onOpenEscalate={(t) => setEscalatingTicket(t)}
              onStatusChangeNotify={handleStatusChangeNotify}
            />
          ) : activeTab === 'queue' ? (
            <AgentQueueDashboard
              tickets={tickets}
              currentUser={currentUser}
              onSelectTicket={(tid) => setSelectedTicketId(tid)}
              onOpenNewTicket={() => setIsNewTicketOpen(true)}
              selectedStatusFilter={selectedStatusFilter}
            />
          ) : activeTab === 'agents' || activeTab === 'analytics' ? (
            <AdminDashboard
              tickets={tickets}
              currentUser={currentUser}
              onSelectTicket={(tid) => setSelectedTicketId(tid)}
            />
          ) : activeTab === 'faq' ? (
            <FaqView />
          ) : (
            <UserDashboard
              tickets={tickets}
              onSelectTicket={(tid) => setSelectedTicketId(tid)}
              onOpenNewTicket={() => setIsNewTicketOpen(true)}
              selectedStatusFilter={selectedStatusFilter}
            />
          )}
        </main>
      </div>

      {/* Floating In-App Toast Container */}
      <ToastContainer
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter(n => n.id !== id))}
        onSelectTicket={(tid) => setSelectedTicketId(tid)}
      />

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        currentUser={currentUser}
        onTicketCreated={(newId) => {
          setSelectedTicketId(newId);
          addNotification('Ticket Submitted', 'AI analysis complete & SLA timer started.', 'success', newId);
        }}
      />

      <EscalateModal
        isOpen={Boolean(escalatingTicket)}
        onClose={() => setEscalatingTicket(null)}
        ticket={escalatingTicket}
        triggeredByName={currentUser?.name || 'Support Agent'}
        onSuccess={() => {
          addNotification('Ticket Escalated', 'Reassigned to higher engineering tier.', 'warning', escalatingTicket?.id);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          addNotification('Signed In', 'Welcome to ResolveDesk AI Workspace.', 'success');
        }}
      />
    </div>
  );
}
