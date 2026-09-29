import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { generateToken, requireAuth, AuthenticatedRequest } from './auth';
import { TradeRequest } from '../types/user';

export const apiRouter = Router();

// --- AUTHENTICATION ---

// Register
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Пожалуйста, заполните имя, email и пароль' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    return;
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const user = db.createUser(name, email, passwordHash);
  const token = generateToken(user);

  res.status(201).json({ user, token });
});

// Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Укажите email и пароль' });
    return;
  }

  const userWithHash = db.findUserByEmail(email);
  if (!userWithHash) {
    res.status(401).json({ error: 'Неверный email или пароль' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, userWithHash.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Неверный email или пароль' });
    return;
  }

  const { passwordHash: _, ...safeUser } = userWithHash;
  const token = generateToken(safeUser);

  res.json({ user: safeUser, token });
});

// Demo 1-click login
apiRouter.post('/auth/demo', (_req: Request, res: Response) => {
  const demoUser = db.findUserByEmail('demo@cryptopulse.io');
  if (!demoUser) {
    res.status(404).json({ error: 'Демо-аккаунт не найден' });
    return;
  }

  const { passwordHash: _, ...safeUser } = demoUser;
  const token = generateToken(safeUser);
  res.json({ user: safeUser, token });
});

// Current user profile
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// --- USER PROFILE & BALANCES ---

// Update profile
apiRouter.put('/user/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, avatar, password } = req.body;

  let passwordHash: string | undefined = undefined;
  if (password && password.length >= 6) {
    const salt = bcrypt.genSaltSync(10);
    passwordHash = bcrypt.hashSync(password, salt);
  }

  const updated = db.updateUserProfile(userId, { name, avatar, passwordHash });
  if (!updated) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  res.json({ user: updated });
});

// Reset virtual demo balance
apiRouter.post('/user/reset-balance', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const updated = db.resetUserBalance(userId);
  res.json({
    user: updated,
    message: 'Баланс успешно сброшен до стартовых $50,000 USD и 4,500,000 RUB',
  });
});

// Deposit virtual funds
apiRouter.post('/user/deposit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { amount, currency } = req.body;

  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    res.status(400).json({ error: 'Некорректная сумма пополнения' });
    return;
  }

  const cur = currency === 'RUB' ? 'RUB' : 'USD';
  const updated = db.depositUserBalance(userId, depositAmount, cur);
  res.json({
    user: updated,
    message: `Виртуальный баланс пополнен на +${depositAmount.toLocaleString('ru-RU')} ${cur}`,
  });
});

// Toggle favorites
apiRouter.post('/user/favorites/:coinId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { coinId } = req.params;
  const favorites = db.toggleFavorite(userId, coinId);
  res.json({ favorites });
});

// --- TRADING & PORTFOLIO ---

// Execute trade
apiRouter.post('/trade', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const tradeRequest = req.body as TradeRequest;

  if (!tradeRequest.coinId || !tradeRequest.symbol || !tradeRequest.amount || !tradeRequest.currentPriceUsd) {
    res.status(400).json({ error: 'Неполные данные для совершения сделки' });
    return;
  }

  const result = db.executeTrade(userId, tradeRequest);
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }

  res.json(result);
});

// Get user portfolio
apiRouter.get('/portfolio', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const portfolio = db.getUserPortfolio(userId);
  res.json({ portfolio });
});

// Get user transaction history
apiRouter.get('/transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const transactions = db.getUserTransactions(userId);
  res.json({ transactions });
});

// --- MARKET DATA PROXY & CACHE ---
let cachedTickers: any = null;
let lastTickersFetch = 0;

apiRouter.get('/market/tickers', async (_req: Request, res: Response) => {
  const now = Date.now();
  if (cachedTickers && now - lastTickersFetch < 5000) {
    res.json(cachedTickers);
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      cachedTickers = data;
      lastTickersFetch = now;
      res.json(data);
      return;
    }
  } catch (err) {
    console.warn('Backend proxy tickers fetch failed, returning cached if any:', err);
  }

  res.json(cachedTickers || []);
});

let cachedFearGreed: any = null;
let lastFearGreedFetch = 0;

apiRouter.get('/market/fear-greed', async (_req: Request, res: Response) => {
  const now = Date.now();
  if (cachedFearGreed && now - lastFearGreedFetch < 60000) {
    res.json(cachedFearGreed);
    return;
  }

  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    if (response.ok) {
      const data = await response.json();
      cachedFearGreed = data;
      lastFearGreedFetch = now;
      res.json(data);
      return;
    }
  } catch (err) {
    console.warn('Fear & Greed fetch failed:', err);
  }

  res.json(cachedFearGreed || { data: [{ value: '72', value_classification: 'Greed' }] });
});

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    simulation: true,
  });
});
