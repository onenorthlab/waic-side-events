// 参会者轻账号：邮箱即账号。验证码登录换 HMAC 签名 session（无密码、无注册表单）。
// session token = base64url(payload JSON) + '.' + base64url(HMAC(payload))
// payload = { e: email, x: expiresAtMs }

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64urlToStr(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
}
async function hmac(message: string, secret: string): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)))
}

export function attendeeSecret(env: any): string {
  return (
    env?.TICKET_SECRET ??
    (typeof process !== 'undefined' ? (process as any).env?.TICKET_SECRET : undefined) ??
    'waic-ticket-dev-secret'
  )
}

const SESSION_DAYS = 90

export async function signAttendeeSession(email: string, secret: string): Promise<string> {
  const payload = JSON.stringify({ e: email.toLowerCase(), x: Date.now() + SESSION_DAYS * 86400_000 })
  const body = b64url(new TextEncoder().encode(payload))
  const sig = b64url((await hmac(`att.${payload}`, secret)).slice(0, 20))
  return `${body}.${sig}`
}

export async function verifyAttendeeSession(token: string | undefined, secret: string): Promise<string | null> {
  if (!token) return null
  const dot = token.indexOf('.')
  if (dot < 0) return null
  try {
    const payload = b64urlToStr(token.slice(0, dot))
    const expectedSig = b64url((await hmac(`att.${payload}`, secret)).slice(0, 20))
    if (expectedSig !== token.slice(dot + 1)) return null
    const { e, x } = JSON.parse(payload)
    if (typeof e !== 'string' || typeof x !== 'number' || Date.now() > x) return null
    return e
  } catch {
    return null
  }
}

/** 6 位数字验证码 */
export function generateOtp(): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(buf[0] % 1000000).padStart(6, '0')
}

export function otpEmail(code: string) {
  return {
    subject: `【WAIC Side Events】登录验证码 ${code}`,
    html: `<p>您好，</p><p>您的登录验证码是：</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;">${code}</p><p>10 分钟内有效。如果这不是您本人的操作，请忽略本邮件。</p>`,
    text: `您的 WAIC Side Events 登录验证码：${code}（10 分钟内有效）。如非本人操作请忽略。`,
  }
}
