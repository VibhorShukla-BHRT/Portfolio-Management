import React, { useState } from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PaperSnapshot, TimezoneInfo } from '../types/portfolio';
import { TrendingUp, Globe, Clock, Layers, Calendar } from 'lucide-react';

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
  { id: '1D', label: '1D', desc: 'Today (Intraday)' },
  { id: '1W', label: '1W', desc: 'Past 1 Week' },
  { id: '1M', label: '1M', desc: 'Past 1 Month' },
  { id: '1Y', label: '1Y', desc: 'Past 1 Year' },
  { id: '5Y', label: '5Y', desc: 'Past 5 Years' },
  { id: 'ALL', label: 'ALL', desc: 'Since Inception' },
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

  // Format data points for Recharts
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const isPositive = item.return_pct >= 0;
      const isBenchmarkPositive = item.benchmark_return_pct >= 0;

      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[220px]">
          {/* Time & Timezone Header */}
          <div className="pb-1.5 border-b border-slate-800 text-[11px] text-slate-400 space-y-0.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-sky-400" />
              <span>{item.display_market_time}</span>
            </div>
            {item.time_ist && (
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Local Time:</span>
                <span className="font-mono text-slate-300">{item.time_ist}</span>
              </div>
            )}
            {item.time_edt && timezoneInfo?.market === 'US' && (
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Exchange (EDT):</span>
                <span className="font-mono text-slate-300">{item.time_edt}</span>
              </div>
            )}
          </div>

          {/* Portfolio Valuation */}
          <div>
            <div className="text-[10px] text-slate-400">Portfolio Valuation</div>
            <div className="text-base font-extrabold text-white font-mono">
              {currency}{item.valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`font-mono text-[11px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              Portfolio Return: {isPositive ? '+' : ''}{item.return_pct.toFixed(2)}%
            </div>
          </div>

          {/* Benchmark Return Overlay */}
          {showBenchmark && (
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-indigo-300">{benchmarkName}:</span>
              <span className={`font-mono font-semibold ${isBenchmarkPositive ? 'text-indigo-400' : 'text-rose-400'}`}>
                {isBenchmarkPositive ? '+' : ''}{item.benchmark_return_pct.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0f1523] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      {/* Top Header & Timezone Clarity */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Historical Valuation &amp; Growth Trajectory
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Track asset basket value growth over time against market benchmarks.
          </p>
        </div>

        {/* Timezone & Market Hours Badge */}
        {timezoneInfo && (
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-2.5">
            <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div>
              <span className="text-slate-300 font-semibold block">
                {timezoneInfo.exchange_name} ({timezoneInfo.exchange_timezone})
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Session: {timezoneInfo.market_hours}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Chart Graphic */}
      <div className="h-72 w-full relative">
        {loading && (
          <div className="absolute inset-0 bg-[#0f1523]/70 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
            <div className="flex items-center gap-2 text-xs text-sky-300 font-semibold">
              <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>Fetching historical market series...</span>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${currency}${v.toLocaleString()}`}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="valuation"
              name="Portfolio Valuation"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#growthGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Groww-Style Timeframe Selector Pills & Benchmark Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
        {/* Groww-style timeframe pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => onTimeframeChange(tf.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showBenchmark
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Benchmark Comparison ({benchmarkName})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
