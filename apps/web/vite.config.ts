import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader'],
    include: ['dicom-parser'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          cornerstone: ['@cornerstonejs/core', '@cornerstonejs/tools'],
          dicom: ['@cornerstonejs/dicom-image-loader', 'dicom-parser'],
        },
      },
    },
  },
})
