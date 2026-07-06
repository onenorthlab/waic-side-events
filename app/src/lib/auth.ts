import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const TOKEN_NAME = 'auth_token'
const DEFAULT_SECRET = 'dev-secret-change-in-production'

export interface TokenPayload {
  userId: string
  email: string
  exp: number
}

export interface SafeUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  nativeName: string | null
  avatarUrl: string | null
  slug: string | null
  title: string | null
  bio: string | null
}

function getSecret(c?: Context): string {
  if (c) {
    const env = c.env as any
    if (env?.AUTH_SECRET) return env.AUTH_SECRET
  }
  return DEFAULT_SECRET
}

function encodeBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64(str: string): Uint8Array {
  const pad = (4 - (str.length % 4)) % 4
  str += '='.repeat(pad)
  str = str.replace(/\-/g, '+').replace(/_/g, '/')
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function importKey(secret: string, usage: KeyUsage): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey('raw', enc.encode(secret) as unknown as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, [usage])
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password) as unknown as ArrayBuffer, 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt.buffer as unknown as ArrayBuffer, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return encodeBase64(salt) + '$' + encodeBase64(derived)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltB64, derivedB64] = hash.split('$')
  if (!saltB64 || !derivedB64) return false
  const enc = new TextEncoder()
  const salt = decodeBase64(saltB64)
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password) as unknown as ArrayBuffer, 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt.buffer as unknown as ArrayBuffer, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return encodeBase64(derived) === derivedB64
}

export async function signToken(payload: TokenPayload, c?: Context): Promise<string> {
  const header = encodeBase64(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = encodeBase64(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await importKey(getSecret(c), 'sign')
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`) as unknown as ArrayBuffer)
  return `${header}.${body}.${encodeBase64(sig)}`
}

export async function verifyToken(token: string, c?: Context): Promise<TokenPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const key = await importKey(getSecret(c), 'verify')
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64(parts[2]).buffer as unknown as ArrayBuffer,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`) as unknown as ArrayBuffer
    )
    if (!valid) return null
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64(parts[1]))) as TokenPayload
    if (payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

export async function getCurrentUser(c: Context): Promise<SafeUser | null> {
  const token = getCookie(c, TOKEN_NAME)
  if (!token) return null
  const payload = await verifyToken(token, c)
  if (!payload) return null
  const db = getDb(c.env)
  const row = await db.select().from(users).where(eq(users.id, payload.userId)).get()
  if (!row) return null
  return sanitizeUser(row)
}

export function setAuthCookie(c: Context, token: string): void {
  setCookie(c, TOKEN_NAME, token, {
    httpOnly: true,
    secure: false, // 本地开发用 false; 生产应改为 true
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 天
  })
}

export function clearAuthCookie(c: Context): void {
  deleteCookie(c, TOKEN_NAME, { path: '/' })
}

export function sanitizeUser(row: typeof users.$inferSelect): SafeUser {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    nativeName: row.nativeName,
    avatarUrl: row.avatarUrl,
    slug: row.slug,
    title: row.title,
    bio: row.bio,
  }
}

export function requireAuth(c: Context): Promise<SafeUser> {
  return getCurrentUser(c).then((u) => {
    if (!u) throw new Error('Unauthorized')
    return u
  })
}
