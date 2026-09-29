import React, { useState } from 'react';
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  PlusCircle,
  Filter,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TransactionType } from '../types/user';
import { Currency } from '../types/crypto';
import { FIAT_SYMBOLS } from '../data/initialCoins';
import { formatPrice } from '../utils/formatters';

interface TransactionsViewProps {
  currency: Currency;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ currency }) => {
  const { transactions } = useAuth();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'ALL' && tx.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchSymbol = tx.symbol?.toLowerCase().includes(q);
      const matchName = tx.name?.toLowerCase().includes(q);
      const matchNote = tx.note?.toLowerCase().includes(q);
      if (!matchSymbol && !matchName && !matchNote) return false;
    }
    return true;
  });

  return (
    <div className="bg-[#181A20] rounded-2xl border border-[#2B313A] shadow-xl overflow-hidden">
      {/* Header with Search and Filter */}
      <div className="p-4 sm:p-6 border-b border-[#2B313A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#F0B90B]" />
            <h2 className="text-base sm:text-lg font-bold text-white">История виртуальных операций</h2>
          </div>
          <p className="text-xs text-[#848E9C] mt-0.5">
            Все покупки, продажи и пополнения демо-счета сохраняются в базе данных
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'Все операции' },
            { id: 'BUY', label: 'Покупки (BUY)' },
            { id: 'SELL', label: 'Продажи (SELL)' },
            { id: 'DEPOSIT', label: 'Депозиты' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                filterType === item.id
                  ? 'bg-[#F0B90B] text-black font-bold shadow-sm'
                  : 'bg-[#2B313A]/60 text-[#848E9C] hover:text-white hover:bg-[#2B313A]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2B313A] bg-[#14151A] text-[#848E9C] font-semibold select-none">
              <th className="py-3.5 pl-6">Тип операции</th>
              <th className="py-3.5 px-4">Актив</th>
              <th className="py-3.5 px-4 text-right">Количество</th>
              <th className="py-3.5 px-4 text-right">Курс исполнения</th>
              <th className="py-3.5 px-4 text-right">Итого (Фиат)</th>
              <th className="py-3.5 px-4">Дата и время</th>
              <th className="py-3.5 pr-6 text-right">Статус</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#2B313A]/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#848E9C]">
                  <p className="text-sm font-semibold text-white">Операций не найдено</p>
                  <p className="text-xs text-[#848E9C] mt-1">
                    История появится после совершения первой виртуальной покупки или продажи
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const isBuy = tx.type === 'BUY';
                const isSell = tx.type === 'SELL';
                const isDeposit = tx.type === 'DEPOSIT';
                const isReset = tx.type === 'RESET';

                const dateStr = new Date(tx.timestamp).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr key={tx.id} className="hover:bg-[#23272E]/60 transition-colors">
                    {/* Type badge */}
                    <td className="py-3.5 pl-6">
                      <div className="flex items-center gap-2">
                        {isBuy && (
                          <span className="flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[11px] bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30">
                            <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
                            Покупка
                          </span>
                        )}
                        {isSell && (
                          <span className="flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[11px] bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30">
                            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                            Продажа
                          </span>
                        )}
                        {isDeposit && (
                          <span className="flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[11px] bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <PlusCircle className="w-3 h-3" />
                            Пополнение
                          </span>
                        )}
                        {isReset && (
                          <span className="flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <RotateCcw className="w-3 h-3" />
                            Сброс
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Asset */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      {tx.symbol ? (
                        <div className="flex items-center gap-1.5">
                          <span>{tx.name || tx.symbol}</span>
                          <span className="text-[11px] text-[#848E9C] font-semibold">({tx.symbol})</span>
                        </div>
                      ) : (
                        <span className="text-[#848E9C]">Виртуальный счет ({tx.fiatCurrency})</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-white">
                      {tx.amount !== undefined ? `${tx.amount} ${tx.symbol}` : '—'}
                    </td>

                    {/* Execution Price */}
                    <td className="py-3.5 px-4 text-right font-mono-num text-[#848E9C]">
                      {tx.priceFiat !== undefined
                        ? `${FIAT_SYMBOLS[tx.fiatCurrency] || '$'}${tx.priceFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                        : '—'}
                    </td>

                    {/* Total Fiat */}
                    <td className="py-3.5 px-4 text-right font-mono-num font-bold text-white">
                      {FIAT_SYMBOLS[tx.fiatCurrency] || '$'}
                      {tx.totalFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono-num text-xs text-[#848E9C]">
                      {dateStr}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 pr-6 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0ECB81]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Исполнено
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
