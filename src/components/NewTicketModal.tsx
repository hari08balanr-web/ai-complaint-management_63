import React, { useState } from 'react';
import { apiCreateTicket } from '../lib/api';
import { Ticket } from '../types';
import { X, Sparkles, Paperclip, AlertTriangle, Send, FileText } from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
}

const CATEGORIES = [
  'Software Bug',
  'Cloud & Infrastructure',
  'Account & Authentication',
  'Billing & Invoicing',
  'Performance & Latency',
  'Network & Connectivity',
  'Hardware Issue',
  'Service Complaint'
];

export function NewTicketModal({ isOpen, onClose, onCreated }: NewTicketModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; url: string; size?: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create object URL for client preview
      const fakeUrl = URL.createObjectURL(file);
      setAttachment({
        name: file.name,
        url: fakeUrl,
        size: file.size
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide both a title and a description for your issue.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const newTicket = await apiCreateTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        attachment: attachment ? {
          name: attachment.name,
          url: attachment.url,
          size: attachment.size
        } : undefined
      });

      onCreated(newTicket);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setAttachment(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#181818] border border-[#2D2D2D] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black relative text-[#F5F0E6] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C0392B]/20 border border-[#C0392B]/40 flex items-center justify-center text-[#E74C3C]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F5F0E6]">Submit Support Request</h2>
              <p className="text-xs text-[#8A8175]">
                Gemini AI will triage your ticket, set SLA deadlines, and generate initial diagnostics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A8175] hover:text-[#F5F0E6] hover:bg-[#252525] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2.5 text-red-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-[#E74C3C] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D1C7B7] mb-2">
              Issue Summary / Title <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 504 Gateway Timeout during checkout processing"
              className="w-full px-4 py-3 bg-[#121212] border border-[#2D2D2D] focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] rounded-xl text-sm text-[#F5F0E6] placeholder-[#555] outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D1C7B7] mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#121212] border border-[#2D2D2D] focus:border-[#C0392B] rounded-xl text-sm text-[#F5F0E6] outline-none transition cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#181818] text-[#F5F0E6]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D1C7B7] mb-2">
                Attachment (Optional)
              </label>
              <label className="flex items-center gap-2.5 px-4 py-3 bg-[#121212] border border-[#2D2D2D] hover:border-[#444] rounded-xl text-xs text-[#D1C7B7] cursor-pointer transition">
                <Paperclip className="w-4 h-4 text-[#8A8175]" />
                <span className="truncate">{attachment ? attachment.name : 'Upload logs or screenshot'}</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.log,.txt,.json,.pdf"
                />
              </label>
              {attachment && (
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="mt-1 text-[11px] text-[#C0392B] hover:underline"
                >
                  Remove attachment
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D1C7B7] mb-2">
              Detailed Description & Logs <span className="text-[#C0392B]">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe steps to reproduce, impact on workflow, error codes, or console stack traces..."
              className="w-full px-4 py-3 bg-[#121212] border border-[#2D2D2D] focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] rounded-xl text-sm text-[#F5F0E6] placeholder-[#555] outline-none transition resize-none font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-[#333] hover:bg-[#222] text-[#D1C7B7] text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI Triaging Ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Service Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
