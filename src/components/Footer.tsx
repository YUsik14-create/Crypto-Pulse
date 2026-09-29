import React from 'react';
import { Activity, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-[#23272E] bg-[#0E1114] text-[#848E9C] text-xs">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F0B90B] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Crypto<span className="text-[#F0B90B]">Pulse</span>
              </span>
            </div>
            <p className="text-xs text-[#848E9C] max-w-md leading-relaxed">
              Профессиональный криптографический терминал отслеживания котировок в режиме реального времени. Прямое подключение к спотовым серверам Binance WebSocket и интеграция агрегаторов данных.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-[#5E6673] pt-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#0ECB81]" /> Задержка: &lt; 50мс
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F0B90B]" /> Защищенное WSS соединение
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-3">Популярные активы</h4>
            <ul className="space-y-1.5 text-xs">
              <li><span className="hover:text-white cursor-pointer transition-colors">Bitcoin (BTC)</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Ethereum (ETH)</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Toncoin (TON) & Notcoin (NOT)</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Solana (SOL)</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Binance Coin (BNB)</span></li>
            </ul>
          </div>

          {/* Data sources */}
          <div>
            <h4 className="text-white font-semibold text-xs mb-3">Источники данных</h4>
            <ul className="space-y-1.5 text-xs">
              <li><span className="hover:text-white cursor-pointer transition-colors">Binance Spot WSS Stream</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Alternative.me Fear & Greed</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">CoinGecko Markets API</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">CryptoCompare Fiat Rates</span></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer row */}
        <div className="pt-6 border-t border-[#1E2329] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#5E6673]">
          <p>© {new Date().getFullYear()} CryptoPulse Terminal. Данные носят исключительно информационный характер и не являются инвестиционной рекомендацией.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#848E9C] cursor-pointer">Политика конфиденциальности</span>
            <span className="hover:text-[#848E9C] cursor-pointer">Условия использования</span>
            <span className="hover:text-[#848E9C] cursor-pointer">API Документация</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
