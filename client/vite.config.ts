import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
      manifest: {
        name: 'ESO Auditing System',
        short_name: 'ESO Audit',
        description: 'ESO Obligations and Clearance Management System',
        theme_color: '#c2410c',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB — background image is ~2.9 MB
        // Cache the app shell and static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        // Don't cache API calls
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],
        runtimeCaching: [
          {
            urlPattern: /^\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      devOptions: {
        // Enable PWA in dev so you can test install prompt locally
        enabled: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    proxy: {
      '/api':     'http://localhost:5000',
      '/uploads': 'http://localhost:5000'
    }
  }
})
