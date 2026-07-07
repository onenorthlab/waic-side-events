// 电子票 token：HMAC-SHA256 签名的 participantId，防伪造、可离线校验。
// token = base64url(pid) + '.' + base64url(hmac(pid))
// 核销短码 = participantId 去掉连字符后的前 8 位（现场手动输入兜底）。

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
}

async function hmacSign(message: string, secret: string): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return new Uint8Array(sig)
}

export function ticketSecret(env: any): string {
  return (
    env?.TICKET_SECRET ??
    (typeof process !== 'undefined' ? (process as any).env?.TICKET_SECRET : undefined) ??
    'waic-ticket-dev-secret'
  )
}

export async function signTicket(participantId: string, secret: string): Promise<string> {
  const sig = await hmacSign(participantId, secret)
  return `${b64url(new TextEncoder().encode(participantId))}.${b64url(sig.slice(0, 16))}`
}

export async function verifyTicket(token: string, secret: string): Promise<string | null> {
  const dot = token.indexOf('.')
  if (dot < 0) return null
  try {
    const pid = b64urlDecode(token.slice(0, dot))
    const expected = await signTicket(pid, secret)
    // 常数时间比较不是这里的威胁模型重点（HMAC 全量比对即可）
    return expected === token ? pid : null
  } catch {
    return null
  }
}

/** 现场手动核销短码 */
export function checkinCode(participantId: string): string {
  return participantId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

// —— 一人一码：个人通用入场码（按邮箱签名，跨活动通用；核销时匹配该活动的报名记录）——
const PERSONAL_PREFIX = 'U.'

export async function signPersonalCode(email: string, secret: string): Promise<string> {
  const msg = `personal.${email.toLowerCase()}`
  const sig = await hmacSign(msg, secret)
  return `${PERSONAL_PREFIX}${b64url(new TextEncoder().encode(email.toLowerCase()))}.${b64url(sig.slice(0, 16))}`
}

export function isPersonalCode(token: string): boolean {
  return token.startsWith(PERSONAL_PREFIX)
}

export async function verifyPersonalCode(token: string, secret: string): Promise<string | null> {
  if (!isPersonalCode(token)) return null
  const rest = token.slice(PERSONAL_PREFIX.length)
  const dot = rest.indexOf('.')
  if (dot < 0) return null
  try {
    const email = b64urlDecode(rest.slice(0, dot))
    const expected = await signPersonalCode(email, secret)
    return expected === token ? email : null
  } catch {
    return null
  }
}
