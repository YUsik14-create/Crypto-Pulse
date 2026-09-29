import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUpDown,
  ArrowUp,
  ExternalLink,
  Flame,
  Search,
  SlidersHorizontal,
  Star,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CryptoCoin,
  Currency,
  FilterCategory,
  SortDirection,
  SortField,
} from '../types/crypto';
import {
  formatCompactNumber,
  formatPercent,
  formatPrice,
} from '../utils/formatters';
import { Sparkline } from './Sparkline';

interface CryptoTableProps {
  coins: CryptoCoin[];
  currency: Currency;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  priceFlashes: Record<string, 'up' | 'down'>;
  onSelectCoin: (coin: CryptoCoin) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: FilterCategory;
  onCategoryChange: (cat: FilterCategory) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export const CryptoTable: React.FC<CryptoTableProps> = ({
  coins,
  currency,
  favorites,
  onToggleFavorite,
  priceFlashes,
  onSelectCoin,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  sortField,
  sortDirection,
  onSort,
}) => {
  const [viewCount, setViewCount] = useState<number>(20);

  const categories: { id: FilterCategory; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'Все монеты' },
    { id: 'favorites', label: `⭐ Избранное (${favorites.length})` },
    { id: 'top10', label: 'Топ 10' },
    { id: 'gainers', label: 'Лидеры роста 🔥' },
    { id: 'losers', label: 'Падение ❄️' },
    { id: 'ecosystem_ton', label: 'TON & NOT 💎' },
  ];

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-30 group-hover:opacity-80 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#F0B90B]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#F0B90B]" />
    );
  };

  const displayedCoins = coins.slice(0, viewCount);

  return (
    <div className="w-full bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-2xl overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 lg:p-6 border-b border-[#2B313A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#F0B90B] text-black shadow-md font-bold'
                  : 'bg-[#2B313A]/60 text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B313A]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input with clean button */}
        <div className="relative min-w-[260px] md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#848E9C]" />
          <input
            type="text"
            placeholder="Поиск по названию или тикеру (BTC, Ton, Not...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#0B0E11] text-[#EAECEF] placeholder-[#848E9C] pl-9 pr-8 py-2 text-xs rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#848E9C] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2B313A] bg-[#14151A] text-[#848E9C] font-semibold select-none">
              <th className="py-3.5 pl-4 sm:pl-6 w-12 text-center">#</th>
              <th className="py-3.5 px-2 w-8 text-center"></th>
              <th
                onClick={() => onSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <span>Актив</span>
                  {renderSortIcon('name')}
                </div>
              </th>
              <th
                onClick={() => onSort('price')}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Цена ({currency})</span>
                  {renderSortIcon('price')}
                </div>
              </th>
              <th
                onClick={() => onSort('change24h')}
                className="py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>24ч %</span>
                  {renderSortIcon('change24h')}
                </div>
              </th>
              <th
                onClick={() => onSort('change7d')}
                className="hidden md:table-cell py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>7д %</span>
                  {renderSortIcon('change7d')}
                </div>
              </th>
              <th
                onClick={() => onSort('volume24h')}
                className="hidden lg:table-cell py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>24ч Объем</span>
                  {renderSortIcon('volume24h')}
                </div>
              </th>
              <th
                onClick={() => onSort('marketCap')}
                className="hidden sm:table-cell py-3.5 px-4 text-right cursor-pointer hover:text-white transition-colors group"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Капитализация</span>
                  {renderSortIcon('marketCap')}
                </div>
              </th>
              <th className="hidden xl:table-cell py-3.5 px-4 text-center w-36">
                График (7д)
              </th>
              <th className="py-3.5 pr-4 sm:pr-6 text-right">Действие</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#2B313A]/50">
            {displayedCoins.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-[#848E9C]">
                  <p className="text-sm font-medium">Монеты не найдены</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Попробуйте изменить поисковый запрос или сбросить фильтры
                  </p>
                  <button
                    onClick={() => {
                      onSearchChange('');
                      onCategoryChange('all');
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-[#2B313A] text-xs font-semibold text-[#F0B90B] hover:bg-[#363D47]"
                  >
                    Сбросить фильтры
                  </button>
                </td>
              </tr>
            ) : (
              displayedCoins.map((coin) => {
                const isFavorite = favorites.includes(coin.id);
                const is24hPositive = coin.change24h >= 0;
                const is7dPositive = coin.change7d >= 0;
                const flash = priceFlashes[coin.id];

                return (
                  <tr
                    key={coin.id}
                    onClick={() => onSelectCoin(coin)}
                    className="group hover:bg-[#23272E]/80 transition-colors cursor-pointer"
                  >
                    {/* Rank */}
                    <td className="py-4 pl-4 sm:pl-6 text-center font-mono-num text-[#848E9C] text-xs">
                      {coin.rank}
                    </td>

                    {/* Star Favorite */}
                    <td
                      className="py-4 px-2 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(coin.id);
                      }}
                    >
                      <button
                        className="p-1 hover:scale-125 transition-transform"
                        title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isFavorite
                              ? 'fill-[#F0B90B] text-[#F0B90B]'
                              : 'text-[#5E6673] hover:text-[#F0B90B]'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Coin Icon & Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full bg-[#2B313A] p-0.5 flex-shrink-0 flex items-center justify-center border border-[#363D47]">
                          <img
                            src={coin.iconUrl}
                            alt={coin.name}
                            className="w-full h-full object-contain rounded-full"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#EAECEF] group-hover:text-[#F0B90B] transition-colors text-sm">
                              {coin.name}
                            </span>
                            <span className="text-[11px] font-semibold text-[#848E9C]">
                              {coin.symbol}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#848E9C] block md:hidden">
                            {formatPrice(coin.marketCapUsd, currency, { compact: true })}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Price with flash animation */}
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-mono-num font-bold text-sm tracking-tight px-1.5 py-0.5 rounded transition-all duration-300 ${
                          flash === 'up'
                            ? 'bg-[#0ECB81]/20 text-[#0ECB81]'
                            : flash === 'down'
                            ? 'bg-[#F6465D]/20 text-[#F6465D]'
                            : 'text-white'
                        }`}
                      >
                        {formatPrice(coin.priceUsd, currency)}
                      </span>
                    </td>

                    {/* 24h Change % */}
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 font-mono-num font-semibold text-xs px-2 py-0.5 rounded ${
                          is24hPositive
                            ? 'text-[#0ECB81] bg-[#0ECB81]/10'
                            : 'text-[#F6465D] bg-[#F6465D]/10'
                        }`}
                      >
                        {is24hPositive ? '+' : ''}
                        {formatPercent(coin.change24h)}
                      </span>
                    </td>

                    {/* 7d Change % */}
                    <td className="hidden md:table-cell py-4 px-4 text-right">
                      <span
                        className={`font-mono-num font-semibold text-xs ${
                          is7dPositive ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                        }`}
                      >
                        {is7dPositive ? '+' : ''}
                        {formatPercent(coin.change7d)}
                      </span>
                    </td>

                    {/* 24h Volume */}
                    <td className="hidden lg:table-cell py-4 px-4 text-right font-mono-num text-[#EAECEF]">
                      {formatPrice(coin.volume24hUsd, currency, { compact: true })}
                    </td>

                    {/* Market Cap */}
                    <td className="hidden sm:table-cell py-4 px-4 text-right font-mono-num font-medium text-[#EAECEF]">
                      {formatPrice(coin.marketCapUsd, currency, { compact: true })}
                    </td>

                    {/* Sparkline (7d) */}
                    <td className="hidden xl:table-cell py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <Sparkline
                          data={coin.sparkline}
                          width={110}
                          height={30}
                          isPositive={is7dPositive}
                          showGradient={false}
                          strokeWidth={1.8}
                        />
                      </div>
                    </td>

                    {/* Action button */}
                    <td
                      className="py-4 pr-4 sm:pr-6 text-right"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCoin(coin);
                      }}
                    >
                      <button
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#2B313A] hover:bg-[#F0B90B] text-[#EAECEF] hover:text-black transition-all cursor-pointer shadow-sm group-hover:border-[#F0B90B]"
                      >
                        Обзор
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer controls: pagination / show all */}
      {coins.length > 10 && (
        <div className="p-4 border-t border-[#2B313A] flex items-center justify-between text-xs text-[#848E9C]">
          <span>
            Показано {Math.min(viewCount, coins.length)} из {coins.length} активов
          </span>
          <div className="flex items-center gap-2">
            {viewCount < coins.length ? (
              <button
                onClick={() => setViewCount(coins.length)}
                className="px-3 py-1.5 rounded-lg bg-[#2B313A] hover:bg-[#363D47] text-[#EAECEF] font-semibold transition-colors"
              >
                Показать все ({coins.length})
              </button>
            ) : (
              <button
                onClick={() => setViewCount(10)}
                className="px-3 py-1.5 rounded-lg bg-[#2B313A] hover:bg-[#363D47] text-[#EAECEF] font-semibold transition-colors"
              >
                Свернуть до 10
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
