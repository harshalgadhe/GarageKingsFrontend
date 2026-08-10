import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/v1': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:5001',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const target = env.VITE_API_PROXY_TARGET
              if (!target || target.includes('localhost') || target.includes('127.0.0.1')) return

              // The production API intentionally rejects localhost origins.
              // During local development the request is same-origin to Vite,
              // so make the server-to-server proxy request identify its actual
              // HTTPS target rather than forwarding the browser's localhost Origin.
              const targetOrigin = new URL(target).origin
              proxyReq.setHeader('origin', targetOrigin)
              proxyReq.setHeader('referer', `${targetOrigin}/`)
            })
          }
        }
      }
    }
  }
})
