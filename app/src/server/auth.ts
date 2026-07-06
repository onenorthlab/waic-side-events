import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword, verifyPassword, signToken, setAuthCookie, clearAuthCookie, getCurrentUser, sanitizeUser } from '@/lib/auth'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const app = new Hono()

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const db = getDb(c.env)
  const body = c.req.valid('json')
  const existing = await db.select().from(users).where(eq(users.email, body.email)).get()
  if (existing) return c.json({ error: '该邮箱已被注册' }, 409)

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const passwordHash = await hashPassword(body.password)
  const slug = body.email.split('@')[0] + '-' + id.slice(0, 4)

  const row = {
    id,
    email: body.email,
    passwordHash,
    firstName: body.firstName || null,
    lastName: body.lastName || null,
    nativeName: null,
    avatarUrl: null,
    slug,
    title: null,
    bio: null,
    createdAt: now,
    updatedAt: now,
  }
  await db.insert(users).values(row).run()

  const token = await signToken({ userId: id, email: body.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, c)
  setAuthCookie(c, token)
  return c.json({ user: sanitizeUser(row) })
})

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const db = getDb(c.env)
  const body = c.req.valid('json')
  const row = await db.select().from(users).where(eq(users.email, body.email)).get()
  if (!row) return c.json({ error: '邮箱或密码错误' }, 401)
  const valid = await verifyPassword(body.password, row.passwordHash)
  if (!valid) return c.json({ error: '邮箱或密码错误' }, 401)

  const token = await signToken({ userId: row.id, email: row.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, c)
  setAuthCookie(c, token)
  return c.json({ user: sanitizeUser(row) })
})

app.post('/logout', (c) => {
  clearAuthCookie(c)
  return c.json({ ok: true })
})

app.get('/me', async (c) => {
  const user = await getCurrentUser(c)
  if (!user) return c.json({ error: '未登录' }, 401)
  return c.json({ user })
})

export default app
