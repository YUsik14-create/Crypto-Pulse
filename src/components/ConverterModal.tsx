import React, { useState } from 'react';
import {
  ArrowDownUp,
  ArrowRightLeft,
  Check,
  ChevronDown,
  Coins,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { FIAT_RATES, FIAT_SYMBOLS } from '../data/initialCoins';
import { CryptoCoin, Currency } from '../types/crypto';
import { formatPrice } from '../utils/formatters';

interface ConverterModalProps {
  coins: CryptoCoin[];
  isOpen: boolean;
  onClose: () => void;
  defaultCoinId?: string;
  defaultCurrency?: Currency;
}

export const ConverterModal: React.FC<ConverterModalProps> = ({
  coins,
  isOpen,
  onClose,
  defaultCoinId = 'bitcoin',
  defaultCurrency = 'USD',
}) => {
  if (!isOpen) return null;

  const [selectedCoinId, setSelectedCoinId] = useState<string>(defaultCoinId);
  const [selectedFiat, setSelectedFiat] = useState<Currency>(defaultCurrency);
  const [direction, setDirection] = useState<'crypto_to_fiat' | 'fiat_to_crypto'>('crypto_to_fiat');
  const [amount, setAmount] = useState<string>('1');

  const selectedCoin = coins.find((c) => c.id === selectedCoinId) || coins[0];
  const fiatRate = FIAT_RATES[selectedFiat] || 1;
  const coinPriceInSelectedFiat = selectedCoin.priceUsd * fiatRate;

  // Calculate result
  const parsedAmount = parseFloat(amount) || 0;
  let resultValue = 0;
  let formattedResult = '';

  if (direction === 'crypto_to_fiat') {
    resultValue = parsedAmount * coinPriceInSelectedFiat;
    formattedResult = `${FIAT_SYMBOLS[selectedFiat]}${resultValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else {
    resultValue = coinPriceInSelectedFiat > 0 ? parsedAmount / coinPriceInSelectedFiat : 0;
    const decimals = selectedCoin.priceUsd < 1 ? 4 : 6;
    formattedResult = `${resultValue.toFixed(decimals)} ${selectedCoin.symbol}`;
  }

  const handleSwap = () => {
    setDirection((prev) => (prev === 'crypto_to_fiat' ? 'fiat_to_crypto' : 'crypto_to_fiat'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2B313A] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0B90B]/15 border border-[#F0B90B]/30 flex items-center justify-center text-[#F0B90B]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Крипто-Конвертер валют</h2>
              <p className="text-xs text-[#848E9C]">Мгновенный расчет курсов в реальном времени</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#2B313A] hover:bg-[#363D47] text-[#848E9C] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Converter Body */}
        <div className="space-y-4">
          {/* FROM Block */}
          <div className="p-4 bg-[#0E1114] rounded-xl border border-[#2B313A]">
            <div className="flex items-center justify-between text-xs text-[#848E9C] mb-2">
              <span>{direction === 'crypto_to_fiat' ? 'Криптовалюта' : 'Фиатная валюта'}</span>
              <span>Текущий курс: 1 {selectedCoin.symbol} = {formatPrice(selectedCoin.priceUsd, selectedFiat)}</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-xl font-bold font-mono-num text-white focus:outline-none"
              />

              {direction === 'crypto_to_fiat' ? (
                /* Select Crypto */
                <select
                  value={selectedCoinId}
                  onChange={(e) => setSelectedCoinId(e.target.value)}
                  className="bg-[#1E2329] text-white font-bold text-xs px-3 py-2 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none cursor-pointer"
                >
                  {coins.map((coin) => (
                    <option key={coin.id} value={coin.id} className="bg-[#181A20] text-white">
                      {coin.symbol} — {coin.name}
                    </option>
                  ))}
                </select>
              ) : (
                /* Select Fiat */
                <select
                  value={selectedFiat}
                  onChange={(e) => setSelectedFiat(e.target.value as Currency)}
                  className="bg-[#1E2329] text-white font-bold text-xs px-3 py-2 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="RUB">RUB (₽)</option>
                </select>
              )}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwap}
              className="p-2.5 rounded-full bg-[#1E2329] hover:bg-[#F0B90B] text-[#F0B90B] hover:text-black border border-[#2B313A] hover:border-[#F0B90B] transition-all shadow-md cursor-pointer hover:rotate-180 duration-300"
              title="Поменять направление"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* TO Block */}
          <div className="p-4 bg-[#0E1114] rounded-xl border border-[#2B313A]">
            <div className="flex items-center justify-between text-xs text-[#848E9C] mb-2">
              <span>{direction === 'crypto_to_fiat' ? 'Вы получаете (Фиат)' : 'Вы получаете (Крипто)'}</span>
              <span className="text-[#0ECB81] text-[11px] font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Без комиссии сети (0%)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full text-xl font-bold font-mono-num text-[#0ECB81] select-all">
                {formattedResult}
              </div>

              {direction === 'crypto_to_fiat' ? (
                /* Select Fiat */
                <select
                  value={selectedFiat}
                  onChange={(e) => setSelectedFiat(e.target.value as Currency)}
                  className="bg-[#1E2329] text-white font-bold text-xs px-3 py-2 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="RUB">RUB (₽)</option>
                </select>
              ) : (
                /* Select Crypto */
                <select
                  value={selectedCoinId}
                  onChange={(e) => setSelectedCoinId(e.target.value)}
                  className="bg-[#1E2329] text-white font-bold text-xs px-3 py-2 rounded-xl border border-[#2B313A] focus:border-[#F0B90B] focus:outline-none cursor-pointer"
                >
                  {coins.map((coin) => (
                    <option key={coin.id} value={coin.id} className="bg-[#181A20] text-white">
                      {coin.symbol} — {coin.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-[#848E9C]">Пресеты:</span>
            {direction === 'crypto_to_fiat'
              ? [0.1, 0.5, 1, 2, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="px-2.5 py-1 rounded-lg bg-[#2B313A] hover:bg-[#363D47] text-xs font-mono-num text-[#EAECEF] cursor-pointer"
                  >
                    {val} {selectedCoin.symbol}
                  </button>
                ))
              : [100, 500, 1000, 5000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="px-2.5 py-1 rounded-lg bg-[#2B313A] hover:bg-[#363D47] text-xs font-mono-num text-[#EAECEF] cursor-pointer"
                  >
                    {FIAT_SYMBOLS[selectedFiat]}
                    {val}
                  </button>
                ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#2B313A] flex items-center justify-between text-xs text-[#848E9C]">
          <span>Источник: спотовый стакан Binance</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F0B90B] hover:bg-[#FCD535] text-black font-bold text-xs transition-colors cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
