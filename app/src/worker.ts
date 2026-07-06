import app from './server'

// CF Worker 入口: /api/* → Hono; 其余 → 静态资源(dist, SPA 回退到 index.html)。
interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
}
type Ctx = { waitUntil(p: Promise<unknown>): void; passThroughOnException?(): void }

export default {
  async fetch(request: Request, env: Env, _ctx: Ctx): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api')) return app.fetch(request, env)
    return env.ASSETS.fetch(request)
  },
}
