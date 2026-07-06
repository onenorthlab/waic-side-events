import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { COMMUNITIES, PLAYLISTS } from './data'
import tagsUsage from '../data/tags-usage.json'
import authApp from './auth'
import manageApp from './manage'
import { getDb } from '@/db'
import { events as eventsTable, participants as participantsTable } from '@/db/schema'
import { eq, and, sql as sqlExpr } from 'drizzle-orm'
import { sendEmail, registrationConfirmedEmail, registrationPendingEmail } from '@/lib/email'

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

// 契约对齐 api.4s.link。前端走 /api/*, 与真实路径一一对应。
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

  const resendKey = (c.env as any)?.RESEND_API_KEY
  if (resendKey) {
    const eventUrl = `https://waic-side-events.ingle.workers.dev/${event.slug}`
    const email = participant.status === 'APPROVED'
      ? registrationConfirmedEmail(event.title, eventUrl)
      : registrationPendingEmail(event.title)
    const emailFrom = (c.env as any)?.EMAIL_FROM
    c.executionCtx?.waitUntil?.(sendEmail(resendKey, { to: participant.email, ...email }, emailFrom))
  }

  return c.json({ ok: true, status: participant.status })
})

// —— Communities ——
app.get('/api/communities', (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
  const perPage = Math.min(60, Math.max(1, parseInt(c.req.query('perPage') || '12', 10)))
  const featured = c.req.query('featured') === 'true'
  const tag = c.req.query('tag') || ''
  const q = (c.req.query('q') || '').toLowerCase().trim()

  let rows = COMMUNITIES.slice().sort((a, b) => b.memberCount - a.memberCount)
  if (featured) rows = rows.filter((r) => r.featured)
  if (tag) rows = rows.filter((r) => r.tags.some((t: any) => (t?.name || t) === tag))
  if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))

  const totalCount = rows.length
  const slice = rows.slice((page - 1) * perPage, page * perPage)
  return c.json({
    communities: slice.map((r) => r.data),
    pageInfo: { totalCount, totalPages: Math.max(1, Math.ceil(totalCount / perPage)), page, perPage },
  })
})

app.get('/api/communities/:slug', (c) => {
  const slug = c.req.param('slug')
  const row = COMMUNITIES.find((r) => r.slug === slug) || COMMUNITIES.find((r) => r.id === slug)
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json(row.data)
})

// —— Playlists ——
app.get('/api/playlists', (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
  const perPage = Math.min(60, Math.max(1, parseInt(c.req.query('perPage') || '12', 10)))
  const featured = c.req.query('featured') === 'true'

  let rows = PLAYLISTS.slice().sort((a, b) => Number(b.sticky) - Number(a.sticky) || b.itemCount - a.itemCount)
  if (featured) rows = rows.filter((r) => r.featured)

  const totalCount = rows.length
  const slice = rows.slice((page - 1) * perPage, page * perPage)
  return c.json({
    playlists: slice.map((r) => r.data),
    pageInfo: { totalCount, totalPages: Math.max(1, Math.ceil(totalCount / perPage)), page, perPage },
  })
})

app.get('/api/playlists/:id', (c) => {
  const id = c.req.param('id')
  const row = PLAYLISTS.find((r) => r.id === id)
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json(row.data)
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
