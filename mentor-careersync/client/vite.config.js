import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      // Forces single copy of React to prevent crashes
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
    },
  },
  server: {
    host: true,
    port: 5175, // Mentor app runs on port 5175
    allowedHosts: [
      "mentor-4be.ptascloud.online",
      "localhost"
    ],
    hmr: {
      // For local development, don't specify clientPort (Vite will use server port)
      // For production/Cloudflare behind proxy, use port 443
      ...(mode === 'production' ? { clientPort: 443 } : {})
    }
  }
}))
