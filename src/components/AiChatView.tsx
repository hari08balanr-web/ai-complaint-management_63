import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  PlusCircle, 
  Terminal, 
  Trash2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { sendChatMessage } from '../services/aiService';
import { ChatMessage } from '../types';

interface AiChatViewProps {
  onConvertToTicket: (title: string, description: string) => void;
}

const STARTER_PROMPTS = [
  'How do I fix a 504 Gateway Timeout in NGINX ingress?',
  'Okta SAML SSO invalid_signature certificate expired',
  'PostgreSQL connection pool exhausted under high load',
  'Customer complaining about duplicate billing in Stripe invoice'
];

export const AiChatView: React.FC<AiChatViewProps> = ({ onConvertToTicket }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'model',
      content: "Hello! I am **Nexus AI Technical Co-Pilot**. I can diagnose distributed system anomalies, decode stack traces, solve SSO/OAuth bottlenecks, and provide immediate remediation playbooks.\n\nAsk me anything or paste your runtime logs below. If we need senior engineering hands, click **Convert to Official Ticket** to escalate with full telemetry.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const historyPayload = newHistory.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const reply = await sendChatMessage(historyPayload);

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: "I ran into a temporary issue reaching the Gemini gateway. Please try again or create a ticket directly.",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicketFromChat = () => {
    const lastUserQuery = [...messages].reverse().find(m => m.role === 'user')?.content || 'Technical Support Inquiry';
    const conversationTranscript = messages
      .map(m => `[${m.role === 'user' ? 'USER' : 'AI CO-PILOT'}]:\n${m.content}`)
      .join('\n\n---\n\n');

    const generatedTitle = lastUserQuery.length > 70 ? lastUserQuery.slice(0, 67) + '...' : lastUserQuery;
    onConvertToTicket(generatedTitle, `Chat Troubleshooting Transcript:\n\n${conversationTranscript}`);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden animate-fadeIn">
      
      {/* Console Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Gemini Interactive Technical Support Desk
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multi-turn incident diagnostics, script generator, and root-cause analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateTicketFromChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs"
            title="Convert conversation history into an official ticket"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Convert to Ticket</span>
          </button>
          <button
            type="button"
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Clear chat session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Starter Prompts Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Quick Prompts:
        </span>
        <div className="flex items-center gap-2">
          {STARTER_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-700 whitespace-nowrap transition-all shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isModel = msg.role === 'model';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isModel ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
              }`}>
                {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-2xs relative group ${
                isModel
                  ? 'bg-white text-slate-800 border border-slate-200/90'
                  : 'bg-indigo-600 text-white'
              }`}>
                <div className="prose prose-xs max-w-none prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-3 prose-pre:rounded-xl">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60 text-[10px] text-slate-400">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isModel && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-indigo-600 rounded flex items-center gap-1"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-3xl items-center">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3 px-4 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Gemini is analyzing symptoms and synthesizing runbook...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question, describe symptoms, or paste error logs..."
            disabled={isLoading}
            className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-sm shadow-indigo-600/30 disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

    </div>
  );
};
