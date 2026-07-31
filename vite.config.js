import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (not 'autoUpdate') deliberately -- staff leave this screen
      // open all shift (see TablesPage.jsx's polling comment), so a new
      // deploy shouldn't force-reload mid-order. registerSW() below prompts
      // instead, and only reloads on staff's own click.
      registerType: 'prompt',
      manifest: {
        name: 'Lavanya POS',
        short_name: 'Lavanya POS',
        description: 'Lavanya Plaza billing & KOT point-of-sale',
        theme_color: '#2B3A55',
        background_color: '#F7F5F0',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/logo_192.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo_512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      // No runtimeCaching entries for the API on purpose -- it lives on a
      // separate origin (VITE_API_BASE_URL) and the service worker only
      // precaches this app's own built JS/CSS/HTML/icons, so every API call
      // still always hits the network live. Caching API responses here would
      // undo the admin-panel data-freshness fixes made earlier.
      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
