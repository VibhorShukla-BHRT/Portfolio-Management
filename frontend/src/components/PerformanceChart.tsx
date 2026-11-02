import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PaperSnapshot, TimezoneInfo } from '../types/portfolio';
import { TrendingUp, Globe, Layers, Calendar, ShieldCheck } from 'lucide-react';

interface PerformanceChartProps {
  history: PaperSnapshot[];
  currency: string;
  initialCapital: number;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  timezoneInfo?: TimezoneInfo;
  benchmarkName?: string;
  loading?: boolean;
}

const TIMEFRAMES = [
  { id: '1D', label: '1D', desc: 'Intraday 5-Min Mark-to-Market' },
  { id: '1W', label: '1W', desc: 'Past 7 Days' },
  { id: '1M', label: '1M', desc: 'Past 30 Days' },
  { id: '1Y', label: '1Y', desc: 'Since Investment Date (Bounded)' },
  { id: 'ALL', label: 'ALL', desc: 'Complete Holding Period' },
];

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  history,
  currency,
  initialCapital,
  timeframe,
  onTimeframeChange,
  timezoneInfo,
  benchmarkName = 'S&P 500',
  loading = false,
}) => {
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);

  const data = history.map((h) => ({
    label: h.label,
    date_iso: h.date_iso,
    display_market_time: h.display_market_time || h.label,
    time_ist: h.time_ist,
    time_edt: h.time_edt,
    valuation: h.total_valuation,
    return_pct: h.return_pct,
    benchmark_return_pct: h.benchmark_return_pct || 0.0,
  }));

  const startDateLabel = data.length > 0 ? (data[0].display_market_time || data[0].label) : 'Investment Date';
  const endDateLabel = data.length > 0 ? (data[data.length - 1].display_market_time || data[data.length - 1].label) : 'Latest';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const isPositive = item.return_pct >= 0;
      const isBmPositive = item.benchmark_return_pct >= 0;

      return (
        <div className="bg-obsidian-950 border border-white/[0.12] p-3 rounded-lg shadow-2xl font-mono text-xs space-y-1.5 backdrop-blur-md min-w-[210px]">
          <div className="pb-1 border-b border-white/[0.06] text-[10px] text-slate-400 space-y-0.5">
            <div className="font-semibold text-white flex items-center gap-1">
              <Calendar className="w-3 h-3 text-sky-400" />
              <span>{item.display_market_time}</span>
            </div>
            {item.time_ist && (
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>IST (Local):</span>
                <span className="text-slate-300">{item.time_ist}</span>
              </div>
            )}
            {item.time_edt && timezoneInfo?.market === 'US' && (
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>EDT (NYSE):</span>
                <span className="text-slate-300">{item.time_edt}</span>
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase">Valuation (Mark-to-Market)</div>
            <div className="text-base font-bold text-white tabular-nums">
              {currency}{item.valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-[11px] font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              Portfolio Return: {isPositive ? '+' : ''}{item.return_pct.toFixed(2)}%
            </div>
          </div>

          {showBenchmark && (
            <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
              <span className="text-slate-400">{benchmarkName}:</span>
              <span className={`font-semibold tabular-nums ${isBmPositive ? 'text-indigo-400' : 'text-rose-400'}`}>
                {isBmPositive ? '+' : ''}{item.benchmark_return_pct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-5 shadow-xl space-y-4">
      {/* Top Header & Timezone Clarity */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-mono text-xs font-bold text-white tracking-wide uppercase">
              Mark-to-Market Valuation &amp; Growth Trajectory
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-slate-400 font-mono text-[10px]">
            <span>Window: {startDateLabel} &rarr; {endDateLabel}</span>
            <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              START BOUNDED TO INVESTMENT DATE
            </span>
          </div>
        </div>

        {/* Timezone Details Badge */}
        {timezoneInfo && (
          <div className="bg-obsidian-950 border border-white/[0.06] px-2.5 py-1 rounded font-mono text-[10px] flex items-center gap-2 text-slate-400">
            <Globe className="w-3 h-3 text-sky-400 shrink-0" />
            <div>
              <span className="text-slate-200 font-semibold">{timezoneInfo.exchange_name} ({timezoneInfo.exchange_timezone})</span>
              <span className="text-slate-500 block">Session: {timezoneInfo.market_hours}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Chart Graphic */}
      <div className="h-64 w-full relative">
        {loading && (
          <div className="absolute inset-0 bg-obsidian-900/80 backdrop-blur-xs flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2 font-mono text-xs text-sky-300 font-medium">
              <span className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>Updating trajectory from investment date...</span>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            />
            <YAxis
              stroke="#475569"
              fontSize={10}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${currency}${v.toLocaleString()}`}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="valuation"
              name="Portfolio Valuation"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#growthGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeframe Selector Pills & Benchmark Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/[0.08] font-mono text-xs">
        {/* Groww-style timeframe pills */}
        <div className="flex items-center gap-1 bg-obsidian-950 p-1 rounded-lg border border-white/[0.08]">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => onTimeframeChange(tf.id)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-obsidian-900'
                }`}
                title={tf.desc}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Benchmark Overlay Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`px-2.5 py-1 rounded text-xs border transition-colors flex items-center gap-1.5 ${
              showBenchmark
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-semibold'
                : 'bg-obsidian-950 text-slate-400 border-white/[0.06] hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Benchmark: {benchmarkName}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
