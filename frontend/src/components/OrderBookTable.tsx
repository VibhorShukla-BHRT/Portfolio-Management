import React from 'react';
import { HoldingAllocation } from '../types/portfolio';
import { DollarSign, ArrowUpRight, ArrowDownRight, Layers, Coins } from 'lucide-react';

interface OrderBookTableProps {
  holdings: HoldingAllocation[];
  totalInvested: number;
  cashReserve: number;
  totalCapital: number;
  currency: string;
}

export const OrderBookTable: React.FC<OrderBookTableProps> = ({
  holdings,
  totalInvested,
  cashReserve,
  totalCapital,
  currency,
}) => {
  return (
    <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Trade Execution Order Book (Discrete Sizing)
            </h3>
            <p className="text-xs text-slate-400">
              Discrete integer shares sized to prevent fractional share execution slippage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Active Deployed</span>
            <span className="text-emerald-400 font-bold">{currency}{totalInvested.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Cash Buffer</span>
            <span className="text-amber-400 font-bold">{currency}{cashReserve.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="pb-3 font-semibold">Asset Ticker</th>
              <th className="pb-3 font-semibold">Company Name</th>
              <th className="pb-3 font-semibold text-right">Target Wt.</th>
              <th className="pb-3 font-semibold text-right">Market Price</th>
              <th className="pb-3 font-semibold text-right">Shares to Buy</th>
              <th className="pb-3 font-semibold text-right">Capital Sized</th>
              <th className="pb-3 font-semibold text-right">24h Momentum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {holdings.map((h) => {
              const isPositive = h.change_pct >= 0;
              return (
                <tr key={h.ticker} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    {h.ticker}
                  </td>
                  <td className="py-3 text-slate-300 max-w-[200px] truncate">
                    {h.name}
                  </td>
                  <td className="py-3 text-right font-mono text-sky-300 font-semibold">
                    {h.target_weight.toFixed(2)}%
                  </td>
                  <td className="py-3 text-right font-mono text-slate-300">
                    {currency}{h.price.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-white">
                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {h.shares} units
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-400">
                    {currency}{h.allocated_cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right font-mono">
                    <span className={`inline-flex items-center gap-0.5 font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(h.change_pct).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
