import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  balances: {
    USD: number;
    RUB: number;
  };
  holdings: Array<{
    coinId: string;
    symbol: string;
    name: string;
    amount: number;
    totalCostUsd: number;
    averageBuyPriceUsd: number;
  }>;
  favorites: string[];
  settings: {
    defaultCurrency: 'USD' | 'EUR' | 'RUB';
    theme: 'dark' | 'light';
    notificationsEnabled: boolean;
  };
}

export interface TransactionEntity {
  id: string;
  userId: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT_DEMO' | 'RESET_DEMO';
  coinId: string;
  coinSymbol: string;
  coinName: string;
  amount: number;
  priceUsd: number;
  fiatCurrency: 'USD' | 'EUR' | 'RUB';
  totalUsd: number;
  totalFiat: number;
  feeUsd: number;
  pnlUsd?: number;
  timestamp: number;
  status: 'COMPLETED';
}

interface DatabaseSchema {
  users: UserEntity[];
  transactions: TransactionEntity[];
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Memory cache
let db: DatabaseSchema = {
  users: [],
  transactions: [],
};

// Seed initial demo data
function getSeedData(): DatabaseSchema {
  const demoSalt = bcrypt.genSaltSync(10);
  const demoHash = bcrypt.hashSync('password123', demoSalt);

  const demoUserId = 'usr_demo_vip_2026';
  const now = Date.now();

  const demoUser: UserEntity = {
    id: demoUserId,
    email: 'demo@cryptopulse.io',
    name: 'Александр (Trader Pro)',
    passwordHash: demoHash,
    createdAt: new Date(now - 7 * 24 * 3600 * 1000).toISOString(),
    balances: {
      USD: 10000,
      RUB: 1000000,
    },
    holdings: [
      {
        coinId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        amount: 0.15,
        totalCostUsd: 9750,
        averageBuyPriceUsd: 65000,
      },
      {
        coinId: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        amount: 1.5,
        totalCostUsd: 3750,
        averageBuyPriceUsd: 2500,
      },
      {
        coinId: 'the-open-network',
        symbol: 'TON',
        name: 'Toncoin',
        amount: 250,
        totalCostUsd: 1350,
        averageBuyPriceUsd: 5.4,
      },
      {
        coinId: 'notcoin',
        symbol: 'NOT',
        name: 'Notcoin',
        amount: 35000,
        totalCostUsd: 262.5,
        averageBuyPriceUsd: 0.0075,
      },
    ],
    favorites: ['bitcoin', 'ethereum', 'the-open-network', 'notcoin', 'solana'],
    settings: {
      defaultCurrency: 'USD',
      theme: 'dark',
      notificationsEnabled: true,
    },
  };

  const seedTransactions: TransactionEntity[] = [
    {
      id: 'tx_seed_1',
      userId: demoUserId,
      type: 'DEPOSIT_DEMO',
      coinId: '',
      coinSymbol: 'USD/RUB',
      coinName: 'Стартовый виртуальный депозит',
      amount: 1,
      priceUsd: 10000,
      fiatCurrency: 'USD',
      totalUsd: 10000,
      totalFiat: 10000,
      feeUsd: 0,
      timestamp: now - 6 * 24 * 3600 * 1000,
      status: 'COMPLETED',
    },
    {
      id: 'tx_seed_2',
      userId: demoUserId,
      type: 'BUY',
      coinId: 'bitcoin',
      coinSymbol: 'BTC',
      coinName: 'Bitcoin',
      amount: 0.15,
      priceUsd: 65000,
      fiatCurrency: 'USD',
      totalUsd: 9750,
      totalFiat: 9750,
      feeUsd: 9.75,
      timestamp: now - 5 * 24 * 3600 * 1000,
      status: 'COMPLETED',
    },
    {
      id: 'tx_seed_3',
      userId: demoUserId,
      type: 'BUY',
      coinId: 'ethereum',
      coinSymbol: 'ETH',
      coinName: 'Ethereum',
      amount: 1.5,
      priceUsd: 2500,
      fiatCurrency: 'USD',
      totalUsd: 3750,
      totalFiat: 3750,
      feeUsd: 3.75,
      timestamp: now - 4 * 24 * 3600 * 1000,
      status: 'COMPLETED',
    },
    {
      id: 'tx_seed_4',
      userId: demoUserId,
      type: 'BUY',
      coinId: 'the-open-network',
      coinSymbol: 'TON',
      coinName: 'Toncoin',
      amount: 250,
      priceUsd: 5.4,
      fiatCurrency: 'USD',
      totalUsd: 1350,
      totalFiat: 1350,
      feeUsd: 1.35,
      timestamp: now - 2 * 24 * 3600 * 1000,
      status: 'COMPLETED',
    },
  ];

  return {
    users: [demoUser],
    transactions: seedTransactions,
  };
}

export function initDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
      // Ensure seed demo user exists
      if (!db.users || db.users.length === 0) {
        db = getSeedData();
        saveDatabase();
      }
    } else {
      db = getSeedData();
      saveDatabase();
    }
  } catch (err) {
    console.error('Error initializing database, using seed:', err);
    db = getSeedData();
  }
}

export function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

// User Helpers
export function getUserById(id: string): UserEntity | undefined {
  return db.users.find((u) => u.id === id);
}

export function getUserByEmail(email: string): UserEntity | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(user: UserEntity): UserEntity {
  db.users.push(user);
  saveDatabase();
  return user;
}

export function updateUser(id: string, updates: Partial<UserEntity>): UserEntity | null {
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  db.users[index] = {
    ...db.users[index],
    ...updates,
    balances: {
      ...db.users[index].balances,
      ...(updates.balances || {}),
    },
    settings: {
      ...db.users[index].settings,
      ...(updates.settings || {}),
    },
  };

  saveDatabase();
  return db.users[index];
}

// Transaction Helpers
export function getTransactionsByUserId(userId: string): TransactionEntity[] {
  return db.transactions
    .filter((tx) => tx.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function addTransaction(tx: TransactionEntity): TransactionEntity {
  db.transactions.unshift(tx);
  saveDatabase();
  return tx;
}

export function resetDemoAccount(userId: string): UserEntity | null {
  const user = getUserById(userId);
  if (!user) return null;

  user.balances = {
    USD: 10000,
    RUB: 1000000,
  };
  user.holdings = [];

  const resetTx: TransactionEntity = {
    id: `tx_${Date.now()}_reset`,
    userId,
    type: 'RESET_DEMO',
    coinId: '',
    coinSymbol: 'ALL',
    coinName: 'Сброс демо-счета до $10,000 и 1,000,000 ₽',
    amount: 1,
    priceUsd: 10000,
    fiatCurrency: 'USD',
    totalUsd: 10000,
    totalFiat: 10000,
    feeUsd: 0,
    timestamp: Date.now(),
    status: 'COMPLETED',
  };

  db.transactions.unshift(resetTx);
  saveDatabase();
  return user;
}
