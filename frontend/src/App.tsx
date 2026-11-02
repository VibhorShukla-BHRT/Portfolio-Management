import React, { useState, useEffect } from 'react';
import { MarketType } from './types/portfolio';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { SettingsModal } from './components/SettingsModal';
import { HomePage } from './pages/HomePage';
import { DummyInvestPage } from './pages/DummyInvestPage';

export function App() {
  const [currentMarket, setCurrentMarket] = useState<MarketType>('US');
  const [activeTab, setActiveTab] = useState<'allocator' | 'dummy-invest'>('allocator');
  const [targetPortfolioId, setTargetPortfolioId] = useState<string | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('mass_custom_llm_key');
    if (saved) setCustomApiKey(saved);

    // Sync browser URL path if user enters directly on /dummy-invest
    if (window.location.pathname === '/dummy-invest') {
      setActiveTab('dummy-invest');
    }
  }, []);

  const handleSaveKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem('mass_custom_llm_key', key);
    } else {
      localStorage.removeItem('mass_custom_llm_key');
    }
  };

  const handleTabChange = (tab: 'allocator' | 'dummy-invest') => {
    setActiveTab(tab);
    window.history.pushState({}, '', tab === 'dummy-invest' ? '/dummy-invest' : '/');
  };

  const handleNavigateToDummyInvest = (portfolioId?: string) => {
    setTargetPortfolioId(portfolioId);
    setActiveTab('dummy-invest');
    window.history.pushState({}, '', '/dummy-invest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-slate-100 selection:bg-sky-500/30">
      {/* Top Academic Alert Banner */}
      <DisclaimerBanner />

      {/* Institutional Navigation Header */}
      <Header
        currentMarket={currentMarket}
        onMarketChange={setCurrentMarket}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSettings={() => setSettingsOpen(true)}
        hasCustomKey={!!customApiKey}
      />

      {/* Dynamic Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'allocator' ? (
          <HomePage
            currentMarket={currentMarket}
            customApiKey={customApiKey}
            onNavigateToDummyInvest={handleNavigateToDummyInvest}
          />
        ) : (
          <DummyInvestPage
            initialPortfolioId={targetPortfolioId}
            onNavigateToAllocator={() => handleTabChange('allocator')}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <Footer />

      {/* Settings / BYOK Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        customKey={customApiKey}
        onSaveCustomKey={handleSaveKey}
      />
    </div>
  );
}

export default App;
