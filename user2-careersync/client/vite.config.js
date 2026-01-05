import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // Define process.env for libraries that expect it (like axios, etc.)
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    'process.env': JSON.stringify({ NODE_ENV: mode === 'production' ? 'production' : 'development' }),
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      // Fixes the "Two Reacts" crash
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
    },
  },
  server: {
    host: true, 
    port: 5174,
    allowedHosts: ["careersync-4be.ptascloud.online"],
    // Fixes the "Loading failed" error on Cloudflare/HTTPS
    hmr: {
      clientPort: 443 
    }
  }
}))
