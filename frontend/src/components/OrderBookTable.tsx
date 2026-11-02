import React from 'react';
import { HoldingAllocation } from '../types/portfolio';
import { ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

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
    <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/[0.08] mb-4 gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <div>
            <h3 className="font-mono text-xs font-bold text-white tracking-wide uppercase">
              Execution Order Sizing (Discrete Shares)
            </h3>
            <p className="text-[11px] text-slate-400">
              Mixed-integer programming prevents non-tradable fractional shares and reduces execution slippage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">DEPLOYED CAPITAL</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {currency}{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">CASH RESERVE</span>
            <span className="text-amber-400 font-bold tabular-nums">
              {currency}{cashReserve.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] text-slate-500 font-mono text-[10px] uppercase tracking-wider">
              <th className="pb-2.5 font-semibold">TICKER</th>
              <th className="pb-2.5 font-semibold">ASSET NAME</th>
              <th className="pb-2.5 font-semibold text-right">WEIGHT</th>
              <th className="pb-2.5 font-semibold text-right">PRICE</th>
              <th className="pb-2.5 font-semibold text-right">DISCRETE SHARES</th>
              <th className="pb-2.5 font-semibold text-right">SIZED CAPITAL</th>
              <th className="pb-2.5 font-semibold text-right">MOMENTUM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-mono">
            {holdings.map((h) => {
              const isPositive = (h.change_pct ?? 0) >= 0;
              return (
                <tr key={h.ticker} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    {h.ticker}
                  </td>
                  <td className="py-2.5 text-slate-300 font-sans max-w-[200px] truncate text-xs">
                    {h.name}
                  </td>
                  <td className="py-2.5 text-right text-sky-400 font-semibold tabular-nums">
                    {h.target_weight.toFixed(2)}%
                  </td>
                  <td className="py-2.5 text-right text-slate-300 tabular-nums">
                    {currency}{h.price.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-white tabular-nums">
                    <span className="bg-obsidian-950 px-2 py-0.5 rounded border border-white/[0.08]">
                      {h.shares} units
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-bold text-emerald-400 tabular-nums">
                    {currency}{h.allocated_cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    <span className={`inline-flex items-center gap-0.5 font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isPositive ? '+' : '-'}{Math.abs(h.change_pct ?? 0).toFixed(2)}%
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
