import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// This config runs in Node; declare the one global we read so tsc is happy
// without pulling in @types/node for the whole web workspace.
declare const process: { env: Record<string, string | undefined> };

// Supabase is tree-shaken out entirely when sync is off (SYNC_ENABLED becomes
// a compile-time false, so `createClient` is dead code). Only carve it into its
// own chunk when it will actually be bundled, so the sync-off build doesn't
// emit a stray empty chunk.
const SYNC_ON = process.env.VITE_SYNC_ENABLED === 'true';

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
      workbox: {
        // The generated species-data chunk crossed workbox's default 2 MiB
        // precache cap when the SwSh DLC pushed it to 859 species. The app
        // is local-first — species data must precache for offline — so
        // raise the cap rather than dropping the asset.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split large, independently-cacheable deps and generated data into
        // their own chunks. This is pure build config — no app-code change.
        // It takes the app-code chunk from ~2.8 MB down to ~150 kB: a code
        // change no longer re-downloads the huge, stable species-data or
        // game-dataset blobs from users' HTTP cache. The generated 2 MB
        // species-data.json is still one chunk over the 500 kB warning limit;
        // splitting it further would mean editing lib/speciesData.ts (owned
        // elsewhere / regenerating the dataset), so it's left as a follow-up.
        manualChunks(id) {
          // The 2 MB generated PokeAPI species dump dominates the bundle.
          // It changes only when datasets are regenerated, so isolate it.
          if (id.includes('generated/species-data.json')) return 'species-data';
          // Per-game encounter/trainer/map JSON — one chunk for all game data.
          if (id.includes('datasets/games/') && id.endsWith('.json')) return 'game-data';
          // Other generated data (species lines, machines) — small but stable.
          if (id.includes('datasets/generated/') && id.endsWith('.json')) return 'dataset-meta';
          if (id.includes('node_modules')) {
            if (SYNC_ON && id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
