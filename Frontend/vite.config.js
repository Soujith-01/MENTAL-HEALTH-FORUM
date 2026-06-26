import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '^/user-api': 'http://localhost:3000',
      '^/common-api': 'http://localhost:3000',
      '^/admin-api': 'http://localhost:3000',
      '^/message-api': 'http://localhost:3000'
    }
  },
})