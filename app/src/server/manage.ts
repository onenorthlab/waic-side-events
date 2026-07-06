import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDb } from '@/db'
import { events, participants, tickets } from '@/db/schema'
import { eq, desc, and, sql as sqlExpr } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { sendEmail, registrationApprovedEmail } from '@/lib/email'
import importApp from './import'
import { signTicket, verifyTicket, ticketSecret, checkinCode } from '@/lib/ticket'

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  descriptionFormat: z.enum(['html', 'markdown']).optional(),
  eventType: z.enum(['ONSITE', 'ONLINE', 'HYBRID']).default('ONSITE'),
  timezone: z.string().default('Asia/Shanghai'),
  date: z.string().optional(),
  startTime: z.string().default('10:00'),
  endTime: z.string().default('18:00'),
  schedules: z
    .array(
      z.object({
        date: z.string(),
        startTime: z.string().default('10:00'),
        endTime: z.string().default('18:00'),
      })
    )
    .optional(),
})

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  descriptionFormat: z.enum(['html', 'markdown']).optional(),
  catchphrase: z.string().optional(),
  eventType: z.enum(['ONSITE', 'ONLINE', 'HYBRID']).optional(),
  timezone: z.string().optional(),
  schedules: z
    .array(
      z.object({
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .optional(),
  location: z.array(z.any()).optional(),
  onlineUrl: z.string().optional(),
  onlineDescription: z.string().optional(),
  organizers: z.array(z.any()).optional(),
  organizerContact: z.array(z.any()).optional(),
  snsAccounts: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  mainImageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  state: z.enum(['DRAFT', 'PUBLISHED', 'LIMITED']).optional(),
  speakers: z.array(z.any()).optional(),
  announcements: z.array(z.any()).optional(),
  stages: z.array(z.any()).optional(),
  sessions: z.array(z.any()).optional(),
  enabledTickets: z.boolean().optional(),
  enabledMeetings: z.boolean().optional(),
  enabledChat: z.boolean().optional(),
  enabledSideEvents: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  maxParticipants: z.number().int().nullable().optional(),
  participantListVisibility: z.enum(['PUBLIC', 'PRIVATE', 'APPROVED_ONLY']).optional(),
  customStyle: z.record(z.string(), z.any()).optional(),
  customNavigation: z.array(z.any()).optional(),
  surveySchema: z.array(z.any()).optional(),
})

const app = new Hono()

app.use('*', async (c, next) => {
  try {
    await requireAuth(c)
    await next()
  } catch {
    return c.json({ error: '请先登录' }, 401)
  }
})

// 外部来源导入（公众号/网页/纯文本 → 活动草稿）
app.route('/import', importApp)

app.get('/events', async (c) => {
  const db = getDb(c.env)
  const user = await requireAuth(c)
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.createdById, user.id))
    .orderBy(desc(events.createdAt))
    .all()
  return c.json({ events: rows.map((r) => ({ ...(r.data as any), id: r.id, slug: r.slug })) })
})

app.get('/events/:id', async (c) => {
  const db = getDb(c.env)
  const user = await requireAuth(c)
  const id = c.req.param('id')
  const row = await db.select().from(events).where(eq(events.id, id)).get()
  if (!row) return c.json({ error: '活动不存在' }, 404)
  if (row.createdById !== user.id) return c.json({ error: '无权限' }, 403)
  return c.json({ ...(row.data as any), id: row.id, slug: row.slug })
})

app.post('/events', zValidator('json', createEventSchema), async (c) => {
  const db = getDb(c.env)
  const user = await requireAuth(c)
  const body = c.req.valid('json')
  const schedules =
    body.schedules && body.schedules.length > 0
      ? body.schedules
      : body.date
        ? [{ date: body.date, startTime: body.startTime, endTime: body.endTime }]
        : []
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const slug = body.title.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') + '-' + id.slice(0, 6)
  const startDate = schedules[0]?.date ?? null
  const endDate = schedules.length ? schedules[schedules.length - 1].date : startDate

  const data = {
    id,
    slug,
    title: body.title,
    catchphrase: null,
    description: body.description || '',
    descriptionFormat: body.descriptionFormat || null,
    eventType: body.eventType,
    state: 'DRAFT',
    timezone: body.timezone,
    schedules,
    location: [],
    tags: [],
    organizers: [{ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl } }],
    createdBy: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl },
    customStyle: null,
    customNavigation: [],
    organizerContact: [],
    stages: [],
    sessions: [],
    speakers: [],
    announcements: [],
    surveySchema: [],
    enabledTickets: false,
    enabledMeetings: false,
    enabledChat: false,
    enabledSideEvents: false,
    requiresApproval: false,
    maxParticipants: null,
    participantListVisibility: 'PUBLIC',
    createdAt: now,
    updatedAt: now,
  } as any

  const row = {
    id,
    slug,
    title: body.title,
    catchphrase: null,
    description: body.description || null,
    eventType: body.eventType,
    state: 'DRAFT' as const,
    timezone: body.timezone,
    thumbnailUrl: null,
    mainImageUrl: null,
    startDate,
    endDate,
    hasEnded: false,
    featured: false,
    requiresApproval: false,
    enabledTickets: false,
    enabledMeetings: false,
    enabledChat: false,
    enabledSideEvents: false,
    maxParticipants: null,
    participantListVisibility: 'PUBLIC',
    schedules,
    location: [],
    tags: [],
    organizers: data.organizers,
    customStyle: null,
    customNavigation: [],
    organizerContact: [],
    stages: [],
    sessions: [],
    speakers: [],
    announcements: [],
    surveySchema: [],
    createdBy: data.createdBy,
    createdById: user.id,
    createdAt: now,
    updatedAt: now,
    data,
  }
  await db.insert(events).values(row).run()
  return c.json(data, 201)
})

app.patch('/events/:id', zValidator('json', updateEventSchema), async (c) => {
  const db = getDb(c.env)
  const user = await requireAuth(c)
  const id = c.req.param('id')
  const existing = await db.select().from(events).where(eq(events.id, id)).get()
  if (!existing) return c.json({ error: '活动不存在' }, 404)
  if (existing.createdById !== user.id) return c.json({ error: '无权限' }, 403)

  const body = c.req.valid('json')
  const now = new Date().toISOString()
  const prevData = (existing.data || {}) as any

  const schedules = body.schedules ?? existing.schedules ?? []
  const startDate = schedules[0]?.date ?? existing.startDate ?? null
  const endDate = schedules.length ? schedules[schedules.length - 1].date : startDate

  const data = {
    ...prevData,
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.descriptionFormat !== undefined && { descriptionFormat: body.descriptionFormat }),
    ...(body.catchphrase !== undefined && { catchphrase: body.catchphrase }),
    ...(body.eventType !== undefined && { eventType: body.eventType }),
    ...(body.timezone !== undefined && { timezone: body.timezone }),
    ...(body.schedules !== undefined && { schedules }),
    ...(body.location !== undefined && { location: body.location }),
    ...(body.onlineUrl !== undefined && { onlineUrl: body.onlineUrl }),
    ...(body.onlineDescription !== undefined && { onlineDescription: body.onlineDescription }),
    ...(body.organizers !== undefined && { organizers: body.organizers }),
    ...(body.organizerContact !== undefined && { organizerContact: body.organizerContact }),
    ...(body.snsAccounts !== undefined && { snsAccounts: body.snsAccounts }),
    ...(body.tags !== undefined && { tags: body.tags }),
    ...(body.mainImageUrl !== undefined && { mainImageUrl: body.mainImageUrl }),
    ...(body.thumbnailUrl !== undefined && { thumbnailUrl: body.thumbnailUrl }),
    ...(body.state !== undefined && { state: body.state }),
    ...(body.speakers !== undefined && { speakers: body.speakers }),
    ...(body.announcements !== undefined && { announcements: body.announcements }),
    ...(body.stages !== undefined && { stages: body.stages }),
    ...(body.sessions !== undefined && { sessions: body.sessions }),
    ...(body.enabledTickets !== undefined && { enabledTickets: body.enabledTickets }),
    ...(body.enabledMeetings !== undefined && { enabledMeetings: body.enabledMeetings }),
    ...(body.enabledChat !== undefined && { enabledChat: body.enabledChat }),
    ...(body.enabledSideEvents !== undefined && { enabledSideEvents: body.enabledSideEvents }),
    ...(body.requiresApproval !== undefined && { requiresApproval: body.requiresApproval }),
    ...(body.maxParticipants !== undefined && { maxParticipants: body.maxParticipants }),
    ...(body.participantListVisibility !== undefined && { participantListVisibility: body.participantListVisibility }),
    ...(body.customStyle !== undefined && { customStyle: body.customStyle }),
    ...(body.customNavigation !== undefined && { customNavigation: body.customNavigation }),
    ...(body.surveySchema !== undefined && { surveySchema: body.surveySchema }),
    updatedAt: now,
  }

  const title = body.title ?? existing.title
  let slug = existing.slug
  if (body.title !== undefined) {
    slug = title.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '') + '-' + id.slice(0, 6)
  }

  await db.update(events)
    .set({
      title,
      slug,
      description: body.description !== undefined ? body.description || null : existing.description,
      catchphrase: body.catchphrase !== undefined ? body.catchphrase || null : existing.catchphrase,
      eventType: body.eventType ?? existing.eventType,
      timezone: body.timezone ?? existing.timezone,
      state: body.state ?? existing.state,
      startDate,
      endDate,
      mainImageUrl: body.mainImageUrl !== undefined ? body.mainImageUrl || null : existing.mainImageUrl,
      thumbnailUrl: body.thumbnailUrl !== undefined ? body.thumbnailUrl || null : existing.thumbnailUrl,
      schedules,
      location: body.location !== undefined ? body.location : existing.location,
      tags: body.tags !== undefined ? body.tags : existing.tags,
      organizers: body.organizers !== undefined ? body.organizers : existing.organizers,
      organizerContact: body.organizerContact !== undefined ? body.organizerContact : existing.organizerContact,
      speakers: body.speakers !== undefined ? body.speakers : existing.speakers,
      announcements: body.announcements !== undefined ? body.announcements : existing.announcements,
      stages: body.stages !== undefined ? body.stages : existing.stages,
      sessions: body.sessions !== undefined ? body.sessions : existing.sessions,
      surveySchema: body.surveySchema !== undefined ? body.surveySchema : existing.surveySchema,
      enabledTickets: body.enabledTickets !== undefined ? body.enabledTickets : existing.enabledTickets,
      enabledMeetings: body.enabledMeetings !== undefined ? body.enabledMeetings : existing.enabledMeetings,
      enabledChat: body.enabledChat !== undefined ? body.enabledChat : existing.enabledChat,
      enabledSideEvents: body.enabledSideEvents !== undefined ? body.enabledSideEvents : existing.enabledSideEvents,
      requiresApproval: body.requiresApproval !== undefined ? body.requiresApproval : existing.requiresApproval,
      maxParticipants: body.maxParticipants !== undefined ? body.maxParticipants : existing.maxParticipants,
      participantListVisibility: body.participantListVisibility !== undefined ? body.participantListVisibility : existing.participantListVisibility,
      updatedAt: now,
      data,
    })
    .where(eq(events.id, id))
    .run()

  return c.json(data)
})

// —— Participants ——

async function requireOwnedEvent(c: any, id: string) {
  const db = getDb(c.env)
  const user = await requireAuth(c)
  const event = await db.select().from(events).where(eq(events.id, id)).get()
  if (!event) return null
  if (event.createdById !== user.id) throw new Error('FORBIDDEN')
  return event
}

app.get('/events/:id/participants', async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const event = await requireOwnedEvent(c, id)
  if (!event) return c.json({ error: '活动不存在' }, 404)

  const query = c.req.query('q') || ''
  const status = c.req.query('status') || ''
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20', 10)))

  const where = [eq(participants.eventId, id)]
  if (status) where.push(eq(participants.status, status))
  if (query) {
    where.push(
      sqlExpr`(${participants.name} LIKE ${`%${query}%`} OR ${participants.email} LIKE ${`%${query}%`})`
    )
  }

  const list = await db
    .select()
    .from(participants)
    .where(and(...where))
    .orderBy(desc(participants.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()

  const totalRow = await db
    .select({ count: sqlExpr`COUNT(*)`.mapWith(Number) })
    .from(participants)
    .where(and(...where))
    .get()
  const total = totalRow?.count || 0

  const counts = await db
    .select({ status: participants.status, count: sqlExpr`COUNT(*)`.mapWith(Number) })
    .from(participants)
    .where(eq(participants.eventId, id))
    .groupBy(participants.status)
    .all()

  return c.json({ participants: list, total, page, pageSize, counts })
})

const statusSchema = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']) })

app.patch('/events/:id/participants/:pid', zValidator('json', statusSchema), async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const pid = c.req.param('pid')
  const event = await requireOwnedEvent(c, id)
  if (!event) return c.json({ error: '活动不存在' }, 404)

  const body = c.req.valid('json')
  const existing = await db.select().from(participants).where(eq(participants.id, pid)).get()
  if (!existing || existing.eventId !== id) return c.json({ error: '记录不存在' }, 404)

  await db.update(participants)
    .set({ status: body.status, updatedAt: new Date().toISOString() })
    .where(eq(participants.id, pid))
    .run()

  if (body.status === 'APPROVED') {
    const resendKey = (c.env as any)?.RESEND_API_KEY
    if (resendKey) {
      const origin = new URL(c.req.url).origin
      const eventUrl = `${origin}/${event.slug}`
      const token = await signTicket(existing.id, ticketSecret(c.env))
      const emailFrom = (c.env as any)?.EMAIL_FROM
      c.executionCtx?.waitUntil?.(
        sendEmail(resendKey, { to: existing.email, ...registrationApprovedEmail(event.title, eventUrl, `${origin}/ticket/${token}`) }, emailFrom)
      )
    }
  }

  return c.json({ ok: true })
})

// —— 现场签到核销 ——

app.get('/events/:id/checkin/stats', async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const event = await requireOwnedEvent(c, id)
  if (!event) return c.json({ error: '活动不存在' }, 404)
  const approvedRow = await db
    .select({ count: sqlExpr`COUNT(*)`.mapWith(Number) })
    .from(participants)
    .where(and(eq(participants.eventId, id), eq(participants.status, 'APPROVED')))
    .get()
  const checkedRow = await db
    .select({ count: sqlExpr`COUNT(*)`.mapWith(Number) })
    .from(participants)
    .where(and(eq(participants.eventId, id), eq(participants.checkedIn, true)))
    .get()
  return c.json({ approved: approvedRow?.count || 0, checkedIn: checkedRow?.count || 0 })
})

const checkinSchema = z
  .object({ token: z.string().optional(), code: z.string().optional() })
  .refine((v) => v.token || v.code, { message: 'token 或 code 至少提供一个' })

app.post('/events/:id/checkin', zValidator('json', checkinSchema), async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const event = await requireOwnedEvent(c, id)
  if (!event) return c.json({ error: '活动不存在' }, 404)

  const body = c.req.valid('json')
  let p: typeof participants.$inferSelect | undefined

  if (body.token) {
    const pid = await verifyTicket(body.token.trim(), ticketSecret(c.env))
    if (!pid) return c.json({ result: 'invalid', message: '无效票码（签名不匹配）' }, 200)
    p = await db.select().from(participants).where(eq(participants.id, pid)).get()
  } else {
    const code = body.code!.trim().toUpperCase()
    if (code.length < 6) return c.json({ result: 'invalid', message: '短码至少 6 位' }, 200)
    const rows = await db.select().from(participants).where(eq(participants.eventId, id)).all()
    const matches = rows.filter((r) => checkinCode(r.id).startsWith(code))
    if (matches.length > 1) return c.json({ result: 'invalid', message: '短码有歧义，请输入完整 8 位' }, 200)
    p = matches[0]
  }

  if (!p) return c.json({ result: 'invalid', message: '没有找到这张票' }, 200)
  if (p.eventId !== id) return c.json({ result: 'wrong_event', message: '这张票不属于本活动' }, 200)
  if (p.status !== 'APPROVED') {
    const label = p.status === 'PENDING' ? '报名还在审核中' : p.status === 'REJECTED' ? '报名未通过' : '报名已取消'
    return c.json({ result: 'not_approved', message: label, name: p.name }, 200)
  }
  if (p.checkedIn) {
    return c.json({ result: 'already', message: '这张票已核销过', name: p.name, checkedInAt: p.checkedInAt }, 200)
  }

  const now = new Date().toISOString()
  await db.update(participants).set({ checkedIn: true, checkedInAt: now, updatedAt: now }).where(eq(participants.id, p.id)).run()
  return c.json({ result: 'ok', name: p.name, type: p.type, checkedInAt: now })
})

app.get('/events/:id/participants/export.csv', async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const event = await requireOwnedEvent(c, id)
  if (!event) return c.json({ error: '活动不存在' }, 404)

  const rows = await db
    .select()
    .from(participants)
    .where(eq(participants.eventId, id))
    .orderBy(desc(participants.createdAt))
    .all()

  const header = ['姓名', '邮箱', '状态', '类型', '签到', '报名时间', '备注']
  const lines = rows.map((p) => [
    p.name,
    p.email,
    p.status,
    p.type,
    p.checkedIn ? '是' : '否',
    p.createdAt || '',
    (p.notes || '').replace(/\n/g, ' '),
  ])
  const csv = [header, ...lines].map((r) => r.map(escapeCsv).join(',')).join('\n')

  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="participants-${id.slice(0, 8)}.csv"`)
  return c.body('\uFEFF' + csv)
})

function escapeCsv(v: string | null | undefined) {
  const s = String(v ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

// —— Tickets ——

const ticketSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
  maxPerOrder: z.number().int().min(1).default(1),
  saleStartsAt: z.string().optional(),
  saleEndsAt: z.string().optional(),
  type: z.enum(['FREE', 'ONSITE']).default('FREE'),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

app.get('/events/:id/tickets', async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const event = await requireOwnedEvent(c, id)
  if (!event) return c.json({ error: '活动不存在' }, 404)
  const list = await db.select().from(tickets).where(eq(tickets.eventId, id)).orderBy(tickets.sortOrder).all()
  return c.json({ tickets: list })
})

app.post('/events/:id/tickets', zValidator('json', ticketSchema), async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const event = await requireOwnedEvent(c, id)
  if (!event) return c.json({ error: '活动不存在' }, 404)
  const body = c.req.valid('json')
  const now = new Date().toISOString()
  const row = {
    id: crypto.randomUUID(),
    eventId: id,
    ...body,
    price: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.insert(tickets).values(row).run()
  return c.json(row, 201)
})

app.patch('/events/:id/tickets/:tid', zValidator('json', ticketSchema.partial()), async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const tid = c.req.param('tid')
  const event = await requireOwnedEvent(c, id)
  if (!event) return c.json({ error: '活动不存在' }, 404)
  const existing = await db.select().from(tickets).where(eq(tickets.id, tid)).get()
  if (!existing || existing.eventId !== id) return c.json({ error: '票种不存在' }, 404)
  const body = c.req.valid('json')
  const now = new Date().toISOString()
  await db.update(tickets)
    .set({ ...body, updatedAt: now })
    .where(eq(tickets.id, tid))
    .run()
  return c.json({ ok: true })
})

app.delete('/events/:id/tickets/:tid', async (c) => {
  const db = getDb(c.env)
  const id = c.req.param('id')
  const tid = c.req.param('tid')
  const event = await requireOwnedEvent(c, id)
  if (!event) return c.json({ error: '活动不存在' }, 404)
  const existing = await db.select().from(tickets).where(eq(tickets.id, tid)).get()
  if (!existing || existing.eventId !== id) return c.json({ error: '票种不存在' }, 404)
  await db.delete(tickets).where(eq(tickets.id, tid)).run()
  return c.json({ ok: true })
})

export default app
