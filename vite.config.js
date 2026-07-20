import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Build pipeline: Vite 7 + Rollup (see AGENTS.md). There is no compile_commands.json
// or CMake in this repo — WASM/toolchain work would add its own build step separately.

const LAZY_VENDOR_CHUNKS = /vendor-force-graph|vendor-three|MatrixRain|SystemMap|SystemConstellation|HoloTerminal|OmniPalette|Screensaver|ShortcutCheatsheet|LoadoutsBootstrap|LoadoutPanel|loadoutCodec|loadoutIds/

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg', 'pwa/**/*', 'images/**/*'],
      manifest: {
        name: '1ink Command Center',
        short_name: '1ink CC',
        description: 'Browse the go.1ink.us project catalog offline. External apps open when online.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'any',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: '/pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif,woff2,json}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/images\/.+\.(?:webp|avif|png|jpe?g|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'catalog-images',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-shell',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    {
      name: 'add-css-charset',
      transformIndexHtml(html) {
        return html.replace(
          /<link rel="stylesheet"/g,
          '<link rel="stylesheet" charset="utf-8"'
        );
      }
    }
  ],
  server: {
    strictPort: true,
    host: true,
  },
  preview: {
    strictPort: true,
    host: true,
  },
  build: {
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,
    modulePreload: {
      resolveDependencies(_filename, deps) {
        // Keep heavy on-demand views off the critical path
        return deps.filter((dep) => !LAZY_VENDOR_CHUNKS.test(dep));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('three') || id.includes('@react-three')) {
            return 'vendor-three';
          }
          // force-graph stays in the lazy SystemMap chunk (no manual split)
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('react-dom') || id.includes('/react/')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion'],
  },
})
