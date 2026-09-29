import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, PortfolioItem, Transaction, TradeRequest } from '../types/user';

interface DatabaseSchema {
  users: Array<User & { passwordHash: string }>;
  portfolios: PortfolioItem[];
  transactions: Transaction[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEMO_USER_ID = 'user-demo-001';

function createDefaultData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('password123', salt);

  const demoUser: User & { passwordHash: string } = {
    id: DEMO_USER_ID,
    name: 'Александр Смирнов',
    email: 'demo@cryptopulse.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    balances: {
      USD: 24350.80,
      RUB: 2150000.00,
    },
    favorites: ['bitcoin', 'ethereum', 'the-open-network', 'notcoin', 'solana'],
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    passwordHash,
  };

  const demoPortfolios: PortfolioItem[] = [
    {
      id: 'port-1',
      userId: DEMO_USER_ID,
      coinId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 0.35,
      averageBuyPriceUsd: 62450.00,
      totalCostUsd: 0.35 * 62450.00,
    },
    {
      id: 'port-2',
      userId: DEMO_USER_ID,
      coinId: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 3.2,
      averageBuyPriceUsd: 2480.00,
      totalCostUsd: 3.2 * 2480.00,
    },
    {
      id: 'port-3',
      userId: DEMO_USER_ID,
      coinId: 'the-open-network',
      symbol: 'TON',
      name: 'Toncoin',
      amount: 450,
      averageBuyPriceUsd: 5.15,
      totalCostUsd: 450 * 5.15,
    },
    {
      id: 'port-4',
      userId: DEMO_USER_ID,
      coinId: 'notcoin',
      symbol: 'NOT',
      name: 'Notcoin',
      amount: 40000,
      averageBuyPriceUsd: 0.0072,
      totalCostUsd: 40000 * 0.0072,
    },
  ];

  const demoTransactions: Transaction[] = [
    {
      id: 'tx-0',
      userId: DEMO_USER_ID,
      type: 'DEPOSIT',
      fiatCurrency: 'USD',
      totalFiat: 50000.00,
      timestamp: Date.now() - 28 * 24 * 3600 * 1000,
      status: 'COMPLETED',
      note: 'Стартовый виртуальный депозит демо-счета ($50,000 USD)',
    },
    {
      id: 'tx-1',
      userId: DEMO_USER_ID,
      type: 'BUY',
      coinId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 0.35,
      priceUsd: 62450.00,
      priceFiat: 62450.00,
      fiatCurrency: 'USD',
      totalFiat: 21857.50,
      timestamp: Date.now() - 20 * 24 * 3600 * 1000,
      status: 'COMPLETED',
      note: 'Покупка 0.35 BTC по курсу $62,450.00',
    },
    {
      id: 'tx-2',
      userId: DEMO_USER_ID,
      type: 'BUY',
      coinId: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 3.2,
      priceUsd: 2480.00,
      priceFiat: 2480.00,
      fiatCurrency: 'USD',
      totalFiat: 7936.00,
      timestamp: Date.now() - 14 * 24 * 3600 * 1000,
      status: 'COMPLETED',
      note: 'Покупка 3.2 ETH по курсу $2,480.00',
    },
    {
      id: 'tx-3',
      userId: DEMO_USER_ID,
      type: 'BUY',
      coinId: 'the-open-network',
      symbol: 'TON',
      name: 'Toncoin',
      amount: 450,
      priceUsd: 5.15,
      priceFiat: 5.15,
      fiatCurrency: 'USD',
      totalFiat: 2317.50,
      timestamp: Date.now() - 7 * 24 * 3600 * 1000,
      status: 'COMPLETED',
      note: 'Покупка 450 TON по курсу $5.15',
    },
    {
      id: 'tx-4',
      userId: DEMO_USER_ID,
      type: 'BUY',
      coinId: 'notcoin',
      symbol: 'NOT',
      name: 'Notcoin',
      amount: 40000,
      priceUsd: 0.0072,
      priceFiat: 0.0072,
      fiatCurrency: 'USD',
      totalFiat: 288.00,
      timestamp: Date.now() - 3 * 24 * 3600 * 1000,
      status: 'COMPLETED',
      note: 'Покупка 40,000 NOT по курсу $0.0072',
    },
  ];

  return {
    users: [demoUser],
    portfolios: demoPortfolios,
    transactions: demoTransactions,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.users)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load database.json, initializing fresh default db:', e);
    }

    const defaultData = createDefaultData();
    this.saveDirect(defaultData);
    return defaultData;
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  public findUserById(id: string): User | null {
    const u = this.data.users.find((x) => x.id === id);
    if (!u) return null;
    const { passwordHash, ...safeUser } = u;
    return safeUser;
  }

  public findUserByEmail(email: string): (User & { passwordHash: string }) | null {
    return this.data.users.find((x) => x.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public createUser(name: string, email: string, passwordHash: string): User {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newUser: User & { passwordHash: string } = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
      balances: {
        USD: 50000.00,
        RUB: 4500000.00,
      },
      favorites: ['bitcoin', 'ethereum', 'the-open-network', 'notcoin'],
      createdAt: new Date().toISOString(),
      passwordHash,
    };

    this.data.users.push(newUser);

    // Initial deposit transaction
    this.data.transactions.unshift({
      id: `tx-${Date.now()}-init-usd`,
      userId: id,
      type: 'DEPOSIT',
      fiatCurrency: 'USD',
      totalFiat: 50000.00,
      timestamp: Date.now(),
      status: 'COMPLETED',
      note: 'Приветственный виртуальный депозит демо-счета ($50,000 USD)',
    });
    this.data.transactions.unshift({
      id: `tx-${Date.now()}-init-rub`,
      userId: id,
      type: 'DEPOSIT',
      fiatCurrency: 'RUB',
      totalFiat: 4500000.00,
      timestamp: Date.now(),
      status: 'COMPLETED',
      note: 'Приветственный виртуальный депозит демо-счета (4,500,000 ₽ RUB)',
    });

    this.save();

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  public updateUserProfile(id: string, updates: { name?: string; avatar?: string; passwordHash?: string }): User | null {
    const user = this.data.users.find((x) => x.id === id);
    if (!user) return null;

    if (updates.name) user.name = updates.name.trim();
    if (updates.avatar) user.avatar = updates.avatar.trim();
    if (updates.passwordHash) user.passwordHash = updates.passwordHash;
    user.updatedAt = new Date().toISOString();

    this.save();
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public resetUserBalance(id: string): User | null {
    const user = this.data.users.find((x) => x.id === id);
    if (!user) return null;

    user.balances = {
      USD: 50000.00,
      RUB: 4500000.00,
    };

    // Remove existing portfolio items for this user
    this.data.portfolios = this.data.portfolios.filter((p) => p.userId !== id);

    this.data.transactions.unshift({
      id: `tx-${Date.now()}-reset`,
      userId: id,
      type: 'RESET',
      fiatCurrency: 'USD',
      totalFiat: 50000.00,
      timestamp: Date.now(),
      status: 'COMPLETED',
      note: 'Сброс демо-баланса до начальных $50,000 USD и 4,500,000 RUB',
    });

    this.save();
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public depositUserBalance(id: string, amount: number, currency: 'USD' | 'RUB'): User | null {
    const user = this.data.users.find((x) => x.id === id);
    if (!user) return null;

    if (currency === 'USD') {
      user.balances.USD += amount;
    } else {
      user.balances.RUB += amount;
    }

    this.data.transactions.unshift({
      id: `tx-${Date.now()}-dep`,
      userId: id,
      type: 'DEPOSIT',
      fiatCurrency: currency,
      totalFiat: amount,
      timestamp: Date.now(),
      status: 'COMPLETED',
      note: `Пополнение демо-счета на +${amount.toLocaleString('ru-RU')} ${currency}`,
    });

    this.save();
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public toggleFavorite(userId: string, coinId: string): string[] {
    const user = this.data.users.find((x) => x.id === userId);
    if (!user) return [];

    if (user.favorites.includes(coinId)) {
      user.favorites = user.favorites.filter((c) => c !== coinId);
    } else {
      user.favorites.push(coinId);
    }

    this.save();
    return user.favorites;
  }

  public getUserPortfolio(userId: string): PortfolioItem[] {
    return this.data.portfolios.filter((p) => p.userId === userId && p.amount > 0.0000001);
  }

  public getUserTransactions(userId: string): Transaction[] {
    return this.data.transactions
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  public executeTrade(userId: string, trade: TradeRequest): { success: boolean; message: string; user?: User; portfolio?: PortfolioItem[] } {
    const user = this.data.users.find((x) => x.id === userId);
    if (!user) {
      return { success: false, message: 'Пользователь не найден' };
    }

    const { coinId, symbol, name, type, amount, fiatCurrency, currentPriceUsd } = trade;

    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Некорректное количество для сделки' };
    }

    // Exchange rate for conversion: 1 USD = 92.5 RUB
    const usdToRubRate = 92.5;
    const priceFiat = fiatCurrency === 'RUB' ? currentPriceUsd * usdToRubRate : currentPriceUsd;
    const totalCostFiat = amount * priceFiat;
    const totalCostUsd = amount * currentPriceUsd;

    if (type === 'BUY') {
      // Check available fiat balance
      const currentFiatBalance = user.balances[fiatCurrency];
      if (currentFiatBalance < totalCostFiat) {
        return {
          success: false,
          message: `Недостаточно средств. Требуется: ${totalCostFiat.toFixed(2)} ${fiatCurrency}, доступно: ${currentFiatBalance.toFixed(2)} ${fiatCurrency}`,
        };
      }

      // Deduct fiat
      user.balances[fiatCurrency] -= totalCostFiat;

      // Update or add portfolio item
      let item = this.data.portfolios.find((p) => p.userId === userId && p.coinId === coinId);
      if (item) {
        const newTotalAmount = item.amount + amount;
        const newTotalCostUsd = item.totalCostUsd + totalCostUsd;
        item.averageBuyPriceUsd = newTotalCostUsd / newTotalAmount;
        item.amount = newTotalAmount;
        item.totalCostUsd = newTotalCostUsd;
      } else {
        item = {
          id: `port-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId,
          coinId,
          symbol,
          name,
          amount,
          averageBuyPriceUsd: currentPriceUsd,
          totalCostUsd,
        };
        this.data.portfolios.push(item);
      }

      // Add transaction record
      this.data.transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        type: 'BUY',
        coinId,
        symbol,
        name,
        amount,
        priceUsd: currentPriceUsd,
        priceFiat,
        fiatCurrency,
        totalFiat: totalCostFiat,
        timestamp: Date.now(),
        status: 'COMPLETED',
        note: `Покупка ${amount} ${symbol} по курсу ${priceFiat.toFixed(2)} ${fiatCurrency}`,
      });

      this.save();

      const { passwordHash: _, ...safeUser } = user;
      return {
        success: true,
        message: `Успешно куплено ${amount} ${symbol} за ${totalCostFiat.toFixed(2)} ${fiatCurrency}`,
        user: safeUser,
        portfolio: this.getUserPortfolio(userId),
      };
    } else {
      // SELL trade
      const item = this.data.portfolios.find((p) => p.userId === userId && p.coinId === coinId);
      if (!item || item.amount < amount - 0.00000001) {
        const available = item ? item.amount : 0;
        return {
          success: false,
          message: `Недостаточно криптовалюты для продажи. Доступно: ${available} ${symbol}`,
        };
      }

      // Reduce crypto
      const remainingAmount = item.amount - amount;
      if (remainingAmount <= 0.0000001) {
        this.data.portfolios = this.data.portfolios.filter((p) => p.id !== item.id);
      } else {
        item.totalCostUsd = item.averageBuyPriceUsd * remainingAmount;
        item.amount = remainingAmount;
      }

      // Add fiat
      user.balances[fiatCurrency] += totalCostFiat;

      // Add transaction record
      this.data.transactions.unshift({
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        type: 'SELL',
        coinId,
        symbol,
        name,
        amount,
        priceUsd: currentPriceUsd,
        priceFiat,
        fiatCurrency,
        totalFiat: totalCostFiat,
        timestamp: Date.now(),
        status: 'COMPLETED',
        note: `Продажа ${amount} ${symbol} по курсу ${priceFiat.toFixed(2)} ${fiatCurrency}`,
      });

      this.save();

      const { passwordHash: _, ...safeUser } = user;
      return {
        success: true,
        message: `Успешно продано ${amount} ${symbol} за ${totalCostFiat.toFixed(2)} ${fiatCurrency}`,
        user: safeUser,
        portfolio: this.getUserPortfolio(userId),
      };
    }
  }
}

export const db = new Database();
