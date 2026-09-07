import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Tag, 
  TrendingUp, 
  RotateCw,
  PlusCircle,
  FileCode
} from 'lucide-react';
import { ServiceTicket } from '../types';
import { requestAiDiagnosis } from '../services/aiService';

interface DiagnosticsHubViewProps {
  tickets: ServiceTicket[];
  onOpenNewTicketWithData?: (data: { title?: string; description?: string }) => void;
  onSelectTicket: (ticketId: string) => void;
}

export const DiagnosticsHubView: React.FC<DiagnosticsHubViewProps> = ({
  tickets,
  onOpenNewTicketWithData,
  onSelectTicket
}) => {
  // Sandbox state
  const [sandboxTitle, setSandboxTitle] = useState('504 Gateway Timeout during peak checkout traffic');
  const [sandboxDescription, setSandboxDescription] = useState('Multiple users receiving 504 gateway timeout after clicking submit order. Nginx ingress log shows upstream timed out (110: Connection timed out) while connecting to upstream payment-service:8080.');
  const [sandboxCategory, setSandboxCategory] = useState('Cloud & Infrastructure');
  const [sandboxLogs, setSandboxLogs] = useState(`2026-09-07T09:12:04.128Z [error] 142#142: *8941 upstream timed out (110: Connection timed out) while reading response header from upstream, client: 192.168.1.45, server: api.nexusops.internal, request: "POST /v2/checkout/process HTTP/1.1", upstream: "http://10.244.3.18:8080/v2/checkout/process"`);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  const handleRunSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxTitle.trim() || !sandboxDescription.trim()) return;

    setIsAnalyzing(true);
    setSandboxResult(null);

    try {
      const result = await requestAiDiagnosis({
        title: sandboxTitle,
        description: sandboxDescription,
        category: sandboxCategory,
        errorLogs: sandboxLogs
      });
      setSandboxResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Diagnostic metrics
  const ticketsWithAi = tickets.filter(t => t.aiAnalysis);
  const avgSeverity = ticketsWithAi.length > 0
    ? (ticketsWithAi.reduce((acc, t) => acc + (t.aiAnalysis?.severityScore || 0), 0) / ticketsWithAi.length).toFixed(1)
    : '7.2';
  const avgConfidence = ticketsWithAi.length > 0
    ? Math.round(ticketsWithAi.reduce((acc, t) => acc + (t.aiAnalysis?.confidenceScore || 0), 0) / ticketsWithAi.length)
    : 92;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Gemini 2.5 Neural Triage Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            AI Automated Diagnostics & Triage Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Analyze runtime anomalies, parse system error stacktraces, calculate severity indices, and auto-route issues to the appropriate engineering squad.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 shrink-0">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Avg Confidence</p>
            <p className="text-xl font-black text-indigo-400">{avgConfidence}%</p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Mean Severity</p>
            <p className="text-xl font-black text-rose-400">{avgSeverity}/10</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Sandbox & Diagnostic Knowledge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Interactive Sandbox */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Terminal className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Live Diagnostic Sandbox (Test Raw Logs & Symptoms)
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Powered by Gemini
            </span>
          </div>

          <form onSubmit={handleRunSandbox} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Incident Title / Summary
              </label>
              <input
                type="text"
                value={sandboxTitle}
                onChange={(e) => setSandboxTitle(e.target.value)}
                placeholder="e.g. 504 Gateway Timeout during checkout"
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Suspected Category
                </label>
                <select
                  value={sandboxCategory}
                  onChange={(e) => setSandboxCategory(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                >
                  <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                  <option value="Software Bug">Software Bug</option>
                  <option value="Network & Connectivity">Network & Connectivity</option>
                  <option value="Account & Authentication">Account & Authentication</option>
                  <option value="Billing & Invoicing">Billing & Invoicing</option>
                  <option value="Performance & Latency">Performance & Latency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Environment Context
                </label>
                <input
                  type="text"
                  defaultValue="Production Kubernetes Cluster / Nginx Ingress / Node 20"
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Problem Description & Symptoms
              </label>
              <textarea
                rows={2}
                value={sandboxDescription}
                onChange={(e) => setSandboxDescription(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Raw Error Logs / Stacktrace</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <textarea
                rows={3}
                value={sandboxLogs}
                onChange={(e) => setSandboxLogs(e.target.value)}
                className="w-full font-mono text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-900 text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setSandboxTitle('PostgreSQL Connection Pool Exhaustion');
                  setSandboxDescription('API servers failing with "FATAL: remaining connection slots are reserved for non-replication superuser connections"');
                  setSandboxLogs('Error: timeout exceeded when attempting to acquire client from pool. Max connections: 100, Active: 100, Idle: 0');
                  setSandboxCategory('Performance & Latency');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Load Sample Log
              </button>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm shadow-indigo-600/30 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Gemini Diagnosis</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sandbox Results Card */}
          {sandboxResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Diagnostic Output</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Severity {sandboxResult.severityScore}/10
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {sandboxResult.confidenceScore}% Confidence
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-indigo-300">Root-Cause Hypothesis:</p>
                <p className="text-slate-300 font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {sandboxResult.rootCauseHypothesis}
                </p>
              </div>

              {sandboxResult.suggestedFixSteps && sandboxResult.suggestedFixSteps.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-emerald-400">Suggested Action Steps:</p>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {sandboxResult.suggestedFixSteps.map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Recommended Routing: <strong className="text-white">{sandboxResult.recommendedDepartment}</strong></span>
                {onOpenNewTicketWithData && (
                  <button
                    type="button"
                    onClick={() => onOpenNewTicketWithData({
                      title: sandboxTitle,
                      description: `${sandboxDescription}\n\n[AI Root Cause]: ${sandboxResult.rootCauseHypothesis}`
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>File As Official Ticket</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Existing AI Diagnosed Tickets */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Recent AI-Diagnosed Incidents
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {ticketsWithAi.length} analyzed
            </span>
          </div>

          <div className="space-y-3">
            {ticketsWithAi.slice(0, 4).map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-200 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                    {ticket.ticketNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      Sev {ticket.aiAnalysis?.severityScore}/10
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {ticket.aiAnalysis?.confidenceScore}% Conf
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {ticket.title}
                </h4>

                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {ticket.aiAnalysis?.rootCauseHypothesis}
                </p>

                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>{ticket.aiAnalysis?.recommendedDepartment}</span>
                  <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Inspect <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
