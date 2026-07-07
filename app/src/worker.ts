import app from './server'
import { getDb } from './db'
import { events as eventsTable } from './db/schema'
import { eq } from 'drizzle-orm'

// CF Worker 入口: /api/* → Hono; 活动详情路径 → 注入 OG meta（分享出卡片）; 其余 → 静态资源。
interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> }
  DB?: unknown
}
type Ctx = { waitUntil(p: Promise<unknown>): void; passThroughOnException?(): void }

const STATIC_PREFIXES = ['/api', '/assets', '/events', '/schedules', '/me', '/notifications', '/staff', '/ticket', '/login', '/register', '/manage', '/checkin']

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** 详情页 slug 请求：把该活动的标题/描述/封面注入 index.html 的 OG meta，微信等抓取器能出分享卡片 */
async function withOgMeta(request: Request, env: Env, slug: string): Promise<Response | null> {
  try {
    const db = getDb(env)
    const ev = await db.select().from(eventsTable).where(eq(eventsTable.slug, slug)).get()
    if (!ev || ev.state !== 'PUBLISHED') return null

    const indexRes = await env.ASSETS.fetch(new Request(new URL('/', request.url).toString()))
    let html = await indexRes.text()
    const title = escapeHtml(ev.title)
    const desc = escapeHtml(ev.catchphrase || `${ev.title} · WAIC 世界人工智能大会周边活动`)
    const image = ev.mainImageUrl || ev.thumbnailUrl
    const url = new URL(request.url)
    const og = [
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${title}" />`,
      `<meta property="og:description" content="${desc}" />`,
      `<meta property="og:url" content="${escapeHtml(url.origin + url.pathname)}" />`,
      image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : '',
      `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    ]
      .filter(Boolean)
      .join('\n    ')
    html = html.replace('</head>', `    ${og}\n  </head>`)
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${title} · WAIC Side Events</title>`)
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
    })
  } catch {
    return null
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx: Ctx): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api')) return app.fetch(request, env)

    // 形如 /<slug> 的单段路径且非已知静态路由 → 尝试 OG 注入
    const isKnown = STATIC_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))
    const single = /^\/[^/]+$/.test(url.pathname)
    if (!isKnown && single && request.method === 'GET') {
      const slug = decodeURIComponent(url.pathname.slice(1))
      const withMeta = await withOgMeta(request, env, slug)
      if (withMeta) return withMeta
    }

    return env.ASSETS.fetch(request)
  },
}
