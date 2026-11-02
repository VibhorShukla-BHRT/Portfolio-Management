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
        <div className="bg-obsidian-950 border border-white/[0.1] p-3 rounded-lg shadow-2xl font-mono text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-white">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
            <span className="text-slate-400 font-normal">({item.company})</span>
          </div>
          <div className="text-slate-300">
            Target Weight: <strong className="text-sky-400 font-bold">{item.value.toFixed(2)}%</strong>
          </div>
          <div className="text-slate-300">
            Capital Allocated: <strong className="text-white">{currency}{item.allocated_cash.toLocaleString()}</strong>
          </div>
          <div className="text-slate-400 text-[11px]">
            Order: {item.shares} shares @ {currency}{item.price.toFixed(2)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-sky-400" />
          <h3 className="font-mono text-xs font-bold text-white tracking-wide uppercase">
            Convex Weight Allocation Matrix
          </h3>
        </div>
        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Σ w_i = 100%
        </span>
      </div>

      <div className="h-56 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#090b10" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-mono">
          <span className="text-[10px] text-slate-500 uppercase">SOLVER</span>
          <span className="text-xs font-bold text-slate-200">Black-Litterman</span>
        </div>
      </div>

      {/* High-density Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t border-white/[0.08]">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 p-1.5 rounded bg-obsidian-950 border border-white/[0.04]">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <div className="min-w-0 font-mono text-[11px] leading-tight">
              <span className="font-bold text-slate-200 block truncate">{item.name}</span>
              <span className="text-slate-400 text-[10px]">{item.value.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
