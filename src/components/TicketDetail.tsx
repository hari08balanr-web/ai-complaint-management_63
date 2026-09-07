import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Clock, 
  ShieldAlert, 
  Cpu, 
  Code2, 
  User, 
  Bot, 
  Headphones, 
  FileText, 
  Check, 
  Loader2, 
  CornerDownRight,
  Flame,
  MessageSquare,
  Wrench,
  ChevronDown
} from 'lucide-react';
import { 
  ServiceTicket, 
  TicketMessage, 
  TicketStatus, 
  TicketPriority 
} from '../types';
import { 
  addTicketMessage, 
  updateTicketStatus, 
  escalateTicket, 
  addInternalNote 
} from '../services/ticketService';
import { 
  requestEscalationSummary, 
  requestAgentAssist 
} from '../services/aiService';
import { User as FirebaseUser } from '../lib/firebase';

interface TicketDetailProps {
  ticket: ServiceTicket;
  onBack: () => void;
  currentUser: FirebaseUser | null;
  role: 'customer' | 'support_agent';
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket,
  onBack,
  currentUser,
  role
}) => {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Escalation Modal / State
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('AI troubleshooting steps did not resolve the problem');
  const [isEscalating, setIsEscalating] = useState(false);

  // Agent Assist Drafting
  const [isDraftingReply, setIsDraftingReply] = useState(false);

  // Internal Note State
  const [internalNoteText, setInternalNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Send new message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    setIsSending(true);
    try {
      const senderType = role === 'support_agent' ? 'agent' : 'user';
      const senderName = role === 'support_agent' 
        ? (currentUser?.displayName || 'Support Engineer (Tier 2)')
        : (currentUser?.displayName || ticket.requesterName);

      const newMessage: TicketMessage = {
        id: `msg-${Date.now()}`,
        sender: senderType,
        senderName,
        timestamp: new Date().toISOString(),
        text: replyText.trim()
      };

      await addTicketMessage(ticket.id, newMessage);
      setReplyText('');

      // If user replies after diagnostics, ensure status is In Progress
      if (ticket.status === 'New' || ticket.status === 'AI Diagnostics') {
        await updateTicketStatus(ticket.id, 'In Progress');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // One-click AI Agent Assist (drafts technical reply)
  const handleAiDraftReply = async () => {
    setIsDraftingReply(true);
    try {
      const draft = await requestAgentAssist(ticket, 'empathic and technical');
      setReplyText(draft);
    } catch (err) {
      console.error('Error drafting response:', err);
    } finally {
      setIsDraftingReply(false);
    }
  };

  // Mark as Resolved
  const handleMarkResolved = async () => {
    try {
      await updateTicketStatus(ticket.id, 'Resolved');
      const resolveMsg: TicketMessage = {
        id: `msg-${Date.now()}-res`,
        sender: role === 'support_agent' ? 'agent' : 'user',
        senderName: currentUser?.displayName || (role === 'support_agent' ? 'Support Engineer' : ticket.requesterName),
        timestamp: new Date().toISOString(),
        text: `**Ticket marked as Resolved.** All requested service items and technical investigations have been addressed.`
      };
      await addTicketMessage(ticket.id, resolveMsg);
    } catch (err) {
      console.error('Error marking resolved:', err);
    }
  };

  // Perform Escalation to Tier 2 Support with AI Handover Summary
  const handleConfirmEscalation = async () => {
    setIsEscalating(true);
    try {
      // 1. Generate Executive AI Handover Summary via Gemini
      const handoverSummary = await requestEscalationSummary(ticket, escalationReason);
      
      const escalationMessage: TicketMessage = {
        id: `msg-${Date.now()}-esc`,
        sender: 'ai',
        senderName: 'Gemini Escalation Router',
        timestamp: new Date().toISOString(),
        text: `### 🚨 Ticket Escalated to Human Support Team\n\n**Escalation Reason:** ${escalationReason}\n\n${handoverSummary}\n\n*A Tier 2 Systems Engineer has been assigned to this ticket with a guaranteed SLA.*`
      };

      await escalateTicket(
        ticket.id, 
        {
          escalatedBy: currentUser?.displayName || ticket.requesterName,
          escalationReason,
          assignedTeam: ticket.aiAnalysis?.recommendedDepartment || 'Tier 2 Engineering',
          assignedAgent: 'On-Call Operations Lead',
          aiHandoverSummary: handoverSummary,
          slaTargetHours: ticket.priority === 'Critical' ? 2 : 8
        },
        escalationMessage
      );

      setShowEscalationModal(false);
    } catch (err) {
      console.error('Error escalating ticket:', err);
    } finally {
      setIsEscalating(false);
    }
  };

  // Add Internal Note (Agent only)
  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      await addInternalNote(ticket.id, `[${currentUser?.displayName || 'Support Agent'}]: ${internalNoteText.trim()}`);
      setInternalNoteText('');
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const getPriorityPill = (p: TicketPriority) => {
    switch (p) {
      case 'Critical':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1"><Flame className="w-3 h-3 text-rose-600" /> Critical SLA</span>;
      case 'High':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">High Priority</span>;
      case 'Medium':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Medium Priority</span>;
      case 'Low':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Low Priority</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      
      {/* 1. Header Bar */}
      <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Back button, Ticket Number, Category */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
            title="Back to ticket list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-sm text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {ticket.ticketNumber}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {ticket.category}
              </span>
              {getPriorityPill(ticket.priority)}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 line-clamp-1">
              {ticket.title}
            </h2>
          </div>
        </div>

        {/* Right: Actions (Status Changer, Escalate, Resolve) */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          
          {/* Status Changer (For Support Agents) */}
          {role === 'support_agent' && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-xs">
              <span>Status:</span>
              <select
                value={ticket.status}
                onChange={(e) => updateTicketStatus(ticket.id, e.target.value as TicketStatus)}
                className="bg-transparent font-bold text-indigo-700 focus:outline-hidden cursor-pointer"
              >
                <option value="New">New</option>
                <option value="AI Diagnostics">AI Diagnostics</option>
                <option value="In Progress">In Progress</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          )}

          {/* Escalate CTA (If not already escalated and not resolved) */}
          {!ticket.escalation.isEscalated && ticket.status !== 'Resolved' && (
            <button
              type="button"
              id="escalate-ticket-btn"
              onClick={() => setShowEscalationModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Escalate to Support</span>
            </button>
          )}

          {/* Resolve Ticket CTA */}
          {ticket.status !== 'Resolved' && (
            <button
              type="button"
              id="resolve-ticket-btn"
              onClick={handleMarkResolved}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Resolved</span>
            </button>
          )}

        </div>

      </div>

      {/* 2. Main Content Split Grid: Left Details & Right Live Communication */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        {/* Left Column: Diagnostics, Logs, Escalation Brief (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-200/80 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
          
          {/* Escalation Dossier Banner (If escalated) */}
          {ticket.escalation.isEscalated && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-700 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Escalated to {ticket.escalation.assignedTeam || 'Tier 2 Engineering'}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800">
                  SLA: {ticket.escalation.slaTargetHours || 4}h Target
                </span>
              </div>
              <p className="text-xs text-rose-900 font-medium">
                <strong>Reason:</strong> {ticket.escalation.escalationReason || 'Troubleshooting unaddressed.'}
              </p>
              {ticket.escalation.assignedAgent && (
                <p className="text-xs text-rose-800">
                  <strong>Assigned Engineer:</strong> {ticket.escalation.assignedAgent}
                </p>
              )}
              {ticket.escalation.aiHandoverSummary && (
                <div className="mt-2 p-2.5 rounded-lg bg-white/80 border border-rose-100 text-xs text-slate-800 leading-relaxed font-sans">
                  <span className="font-bold text-rose-900 block mb-1">AI Executive Brief:</span>
                  <div className="whitespace-pre-wrap">{ticket.escalation.aiHandoverSummary}</div>
                </div>
              )}
            </div>
          )}

          {/* Gemini AI Diagnostics Card */}
          {ticket.aiAnalysis && (
            <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-indigo-900 uppercase tracking-wider">
                    Gemini AI Technical Analysis
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/50">
                  {ticket.aiAnalysis.confidenceScore}% Confidence
                </span>
              </div>

              {/* Root Cause Hypothesis */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Root Cause Hypothesis
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {ticket.aiAnalysis.rootCauseHypothesis}
                </p>
              </div>

              {/* Suggested Fix Steps */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Actionable Remediation Steps
                </span>
                <div className="space-y-1.5">
                  {ticket.aiAnalysis.suggestedFixSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        {idx + 1}
                      </div>
                      <span className="leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metric badges */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Severity Score</span>
                  <span className="font-black text-indigo-700 text-sm">{ticket.aiAnalysis.severityScore} / 10</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Target Dept</span>
                  <span className="font-medium text-slate-700 text-xs truncate block">{ticket.aiAnalysis.recommendedDepartment}</span>
                </div>
              </div>

              {/* Tags */}
              {ticket.aiAnalysis.tags && ticket.aiAnalysis.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {ticket.aiAnalysis.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ticket Technical Context (Requester, Environment, Error logs) */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Service Request Details
            </h4>

            <div className="space-y-1 text-slate-600">
              <div><strong>Requester:</strong> {ticket.requesterName} ({ticket.requesterEmail})</div>
              <div><strong>Lodged:</strong> {new Date(ticket.createdAt).toLocaleString()}</div>
              {ticket.systemEnvironment && (
                <div className="flex items-start gap-1 pt-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>Environment:</strong> {ticket.systemEnvironment}</span>
                </div>
              )}
            </div>

            {/* Error logs */}
            {ticket.errorLogs && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-slate-400" />
                  Captured Error Logs
                </span>
                <div className="p-2 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-tight">
                  {ticket.errorLogs}
                </div>
              </div>
            )}
          </div>

          {/* Internal Notes (Agent View) */}
          {role === 'support_agent' && (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs space-y-2.5">
              <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                Support Engineering Internal Notes
              </h4>
              
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {ticket.escalation.internalNotes && ticket.escalation.internalNotes.length > 0 ? (
                  ticket.escalation.internalNotes.map((n, i) => (
                    <div key={i} className="p-2 rounded bg-white text-slate-700 text-xs border border-amber-100 shadow-2xs">
                      {n}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No internal engineering notes yet.</p>
                )}
              </div>

              <form onSubmit={handleAddInternalNote} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={internalNoteText}
                  onChange={(e) => setInternalNoteText(e.target.value)}
                  placeholder="Add private note (e.g. Patch deployed to stage)..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={isSavingNote || !internalNoteText.trim()}
                  className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {isSavingNote ? '...' : 'Add'}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Right Column: Interactive Communication & Audit Thread (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-white">
          
          {/* Thread Header */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Activity & Communication Thread
            </div>
            <span className="text-xs text-slate-400">
              {ticket.messages?.length || 0} messages
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20">
            {ticket.messages?.map((msg) => {
              const isAi = msg.sender === 'ai';
              const isAgent = msg.sender === 'agent';
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[90%] ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAi
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isAgent
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {isAi ? <Sparkles className="w-4 h-4" /> : isAgent ? <Headphones className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[11px] text-slate-400 ${isUser ? 'justify-end' : ''}`}>
                      <span className="font-semibold text-slate-700">{msg.senderName}</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : isAi
                          ? 'bg-indigo-50/90 text-slate-800 border border-indigo-100 rounded-tl-xs shadow-2xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      <div className="prose prose-xs max-w-none prose-p:my-1 prose-headings:my-1.5 prose-pre:my-1 prose-pre:bg-slate-900 prose-pre:text-emerald-400">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>

                      {/* Solution Acceptance Button */}
                      {msg.isSolutionProposal && ticket.status !== 'Resolved' && (
                        <div className="mt-3 pt-2 border-t border-indigo-200/60 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-indigo-900">Did this solution resolve your issue?</span>
                          <button
                            type="button"
                            onClick={handleMarkResolved}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Yes, Mark Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Box */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-2">
            
            {/* Quick Agent Assist Button (in Agent mode) */}
            {role === 'support_agent' && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Support Agent Co-Pilot:</span>
                <button
                  type="button"
                  onClick={handleAiDraftReply}
                  disabled={isDraftingReply}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
                >
                  {isDraftingReply ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Drafting with Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      Auto-Draft Response with AI
                    </>
                  )}
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  role === 'support_agent' 
                    ? 'Write response to customer, or use Auto-Draft with AI...' 
                    : 'Provide additional details or question...'
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400 resize-none font-sans"
              />
              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0 shadow-xs"
                title="Send message"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Escalation Confirmation Modal */}
      {showEscalationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-fadeIn">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Escalate Ticket to Support Engineering</h3>
                <p className="text-xs text-slate-500">Gemini will automatically generate a technical handover brief</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Reason for Escalation
              </label>
              <select
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
              >
                <option value="AI troubleshooting steps did not resolve the problem">
                  AI troubleshooting steps did not resolve the problem
                </option>
                <option value="Requires production Kubernetes/infrastructure permission changes">
                  Requires production Kubernetes/infrastructure permission changes
                </option>
                <option value="Severe business impact / SLA deadline nearing breach">
                  Severe business impact / SLA deadline nearing breach
                </option>
                <option value="Customer billing dispute / refund authorization required">
                  Customer billing dispute / refund authorization required
                </option>
                <option value="Suspected security anomaly / urgent triage needed">
                  Suspected security anomaly / urgent triage needed
                </option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              <strong>What happens next:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-amber-800">
                <li>Ticket status changes to <strong>Escalated</strong>.</li>
                <li>Ticket is routed to <strong>{ticket.aiAnalysis?.recommendedDepartment || 'Tier 2 Support'}</strong>.</li>
                <li>An on-call engineer is assigned with an active SLA tracking countdown.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEscalationModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-escalation-btn"
                onClick={handleConfirmEscalation}
                disabled={isEscalating}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isEscalating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating AI Handover Brief...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Confirm Escalation
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
