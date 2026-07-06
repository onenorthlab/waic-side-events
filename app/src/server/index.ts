import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import tagsUsage from '../data/tags-usage.json'
import authApp from './auth'
import manageApp from './manage'
import { getDb } from '@/db'
import { events as eventsTable, participants as participantsTable } from '@/db/schema'
import { eq, and, sql as sqlExpr } from 'drizzle-orm'
import { sendEmail, registrationConfirmedEmail, registrationPendingEmail } from '@/lib/email'
import { signTicket, verifyTicket, ticketSecret, checkinCode } from '@/lib/ticket'

const app = new Hono()

app.route('/api/auth', authApp)
app.route('/api/manage', manageApp)

const eventPublicFields = (r: any) => ({
  ...(r.data as any),
  id: r.id,
  slug: r.slug,
  title: r.title,
  catchphrase: r.catchphrase,
  eventType: r.eventType,
  state: r.state,
  timezone: r.timezone,
  schedules: r.schedules,
  location: r.location,
  tags: r.tags,
  mainImageUrl: r.mainImageUrl,
  thumbnailUrl: r.thumbnailUrl,
  featured: r.featured,
  enabledTickets: r.enabledTickets,
  enabledMeetings: r.enabledMeetings,
  enabledChat: r.enabledChat,
  enabledSideEvents: r.enabledSideEvents,
  requiresApproval: r.requiresApproval,
  maxParticipants: r.maxParticipants,
  participantListVisibility: r.participantListVisibility,
  stages: r.stages,
  sessions: r.sessions,
  speakers: r.speakers,
  announcements: r.announcements,
  surveySchema: r.surveySchema,
  customStyle: r.customStyle,
  customNavigation: r.customNavigation,
  createdBy: r.createdBy,
  organizers: r.organizers,
  organizerContact: r.organizerContact,
})

// 公开 API。前端统一走 /api/*。
// —— Events ——
app.get('/api/events', async (c) => {
  const db = getDb(c.env)
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
  const perPage = Math.min(60, Math.max(1, parseInt(c.req.query('perPage') || '24', 10)))
  const timeFilter = c.req.query('timeFilter') || 'upcoming'
  const featured = c.req.query('featured') === 'true'
  const tag = c.req.query('tag') || ''
  const q = (c.req.query('q') || '').toLowerCase().trim()
  const date = c.req.query('date') || ''

  let rows = await db.select().from(eventsTable).where(eq(eventsTable.state, 'PUBLISHED')).all()
  if (timeFilter === 'upcoming') rows = rows.filter((r) => !r.hasEnded)
  else if (timeFilter === 'past') rows = rows.filter((r) => !!r.hasEnded)
  if (featured) rows = rows.filter((r) => !!r.featured)
  if (tag) rows = rows.filter((r) => (r.tags || []).includes(tag))
  if (q) rows = rows.filter((r) => (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
  if (date) rows = rows.filter((r) => (r.schedules || []).some((s: any) => s?.date === date))
  rows = rows.slice().sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))

  const totalCount = rows.length
  const slice = rows.slice((page - 1) * perPage, page * perPage)
  return c.json({
    events: slice.map(eventPublicFields),
    pageInfo: { totalCount, totalPages: Math.max(1, Math.ceil(totalCount / perPage)), page, perPage },
  })
})

app.get('/api/events/counts-by-date', async (c) => {
  const db = getDb(c.env)
  const start = c.req.query('startDate')
  const end = c.req.query('endDate')
  const rows = await db.select({ schedules: eventsTable.schedules }).from(eventsTable).where(eq(eventsTable.state, 'PUBLISHED')).all()
  const set = new Set<string>()
  for (const r of rows) for (const s of (r.schedules || [])) if (s?.date) set.add(s.date)
  let dates = [...set].sort()
  if (start) dates = dates.filter((d) => d >= start)
  if (end) dates = dates.filter((d) => d <= end)
  return c.json({ dates })
})

app.get('/api/events/geojson', async (c) => {
  const db = getDb(c.env)
  const timeFilter = c.req.query('timeFilter') || 'upcoming'
  let rows = await db.select().from(eventsTable).where(eq(eventsTable.state, 'PUBLISHED')).all()
  if (timeFilter === 'upcoming') rows = rows.filter((r) => !r.hasEnded)
  else if (timeFilter === 'past') rows = rows.filter((r) => !!r.hasEnded)

  const features: any[] = []
  for (const r of rows) {
    const locs = (r.location || []) as any[]
    for (const loc of locs) {
      const geo = loc?.geo
      if (!geo || typeof geo.lat !== 'number' || typeof geo.lng !== 'number') continue
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [geo.lng, geo.lat] },
        properties: {
          id: r.id,
          slug: r.slug,
          title: r.title,
          catchphrase: r.catchphrase,
          eventType: r.eventType,
          thumbnailUrl: r.thumbnailUrl,
          schedules: r.schedules,
          tags: r.tags,
        },
      })
    }
  }
  return c.json({ type: 'FeatureCollection', features })
})
app.get('/api/tags/usage', async (c) => {
  const entity = c.req.query('entity') || 'event'
  if (entity === 'event') {
    const db = getDb(c.env)
    const rows = await db.select({ tags: eventsTable.tags }).from(eventsTable).where(eq(eventsTable.state, 'PUBLISHED')).all()
    const counts = new Map<string, number>()
    for (const r of rows) {
      for (const t of (r.tags || []) as string[]) {
        if (t) counts.set(t, (counts.get(t) || 0) + 1)
      }
    }
    const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
    return c.json({ groups: [{ entity: 'event', tags }] })
  }
  return c.json(tagsUsage)
})

app.get('/api/events/:slug', async (c) => {
  const db = getDb(c.env)
  const slug = c.req.param('slug')
  const row = (await db.select().from(eventsTable).where(eq(eventsTable.slug, slug)).get()) || (await db.select().from(eventsTable).where(eq(eventsTable.id, slug)).get())
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json(eventPublicFields(row))
})

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  ticketId: z.string().optional(),
  type: z.enum(['GENERAL', 'VIP', 'SPEAKER', 'STAFF', 'MEDIA']).default('GENERAL'),
  answers: z.record(z.string(), z.any()).optional(),
})

app.post('/api/events/:slug/register', zValidator('json', registerSchema), async (c) => {
  const db = getDb(c.env)
  const slug = c.req.param('slug')
  const event = (await db.select().from(eventsTable).where(eq(eventsTable.slug, slug)).get()) || (await db.select().from(eventsTable).where(eq(eventsTable.id, slug)).get())
  if (!event) return c.json({ error: 'not_found' }, 404)
  if (event.state !== 'PUBLISHED') return c.json({ error: 'event_not_open' }, 400)

  const body = c.req.valid('json')
  const now = new Date().toISOString()

  const existing = await db.select().from(participantsTable).where(and(eq(participantsTable.eventId, event.id), eq(participantsTable.email, body.email))).get()
  if (existing) return c.json({ error: 'already_registered' }, 409)

  if (event.maxParticipants) {
    const totalRow = await db.select({ count: sqlExpr`COUNT(*)`.mapWith(Number) }).from(participantsTable).where(eq(participantsTable.eventId, event.id)).get()
    const total = totalRow?.count || 0
    if (total >= event.maxParticipants) return c.json({ error: 'sold_out' }, 400)
  }

  const participant = {
    id: crypto.randomUUID(),
    eventId: event.id,
    email: body.email,
    name: body.name,
    status: event.requiresApproval ? 'PENDING' : 'APPROVED',
    type: body.type,
    ticketId: body.ticketId || null,
    checkedIn: false,
    data: { answers: body.answers || {} },
    createdAt: now,
    updatedAt: now,
  }
  await db.insert(participantsTable).values(participant).run()

  const token = await signTicket(participant.id, ticketSecret(c.env))
  const ticketUrl = `/ticket/${token}`

  const resendKey = (c.env as any)?.RESEND_API_KEY
  if (resendKey) {
    const origin = new URL(c.req.url).origin
    const eventUrl = `${origin}/${event.slug}`
    const email = participant.status === 'APPROVED'
      ? registrationConfirmedEmail(event.title, eventUrl, `${origin}${ticketUrl}`)
      : registrationPendingEmail(event.title)
    const emailFrom = (c.env as any)?.EMAIL_FROM
    c.executionCtx?.waitUntil?.(sendEmail(resendKey, { to: participant.email, ...email }, emailFrom))
  }

  return c.json({ ok: true, status: participant.status, ticketUrl })
})

// —— 电子票（公开，凭签名 token 访问）——
app.get('/api/ticket/:token', async (c) => {
  const token = c.req.param('token')
  const pid = await verifyTicket(token, ticketSecret(c.env))
  if (!pid) return c.json({ error: 'invalid_ticket' }, 404)

  const db = getDb(c.env)
  const p = await db.select().from(participantsTable).where(eq(participantsTable.id, pid)).get()
  if (!p) return c.json({ error: 'invalid_ticket' }, 404)
  const event = await db.select().from(eventsTable).where(eq(eventsTable.id, p.eventId)).get()
  if (!event) return c.json({ error: 'invalid_ticket' }, 404)

  return c.json({
    participant: {
      name: p.name,
      status: p.status,
      type: p.type,
      checkedIn: !!p.checkedIn,
      checkedInAt: p.checkedInAt || null,
      code: checkinCode(p.id),
    },
    event: {
      title: event.title,
      slug: event.slug,
      schedules: event.schedules,
      location: event.location,
      eventType: event.eventType,
      mainImageUrl: event.mainImageUrl,
    },
  })
})

// 防盗链图片代理：仅放行微信图床（qpic/qlogo），带 Referer 取图后透传。
// 主办方公众号里的原图/海报靠它在站内原样呈现。
const PROXY_ALLOWED_HOSTS = ['qpic.cn', 'qlogo.cn']
app.get('/api/images/proxy', async (c) => {
  const raw = c.req.query('url') || ''
  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return c.json({ error: 'invalid_url' }, 400)
  }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') return c.json({ error: 'invalid_url' }, 400)
  const allowed = PROXY_ALLOWED_HOSTS.some((d) => target.hostname === d || target.hostname.endsWith('.' + d))
  if (!allowed) return c.json({ error: 'host_not_allowed' }, 403)

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Referer: 'https://mp.weixin.qq.com/',
      },
    })
    if (!upstream.ok) return c.json({ error: 'upstream_failed' }, 502)
    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) return c.json({ error: 'not_an_image' }, 502)
    return new Response(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    })
  } catch {
    return c.json({ error: 'proxy_failed' }, 502)
  }
})

app.get('/api/amap/place', async (c) => {
  const key = (c.env as any)?.AMAP_KEY
  if (!key) return c.json({ error: 'amap_key_not_configured' }, 500)
  const keywords = c.req.query('keywords') || ''
  const city = c.req.query('city') || ''
  if (!keywords) return c.json({ error: 'keywords_required' }, 400)
  const url = `https://restapi.amap.com/v3/place/text?key=${encodeURIComponent(key)}&keywords=${encodeURIComponent(keywords)}&city=${encodeURIComponent(city)}&offset=10&page=1&extensions=all`
  try {
    const res = await fetch(url)
    const data = await res.json() as any
    const pois = (data.pois || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      location: p.location,
      city: p.cityname,
      district: p.adname,
    }))
    return c.json({ pois, count: data.count })
  } catch {
    return c.json({ error: 'amap_request_failed' }, 502)
  }
})

app.get('/api/config', (c) => {
  const amapKey = (c.env as any)?.AMAP_KEY
  return c.json({ ok: true, replica: true, amapKey: amapKey || null })
})

export default app
