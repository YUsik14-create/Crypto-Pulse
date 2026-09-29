import React, { useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  Coins,
  Flame,
  Gauge,
  Moon,
  Radio,
  RefreshCw,
  Search,
  Star,
  Sun,
  TrendingUp,
  User as UserIcon,
  Wallet,
  History,
  LogOut,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ConnectionStatus, Currency, MarketOverviewData } from '../types/crypto';
import { formatCompactNumber, formatPercent, formatPrice } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { FIAT_SYMBOLS } from '../data/initialCoins';

export type AppView = 'markets' | 'portfolio' | 'transactions' | 'profile' | 'coin-detail';

interface HeaderProps {
  currentView: AppView;
  onChangeView: (view: 'markets' | 'portfolio' | 'transactions' | 'profile') => void;
  marketOverview: MarketOverviewData;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  wsStatus: ConnectionStatus;
  onOpenConverter: () => void;
  onOpenAuthModal: () => void;
  favoritesCount: number;
  showOnlyFavorites: boolean;
  onToggleFavoritesFilter: () => void;
  onOpenFearGreedModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  marketOverview,
  currency,
  onCurrencyChange,
  isDark,
  onToggleTheme,
  wsStatus,
  onOpenConverter,
  onOpenAuthModal,
  favoritesCount,
  showOnlyFavorites,
  onToggleFavoritesFilter,
  onOpenFearGreedModal,
}) => {
  const { user, firebaseUser, portfolio, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getStatusBadge = () => {
    switch (wsStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#0ECB81]/10 text-[#0ECB81] border border-[#0ECB81]/25">
            <span className="w-2 h-2 rounded-full bg-[#0ECB81] live-pulse" />
            <span>LIVE (Binance WS)</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0B90B]/10 text-[#F0B90B] border border-[#F0B90B]/25">
            <span className="w-2 h-2 rounded-full bg-[#F0B90B] animate-pulse" />
            <span>Подключение...</span>
          </div>
        );
      case 'polling':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/25">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Live Polling (8s)</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-[#F6465D]/10 text-[#F6465D] border border-[#F6465D]/25">
            <span className="w-2 h-2 rounded-full bg-[#F6465D]" />
            <span>Офлайн</span>
          </div>
        );
    }
  };

  const fearGreedColor =
    marketOverview.fearGreedIndex >= 70
      ? 'text-[#0ECB81]'
      : marketOverview.fearGreedIndex >= 50
      ? 'text-[#F0B90B]'
      : 'text-[#F6465D]';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#23272E] bg-[#0B0E11]/90 backdrop-blur-md transition-colors">
      {/* Top Global Market Stats Bar */}
      <div className="hidden lg:flex items-center justify-between px-4 lg:px-8 py-1.5 text-xs text-[#848E9C] border-b border-[#1E2329] bg-[#0E1114]">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span>Криптовалюты:</span>
            <span className="font-semibold text-[#EAECEF]">
              {marketOverview.activeCryptos.toLocaleString('ru-RU')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span>Рыночная капитализация:</span>
            <span className="font-semibold text-[#EAECEF]">
              ${formatCompactNumber(marketOverview.totalMarketCapUsd)}
            </span>
            <span
              className={`font-mono-num font-medium ${
                marketOverview.marketCapChange24h >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
              }`}
            >
              {formatPercent(marketOverview.marketCapChange24h)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span>24ч Объем:</span>
            <span className="font-semibold text-[#EAECEF]">
              ${formatCompactNumber(marketOverview.totalVolume24hUsd)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span>Доминация:</span>
            <span className="text-[#EAECEF]">
              BTC <strong className="font-mono-num text-[#F0B90B]">{marketOverview.btcDominance}%</strong>
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-[#EAECEF]">
              ETH <strong className="font-mono-num text-[#627EEA]">{marketOverview.ethDominance}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span>ETH Gas:</span>
            <span className="font-mono-num text-[#EAECEF] flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              {marketOverview.gasPriceGwei} Gwei
            </span>
          </div>
        </div>

        {/* Fear & Greed pill */}
        <button
          onClick={onOpenFearGreedModal}
          className="flex items-center gap-2 hover:bg-[#1E2329] px-2.5 py-0.5 rounded cursor-pointer transition-colors"
          title="Нажмите для подробностей индекса страха и жадности"
        >
          <Gauge className="w-3.5 h-3.5 text-[#F0B90B]" />
          <span>Fear & Greed:</span>
          <span className={`font-mono-num font-bold ${fearGreedColor}`}>
            {marketOverview.fearGreedIndex}/100
          </span>
          <span className="text-[#B7BDC6] text-[11px]">({marketOverview.fearGreedClassification.split(' ')[0]})</span>
        </button>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Main Nav Links */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onChangeView('markets')}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F0B90B] to-[#FCD535] flex items-center justify-center shadow-lg shadow-[#F0B90B]/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-black font-extrabold stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center">
                  Crypto<span className="text-[#F0B90B]">Pulse</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-[#1E2329] text-[#F0B90B] border border-[#F0B90B]/30">
                  EXCHANGE
                </span>
              </div>
              <p className="text-[10px] text-[#848E9C] hidden xl:block">
                Терминал криптовалют в реальном времени
              </p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#14151A] p-1 rounded-xl border border-[#2B313A]">
            <button
              onClick={() => onChangeView('markets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'markets' || currentView === 'coin-detail'
                  ? 'bg-[#F0B90B] text-black shadow-sm'
                  : 'text-[#848E9C] hover:text-white'
              }`}
            >
              Рынки
            </button>

            <button
              onClick={() => onChangeView('portfolio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'portfolio'
                  ? 'bg-[#F0B90B] text-black shadow-sm'
                  : 'text-[#848E9C] hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Портфель</span>
              {portfolio.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#1E2329] text-[#0ECB81] font-mono-num font-extrabold">
                  {portfolio.length}
                </span>
              )}
            </button>

            <button
              onClick={() => onChangeView('transactions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === 'transactions'
                  ? 'bg-[#F0B90B] text-black shadow-sm'
                  : 'text-[#848E9C] hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>История</span>
            </button>
          </nav>
        </div>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Converter Button */}
          <button
            onClick={onOpenConverter}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E2329] hover:bg-[#2B313A] text-[#EAECEF] border border-[#2B313A] hover:border-[#F0B90B]/50 transition-all cursor-pointer shadow-sm"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#F0B90B]" />
            <span className="hidden lg:inline">Конвертер</span>
          </button>

          {/* Currency Selector */}
          <div className="flex items-center bg-[#1E2329] rounded-lg p-0.5 border border-[#2B313A]">
            {(['USD', 'EUR', 'RUB'] as Currency[]).map((cur) => (
              <button
                key={cur}
                onClick={() => onCurrencyChange(cur)}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  currency === cur
                    ? 'bg-[#F0B90B] text-black shadow-sm'
                    : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>

          {/* Theme Toggle (Dark/Light) */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-[#1E2329] hover:bg-[#2B313A] text-[#848E9C] hover:text-[#EAECEF] border border-[#2B313A] transition-colors cursor-pointer"
            title={isDark ? 'Светлая тема' : 'Тёмная тема'}
          >
            {isDark ? <Sun className="w-4 h-4 text-[#F0B90B]" /> : <Moon className="w-4 h-4 text-[#848E9C]" />}
          </button>

          {/* User Auth / Profile Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:pl-3 sm:pr-2 rounded-xl bg-[#1E2329] hover:bg-[#2B313A] border border-[#2B313A] transition-all cursor-pointer"
              >
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white leading-tight">
                    {user.name.split(' ')[0]}
                  </div>
                  <div className="text-[11px] font-mono-num font-bold text-[#0ECB81]">
                    ${(user.balances.USD || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover border border-[#F0B90B]"
                />
                <ChevronDown className="w-3.5 h-3.5 text-[#848E9C] hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-2xl z-50 p-2 space-y-1 animate-fade-in">
                    <div className="p-3 border-b border-[#2B313A] mb-1">
                      <div className="font-bold text-xs text-white">{user.name}</div>
                      <div className="text-[11px] text-[#848E9C] truncate">{user.email}</div>
                      {firebaseUser && (
                        <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full bg-[#0ECB81]/15 text-[#0ECB81] text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0ECB81] animate-pulse" />
                          <span>Firebase Cloud Sync</span>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-[#2B313A]/50 flex justify-between text-[11px] font-mono-num">
                        <span className="text-[#848E9C]">USD:</span>
                        <strong className="text-[#0ECB81]">${user.balances.USD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
                      </div>
                      <div className="flex justify-between text-[11px] font-mono-num">
                        <span className="text-[#848E9C]">RUB:</span>
                        <strong className="text-[#F0B90B]">{user.balances.RUB.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onChangeView('portfolio');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#EAECEF] hover:bg-[#2B313A] flex items-center gap-2 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-[#F0B90B]" />
                      <span>Мой портфель</span>
                    </button>

                    <button
                      onClick={() => {
                        onChangeView('transactions');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#EAECEF] hover:bg-[#2B313A] flex items-center gap-2 cursor-pointer"
                    >
                      <History className="w-4 h-4 text-[#F0B90B]" />
                      <span>История сделок</span>
                    </button>

                    <button
                      onClick={() => {
                        onChangeView('profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#EAECEF] hover:bg-[#2B313A] flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#F0B90B]" />
                      <span>Настройки профиля</span>
                    </button>

                    <div className="pt-1 border-t border-[#2B313A]">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#F6465D] hover:bg-[#F6465D]/10 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-xl bg-[#F0B90B] hover:bg-[#FCD535] text-black font-extrabold text-xs transition-colors cursor-pointer shadow-md"
            >
              Войти
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[#1E2329] bg-[#0E1114] py-2 px-2 text-xs">
        <button
          onClick={() => onChangeView('markets')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold ${
            currentView === 'markets' || currentView === 'coin-detail'
              ? 'text-[#F0B90B] bg-[#1E2329]'
              : 'text-[#848E9C]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Рынки</span>
        </button>

        <button
          onClick={() => onChangeView('portfolio')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold ${
            currentView === 'portfolio'
              ? 'text-[#F0B90B] bg-[#1E2329]'
              : 'text-[#848E9C]'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Портфель</span>
        </button>

        <button
          onClick={() => onChangeView('transactions')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold ${
            currentView === 'transactions'
              ? 'text-[#F0B90B] bg-[#1E2329]'
              : 'text-[#848E9C]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>История</span>
        </button>

        <button
          onClick={() => onChangeView('profile')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold ${
            currentView === 'profile'
              ? 'text-[#F0B90B] bg-[#1E2329]'
              : 'text-[#848E9C]'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Профиль</span>
        </button>
      </div>
    </header>
  );
};
