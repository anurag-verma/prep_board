/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: (filePath) => {
      // Never inline fonts as base64 data: URIs — the CSP's `font-src 'self'`
      // (no `data:`) would then block Vite's default <4KB inlining, which
      // silently breaks several @fontsource subset files (many are tiny).
      // Keeping every font a real same-origin file avoids loosening the CSP.
      if (/\.(woff2?|ttf|eot)$/.test(filePath)) return false;
      return undefined; // fall back to Vite's default (4096 bytes) for everything else
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
