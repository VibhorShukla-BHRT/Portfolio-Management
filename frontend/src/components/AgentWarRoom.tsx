import React, { useState } from 'react';
import { AgentEvent } from '../types/portfolio';
import {
  Search,
  Activity,
  TrendingUp,
  TrendingDown,
  Scale,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  Loader2,
  Clock,
  Terminal,
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react';

interface AgentWarRoomProps {
  events: Record<string, AgentEvent>;
  isAnalyzing: boolean;
}

interface AgentMeta {
  id: string;
  step: string;
  name: string;
  role: string;
  icon: React.ReactNode;
}

const AGENTS_META: AgentMeta[] = [
  {
    id: 'screener',
    step: '01',
    name: 'Universe Screener',
    role: 'Cross-Sector Pre-Selection & Correlation Filtering',
    icon: <Search className="w-3.5 h-3.5" />
  },
  {
    id: 'quant',
    step: '02',
    name: 'Quantitative Analyst',
    role: '50/200-SMA Golden Cross & Volatility Surface',
    icon: <Activity className="w-3.5 h-3.5" />
  },
  {
    id: 'bull',
    step: '03',
    name: 'Bull Market Researcher',
    role: 'Growth Catalysts, Earnings Momentum & Upside Thesis',
    icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
  },
  {
    id: 'bear',
    step: '04',
    name: 'Bear Market Researcher',
    role: 'Valuation Multiples, Debt Load & Downside Risks',
    icon: <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
  },
  {
    id: 'debate',
    step: '05',
    name: 'Dialectical Synthesizer',
    role: 'Adversarial Resolution & Bayesian View Vector Q',
    icon: <Scale className="w-3.5 h-3.5 text-amber-400" />
  },
  {
    id: 'risk',
    step: '06',
    name: 'Risk & Compliance',
    role: 'Covariance Boundaries & Tail Risk Constraints',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
  },
  {
    id: 'portfolio_manager',
    step: '07',
    name: 'Chief Portfolio Manager',
    role: 'Black-Litterman Convex Solver & Order Sizing',
    icon: <Briefcase className="w-3.5 h-3.5 text-sky-400" />
  }
];

export const AgentWarRoom: React.FC<AgentWarRoomProps> = ({ events, isAnalyzing }) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'console'>('pipeline');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedAgent(prev => (prev === id ? null : id));
  };

  const completedCount = AGENTS_META.filter(a => events[a.id]?.status === 'complete').length;

  return (
    <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-obsidian-950 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-mono text-xs font-semibold tracking-wide text-white">
            MASS 7-AGENT DIALECTICAL REASONING PIPELINE
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-white/[0.06] text-slate-300 border border-white/[0.08]">
            {completedCount} / 7 COMPLETE
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-obsidian-900 rounded p-0.5 border border-white/[0.06] font-mono text-[11px]">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'pipeline'
                ? 'bg-obsidian-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PIPELINE MATRIX
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'console'
                ? 'bg-obsidian-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LIVE CONSOLE STREAM
          </button>
        </div>
      </div>

      {/* Main Body */}
      {activeTab === 'pipeline' ? (
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
            {AGENTS_META.map((meta) => {
              const event = events[meta.id];
              const isRunning = event?.status === 'analyzing';
              const isDone = event?.status === 'complete';
              const isWaiting = !isRunning && !isDone;

              return (
                <div
                  key={meta.id}
                  onClick={() => isDone && toggleExpand(meta.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isDone
                      ? 'bg-obsidian-850 border-emerald-500/30 hover:border-emerald-500/50'
                      : isRunning
                      ? 'bg-obsidian-850 border-sky-500/50 shadow-sm shadow-sky-500/10'
                      : 'bg-obsidian-950/60 border-white/[0.05] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
                    <span className="text-slate-500 font-bold">[{meta.step}]</span>
                    {isRunning && (
                      <span className="flex items-center gap-1 text-sky-400 font-semibold">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        RUNNING
                      </span>
                    )}
                    {isDone && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        RESOLVED
                      </span>
                    )}
                    {isWaiting && (
                      <span className="text-slate-600 font-medium">QUEUED</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mb-1 text-slate-200 font-medium text-xs">
                    {meta.icon}
                    <span className="truncate">{meta.name}</span>
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {meta.role}
                  </p>

                  {isDone && (
                    <div className="mt-2 pt-1.5 border-t border-white/[0.06] text-[10px] font-mono text-sky-400 flex items-center justify-between">
                      <span>View Output</span>
                      {expandedAgent === meta.id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expanded Agent Output Panel */}
          {expandedAgent && events[expandedAgent]?.output && (
            <div className="mt-4 p-4 rounded-lg bg-obsidian-950 border border-white/[0.08] font-mono text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-sky-400 font-bold uppercase">
                  AGENT LOG: {AGENTS_META.find(a => a.id === expandedAgent)?.name}
                </span>
                <button
                  onClick={() => setExpandedAgent(null)}
                  className="text-slate-500 hover:text-slate-300 text-[11px]"
                >
                  [CLOSE]
                </button>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {events[expandedAgent]?.output}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Console Stream View */
        <div className="p-4 bg-obsidian-950 font-mono text-xs max-h-80 overflow-y-auto space-y-2 select-text">
          <div className="text-slate-500 text-[11px] pb-2 border-b border-white/[0.06]">
            MASS Cognitive Stream &bull; Groq LPU Engine &bull; Qwen 3.8 27B Quantized
          </div>

          {Object.keys(events).length === 0 && !isAnalyzing && (
            <div className="text-slate-600 py-6 text-center">
              System ready. Configure portfolio capital and click RUN ENGINE.
            </div>
          )}

          {isAnalyzing && Object.keys(events).length === 0 && (
            <div className="text-sky-400 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>[00:00:01] Engaging cognitive pipeline and establishing LPU thread...</span>
            </div>
          )}

          {Object.entries(events).map(([id, event]) => (
            <div key={id} className="space-y-1">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-500">[AGENT]</span>
                <span className="text-sky-400 font-bold">[{event.agent_name || id.toUpperCase()}]</span>
                <span className={`px-1 rounded text-[10px] ${
                  event.status === 'complete' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'
                }`}>
                  {event.status?.toUpperCase()}
                </span>
              </div>
              {event.output && (
                <div className="pl-4 border-l border-white/[0.08] text-slate-300 text-[11px] leading-relaxed">
                  {event.output}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
