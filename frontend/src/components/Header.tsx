import React from 'react';
import { MarketType } from '../types/portfolio';
import { LineChart, Briefcase, Key, ShieldCheck, ExternalLink, Sparkles, Sliders } from 'lucide-react';

interface HeaderProps {
  currentMarket: MarketType;
  onMarketChange: (market: MarketType) => void;
  activeTab: 'allocator' | 'dummy-invest';
  onTabChange: (tab: 'allocator' | 'dummy-invest') => void;
  onOpenSettings: () => void;
  hasCustomKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMarket,
  onMarketChange,
  activeTab,
  onTabChange,
  onOpenSettings,
  hasCustomKey,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0d121d]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-400 via-indigo-300 to-white bg-clip-text text-transparent">
                  MASS
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  v2.0
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> NIT Raipur
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Autonomous Multi-Agent Asset Management Architecture
              </p>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('allocator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'allocator'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portfolio Allocator</span>
            </button>
            <button
              onClick={() => onTabChange('dummy-invest')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dummy-invest'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Paper Trading (/dummy-invest)</span>
            </button>
          </div>

          {/* Right: Market Switcher & Settings */}
          <div className="flex items-center gap-2">
            {/* Market Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => onMarketChange('US')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  currentMarket === 'US'
                    ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="S&P 500 & US Tech Giants (USD)"
              >
                🇺🇸 US ($)
              </button>
              <button
                onClick={() => onMarketChange('IN')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  currentMarket === 'IN'
                    ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="NIFTY 50 & Indian Equities (INR)"
              >
                🇮🇳 IN (₹)
              </button>
            </div>

            {/* BYOK Settings Button */}
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                hasCustomKey
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title="LLM Settings & API Keys"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden md:inline">BYOK</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
