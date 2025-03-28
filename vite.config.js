import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Add any proxy configuration if needed
    proxy: {
      '/api': {
        target: 'https://link.kicknsaas.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})