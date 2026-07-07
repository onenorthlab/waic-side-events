// 活动结束后自动邀约填写满意度反馈（Cron Trigger 每日执行，也可手动触发）。
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { events, participants } from '@/db/schema'
import { notifyMany } from './notify'

function todayShanghai(): string {
  const p: Record<string, string> = {}
  for (const x of new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()))
    p[x.type] = x.value
  return `${p.year}-${p.month}-${p.day}`
}

export async function runFeedbackInviteSweep(env: any): Promise<{ invited: number; events: string[] }> {
  const db = getDb(env)
  const today = todayShanghai()
  const rows = await db.select().from(events).where(eq(events.state, 'PUBLISHED')).all()

  let invited = 0
  const touched: string[] = []
  for (const ev of rows) {
    const data = (ev.data || {}) as any
    const ended = !!ev.hasEnded || (ev.endDate && ev.endDate < today)
    if (!ended || data.feedbackInviteSentAt) continue

    const regs = await db.select().from(participants).where(eq(participants.eventId, ev.id)).all()
    // 已签到者优先目标，没人签到就发给全部已通过者
    const checked = regs.filter((r) => r.status === 'APPROVED' && r.checkedIn)
    const targets = (checked.length ? checked : regs.filter((r) => r.status === 'APPROVED')).map((r) => r.email)
    if (targets.length) {
      await notifyMany(db, targets, {
        eventId: ev.id,
        kind: 'FEEDBACK_INVITE',
        title: `活动结束了，聊聊感受？${ev.title}`,
        body: '花 30 秒给这场活动打个分，你的反馈会直接帮到主办方。',
        link: `/feedback/${ev.id}`,
      })
      invited += targets.length
    }
    const now = new Date().toISOString()
    await db.update(events).set({ data: { ...data, feedbackInviteSentAt: now }, updatedAt: now }).where(eq(events.id, ev.id)).run()
    touched.push(ev.title)
  }
  return { invited, events: touched }
}
