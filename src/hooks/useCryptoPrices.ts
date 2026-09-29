import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { INITIAL_COINS, INITIAL_MARKET_OVERVIEW } from '../data/initialCoins';
import { fetchBinanceTickers, fetchFearAndGreed } from '../services/api';
import {
  CryptoCoin,
  Currency,
  FilterCategory,
  MarketOverviewData,
  SortDirection,
  SortField,
  TickerUpdate,
} from '../types/crypto';
import { useWebSocket } from './useWebSocket';

export function useCryptoPrices() {
  const [coins, setCoins] = useState<CryptoCoin[]>(INITIAL_COINS);
  const [marketOverview, setMarketOverview] = useState<MarketOverviewData>(INITIAL_MARKET_OVERVIEW);
  const [currency, setCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('crypto_currency') as Currency) || 'USD';
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('crypto_favorites');
      return stored ? JSON.parse(stored) : ['bitcoin', 'ethereum', 'the-open-network', 'notcoin'];
    } catch {
      return ['bitcoin', 'ethereum', 'the-open-network', 'notcoin'];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [priceFlashes, setPriceFlashes] = useState<Record<string, 'up' | 'down'>>({});
  const flashTimeoutsRef = useRef<Record<string, any>>({});

  // Persist currency
  useEffect(() => {
    localStorage.setItem('crypto_currency', currency);
  }, [currency]);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem('crypto_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((coinId: string) => {
    setFavorites((prev) =>
      prev.includes(coinId) ? prev.filter((id) => id !== coinId) : [...prev, coinId]
    );
  }, []);

  // Flash animation handler
  const triggerFlash = useCallback((coinId: string, direction: 'up' | 'down') => {
    if (flashTimeoutsRef.current[coinId]) {
      clearTimeout(flashTimeoutsRef.current[coinId]);
    }
    setPriceFlashes((prev) => ({ ...prev, [coinId]: direction }));
    flashTimeoutsRef.current[coinId] = setTimeout(() => {
      setPriceFlashes((prev) => {
        const next = { ...prev };
        delete next[coinId];
        return next;
      });
    }, 900);
  }, []);

  // Update coins with ticker updates
  const applyTickerUpdates = useCallback(
    (updates: Record<string, TickerUpdate>) => {
      setCoins((prevCoins) =>
        prevCoins.map((coin) => {
          const update = updates[coin.binanceSymbol];
          if (!update || !update.price) return coin;

          const oldPrice = coin.priceUsd;
          const newPrice = update.price;

          if (Math.abs(oldPrice - newPrice) > 0.0000001) {
            triggerFlash(coin.id, newPrice > oldPrice ? 'up' : 'down');
          }

          // Update sparkline if price changed
          let updatedSparkline = [...coin.sparkline];
          if (updatedSparkline.length > 0) {
            updatedSparkline[updatedSparkline.length - 1] = newPrice;
          }

          const newMarketCap = coin.circulatingSupply * newPrice;

          return {
            ...coin,
            priceUsd: newPrice,
            change24h: update.change24h !== undefined ? update.change24h : coin.change24h,
            high24hUsd: update.high24h !== undefined && update.high24h > 0 ? update.high24h : coin.high24hUsd,
            low24hUsd: update.low24h !== undefined && update.low24h > 0 ? update.low24h : coin.low24hUsd,
            volume24hUsd: update.volume24h !== undefined && update.volume24h > 0 ? update.volume24h : coin.volume24hUsd,
            marketCapUsd: newMarketCap > 0 ? newMarketCap : coin.marketCapUsd,
            sparkline: updatedSparkline,
            lastUpdated: Date.now(),
          };
        })
      );
    },
    [triggerFlash]
  );

  // Subscribe to Binance WebSocket
  const symbols = useMemo(() => coins.map((c) => c.binanceSymbol), []);
  const { status: wsStatus } = useWebSocket({
    symbols,
    onTickerUpdates: applyTickerUpdates,
  });

  // REST polling fallback & synchronization every 8 seconds
  useEffect(() => {
    let isCancelled = false;

    async function syncPrices() {
      const updates = await fetchBinanceTickers();
      if (!isCancelled && Object.keys(updates).length > 0) {
        applyTickerUpdates(updates);
      }
    }

    // Immediate first fetch
    syncPrices();

    const interval = setInterval(syncPrices, 8000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [applyTickerUpdates]);

  // Fetch Fear & Greed index on mount and periodically
  useEffect(() => {
    fetchFearAndGreed().then((res) => {
      if (res) {
        setMarketOverview((prev) => ({
          ...prev,
          fearGreedIndex: res.value,
          fearGreedClassification: res.classification,
        }));
      }
    });
  }, []);

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'rank' || field === 'name' ? 'asc' : 'desc');
    }
  };

  // Filter & Sort coins
  const filteredAndSortedCoins = useMemo(() => {
    return coins
      .filter((coin) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = coin.name.toLowerCase().includes(q);
          const matchSymbol = coin.symbol.toLowerCase().includes(q);
          if (!matchName && !matchSymbol) return false;
        }

        // Category filter
        switch (activeCategory) {
          case 'favorites':
            return favorites.includes(coin.id);
          case 'top10':
            return coin.rank <= 10;
          case 'gainers':
            return coin.change24h > 3;
          case 'losers':
            return coin.change24h < 0;
          case 'ecosystem_ton':
            return coin.symbol === 'TON' || coin.symbol === 'NOT';
          default:
            return true;
        }
      })
      .sort((a, b) => {
        let valA: any = a.rank;
        let valB: any = b.rank;

        switch (sortField) {
          case 'rank':
            valA = a.rank;
            valB = b.rank;
            break;
          case 'name':
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
            break;
          case 'price':
            valA = a.priceUsd;
            valB = b.priceUsd;
            break;
          case 'change24h':
            valA = a.change24h;
            valB = b.change24h;
            break;
          case 'change7d':
            valA = a.change7d;
            valB = b.change7d;
            break;
          case 'volume24h':
            valA = a.volume24hUsd;
            valB = b.volume24hUsd;
            break;
          case 'marketCap':
            valA = a.marketCapUsd;
            valB = b.marketCapUsd;
            break;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [coins, searchQuery, activeCategory, favorites, sortField, sortDirection]);

  return {
    coins,
    displayCoins: filteredAndSortedCoins,
    marketOverview,
    currency,
    setCurrency,
    favorites,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    sortField,
    sortDirection,
    handleSort,
    priceFlashes,
    wsStatus,
  };
}
