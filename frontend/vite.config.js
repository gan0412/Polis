import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
