import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket, 
  TicketMessage, 
  EscalationLogEntry, 
  AppUser, 
  TicketStatus 
} from '../types';
import { 
  subscribeToTicket, 
  subscribeToTicketMessages, 
  subscribeToEscalationLogs, 
  addTicketMessage, 
  updateTicketStatus, 
  assignTicketAgent 
} from '../lib/firebase';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  ShieldAlert, 
  Paperclip, 
  ArrowLeft, 
  UserCheck, 
  ChevronRight,
  History,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TicketDetailViewProps {
  ticketId: string;
  currentUser: AppUser | null;
  onBack: () => void;
  onOpenEscalate: (ticket: Ticket) => void;
  onStatusChangeNotify: (oldStatus: TicketStatus, newStatus: TicketStatus, ticket: Ticket) => void;
}

export const TicketDetailView: React.FC<TicketDetailViewProps> = ({
  ticketId,
  currentUser,
  onBack,
  onOpenEscalate,
  onStatusChangeNotify
}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [escalationLogs, setEscalationLogs] = useState<EscalationLogEntry[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [activeTab, setActiveTab] = useState<'thread' | 'escalationLog'>('thread');
  const [remainingTimeText, setRemainingTimeText] = useState('');
  const [isSlaBreached, setIsSlaBreached] = useState(false);

  const prevStatusRef = useRef<TicketStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Subscribe to Ticket Document in real-time
  useEffect(() => {
    const unsubscribe = subscribeToTicket(ticketId, (updatedTicket) => {
      if (updatedTicket) {
        if (prevStatusRef.current && prevStatusRef.current !== updatedTicket.status) {
          onStatusChangeNotify(prevStatusRef.current, updatedTicket.status, updatedTicket);
        }
        prevStatusRef.current = updatedTicket.status;
      }
      setTicket(updatedTicket);
    });
    return () => unsubscribe();
  }, [ticketId, onStatusChangeNotify]);

  // 2. Subscribe to Ticket Messages in real-time
  useEffect(() => {
    const unsubscribe = subscribeToTicketMessages(ticketId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => unsubscribe();
  }, [ticketId]);

  // 3. Subscribe to Escalation Logs in real-time
  useEffect(() => {
    const unsubscribe = subscribeToEscalationLogs(ticketId, (logs) => {
      setEscalationLogs(logs);
    });
    return () => unsubscribe();
  }, [ticketId]);

  // SLA Timer Countdown
  useEffect(() => {
    if (!ticket) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = ticket.slaDeadline - now;

      if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        setRemainingTimeText('Resolved within SLA');
        setIsSlaBreached(false);
        return;
      }

      if (diff <= 0) {
        setIsSlaBreached(true);
        const overdueHours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
        const overdueMins = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));
        setRemainingTimeText(`⚠️ BREACHED by ${overdueHours}h ${overdueMins}m`);
      } else {
        setIsSlaBreached(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setRemainingTimeText(`${hours}h ${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 10000);
    return () => clearInterval(interval);
  }, [ticket]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !currentUser || !ticket) return;

    setIsSending(true);
    const content = replyText.trim();
    setReplyText('');

    try {
      const senderType = currentUser.role === 'admin' || currentUser.role === 'agent' ? 'agent' : 'user';
      await addTicketMessage(ticket.id, currentUser.uid, currentUser.name, senderType, content);

      // If user replies and ticket was Resolved, reopen it to In Progress
      if (senderType === 'user' && (ticket.status === 'Resolved' || ticket.status === 'Closed')) {
        await updateTicketStatus(ticket.id, 'In Progress');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // AI draft reply for Support Agents
  const handleAiDraftReply = async () => {
    if (!ticket) return;
    setIsDraftingAi(true);
    try {
      const res = await fetch('/api/ai/agent-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket: {
            title: ticket.title,
            category: ticket.category,
            requesterName: ticket.requesterName,
            ticketNumber: ticket.ticketId,
            messages: messages.slice(-4).map(m => ({ sender: m.senderName, text: m.content }))
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.draftReply) {
          setReplyText(data.draftReply);
        }
      }
    } catch (err) {
      console.warn('AI assist draft failed:', err);
    } finally {
      setIsDraftingAi(false);
    }
  };

  // Assign to logged-in agent
  const handleAssignToMe = async () => {
    if (!ticket || !currentUser) return;
    try {
      await assignTicketAgent(ticket.id, currentUser.uid, currentUser.name);
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    }
  };

  // Status transition handler
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      await updateTicketStatus(ticket.id, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Loading ticket #{ticketId} from Firestore...</p>
        </div>
      </div>
    );
  }

  const isStaff = currentUser?.role === 'agent' || currentUser?.role === 'admin';

  // Stepper logic
  const steps: { label: string; done: boolean; current: boolean }[] = [
    { label: 'Submitted', done: true, current: false },
    { label: 'AI Reviewed', done: true, current: false },
    { 
      label: 'Assigned', 
      done: Boolean(ticket.assignedAgentId) || ticket.status !== 'Open', 
      current: ticket.status === 'Open' && !ticket.assignedAgentId 
    },
    { 
      label: ticket.status === 'Escalated' ? `Escalated (T${ticket.escalationLevel})` : 'In Progress', 
      done: ticket.status === 'In Progress' || ticket.status === 'Escalated' || ticket.status === 'Resolved' || ticket.status === 'Closed', 
      current: ticket.status === 'In Progress' || ticket.status === 'Escalated' 
    },
    { 
      label: 'Resolved', 
      done: ticket.status === 'Resolved' || ticket.status === 'Closed', 
      current: ticket.status === 'Resolved' || ticket.status === 'Closed' 
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Back button & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Back to Tickets"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {ticket.ticketId}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                  ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                  ticket.status === 'Escalated' ? 'bg-rose-100 text-rose-800 font-bold' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {ticket.status}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  ticket.priority === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  ticket.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {ticket.priority} Priority
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  • {ticket.category}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
                {ticket.title}
              </h1>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Escalate button */}
            <button
              onClick={() => onOpenEscalate(ticket)}
              id="ticket-escalate-btn"
              className="py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Escalate Ticket</span>
            </button>

            {/* Staff status selector */}
            {isStaff && (
              <div className="flex items-center gap-1.5">
                {!ticket.assignedAgentId && (
                  <button
                    onClick={handleAssignToMe}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                  >
                    Assign to Me
                  </button>
                )}

                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="py-1.5 px-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Open">Status: Open</option>
                  <option value="In Progress">Status: In Progress</option>
                  <option value="Escalated">Status: Escalated</option>
                  <option value="Resolved">Status: Resolved</option>
                  <option value="Closed">Status: Closed</option>
                </select>
              </div>
            )}

            {!isStaff && ticket.status !== 'Resolved' && (
              <button
                onClick={() => handleStatusChange('Resolved')}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Resolved</span>
              </button>
            )}
          </div>
        </div>

        {/* Stepper / Timeline Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2 text-xs overflow-x-auto py-1">
            {steps.map((step, idx) => (
              <React.Fragment key={step.label}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.done 
                      ? 'bg-blue-600 text-white' 
                      : step.current 
                      ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <span className={`font-medium ${
                    step.done ? 'text-slate-800 font-semibold' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* SLA Countdown Display */}
          <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 ${
            isSlaBreached 
              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>SLA: {remainingTimeText}</span>
          </div>
        </div>
      </div>

      {/* Main Area: 2 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Message Thread */}
        <div className="flex-1 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
          {/* Sub-header tabs */}
          <div className="px-6 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('thread')}
                className={`pb-1 border-b-2 transition ${
                  activeTab === 'thread' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Conversation Thread ({messages.length})
              </button>
              <button
                onClick={() => setActiveTab('escalationLog')}
                className={`pb-1 border-b-2 flex items-center gap-1 transition ${
                  activeTab === 'escalationLog' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Escalation History ({escalationLogs.length})</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Live Firestore Sync Active
            </span>
          </div>

          {/* Thread View */}
          {activeTab === 'thread' ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Original ticket description post */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {ticket.requesterName.slice(0, 2)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">{ticket.requesterName}</span>
                      <span className="text-[10px] text-slate-400 ml-2">Ticket Requester</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </p>

                {ticket.attachmentUrl && (
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-xs text-blue-600">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="font-medium truncate max-w-xs">{ticket.attachmentName || 'Attached File'}</span>
                  </div>
                )}
              </div>

              {/* Message thread items */}
              {messages.map((m) => {
                const isAi = m.senderType === 'AI';
                const isAgent = m.senderType === 'agent';
                const isUser = m.senderType === 'user';

                return (
                  <div 
                    key={m.id}
                    className={`flex flex-col space-y-1.5 ${
                      isAi 
                        ? 'p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-indigo-200/80' 
                        : isAgent
                        ? 'p-4 rounded-xl bg-amber-50/40 border border-amber-200/60'
                        : 'p-4 rounded-xl bg-white border border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isAi ? (
                          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        ) : isAgent ? (
                          <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
                            🎧
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <span className="text-xs font-bold text-slate-900">
                          {m.senderName}
                        </span>

                        {isAi && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            Automated First Response
                          </span>
                        )}
                        {isAgent && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Support Engineer
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed pl-8">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            /* Escalation Log Tab */
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Audit Trail & Escalation Log
              </h3>
              {escalationLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No escalations recorded. The ticket is running within initial SLA parameters.
                </div>
              ) : (
                escalationLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-rose-900">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Escalated: Tier {log.fromLevel} → Tier {log.toLevel}
                      </span>
                      <span className="text-[10px] text-rose-700 font-normal">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-800">
                      <strong>Reason:</strong> {log.reason}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      <strong>Initiator:</strong> {log.triggeredBy}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Reply Box */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Reply as <strong>{currentUser?.name || 'Guest'}</strong></span>
                {isStaff && (
                  <button
                    type="button"
                    onClick={handleAiDraftReply}
                    disabled={isDraftingAi}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isDraftingAi ? 'AI Drafting...' : 'Draft Response with AI Assist'}</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here (Markdown supported)..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Press Send to post immediately to the thread
                </span>
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Sidebar: Ticket Metadata & Agent Details */}
        <div className="w-80 bg-slate-50/50 p-6 space-y-6 overflow-y-auto hidden lg:block border-l border-slate-200 text-xs">
          {/* SLA Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SLA Compliance
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Target Resolution:</span>
              <span className="font-semibold text-slate-900">
                {new Date(ticket.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(ticket.slaDeadline).toLocaleDateString()})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Escalation Tier:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                ticket.escalationLevel > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
              }`}>
                Tier {ticket.escalationLevel}
              </span>
            </div>
          </div>

          {/* Requester Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Requester Details
            </span>
            <div className="text-sm font-bold text-slate-900">{ticket.requesterName}</div>
            <div className="text-slate-500">{ticket.requesterEmail}</div>
            <div className="text-[11px] text-slate-400 pt-1">
              Customer ID: {ticket.userId.slice(0, 8)}
            </div>
          </div>

          {/* Assigned Agent Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Assigned Specialist
            </span>
            {ticket.assignedAgentName ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  {ticket.assignedAgentName.slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{ticket.assignedAgentName}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Assigned Engineer</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic">Unassigned (In Triage Queue)</div>
            )}
          </div>

          {/* Ticket Metadata */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ticket Details
            </span>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Category:</span>
              <span className="font-semibold text-slate-800">{ticket.category}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Created:</span>
              <span className="text-slate-700">{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Last Activity:</span>
              <span className="text-slate-700">{new Date(ticket.updatedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
