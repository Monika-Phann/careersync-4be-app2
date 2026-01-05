import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
      port: parseInt(env.VITE_PORT || env.PORT || '5175', 10), // Read port from .env file
      allowedHosts: [
        "mentor-4be.ptascloud.online",
        "localhost"
      ],
      hmr: {
        // For local development, don't specify clientPort (Vite will use server port)
        // For production/Cloudflare behind proxy, use port 443
        clientPort: mode === 'production' ? 443 : parseInt(env.VITE_PORT || env.PORT || '5175', 10)
      }
    }
  }
})
