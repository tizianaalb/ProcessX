import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5200,
    host: true, // Listen on all network interfaces (allows Windows to access WSL)
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
    strictPort: false,
    allowedHosts: [
      '.railway.app',
      '.up.railway.app',
      'localhost',
      '127.0.0.1',
    ],
  },
})
