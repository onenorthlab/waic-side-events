// 参会者端 API：邮箱验证码登录、我的报名。邮箱即账号，无密码。
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { getDb } from '@/db'
import { events as eventsTable, participants as participantsTable, emailOtps, notifications, bookmarks } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'
import { signAttendeeSession, verifyAttendeeSession, attendeeSecret, generateOtp, otpEmail } from '@/lib/attendee'
import { signTicket, ticketSecret, signPersonalCode } from '@/lib/ticket'
import { performCheckin, isEventStaff } from './checkin-core'
import { and, sql as sqlExpr } from 'drizzle-orm'

const app = new Hono()

const COOKIE = 'attendee_session'

export async function currentAttendee(c: any): Promise<string | null> {
  return verifyAttendeeSession(getCookie(c, COOKIE), attendeeSecret(c.env))
}

// —— 发送验证码 ——
app.post('/otp', zValidator('json', z.object({ email: z.string().email() })), async (c) => {
  const db = getDb(c.env)
  const email = c.req.valid('json').email.toLowerCase()
  const now = new Date()

  // 60 秒频控（同邮箱）
  const existing = await db.select().from(emailOtps).where(eq(emailOtps.email, email)).get()
  if (existing?.createdAt && now.getTime() - new Date(existing.createdAt).getTime() < 60_000) {
    return c.json({ error: 'too_frequent', message: '发送太频繁，请一分钟后再试' }, 429)
  }

  const code = generateOtp()
  const row = {
    email,
    code,
    expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
    attempts: 0,
    createdAt: now.toISOString(),
  }
  if (existing) await db.update(emailOtps).set(row).where(eq(emailOtps.email, email)).run()
  else await db.insert(emailOtps).values(row).run()

  const resendKey = (c.env as any)?.RESEND_API_KEY ?? (typeof process !== 'undefined' ? (process as any).env?.RESEND_API_KEY : undefined)
  if (resendKey) {
    const emailFrom = (c.env as any)?.EMAIL_FROM
    const r = await sendEmail(resendKey, { to: email, ...otpEmail(code) }, emailFrom)
    if (!r.ok) return c.json({ error: 'send_failed', message: '验证码发送失败，请稍后重试' }, 502)
    return c.json({ ok: true })
  }
  // 本地开发无邮件通道：明示降级并回传验证码，便于联调
  console.error(`[attendee] DEV otp for ${email}: ${code}`)
  return c.json({ ok: true, devCode: code })
})

// —— 校验验证码换 session ——
app.post('/verify', zValidator('json', z.object({ email: z.string().email(), code: z.string().min(4).max(8) })), async (c) => {
  const db = getDb(c.env)
  const email = c.req.valid('json').email.toLowerCase()
  const code = c.req.valid('json').code.trim()

  const row = await db.select().from(emailOtps).where(eq(emailOtps.email, email)).get()
  if (!row) return c.json({ error: 'invalid_code', message: '请先获取验证码' }, 400)
  if (new Date(row.expiresAt).getTime() < Date.now()) return c.json({ error: 'expired', message: '验证码已过期，请重新获取' }, 400)
  if ((row.attempts || 0) >= 5) return c.json({ error: 'too_many_attempts', message: '尝试次数过多，请重新获取验证码' }, 429)
  if (row.code !== code) {
    await db.update(emailOtps).set({ attempts: (row.attempts || 0) + 1 }).where(eq(emailOtps.email, email)).run()
    return c.json({ error: 'invalid_code', message: '验证码不正确' }, 400)
  }

  await db.delete(emailOtps).where(eq(emailOtps.email, email)).run()
  const token = await signAttendeeSession(email, attendeeSecret(c.env))
  setCookie(c, COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 90 * 86400,
    secure: new URL(c.req.url).protocol === 'https:',
  })
  return c.json({ ok: true, email })
})

app.get('/me', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ error: 'unauthorized' }, 401)
  return c.json({ email })
})

app.post('/logout', (c) => {
  deleteCookie(c, COOKIE, { path: '/' })
  return c.json({ ok: true })
})

// —— 我的报名（聚合所有活动的报名+状态+电子票） ——
app.get('/registrations', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ error: 'unauthorized' }, 401)
  const db = getDb(c.env)
  const rows = await db.select().from(participantsTable).where(eq(participantsTable.email, email)).orderBy(desc(participantsTable.createdAt)).all()

  const secret = ticketSecret(c.env)
  const result = []
  for (const p of rows) {
    const ev = await db.select().from(eventsTable).where(eq(eventsTable.id, p.eventId)).get()
    if (!ev) continue
    result.push({
      id: p.id,
      eventId: p.eventId,
      status: p.status,
      type: p.type,
      checkedIn: !!p.checkedIn,
      createdAt: p.createdAt,
      ticketUrl: p.status === 'APPROVED' || p.status === 'PENDING' ? `/ticket/${await signTicket(p.id, secret)}` : null,
      event: {
        slug: ev.slug,
        title: ev.title,
        schedules: ev.schedules,
        location: ev.location,
        eventType: ev.eventType,
        thumbnailUrl: ev.thumbnailUrl,
        mainImageUrl: ev.mainImageUrl,
        hasEnded: !!ev.hasEnded,
      },
    })
  }
  return c.json({ registrations: result })
})

// —— 一人一码：个人通用入场码 ——
app.get('/personal-code', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ error: 'unauthorized' }, 401)
  const token = await signPersonalCode(email, ticketSecret(c.env))
  return c.json({ token, email })
})

// —— 收藏 ——
app.get('/bookmarks', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ error: 'unauthorized' }, 401)
  const db = getDb(c.env)
  const rows = await db.select().from(bookmarks).where(eq(bookmarks.email, email)).all()
  const result = []
  for (const b of rows) {
    const ev = await db.select().from(eventsTable).where(eq(eventsTable.id, b.eventId)).get()
    if (!ev || ev.state !== 'PUBLISHED') continue
    result.push({
      eventId: ev.id,
      slug: ev.slug,
      title: ev.title,
      schedules: ev.schedules,
      location: ev.location,
      eventType: ev.eventType,
      thumbnailUrl: ev.thumbnailUrl,
      mainImageUrl: ev.mainImageUrl,
      hasEnded: !!ev.hasEnded,
    })
  }
  return c.json({ bookmarks: result })
})

app.get('/bookmarks/:eventId', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ bookmarked: false })
  const db = getDb(c.env)
  const rows = await db.select().from(bookmarks).where(eq(bookmarks.email, email)).all()
  return c.json({ bookmarked: rows.some((r) => r.eventId === c.req.param('eventId')) })
})

app.put('/bookmarks/:eventId', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ error: 'unauthorized' }, 401)
  const db = getDb(c.env)
  const eventId = c.req.param('eventId')
  const exists = (await db.select().from(bookmarks).where(eq(bookmarks.email, email)).all()).some((r) => r.eventId === eventId)
  if (!exists) {
    await db.insert(bookmarks).values({ email, eventId, createdAt: new Date().toISOString() }).run()
  }
  return c.json({ ok: true, bookmarked: true })
})

app.delete('/bookmarks/:eventId', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ error: 'unauthorized' }, 401)
  const db = getDb(c.env)
  const eventId = c.req.param('eventId')
  await db.delete(bookmarks).where(and(eq(bookmarks.email, email), eq(bookmarks.eventId, eventId))).run()
  return c.json({ ok: true, bookmarked: false })
})

// —— 站内通知 ——
app.get('/notifications', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ error: 'unauthorized' }, 401)
  const db = getDb(c.env)
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.email, email))
    .orderBy(desc(notifications.createdAt))
    .limit(50)
    .all()
  return c.json({ notifications: rows })
})

app.get('/notifications/unread-count', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ count: 0 })
  const db = getDb(c.env)
  const row = await db
    .select({ count: sqlExpr`COUNT(*)`.mapWith(Number) })
    .from(notifications)
    .where(and(eq(notifications.email, email), eq(notifications.read, false)))
    .get()
  return c.json({ count: row?.count || 0 })
})

app.post('/notifications/read-all', async (c) => {
  const email = await currentAttendee(c)
  if (!email) return c.json({ error: 'unauthorized' }, 401)
  const db = getDb(c.env)
  await db.update(notifications).set({ read: true }).where(eq(notifications.email, email)).run()
  return c.json({ ok: true })
})

// —— 工作人员核销通道 ——
// 模型：工作人员 = 报名本活动且被主办方指派为 STAFF 的参会者（自己也参加活动）。
// 指派即授权：STAFF + APPROVED 就能打开本活动核销台，无需主办方账号。

async function requireStaff(c: any): Promise<{ email: string; eventId: string } | Response> {
  const email = await currentAttendee(c)
  if (!email) return c.json({ error: 'unauthorized', message: '请先登录' }, 401)
  const eventId = c.req.param('id')
  const db = getDb(c.env)
  if (!(await isEventStaff(db, eventId, email))) {
    return c.json({ error: 'forbidden', message: '你不是本活动的工作人员（需要主办方指派）' }, 403)
  }
  return { email, eventId }
}

app.get('/events/:id/staff-context', async (c) => {
  const auth = await requireStaff(c)
  if (auth instanceof Response) return auth
  const db = getDb(c.env)
  const ev = await db.select().from(eventsTable).where(eq(eventsTable.id, auth.eventId)).get()
  if (!ev) return c.json({ error: 'not_found' }, 404)
  return c.json({ event: { id: ev.id, title: ev.title, slug: ev.slug } })
})

app.get('/events/:id/checkin/stats', async (c) => {
  const auth = await requireStaff(c)
  if (auth instanceof Response) return auth
  const db = getDb(c.env)
  const approvedRow = await db
    .select({ count: sqlExpr`COUNT(*)`.mapWith(Number) })
    .from(participantsTable)
    .where(and(eq(participantsTable.eventId, auth.eventId), eq(participantsTable.status, 'APPROVED')))
    .get()
  const checkedRow = await db
    .select({ count: sqlExpr`COUNT(*)`.mapWith(Number) })
    .from(participantsTable)
    .where(and(eq(participantsTable.eventId, auth.eventId), eq(participantsTable.checkedIn, true)))
    .get()
  return c.json({ approved: approvedRow?.count || 0, checkedIn: checkedRow?.count || 0 })
})

app.post(
  '/events/:id/checkin',
  zValidator('json', z.object({ token: z.string().optional(), code: z.string().optional() }).refine((v) => v.token || v.code)),
  async (c) => {
    const auth = await requireStaff(c)
    if (auth instanceof Response) return auth
    const db = getDb(c.env)
    const result = await performCheckin(db, c.env, auth.eventId, c.req.valid('json'))
    return c.json(result)
  }
)

export default app
