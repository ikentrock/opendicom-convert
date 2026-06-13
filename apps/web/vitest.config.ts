import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: ['../../'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '../../tests/**/*.{test,spec}.{ts,tsx}',
    ],
    environmentOptions: {
      jsdom: {
        // Node.js 26 adds experimental localStorage/sessionStorage globals,
        // which causes vitest's populateGlobal to skip jsdom's versions.
        // Listing them as additionalKeys forces jsdom's implementations to win.
        additionalKeys: ['localStorage', 'sessionStorage'],
      },
    },
  },
})
