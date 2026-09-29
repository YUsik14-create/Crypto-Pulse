import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  RotateCcw,
  PieChart,
  ArrowRightLeft,
  DollarSign,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CryptoCoin, Currency } from '../types/crypto';
import { FIAT_RATES, FIAT_SYMBOLS } from '../data/initialCoins';
import { formatCompactNumber, formatPercent, formatPrice } from '../utils/formatters';

interface PortfolioViewProps {
  coins: CryptoCoin[];
  currency: Currency;
  onSelectCoin: (coin: CryptoCoin) => void;
  onOpenTradeModal: (coin: CryptoCoin, defaultAction: 'BUY' | 'SELL') => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  coins,
  currency,
  onSelectCoin,
  onOpenTradeModal,
}) => {
  const { user, portfolio, resetBalance, depositBalance } = useAuth();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('10000');
  const [depositCurrency, setDepositCurrency] = useState<'USD' | 'RUB'>('USD');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const rate = FIAT_RATES[currency] || 1;
  const symbol = FIAT_SYMBOLS[currency] || '$';

  // Calculate portfolio values
  let totalCryptoValueUsd = 0;
  let totalCostBasisUsd = 0;

  const holdingsWithMetrics = portfolio.map((item) => {
    const liveCoin = coins.find((c) => c.id === item.coinId);
    const currentPriceUsd = liveCoin ? liveCoin.priceUsd : item.averageBuyPriceUsd;
    const currentValueUsd = item.amount * currentPriceUsd;
    const itemCostBasisUsd = item.totalCostUsd || item.amount * item.averageBuyPriceUsd;
    const pnlUsd = currentValueUsd - itemCostBasisUsd;
    const pnlPercent = itemCostBasisUsd > 0 ? (pnlUsd / itemCostBasisUsd) * 100 : 0;

    totalCryptoValueUsd += currentValueUsd;
    totalCostBasisUsd += itemCostBasisUsd;

    return {
      ...item,
      liveCoin,
      currentPriceUsd,
      currentValueUsd,
      itemCostBasisUsd,
      pnlUsd,
      pnlPercent,
    };
  });

  const totalPnlUsd = totalCryptoValueUsd - totalCostBasisUsd;
  const totalPnlPercent = totalCostBasisUsd > 0 ? (totalPnlUsd / totalCostBasisUsd) * 100 : 0;

  // Available Cash Balances
  const cashUsd = user?.balances.USD || 0;
  const cashRub = user?.balances.RUB || 0;
  // Total Net Worth in USD = Total Crypto + Cash USD + (Cash RUB / 92.5)
  const cashRubInUsd = cashRub / 92.5;
  const totalNetWorthUsd = totalCryptoValueUsd + cashUsd + cashRubInUsd;

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(depositAmount);
    if (!isNaN(parsed) && parsed > 0) {
      await depositBalance(parsed, depositCurrency);
      setDepositModalOpen(false);
    }
  };

  const handleResetConfirm = async () => {
    await resetBalance();
    setResetConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Total Net Worth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Card: Total Portfolio Value & PnL */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[#1E2329] via-[#181A20] to-[#14151A] border border-[#2B313A] shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#F0B90B]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-semibold text-[#848E9C] block mb-1">
                Общая стоимость портфеля (Net Worth)
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono-num text-white tracking-tight">
                {formatPrice(totalNetWorthUsd, currency)}
              </div>
            </div>

            {/* PnL Indicator badge */}
            <div
              className={`p-3 rounded-xl border flex items-center gap-3 ${
                totalPnlUsd >= 0
                  ? 'bg-[#0ECB81]/10 border-[#0ECB81]/30 text-[#0ECB81]'
                  : 'bg-[#F6465D]/10 border-[#F6465D]/30 text-[#F6465D]'
              }`}
            >
              {totalPnlUsd >= 0 ? (
                <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
              )}
              <div>
                <span className="text-[11px] block font-medium opacity-80">Прибыль / Убыток (PnL)</span>
                <div className="font-mono-num font-bold text-sm sm:text-base">
                  {totalPnlUsd >= 0 ? '+' : ''}
                  {formatPrice(totalPnlUsd, currency)} ({formatPercent(totalPnlPercent)})
                </div>
              </div>
            </div>
          </div>

          {/* Sub balances breakdown */}
          <div className="pt-4 border-t border-[#2B313A]/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[#848E9C] block text-[11px]">Криптоактивы:</span>
              <span className="font-mono-num font-bold text-white text-sm">
                {formatPrice(totalCryptoValueUsd, currency)}
              </span>
            </div>
            <div>
              <span className="text-[#848E9C] block text-[11px]">Свободно USD:</span>
              <span className="font-mono-num font-bold text-[#0ECB81] text-sm">
                ${cashUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[#848E9C] block text-[11px]">Свободно RUB:</span>
              <span className="font-mono-num font-bold text-[#F0B90B] text-sm">
                {cashRub.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Card */}
        <div className="p-6 rounded-2xl bg-[#181A20] border border-[#2B313A] shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#F0B90B]" />
              Управление демо-счетом
            </h3>
            <p className="text-xs text-[#848E9C] leading-relaxed mb-4">
              Это безопасная учебная среда. Вы можете в любой момент добавить виртуальные средства или сбросить портфель к стартовому состоянию.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setDepositModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F0B90B] hover:bg-[#FCD535] text-black font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Пополнить виртуальный счет</span>
            </button>
            <button
              onClick={() => setResetConfirmOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2B313A] hover:bg-[#363D47] text-[#848E9C] hover:text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить баланс ($50k / 4.5M ₽)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Asset Allocation Bar */}
      {holdingsWithMetrics.length > 0 && (
        <div className="p-5 bg-[#181A20] rounded-2xl border border-[#2B313A]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#F0B90B]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Структура распределения активов
              </h3>
            </div>
            <span className="text-xs font-mono-num text-[#848E9C]">
              {holdingsWithMetrics.length} позиции
            </span>
          </div>

          {/* Allocation progress bar */}
          <div className="h-3 w-full bg-[#0E1114] rounded-full overflow-hidden flex mb-3">
            {holdingsWithMetrics.map((item, idx) => {
              const pct = totalCryptoValueUsd > 0 ? (item.currentValueUsd / totalCryptoValueUsd) * 100 : 0;
              const colors = ['bg-[#F7931A]', 'bg-[#627EEA]', 'bg-[#0088CC]', 'bg-[#F0B90B]', 'bg-[#14F195]', 'bg-[#9945FF]'];
              const color = colors[idx % colors.length];

              return (
                <div
                  key={item.id}
                  style={{ width: `${pct}%` }}
                  className={`h-full ${color} transition-all duration-500`}
                  title={`${item.symbol}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Chips */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {holdingsWithMetrics.map((item, idx) => {
              const pct = totalCryptoValueUsd > 0 ? (item.currentValueUsd / totalCryptoValueUsd) * 100 : 0;
              const colors = ['bg-[#F7931A]', 'bg-[#627EEA]', 'bg-[#0088CC]', 'bg-[#F0B90B]', 'bg-[#14F195]', 'bg-[#9945FF]'];
              const color = colors[idx % colors.length];

              return (
                <div key={item.id} className="flex items-center gap-1.5 font-mono-num">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="font-bold text-white">{item.symbol}</span>
                  <span className="text-[#848E9C]">({pct.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table of User Holdings */}
      <div className="bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#2B313A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#F0B90B]" />
            <h2 className="text-base font-bold text-white">Криптовалюты в портфеле</h2>
          </div>
          <span className="text-xs text-[#848E9C]">Цены обновляются в реальном времени</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2B313A] bg-[#14151A] text-[#848E9C] font-semibold select-none">
                <th className="py-3.5 pl-6">Актив</th>
                <th className="py-3.5 px-4 text-right">Количество</th>
                <th className="py-3.5 px-4 text-right">Ср. цена покупки</th>
                <th className="py-3.5 px-4 text-right">Текущий курс</th>
                <th className="py-3.5 px-4 text-right">Текущая стоимость</th>
                <th className="py-3.5 px-4 text-right">Прибыль / Убыток (PnL)</th>
                <th className="py-3.5 pr-6 text-right">Торговля</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#2B313A]/50">
              {holdingsWithMetrics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#848E9C]">
                    <Coins className="w-10 h-10 mx-auto text-[#2B313A] mb-2" />
                    <p className="text-sm font-semibold text-white">В портфеле пока нет купленных монет</p>
                    <p className="text-xs text-[#848E9C] mt-1">
                      Используйте доступные $50,000 USD или 4,500,000 ₽ для первой виртуальной покупки
                    </p>
                  </td>
                </tr>
              ) : (
                holdingsWithMetrics.map((item) => {
                  const isProfit = item.pnlUsd >= 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#23272E]/70 transition-colors cursor-pointer group"
                      onClick={() => item.liveCoin && onSelectCoin(item.liveCoin)}
                    >
                      {/* Coin info */}
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#2B313A] p-0.5 flex items-center justify-center border border-[#363D47]">
                            {item.liveCoin?.iconUrl ? (
                              <img
                                src={item.liveCoin.iconUrl}
                                alt={item.name}
                                className="w-full h-full object-contain rounded-full"
                              />
                            ) : (
                              <span className="font-bold text-xs text-[#F0B90B]">{item.symbol[0]}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white group-hover:text-[#F0B90B] transition-colors">
                                {item.name}
                              </span>
                              <span className="text-[11px] font-semibold text-[#848E9C]">
                                {item.symbol}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Holdings quantity */}
                      <td className="py-4 px-4 text-right font-mono-num font-bold text-white">
                        {item.amount >= 1 ? item.amount.toLocaleString('en-US', { maximumFractionDigits: 4 }) : item.amount} {item.symbol}
                      </td>

                      {/* Avg buy price */}
                      <td className="py-4 px-4 text-right font-mono-num text-[#848E9C]">
                        {formatPrice(item.averageBuyPriceUsd, currency)}
                      </td>

                      {/* Current live price */}
                      <td className="py-4 px-4 text-right font-mono-num font-bold text-white">
                        {formatPrice(item.currentPriceUsd, currency)}
                      </td>

                      {/* Current total value */}
                      <td className="py-4 px-4 text-right font-mono-num font-bold text-white">
                        {formatPrice(item.currentValueUsd, currency)}
                      </td>

                      {/* PnL */}
                      <td className="py-4 px-4 text-right">
                        <div className={`font-mono-num font-bold ${isProfit ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                          {isProfit ? '+' : ''}
                          {formatPrice(item.pnlUsd, currency)}
                        </div>
                        <div className={`text-[10px] font-mono-num ${isProfit ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                          {isProfit ? '+' : ''}
                          {item.pnlPercent.toFixed(2)}%
                        </div>
                      </td>

                      {/* Quick Trade actions */}
                      <td
                        className="py-4 pr-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => item.liveCoin && onOpenTradeModal(item.liveCoin, 'BUY')}
                            className="px-2.5 py-1 rounded-lg bg-[#0ECB81]/15 hover:bg-[#0ECB81] text-[#0ECB81] hover:text-black font-bold text-xs transition-colors cursor-pointer"
                          >
                            Купить
                          </button>
                          <button
                            onClick={() => item.liveCoin && onOpenTradeModal(item.liveCoin, 'SELL')}
                            className="px-2.5 py-1 rounded-lg bg-[#F6465D]/15 hover:bg-[#F6465D] text-[#F6465D] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Продать
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-sm bg-[#181A20] rounded-2xl border border-[#2B313A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#F0B90B]" />
              Пополнить виртуальный счет
            </h3>
            <p className="text-xs text-[#848E9C] mb-4">
              Выберите валюту и сумму начисления демо-средств для тестирования торговли.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                  Валюта пополнения
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositCurrency('USD')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      depositCurrency === 'USD'
                        ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                        : 'bg-[#0E1114] text-[#848E9C] border-[#2B313A]'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositCurrency('RUB')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      depositCurrency === 'RUB'
                        ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                        : 'bg-[#0E1114] text-[#848E9C] border-[#2B313A]'
                    }`}
                  >
                    RUB (₽)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#848E9C] mb-1">
                  Сумма
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-[#0E1114] text-white font-mono-num font-bold text-lg px-3 py-2 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none"
                />
              </div>

              {/* Presets */}
              <div className="flex gap-2">
                {(depositCurrency === 'USD' ? [1000, 5000, 10000, 50000] : [100000, 500000, 1000000]).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt.toString())}
                    className="flex-1 py-1 rounded bg-[#2B313A] hover:bg-[#363D47] text-[11px] font-mono-num text-[#EAECEF] cursor-pointer"
                  >
                    +{formatCompactNumber(amt)}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#2B313A] hover:bg-[#363D47] text-white font-bold text-xs cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#F0B90B] hover:bg-[#FCD535] text-black font-bold text-xs cursor-pointer"
                >
                  Начислить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-sm bg-[#181A20] rounded-2xl border border-[#2B313A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-[#F6465D]/15 text-[#F6465D] flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Сбросить демо-баланс?</h3>
            <p className="text-xs text-[#848E9C] leading-relaxed mb-4">
              Все купленные виртуальные монеты в портфеле будут удалены, а баланс сброшен до стартовых $50,000 USD и 4,500,000 RUB.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2B313A] hover:bg-[#363D47] text-white font-bold text-xs cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 py-2.5 rounded-xl bg-[#F6465D] hover:bg-[#F6465D]/90 text-white font-bold text-xs cursor-pointer"
              >
                Да, сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
