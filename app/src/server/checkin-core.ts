// 核销核心：主办方核销台与工作人员核销台共用同一套校验/落库逻辑。
import { eq } from 'drizzle-orm'
import { participants } from '@/db/schema'
import { verifyTicket, ticketSecret, checkinCode } from '@/lib/ticket'

export interface CheckinResult {
  result: 'ok' | 'already' | 'invalid' | 'wrong_event' | 'not_approved'
  message?: string
  name?: string
  type?: string
  checkedInAt?: string | null
}

export async function performCheckin(
  db: any,
  env: any,
  eventId: string,
  input: { token?: string; code?: string }
): Promise<CheckinResult> {
  let p: typeof participants.$inferSelect | undefined

  if (input.token) {
    const pid = await verifyTicket(input.token.trim(), ticketSecret(env))
    if (!pid) return { result: 'invalid', message: '无效票码（签名不匹配）' }
    p = await db.select().from(participants).where(eq(participants.id, pid)).get()
  } else if (input.code) {
    const code = input.code.trim().toUpperCase()
    if (code.length < 6) return { result: 'invalid', message: '短码至少 6 位' }
    const rows = await db.select().from(participants).where(eq(participants.eventId, eventId)).all()
    const matches = rows.filter((r: any) => checkinCode(r.id).startsWith(code))
    if (matches.length > 1) return { result: 'invalid', message: '短码有歧义，请输入完整 8 位' }
    p = matches[0]
  }

  if (!p) return { result: 'invalid', message: '没有找到这张票' }
  if (p.eventId !== eventId) return { result: 'wrong_event', message: '这张票不属于本活动' }
  if (p.status !== 'APPROVED') {
    const label = p.status === 'PENDING' ? '报名还在审核中' : p.status === 'REJECTED' ? '报名未通过' : '报名已取消'
    return { result: 'not_approved', message: label, name: p.name }
  }
  if (p.checkedIn) {
    return { result: 'already', message: '这张票已核销过', name: p.name, checkedInAt: p.checkedInAt }
  }

  const now = new Date().toISOString()
  await db.update(participants).set({ checkedIn: true, checkedInAt: now, updatedAt: now }).where(eq(participants.id, p.id)).run()
  return { result: 'ok', name: p.name, type: p.type ?? undefined, checkedInAt: now }
}

/** 工作人员判定：该邮箱在本活动有 STAFF 身份且已通过审核（主办方指派后即获得核销权限） */
export async function isEventStaff(db: any, eventId: string, email: string): Promise<boolean> {
  const rows = await db.select().from(participants).where(eq(participants.eventId, eventId)).all()
  return rows.some((r: any) => r.email === email && r.type === 'STAFF' && r.status === 'APPROVED')
}
