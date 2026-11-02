import React, { useState, useEffect } from 'react';
import { MarketType, StrategyMode, UniversePreset, CuratedUniverses, OptimizationResult, AgentEvent } from '../types/portfolio';
import { fetchUniverses, streamOptimizationAnalysis, createDummyPortfolio } from '../services/api';
import { AgentWarRoom } from '../components/AgentWarRoom';
import { AllocationChart } from '../components/AllocationChart';
import { OrderBookTable } from '../components/OrderBookTable';
import { MetricsGrid } from '../components/MetricsGrid';
import {
  Play,
  Layers,
  ArrowRight,
  Download,
  CheckCircle,
  Plus,
  X,
  Briefcase,
  AlertCircle,
  Shield,
  SlidersHorizontal,
  ChevronRight,
  Check
} from 'lucide-react';

interface HomePageProps {
  currentMarket: MarketType;
  customApiKey: string;
  onNavigateToDummyInvest: (portfolioId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentMarket,
  customApiKey,
  onNavigateToDummyInvest,
}) => {
  const [universes, setUniverses] = useState<CuratedUniverses | null>(null);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>('mag7');
  const [tickers, setTickers] = useState<string[]>(['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA']);
  const [newTickerInput, setNewTickerInput] = useState<string>('');
  
  // User Capital & Strategy Mode
  const [capital, setCapital] = useState<number>(currentMarket === 'IN' ? 100000 : 10000);
  const [strategyMode, setStrategyMode] = useState<StrategyMode>('balanced');
  const [enableMasking, setEnableMasking] = useState<boolean>(false);

  // Execution & Streaming State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [agentEvents, setAgentEvents] = useState<Record<string, AgentEvent>>({});
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeployingDummy, setIsDeployingDummy] = useState<boolean>(false);

  // Currency symbol
  const currency = currentMarket === 'IN' ? '₹' : '$';

  // Load universes on initial mount
  useEffect(() => {
    fetchUniverses()
      .then((data) => {
        setUniverses(data);
        const marketPresets = currentMarket === 'IN' ? data.in : data.us;
        if (marketPresets.length > 0) {
          setSelectedUniverseId(marketPresets[0].id);
          setTickers(marketPresets[0].tickers);
        }
      })
      .catch((err) => console.error('Failed to load stock universes:', err));
  }, []);

  // Sync tickers and capital when market switches
  useEffect(() => {
    if (universes) {
      const presets = currentMarket === 'IN' ? universes.in : universes.us;
      if (presets.length > 0) {
        setSelectedUniverseId(presets[0].id);
        setTickers(presets[0].tickers);
      }
    }
    setCapital(currentMarket === 'IN' ? 100000 : 10000);
    setOptimizationResult(null);
  }, [currentMarket]);

  const handleSelectPreset = (preset: UniversePreset) => {
    setSelectedUniverseId(preset.id);
    setTickers(preset.tickers);
  };

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTickerInput.trim().toUpperCase();
    if (clean && !tickers.includes(clean)) {
      setTickers([...tickers, clean]);
      setNewTickerInput('');
      setSelectedUniverseId('custom');
    }
  };

  const handleRemoveTicker = (sym: string) => {
    setTickers(tickers.filter((t) => t !== sym));
    setSelectedUniverseId('custom');
  };

  const handleRunOptimization = () => {
    if (tickers.length === 0) {
      setErrorMessage('Please select or add at least one ticker.');
      return;
    }
    if (capital <= 0) {
      setErrorMessage('Capital must be greater than zero.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setOptimizationResult(null);
    setAgentEvents({});

    streamOptimizationAnalysis(
      {
        tickers,
        capital,
        strategy_mode: strategyMode,
        enable_masking: enableMasking,
        custom_api_key: customApiKey || undefined,
      },
      (event, data) => {
        if (event === 'agent_start' || event === 'agent_complete') {
          setAgentEvents((prev) => ({
            ...prev,
            [data.agent_id]: {
              agent_id: data.agent_id,
              agent_name: data.agent_name,
              role: data.role,
              status: data.status,
              output: data.output || prev[data.agent_id]?.output,
              views: data.views,
            },
          }));
        } else if (event === 'final_allocation') {
          setOptimizationResult(data.allocation_data);
        } else if (event === 'error') {
          setErrorMessage(data.message || 'An error occurred during agent execution.');
        }
      },
      (err) => {
        setIsAnalyzing(false);
        setErrorMessage(err.message || 'Connection error while communicating with backend.');
      },
      () => {
        setIsAnalyzing(false);
      }
    );
  };

  const handleDeployToDummyInvest = async () => {
    if (!optimizationResult) return;
    setIsDeployingDummy(true);
    try {
      const p = await createDummyPortfolio({
        name: `${currentMarket === 'IN' ? 'NSE Nifty Alpha' : 'US Tech Alpha'} Portfolio (${new Date().toLocaleDateString()})`,
        market: currentMarket,
        currency,
        initial_capital: capital,
        holdings: optimizationResult.holdings,
        strategy_mode: strategyMode,
        investment_date: new Date().toISOString().split('T')[0],
      });
      setIsDeployingDummy(false);
      onNavigateToDummyInvest(p.portfolio.id);
    } catch (err: any) {
      setIsDeployingDummy(false);
      alert('Failed to deploy to virtual portfolio tracker: ' + err.message);
    }
  };

  const handleExportMemo = () => {
    if (!optimizationResult) return;
    const memo = `# MASS Institutional Strategy Memo\n` +
      `Date: ${new Date().toISOString()}\n` +
      `Market: ${currentMarket} | Strategy: ${strategyMode.toUpperCase()}\n` +
      `Capital: ${currency}${capital.toLocaleString()}\n` +
      `Convex Solver: ${optimizationResult.method_used}\n\n` +
      `## Portfolio Statistics\n` +
      `- Expected Annual Return: +${optimizationResult.metrics.expected_annual_return_pct}%\n` +
      `- Annual Volatility: ${optimizationResult.metrics.annual_volatility_pct}%\n` +
      `- Sharpe Ratio: ${optimizationResult.metrics.sharpe_ratio}\n` +
      `- 95% Value at Risk: -${optimizationResult.metrics.var_95_pct}%\n\n` +
      `## Holdings Breakdown\n` +
      optimizationResult.holdings.map(h => `- ${h.ticker} (${h.name}): ${h.target_weight}% | ${h.shares} units @ ${currency}${h.price} = ${currency}${h.allocated_cash}`).join('\n') +
      `\n\nAcademic Project: Department of CSE, NIT Raipur. Author: Vibhor Shukla (Roll: 23115107).`;

    const blob = new Blob([memo], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MASS_Strategy_Memo_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentPresets = universes ? (currentMarket === 'IN' ? universes.in : universes.us) : [];

  return (
    <div className="space-y-6">
      {/* Parameter Control Deck */}
      <div className="bg-obsidian-900 border border-white/[0.08] rounded-xl p-5 sm:p-6 shadow-xl space-y-5">
        
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-wider">
                COGNITIVE ALLOCATION TERMINAL
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                // CONVEX BAYESIAN SOLVER
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Autonomous Dialectical Portfolio Optimization
            </h1>
          </div>

          <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
            <span>UNIVERSE:</span>
            <span className="text-white font-bold px-2 py-0.5 rounded bg-obsidian-950 border border-white/[0.08]">
              {currentMarket === 'IN' ? 'NSE NIFTY 50 (₹)' : 'S&P 500 MEGA-CAP ($)'}
            </span>
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Capital Input (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block font-mono text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              TOTAL CAPITAL FUND ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base font-bold">
                {currency}
              </span>
              <input
                type="number"
                min="100"
                step="500"
                value={capital}
                onChange={(e) => setCapital(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-obsidian-950 border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-sky-500 transition-colors tabular-nums"
                placeholder="10000"
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              Converts continuous weights into exact integer share lots.
            </span>
          </div>

          {/* Strategy Mode (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block font-mono text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              OBJECTIVE FUNCTION
            </label>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setStrategyMode('balanced')}
                className={`py-2 px-1 rounded-lg border transition-all text-center ${
                  strategyMode === 'balanced'
                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/40 font-bold'
                    : 'bg-obsidian-950 text-slate-400 border-white/[0.06] hover:text-slate-200'
                }`}
              >
                Balanced
                <span className="block text-[9px] text-slate-500 font-normal">Max Sharpe</span>
              </button>
              <button
                type="button"
                onClick={() => setStrategyMode('conservative')}
                className={`py-2 px-1 rounded-lg border transition-all text-center ${
                  strategyMode === 'conservative'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold'
                    : 'bg-obsidian-950 text-slate-400 border-white/[0.06] hover:text-slate-200'
                }`}
              >
                Defensive
                <span className="block text-[9px] text-slate-500 font-normal">Min Vol</span>
              </button>
              <button
                type="button"
                onClick={() => setStrategyMode('aggressive')}
                className={`py-2 px-1 rounded-lg border transition-all text-center ${
                  strategyMode === 'aggressive'
                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/40 font-bold'
                    : 'bg-obsidian-950 text-slate-400 border-white/[0.06] hover:text-slate-200'
                }`}
              >
                Growth
                <span className="block text-[9px] text-slate-500 font-normal">High Beta</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              Parameterizes risk aversion coefficient λ in Black-Litterman.
            </span>
          </div>

          {/* Academic Contamination Protocol Switch (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block font-mono text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>CONTAMINATION SHIELD</span>
              <span className="text-[9px] text-sky-400 font-mono bg-sky-500/10 px-1 py-0.2 rounded border border-sky-500/20">
                RESEARCH INNOVATION
              </span>
            </label>
            <div
              onClick={() => setEnableMasking(!enableMasking)}
              className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                enableMasking
                  ? 'bg-sky-500/10 border-sky-500/40'
                  : 'bg-obsidian-950 border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${enableMasking ? 'text-sky-400' : 'text-slate-500'}`} />
                <div className="font-mono text-xs">
                  <span className={`block font-semibold ${enableMasking ? 'text-sky-300' : 'text-slate-300'}`}>
                    {enableMasking ? 'Anonymization Active' : 'Real Ticker Identifiers'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {enableMasking ? 'TSLA -> Asset_Alpha (Anti-Lookahead)' : 'Standard entity names'}
                  </span>
                </div>
              </div>

              <div className={`w-8 h-4 rounded-full transition-colors relative ${enableMasking ? 'bg-sky-500' : 'bg-obsidian-800 border border-white/[0.1]'}`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${enableMasking ? 'right-0.5' : 'left-0.5'}`} />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              Proves zero look-ahead bias by masking corporate identities from LLMs.
            </span>
          </div>
        </div>

        {/* Stock Universe Presets & Ticker Selector */}
        <div className="space-y-2 pt-2 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              CURATED SECTOR BASKETS
            </span>

            {/* Quick Universe Chips */}
            <div className="flex flex-wrap gap-1 font-mono text-xs">
              {currentPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-1 rounded text-xs transition-all border ${
                    selectedUniverseId === preset.id
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 font-semibold'
                      : 'bg-obsidian-950 text-slate-400 border-white/[0.06] hover:text-white'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tickers Chip Array & Add Input */}
          <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-obsidian-950 border border-white/[0.06] rounded-lg min-h-[46px]">
            {tickers.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-obsidian-850 text-sky-300 border border-white/[0.08]"
              >
                {t}
                <button
                  type="button"
                  onClick={() => handleRemoveTicker(t)}
                  className="hover:text-rose-400 text-slate-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Add Custom Ticker Input */}
            <form onSubmit={handleAddTicker} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newTickerInput}
                onChange={(e) => setNewTickerInput(e.target.value)}
                placeholder="+ Add symbol (e.g. AMD)"
                className="bg-transparent border-none text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none w-36 py-1 px-2"
              />
              {newTickerInput && (
                <button
                  type="submit"
                  className="p-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 text-xs font-mono"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Call to Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-slate-400">
            Selected Basket: <strong className="text-white">{tickers.length} assets</strong> &bull; Inference Engine: <span className="text-sky-400 font-semibold">Groq LPU (Qwen 3.8 27B)</span>
          </div>

          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleRunOptimization}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
              isAnalyzing
                ? 'bg-obsidian-800 text-slate-500 cursor-not-allowed border border-white/[0.08]'
                : 'bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-white rounded-full animate-spin" />
                <span>DIALECTICAL SOLVER RUNNING...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RUN MULTI-AGENT COGNITIVE ENGINE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Agent War Room */}
      <AgentWarRoom events={agentEvents} isAnalyzing={isAnalyzing} />

      {/* Final Allocation Dashboard (Appears once optimization completes) */}
      {optimizationResult && (
        <div className="space-y-6">
          {/* Action Header Ribbon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-obsidian-900 border border-emerald-500/30 shadow-xl">
            <div>
              <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
                CONVEX QUADRATIC SOLVER CONVERGED
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                MASS Mathematical Allocation &amp; Trade Blueprint ({optimizationResult.method_used})
              </h2>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={handleExportMemo}
                className="px-3 py-1.5 rounded-lg bg-obsidian-950 text-slate-300 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all flex items-center gap-1.5"
              >
                <Download className="w-3 h-3" />
                <span>Export Memo (.md)</span>
              </button>

              <button
                type="button"
                disabled={isDeployingDummy}
                onClick={handleDeployToDummyInvest}
                className="px-4 py-1.5 rounded-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 transition-all shadow-md flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Deploy to Virtual Tracker (/dummy-invest)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Allocation Visualizer & Order Book */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5">
              <AllocationChart holdings={optimizationResult.holdings} currency={currency} />
            </div>
            <div className="lg:col-span-7">
              <OrderBookTable
                holdings={optimizationResult.holdings}
                totalInvested={optimizationResult.total_invested}
                cashReserve={optimizationResult.cash_reserve}
                totalCapital={optimizationResult.total_capital}
                currency={currency}
              />
            </div>
          </div>

          {/* Metrics & Benchmark Comparisons */}
          <MetricsGrid
            metrics={optimizationResult.metrics}
            totalCapital={capital}
            currency={currency}
            weights={optimizationResult.weights}
          />
        </div>
      )}
    </div>
  );
};
