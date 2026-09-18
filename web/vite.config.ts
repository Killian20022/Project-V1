import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    // Le disque Windows monté dans WSL (/mnt/c) ne remonte pas les événements
    // inotify de façon fiable : sans polling, le HMR ne voit pas les changements.
    watch: { usePolling: true, interval: 300 },
  },
})
