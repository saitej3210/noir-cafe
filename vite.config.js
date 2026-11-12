import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ base: '/noir-cafe/', plugins: [react()], build: { chunkSizeWarningLimit: 2000 } })
