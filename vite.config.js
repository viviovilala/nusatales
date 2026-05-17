import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  cacheDir: 'node_modules/.vite-nusatales',
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.jsx'],
      detectTls: false,
      refresh: true,
    }),
    react(),
    tailwindcss(),
  ],
  server: {
      watch: {
        usePolling: true,
        interval: 1000,
        ignored: ['**/storage/framework/views/**'],
      },
    },
  })
