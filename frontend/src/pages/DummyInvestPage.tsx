import React, { useState, useEffect } from 'react';
import { PaperPortfolio, PaperPortfolioDetail, MarketType } from '../types/portfolio';
import { listDummyPortfolios, getDummyPortfolioDetail, deleteDummyPortfolio, createDummyPortfolio } from '../services/api';
import { PerformanceChart } from '../components/PerformanceChart';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Trash2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Globe
} from 'lucide-react';

interface DummyInvestPageProps {
  initialPortfolioId?: string;
  onNavigateToAllocator: () => void;
}

export const DummyInvestPage: React.FC<DummyInvestPageProps> = ({
  initialPortfolioId,
  onNavigateToAllocator,
}) => {
  const [portfolios, setPortfolios] = useState<PaperPortfolio[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialPortfolioId || null);
  const [detail, setDetail] = useState<PaperPortfolioDetail | null>(null);
  const [timeframe, setTimeframe] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New portfolio form state
  const [newFundName, setNewFundName] = useState<string>('My Virtual Fund');
  const [newMarket, setNewMarket] = useState<MarketType>('US');
  const [newCapital, setNewCapital] = useState<number>(50000);

  const loadPortfolios = async (selectId?: string) => {
    try {
      setLoading(true);
      const list = await listDummyPortfolios();
      setPortfolios(list);
      if (list.length > 0) {
        const idToLoad = selectId || (list.some(p => p.id === selectedId) ? selectedId! : list[0].id);
        setSelectedId(idToLoad);
        const data = await getDummyPortfolioDetail(idToLoad, timeframe);
        setDetail(data);
      } else {
        setDetail(null);
      }
    } catch (err) {
      console.error('Failed to load paper portfolios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolios(initialPortfolioId);
  }, [initialPortfolioId]);

  const handleSelectPortfolio = async (id: string) => {
    setSelectedId(id);
    try {
      setRefreshing(true);
      const data = await getDummyPortfolioDetail(id, timeframe);
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTimeframeChange = async (tf: string) => {
    setTimeframe(tf);
    if (!selectedId) return;
    try {
      setChartLoading(true);
      const data = await getDummyPortfolioDetail(selectedId, tf);
      setDetail(data);
    } catch (err) {
      console.error('Failed to change timeframe:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedId) return;
    try {
      setRefreshing(true);
      const data = await getDummyPortfolioDetail(selectedId, timeframe);
      setDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !confirm('Are you sure you want to delete this virtual portfolio?')) return;
    try {
      await deleteDummyPortfolio(selectedId);
      await loadPortfolios();
    } catch (err: any) {
      alert('Failed to delete portfolio: ' + err.message);
    }
  };

  const handleCreateFastFund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isIN = newMarket === 'IN';
      const defaultHoldings = isIN
        ? [
            { ticker: 'RELIANCE.NS', shares: 25, price: 1164.9, allocated_cash: 29122.5, target_weight: 40 },
            { ticker: 'TCS.NS', shares: 8, price: 2502.6, allocated_cash: 20020.8, target_weight: 35 },
            { ticker: 'INFY.NS', shares: 15, price: 1185.0, allocated_cash: 17775.0, target_weight: 25 },
          ]
        : [
            { ticker: 'NVDA', shares: 80, price: 204.64, allocated_cash: 16371.2, target_weight: 45 },
            { ticker: 'AAPL', shares: 45, price: 344.63, allocated_cash: 15508.35, target_weight: 35 },
            { ticker: 'MSFT', shares: 25, price: 420.0, allocated_cash: 10500.0, target_weight: 20 },
          ];

      const created = await createDummyPortfolio({
        name: newFundName,
        market: newMarket,
        currency: isIN ? '₹' : '$',
        initial_capital: newCapital,
        holdings: defaultHoldings,
        strategy_mode: 'balanced',
      });
      setShowCreateModal(false);
      await loadPortfolios(created.portfolio.id);
    } catch (err: any) {
      alert('Error creating fund: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading live mark-to-market paper portfolios...</span>
      </div>
    );
  }

  // Format Helper Variables
  const isPnlPositive = (detail?.summary?.total_pnl ?? 0) >= 0;
  const isDayPositive = (detail?.summary?.day_pnl ?? 0) >= 0;
  const bmChange = detail?.summary?.benchmark?.day_change_pct ?? 0.0;
  const curr = detail?.summary?.currency ?? '$';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Selector */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Paper Trading Simulation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Real-Market Virtual Portfolio Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Invest imaginary money using algorithmic allocations. Profits, losses, and day changes are tracked in real-time against live exchange market prices without risking real capital.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {portfolios.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedId || ''}
                onChange={(e) => handleSelectPortfolio(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.market} &bull; {p.currency}{p.initial_capital.toLocaleString()})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
                title="Refresh Live Market Valuation"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Fund</span>
          </button>
        </div>
      </div>

      {/* Main Portfolio Detail View */}
      {detail ? (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current Valuation */}
            <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-xs text-slate-400 block mb-1">Total Valuation (Mark-to-Market)</span>
              <div className="text-2xl font-extrabold text-white font-mono">
                {curr}{detail.summary.total_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Initial Capital: <span className="text-slate-300 font-mono">{curr}{detail.summary.initial_capital.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </p>
            </div>

            {/* Total Return P&L */}
            <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-xs text-slate-400 block mb-1">Unrealized Total P&amp;L</span>
              <div className={`text-2xl font-extrabold font-mono flex items-center gap-1 ${
                isPnlPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isPnlPositive ? '+' : '-'}{curr}{Math.abs(detail.summary.total_pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className={`text-[11px] font-mono mt-1 font-semibold ${
                isPnlPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isPnlPositive ? '+' : ''}{detail.summary.total_return_pct.toFixed(2)}% Net Return
              </p>
            </div>

            {/* Day P&L (Corrected formatting) */}
            <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-xs text-slate-400 block mb-1">Today's Session Change</span>
              <div className={`text-2xl font-extrabold font-mono flex items-center gap-1 ${
                isDayPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isDayPositive ? '+' : '-'}{curr}{Math.abs(detail.summary.day_pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Vs Benchmark ({detail.summary.benchmark.name}):{' '}
                <span className={`font-mono font-semibold ${bmChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {bmChange >= 0 ? '+' : ''}{bmChange.toFixed(2)}%
                </span>
              </p>
            </div>

            {/* Uninvested Cash */}
            <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <span className="text-xs text-slate-400 block mb-1">Available Cash Reserve</span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {curr}{detail.summary.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Invested in Stocks: <span className="text-slate-300 font-mono">{curr}{detail.summary.invested_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>

          {/* Performance Chart with Groww-Style Timeframes & Timezone Clarity */}
          <PerformanceChart
            history={detail.history}
            currency={detail.summary.currency}
            initialCapital={detail.summary.initial_capital}
            timeframe={timeframe}
            onTimeframeChange={handleTimeframeChange}
            timezoneInfo={detail.timezone_info}
            benchmarkName={detail.summary.benchmark.name}
            loading={chartLoading}
          />

          {/* Active Holdings Table */}
          <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Active Virtual Positions &amp; Mark-to-Market
                </h3>
              </div>
              <button
                onClick={handleDelete}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Fund</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Asset Symbol</th>
                    <th className="pb-3 font-semibold">Shares Owned</th>
                    <th className="pb-3 font-semibold text-right">Purchase Price</th>
                    <th className="pb-3 font-semibold text-right">Live Price</th>
                    <th className="pb-3 font-semibold text-right">Market Value</th>
                    <th className="pb-3 font-semibold text-right">Unrealized P&amp;L</th>
                    <th className="pb-3 font-semibold text-right">Return %</th>
                    <th className="pb-3 font-semibold text-right">Session Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {detail.holdings.map((h) => {
                    const isProfit = h.unrealized_pnl >= 0;
                    return (
                      <tr key={h.ticker} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-bold text-white font-mono">
                          {h.ticker}
                          <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[150px]">
                            {h.name}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-semibold text-slate-200">
                          {h.shares} units
                        </td>
                        <td className="py-3 text-right font-mono text-slate-400">
                          {h.currency}{h.buy_price.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-white">
                          {h.currency}{h.live_price.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-200">
                          {h.currency}{h.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right font-mono font-bold">
                          <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isProfit ? '+' : '-'}{h.currency}{Math.abs(h.unrealized_pnl).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] ${
                            isProfit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {h.pnl_pct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-slate-400 text-[11px]">
                          <span className={h.day_change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {h.day_change_pct >= 0 ? '+' : ''}{h.day_change_pct.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#0f1523] border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center border border-sky-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Paper Portfolios Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Run an optimization on the Portfolio Allocator page and click "Deploy to Paper Trading", or create a virtual portfolio directly to track real-market P&amp;L!
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={onNavigateToAllocator}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 text-white hover:bg-sky-400 shadow-md shadow-sky-500/20 transition-all"
            >
              Go to Portfolio Allocator
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:text-white transition-all"
            >
              Create Virtual Fund Here
            </button>
          </div>
        </div>
      )}

      {/* Create New Fund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f1523] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Initialize Virtual Investment Fund
              </span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateFastFund} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fund Name</label>
                <input
                  type="text"
                  required
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Market Universe</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setNewMarket('US'); setNewCapital(50000); }}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      newMarket === 'US'
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    🇺🇸 US Market (USD)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewMarket('IN'); setNewCapital(200000); }}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      newMarket === 'IN'
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    🇮🇳 Indian Market (INR)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Virtual Capital ({newMarket === 'IN' ? '₹' : '$'})
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={newCapital}
                  onChange={(e) => setNewCapital(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  Launch Paper Fund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
