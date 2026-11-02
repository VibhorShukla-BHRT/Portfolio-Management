import React, { useState, useEffect } from 'react';
import { PaperPortfolio, PaperPortfolioDetail, MarketType } from '../types/portfolio';
import {
  listDummyPortfolios,
  getDummyPortfolioDetail,
  deleteDummyPortfolio,
  createDummyPortfolio,
  updateDummyPortfolioDate
} from '../services/api';
import { PerformanceChart } from '../components/PerformanceChart';
import {
  Briefcase,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Calendar,
  Edit2
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
  const [showEditDateModal, setShowEditDateModal] = useState<boolean>(false);
  const [editingDateValue, setEditingDateValue] = useState<string>('2026-10-01');

  // New portfolio form state
  const [newFundName, setNewFundName] = useState<string>('Virtual Alpha Fund');
  const [newMarket, setNewMarket] = useState<MarketType>('US');
  const [newCapital, setNewCapital] = useState<number>(50000);
  const [newInvestmentDate, setNewInvestmentDate] = useState<string>('2026-10-01');

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
        if (data.portfolio.investment_date) {
          setEditingDateValue(data.portfolio.investment_date);
        }
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
      if (data.portfolio.investment_date) {
        setEditingDateValue(data.portfolio.investment_date);
      }
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

  const handleSaveInvestmentDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !editingDateValue) return;
    try {
      setChartLoading(true);
      await updateDummyPortfolioDate(selectedId, editingDateValue);
      setShowEditDateModal(false);
      const data = await getDummyPortfolioDetail(selectedId, timeframe);
      setDetail(data);
    } catch (err: any) {
      alert('Failed to update investment date: ' + err.message);
    } finally {
      setChartLoading(false);
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
        investment_date: newInvestmentDate,
      } as any);
      setShowCreateModal(false);
      await loadPortfolios(created.portfolio.id);
    } catch (err: any) {
      alert('Error creating fund: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-400">
        <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span>Synchronizing live mark-to-market valuations...</span>
      </div>
    );
  }

  // Format Helper Variables
  const isPnlPositive = (detail?.summary?.total_pnl ?? 0) >= 0;
  const isDayPositive = (detail?.summary?.day_pnl ?? 0) >= 0;
  const bmChange = detail?.summary?.benchmark?.day_change_pct ?? 0.0;
  const curr = detail?.summary?.currency ?? '$';

  return (
    <div className="space-y-6">
      {/* Top Header Deck */}
      <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
              PAPER TRADING ENGINE
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              // ZERO RISK SIMULATION
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Real-Market Virtual Portfolio Tracker
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Real exchange prices from Yahoo Finance track algorithmic return without risking real capital.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto font-mono text-xs">
          {portfolios.length > 0 && (
            <div className="flex items-center gap-1.5 bg-obsidian-950 p-1 rounded-lg border border-white/[0.08]">
              <select
                value={selectedId || ''}
                onChange={(e) => handleSelectPortfolio(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none pr-2 cursor-pointer font-medium"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id} className="bg-obsidian-950 text-slate-200">
                    {p.name} ({p.market} &bull; {p.currency}{p.initial_capital.toLocaleString()})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 rounded hover:bg-obsidian-850 text-slate-400 hover:text-white transition-colors"
                title="Refresh Live Market Quotes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold transition-all shadow-md flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Fund</span>
          </button>
        </div>
      </div>

      {/* Main Portfolio Detail View */}
      {detail ? (
        <div className="space-y-5">
          {/* Key Metric Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Current Valuation */}
            <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-4 shadow-lg">
              <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                TOTAL VALUATION (MARK-TO-MARKET)
              </span>
              <div className="text-xl font-bold text-white font-mono tabular-nums">
                {curr}{detail.summary.total_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>Initial: <strong className="text-slate-300 tabular-nums">{curr}{detail.summary.initial_capital.toLocaleString()}</strong></span>
                <button
                  onClick={() => setShowEditDateModal(true)}
                  className="inline-flex items-center gap-1 text-[9px] text-sky-400 hover:text-sky-300 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20 transition-colors"
                  title="Adjust your investment starting date"
                >
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{detail.portfolio.investment_date || '2026-10-01'}</span>
                  <Edit2 className="w-2 h-2 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Total Return P&L */}
            <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-4 shadow-lg">
              <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                UNREALIZED TOTAL P&amp;L
              </span>
              <div className={`text-xl font-bold font-mono tabular-nums flex items-center gap-0.5 ${
                isPnlPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isPnlPositive ? '+' : '-'}{curr}{Math.abs(detail.summary.total_pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className={`text-[10px] font-mono mt-1 font-semibold tabular-nums ${
                isPnlPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isPnlPositive ? '+' : ''}{detail.summary.total_return_pct.toFixed(2)}% Net Return
              </p>
            </div>

            {/* Day P&L */}
            <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-4 shadow-lg">
              <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                TODAY'S SESSION CHANGE
              </span>
              <div className={`text-xl font-bold font-mono tabular-nums flex items-center gap-0.5 ${
                isDayPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isDayPositive ? '+' : '-'}{curr}{Math.abs(detail.summary.day_pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                Vs {detail.summary.benchmark.name}:{' '}
                <span className={`font-semibold tabular-nums ${bmChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {bmChange >= 0 ? '+' : ''}{bmChange.toFixed(2)}%
                </span>
              </p>
            </div>

            {/* Uninvested Cash */}
            <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-4 shadow-lg">
              <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                AVAILABLE CASH RESERVE
              </span>
              <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">
                {curr}{detail.summary.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                Deployed in Stocks: <span className="text-slate-300 tabular-nums">{curr}{detail.summary.invested_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>

          {/* Performance Chart */}
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
          <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="font-mono text-xs font-bold text-white tracking-wide uppercase">
                  Active Virtual Holdings &amp; Mark-to-Market
                </h3>
              </div>
              <button
                onClick={handleDelete}
                className="font-mono text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>DELETE FUND</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="pb-2.5 font-semibold">ASSET TICKER</th>
                    <th className="pb-2.5 font-semibold">SHARES OWNED</th>
                    <th className="pb-2.5 font-semibold text-right">BUY PRICE</th>
                    <th className="pb-2.5 font-semibold text-right">LIVE PRICE</th>
                    <th className="pb-2.5 font-semibold text-right">MARKET VALUE</th>
                    <th className="pb-2.5 font-semibold text-right">UNREALIZED P&amp;L</th>
                    <th className="pb-2.5 font-semibold text-right">RETURN %</th>
                    <th className="pb-2.5 font-semibold text-right">SESSION CHANGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {detail.holdings.map((h) => {
                    const isProfit = h.unrealized_pnl >= 0;
                    return (
                      <tr key={h.ticker} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 font-bold text-white flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{h.ticker}</span>
                          <span className="font-sans text-[10px] text-slate-500 font-normal truncate max-w-[140px]">
                            {h.name}
                          </span>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-200 tabular-nums">
                          {h.shares} units
                        </td>
                        <td className="py-2.5 text-right text-slate-400 tabular-nums">
                          {h.currency}{h.buy_price.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-white tabular-nums">
                          {h.currency}{h.live_price.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-200 tabular-nums">
                          {h.currency}{h.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 text-right font-bold tabular-nums">
                          <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isProfit ? '+' : '-'}{h.currency}{Math.abs(h.unrealized_pnl).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold tabular-nums">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] ${
                            isProfit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isProfit ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                            {isProfit ? '+' : ''}{h.pnl_pct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-[11px] tabular-nums">
                          <span className={h.day_change_pct >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
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
        <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-10 text-center space-y-3 font-mono">
          <div className="w-10 h-10 rounded-lg bg-obsidian-950 text-sky-400 mx-auto flex items-center justify-center border border-white/[0.08]">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Active Paper Portfolios</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
            Run an optimization on the Portfolio Allocator page and click "Deploy to Paper Trading", or create a virtual portfolio directly to track live market performance!
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={onNavigateToAllocator}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-sky-500 text-obsidian-950 hover:bg-sky-400 transition-colors"
            >
              Go to Allocator
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-obsidian-950 border border-white/[0.08] text-slate-200 hover:text-white transition-colors"
            >
              Create Virtual Fund
            </button>
          </div>
        </div>
      )}

      {/* Edit Investment Date Modal */}
      {showEditDateModal && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
          <div className="bg-obsidian-900 border border-white/[0.12] rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="font-bold text-white text-xs uppercase flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Adjust Investment Date
              </span>
              <button
                onClick={() => setShowEditDateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveInvestmentDate} className="space-y-3 text-xs">
              <p className="text-slate-400 text-[11px] font-sans">
                Set when you originally opened this fund (e.g. October 2026). The valuation trajectory X-axis will start strictly on this date.
              </p>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Investment Start Date</label>
                <input
                  type="date"
                  required
                  value={editingDateValue}
                  onChange={(e) => setEditingDateValue(e.target.value)}
                  className="w-full bg-obsidian-950 border border-white/[0.08] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowEditDateModal(false)}
                  className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold"
                >
                  Save &amp; Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Fast Fund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
          <div className="bg-obsidian-900 border border-white/[0.12] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="font-bold text-white text-xs uppercase flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                Initialize Virtual Fund
              </span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateFastFund} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Fund Name</label>
                <input
                  type="text"
                  required
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  className="w-full bg-obsidian-950 border border-white/[0.08] rounded px-3 py-2 text-white font-sans text-xs focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Test Growth Fund"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Market Universe</label>
                  <select
                    value={newMarket}
                    onChange={(e) => {
                      const m = e.target.value as MarketType;
                      setNewMarket(m);
                      setNewCapital(m === 'IN' ? 100000 : 50000);
                    }}
                    className="w-full bg-obsidian-950 border border-white/[0.08] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="US">US ($ USD)</option>
                    <option value="IN">India (₹ INR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">
                    Initial Capital ({newMarket === 'IN' ? '₹' : '$'})
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={newCapital}
                    onChange={(e) => setNewCapital(parseFloat(e.target.value) || 0)}
                    className="w-full bg-obsidian-950 border border-white/[0.08] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Investment Start Date</label>
                <input
                  type="date"
                  required
                  value={newInvestmentDate}
                  onChange={(e) => setNewInvestmentDate(e.target.value)}
                  className="w-full bg-obsidian-950 border border-white/[0.08] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold"
                >
                  Deploy Virtual Fund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
