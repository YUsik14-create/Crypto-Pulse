import { useEffect, useRef, useState } from 'react';
import { ConnectionStatus, TickerUpdate } from '../types/crypto';

interface UseWebSocketOptions {
  onTickerUpdates: (updates: Record<string, TickerUpdate>) => void;
  symbols: string[];
}

export function useWebSocket({ onTickerUpdates, symbols }: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const onTickerUpdatesRef = useRef(onTickerUpdates);
  onTickerUpdatesRef.current = onTickerUpdates;

  useEffect(() => {
    isMountedRef.current = true;
    let fallbackInterval: any = null;

    function connect() {
      if (!isMountedRef.current) return;

      try {
        setStatus('connecting');

        // Using Binance miniTicker array stream for ultra efficient all-in-one updates
        // Fallback multi-stream if needed
        const streams = symbols.map(s => `${s.toLowerCase()}@miniTicker`).join('/');
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setStatus('connected');
          if (fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const message = JSON.parse(event.data);
            const data = message.data;

            if (data && data.s && data.c) {
              const symbol = data.s;
              const price = parseFloat(data.c);
              const open = parseFloat(data.o);
              const high = parseFloat(data.h);
              const low = parseFloat(data.l);
              const volume = parseFloat(data.q);
              const change24h = open > 0 ? ((price - open) / open) * 100 : 0;

              onTickerUpdatesRef.current({
                [symbol]: {
                  symbol,
                  price,
                  change24h,
                  high24h: high,
                  low24h: low,
                  volume24h: volume,
                },
              });
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };

        ws.onerror = () => {
          // Will trigger ws.onclose
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setStatus('polling');
          // Try reconnecting in 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        };
      } catch (err) {
        setStatus('polling');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      }
    }

    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (fallbackInterval) clearInterval(fallbackInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbols]);

  return { status };
}
