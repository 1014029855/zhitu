import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 4321,
    host: '0.0.0.0',
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:1234',
        changeOrigin: true,
        secure: false
      }
    }
  },
  root: '.',
  build: {
    outDir: 'dist'
  }
})
