import React from 'react';
import { ArrowDownRight, ArrowUpRight, Sparkles, TrendingUp } from 'lucide-react';
import { CryptoCoin, Currency } from '../types/crypto';
import { formatPercent, formatPrice } from '../utils/formatters';
import { Sparkline } from './Sparkline';

interface TopCardsProps {
  coins: CryptoCoin[];
  currency: Currency;
  priceFlashes: Record<string, 'up' | 'down'>;
  onSelectCoin: (coin: CryptoCoin) => void;
}

export const TopCards: React.FC<TopCardsProps> = ({
  coins,
  currency,
  priceFlashes,
  onSelectCoin,
}) => {
  // Take top 3 coins: BTC, ETH, and either SOL or TON
  const topCoins = coins.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {topCoins.map((coin, index) => {
        const isPositive = coin.change24h >= 0;
        const flash = priceFlashes[coin.id];

        // Custom badges for top 3
        const badges = [
          { text: 'Лидер рынка #1', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
          { text: 'Смарт-контракты #2', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
          { text: 'High Speed #3', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        ];
        const badge = badges[index] || { text: `#${coin.rank}`, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };

        return (
          <div
            key={coin.id}
            onClick={() => onSelectCoin(coin)}
            className={`group relative p-5 rounded-2xl bg-[#1E2329]/80 border transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-black/40 cursor-pointer overflow-hidden backdrop-blur-sm ${
              flash === 'up'
                ? 'border-[#0ECB81] bg-[#0ECB81]/5 shadow-[0_0_20px_rgba(14,203,129,0.15)]'
                : flash === 'down'
                ? 'border-[#F6465D] bg-[#F6465D]/5 shadow-[0_0_20px_rgba(246,70,93,0.15)]'
                : 'border-[#2B313A] hover:border-[#F0B90B]/50'
            }`}
          >
            {/* Ambient background glow */}
            <div
              className={`absolute -right-8 -bottom-8 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-10 transition-opacity group-hover:opacity-20 ${
                isPositive ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'
              }`}
            />

            {/* Top row: Coin info & Tag */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-[#2B313A] p-1 flex items-center justify-center border border-[#363D47]">
                  <img
                    src={coin.iconUrl}
                    alt={coin.name}
                    className="w-full h-full object-contain rounded-full"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded bg-[#0B0E11] text-[#848E9C] border border-[#2B313A]">
                    #{coin.rank}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-base group-hover:text-[#F0B90B] transition-colors">
                      {coin.name}
                    </span>
                    <span className="text-xs font-semibold text-[#848E9C]">
                      {coin.symbol}
                    </span>
                  </div>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>
              </div>

              {/* 24h Change Pill */}
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono-num ${
                  isPositive
                    ? 'bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30'
                    : 'bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                <span>{formatPercent(coin.change24h)}</span>
              </div>
            </div>

            {/* Main Price Row */}
            <div className="flex items-baseline justify-between mt-2 mb-3">
              <div>
                <span className="text-xs text-[#848E9C] block mb-0.5">Курс онлайн</span>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold font-mono-num text-white tracking-tight transition-colors duration-300 ${
                    flash === 'up' ? 'text-[#0ECB81]' : flash === 'down' ? 'text-[#F6465D]' : ''
                  }`}
                >
                  {formatPrice(coin.priceUsd, currency)}
                </div>
              </div>

              {/* Mini Sparkline graph in card */}
              <div className="w-32 h-10 flex items-center justify-end">
                <Sparkline
                  data={coin.sparkline}
                  width={128}
                  height={38}
                  isPositive={isPositive}
                  showGradient={true}
                  strokeWidth={2}
                />
              </div>
            </div>

            {/* Bottom 24h High/Low bar */}
            <div className="pt-3 border-t border-[#2B313A]/60 flex items-center justify-between text-xs text-[#848E9C]">
              <div>
                <span className="text-[11px] block">24ч Мин:</span>
                <span className="font-mono-num font-medium text-[#EAECEF]">
                  {formatPrice(coin.low24hUsd, currency, { compact: true })}
                </span>
              </div>

              <div className="flex-1 mx-3">
                <div className="h-1.5 w-full bg-[#2B313A] rounded-full overflow-hidden flex">
                  {(() => {
                    const range = coin.high24hUsd - coin.low24hUsd || 1;
                    const pct = Math.min(100, Math.max(0, ((coin.priceUsd - coin.low24hUsd) / range) * 100));
                    return (
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    );
                  })()}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] block">24ч Макс:</span>
                <span className="font-mono-num font-medium text-[#EAECEF]">
                  {formatPrice(coin.high24hUsd, currency, { compact: true })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
