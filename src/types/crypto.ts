export type Currency = 'USD' | 'EUR' | 'RUB';

export interface CryptoCoin {
  id: string;
  symbol: string;         // e.g. "BTC"
  binanceSymbol: string;  // e.g. "BTCUSDT"
  name: string;
  iconUrl: string;
  rank: number;
  priceUsd: number;
  change24h: number;      // percentage e.g. +3.45 or -1.20
  change7d: number;       // percentage
  volume24hUsd: number;
  marketCapUsd: number;
  high24hUsd: number;
  low24hUsd: number;
  circulatingSupply: number;
  totalSupply?: number;
  allTimeHighUsd: number;
  sparkline: number[];    // 15-20 points for 7d chart
  lastUpdated?: number;
}

export interface CandlePoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeFrame = '1h' | '24h' | '7d' | '30d' | '1y';

export type ChartType = 'line' | 'candles';

export type SortField = 'rank' | 'name' | 'price' | 'change24h' | 'change7d' | 'volume24h' | 'marketCap';
export type SortDirection = 'asc' | 'desc';

export type FilterCategory = 'all' | 'favorites' | 'top10' | 'gainers' | 'losers' | 'ecosystem_ton';

export interface MarketOverviewData {
  totalMarketCapUsd: number;
  marketCapChange24h: number;
  totalVolume24hUsd: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
  fearGreedClassification: string;
  activeCryptos: number;
  gasPriceGwei: number;
}

export interface TickerUpdate {
  symbol: string;         // e.g. "BTCUSDT" or "BTC"
  price: number;
  change24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'polling' | 'offline';

// ================= USER & PORTFOLIO TYPES =================

export interface UserBalances {
  USD: number;
  RUB: number;
}

export interface PortfolioHolding {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  totalCostUsd: number;
  averageBuyPriceUsd: number;
}

export interface UserSettings {
  defaultCurrency: Currency;
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  balances: UserBalances;
  holdings: PortfolioHolding[];
  favorites: string[];
  settings: UserSettings;
}

export type TransactionType = 'BUY' | 'SELL' | 'DEPOSIT_DEMO' | 'RESET_DEMO';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  amount: number;
  priceUsd: number;
  fiatCurrency: Currency;
  totalUsd: number;
  totalFiat: number;
  feeUsd: number;
  pnlUsd?: number;
  timestamp: number;
  status: 'COMPLETED';
}

export interface PortfolioSummary {
  cashUsd: number;
  cashRub: number;
  cryptoValueUsd: number;
  totalEquityUsd: number;
  totalCostUsd: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPct: number;
  holdingsWithMetrics: Array<PortfolioHolding & {
    currentPriceUsd: number;
    currentValueUsd: number;
    unrealizedPnlUsd: number;
    unrealizedPnlPct: number;
    allocationPct: number;
  }>;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export type NavigationTab = 'markets' | 'trade' | 'portfolio' | 'history';
