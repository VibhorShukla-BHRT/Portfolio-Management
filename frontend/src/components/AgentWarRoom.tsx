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
  ChevronDown,
  ChevronUp,
  Bot
} from 'lucide-react';

interface AgentWarRoomProps {
  events: Record<string, AgentEvent>;
  isAnalyzing: boolean;
}

interface AgentMeta {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  color: string;
}

const AGENTS_META: AgentMeta[] = [
  {
    id: 'screener',
    name: 'Universe Screener & Ranker',
    role: 'Relative Sector Ranking & Universe Pre-Selection',
    icon: <Search className="w-4 h-4" />,
    color: 'from-blue-500/20 to-sky-500/20 text-sky-400 border-sky-500/30'
  },
  {
    id: 'quant',
    name: 'Quantitative Financial Analyst',
    role: '50/200-SMA Indicators & Historical Volatility',
    icon: <Activity className="w-4 h-4" />,
    color: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'bull',
    name: 'Bull Market Researcher',
    role: 'Growth Catalysts, Earnings Momentum & Upside Thesis',
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    color: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'bear',
    name: 'Bear Market Researcher',
    role: 'Downside Risks, Margin Compression & Headwinds',
    icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
    color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30'
  },
  {
    id: 'debate',
    name: 'Dialectical Debate Orchestrator',
    role: 'Adversarial Synthesis & Bayesian Views Vector Q',
    icon: <Scale className="w-4 h-4 text-amber-400" />,
    color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30'
  },
  {
    id: 'risk',
    name: 'Risk & Compliance Manager',
    role: 'Drawdown Boundaries & Tail Risk Constraints',
    icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
    color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'portfolio_manager',
    name: 'Chief Portfolio Manager',
    role: 'Black-Litterman Convex Solver & Order Sizing',
    icon: <Briefcase className="w-4 h-4 text-purple-400" />,
    color: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30'
  }
];

export const AgentWarRoom: React.FC<AgentWarRoomProps> = ({ events, isAnalyzing }) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedAgent(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Multi-Agent Dialectical War Room
              {isAnalyzing && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/20 text-sky-300 animate-pulse border border-sky-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  Agents Debating Live
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              7 specialized autonomous agents synthesizing qualitative news and quantitative market microstructure.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {AGENTS_META.map(meta => {
          const state: Partial<AgentEvent> = events[meta.id] || { status: 'pending' };
          const isPending = state.status === 'pending';
          const isCurrentAnalyzing = state.status === 'analyzing';
          const isComplete = state.status === 'complete';
          const isExpanded = expandedAgent === meta.id;

          return (
            <div
              key={meta.id}
              onClick={() => state.output && toggleExpand(meta.id)}
              className={`rounded-xl border transition-all duration-200 flex flex-col justify-between p-3.5 ${
                isCurrentAnalyzing
                  ? 'bg-sky-950/20 border-sky-500/40 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                  : isComplete
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg border bg-gradient-to-br ${meta.color}`}>
                    {meta.icon}
                  </div>
                  {/* Status Badge */}
                  <div>
                    {isCurrentAnalyzing && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Live
                      </span>
                    )}
                    {isComplete && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Done
                      </span>
                    )}
                    {isPending && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                        <Clock className="w-2.5 h-2.5" />
                        Queue
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-200 leading-tight mb-1">
                  {meta.name}
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
                  {meta.role}
                </p>
              </div>

              {state.output && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-sky-400 font-medium">
                  <span>View output</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Agent Thought Drawer */}
      {expandedAgent && events[expandedAgent]?.output && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-semibold text-sky-300">
              {AGENTS_META.find(a => a.id === expandedAgent)?.name} &mdash; Detailed Output
            </span>
            <button
              onClick={() => setExpandedAgent(null)}
              className="text-slate-400 hover:text-white text-[11px]"
            >
              Close
            </button>
          </div>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed font-sans max-h-60 overflow-y-auto pr-2">
            {events[expandedAgent].output}
          </p>
        </div>
      )}
    </div>
  );
};
