import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { fetchCommunities } from '../lib/api'
import type { Community, CommunitiesResponse } from '../lib/types'
import { Search, X, Users, Plus } from 'lucide-react'
import { toast } from '../lib/toast'
import { useI18n } from '../lib/i18n'

function CommunityCard({ c }: { c: Community }) {
  const { t } = useI18n()
  return (
    <Link
      to="/communities/$slug"
      params={{ slug: c.slug }}
      className="flex gap-3 rounded-xl border border-black/10 bg-white p-4 transition hover:border-black/25 hover:shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/25"
    >
      {c.logoUrl ? (
        <img src={c.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
          <Users size={20} className="text-ink/40" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-ink dark:text-white">{c.name}</h3>
        {c.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink/60 dark:text-white/60">{c.description}</p>}
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink/45 dark:text-white/45">
          <span className="inline-flex items-center gap-1">
            <Users size={11} /> {t('communities.members', { n: c.memberCount })}
          </span>
        </div>
        {c.tags?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {c.tags.slice(0, 4).map((t) => (
              <span key={t.id} className="rounded-full bg-black/[0.05] px-1.5 py-0.5 text-[10px] text-ink/60 dark:bg-white/10 dark:text-white/60">
                #{t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export function CommunitiesListPage() {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [data, setData] = useState<CommunitiesResponse | null>(null)
  const [pickup, setPickup] = useState<Community | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [showAllTags, setShowAllTags] = useState(false)

  useEffect(() => {
    // pickup(featured) + 全量(建标签云)
    fetchCommunities({ featured: true, perPage: 1 }).then((r) => setPickup(r.communities[0] || null)).catch(() => {})
    fetchCommunities({ perPage: 60 }).then((r) => {
      const counts = new Map<string, number>()
      for (const c of r.communities) for (const t of c.tags || []) counts.set(t.name, (counts.get(t.name) || 0) + 1)
      setAllTags([...counts.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const h = setTimeout(() => {
      fetchCommunities({ perPage: 60, tag, q }).then(setData).catch(() => {})
    }, 180)
    return () => clearTimeout(h)
  }, [tag, q])

  const shownTags = useMemo(() => (showAllTags ? allTags : allTags.slice(0, 18)), [allTags, showAllTags])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-ink dark:text-white">{t('communities.title')}</h1>
          <button
            onClick={() => toast(t('common.notInSlice'))}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-black transition hover:bg-brand-600"
          >
            <Plus size={16} /> {t('nav.createCommunity')}
          </button>
        </div>

        {pickup && (
          <section className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-ink/70 dark:text-white/70">{t('communities.pickup')}</h2>
            <Link
              to="/communities/$slug"
              params={{ slug: pickup.slug }}
              className="flex max-w-md items-center gap-3 rounded-xl border border-black/10 bg-white p-4 transition hover:shadow-sm dark:border-white/10 dark:bg-neutral-900"
            >
              {pickup.logoUrl && <img src={pickup.logoUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />}
              <div>
                <div className="font-semibold text-ink dark:text-white">{pickup.name}</div>
                <div className="text-xs text-ink/50 dark:text-white/50">{t('communities.members', { n: pickup.memberCount })}</div>
              </div>
            </Link>
          </section>
        )}

        {/* 搜索 */}
        <div className="relative mx-auto mt-6 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('communities.searchPlaceholder')}
            className="w-full rounded-full border border-black/12 bg-white py-2.5 pl-10 pr-9 text-sm outline-none focus:border-brand dark:border-white/15 dark:bg-neutral-900"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink">
              <X size={15} />
            </button>
          )}
        </div>

        {/* 标签筛选 */}
        {shownTags.length > 0 && (
          <div className="mx-auto mt-3 max-w-3xl">
            <div className="flex flex-wrap justify-center gap-1.5">
              {shownTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(tag === t ? '' : t)}
                  className={
                    'rounded-full border px-2.5 py-1 text-xs transition ' +
                    (tag === t ? 'border-brand bg-brand/15 font-semibold text-brand-600' : 'border-black/12 text-ink/70 hover:border-black/25 dark:border-white/15 dark:text-white/70')
                  }
                >
                  #{t}
                </button>
              ))}
            </div>
            {allTags.length > 18 && (
              <div className="mt-2 text-center">
                <button onClick={() => setShowAllTags((s) => !s)} className="text-xs font-medium text-brand-600 hover:underline">
                  {showAllTags ? t('common.showLess') : `${t('common.showMore')} (${allTags.length - 18})`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 网格 */}
        {data && (
          <>
            <p className="mt-6 text-xs text-ink/40 dark:text-white/40">{t('communities.count', { n: data.pageInfo.totalCount })}</p>
            {data.communities.length === 0 ? (
              <p className="py-16 text-center text-sm text-ink/50">{t('communities.empty')}</p>
            ) : (
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.communities.map((c) => (
                  <CommunityCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
