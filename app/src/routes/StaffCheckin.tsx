import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { CheckinConsole } from '@/components/CheckinConsole'
import { useAttendee } from '../lib/attendee-context'

/**
 * 工作人员核销台（参会者身份进入）：
 * 被主办方指派为 STAFF 的报名者，从「我的」页进来即可扫码核销，无需主办方账号。
 */
export function StaffCheckinPage() {
  const { id } = useParams({ from: '/staff/$id/checkin' })
  const { email, loading } = useAttendee()
  const [ctx, setCtx] = useState<{ event?: { title: string; slug: string }; error?: string } | null>(null)

  useEffect(() => {
    if (loading || !email) return
    fetch(`/api/attendee/events/${id}/staff-context`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) return { error: d.message || '没有权限' }
        return { event: d.event }
      })
      .then(setCtx)
      .catch(() => setCtx({ error: '加载失败，请重试' }))
  }, [id, email, loading])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 pb-12 pt-6">
        {loading ? null : !email ? (
          <Notice text="请先在「我的」页面用邮箱登录，再打开核销台。" cta={{ to: '/me', label: '去登录' }} />
        ) : ctx === null ? (
          <div className="mt-8 h-48 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/10" />
        ) : ctx.error ? (
          <Notice text={ctx.error} cta={{ to: '/me', label: '返回我的' }} />
        ) : (
          <>
            <p className="mb-4 truncate text-sm text-ink/55 dark:text-white/55">
              {ctx.event!.title} · 工作人员核销台
            </p>
            <CheckinConsole apiBase={`/api/attendee/events/${id}`} />
          </>
        )}
      </main>
    </div>
  )
}

function Notice({ text, cta }: { text: string; cta: { to: string; label: string } }) {
  return (
    <div className="mt-12 rounded-2xl border border-black/[0.06] bg-white py-14 text-center shadow-card dark:border-white/10 dark:bg-neutral-900">
      <p className="px-6 text-sm text-ink/60 dark:text-white/60">{text}</p>
      <Link to={cta.to} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
        {cta.label} →
      </Link>
    </div>
  )
}
