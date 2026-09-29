import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { User, PortfolioItem, Transaction, TradeRequest, NotificationToast } from '../types/user';
import {
  auth,
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  logoutUser,
  ensureUserProfile,
  fetchUserPortfolio,
  fetchUserTransactions,
  executeFirestoreTrade,
  resetFirestoreBalance,
  depositFirestoreBalance,
  toggleFirestoreFavorite,
  updateFirestoreProfile,
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  portfolio: PortfolioItem[];
  transactions: Transaction[];
  isLoading: boolean;
  toasts: NotificationToast[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
  loginWithGoogle: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  executeTrade: (trade: TradeRequest) => Promise<boolean>;
  resetBalance: () => Promise<void>;
  depositBalance: (amount: number, currency: 'USD' | 'RUB') => Promise<void>;
  toggleFavorite: (coinId: string) => Promise<string[]>;
  updateProfile: (name: string, avatar?: string, password?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: NotificationToast = { id, type, title, message, timestamp: Date.now() };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Reload user's data from Firestore
  const refreshUserData = useCallback(async () => {
    if (!firebaseUser) {
      return;
    }

    try {
      const [u, p, tx] = await Promise.all([
        ensureUserProfile(firebaseUser),
        fetchUserPortfolio(firebaseUser.uid),
        fetchUserTransactions(firebaseUser.uid),
      ]);
      setUser(u);
      setPortfolio(p);
      setTransactions(tx);
    } catch (err: any) {
      console.warn('Error refreshing Firestore data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await ensureUserProfile(fbUser);
          setUser(profile);
          const [port, txs] = await Promise.all([
            fetchUserPortfolio(fbUser.uid),
            fetchUserTransactions(fbUser.uid),
          ]);
          setPortfolio(port);
          setTransactions(txs);
        } catch (err: any) {
          console.error('Error loading Firestore profile:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // If not logged in, provide an initial guest demo user with $50k USD and 4.5M RUB
        const localUser: User = {
          id: 'demo-user',
          email: 'demo@cryptopulse.io',
          name: 'Демо Трейдер',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          balances: { USD: 50000, RUB: 4500000 },
          favorites: ['bitcoin', 'ethereum', 'the-open-network', 'solana'],
          createdAt: new Date().toISOString(),
        };
        setUser(localUser);
        setPortfolio([
          {
            id: 'demo-btc',
            userId: 'demo-user',
            coinId: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            amount: 0.35,
            averageBuyPriceUsd: 87500,
            totalCostUsd: 30625,
          },
          {
            id: 'demo-ton',
            userId: 'demo-user',
            coinId: 'the-open-network',
            symbol: 'TON',
            name: 'Toncoin',
            amount: 500,
            averageBuyPriceUsd: 3.2,
            totalCostUsd: 1600,
          },
        ]);
        setTransactions([
          {
            id: 'demo-tx-1',
            userId: 'demo-user',
            type: 'BUY',
            coinId: 'bitcoin',
            symbol: 'BTC',
            name: 'Bitcoin',
            amount: 0.35,
            priceFiat: 87500,
            totalFiat: 30625,
            fiatCurrency: 'USD',
            timestamp: Date.now() - 3600000 * 24 * 2,
            status: 'COMPLETED',
          },
        ]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const u = await signInWithGoogle();
      setUser(u);
      addToast('success', 'Вход выполнен', `Добро пожаловать через Google, ${u.name}!`);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      addToast('error', 'Ошибка Google Входа', err.message || 'Не удалось войти через Google');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const u = await signInWithEmail(email, pass);
      setUser(u);
      addToast('success', 'Вход выполнен', `С возвращением, ${u.name}! Данные синхронизированы с Firestore.`);
    } catch (err: any) {
      let msg = err.message || 'Ошибка входа';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Неверный email или пароль';
      }
      addToast('error', 'Ошибка входа', msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const u = await registerWithEmail(name, email, pass);
      setUser(u);
      addToast(
        'success',
        'Аккаунт создан в Firebase!',
        'Вам начислен стартовый демо-баланс $50,000 USD и 4,500,000 RUB в Firestore.'
      );
    } catch (err: any) {
      let msg = err.message || 'Ошибка регистрации';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Этот email уже зарегистрирован. Попробуйте войти.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Пароль слишком простой (минимум 6 символов).';
      }
      addToast('error', 'Ошибка регистрации', msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async () => {
    // Fast guest demo login
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        await logoutUser();
      }
      addToast('info', 'Демо-режим активен', 'Вы используете демонстрационный портфель с балансом $50k / 4.5M ₽.');
    } catch (err: any) {
      addToast('error', 'Ошибка', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await logoutUser();
      }
      addToast('info', 'Выход', 'Вы вышли из системы');
    } catch (err: any) {
      console.warn('Logout error', err);
    }
  };

  const executeTrade = async (trade: TradeRequest): Promise<boolean> => {
    if (!user) {
      addToast('error', 'Авторизация', 'Для совершения сделки необходимо войти в аккаунт');
      return false;
    }

    try {
      if (firebaseUser) {
        // Persist to Cloud Firestore in real-time
        const result = await executeFirestoreTrade(firebaseUser.uid, user, trade);
        setUser(result.user);
        setPortfolio(result.portfolio);
        addToast('success', trade.type === 'BUY' ? 'Покупка исполнена' : 'Продажа исполнена', result.message);
        const txs = await fetchUserTransactions(firebaseUser.uid);
        setTransactions(txs);
        return true;
      } else {
        // Local simulation for guest mode
        const rate = 92.5;
        const priceFiat = trade.fiatCurrency === 'RUB' ? trade.currentPriceUsd * rate : trade.currentPriceUsd;
        const totalFiat = trade.amount * priceFiat;

        if (trade.type === 'BUY' && (user.balances[trade.fiatCurrency] || 0) < totalFiat) {
          throw new Error('Недостаточно средств на виртуальном балансе');
        }

        const newBalances = { ...user.balances };
        if (trade.type === 'BUY') {
          newBalances[trade.fiatCurrency] -= totalFiat;
        } else {
          newBalances[trade.fiatCurrency] += totalFiat;
        }

        const updatedUser = { ...user, balances: newBalances };
        setUser(updatedUser);

        // Update local portfolio
        const p = [...portfolio];
        const idx = p.findIndex((item) => item.coinId === trade.coinId);
        if (trade.type === 'BUY') {
          if (idx >= 0) {
            const cur = p[idx];
            const newAmt = cur.amount + trade.amount;
            const newCost = cur.totalCostUsd + trade.amount * trade.currentPriceUsd;
            p[idx] = {
              ...cur,
              amount: newAmt,
              averageBuyPriceUsd: newCost / newAmt,
              totalCostUsd: newCost,
            };
          } else {
            p.push({
              id: trade.coinId,
              userId: user.id,
              coinId: trade.coinId,
              symbol: trade.symbol,
              name: trade.name,
              amount: trade.amount,
              averageBuyPriceUsd: trade.currentPriceUsd,
              totalCostUsd: trade.amount * trade.currentPriceUsd,
            });
          }
        } else {
          if (idx >= 0) {
            if (p[idx].amount <= trade.amount) {
              p.splice(idx, 1);
            } else {
              p[idx].amount -= trade.amount;
            }
          }
        }
        setPortfolio(p);

        const newTx: Transaction = {
          id: `tx_${Date.now()}`,
          userId: user.id,
          type: trade.type,
          coinId: trade.coinId,
          symbol: trade.symbol,
          name: trade.name,
          amount: trade.amount,
          priceFiat,
          totalFiat,
          fiatCurrency: trade.fiatCurrency,
          timestamp: Date.now(),
          status: 'COMPLETED',
        };
        setTransactions((prev) => [newTx, ...prev]);

        addToast(
          'success',
          trade.type === 'BUY' ? 'Покупка исполнена' : 'Продажа исполнена',
          `${trade.type === 'BUY' ? 'Куплено' : 'Продано'} ${trade.amount} ${trade.symbol}`
        );
        return true;
      }
    } catch (err: any) {
      addToast('error', 'Ошибка сделки', err.message || 'Не удалось совершить сделку');
      return false;
    }
  };

  const resetBalance = async () => {
    if (!user) return;
    try {
      if (firebaseUser) {
        const u = await resetFirestoreBalance(firebaseUser.uid, user);
        setUser(u);
        setPortfolio([]);
        const txs = await fetchUserTransactions(firebaseUser.uid);
        setTransactions(txs);
      } else {
        setUser({
          ...user,
          balances: { USD: 50000, RUB: 4500000 },
        });
        setPortfolio([]);
      }
      addToast('success', 'Баланс сброшен', 'Демо-счет сброшен до стартовых $50,000 USD и 4,500,000 RUB');
    } catch (err: any) {
      addToast('error', 'Ошибка', err.message);
    }
  };

  const depositBalance = async (amount: number, currency: 'USD' | 'RUB') => {
    if (!user) return;
    try {
      if (firebaseUser) {
        const u = await depositFirestoreBalance(firebaseUser.uid, user, amount, currency);
        setUser(u);
        const txs = await fetchUserTransactions(firebaseUser.uid);
        setTransactions(txs);
      } else {
        const b = { ...user.balances };
        b[currency] = (b[currency] || 0) + amount;
        setUser({ ...user, balances: b });
      }
      addToast('success', 'Счет пополнен', `+${amount.toLocaleString()} ${currency} добавлено на баланс`);
    } catch (err: any) {
      addToast('error', 'Ошибка', err.message);
    }
  };

  const toggleFavorite = async (coinId: string): Promise<string[]> => {
    if (!user) return [];
    try {
      if (firebaseUser) {
        const favs = await toggleFirestoreFavorite(firebaseUser.uid, user, coinId);
        setUser({ ...user, favorites: favs });
        return favs;
      } else {
        const exists = user.favorites.includes(coinId);
        const favs = exists ? user.favorites.filter((id) => id !== coinId) : [...user.favorites, coinId];
        setUser({ ...user, favorites: favs });
        return favs;
      }
    } catch {
      return user.favorites;
    }
  };

  const updateProfile = async (name: string, avatar?: string, _password?: string) => {
    if (!user) return;
    try {
      if (firebaseUser) {
        const u = await updateFirestoreProfile(firebaseUser.uid, user, { name, avatar });
        setUser(u);
      } else {
        setUser({
          ...user,
          name,
          avatar: avatar || user.avatar,
        });
      }
      addToast('success', 'Профиль обновлен', 'Данные сохранены в Firebase');
    } catch (err: any) {
      addToast('error', 'Ошибка', err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        portfolio,
        transactions,
        isLoading,
        toasts,
        addToast,
        removeToast,
        loginWithGoogle: handleGoogleLogin,
        login,
        register,
        loginDemo,
        logout,
        refreshUserData,
        executeTrade,
        resetBalance,
        depositBalance,
        toggleFavorite,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
