export interface UserBalances {
  USD: number;
  RUB: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  balances: UserBalances;
  favorites: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  averageBuyPriceUsd: number;
  totalCostUsd: number;
}

export type TransactionType = 'BUY' | 'SELL' | 'DEPOSIT' | 'RESET';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  coinId?: string;
  symbol?: string;
  name?: string;
  amount?: number;
  priceUsd?: number;
  priceFiat?: number;
  fiatCurrency: 'USD' | 'RUB' | 'EUR';
  totalFiat: number;
  timestamp: number;
  status: 'COMPLETED' | 'FAILED';
  note?: string;
}

export interface TradeRequest {
  coinId: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  amount: number;
  fiatCurrency: 'USD' | 'RUB';
  currentPriceUsd: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}
