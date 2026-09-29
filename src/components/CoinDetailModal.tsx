import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  LineChart,
  Percent,
  Sparkles,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import { FIAT_RATES } from '../data/initialCoins';
import { ChartType, CryptoCoin, Currency, TimeFrame } from '../types/crypto';
import { generateChartData } from '../utils/chartData';
import { formatCompactNumber, formatPercent, formatPrice } from '../utils/formatters';
import { InteractiveChart } from './InteractiveChart';
import { useAuth } from '../context/AuthContext';

interface CoinDetailModalProps {
  coin: CryptoCoin | null;
  currency: Currency;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
}

export const CoinDetailModal: React.FC<CoinDetailModalProps> = ({
  coin,
  currency,
  isFavorite,
  onToggleFavorite,
  onClose,
}) => {
  if (!coin) return null;

  const { executeTrade } = useAuth();
  const [timeframe, setTimeframe] = useState<TimeFrame>('24h');
  const [chartType, setChartType] = useState<ChartType>('candles');

  // Converter state inside coin modal
  const [coinAmount, setCoinAmount] = useState<string>('1');
  const [fiatAmount, setFiatAmount] = useState<string>(() => {
    const rate = FIAT_RATES[currency] || 1;
    return (coin.priceUsd * rate).toFixed(2);
  });
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);

  const rate = FIAT_RATES[currency] || 1;
  const currentFiatPrice = coin.priceUsd * rate;

  // Handle coin amount input change
  const handleCoinAmountChange = (val: string) => {
    setCoinAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      setFiatAmount((parsed * currentFiatPrice).toFixed(2));
    } else {
      setFiatAmount('');
    }
  };

  // Handle fiat amount input change
  const handleFiatAmountChange = (val: string) => {
    setFiatAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0 && currentFiatPrice > 0) {
      const precision = coin.priceUsd < 1 ? 4 : 6;
      setCoinAmount((parsed / currentFiatPrice).toFixed(precision));
    } else {
      setCoinAmount('');
    }
  };

  // Chart data for current timeframe
  const chartData = useMemo(() => {
    return generateChartData(coin, timeframe);
  }, [coin, timeframe]);

  const isPositive = coin.change24h >= 0;

  // Execute trade order
  const handleSimulateTrade = async (action: 'BUY' | 'SELL') => {
    const parsed = parseFloat(coinAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    const success = await executeTrade({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      type: action,
      amount: parsed,
      fiatCurrency: currency === 'RUB' ? 'RUB' : 'USD',
      currentPriceUsd: coin.priceUsd,
    });

    if (success) {
      const text = action === 'BUY'
        ? `Успешно куплено ${coinAmount} ${coin.symbol} (сохранено в базу данных)`
        : `Успешно продано ${coinAmount} ${coin.symbol} (сохранено в базу данных)`;
      setTradeSuccess(text);
      setTimeout(() => setTradeSuccess(null), 4000);
    }
  };

  const athDistance = ((coin.priceUsd - coin.allTimeHighUsd) / coin.allTimeHighUsd) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        className="relative w-full max-w-4xl bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#2B313A] flex items-center justify-between gap-4 bg-[#14151A]">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full bg-[#2B313A] p-1 flex items-center justify-center border border-[#363D47]">
              <img
                src={coin.iconUrl}
                alt={coin.name}
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">{coin.name}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#2B313A] text-[#848E9C]">
                  {coin.symbol}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F0B90B]/10 text-[#F0B90B] border border-[#F0B90B]/30">
                  Ранг #{coin.rank}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl sm:text-2xl font-extrabold font-mono-num text-white">
                  {formatPrice(coin.priceUsd, currency)}
                </span>
                <span
                  className={`flex items-center text-xs font-bold font-mono-num px-2 py-0.5 rounded ${
                    isPositive ? 'bg-[#0ECB81]/15 text-[#0ECB81]' : 'bg-[#F6465D]/15 text-[#F6465D]'
                  }`}
                >
                  {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {formatPercent(coin.change24h)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(coin.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-[#F0B90B]/15 text-[#F0B90B] border-[#F0B90B]'
                  : 'bg-[#2B313A] hover:bg-[#363D47] text-[#848E9C] border-[#2B313A]'
              }`}
              title={isFavorite ? 'В избранном' : 'Добавить в избранное'}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-[#F0B90B]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[#2B313A] hover:bg-[#363D47] text-[#848E9C] hover:text-white border border-[#2B313A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Chart Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Timeframe selector */}
            <div className="flex items-center bg-[#0B0E11] p-1 rounded-xl border border-[#2B313A]">
              {(['1h', '24h', '7d', '30d', '1y'] as TimeFrame[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-[#F0B90B] text-black shadow-sm'
                      : 'text-[#848E9C] hover:text-white'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Chart type toggle */}
            <div className="flex items-center bg-[#0B0E11] p-1 rounded-xl border border-[#2B313A]">
              <button
                onClick={() => setChartType('candles')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  chartType === 'candles'
                    ? 'bg-[#2B313A] text-[#F0B90B] font-bold'
                    : 'text-[#848E9C] hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Свечи</span>
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  chartType === 'line'
                    ? 'bg-[#2B313A] text-[#F0B90B] font-bold'
                    : 'text-[#848E9C] hover:text-white'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Линия</span>
              </button>
            </div>
          </div>

          {/* Interactive Graphic */}
          <InteractiveChart
            data={chartData}
            chartType={chartType}
            currency={currency}
            isPositive={isPositive}
          />

          {/* Key Market Statistics Grid */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F0B90B]" />
              Статистика рынка ({coin.name})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div className="p-3 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">Рыночная капитализация</span>
                <span className="text-sm sm:text-base font-bold font-mono-num text-white">
                  {formatPrice(coin.marketCapUsd, currency, { compact: true })}
                </span>
              </div>

              <div className="p-3 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">24ч Объем торгов</span>
                <span className="text-sm sm:text-base font-bold font-mono-num text-white">
                  {formatPrice(coin.volume24hUsd, currency, { compact: true })}
                </span>
              </div>

              <div className="p-3 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">Исторический максимум (ATH)</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-bold font-mono-num text-white">
                    {formatPrice(coin.allTimeHighUsd, currency)}
                  </span>
                  <span className="text-[10px] font-mono-num text-[#F6465D]">
                    {athDistance.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">Циркулирующее предложение</span>
                <span className="text-sm sm:text-base font-bold font-mono-num text-white">
                  {formatCompactNumber(coin.circulatingSupply)} {coin.symbol}
                </span>
              </div>

              <div className="p-3 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">24ч Минимум</span>
                <span className="text-sm sm:text-base font-bold font-mono-num text-[#F6465D]">
                  {formatPrice(coin.low24hUsd, currency)}
                </span>
              </div>

              <div className="p-3 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">24ч Максимум</span>
                <span className="text-sm sm:text-base font-bold font-mono-num text-[#0ECB81]">
                  {formatPrice(coin.high24hUsd, currency)}
                </span>
              </div>

              <div className="p-3 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">Изменение за 7 дней</span>
                <span
                  className={`text-sm sm:text-base font-bold font-mono-num ${
                    coin.change7d >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                  }`}
                >
                  {formatPercent(coin.change7d)}
                </span>
              </div>

              <div className="p-3 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">Пара на Binance</span>
                <span className="text-sm sm:text-base font-bold font-mono-num text-[#F0B90B]">
                  {coin.binanceSymbol}
                </span>
              </div>
            </div>
          </div>

          {/* Built-in Coin Converter & Trade Simulation */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-[#1E2329] to-[#14151A] rounded-2xl border border-[#2B313A]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#F0B90B]" />
                Конвертер и симулятор сделок ({coin.symbol} ↔ {currency})
              </h3>
              <span className="text-xs font-mono-num text-[#848E9C]">
                1 {coin.symbol} ≈ {formatPrice(coin.priceUsd, currency)}
              </span>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crypto input */}
              <div className="p-3 bg-[#0B0E11] rounded-xl border border-[#2B313A]">
                <div className="flex items-center justify-between text-xs text-[#848E9C] mb-1">
                  <span>Вы отдаете / получаете:</span>
                  <span className="font-semibold text-white">{coin.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={coinAmount}
                    onChange={(e) => handleCoinAmountChange(e.target.value)}
                    className="w-full bg-transparent font-mono-num font-bold text-lg text-white focus:outline-none"
                    placeholder="0.0"
                  />
                  <span className="px-2 py-1 rounded bg-[#1E2329] font-bold text-xs text-[#F0B90B]">
                    {coin.symbol}
                  </span>
                </div>
              </div>

              {/* Fiat input */}
              <div className="p-3 bg-[#0B0E11] rounded-xl border border-[#2B313A]">
                <div className="flex items-center justify-between text-xs text-[#848E9C] mb-1">
                  <span>Эквивалент в валюте:</span>
                  <span className="font-semibold text-white">{currency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={fiatAmount}
                    onChange={(e) => handleFiatAmountChange(e.target.value)}
                    className="w-full bg-transparent font-mono-num font-bold text-lg text-white focus:outline-none"
                    placeholder="0.0"
                  />
                  <span className="px-2 py-1 rounded bg-[#1E2329] font-bold text-xs text-white">
                    {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Preset quick buttons */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[11px] text-[#848E9C]">Быстрый выбор:</span>
              {[0.1, 0.5, 1, 5, 10].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleCoinAmountChange(preset.toString())}
                  className="px-2 py-0.5 rounded bg-[#2B313A] hover:bg-[#363D47] text-[11px] font-mono-num text-[#EAECEF] cursor-pointer"
                >
                  +{preset} {coin.symbol}
                </button>
              ))}
            </div>

            {/* Simulated Action buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => handleSimulateTrade('BUY')}
                className="py-2.5 px-4 rounded-xl bg-[#0ECB81] hover:bg-[#0ECB81]/90 text-black font-bold text-sm transition-all cursor-pointer shadow-lg shadow-[#0ECB81]/20 active:scale-[0.98]"
              >
                Купить {coin.symbol}
              </button>
              <button
                onClick={() => handleSimulateTrade('SELL')}
                className="py-2.5 px-4 rounded-xl bg-[#F6465D] hover:bg-[#F6465D]/90 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-[#F6465D]/20 active:scale-[0.98]"
              >
                Продать {coin.symbol}
              </button>
            </div>

            {/* Feedback toast */}
            {tradeSuccess && (
              <div className="mt-3 p-3 bg-[#0ECB81]/15 border border-[#0ECB81]/40 rounded-xl flex items-center gap-2 text-xs text-[#0ECB81] animate-fade-in font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{tradeSuccess}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
