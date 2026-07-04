import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// This config runs in Node; declare the one global we read so tsc is happy
// without pulling in @types/node for the whole web workspace.
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  server: {
    // Honor a harness-assigned port (PORT env) so multiple dev servers can
    // coexist; fall back to Vite's default 5173 for normal local dev.
    port: Number(process.env.PORT) || 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Nuzlocke Tracker',
        short_name: 'Nuzlocke',
        description: 'Multi-game Pokémon nuzlocke run tracker',
        theme_color: '#161b22',
        background_color: '#161b22',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
});
