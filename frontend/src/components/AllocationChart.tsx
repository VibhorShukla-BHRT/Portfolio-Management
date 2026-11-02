import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { HoldingAllocation } from '../types/portfolio';
import { PieChart as PieIcon } from 'lucide-react';

interface AllocationChartProps {
  holdings: HoldingAllocation[];
  currency: string;
}

const PALETTE = [
  '#38bdf8', // Sky
  '#10b981', // Emerald
  '#818cf8', // Indigo
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
];

export const AllocationChart: React.FC<AllocationChartProps> = ({ holdings, currency }) => {
  const data = holdings.map((h, i) => ({
    name: h.ticker,
    company: h.name,
    value: h.target_weight,
    allocated_cash: h.allocated_cash,
    shares: h.shares,
    price: h.price,
    color: PALETTE[i % PALETTE.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-100">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
            <span className="text-slate-400 font-normal">({item.company})</span>
          </div>
          <div className="text-slate-300">
            Optimal Weight: <strong className="text-sky-400">{item.value.toFixed(2)}%</strong>
          </div>
          <div className="text-slate-300">
            Sized Capital: <strong className="text-white">{currency}{item.allocated_cash.toLocaleString()}</strong>
          </div>
          <div className="text-slate-400 text-[11px]">
            Discrete Shares: {item.shares} @ {currency}{item.price.toFixed(2)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <PieIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Continuous Bayesian Asset Allocation
          </h3>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          &sum; w_i = 100%
        </span>
      </div>

      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f1523" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-400 font-medium">Model</span>
          <span className="text-sm font-bold text-white">Black-Litterman</span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t border-slate-800/80">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-semibold text-slate-200">{item.name}</span>
            <span className="font-mono text-slate-400 text-[11px] ml-auto">{item.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
