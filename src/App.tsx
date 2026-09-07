/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AnalyticsBar } from './components/AnalyticsBar';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { DashboardView } from './components/DashboardView';
import { EscalationsView } from './components/EscalationsView';
import { DiagnosticsHubView } from './components/DiagnosticsHubView';
import { AiChatView } from './components/AiChatView';
import { ComplaintsView } from './components/ComplaintsView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { SignInPage } from './components/SignInPage';
import { NewTicketModal } from './components/NewTicketModal';
import { AiChatbotModal } from './components/AiChatbotModal';
import { ServiceTicket, ActiveView } from './types';
import { subscribeTickets, resetToSampleTickets } from './services/ticketService';
import { auth, onAuthStateChanged, User } from './lib/firebase';
import { 
  Bot, 
  Sparkles, 
  LifeBuoy, 
  PlusCircle, 
  MessageSquareCode, 
  Inbox, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [role, setRole] = useState<'customer' | 'support_agent'>('customer');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Modals
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [initialTicketData, setInitialTicketData] = useState<{ title?: string; description?: string } | undefined>(undefined);

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Ticket Synchronization (Firestore + Local fallback)
  useEffect(() => {
    const unsubscribeTickets = subscribeTickets(
      (updatedTickets) => {
        setTickets(updatedTickets);
        // Default select first ticket if none selected on desktop
        if (updatedTickets.length > 0) {
          setSelectedTicketId((prev) => prev || updatedTickets[0].id);
        }
      },
      (error) => {
        console.warn('Real-time sync alert:', error);
      }
    );

    return () => unsubscribeTickets();
  }, []);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  const handleTicketCreated = (newTicket: ServiceTicket) => {
    setSelectedTicketId(newTicket.id);
    setActiveView('tickets');
  };

  const handleConvertToTicketFromChat = (title: string, description: string) => {
    setInitialTicketData({ title, description });
    setIsNewTicketOpen(true);
  };

  const handleResetData = async () => {
    try {
      await resetToSampleTickets();
    } catch (e) {
      console.warn('Workspace sync warning:', e);
    }
  };

  const handleOpenTicketDetails = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveView('tickets');
  };

  // 1. Loading Authentication State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse mb-4 shadow-xl shadow-indigo-500/25">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <p className="text-sm font-bold tracking-tight text-slate-200">Initializing NexusSupport...</p>
        <p className="text-xs text-slate-500 mt-1">Verifying secure authentication session</p>
      </div>
    );
  }

  // 2. Compulsory Sign-In: If not authenticated, require sign-in first
  if (!user) {
    return (
      <SignInPage
        currentRole={role}
        setRole={setRole}
        onSignedIn={(signedInUser, selectedRole) => {
          setUser(signedInUser);
          setRole(selectedRole);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-100/70 text-slate-900 font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        role={role}
        setRole={setRole}
        tickets={tickets}
        user={user}
        onOpenNewTicket={() => {
          setInitialTicketData(undefined);
          setIsNewTicketOpen(true);
        }}
        onResetData={handleResetData}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
        
        {/* Top Global Header */}
        <Header
          user={user}
          role={role}
          setRole={setRole}
          onOpenNewTicket={() => {
            setInitialTicketData(undefined);
            setIsNewTicketOpen(true);
          }}
          onOpenAiChat={() => setIsAiChatOpen(true)}
          onResetData={handleResetData}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Dynamic Views */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
          
          {/* 1. Dashboard View */}
          {activeView === 'dashboard' && (
            <DashboardView
              tickets={tickets}
              onSelectTicket={handleOpenTicketDetails}
              setActiveView={setActiveView}
              onOpenNewTicket={() => {
                setInitialTicketData(undefined);
                setIsNewTicketOpen(true);
              }}
              role={role}
            />
          )}

          {/* 2. Tickets View (List + Detail Workbench) */}
          {activeView === 'tickets' && (
            <div className="flex flex-col flex-1">
              {/* Role Banner & Quick Guide */}
              <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    role === 'customer' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {role === 'customer' ? <Sparkles className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Current Mode: <span className="text-indigo-600">{role === 'customer' ? 'Customer / Requester Portal' : 'Tier 2 Support Engineering Desk'}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {role === 'customer'
                        ? 'Submit issues, receive instant Gemini root-cause diagnostics, and escalate to human engineers.'
                        : 'Review AI diagnostic dossiers, manage status, add internal engineering notes, and resolve escalated tickets.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setRole(role === 'customer' ? 'support_agent' : 'customer')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <span>Switch to {role === 'customer' ? 'Agent View' : 'Customer View'}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Analytics KPI Ribbon */}
              <AnalyticsBar tickets={tickets} />

              {/* Dynamic Responsive Layout: List & Detail */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[600px]">
                
                {/* Left / List View: 4 columns on large screens, hidden on small screens if ticket selected */}
                <div className={`lg:col-span-4 h-full ${selectedTicket ? 'hidden lg:block' : 'block'}`}>
                  <TicketList
                    tickets={tickets}
                    selectedTicketId={selectedTicketId}
                    onSelectTicket={(ticket) => setSelectedTicketId(ticket.id)}
                    role={role}
                  />
                </div>

                {/* Right / Detail View: 8 columns on large screens */}
                <div className={`lg:col-span-8 h-full ${!selectedTicket ? 'hidden lg:block' : 'block'}`}>
                  {selectedTicket ? (
                    <TicketDetail
                      ticket={selectedTicket}
                      onBack={() => setSelectedTicketId(null)}
                      currentUser={user}
                      role={role}
                    />
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Inbox className="w-8 h-8" />
                      </div>
                      <div className="max-w-md space-y-1">
                        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                          No Ticket Selected
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Select a ticket from the left panel to inspect its Gemini diagnostic analysis, activity timeline, and escalation options.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsNewTicketOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Submit New Request
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAiChatOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <MessageSquareCode className="w-4 h-4 text-indigo-600" />
                          AI Troubleshooter
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 3. Tier 2 Escalations View */}
          {activeView === 'escalations' && (
            <EscalationsView
              tickets={tickets}
              onSelectTicket={handleOpenTicketDetails}
              role={role}
            />
          )}

          {/* 4. AI Diagnostics Sandbox & Batch Analyzer */}
          {activeView === 'diagnostics' && (
            <DiagnosticsHubView
              tickets={tickets}
              onSelectTicket={handleOpenTicketDetails}
              onOpenNewTicketWithData={(data) => {
                setInitialTicketData(data);
                setIsNewTicketOpen(true);
              }}
            />
          )}

          {/* 5. AI Troubleshooting Assistant */}
          {activeView === 'chat' && (
            <AiChatView
              onConvertToTicket={handleConvertToTicketFromChat}
            />
          )}

          {/* 6. Service Complaints & SLA Monitor */}
          {activeView === 'complaints' && (
            <ComplaintsView
              tickets={tickets}
              onSelectTicket={handleOpenTicketDetails}
              onOpenNewTicketWithData={(data) => {
                setInitialTicketData(data);
                setIsNewTicketOpen(true);
              }}
            />
          )}

          {/* 7. Knowledge Base & Runbooks */}
          {activeView === 'knowledge' && (
            <KnowledgeBaseView
              setActiveView={setActiveView}
              onOpenNewTicketWithData={(data) => {
                setInitialTicketData(data);
                setIsNewTicketOpen(true);
              }}
            />
          )}

        </main>
      </div>

      {/* New Ticket Modal */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        user={user}
        onTicketCreated={handleTicketCreated}
        initialData={initialTicketData}
      />

      {/* Interactive Gemini Chatbot Modal */}
      <AiChatbotModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        onConvertToTicket={handleConvertToTicketFromChat}
      />

    </div>
  );
}
