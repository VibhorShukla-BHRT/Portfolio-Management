import React, { useState, useEffect } from 'react';
import { MarketType, StrategyMode, UniversePreset, CuratedUniverses, OptimizationResult, AgentEvent } from '../types/portfolio';
import { fetchUniverses, streamOptimizationAnalysis, createDummyPortfolio } from '../services/api';
import { AgentWarRoom } from '../components/AgentWarRoom';
import { AllocationChart } from '../components/AllocationChart';
import { OrderBookTable } from '../components/OrderBookTable';
import { MetricsGrid } from '../components/MetricsGrid';
import {
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  Shield,
  Layers,
  ArrowRight,
  Download,
  CheckCircle,
  Plus,
  X,
  Briefcase,
  AlertCircle
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
        // Default to first preset of the current market
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
        name: `${currentMarket === 'IN' ? 'Nifty Alpha' : 'US Tech Alpha'} Portfolio (${new Date().toLocaleDateString()})`,
        market: currentMarket,
        currency,
        initial_capital: capital,
        holdings: optimizationResult.holdings,
        strategy_mode: strategyMode,
      });
      setIsDeployingDummy(false);
      onNavigateToDummyInvest(p.portfolio.id);
    } catch (err: any) {
      setIsDeployingDummy(false);
      alert('Failed to deploy to dummy investment tracker: ' + err.message);
    }
  };

  const handleExportMemo = () => {
    if (!optimizationResult) return;
    const memo = `# MASS Investment Strategy Memo\n` +
      `Date: ${new Date().toISOString()}\n` +
      `Market: ${currentMarket} | Strategy: ${strategyMode.toUpperCase()}\n` +
      `Total Capital: ${currency}${capital.toLocaleString()}\n` +
      `Optimal Method: ${optimizationResult.method_used}\n\n` +
      `## Portfolio Statistics\n` +
      `- Expected Annual Return: +${optimizationResult.metrics.expected_annual_return_pct}%\n` +
      `- Annual Volatility: ${optimizationResult.metrics.annual_volatility_pct}%\n` +
      `- Sharpe Ratio: ${optimizationResult.metrics.sharpe_ratio}\n` +
      `- 95% Value at Risk: -${optimizationResult.metrics.var_95_pct}%\n\n` +
      `## Holdings Breakdown\n` +
      optimizationResult.holdings.map(h => `- ${h.ticker} (${h.name}): ${h.target_weight}% | ${h.shares} shares @ ${currency}${h.price} = ${currency}${h.allocated_cash}`).join('\n') +
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
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Configuration Panel */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Convex Asset Allocation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Institutional Capital Allocation &amp; Dialectical Debate
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Enter your investment fund below. The 7-agent MASS architecture synthesizes qualitative earnings calls, news, and technical cross-asset covariance to compute optimal mathematical portfolio weights using Black-Litterman and Hierarchical Risk Parity (HRP).
          </p>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Capital Input (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
              Total Capital Fund ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base font-bold">
                {currency}
              </span>
              <input
                type="number"
                min="100"
                step="500"
                value={capital}
                onChange={(e) => setCapital(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-lg font-mono font-bold text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
                placeholder="10000"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Allocated into exact discrete shares &amp; continuous mathematical percentages.
            </p>
          </div>

          {/* Strategy Mode (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
              Risk &amp; Return Objective
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStrategyMode('balanced')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                  strategyMode === 'balanced'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-md shadow-sky-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Balanced
                <span className="block text-[10px] font-normal text-slate-400">Max Sharpe</span>
              </button>
              <button
                type="button"
                onClick={() => setStrategyMode('conservative')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                  strategyMode === 'conservative'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Defensive
                <span className="block text-[10px] font-normal text-slate-400">Min Volatility</span>
              </button>
              <button
                type="button"
                onClick={() => setStrategyMode('aggressive')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                  strategyMode === 'aggressive'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/10'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Growth
                <span className="block text-[10px] font-normal text-slate-400">High Beta</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Defines the quadratic optimization objective function and covariance penalty.
            </p>
          </div>

          {/* Academic Contamination Protocol Switch (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>MASS Contamination Shield</span>
              <span className="text-[10px] text-sky-400 font-mono">Academic Innovation</span>
            </label>
            <div
              onClick={() => setEnableMasking(!enableMasking)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                enableMasking
                  ? 'bg-indigo-950/30 border-indigo-500/40 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${enableMasking ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    {enableMasking ? 'Masking Shield Active' : 'Unmasked Real Identifiers'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {enableMasking ? 'TSLA -> Asset_Alpha (Anti-Lookahead)' : 'Standard entity names'}
                  </span>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors relative ${enableMasking ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${enableMasking ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Anonymizes assets to prove zero look-ahead memorization during backtesting.
            </p>
          </div>
        </div>

        {/* Stock Universe Presets & Ticker Selector */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Curated Institutional Baskets ({currentMarket})
            </span>

            {/* Quick Universe Chips */}
            <div className="flex flex-wrap gap-1.5">
              {currentPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    selectedUniverseId === preset.id
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tickers Chip Array & Add Input */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl min-h-[52px]">
            {tickers.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-800/80 text-sky-300 border border-slate-700/60 shadow-sm"
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
            <form onSubmit={handleAddTicker} className="inline-flex items-center gap-1.5">
              <input
                type="text"
                value={newTickerInput}
                onChange={(e) => setNewTickerInput(e.target.value)}
                placeholder="+ Add symbol (e.g. TSM)"
                className="bg-transparent border-none text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none w-36 py-1 px-2"
              />
              {newTickerInput && (
                <button
                  type="submit"
                  className="p-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary Call to Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Current basket: <strong className="text-slate-200">{tickers.length} assets</strong> | LLM Engine: <span className="font-mono text-sky-300">Groq LPU (Qwen 3.8 27B)</span>
          </div>

          <button
            type="button"
            disabled={isAnalyzing}
            onClick={handleRunOptimization}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl ${
              isAnalyzing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-sky-500 via-indigo-600 to-sky-500 bg-size-200 hover:bg-pos-100 text-white shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Adversarial Debate in Progress...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Multi-Agent Optimization</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Agent War Room */}
      <AgentWarRoom events={agentEvents} isAnalyzing={isAnalyzing} />

      {/* Final Allocation Dashboard (Appears once optimization completes) */}
      {optimizationResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-500/30 shadow-xl">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <CheckCircle className="w-4 h-4" />
                Optimization Converged Successfully
              </span>
              <h2 className="text-lg font-extrabold text-white">
                MASS Mathematical Allocation &amp; Trade Blueprint
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportMemo}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Memo</span>
              </button>

              <button
                type="button"
                disabled={isDeployingDummy}
                onClick={handleDeployToDummyInvest}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Deploy to Paper Trading (/dummy-invest)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Allocation Visualizer & Order Book */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
