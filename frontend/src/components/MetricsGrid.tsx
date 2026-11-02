import React from 'react';
import { PortfolioMetrics } from '../types/portfolio';
import { TrendingUp, Activity, Award, ShieldAlert, Layers } from 'lucide-react';

interface MetricsGridProps {
  metrics: PortfolioMetrics;
  totalCapital: number;
  currency: string;
  weights: {
    mass_optimal: Record<string, number>;
    hrp_benchmark: Record<string, number>;
    equal_weight_benchmark: Record<string, number>;
  };
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  totalCapital,
  currency,
  weights,
}) => {
  return (
    <div className="space-y-3">
      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Expected Annual Return */}
        <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase mb-1">
            <span>EXPECTED RETURN</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            +{metrics.expected_annual_return_pct.toFixed(2)}%
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Projected 1Y: <span className="text-slate-300 tabular-nums">{currency}{metrics.projected_1yr_capital.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </p>
        </div>

        {/* Annualized Volatility */}
        <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase mb-1">
            <span>VOLATILITY (σ)</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400 font-mono tabular-nums">
            {metrics.annual_volatility_pct.toFixed(2)}%
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Shrinkage Covariance Diagonal
          </p>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase mb-1">
            <span>SHARPE RATIO</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">
            {metrics.sharpe_ratio.toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            Excess Alpha (Rf = 4.0%)
          </p>
        </div>

        {/* Parametric VaR (95%) */}
        <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase mb-1">
            <span>PARAMETRIC VAR (95%)</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 font-mono tabular-nums">
            -{metrics.var_95_pct.toFixed(2)}%
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            95% Confidence 1-Day Tail Bound
          </p>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-white/[0.06] font-mono text-xs font-bold text-white uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>MATHEMATICAL ALLOCATION COMPARISON: MASS VS HRP VS NAÏVE 1/N</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          {/* MASS Black-Litterman */}
          <div className="bg-obsidian-950 p-3 rounded-lg border border-sky-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400">MASS (Bayesian BL)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Combines market equilibrium with agent dialectical view vector Q.
            </p>
            <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-white/[0.04]">
              <div>Expected Return: <strong className="text-emerald-400 tabular-nums">+{metrics.expected_annual_return_pct.toFixed(1)}%</strong></div>
              <div>Sharpe Ratio: <strong className="text-amber-400 tabular-nums">{metrics.sharpe_ratio.toFixed(2)}</strong></div>
            </div>
          </div>

          {/* Hierarchical Risk Parity */}
          <div className="bg-obsidian-950 p-3 rounded-lg border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Hierarchical Risk Parity (HRP)</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/[0.06] text-slate-400">
                BENCHMARK 1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Graph-theoretic clustering allocation without inverting covariance matrices.
            </p>
            <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-white/[0.04]">
              <div>Quasi-Diagonalization: <strong className="text-slate-200">Active</strong></div>
              <div>Diversification: <strong className="text-sky-400">High</strong></div>
            </div>
          </div>

          {/* Naive 1/N Equal Weight */}
          <div className="bg-obsidian-950 p-3 rounded-lg border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Naïve 1/N Equal Weight</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/[0.06] text-slate-400">
                BENCHMARK 2
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Equal capital distribution across all assets with zero covariance awareness.
            </p>
            <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-white/[0.04]">
              <div>Weight per Asset: <strong className="text-slate-200 tabular-nums">{(100 / Math.max(1, Object.keys(weights.mass_optimal).length)).toFixed(1)}%</strong></div>
              <div>Concentration Risk: <strong className="text-rose-400">Unmanaged</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
