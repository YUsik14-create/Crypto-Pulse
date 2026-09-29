import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CoinDetailModal } from './components/CoinDetailModal';
import { CoinDetailPage } from './components/CoinDetailPage';
import { ConverterModal } from './components/ConverterModal';
import { CryptoTable } from './components/CryptoTable';
import { FearGreedModal } from './components/FearGreedModal';
import { Footer } from './components/Footer';
import { Header, AppView } from './components/Header';
import { PortfolioView } from './components/PortfolioView';
import { ProfileView } from './components/ProfileView';
import { TopCards } from './components/TopCards';
import { TransactionsView } from './components/TransactionsView';
import { ToastContainer } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { useCryptoPrices } from './hooks/useCryptoPrices';
import { CryptoCoin } from './types/crypto';

function AppContent() {
  const {
    coins,
    displayCoins,
    marketOverview,
    currency,
    setCurrency,
    favorites,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    sortField,
    sortDirection,
    handleSort,
    priceFlashes,
    wsStatus,
  } = useCryptoPrices();

  const { toasts, removeToast } = useAuth();

  // Navigation View State: 'markets' | 'portfolio' | 'transactions' | 'profile' | 'coin-detail'
  const [currentView, setCurrentView] = useState<AppView>('markets');
  const [activeCoin, setActiveCoin] = useState<CryptoCoin | null>(null);
  const [activeCoinAction, setActiveCoinAction] = useState<'BUY' | 'SELL'>('BUY');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isFearGreedOpen, setIsFearGreedOpen] = useState(false);
  const [quickModalCoin, setQuickModalCoin] = useState<CryptoCoin | null>(null);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('crypto_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('crypto_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const showOnlyFavorites = activeCategory === 'favorites';
  const toggleFavoritesFilter = () => {
    if (currentView !== 'markets') {
      setCurrentView('markets');
    }
    setActiveCategory((prev) => (prev === 'favorites' ? 'all' : 'favorites'));
  };

  // Open dedicated coin detail page
  const handleSelectCoin = (coin: CryptoCoin, action: 'BUY' | 'SELL' = 'BUY') => {
    setActiveCoin(coin);
    setActiveCoinAction(action);
    setCurrentView('coin-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open trade modal from portfolio
  const handleOpenTradeFromPortfolio = (coin: CryptoCoin, action: 'BUY' | 'SELL') => {
    handleSelectCoin(coin, action);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 flex flex-col justify-between ${
        isDark ? 'bg-[#0B0E11] text-[#EAECEF]' : 'bg-[#F5F7FA] text-[#1E2329]'
      }`}
    >
      <div>
        {/* Header */}
        <Header
          currentView={currentView}
          onChangeView={(view) => {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          marketOverview={marketOverview}
          currency={currency}
          onCurrencyChange={setCurrency}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          wsStatus={wsStatus}
          onOpenConverter={() => setIsConverterOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          favoritesCount={favorites.length}
          showOnlyFavorites={showOnlyFavorites}
          onToggleFavoritesFilter={toggleFavoritesFilter}
          onOpenFearGreedModal={() => setIsFearGreedOpen(true)}
        />

        {/* Main Content Router */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
          {/* VIEW: MARKETS (Default) */}
          {currentView === 'markets' && (
            <>
              {/* Top 3 Highlight Cards */}
              <TopCards
                coins={coins}
                currency={currency}
                priceFlashes={priceFlashes}
                onSelectCoin={(coin) => handleSelectCoin(coin)}
              />

              {/* Main Cryptocurrency Market Table */}
              <CryptoTable
                coins={displayCoins}
                currency={currency}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                priceFlashes={priceFlashes}
                onSelectCoin={(coin) => handleSelectCoin(coin)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </>
          )}

          {/* VIEW: COIN DETAIL PAGE */}
          {currentView === 'coin-detail' && activeCoin && (
            <CoinDetailPage
              coin={coins.find((c) => c.id === activeCoin.id) || activeCoin}
              currency={currency}
              isFavorite={favorites.includes(activeCoin.id)}
              onToggleFavorite={toggleFavorite}
              onBack={() => setCurrentView('markets')}
              initialAction={activeCoinAction}
            />
          )}

          {/* VIEW: PORTFOLIO */}
          {currentView === 'portfolio' && (
            <PortfolioView
              coins={coins}
              currency={currency}
              onSelectCoin={(coin) => handleSelectCoin(coin)}
              onOpenTradeModal={handleOpenTradeFromPortfolio}
            />
          )}

          {/* VIEW: TRANSACTION HISTORY */}
          {currentView === 'transactions' && (
            <TransactionsView currency={currency} />
          )}

          {/* VIEW: USER PROFILE & SETTINGS */}
          {currentView === 'profile' && (
            <ProfileView currency={currency} />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* Auth Modal (Login / Register / 1-click Demo) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Standalone Crypto ↔ Fiat Converter Modal */}
      <ConverterModal
        coins={coins}
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        defaultCoinId={activeCoin ? activeCoin.id : 'bitcoin'}
        defaultCurrency={currency}
      />

      {/* Fear & Greed Index Details Modal */}
      <FearGreedModal
        isOpen={isFearGreedOpen}
        onClose={() => setIsFearGreedOpen(false)}
        marketOverview={marketOverview}
      />

      {/* Quick Modal fallback if needed */}
      {quickModalCoin && (
        <CoinDetailModal
          coin={quickModalCoin}
          currency={currency}
          isFavorite={favorites.includes(quickModalCoin.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setQuickModalCoin(null)}
        />
      )}

      {/* Real-time Notifications Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
