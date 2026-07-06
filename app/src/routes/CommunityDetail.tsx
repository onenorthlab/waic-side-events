import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { fetchCommunity } from '../lib/api'
import type { Community } from '../lib/types'
import { Users, UserPlus, Globe, ArrowLeft, MessageCircle } from 'lucide-react'
import { toast } from '../lib/toast'
import { useI18n } from '../lib/i18n'

export function CommunityDetailPage() {
  const { t } = useI18n()
  const { slug } = useParams({ from: '/communities/$slug' })
  const [c, setC] = useState<Community | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading')

  useEffect(() => {
    let alive = true
    setState('loading')
    fetchCommunity(slug)
      .then((x) => alive && (setC(x), setState('ok')))
      .catch(() => alive && setState('notfound'))
    return () => {
      alive = false
    }
  }, [slug])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {state === 'loading' && <div className="flex-1 py-24 text-center text-sm text-ink/40">Loading…</div>}
      {state === 'notfound' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
          <p className="text-ink/60 dark:text-white/60">{t('communities.notFound')}</p>
          <Link to="/communities" className="text-sm font-semibold text-brand-600 hover:underline">
            {t('communities.back')}
          </Link>
        </div>
      )}
      {state === 'ok' && c && (
        <main className="mx-auto w-full max-w-[900px] flex-1 px-4 py-8">
          <Link to="/communities" className="mb-5 inline-flex items-center gap-1 text-sm text-ink/50 hover:text-ink dark:text-white/50">
            <ArrowLeft size={15} /> {t('nav.communities')}
          </Link>

          <div className="flex flex-col items-start gap-5 sm:flex-row">
            {c.logoUrl ? (
              <img src={c.logoUrl} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/10">
                <Users size={36} className="text-ink/40" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-bold text-ink dark:text-white">{c.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ink/70 dark:text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={15} /> {t('communities.members', { n: c.memberCount })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserPlus size={15} /> {t('communities.followers', { n: c.followersCount })}
                </span>
                {c.visibility && (
                  <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-xs capitalize dark:bg-white/10">
                    {c.visibility.toLowerCase()}
                  </span>
                )}
                {c.enabledChat && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <MessageCircle size={13} /> {t('communities.chat')}
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => toast(t('common.notInSlice'))}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-600"
                >
                  {c.joinType === 'REQUEST' ? t('communities.requestJoin') : t('communities.join')}
                </button>
                {c.websiteUrl && (
                  <a
                    href={c.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:border-brand dark:border-white/20"
                  >
                    <Globe size={15} /> {t('communities.website')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {c.description && (
            <p className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-ink/85 dark:text-white/80">{c.description}</p>
          )}

          {c.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <span key={t.id} className="rounded-full bg-black/[0.05] px-2.5 py-1 text-xs text-ink/70 dark:bg-white/10 dark:text-white/70">
                  #{t.name}
                </span>
              ))}
            </div>
          )}

          {/* 成员/活动列表需 /communities/:id/members · /events 接口(未采) —— 诚实标注 */}
          <div className="mt-8 rounded-xl border border-dashed border-black/15 p-4 text-sm text-ink/50 dark:border-white/15 dark:text-white/50">
            成员列表 / 社区活动 需 <code className="text-xs">/communities/:id/members</code> · <code className="text-xs">/events?communityId=</code> 接口，本切片未采集这两个子资源；社区元数据已契约级还原。
          </div>
        </main>
      )}
      <Footer />
    </div>
  )
}
