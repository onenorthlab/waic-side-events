import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './server/index'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dir, '../dist')

// API 路由由 Hono app 处理
// 静态资源与 SPA fallback
app.use('/*', serveStatic({ root: distDir }))
app.get('/*', serveStatic({ path: path.join(distDir, 'index.html') }))

const port = parseInt(process.env.PORT || '3000', 10)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[prod] server running at http://localhost:${info.port}`)
})
