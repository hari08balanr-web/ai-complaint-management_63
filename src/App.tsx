import React, { useState, useEffect } from 'react';
import { AuthUser, Ticket, MongoStatus, ToastAlert } from './types';
import { 
  apiGetMe, 
  apiGetTickets, 
  apiGetDbStatus, 
  removeStoredToken 
} from './lib/api';
import { getSocket, joinUserRoom } from './lib/socket';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { UserDashboard } from './components/UserDashboard';
import { TicketDetailView } from './components/TicketDetailView';
import { NewTicketModal } from './components/NewTicketModal';
import { EscalateModal } from './components/EscalateModal';
import { ToastContainer } from './components/ToastContainer';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Modals state
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [escalatingTicket, setEscalatingTicket] = useState<Ticket | null>(null);

  // Live system state
  const [mongoStatus, setMongoStatus] = useState<MongoStatus | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // Helper to add toast alert
  const addToast = (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info', 
    ticketId?: string
  ) => {
    const newToast: ToastAlert = {
      id: `${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
      ticketId,
      timestamp: Date.now()
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    // Auto remove after 6s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 6000);
  };

  // 1. Initial Authentication Check
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await apiGetMe();
        setCurrentUser(user);
      } catch (err) {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();

    // Listen for unauthorized events to clear session
    const handleUnauthorized = () => {
      setCurrentUser(null);
      addToast('Session Expired', 'Please log in again.', 'warning');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // 2. Poll DB status
  useEffect(() => {
    async function checkDb() {
      const status = await apiGetDbStatus();
      setMongoStatus(status);
    }
    checkDb();
    const interval = setInterval(checkDb, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3. User Login effects: Fetch tickets and connect Socket.io
  useEffect(() => {
    if (!currentUser) {
      setTickets([]);
      return;
    }

    // Join Socket.io room
    joinUserRoom(currentUser.id);
    const socket = getSocket();
    setSocketConnected(socket.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Real-time event listeners
    const handleTicketCreated = (newTicket: Ticket) => {
      setTickets((prev) => {
        const exists = prev.some(t => t.ticketId === newTicket.ticketId);
        if (exists) return prev;
        return [newTicket, ...prev];
      });
      addToast(
        `Ticket Created: ${newTicket.ticketId}`,
        `AI triage complete: ${newTicket.priority} Priority, ${newTicket.slaHours}h SLA.`,
        'success',
        newTicket.ticketId
      );
    };

    const handleStatusChanged = (updatedTicket: Ticket) => {
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === updatedTicket.ticketId ? updatedTicket : t))
      );
      addToast(
        `Status Updated: ${updatedTicket.ticketId}`,
        `Ticket status changed to "${updatedTicket.status}".`,
        updatedTicket.status === 'Resolved' ? 'success' : updatedTicket.status === 'Escalated' ? 'error' : 'info',
        updatedTicket.ticketId
      );
    };

    const handleEscalated = (escalatedTicket: Ticket) => {
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === escalatedTicket.ticketId ? escalatedTicket : t))
      );
      addToast(
        `🚨 Escalated: ${escalatedTicket.ticketId}`,
        `Ticket breached SLA or was manually escalated to Support Engineering.`,
        'error',
        escalatedTicket.ticketId
      );
    };

    const handleMessage = (payload: { message: any; ticket: Ticket }) => {
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === payload.ticket.ticketId ? payload.ticket : t))
      );
      if (payload.message.isAi) {
        addToast(
          `AI Diagnostics Updated: ${payload.ticket.ticketId}`,
          payload.message.text.substring(0, 90) + '...',
          'info',
          payload.ticket.ticketId
        );
      }
    };

    socket.on('ticket:created', handleTicketCreated);
    socket.on('ticket:status_changed', handleStatusChanged);
    socket.on('ticket:escalated', handleEscalated);
    socket.on('ticket:message', handleMessage);

    // Initial fetch of user's tickets
    async function loadTickets() {
      setTicketsLoading(true);
      try {
        const list = await apiGetTickets();
        setTickets(list);
      } catch (err: any) {
        console.error('Failed to load tickets:', err);
      } finally {
        setTicketsLoading(false);
      }
    }

    loadTickets();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('ticket:created', handleTicketCreated);
      socket.off('ticket:status_changed', handleStatusChanged);
      socket.off('ticket:escalated', handleEscalated);
      socket.off('ticket:message', handleMessage);
    };
  }, [currentUser]);

  const handleLogout = () => {
    removeStoredToken();
    setCurrentUser(null);
    setSelectedTicketId(null);
    setTickets([]);
  };

  const handleUpdateTicket = (updated: Ticket) => {
    setTickets((prev) =>
      prev.map((t) => (t.ticketId === updated.ticketId ? updated : t))
    );
  };

  // If checking authentication state
  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#121212] text-[#F5F0E6] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#C0392B]/30 border-t-[#C0392B] rounded-full animate-spin" />
        <p className="text-xs text-[#8A8175] font-mono tracking-wider">
          INITIALIZING RESOLVEDESK SUPPORT...
        </p>
      </div>
    );
  }

  // App Flow Requirement: The Login page is the first thing shown at the root route.
  // No other page, dashboard, or data is visible before authentication.
  if (!currentUser) {
    return (
      <LoginPage 
        onSuccess={(user) => {
          setCurrentUser(user);
          addToast('Signed In', `Welcome back, ${user.name}.`, 'success');
        }} 
        mongoStatus={mongoStatus} 
        onStatusUpdated={(status) => setMongoStatus(status)}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#121212] text-[#F5F0E6] overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        mongoStatus={mongoStatus}
        socketConnected={socketConnected}
        onStatusUpdated={(status) => setMongoStatus(status)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {selectedTicketId ? (
          <TicketDetailView
            ticketId={selectedTicketId}
            currentUser={currentUser}
            onBack={() => setSelectedTicketId(null)}
            onOpenEscalate={(t) => setEscalatingTicket(t)}
            onUpdateTicket={handleUpdateTicket}
          />
        ) : (
          <UserDashboard
            tickets={tickets}
            loading={ticketsLoading}
            onSelectTicket={(id) => setSelectedTicketId(id)}
            onOpenNewTicket={() => setIsNewTicketOpen(true)}
          />
        )}
      </main>

      {/* New Ticket Modal */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        onCreated={(newTicket) => {
          setTickets((prev) => [newTicket, ...prev]);
          setSelectedTicketId(newTicket.ticketId);
          addToast(
            'Ticket Submitted',
            `Ticket ${newTicket.ticketId} created with AI diagnostics.`,
            'success',
            newTicket.ticketId
          );
        }}
      />

      {/* Escalate Modal */}
      <EscalateModal
        isOpen={Boolean(escalatingTicket)}
        ticket={escalatingTicket}
        onClose={() => setEscalatingTicket(null)}
        onEscalated={(updated) => {
          handleUpdateTicket(updated);
          addToast(
            'Escalation Confirmed',
            `Ticket ${updated.ticketId} dispatched to support team leadership.`,
            'warning',
            updated.ticketId
          );
        }}
      />

      {/* Toast Alert Notifications */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
        onSelectTicket={(tid) => setSelectedTicketId(tid)}
      />
    </div>
  );
}
