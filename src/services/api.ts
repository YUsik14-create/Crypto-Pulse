import { CryptoCoin, MarketOverviewData, TickerUpdate } from '../types/crypto';
import { INITIAL_COINS, INITIAL_MARKET_OVERVIEW } from '../data/initialCoins';
import { User, PortfolioItem, Transaction, TradeRequest, AuthResponse } from '../types/user';

// Binance symbol mapping
const BINANCE_TO_COIN_ID: Record<string, string> = {
  BTCUSDT: 'bitcoin',
  ETHUSDT: 'ethereum',
  SOLUSDT: 'solana',
  BNBUSDT: 'binancecoin',
  TONUSDT: 'the-open-network',
  XRPUSDT: 'ripple',
  DOGEUSDT: 'dogecoin',
  NOTUSDT: 'notcoin',
  ADAUSDT: 'cardano',
  TRXUSDT: 'tron',
  AVAXUSDT: 'avalanche-2',
  LINKUSDT: 'chainlink',
  SUIUSDT: 'sui',
  NEARUSDT: 'near',
  PEPEUSDT: 'pepe',
  SHIBUSDT: 'shiba-inu',
  DOTUSDT: 'polkadot',
  UNIUSDT: 'uniswap',
  APTUSDT: 'aptos',
  RENDERUSDT: 'render-token',
};

/**
 * Fetches latest 24hr tickers from Backend Proxy or Binance directly
 */
export async function fetchBinanceTickers(): Promise<Record<string, TickerUpdate>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let data: any = null;

    // Try backend proxy first
    try {
      const res = await fetch('/api/market/tickers', { signal: controller.signal });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        data = await res.json();
      }
    } catch {
      // Continue to fallback
    }

    // Fallback directly to Binance REST API if proxy didn't return valid json
    if (!data || !Array.isArray(data)) {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', { signal: controller.signal });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          data = await res.json();
        }
      } catch {
        // Fallback below
      }
    }
    clearTimeout(timeoutId);

    const updates: Record<string, TickerUpdate> = {};

    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const symbol = item.symbol;
        if (BINANCE_TO_COIN_ID[symbol]) {
          updates[symbol] = {
            symbol,
            price: parseFloat(item.lastPrice),
            change24h: parseFloat(item.priceChangePercent),
            high24h: parseFloat(item.highPrice),
            low24h: parseFloat(item.lowPrice),
            volume24h: parseFloat(item.quoteVolume),
          };
        }
      });
    }

    return updates;
  } catch (error) {
    console.warn('Could not fetch tickers, fallback in place', error);
    return {};
  }
}

/**
 * Fetches Fear and Greed Index
 */
export async function fetchFearAndGreed(): Promise<{ value: number; classification: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let data: any = null;

    // Try backend proxy first
    try {
      const res = await fetch('/api/market/fear-greed', { signal: controller.signal });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        data = await res.json();
      }
    } catch {
      // Fallback
    }

    // Fallback to Alternative.me directly
    if (!data || !data.data) {
      try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1', { signal: controller.signal });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          data = await res.json();
        }
      } catch {
        // Fallback
      }
    }
    clearTimeout(timeoutId);

    if (data && data.data && data.data[0]) {
      const item = data.data[0];
      const val = parseInt(item.value, 10);
      let classificationRu = 'Нейтрально (Neutral)';
      if (val >= 75) classificationRu = 'Экстремальная жадность (Extreme Greed)';
      else if (val >= 55) classificationRu = 'Жадность (Greed)';
      else if (val <= 25) classificationRu = 'Экстремальный страх (Extreme Fear)';
      else if (val <= 45) classificationRu = 'Страх (Fear)';

      return {
        value: val,
        classification: classificationRu,
      };
    }
  } catch (error) {
    console.warn('Fear & Greed index fetch error, using default', error);
  }
  return null;
}

// --- FULL-STACK BACKEND AUTH & USER APIS ---

export async function apiRegister(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
  return data;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка входа');
  return data;
}

export async function apiDemoLogin(): Promise<AuthResponse> {
  const res = await fetch('/api/auth/demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка входа в демо-аккаунт');
  return data;
}

export async function apiGetMe(token: string): Promise<{ user: User }> {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Не удалось загрузить профиль');
  return data;
}

export async function apiUpdateProfile(
  token: string,
  updates: { name?: string; avatar?: string; password?: string }
): Promise<{ user: User }> {
  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка обновления профиля');
  return data;
}

export async function apiResetBalance(token: string): Promise<{ user: User; message: string }> {
  const res = await fetch('/api/user/reset-balance', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сброса баланса');
  return data;
}

export async function apiDepositBalance(
  token: string,
  amount: number,
  currency: 'USD' | 'RUB'
): Promise<{ user: User; message: string }> {
  const res = await fetch('/api/user/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, currency }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка пополнения баланса');
  return data;
}

export async function apiToggleFavorite(token: string, coinId: string): Promise<{ favorites: string[] }> {
  const res = await fetch(`/api/user/favorites/${coinId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сохранения избранного');
  return data;
}

export async function apiGetPortfolio(token: string): Promise<{ portfolio: PortfolioItem[] }> {
  const res = await fetch('/api/portfolio', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки портфеля');
  return data;
}

export async function apiGetTransactions(token: string): Promise<{ transactions: Transaction[] }> {
  const res = await fetch('/api/transactions', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки истории операций');
  return data;
}

export async function apiExecuteTrade(
  token: string,
  trade: TradeRequest
): Promise<{ success: boolean; message: string; user?: User; portfolio?: PortfolioItem[] }> {
  const res = await fetch('/api/trade', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(trade),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка совершения сделки');
  return data;
}
