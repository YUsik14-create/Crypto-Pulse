import React from 'react';
import { Gauge, Info, X } from 'lucide-react';
import { MarketOverviewData } from '../types/crypto';

interface FearGreedModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketOverview: MarketOverviewData;
}

export const FearGreedModal: React.FC<FearGreedModalProps> = ({
  isOpen,
  onClose,
  marketOverview,
}) => {
  if (!isOpen) return null;

  const value = marketOverview.fearGreedIndex;

  const getMeterColor = (val: number) => {
    if (val >= 75) return '#0ECB81'; // Extreme Greed
    if (val >= 55) return '#62D997'; // Greed
    if (val >= 45) return '#F0B90B'; // Neutral
    if (val >= 25) return '#F87171'; // Fear
    return '#F6465D'; // Extreme Fear
  };

  const zones = [
    { label: '0-25 Экстремальный страх', color: 'bg-[#F6465D]', desc: 'Инвесторы слишком напуганы. Исторически это может быть хорошей возможностью для покупки.' },
    { label: '26-45 Страх', color: 'bg-[#F87171]', desc: 'На рынке преобладает осторожность и фиксация прибыли.' },
    { label: '46-54 Нейтрально', color: 'bg-[#F0B90B]', desc: 'Баланс между покупателями и продавцами.' },
    { label: '55-74 Жадность', color: 'bg-[#62D997]', desc: 'Растущий оптимизм, приток ликвидности и рост объемов.' },
    { label: '75-100 Экстремальная жадность', color: 'bg-[#0ECB81]', desc: 'Рынок перегрет, возможна скорая коррекция.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#2B313A] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0B90B]/15 border border-[#F0B90B]/30 flex items-center justify-center text-[#F0B90B]">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Индекс страха и жадности</h2>
              <p className="text-xs text-[#848E9C]">Crypto Fear & Greed Index</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#2B313A] hover:bg-[#363D47] text-[#848E9C] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gauge Display */}
        <div className="text-center py-4 bg-[#0E1114] rounded-2xl border border-[#2B313A] mb-5">
          <span className="text-xs text-[#848E9C] block mb-1">Текущее настроение рынка</span>
          <div
            className="text-5xl font-black font-mono-num mb-1 tracking-tight"
            style={{ color: getMeterColor(value) }}
          >
            {value}
            <span className="text-xl text-[#848E9C] font-normal"> / 100</span>
          </div>
          <span
            className="inline-block text-xs font-bold px-3 py-1 rounded-full uppercase"
            style={{
              backgroundColor: `${getMeterColor(value)}20`,
              color: getMeterColor(value),
              border: `1px solid ${getMeterColor(value)}40`,
            }}
          >
            {marketOverview.fearGreedClassification}
          </span>

          {/* Visual scale bar */}
          <div className="px-6 mt-4">
            <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#F6465D] via-[#F0B90B] to-[#0ECB81] relative">
              {/* Pointer */}
              <div
                className="absolute -top-1 w-5 h-5 bg-white border-2 border-black rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-500"
                style={{ left: `${value}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#848E9C] mt-1.5 font-mono-num">
              <span>0 (Страх)</span>
              <span>50</span>
              <span>100 (Жадность)</span>
            </div>
          </div>
        </div>

        {/* Breakdown of zones */}
        <div className="space-y-2 mb-4">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#F0B90B]" />
            Шкала настроений:
          </h3>
          {zones.map((zone, idx) => (
            <div key={idx} className="p-2 bg-[#14151A] rounded-lg border border-[#2B313A] text-xs">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${zone.color}`} />
                <span className="font-semibold text-white">{zone.label}</span>
              </div>
              <p className="text-[11px] text-[#848E9C] pl-4">{zone.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#F0B90B] hover:bg-[#FCD535] text-black font-bold text-xs transition-colors cursor-pointer"
        >
          Понятно
        </button>
      </div>
    </div>
  );
};
