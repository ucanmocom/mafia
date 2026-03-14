import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/join': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    cssMinify: true,
    target: 'es2020',
    assetsInlineLimit: 4096,
  },
  // Enable historyApiFallback for SPA routing
  appType: 'spa',
})
