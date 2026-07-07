// 站内通知：邮件到达率不稳，审核结果/公告等关键触达以站内通知为主、邮件为辅。
import { notifications } from '@/db/schema'

export interface NotifyInput {
  email: string
  eventId?: string | null
  kind: 'REVIEW_APPROVED' | 'REVIEW_REJECTED' | 'ANNOUNCEMENT' | 'ROLE_ASSIGNED'
  title: string
  body?: string | null
  link?: string | null
}

export async function notify(db: any, input: NotifyInput) {
  await db
    .insert(notifications)
    .values({
      id: crypto.randomUUID(),
      email: input.email.toLowerCase(),
      eventId: input.eventId ?? null,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      read: false,
      createdAt: new Date().toISOString(),
    })
    .run()
}

export async function notifyMany(db: any, emails: string[], base: Omit<NotifyInput, 'email'>) {
  for (const email of [...new Set(emails.map((e) => e.toLowerCase()))]) {
    await notify(db, { ...base, email })
  }
}

const ROLE_LABEL: Record<string, string> = {
  STAFF: '工作人员',
  SPEAKER: '嘉宾',
  VIP: 'VIP',
  MEDIA: '媒体',
}

export function roleLabel(type: string): string {
  return ROLE_LABEL[type] || type
}
