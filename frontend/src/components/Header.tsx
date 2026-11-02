import React, { useState, useEffect } from 'react';
import { MarketType } from '../types/portfolio';
import { Terminal, SlidersHorizontal, Key, Activity, Shield, ChevronRight } from 'lucide-react';

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
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-white/[0.08] bg-[#090b10]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: Terminal Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-obsidian-800 border border-white/[0.1] flex items-center justify-center text-sky-400">
              <Terminal className="w-4 h-4" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-tight text-white">
                  MASS<span className="text-sky-400">.OS</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  v2.0
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
                  GROQ LPU READY
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Dept of CSE &bull; National Institute of Technology Raipur
              </span>
            </div>
          </div>

          {/* Center: Monospace Navigation Tabs */}
          <nav className="flex items-center bg-obsidian-950 p-1 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => onTabChange('allocator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'allocator'
                  ? 'bg-obsidian-800 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-900'
              }`}
            >
              <span>[01]</span>
              <span>PORTFOLIO ALLOCATOR</span>
            </button>
            <button
              onClick={() => onTabChange('dummy-invest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'dummy-invest'
                  ? 'bg-obsidian-800 text-sky-300 border border-sky-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-900'
              }`}
            >
              <span>[02]</span>
              <span>VIRTUAL TRACKER</span>
            </button>
          </nav>

          {/* Right: Market Toggle & Utilities */}
          <div className="flex items-center gap-2.5">
            {/* Market Universe Segmented Control */}
            <div className="flex items-center bg-obsidian-950 border border-white/[0.08] rounded-lg p-0.5 font-mono text-xs">
              <button
                onClick={() => onMarketChange('US')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  currentMarket === 'US'
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="S&P 500 US Mega-Cap Universe (USD)"
              >
                US ($)
              </button>
              <button
                onClick={() => onMarketChange('IN')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  currentMarket === 'IN'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="NIFTY 50 Indian Equities Universe (INR)"
              >
                NSE (₹)
              </button>
            </div>

            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-obsidian-950 border border-white/[0.06] font-mono text-[11px] text-slate-400">
              <Activity className="w-3 h-3 text-slate-500" />
              <span>{timeStr}</span>
            </div>

            {/* API Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className={`p-1.5 rounded-lg border transition-all ${
                hasCustomKey
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-obsidian-950 text-slate-400 border-white/[0.08] hover:text-slate-200 hover:border-white/[0.15]'
              }`}
              title="Configure API Keys (Groq / Hugging Face)"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
