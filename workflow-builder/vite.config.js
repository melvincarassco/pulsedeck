import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    proxy: {
      '/workflows': 'http://localhost:8000',
      '/executions': 'http://localhost:8000',
    },
  },
})
