import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  addTransaction,
  getTransactionsByUserId,
  resetDemoAccount,
  UserEntity,
  TransactionEntity,
} from './db';
import { generateToken, requireAuth, AuthenticatedRequest } from './auth';

const router = Router();

const RUB_PER_USD = 92.5;
const EUR_PER_USD = 0.92;

// Helper to sanitize user object (remove password hash)
function sanitizeUser(user: UserEntity) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// ================= AUTH ROUTES =================

router.post('/auth/register', async (req, res): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля (имя, email, пароль)' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
      return;
    }

    const existing = getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const newUser: UserEntity = {
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      createdAt: new Date().toISOString(),
      balances: {
        USD: 10000,
        RUB: 1000000,
      },
      holdings: [],
      favorites: ['bitcoin', 'ethereum', 'the-open-network', 'notcoin'],
      settings: {
        defaultCurrency: 'USD',
        theme: 'dark',
        notificationsEnabled: true,
      },
    };

    createUser(newUser);

    // Initial demo gift transaction
    addTransaction({
      id: `tx_${now}_welcome`,
      userId,
      type: 'DEPOSIT_DEMO',
      coinId: '',
      coinSymbol: 'USD/RUB',
      coinName: 'Приветственный демо-депозит ($10,000 + 1,000,000 ₽)',
      amount: 1,
      priceUsd: 10000,
      fiatCurrency: 'USD',
      totalUsd: 10000,
      totalFiat: 10000,
      feeUsd: 0,
      timestamp: now,
      status: 'COMPLETED',
    });

    const token = generateToken(userId);
    res.json({
      token,
      user: sanitizeUser(newUser),
      message: 'Регистрация успешна! Вам начислен виртуальный баланс $10,000 и 1,000,000 ₽',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера при регистрации' });
  }
});

router.post('/auth/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Укажите email и пароль' });
      return;
    }

    const user = getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: sanitizeUser(user),
      message: 'Успешный вход в аккаунт',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера при входе' });
  }
});

// Quick 1-click Demo Account Login
router.post('/auth/demo', async (req, res): Promise<void> => {
  try {
    let demoUser = getUserByEmail('demo@cryptopulse.io');
    if (!demoUser) {
      res.status(500).json({ error: 'Демо-аккаунт недоступен' });
      return;
    }

    const token = generateToken(demoUser.id);
    res.json({
      token,
      user: sanitizeUser(demoUser),
      message: 'Вход в демонстрационный аккаунт выполнен успешно',
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка демо-входа' });
  }
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }
  res.json({ user: sanitizeUser(req.user) });
});

// ================= USER SETTINGS & FAVORITES =================

router.patch('/user/settings', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.userId || !req.user) return;

  const { name, defaultCurrency, theme, notificationsEnabled } = req.body;
  const updates: Partial<UserEntity> = {};

  if (name && typeof name === 'string') updates.name = name.trim();
  if (defaultCurrency && ['USD', 'EUR', 'RUB'].includes(defaultCurrency)) {
    updates.settings = { ...req.user.settings, defaultCurrency };
  }
  if (theme && ['dark', 'light'].includes(theme)) {
    updates.settings = { ...req.user.settings, theme };
  }
  if (typeof notificationsEnabled === 'boolean') {
    updates.settings = { ...req.user.settings, notificationsEnabled };
  }

  const updated = updateUser(req.userId, updates);
  if (!updated) {
    res.status(400).json({ error: 'Не удалось обновить профиль' });
    return;
  }

  res.json({ user: sanitizeUser(updated), message: 'Настройки профиля сохранены' });
});

router.post('/user/favorites/toggle', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.userId || !req.user) return;

  const { coinId } = req.body;
  if (!coinId) {
    res.status(400).json({ error: 'Укажите coinId' });
    return;
  }

  let favorites = [...req.user.favorites];
  if (favorites.includes(coinId)) {
    favorites = favorites.filter((id) => id !== coinId);
  } else {
    favorites.push(coinId);
  }

  const updated = updateUser(req.userId, { favorites });
  res.json({ favorites: updated?.favorites || [], message: 'Избранное обновлено' });
});

// ================= VIRTUAL TRADING =================

router.post('/trade/execute', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const user = req.user;
    if (!user || !req.userId) return;

    const {
      side, // 'BUY' | 'SELL'
      coinId,
      coinSymbol,
      coinName,
      amount,
      priceUsd,
      quoteCurrency = 'USD', // 'USD' | 'RUB'
    } = req.body;

    if (!side || !['BUY', 'SELL'].includes(side)) {
      res.status(400).json({ error: 'Некорректная сторона сделки (BUY или SELL)' });
      return;
    }

    const tradeAmount = parseFloat(amount);
    const tradePriceUsd = parseFloat(priceUsd);

    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      res.status(400).json({ error: 'Укажите корректный объем для сделки' });
      return;
    }

    if (isNaN(tradePriceUsd) || tradePriceUsd <= 0) {
      res.status(400).json({ error: 'Некорректная цена актива' });
      return;
    }

    const totalUsd = tradeAmount * tradePriceUsd;
    const fiatMultiplier = quoteCurrency === 'RUB' ? RUB_PER_USD : 1;
    const totalFiat = totalUsd * fiatMultiplier;
    const feeUsd = totalUsd * 0.001; // 0.1% virtual fee
    const feeFiat = feeUsd * fiatMultiplier;

    const currentHoldings = [...user.holdings];
    const holdingIndex = currentHoldings.findIndex((h) => h.coinId === coinId);
    let pnlUsd: number | undefined = undefined;

    if (side === 'BUY') {
      const requiredFiat = totalFiat + feeFiat;
      const userBalance = quoteCurrency === 'RUB' ? user.balances.RUB : user.balances.USD;

      if (userBalance < requiredFiat) {
        res.status(400).json({
          error: `Недостаточно виртуальных средств на ${quoteCurrency} балансе. Требуется: ${requiredFiat.toFixed(2)}, доступно: ${userBalance.toFixed(2)}`,
        });
        return;
      }

      // Deduct balance
      if (quoteCurrency === 'RUB') {
        user.balances.RUB -= requiredFiat;
      } else {
        user.balances.USD -= requiredFiat;
      }

      // Update holdings with weighted average buy price
      if (holdingIndex >= 0) {
        const h = currentHoldings[holdingIndex];
        const newTotalAmount = h.amount + tradeAmount;
        const newTotalCostUsd = h.totalCostUsd + totalUsd;
        currentHoldings[holdingIndex] = {
          ...h,
          amount: newTotalAmount,
          totalCostUsd: newTotalCostUsd,
          averageBuyPriceUsd: newTotalAmount > 0 ? newTotalCostUsd / newTotalAmount : tradePriceUsd,
        };
      } else {
        currentHoldings.push({
          coinId,
          symbol: coinSymbol,
          name: coinName || coinSymbol,
          amount: tradeAmount,
          totalCostUsd: totalUsd,
          averageBuyPriceUsd: tradePriceUsd,
        });
      }
    } else {
      // SELL
      if (holdingIndex < 0 || currentHoldings[holdingIndex].amount < tradeAmount) {
        const available = holdingIndex >= 0 ? currentHoldings[holdingIndex].amount : 0;
        res.status(400).json({
          error: `Недостаточно ${coinSymbol} для продажи. Доступно: ${available}, запрошено: ${tradeAmount}`,
        });
        return;
      }

      const h = currentHoldings[holdingIndex];
      // Realized PnL: (SellPrice - AvgBuyPrice) * Amount - Fee
      pnlUsd = (tradePriceUsd - h.averageBuyPriceUsd) * tradeAmount - feeUsd;

      // Add to balance (proceeds minus fee)
      const proceedsFiat = totalFiat - feeFiat;
      if (quoteCurrency === 'RUB') {
        user.balances.RUB += proceedsFiat;
      } else {
        user.balances.USD += proceedsFiat;
      }

      const remainingAmount = h.amount - tradeAmount;
      if (remainingAmount <= 0.00000001) {
        currentHoldings.splice(holdingIndex, 1);
      } else {
        const costProportion = remainingAmount / h.amount;
        currentHoldings[holdingIndex] = {
          ...h,
          amount: remainingAmount,
          totalCostUsd: h.totalCostUsd * costProportion,
        };
      }
    }

    // Save updated user
    const updatedUser = updateUser(user.id, {
      balances: user.balances,
      holdings: currentHoldings,
    });

    // Record Transaction
    const tx: TransactionEntity = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      type: side,
      coinId,
      coinSymbol,
      coinName: coinName || coinSymbol,
      amount: tradeAmount,
      priceUsd: tradePriceUsd,
      fiatCurrency: quoteCurrency,
      totalUsd,
      totalFiat,
      feeUsd,
      pnlUsd,
      timestamp: Date.now(),
      status: 'COMPLETED',
    };
    addTransaction(tx);

    res.json({
      success: true,
      transaction: tx,
      user: sanitizeUser(updatedUser || user),
      message: `${side === 'BUY' ? 'Покупка' : 'Продажа'} ${tradeAmount} ${coinSymbol} успешно исполнена по $${tradePriceUsd.toLocaleString()}`,
    });
  } catch (error) {
    console.error('Trade execute error:', error);
    res.status(500).json({ error: 'Ошибка исполнения сделки' });
  }
});

// Demo Faucet (+ $5,000 & + 500,000 ₽)
router.post('/trade/faucet', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.userId || !req.user) return;

  const newUsd = req.user.balances.USD + 5000;
  const newRub = req.user.balances.RUB + 500000;

  const updated = updateUser(req.userId, {
    balances: { USD: newUsd, RUB: newRub },
  });

  const tx: TransactionEntity = {
    id: `tx_${Date.now()}_faucet`,
    userId: req.userId,
    type: 'DEPOSIT_DEMO',
    coinId: '',
    coinSymbol: 'FAUCET',
    coinName: 'Пополнение через демо-кран (+$5,000 и +500,000 ₽)',
    amount: 1,
    priceUsd: 5000,
    fiatCurrency: 'USD',
    totalUsd: 5000,
    totalFiat: 5000,
    feeUsd: 0,
    timestamp: Date.now(),
    status: 'COMPLETED',
  };
  addTransaction(tx);

  res.json({
    user: sanitizeUser(updated || req.user),
    message: 'Демо-баланс успешно пополнен на $5,000 и 500,000 ₽!',
  });
});

// Reset portfolio
router.post('/trade/reset', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.userId) return;

  const resetUser = resetDemoAccount(req.userId);
  if (!resetUser) {
    res.status(400).json({ error: 'Не удалось сбросить счет' });
    return;
  }

  res.json({
    user: sanitizeUser(resetUser),
    message: 'Демо-портфель сброшен к исходным $10,000 и 1,000,000 ₽',
  });
});

// Transactions list
router.get('/transactions', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.userId) return;
  const txs = getTransactionsByUserId(req.userId);
  res.json({ transactions: txs });
});

// ================= MARKET CACHE PROXIES =================
let cachedFearGreed: any = null;
let cachedFearGreedTime = 0;

router.get('/market/fear-greed', async (req, res): Promise<void> => {
  const now = Date.now();
  if (cachedFearGreed && now - cachedFearGreedTime < 15 * 60 * 1000) {
    res.json(cachedFearGreed);
    return;
  }

  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    if (response.ok) {
      const data = await response.json();
      if (data?.data?.[0]) {
        const val = parseInt(data.data[0].value, 10);
        let classificationRu = 'Нейтрально (Neutral)';
        if (val >= 75) classificationRu = 'Экстремальная жадность (Extreme Greed)';
        else if (val >= 55) classificationRu = 'Жадность (Greed)';
        else if (val <= 25) classificationRu = 'Экстремальный страх (Extreme Fear)';
        else if (val <= 45) classificationRu = 'Страх (Fear)';

        cachedFearGreed = {
          value: val,
          classification: classificationRu,
          timestamp: data.data[0].timestamp,
        };
        cachedFearGreedTime = now;
        res.json(cachedFearGreed);
        return;
      }
    }
  } catch (e) {
    console.warn('Backend proxy fear-greed fallback');
  }

  res.json({
    value: 72,
    classification: 'Жадность (Greed)',
    timestamp: Math.floor(now / 1000),
  });
});

export default router;
