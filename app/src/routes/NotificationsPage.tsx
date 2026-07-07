import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useAttendee } from '../lib/attendee-context'
import { BrandDot } from '../components/EventCard'
import { CheckCircle2, XCircle, Megaphone, UserCog, BellOff } from 'lucide-react'
import { useI18n } from '../lib/i18n'

interface Notice {
  id: string
  kind: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  createdAt: string | null
}

const KIND_ICON: Record<string, React.ReactNode> = {
  REVIEW_APPROVED: <CheckCircle2 size={18} className="text-emerald-600" />,
  REVIEW_REJECTED: <XCircle size={18} className="text-neutral-400" />,
  ANNOUNCEMENT: <Megaphone size={18} className="text-brand" />,
  ROLE_ASSIGNED: <UserCog size={18} className="text-brand" />,
}

export function NotificationsPage() {
  const { t } = useI18n()
  const { email, loading } = useAttendee()
  const [items, setItems] = useState<Notice[] | null>(null)

  useEffect(() => {
    if (loading || !email) return
    fetch('/api/attendee/notifications')
      .then((r) => r.json())
      .then((d) => {
        setItems(d.notifications || [])
        // 打开即已读
        fetch('/api/attendee/notifications/read-all', { method: 'POST' }).catch(() => {})
        window.dispatchEvent(new CustomEvent('notifications-read'))
      })
      .catch(() => setItems([]))
  }, [email, loading])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 pb-12 pt-8 md:pt-12">
        <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">{t('notifications.title')}</h1>
        {loading ? null : !email ? (
          <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white py-14 text-center shadow-card dark:border-white/10 dark:bg-neutral-900">
            <p className="text-sm text-ink/60 dark:text-white/60">{t('notifications.loginHint')}</p>
            <Link to="/me" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
              {t('notifications.goLogin')}
            </Link>
          </div>
        ) : items === null ? (
          <div className="mt-6 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/10" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-black/[0.06] bg-white py-14 text-center shadow-card dark:border-white/10 dark:bg-neutral-900">
            <BellOff size={28} className="text-ink/25 dark:text-white/25" />
            <p className="text-sm text-ink/55 dark:text-white/55">{t('notifications.empty')}</p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-2.5">
            {items.map((n) => {
              const inner = (
                <div className="flex gap-3">
                  <span className="mt-0.5 shrink-0">{KIND_ICON[n.kind] || <Megaphone size={18} className="text-ink/40" />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
                      {!n.read && <BrandDot />}
                      <span className="min-w-0 flex-1">{n.title}</span>
                    </p>
                    {n.body && <p className="mt-0.5 text-sm text-ink/55 dark:text-white/55">{n.body}</p>}
                    {n.createdAt && (
                      <p className="mt-1 text-xs text-ink/35 dark:text-white/35">{new Date(n.createdAt).toLocaleString('zh-CN')}</p>
                    )}
                  </div>
                </div>
              )
              const cls =
                'block rounded-2xl border bg-white p-4 shadow-card transition dark:bg-neutral-900 ' +
                (n.read
                  ? 'border-black/[0.05] dark:border-white/[0.07]'
                  : 'border-brand/20 dark:border-brand/30')
              return (
                <li key={n.id}>
                  {n.link ? (
                    <a href={n.link} className={cls + ' hover:-translate-y-0.5 hover:shadow-card-hover'}>
                      {inner}
                    </a>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
