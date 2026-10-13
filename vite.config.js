import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './', // rutas relativas: funciona en GitHub Pages con cualquier nombre de repositorio
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 5173 },
  build: { chunkSizeWarningLimit: 1500 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    css: false,
    include: ['tests/**/*.test.{js,jsx}'],
  },
})
