import React, { useState } from 'react';
import { apiLogin, apiSignup } from '../lib/api';
import { AuthUser, MongoStatus } from '../types';
import { Sparkles, ArrowRight, Lock, Mail, User, AlertCircle, Database } from 'lucide-react';
import { DatabaseStatusModal } from './DatabaseStatusModal';

interface LoginPageProps {
  onSuccess: (user: AuthUser) => void;
  mongoStatus: MongoStatus | null;
  onStatusUpdated?: (status: MongoStatus) => void;
}

export function LoginPage({ onSuccess, mongoStatus, onStatusUpdated }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbModalOpen, setDbModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please provide your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const data = await apiSignup(name, email, password);
        onSuccess(data.user);
      } else {
        const data = await apiLogin(email, password);
        onSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen w-screen bg-[#121212] text-[#F5F0E6] flex flex-col justify-between selection:bg-[#C0392B] selection:text-white">
        {/* Top Header */}
        <header className="px-6 py-5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C0392B] flex items-center justify-center shadow-lg shadow-red-950/40 border border-red-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-[#F5F0E6] tracking-tight">ResolveDesk</h1>
              <p className="text-xs text-[#8A8175]">AI-Powered Technical Support & Complaint Management</p>
            </div>
          </div>

          <button
            onClick={() => setDbModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2D2D2D] hover:border-[#3E3E3E] text-xs transition cursor-pointer"
            title="Click to view database connection status & MongoDB Atlas setup"
          >
            <Database className={`w-3.5 h-3.5 ${mongoStatus?.isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-[#D1C7B7]">
              {mongoStatus?.isConnected ? 'MongoDB Atlas Connected' : 'Database: Active (Local)'}
            </span>
          </button>
        </header>

        {/* Main Content Form */}
        <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md bg-[#181818] border border-[#2A2A2A] rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/80 relative overflow-hidden">
            {/* Subtle Accent Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C0392B]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F0E6] tracking-tight mb-2">
                {isSignUp ? 'Create User Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-[#8A8175]">
                {isSignUp 
                  ? 'Sign up to submit technical tickets and access instant AI triage'
                  : 'Sign in to access your technical support dashboard & track issues'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3 text-red-300 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-[#D1C7B7] uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8175]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-[#2F2F2F] focus:border-[#C0392B] rounded-xl text-sm text-[#F5F0E6] placeholder-[#666] outline-none transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#D1C7B7] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8175]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@enterprise.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-[#2F2F2F] focus:border-[#C0392B] rounded-xl text-sm text-[#F5F0E6] placeholder-[#666] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1C7B7] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8175]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-[#2F2F2F] focus:border-[#C0392B] rounded-xl text-sm text-[#F5F0E6] placeholder-[#666] outline-none transition"
                  />
                </div>
                {isSignUp && (
                  <p className="mt-1 text-[11px] text-[#8A8175]">Must be at least 6 characters</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#C0392B] hover:bg-[#A93226] text-white font-semibold rounded-xl text-sm shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create User Account' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#262626] text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-xs text-[#D1C7B7] hover:text-[#F5F0E6] transition cursor-pointer"
              >
                {isSignUp ? (
                  <span>Already have an account? <strong className="text-[#C0392B] underline">Sign In</strong></span>
                ) : (
                  <span>Need an account? <strong className="text-[#C0392B] underline">Create one now</strong></span>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-[#222] text-center text-xs text-[#8A8175]">
          Enterprise Support Desk &bull; Live Socket.io Event Bus &bull; Direct Server-Side Gemini AI Engine
        </footer>
      </div>

      <DatabaseStatusModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
        status={mongoStatus}
        onStatusUpdated={(newStatus) => {
          if (onStatusUpdated) onStatusUpdated(newStatus);
        }}
      />
    </>
  );
}
