import React, { useState } from 'react';
import { AppUser, TicketCategory, TicketPriority } from '../types';
import { createTicketWithAiFirstResponse } from '../lib/firebase';
import { 
  X, 
  Sparkles, 
  Paperclip, 
  AlertCircle, 
  Send, 
  CheckCircle2, 
  Upload,
  FileText
} from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onTicketCreated: (ticketId: string) => void;
}

const CATEGORIES: TicketCategory[] = [
  'Software Bug',
  'Network & Connectivity',
  'Cloud & Infrastructure',
  'Account & Authentication',
  'Billing & Invoicing',
  'Performance & Latency',
  'Hardware Issue',
  'Service Complaint'
];

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTicketCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Software Bug');
  const [fileAttachment, setFileAttachment] = useState<{ name: string; url: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiPreview, setAiPreview] = useState<{
    priority: TicketPriority;
    category: string;
    suggestedResponse: string;
    slaHours: number;
  } | null>(null);

  if (!isOpen) return null;

  // Real-time AI classification preview
  const handleAiPreTriage = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please enter both Title and Description for AI analysis.');
      return;
    }
    setError(null);
    setIsClassifying(true);
    try {
      const res = await fetch('/api/tickets/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error('AI Classification request failed');
      const data = await res.json();
      setAiPreview(data);
      if (data.category && CATEGORIES.includes(data.category as TicketCategory)) {
        setCategory(data.category as TicketCategory);
      }
    } catch (err: unknown) {
      console.warn('AI Triage error:', err);
      setError('AI Triage could not reach the server. Standard submission is still available.');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read small attachment as data URI
    const reader = new FileReader();
    reader.onload = () => {
      setFileAttachment({
        name: file.name,
        url: typeof reader.result === 'string' ? reader.result : ''
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be signed in to submit a ticket.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Title and Description are required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Call Gemini API server-side endpoint for classification and AI initial response
      let classifiedCategory = category;
      let classifiedPriority: TicketPriority = 'Medium';
      let slaHours = 24;
      let aiSuggestedResponse = `Thank you for contacting technical support regarding "${title}". Our team has logged this request and an engineer will review it shortly.`;

      try {
        const classifyRes = await fetch('/api/tickets/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        });
        if (classifyRes.ok) {
          const aiData = await classifyRes.json();
          classifiedCategory = aiData.category || category;
          classifiedPriority = aiData.priority || 'Medium';
          slaHours = aiData.slaHours || (classifiedPriority === 'Critical' ? 1 : classifiedPriority === 'High' ? 4 : 24);
          aiSuggestedResponse = aiData.suggestedResponse || aiSuggestedResponse;
        }
      } catch (classifyErr) {
        console.warn('Classification fetch fallback used:', classifyErr);
      }

      // 2. Write ticket and initial AI response into Firestore
      const newTicketId = await createTicketWithAiFirstResponse({
        userId: currentUser.uid,
        requesterName: currentUser.name,
        requesterEmail: currentUser.email,
        title,
        description,
        category: classifiedCategory,
        priority: classifiedPriority,
        slaHours,
        aiSuggestedResponse,
        attachmentUrl: fileAttachment?.url,
        attachmentName: fileAttachment?.name
      });

      // 3. Reset form and notify parent
      setTitle('');
      setDescription('');
      setFileAttachment(null);
      setAiPreview(null);
      onTicketCreated(newTicketId);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit ticket';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        id="new-ticket-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Submit Support Ticket</h2>
              <p className="text-xs text-slate-500">Autonomous Gemini AI triage will analyze and assign SLA priority</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Issue Subject / Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              id="new-ticket-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Production 504 Gateway Timeout during customer checkout"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                id="new-ticket-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                AI Pre-Classification
              </label>
              <button
                type="button"
                onClick={handleAiPreTriage}
                disabled={isClassifying || !title || !description}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isClassifying ? (
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Auto-Detect Category & Priority</span>
              </button>
            </div>
          </div>

          {/* AI Preview Result if triggered */}
          {aiPreview && (
            <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-xs text-indigo-950 space-y-1.5">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Gemini Triage Recommendation
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  aiPreview.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                  aiPreview.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {aiPreview.priority} Priority (SLA: {aiPreview.slaHours}h)
                </span>
              </div>
              <p className="text-[11px] text-indigo-800">
                <strong>Detected Category:</strong> {aiPreview.category}
              </p>
              <p className="text-[11px] text-indigo-700/90 line-clamp-2">
                <strong>Draft Response:</strong> {aiPreview.suggestedResponse}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Detailed Description & Steps to Reproduce <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              id="new-ticket-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details: error messages, timestamps, URLs, affected accounts, and any attempted workarounds..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Optional Attachment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Optional File / Screenshot Attachment
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 border border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-2 transition">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Choose File</span>
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*,.pdf,.txt,.log,.json" 
                />
              </label>
              {fileAttachment && (
                <div className="flex items-center gap-2 text-xs text-slate-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate max-w-[200px]">{fileAttachment.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setFileAttachment(null)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="submit-ticket-confirm-btn"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting & Triaging with AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
