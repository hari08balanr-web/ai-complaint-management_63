import React, { useState } from 'react';
import { 
  Bot, 
  ShieldCheck, 
  User as UserIcon, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Cpu, 
  Layers, 
  Loader2,
  Building2,
  CheckCircle,
  KeyRound
} from 'lucide-react';
import { User, loginWithGoogle, loginWithEnterpriseSSO } from '../lib/firebase';

interface SignInPageProps {
  onSignedIn: (user: User, role: 'customer' | 'support_agent') => void;
  currentRole: 'customer' | 'support_agent';
  setRole: (role: 'customer' | 'support_agent') => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onSignedIn,
  currentRole,
  setRole,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Corporate SSO Form State
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [department, setDepartment] = useState('IT Operations');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'support_agent'>(currentRole);
  const [authMode, setAuthMode] = useState<'google' | 'sso'>('google');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setRole(selectedRole);
        onSignedIn(user, selectedRole);
      }
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      if (error?.code !== 'auth/popup-closed-by-user') {
        setAuthError(
          error?.message || 
          'Google authentication could not be completed. Please ensure popups are enabled or authenticate via Corporate SSO.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterpriseSSOSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workEmail.trim() || !fullName.trim()) {
      setAuthError('Please provide both your Full Name and Corporate Work Email.');
      return;
    }

    if (!workEmail.includes('@') || !workEmail.includes('.')) {
      setAuthError('Please enter a valid corporate email address (e.g., name@organization.com).');
      return;
    }

    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await loginWithEnterpriseSSO(fullName.trim(), workEmail.trim());
      setRole(selectedRole);
      onSignedIn(user, selectedRole);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setAuthError(error?.message || 'Corporate SSO session initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Brand & Feature Column */}
        <div className="lg:col-span-6 space-y-6 text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enterprise Single Sign-On (SSO) Portal</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/20">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Nexus<span className="text-indigo-400">Support</span>
                </h1>
                <p className="text-xs text-indigo-300/90 font-medium">
                  Technical Support & Complaint Management System
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed pt-2">
              Next-generation support orchestration platform with integrated Gemini AI automated diagnostics, real-time SLA breach surveillance, and structured Tier-2 engineering escalation workflows.
            </p>
          </div>

          {/* Value Prop Badges */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90">
              <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-200">Gemini AI Diagnostic Engine</p>
                <p className="text-[11px] text-slate-400">
                  Instant telemetry analysis, root-cause categorization, and automated technical remediation runbooks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-200">Complaint & SLA Escalation Matrix</p>
                <p className="text-[11px] text-slate-400">
                  Continuous countdown tracking, automated SLA breach alerts, and complete Tier-2 handover dossiers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90">
              <Layers className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-200">Role-Governed Enterprise Workspaces</p>
                <p className="text-[11px] text-slate-400">
                  Targeted workspaces for Requester / Customer Portals and Tier-2 Support Engineering Desks.
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Info */}
          <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> SOC-2 Type II
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> 256-bit TLS Encryption
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> Firebase Security Rules
            </span>
          </div>

        </div>

        {/* Right Authentication Card */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
            
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Enterprise Authentication
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Please authenticate using your verified enterprise credentials to access the system.
              </p>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Authentication Error</p>
                  <p className="text-[11px] text-rose-300/80 mt-0.5">{authError}</p>
                </div>
              </div>
            )}

            {/* Workspace Destination Selector */}
            <div className="mb-5">
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Select Workspace Access
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    selectedRole === 'customer'
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <UserIcon className={`w-4 h-4 ${selectedRole === 'customer' ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-xs font-bold leading-none">Customer Portal</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Service Requests</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('support_agent')}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    selectedRole === 'support_agent'
                      ? 'bg-amber-600/15 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/30'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 ${selectedRole === 'support_agent' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-xs font-bold leading-none">Support Desk</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Operations & SLAs</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Authentication Method Tabs */}
            <div className="flex rounded-xl bg-slate-800/70 p-1 mb-5 border border-slate-700/70">
              <button
                type="button"
                onClick={() => setAuthMode('google')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'google'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Workspace SSO
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('sso')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'sso'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Corporate Email / SSO
              </button>
            </div>

            {/* Google Workspace Authentication Flow */}
            {authMode === 'google' && (
              <div className="space-y-4">
                <button
                  type="button"
                  id="signin-with-google-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Sign In with Google Workspace</span>
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Single click authentication with your company Google Workspace domain.
                </p>
              </div>
            )}

            {/* Corporate Email / SSO Authentication Flow */}
            {authMode === 'sso' && (
              <form onSubmit={handleEnterpriseSSOSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Corporate Work Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      placeholder="e.g., employee@organization.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Full Employee Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Sarah Jenkins"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Department / Business Unit
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="IT Operations">IT Operations & Infrastructure</option>
                    <option value="Cloud Engineering">Cloud Engineering & DevOps</option>
                    <option value="Security Operations">Information Security (SecOps)</option>
                    <option value="Enterprise Applications">Enterprise Applications & CRM</option>
                    <option value="Customer Support">Customer Care & Support</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Authenticate Enterprise SSO</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Security Note Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Authorized personnel only. Sessions governed by enterprise security policy.</span>
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
