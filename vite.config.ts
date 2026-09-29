/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  server: {
    hmr: false,
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      // Локальный прокси для обхода CORS и блокировок CoinGecko / Binance в РФ при необходимости
      '/proxy/coingecko': {
        target: 'https://api.coingecko.com/api/v3',
        changeOrigin: true,
        rewrite: (pathStr) => pathStr.replace(/^\/proxy\/coingecko/, ''),
      },
      '/proxy/binance': {
        target: 'https://api.binance.com/api/v3',
        changeOrigin: true,
        rewrite: (pathStr) => pathStr.replace(/^\/proxy\/binance/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
