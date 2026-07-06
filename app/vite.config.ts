import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { getRequestListener } from '@hono/node-server'
import path from 'node:path'

// 开发期把 Hono API 作为 Vite 中间件挂到 /api/*（同一份 src/server 代码可部署到 CF Workers）
function honoApi() {
  return {
    name: 'hono-api',
    async configureServer(server: any) {
      const mod = await server.ssrLoadModule('/src/server/index.ts')
      const listener = getRequestListener(mod.default.fetch)
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api')) return listener(req, res)
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), honoApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { port: 5173 },
})
