import { Currency } from '../types/crypto';
import { FIAT_RATES, FIAT_SYMBOLS } from '../data/initialCoins';

export function formatPrice(
  usdPrice: number,
  currency: Currency = 'USD',
  options?: { compact?: boolean; minDecimals?: number; maxDecimals?: number }
): string {
  const rate = FIAT_RATES[currency] || 1;
  const value = usdPrice * rate;
  const symbol = FIAT_SYMBOLS[currency] || '$';

  if (value === 0) return `${symbol}0.00`;

  if (options?.compact && value >= 1_000_000) {
    return `${symbol}${formatCompactNumber(value)}`;
  }

  // Micro prices (like PEPE or SHIB)
  if (value < 0.0001) {
    return `${symbol}${value.toFixed(7)}`;
  }
  // Sub-dollar prices (like NOT, ADA, DOGE)
  if (value < 1) {
    return `${symbol}${value.toFixed(4)}`;
  }
  // Lower tier prices ($1 - $100)
  if (value < 100) {
    return `${symbol}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  // Standard prices ($100+)
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString('en-US');
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatSupply(amount: number, symbol: string): string {
  return `${formatCompactNumber(amount)} ${symbol}`;
}
