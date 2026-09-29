import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseAuthProfile,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, PortfolioItem, Transaction, TradeRequest } from '../types/user';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore (with custom databaseId if configured)
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80';

/**
 * Ensures a user profile exists in Firestore. If new, populates default balances and initial state.
 */
export async function ensureUserProfile(fbUser: FirebaseUser): Promise<User> {
  const userRef = doc(db, 'users', fbUser.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      id: fbUser.uid,
      email: fbUser.email || data.email || '',
      name: data.name || fbUser.displayName || 'Трейдер',
      avatar: data.avatar || fbUser.photoURL || DEFAULT_AVATAR,
      balances: data.balances || { USD: 50000, RUB: 4500000 },
      favorites: data.favorites || ['bitcoin', 'ethereum', 'the-open-network', 'solana'],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  // First time user: create profile document with $50,000 USD and 4,500,000 RUB
  const nowIso = new Date().toISOString();
  const newUser: User = {
    id: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || 'Трейдер',
    avatar: fbUser.photoURL || DEFAULT_AVATAR,
    balances: {
      USD: 50000,
      RUB: 4500000,
    },
    favorites: ['bitcoin', 'ethereum', 'the-open-network', 'solana'],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  await setDoc(userRef, {
    uid: fbUser.uid,
    email: newUser.email,
    name: newUser.name,
    avatar: newUser.avatar,
    balances: newUser.balances,
    favorites: newUser.favorites,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt,
  });

  return newUser;
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return await ensureUserProfile(result.user);
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return await ensureUserProfile(result.user);
}

/**
 * Register with Email and Password
 */
export async function registerWithEmail(name: string, email: string, pass: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name.trim()) {
    await updateFirebaseAuthProfile(result.user, { displayName: name.trim() });
  }
  return await ensureUserProfile(result.user);
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Load user's portfolio items from Firestore subcollection
 */
export async function fetchUserPortfolio(uid: string): Promise<PortfolioItem[]> {
  const portRef = collection(db, 'users', uid, 'portfolio');
  const snap = await getDocs(portRef);
  const items: PortfolioItem[] = [];

  snap.forEach((docItem) => {
    const data = docItem.data();
    items.push({
      id: docItem.id,
      userId: uid,
      coinId: data.coinId,
      symbol: data.symbol,
      name: data.name,
      amount: data.amount,
      averageBuyPriceUsd: data.averageBuyPriceUsd,
      totalCostUsd: data.totalCostUsd,
    });
  });

  return items;
}

/**
 * Load user's transaction history from Firestore subcollection
 */
export async function fetchUserTransactions(uid: string): Promise<Transaction[]> {
  const txRef = collection(db, 'users', uid, 'transactions');
  const q = query(txRef, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  const list: Transaction[] = [];

  snap.forEach((docItem) => {
    const data = docItem.data();
    list.push({
      id: docItem.id,
      userId: uid,
      type: data.type,
      coinId: data.coinId,
      symbol: data.symbol,
      name: data.name,
      amount: data.amount,
      priceFiat: data.priceFiat,
      totalFiat: data.totalFiat,
      fiatCurrency: data.fiatCurrency || 'USD',
      timestamp: data.timestamp,
      status: 'COMPLETED',
      note: data.note,
    });
  });

  return list;
}

/**
 * Execute a simulated trade and persist changes atomically to Firestore
 */
export async function executeFirestoreTrade(
  uid: string,
  user: User,
  trade: TradeRequest
): Promise<{ success: boolean; user: User; portfolio: PortfolioItem[]; message: string }> {
  const { coinId, symbol, name, type, amount, fiatCurrency, currentPriceUsd } = trade;

  if (amount <= 0 || currentPriceUsd <= 0) {
    throw new Error('Некорректное количество или цена для ордера');
  }

  const rateUsdToRub = 92.5;
  const priceFiat = fiatCurrency === 'RUB' ? currentPriceUsd * rateUsdToRub : currentPriceUsd;
  const totalCostFiat = amount * priceFiat;

  // Clone balances
  const balances = { ...user.balances };

  // Fetch current portfolio
  const currentPortfolio = await fetchUserPortfolio(uid);
  const existingIdx = currentPortfolio.findIndex((item) => item.coinId === coinId);
  const existingItem = existingIdx >= 0 ? currentPortfolio[existingIdx] : null;

  if (type === 'BUY') {
    const currentBalance = balances[fiatCurrency] || 0;
    if (currentBalance < totalCostFiat) {
      throw new Error(
        `Недостаточно средств. Требуется: ${totalCostFiat.toFixed(2)} ${fiatCurrency}, доступно: ${currentBalance.toFixed(2)} ${fiatCurrency}`
      );
    }

    balances[fiatCurrency] -= totalCostFiat;

    let updatedItem: PortfolioItem;
    if (existingItem) {
      const newAmount = existingItem.amount + amount;
      const newTotalCostUsd = existingItem.totalCostUsd + amount * currentPriceUsd;
      const newAveragePrice = newAmount > 0 ? newTotalCostUsd / newAmount : currentPriceUsd;

      updatedItem = {
        ...existingItem,
        amount: newAmount,
        averageBuyPriceUsd: newAveragePrice,
        totalCostUsd: newTotalCostUsd,
      };
      currentPortfolio[existingIdx] = updatedItem;
    } else {
      updatedItem = {
        id: coinId,
        userId: uid,
        coinId,
        symbol,
        name,
        amount,
        averageBuyPriceUsd: currentPriceUsd,
        totalCostUsd: amount * currentPriceUsd,
      };
      currentPortfolio.push(updatedItem);
    }

    // Persist portfolio item to Firestore
    const itemRef = doc(db, 'users', uid, 'portfolio', coinId);
    await setDoc(itemRef, updatedItem);
  } else if (type === 'SELL') {
    if (!existingItem || existingItem.amount < amount) {
      throw new Error(
        `Недостаточно монет для продажи. Доступно: ${existingItem ? existingItem.amount : 0} ${symbol}`
      );
    }

    balances[fiatCurrency] += totalCostFiat;
    const remainingAmount = existingItem.amount - amount;

    if (remainingAmount <= 0.000001) {
      currentPortfolio.splice(existingIdx, 1);
      const itemRef = doc(db, 'users', uid, 'portfolio', coinId);
      await deleteDoc(itemRef);
    } else {
      const remainingCostRatio = remainingAmount / existingItem.amount;
      const updatedItem: PortfolioItem = {
        ...existingItem,
        amount: remainingAmount,
        totalCostUsd: existingItem.totalCostUsd * remainingCostRatio,
      };
      currentPortfolio[existingIdx] = updatedItem;
      const itemRef = doc(db, 'users', uid, 'portfolio', coinId);
      await setDoc(itemRef, updatedItem);
    }
  }

  // Update user balances in Firestore
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    balances,
    updatedAt: new Date().toISOString(),
  });

  // Record transaction in Firestore
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newTx: Transaction = {
    id: txId,
    userId: uid,
    type,
    coinId,
    symbol,
    name,
    amount,
    priceFiat,
    totalFiat: totalCostFiat,
    fiatCurrency,
    timestamp: Date.now(),
    status: 'COMPLETED',
  };

  const txDocRef = doc(db, 'users', uid, 'transactions', txId);
  await setDoc(txDocRef, newTx);

  const updatedUser: User = {
    ...user,
    balances,
  };

  const actionText = type === 'BUY' ? 'Куплено' : 'Продано';
  return {
    success: true,
    user: updatedUser,
    portfolio: currentPortfolio,
    message: `${actionText} ${amount} ${symbol} за ${totalCostFiat.toFixed(2)} ${fiatCurrency}`,
  };
}

/**
 * Reset balances and clear portfolio
 */
export async function resetFirestoreBalance(uid: string, user: User): Promise<User> {
  const initialBalances = { USD: 50000, RUB: 4500000 };

  // Delete all items from portfolio subcollection
  const portRef = collection(db, 'users', uid, 'portfolio');
  const portSnap = await getDocs(portRef);
  const deletePromises = portSnap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);

  // Update user document
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    balances: initialBalances,
    updatedAt: new Date().toISOString(),
  });

  // Record reset transaction
  const txId = `tx_${Date.now()}_reset`;
  const resetTx: Transaction = {
    id: txId,
    userId: uid,
    type: 'RESET',
    totalFiat: 0,
    fiatCurrency: 'USD',
    timestamp: Date.now(),
    status: 'COMPLETED',
    note: 'Сброс демо-баланса до начальных $50,000 USD и 4,500,000 RUB',
  };
  await setDoc(doc(db, 'users', uid, 'transactions', txId), resetTx);

  return {
    ...user,
    balances: initialBalances,
  };
}

/**
 * Deposit demo funds
 */
export async function depositFirestoreBalance(
  uid: string,
  user: User,
  amount: number,
  currency: 'USD' | 'RUB'
): Promise<User> {
  const balances = { ...user.balances };
  balances[currency] = (balances[currency] || 0) + amount;

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    balances,
    updatedAt: new Date().toISOString(),
  });

  const txId = `tx_${Date.now()}_dep`;
  const depTx: Transaction = {
    id: txId,
    userId: uid,
    type: 'DEPOSIT',
    totalFiat: amount,
    fiatCurrency: currency,
    timestamp: Date.now(),
    status: 'COMPLETED',
    note: `Пополнение демо-счета на +${amount.toLocaleString()} ${currency}`,
  };
  await setDoc(doc(db, 'users', uid, 'transactions', txId), depTx);

  return {
    ...user,
    balances,
  };
}

/**
 * Toggle favorite coin in Firestore
 */
export async function toggleFirestoreFavorite(uid: string, user: User, coinId: string): Promise<string[]> {
  const exists = user.favorites.includes(coinId);
  const newFavorites = exists
    ? user.favorites.filter((id) => id !== coinId)
    : [...user.favorites, coinId];

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    favorites: newFavorites,
    updatedAt: new Date().toISOString(),
  });

  return newFavorites;
}

/**
 * Update user profile (name, avatar) in Firestore
 */
export async function updateFirestoreProfile(
  uid: string,
  user: User,
  data: { name?: string; avatar?: string }
): Promise<User> {
  const updates: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };
  if (data.name) updates.name = data.name;
  if (data.avatar) updates.avatar = data.avatar;

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, updates);

  return {
    ...user,
    ...data,
  };
}
