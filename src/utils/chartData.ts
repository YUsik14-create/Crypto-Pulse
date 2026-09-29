import { CandlePoint, CryptoCoin, TimeFrame } from '../types/crypto';

export function generateChartData(coin: CryptoCoin, timeframe: TimeFrame): CandlePoint[] {
  const currentPrice = coin.priceUsd;
  const change24 = coin.change24h;
  const now = Date.now();
  const points: CandlePoint[] = [];

  let count = 40;
  let intervalMs = 60 * 1000; // 1 min for 1h
  let volatility = 0.003;

  switch (timeframe) {
    case '1h':
      count = 30;
      intervalMs = 2 * 60 * 1000;
      volatility = 0.0015;
      break;
    case '24h':
      count = 48;
      intervalMs = 30 * 60 * 1000;
      volatility = 0.004;
      break;
    case '7d':
      count = 42;
      intervalMs = 4 * 3600 * 1000;
      volatility = 0.012;
      break;
    case '30d':
      count = 45;
      intervalMs = 16 * 3600 * 1000;
      volatility = 0.02;
      break;
    case '1y':
      count = 52;
      intervalMs = 7 * 24 * 3600 * 1000;
      volatility = 0.04;
      break;
  }

  // Calculate approximate start price based on change
  let changePct = change24;
  if (timeframe === '1h') changePct = change24 * 0.12;
  if (timeframe === '7d') changePct = coin.change7d;
  if (timeframe === '30d') changePct = coin.change7d * 2.2;
  if (timeframe === '1y') changePct = coin.change7d * 4.5;

  const startPrice = currentPrice / (1 + changePct / 100);

  // Seed pseudo random based on coin ID and timeframe
  let seed = 0;
  for (let i = 0; i < coin.id.length; i++) {
    seed += coin.id.charCodeAt(i);
  }

  function pseudoRand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  let runningPrice = startPrice;
  const startTime = now - count * intervalMs;

  for (let i = 0; i < count; i++) {
    const timeTimestamp = startTime + i * intervalMs;
    const progress = (i + 1) / count;

    // Trend towards current price at the end
    const targetPrice = startPrice + (currentPrice - startPrice) * progress;
    const randomWave = (pseudoRand() - 0.48) * volatility * runningPrice;
    
    // Smooth magnetic pull to target
    runningPrice = runningPrice * 0.7 + targetPrice * 0.3 + randomWave;

    if (i === count - 1) {
      runningPrice = currentPrice;
    }

    const candleOpen = i === 0 ? startPrice : points[i - 1].close;
    const candleClose = runningPrice;
    const maxVal = Math.max(candleOpen, candleClose);
    const minVal = Math.min(candleOpen, candleClose);

    const candleHigh = maxVal + pseudoRand() * volatility * 0.8 * runningPrice;
    const candleLow = Math.max(minVal * 0.5, minVal - pseudoRand() * volatility * 0.8 * runningPrice);

    const volumeBase = coin.volume24hUsd / (48 * currentPrice);
    const candleVolume = volumeBase * (0.6 + pseudoRand() * 0.8);

    const dateObj = new Date(timeTimestamp);
    let timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (timeframe === '7d' || timeframe === '30d') {
      timeStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } else if (timeframe === '1y') {
      timeStr = dateObj.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
    }

    points.push({
      time: timeStr,
      timestamp: timeTimestamp,
      open: candleOpen,
      high: candleHigh,
      low: candleLow,
      close: candleClose,
      volume: candleVolume,
    });
  }

  return points;
}
