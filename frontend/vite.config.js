import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1989,
    proxy: {
      '/join': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
})
