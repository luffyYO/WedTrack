import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname equivalent
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    // Explicitly declare the output directory (Vite default is 'dist', but
    // being explicit prevents any ambiguity during Vercel's build step).
    outDir: 'dist',
    // Raise warning threshold slightly — main app chunk may still be large.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into separate cacheable chunks.
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui':       ['lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-axios':    ['axios'],
          'vendor-zustand':  ['zustand'],
        },
      },
    },
  },
  // ── Local development only ────────────────────────────────────────────────
  // This block is ignored entirely by `vite build` (production).
  // host: '0.0.0.0' allows phone access on the same Wi-Fi for QR scanning.
  server: {
    host: '0.0.0.0',
    port: 3000,
    // NOTE: `open: true` removed — it breaks CI/build environments where
    // there is no browser available. Run `npm run dev` locally to auto-open.
  },
  css: {
    transformer: "postcss", // 🔥 THIS FIXES YOUR ERROR
  },
});

