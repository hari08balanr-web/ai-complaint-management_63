import React, { useState, useEffect, useRef } from 'react';
import { Ticket, AuthUser } from '../types';
import { apiGetTicket, apiPostTicketMessage, apiAskAiReply, apiResolveTicket } from '../lib/api';
import { getSocket, joinTicketRoom, leaveTicketRoom } from '../lib/socket';
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Paperclip, 
  AlertOctagon, 
  Calendar, 
  ShieldAlert, 
  Terminal,
  Layers
} from 'lucide-react';
import Markdown from 'react-markdown';

interface TicketDetailViewProps {
  ticketId: string;
  currentUser: AuthUser;
  onBack: () => void;
  onOpenEscalate: (ticket: Ticket) => void;
  onUpdateTicket: (ticket: Ticket) => void;
}

const TIMELINE_STEPS = [
  { key: 'Submitted', label: 'Submitted' },
  { key: 'AI Reviewed', label: 'AI Reviewed' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Resolved', label: 'Resolved' }
];

export function TicketDetailView({
  ticketId,
  currentUser,
  onBack,
  onOpenEscalate,
  onUpdateTicket
}: TicketDetailViewProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [isBreached, setIsBreached] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch ticket and connect Socket.io room
  useEffect(() => {
    let isMounted = true;

    async function loadTicket() {
      try {
        setLoading(true);
        const data = await apiGetTicket(ticketId);
        if (isMounted) {
          setTicket(data);
          onUpdateTicket(data);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load ticket.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTicket();
    joinTicketRoom(ticketId);

    // Socket listeners for real-time live updates
    const socket = getSocket();

    const handleStatusChanged = (updated: Ticket) => {
      if (updated.ticketId === ticketId || (updated as any)._id === ticketId) {
        setTicket(updated);
        onUpdateTicket(updated);
      }
    };

    const handleMessageAdded = (payload: { message: any; ticket: Ticket }) => {
      if (payload.ticket.ticketId === ticketId || (payload.ticket as any)._id === ticketId) {
        setTicket(payload.ticket);
        onUpdateTicket(payload.ticket);
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleEscalated = (updated: Ticket) => {
      if (updated.ticketId === ticketId || (updated as any)._id === ticketId) {
        setTicket(updated);
        onUpdateTicket(updated);
      }
    };

    socket.on('ticket:status_changed', handleStatusChanged);
    socket.on('ticket:message', handleMessageAdded);
    socket.on('ticket:escalated', handleEscalated);

    return () => {
      isMounted = false;
      leaveTicketRoom(ticketId);
      socket.off('ticket:status_changed', handleStatusChanged);
      socket.off('ticket:message', handleMessageAdded);
      socket.off('ticket:escalated', handleEscalated);
    };
  }, [ticketId]);

  // 2. SLA countdown ticker
  useEffect(() => {
    if (!ticket) return;

    const updateSla = () => {
      const deadline = new Date(ticket.slaDeadline).getTime();
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setIsBreached(true);
        const overdue = Math.abs(diff);
        const hours = Math.floor(overdue / (1000 * 60 * 60));
        const mins = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
        setRemainingTime(`SLA Breached (${hours}h ${mins}m ago)`);
      } else {
        setIsBreached(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setRemainingTime(`${hours}h ${mins}m remaining`);
      }
    };

    updateSla();
    const interval = setInterval(updateSla, 15000);
    return () => clearInterval(interval);
  }, [ticket]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sending || !ticket) return;

    setSending(true);
    try {
      const res = await apiPostTicketMessage(ticket.ticketId, replyText.trim());
      setTicket(res.ticket);
      onUpdateTicket(res.ticket);
      setReplyText('');
    } catch (err: any) {
      alert(err.message || 'Failed to post reply.');
    } finally {
      setSending(false);
    }
  };

  const handleAskGemini = async () => {
    if (sending || generatingAi || !ticket) return;

    setGeneratingAi(true);
    try {
      const textToAsk = replyText.trim();
      if (textToAsk) {
        const res = await apiPostTicketMessage(ticket.ticketId, textToAsk, true);
        setTicket(res.ticket);
        onUpdateTicket(res.ticket);
        setReplyText('');
      } else {
        const res = await apiAskAiReply(ticket.ticketId);
        setTicket(res.ticket);
        onUpdateTicket(res.ticket);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI response.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleResolve = async () => {
    if (!ticket) return;
    try {
      const updated = await apiResolveTicket(ticket.ticketId);
      setTicket(updated);
      onUpdateTicket(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to mark ticket resolved.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] text-[#F5F0E6] p-8 space-y-4">
        <div className="w-8 h-8 border-2 border-[#C0392B]/30 border-t-[#C0392B] rounded-full animate-spin" />
        <p className="text-xs text-[#8A8175]">Loading ticket details from MongoDB...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#121212] text-[#F5F0E6] p-8">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-[#C0392B] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#F5F0E6] mb-2">Ticket Unavailable</h2>
          <p className="text-xs text-[#8A8175] mb-6">{error || 'This ticket could not be found.'}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] text-xs font-semibold text-[#D1C7B7] transition cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isResolved = ticket.status === 'Resolved';
  const isEscalated = ticket.status === 'Escalated' || ticket.escalationDetails?.isEscalated;

  return (
    <div className="flex-1 flex flex-col bg-[#121212] text-[#F5F0E6] overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-[#242424] bg-[#161616] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#1F1F1F] hover:bg-[#282828] text-[#8A8175] hover:text-[#F5F0E6] transition cursor-pointer"
            title="Back to Tickets"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#C0392B]">{ticket.ticketId}</span>
              <span className="text-xs text-[#8A8175]">&bull;</span>
              <span className="text-xs text-[#8A8175]">{ticket.category}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[#F5F0E6] tracking-tight truncate max-w-xl">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Status badges & CTAs */}
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            ticket.priority === 'Critical' ? 'bg-red-950/80 text-red-400 border border-red-800/60' :
            ticket.priority === 'High' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' :
            'bg-slate-800 text-slate-300 border border-slate-700'
          }`}>
            {ticket.priority}
          </span>

          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            ticket.status === 'Resolved' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' :
            ticket.status === 'Escalated' ? 'bg-red-950 text-red-300 border border-red-700 animate-pulse' :
            'bg-[#2A2A2A] text-[#D1C7B7] border border-[#3A3A3A]'
          }`}>
            {ticket.status}
          </span>

          {!isResolved && !isEscalated && (
            <button
              onClick={() => onOpenEscalate(ticket)}
              className="px-3 py-1.5 rounded-xl bg-[#251A1A] hover:bg-[#381F1F] text-[#E74C3C] border border-[#C0392B]/40 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Escalate Ticket</span>
            </button>
          )}

          {!isResolved && (
            <button
              onClick={handleResolve}
              className="px-3.5 py-1.5 rounded-xl bg-[#1C2820] hover:bg-[#243B2C] text-emerald-400 border border-emerald-800/50 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Resolved</span>
            </button>
          )}
        </div>
      </div>

      {/* SLA & Timeline Banner */}
      <div className="px-6 py-3 border-b border-[#222] bg-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        {/* Visual Timeline: Submitted -> AI Reviewed -> In Progress -> (Escalated) -> Resolved */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-[#8A8175] text-[11px] uppercase font-semibold mr-1">Progress:</span>
          {['Submitted', 'AI Reviewed', 'In Progress', ...(isEscalated ? ['Escalated'] : []), 'Resolved'].map((step, idx, arr) => {
            const isCurrent = ticket.status === step;
            const isPassed = !isCurrent && (
              step === 'Submitted' ||
              (step === 'AI Reviewed' && ['In Progress', 'Escalated', 'Resolved'].includes(ticket.status)) ||
              (step === 'In Progress' && ['Escalated', 'Resolved'].includes(ticket.status)) ||
              (step === 'Escalated' && ticket.status === 'Resolved')
            );

            return (
              <React.Fragment key={step}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${
                    isCurrent 
                      ? step === 'Escalated' ? 'bg-[#C0392B] ring-2 ring-red-500/40' : 'bg-[#C0392B] ring-2 ring-red-500/30'
                      : isPassed ? 'bg-emerald-500' : 'bg-[#333]'
                  }`} />
                  <span className={`${
                    isCurrent ? 'text-[#F5F0E6] font-bold' : isPassed ? 'text-[#D1C7B7]' : 'text-[#666]'
                  }`}>
                    {step}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`w-4 h-[1px] ${isPassed ? 'bg-emerald-600' : 'bg-[#2A2A2A]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* SLA Status Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <Clock className={`w-3.5 h-3.5 ${isBreached ? 'text-[#E74C3C]' : 'text-emerald-400'}`} />
          <span className="text-[#8A8175]">Target SLA ({ticket.slaHours}h):</span>
          <span className={`font-mono font-semibold ${isBreached ? 'text-[#E74C3C]' : 'text-emerald-400'}`}>
            {remainingTime}
          </span>
        </div>
      </div>

      {/* Main Thread Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Original Description Card */}
        <div className="bg-[#181818] border border-[#282828] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3 text-xs text-[#8A8175]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#F5F0E6]">{ticket.requesterName}</span>
              <span>({ticket.requesterEmail})</span>
            </div>
            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
          </div>

          <p className="text-sm text-[#F5F0E6] whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </p>

          {ticket.attachment && (
            <div className="mt-4 pt-3 border-t border-[#262626] flex items-center gap-2 text-xs text-[#D1C7B7]">
              <Paperclip className="w-3.5 h-3.5 text-[#8A8175]" />
              <span className="font-mono text-[11px] text-[#C0392B]">Attachment:</span>
              <a 
                href={ticket.attachment.url} 
                target="_blank" 
                rel="noreferrer"
                className="underline hover:text-[#F5F0E6] truncate max-w-sm"
              >
                {ticket.attachment.name}
              </a>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="space-y-4 pt-2">
          {ticket.messages.map((msg, index) => {
            if (msg.isAi) {
              return (
                /* Distinct AI Assistant Message Bubble */
                <div key={msg.id || index} className="flex items-start gap-3.5 max-w-3xl animate-fadeIn">
                  <div className="w-8 h-8 rounded-xl bg-[#C0392B] border border-red-500/30 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-red-950/50">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-[#1C1C1C] border-l-4 border-l-[#C0392B] border-y border-r border-[#2C2C2C] rounded-2xl p-5 shadow-xl shadow-black/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F5F0E6] tracking-wide">
                          {msg.sender || 'AI Assistant'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#C0392B]/20 text-[#E74C3C] text-[10px] font-bold uppercase tracking-wider border border-[#C0392B]/30">
                          Automated Diagnostics
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8A8175]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs text-[#D1C7B7] space-y-2 leading-relaxed prose prose-invert max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                </div>
              );
            }

            const isCurrentUser = msg.senderEmail === currentUser.email;

            return (
              /* User / Support human message bubble */
              <div
                key={msg.id || index}
                className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} animate-fadeIn`}
              >
                <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-[#8A8175]">
                  <span className="font-semibold text-[#D1C7B7]">{msg.sender}</span>
                  <span>&bull;</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div
                  className={`max-w-xl rounded-2xl px-5 py-3.5 text-xs leading-relaxed shadow-md ${
                    isCurrentUser
                      ? 'bg-[#262626] border border-[#383838] text-[#F5F0E6]'
                      : 'bg-[#1C1C1C] border border-[#2D2D2D] text-[#D1C7B7]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Input Bar */}
      <div className="p-4 border-t border-[#242424] bg-[#161616]">
        {isResolved ? (
          <div className="p-3 bg-[#1C2820] border border-emerald-900/50 rounded-xl text-center text-xs text-emerald-300 font-medium">
            This ticket has been marked as <strong>Resolved</strong>. If you require further assistance, submit a new service request.
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="flex items-center gap-3 max-w-5xl mx-auto">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply or additional error logs..."
              disabled={sending}
              className="flex-1 px-4 py-3 bg-[#121212] border border-[#2D2D2D] focus:border-[#C0392B] rounded-xl text-xs text-[#F5F0E6] placeholder-[#555] outline-none transition"
            />
            <button
              type="button"
              onClick={handleAskGemini}
              disabled={sending || generatingAi}
              className="px-4 py-3 bg-[#241A1A] hover:bg-[#331C1C] border border-[#C0392B]/50 hover:border-[#C0392B] text-[#F5B7B1] text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title="Request direct technical response & diagnostics from Gemini AI"
            >
              {generatingAi ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  <span className="hidden sm:inline">Gemini Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Ask Gemini AI</span>
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={sending || generatingAi || !replyText.trim()}
              className="px-5 py-3 bg-[#C0392B] hover:bg-[#A93226] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-red-950/40"
            >
              {sending ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
