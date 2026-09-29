import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  BarChart2,
  LineChart,
  Wallet,
  Sparkles,
  ArrowRightLeft,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { CryptoCoin, Currency, TimeFrame, ChartType } from '../types/crypto';
import { useAuth } from '../context/AuthContext';
import { generateChartData } from '../utils/chartData';
import { InteractiveChart } from './InteractiveChart';
import { formatCompactNumber, formatPercent, formatPrice } from '../utils/formatters';
import { FIAT_RATES, FIAT_SYMBOLS } from '../data/initialCoins';

interface CoinDetailPageProps {
  coin: CryptoCoin;
  currency: Currency;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  initialAction?: 'BUY' | 'SELL';
}

export const CoinDetailPage: React.FC<CoinDetailPageProps> = ({
  coin,
  currency,
  isFavorite,
  onToggleFavorite,
  onBack,
  initialAction = 'BUY',
}) => {
  const { user, portfolio, executeTrade } = useAuth();

  const [timeframe, setTimeframe] = useState<TimeFrame>('24h');
  const [chartType, setChartType] = useState<ChartType>('candles');

  // Trade form state
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>(initialAction);
  const [payCurrency, setPayCurrency] = useState<'USD' | 'RUB'>(currency === 'RUB' ? 'RUB' : 'USD');
  const [amountCrypto, setAmountCrypto] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User's current holding of this specific coin
  const userHolding = portfolio.find((p) => p.coinId === coin.id);
  const ownedCrypto = userHolding ? userHolding.amount : 0;

  // Rate calculations
  const usdToRubRate = 92.5;
  const priceFiat = payCurrency === 'RUB' ? coin.priceUsd * usdToRubRate : coin.priceUsd;
  const fiatSymbol = payCurrency === 'RUB' ? '₽' : '$';

  const parsedAmount = parseFloat(amountCrypto) || 0;
  const totalCostFiat = parsedAmount * priceFiat;

  // Available balance
  const availableFiat = user ? user.balances[payCurrency] : 0;

  // Chart data
  const chartData = useMemo(() => {
    return generateChartData(coin, timeframe);
  }, [coin, timeframe]);

  const isPositive = coin.change24h >= 0;

  const handlePercentageClick = (pct: number) => {
    if (tradeType === 'BUY') {
      if (priceFiat <= 0 || availableFiat <= 0) return;
      const budget = availableFiat * (pct / 100);
      const cryptoQty = budget / priceFiat;
      const precision = coin.priceUsd < 1 ? 4 : 6;
      setAmountCrypto(cryptoQty.toFixed(precision));
    } else {
      if (ownedCrypto <= 0) return;
      const cryptoQty = ownedCrypto * (pct / 100);
      const precision = coin.priceUsd < 1 ? 4 : 6;
      setAmountCrypto(cryptoQty.toFixed(precision));
    }
  };

  const handleSubmitTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    setIsSubmitting(true);
    await executeTrade({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      type: tradeType,
      amount: parsedAmount,
      fiatCurrency: payCurrency,
      currentPriceUsd: coin.priceUsd,
    });
    setIsSubmitting(false);
  };

  const athDistance = ((coin.priceUsd - coin.allTimeHighUsd) / coin.allTimeHighUsd) * 100;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181A20] hover:bg-[#2B313A] text-[#848E9C] hover:text-white border border-[#2B313A] font-semibold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Назад ко всем рынкам</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(coin.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isFavorite
                ? 'bg-[#F0B90B]/15 text-[#F0B90B] border-[#F0B90B]'
                : 'bg-[#181A20] hover:bg-[#2B313A] text-[#848E9C] border-[#2B313A]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-[#F0B90B]' : ''}`} />
            <span>{isFavorite ? 'В избранном' : 'В избранное'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Chart & Stats, Right = Order Book / Trading Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="p-6 bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#2B313A] p-1 flex items-center justify-center border border-[#363D47]">
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
                    <h1 className="text-2xl font-black text-white">{coin.name}</h1>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#2B313A] text-[#848E9C]">
                      {coin.symbol}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30">
                      Ранг #{coin.rank}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-2xl sm:text-3xl font-black font-mono-num text-white">
                      {formatPrice(coin.priceUsd, currency)}
                    </span>
                    <span
                      className={`flex items-center text-xs font-bold font-mono-num px-2 py-0.5 rounded ${
                        isPositive ? 'bg-[#0ECB81]/15 text-[#0ECB81]' : 'bg-[#F6465D]/15 text-[#F6465D]'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                      {formatPercent(coin.change24h)} (24ч)
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick User holding preview */}
              {user && (
                <div className="p-3 bg-[#0E1114] rounded-xl border border-[#2B313A] text-right">
                  <span className="text-[11px] text-[#848E9C] block">В вашем портфеле:</span>
                  <div className="text-sm font-bold font-mono-num text-white">
                    {ownedCrypto} {coin.symbol}
                  </div>
                  <span className="text-[11px] font-mono-num text-[#0ECB81]">
                    ≈ {formatPrice(ownedCrypto * coin.priceUsd, currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Chart Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-[#2B313A]">
              {/* Timeframes: 1H, 1D, 1W, 1M, 1Y */}
              <div className="flex items-center bg-[#0B0E11] p-1 rounded-xl border border-[#2B313A]">
                {[
                  { id: '1h', label: '1H' },
                  { id: '24h', label: '1D' },
                  { id: '7d', label: '1W' },
                  { id: '30d', label: '1M' },
                  { id: '1y', label: '1Y' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id as TimeFrame)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      timeframe === tf.id
                        ? 'bg-[#F0B90B] text-black shadow-sm font-extrabold'
                        : 'text-[#848E9C] hover:text-white'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Chart Mode */}
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

            {/* Interactive Chart */}
            <div className="mt-4">
              <InteractiveChart
                data={chartData}
                chartType={chartType}
                currency={currency}
                isPositive={isPositive}
              />
            </div>
          </div>

          {/* Market Stats Grid */}
          <div className="p-6 bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F0B90B]" />
              Рыночная статистика {coin.name} ({coin.symbol})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">Рыночная капитализация</span>
                <span className="text-base font-bold font-mono-num text-white">
                  {formatPrice(coin.marketCapUsd, currency, { compact: true })}
                </span>
              </div>

              <div className="p-3.5 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">24ч Объем торгов</span>
                <span className="text-base font-bold font-mono-num text-white">
                  {formatPrice(coin.volume24hUsd, currency, { compact: true })}
                </span>
              </div>

              <div className="p-3.5 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">Исторический рекорд (ATH)</span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold font-mono-num text-white">
                    {formatPrice(coin.allTimeHighUsd, currency)}
                  </span>
                  <span className="text-[10px] font-mono-num text-[#F6465D]">
                    {athDistance.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">24ч Минимум</span>
                <span className="text-base font-bold font-mono-num text-[#F6465D]">
                  {formatPrice(coin.low24hUsd, currency)}
                </span>
              </div>

              <div className="p-3.5 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">24ч Максимум</span>
                <span className="text-base font-bold font-mono-num text-[#0ECB81]">
                  {formatPrice(coin.high24hUsd, currency)}
                </span>
              </div>

              <div className="p-3.5 bg-[#14151A] rounded-xl border border-[#2B313A]">
                <span className="text-[11px] text-[#848E9C] block mb-1">В обращении</span>
                <span className="text-base font-bold font-mono-num text-white">
                  {formatCompactNumber(coin.circulatingSupply)} {coin.symbol}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Trading Execution Panel */}
        <div className="space-y-6">
          <div className="p-6 bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-xl sticky top-24">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#F0B90B]" />
                Торговый ордер (Симуляция)
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#0ECB81]/15 text-[#0ECB81] font-bold">
                0% Комиссия
              </span>
            </div>

            {/* Buy / Sell switch */}
            <div className="grid grid-cols-2 bg-[#0E1114] p-1 rounded-xl border border-[#2B313A] mb-5">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  tradeType === 'BUY'
                    ? 'bg-[#0ECB81] text-black shadow-md'
                    : 'text-[#848E9C] hover:text-white'
                }`}
              >
                Купить {coin.symbol}
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  tradeType === 'SELL'
                    ? 'bg-[#F6465D] text-white shadow-md'
                    : 'text-[#848E9C] hover:text-white'
                }`}
              >
                Продать {coin.symbol}
              </button>
            </div>

            {/* Payment currency selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#848E9C] mb-1.5">
                {tradeType === 'BUY' ? 'Валюта оплаты' : 'Валюта зачисления'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayCurrency('USD')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    payCurrency === 'USD'
                      ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                      : 'bg-[#0E1114] text-[#848E9C] border-[#2B313A]'
                  }`}
                >
                  <span>USD ($)</span>
                  <span className="text-[11px] font-mono-num opacity-80">
                    ${(user?.balances.USD || 0).toFixed(0)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayCurrency('RUB')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    payCurrency === 'RUB'
                      ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                      : 'bg-[#0E1114] text-[#848E9C] border-[#2B313A]'
                  }`}
                >
                  <span>RUB (₽)</span>
                  <span className="text-[11px] font-mono-num opacity-80">
                    {formatCompactNumber(user?.balances.RUB || 0)} ₽
                  </span>
                </button>
              </div>
            </div>

            {/* Amount input */}
            <form onSubmit={handleSubmitTrade} className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-[#848E9C] mb-1.5">
                  <span>Количество {coin.symbol}</span>
                  {tradeType === 'SELL' && (
                    <span className="font-mono-num">
                      Доступно: <strong className="text-white">{ownedCrypto}</strong>
                    </span>
                  )}
                  {tradeType === 'BUY' && (
                    <span className="font-mono-num">
                      Баланс: <strong className="text-[#0ECB81]">{fiatSymbol}{availableFiat.toFixed(2)}</strong>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.00000001"
                    required
                    value={amountCrypto}
                    onChange={(e) => setAmountCrypto(e.target.value)}
                    className="w-full bg-[#0E1114] text-white font-mono-num font-bold text-lg pl-3 pr-16 py-2.5 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none"
                    placeholder="0.0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#F0B90B] bg-[#1E2329] px-2 py-0.5 rounded">
                    {coin.symbol}
                  </span>
                </div>
              </div>

              {/* Percentage buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageClick(pct)}
                    className="py-1 rounded-lg bg-[#2B313A] hover:bg-[#363D47] text-xs font-mono-num font-bold text-[#848E9C] hover:text-white transition-colors cursor-pointer"
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Estimated Total */}
              <div className="p-3 bg-[#0E1114] rounded-xl border border-[#2B313A] space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[#848E9C]">
                  <span>Курс исполнения:</span>
                  <span className="font-mono-num text-white">
                    {fiatSymbol}{priceFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#848E9C]">
                  <span>Итого к списанию/зачислению:</span>
                  <span className="font-mono-num font-bold text-base text-white">
                    {fiatSymbol}{totalCostFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || parsedAmount <= 0}
                className={`w-full py-3.5 rounded-xl font-black text-sm transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
                  tradeType === 'BUY'
                    ? 'bg-[#0ECB81] hover:bg-[#0ECB81]/90 text-black shadow-[#0ECB81]/20'
                    : 'bg-[#F6465D] hover:bg-[#F6465D]/90 text-white shadow-[#F6465D]/20'
                }`}
              >
                {isSubmitting
                  ? 'Исполнение ордера...'
                  : tradeType === 'BUY'
                  ? `Купить ${coin.symbol}`
                  : `Продать ${coin.symbol}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
