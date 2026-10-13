import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // Forces Vite to manually check OneDrive files for updates
      interval: 100,    // Checks files every 100 milliseconds
    }
  }
})
