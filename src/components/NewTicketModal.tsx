import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  AlertCircle, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  Code,
  Lightbulb
} from 'lucide-react';
import { 
  TicketCategory, 
  TicketPriority, 
  ServiceTicket, 
  AiDiagnosticAnalysis 
} from '../types';
import { requestAiDiagnosis } from '../services/aiService';
import { createTicket } from '../services/ticketService';
import { User } from '../lib/firebase';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onTicketCreated: (ticket: ServiceTicket) => void;
  initialData?: {
    title?: string;
    description?: string;
    category?: TicketCategory;
  };
}

const CATEGORIES: TicketCategory[] = [
  'Software Bug',
  'Cloud & Infrastructure',
  'Network & Connectivity',
  'Account & Authentication',
  'Billing & Invoicing',
  'Performance & Latency',
  'Hardware Issue',
  'Service Complaint'
];

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  user,
  onTicketCreated,
  initialData
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState<TicketCategory>(initialData?.category || 'Software Bug');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [description, setDescription] = useState(initialData?.description || '');
  const [systemEnvironment, setSystemEnvironment] = useState('');
  const [errorLogs, setErrorLogs] = useState('');
  
  // AI Pre-Diagnosis State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [preDiagnosis, setPreDiagnosis] = useState<AiDiagnosticAnalysis | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePreDiagnose = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please provide at least a title and description for AI diagnosis.');
      return;
    }
    setIsDiagnosing(true);
    try {
      const result = await requestAiDiagnosis({
        title,
        description,
        category,
        systemEnvironment,
        errorLogs
      });
      setPreDiagnosis(result);
      if (result.detectedCategory && CATEGORIES.includes(result.detectedCategory)) {
        setCategory(result.detectedCategory);
      }
      if (result.suggestedPriority && PRIORITIES.includes(result.suggestedPriority)) {
        setPriority(result.suggestedPriority);
      }
    } catch (err) {
      console.error('Error pre-diagnosing:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      // If user hasn't pre-diagnosed, run diagnosis now
      let diagnosis = preDiagnosis;
      let welcomeMsg = '';
      if (!diagnosis) {
        const aiRes = await requestAiDiagnosis({
          title,
          description,
          category,
          systemEnvironment,
          errorLogs
        });
        diagnosis = aiRes;
        welcomeMsg = aiRes.welcomeDiagnosticMessage;
      } else {
        welcomeMsg = `### AI Technical Diagnosis\n\n**Root Cause Hypothesis:**\n${diagnosis.rootCauseHypothesis}\n\n**Immediate Remediation Steps:**\n${diagnosis.suggestedFixSteps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`;
      }

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `ticket-${Date.now()}`;
      const requesterName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Authorized Employee');
      const requesterEmail = user?.email || 'employee@organization.internal';

      const newTicket: ServiceTicket = {
        id: ticketId,
        ticketNumber: `SR-${randomNum}`,
        title,
        description,
        category,
        priority,
        status: 'AI Diagnostics',
        requesterId: user?.uid || 'enterprise-user',
        requesterName,
        requesterEmail,
        systemEnvironment: systemEnvironment || undefined,
        errorLogs: errorLogs || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiAnalysis: diagnosis,
        escalation: {
          isEscalated: false,
          internalNotes: []
        },
        messages: [
          {
            id: `msg-${Date.now()}-req`,
            sender: 'user',
            senderName: requesterName,
            timestamp: new Date().toISOString(),
            text: description
          },
          {
            id: `msg-${Date.now()}-ai`,
            sender: 'ai',
            senderName: 'Gemini Support Co-Pilot',
            timestamp: new Date(Date.now() + 500).toISOString(),
            text: welcomeMsg,
            isSolutionProposal: true
          }
        ]
      };

      await createTicket(newTicket);
      onTicketCreated(newTicket);
      onClose();
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      alert('Error creating ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Submit Service Request / Complaint</h3>
              <p className="text-xs text-slate-400">Direct integration with Gemini AI Diagnostic Assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Issue Title / Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 504 Gateway Timeout during CSV ingestion pipeline"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-slate-800"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-slate-800"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Detailed Problem Description <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handlePreDiagnose}
                disabled={isDiagnosing || !title.trim() || !description.trim()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDiagnosing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Run AI Pre-Diagnosis
                  </>
                )}
              </button>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, steps to reproduce, and impact on operations..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Optional System Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                System Environment (Optional)
              </label>
              <input
                type="text"
                value={systemEnvironment}
                onChange={(e) => setSystemEnvironment(e.target.value)}
                placeholder="e.g. AWS EKS v1.28, Node 20, Safari 17"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-slate-400" />
                Error Logs / Error Code (Optional)
              </label>
              <input
                type="text"
                value={errorLogs}
                onChange={(e) => setErrorLogs(e.target.value)}
                placeholder="e.g. 504 Gateway Timeout or invalid_signature"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {/* AI Pre-Diagnosis Result Card (if triggered) */}
          {preDiagnosis && (
            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 text-slate-800 space-y-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Gemini Diagnostic Insight ({preDiagnosis.confidenceScore}% Confidence)
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                  Auto-routed to {preDiagnosis.recommendedDepartment}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                <strong>Likely Cause:</strong> {preDiagnosis.rootCauseHypothesis}
              </p>
              <div className="text-xs">
                <span className="font-semibold text-indigo-950 block mb-1">Recommended Instant Fix:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  {preDiagnosis.suggestedFixSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Footer / Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-ticket-form-btn"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lodging & AI Diagnosing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Service Request
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
