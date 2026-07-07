import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { FeaturedCard, EventRow, BrandDot } from '../components/EventCard'
import { DateStrip } from '../components/DateStrip'
import { MiniEventMap } from '../components/MiniEventMap'
import { EventCalendar } from '../components/EventCalendar'
import { fetchEvents, fetchTags } from '../lib/api'
import type { EventsResponse, EventItem } from '../lib/types'
import { groupDateLabel, dayKey, firstDate } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { Search, X, Map as MapIcon } from 'lucide-react'

type Tab = 'upcoming' | 'past'

export function EventsListPage() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const [tag, setTag] = useState('')
  const [q, setQ] = useState('')
  const [date, setDate] = useState<string | null>(null)
  const [data, setData] = useState<EventsResponse | null>(null)
  const [pickup, setPickup] = useState<EventItem[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents({ featured: true, timeFilter: 'upcoming', perPage: 1 }).then((r) => setPickup(r.events)).catch(() => {})
    fetchTags().then(setTags).catch(() => {})
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    const h = setTimeout(() => {
      fetchEvents({ timeFilter: tab, tag, q, date: date || undefined, perPage: 60 })
        .then((d) => alive && setData(d))
        .finally(() => alive && setLoading(false))
    }, 180)
    return () => {
      alive = false
      clearTimeout(h)
    }
  }, [tab, tag, q, date])

  const { t } = useI18n()
  const filtering = !!(tag || q || date)
  const groups = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { label: string; items: EventItem[] }>()
    for (const e of data.events) {
      const d = firstDate(e.schedules)
      const k = dayKey(d)
      if (!map.has(k)) map.set(k, { label: groupDateLabel(d), items: [] })
      map.get(k)!.items.push(e)
    }
    return [...map.values()]
  }, [data])

  return (
    <div className="flex min-h-screen flex-col">
      <Header showCreate />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-8 pt-8 md:pt-12">
        {/* 页头：编辑感标题区 */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white md:text-[40px] md:leading-[1.15]">
            {t('events.heroTitle')}
          </h1>
          <p className="text-sm text-ink/55 dark:text-white/55 md:text-base">
            {t('events.heroSubtitle')}
          </p>
        </div>

        {/* 日期条：首要筛选轴 */}
        <div className="mt-6">
          <DateStrip selectedDate={date} onSelectDate={setDate} />
        </div>

        {/* 置顶活动（无筛选时展示） */}
        {pickup.length > 0 && !filtering && tab === 'upcoming' && (
          <section className="mt-4">
            <FeaturedCard ev={pickup[0]} />
          </section>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {/* 工具行：搜索 + 时态切换 + 地图入口 */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1 basis-56">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('filter.searchEvents')}
                  className="w-full rounded-lg border border-black/[0.08] bg-white py-2.5 pl-10 pr-9 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-brand dark:border-white/12 dark:bg-neutral-900 dark:text-white dark:placeholder:text-white/35"
                />
                {q && (
                  <button
                    onClick={() => setQ('')}
                    aria-label={t('common.clearSearch')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink dark:text-white/40 dark:hover:text-white"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <div className="flex rounded-lg border border-black/[0.08] bg-white p-0.5 dark:border-white/12 dark:bg-neutral-900">
                {(['upcoming', 'past'] as Tab[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTab(tf)}
                    className={
                      'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                      (tab === tf
                        ? 'bg-ink text-white dark:bg-white dark:text-ink'
                        : 'text-ink/55 hover:text-ink dark:text-white/55 dark:hover:text-white')
                    }
                  >
                    {tf === 'upcoming' ? t('events.upcoming') : t('events.past')}
                  </button>
                ))}
              </div>
              <Link
                to="/events/maps"
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:text-ink dark:border-white/12 dark:bg-neutral-900 dark:text-white/70 dark:hover:text-white lg:hidden"
              >
                <MapIcon size={15} /> {t('events.mapEntry')}
              </Link>
            </div>

            {/* 标签行：横滑 */}
            {tags.length > 0 && (
              <div className="-mx-4 mt-3 overflow-x-auto px-4 scrollbar-none">
                <div className="flex gap-1.5 pb-1">
                  {tags.map((tg) => {
                    const active = tag === tg
                    return (
                      <button
                        key={tg}
                        onClick={() => setTag(active ? '' : tg)}
                        className={
                          'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition active:scale-[0.97] ' +
                          (active
                            ? 'border-brand bg-brand text-white'
                            : 'border-black/[0.08] bg-white text-ink/60 hover:border-black/20 hover:text-ink dark:border-white/12 dark:bg-neutral-900 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white')
                        }
                      >
                        {tg}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 结果计数 */}
            {data && (
              <p className="mt-4 text-xs text-ink/40 dark:text-white/40">{t('events.count', { n: data.pageInfo.totalCount })}</p>
            )}

            {/* 按日分组的活动流 */}
            {loading && !data ? (
              <ListSkeleton />
            ) : groups.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm text-ink/50 dark:text-white/50">
                  {tab === 'upcoming' ? t('events.emptyUpcoming') : t('events.emptyPast')}
                </p>
                {filtering && (
                  <button
                    onClick={() => {
                      setTag('')
                      setQ('')
                      setDate(null)
                    }}
                    className="mt-3 text-sm font-semibold text-brand hover:underline"
                  >
                    {t('events.clearAllFilters')}
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-8">
                {groups.map((g) => (
                  <section key={g.label}>
                    <h2 className="sticky top-16 z-10 -mx-4 flex items-center gap-2 bg-paper/95 px-4 py-2 text-sm font-bold text-ink backdrop-blur dark:bg-[#131316]/95 dark:text-white sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none sm:dark:bg-transparent">
                      <BrandDot />
                      {g.label}
                      <span className="font-normal text-ink/40 dark:text-white/40">{t('events.sessionsCount', { n: g.items.length })}</span>
                    </h2>
                    <div className="mt-1 flex flex-col gap-1">
                      {g.items.map((e) => (
                        <EventRow key={e.slug} ev={e} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          {/* 桌面右栏：地图 + 月历 */}
          <aside className="hidden flex-col gap-5 lg:flex">
            <MiniEventMap />
            <EventCalendar events={data?.events || []} selectedDate={date} onSelectDate={setDate} />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          <div className="flex-1 space-y-2.5 py-1">
            <div className="h-3 w-16 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
          </div>
          <div className="aspect-[4/3] w-28 animate-pulse rounded-xl bg-black/[0.06] dark:bg-white/10 sm:aspect-[16/10] sm:w-48" />
        </div>
      ))}
    </div>
  )
}
