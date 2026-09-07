import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  PlusCircle, 
  Terminal, 
  Trash2,
  HelpCircle,
  ArrowUpRight
} from 'lucide-react';
import { sendChatMessage } from '../services/aiService';
import { ChatMessage } from '../types';

interface AiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvertToTicket: (title: string, description: string) => void;
}

const STARTER_PROMPTS = [
  'How do I fix a 504 Gateway Timeout in NGINX ingress?',
  'Okta SAML SSO invalid_signature certificate expired',
  'PostgreSQL connection pool exhausted under high load',
  'How do I issue a duplicate billing refund in Stripe?'
];

export const AiChatbotModal: React.FC<AiChatbotModalProps> = ({
  isOpen,
  onClose,
  onConvertToTicket
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'model',
      content: "Hello! I am **Nexus AI**, your Technical Support Co-Pilot. I can help troubleshoot server infrastructure, network errors, auth/SSO issues, or billing inquiries. If we can't solve it here, I can convert our conversation directly into an escalated service ticket for our engineering team. How can I assist you today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

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
      const reply = await sendChatMessage(
        newHistory.map(m => ({ role: m.role, content: m.content }))
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: new Date().toISOString()
      };
      setMessages([...newHistory, aiMsg]);
    } catch (err) {
      console.error('Chatbot error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = () => {
    // Synthesize title from first user message or conversation
    const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'Technical Service Request from AI Troubleshooter';
    const title = firstUserMsg.slice(0, 80);
    const description = `### Issue Originated from AI Troubleshooter Chat\n\n**Conversation Summary:**\n${messages
      .slice(-4)
      .map(m => `**${m.role === 'user' ? 'Customer' : 'AI Assistant'}:** ${m.content}`)
      .join('\n\n')}`;
    
    onConvertToTicket(title, description);
    onClose();
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'init-msg-reset',
        role: 'model',
        content: "Chat reset. How can I assist you with your technical inquiry?",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full h-[85vh] max-h-[700px] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">Nexus AI Troubleshooter</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">Interactive multi-turn diagnostic assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action ribbon: Convert to ticket */}
        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs">
          <span className="text-indigo-900 font-medium">Issue unresolved in chat?</span>
          <button
            type="button"
            onClick={handleConvert}
            className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <span>Convert to Official Ticket</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser ? 'bg-slate-700 text-white' : 'bg-indigo-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <div className="prose prose-xs max-w-none prose-p:my-1 prose-headings:my-1.5 prose-pre:my-1 prose-pre:bg-slate-900 prose-pre:text-emerald-400">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white text-slate-500 border border-slate-200 rounded-tl-xs shadow-2xs flex items-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Diagnosing technical inquiry...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter prompts (if only 1 message) */}
        {messages.length === 1 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-white">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Suggested Troubleshooter Topics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors text-left font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Box */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a technical question, paste error message or symptoms..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
