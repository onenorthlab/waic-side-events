import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { FilterSidebar } from '../components/FilterSidebar'
import { PickupCard, EventRow } from '../components/EventCard'
import { fetchEvents, fetchTags } from '../lib/api'
import type { EventsResponse, EventItem } from '../lib/types'
import { groupDateLabel, dayKey, firstDate } from '../lib/format'
import { useI18n } from '../lib/i18n'
import { List, Map as MapIcon, X, Calendar } from 'lucide-react'

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

  // 一次性: pickup(featured) + tag 云
  useEffect(() => {
    fetchEvents({ featured: true, timeFilter: 'upcoming', perPage: 2 }).then((r) => setPickup(r.events)).catch(() => {})
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
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">{t('events.title')}</h1>

        {pickup.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-ink/70 dark:text-white/70">{t('events.pickup')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pickup.map((e) => (
                <PickupCard key={e.slug} ev={e} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="flex items-center justify-between border-b border-black/10 pb-2 dark:border-white/10">
              <div className="flex gap-1">
                {(['upcoming', 'past'] as Tab[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTab(tf)}
                    className={
                      'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                      (tab === tf
                        ? 'bg-ink text-white dark:bg-white dark:text-ink'
                        : 'text-ink/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10')
                    }
                  >
                    {tf === 'upcoming' ? t('events.upcoming') : t('events.past')}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {date && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-700">
                    <Calendar size={12} />
                    {new Date(date + 'T00:00:00').toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    <button onClick={() => setDate(null)} className="ml-0.5 rounded-full hover:bg-brand/20">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {data && <span className="text-xs text-ink/40 dark:text-white/40">{t('events.count', { n: data.pageInfo.totalCount })}</span>}
                <div className="flex gap-1">
                  <button className="rounded-md bg-black/5 p-1.5 text-ink dark:bg-white/10 dark:text-white" aria-label="List view">
                    <List size={16} />
                  </button>
                  <Link
                    to="/events/maps"
                    className="rounded-md p-1.5 text-ink/50 hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Map view"
                  >
                    <MapIcon size={16} />
                  </Link>
                </div>
              </div>
            </div>

            {loading && !data ? (
              <ListSkeleton />
            ) : groups.length === 0 ? (
              <p className="py-16 text-center text-sm text-ink/50 dark:text-white/50">
                {tab === 'upcoming' ? t('events.emptyUpcoming') : t('events.emptyPast')}
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-7">
                {groups.map((g) => (
                  <div key={g.label}>
                    <h3 className="mb-2 border-l-2 border-brand pl-2 text-sm font-bold text-ink dark:text-white">{g.label}</h3>
                    <div className="flex flex-col gap-1">
                      {g.items.map((e) => (
                        <EventRow key={e.slug} ev={e} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <FilterSidebar
            tags={tags}
            selectedTag={tag}
            q={q}
            onTag={setTag}
            onQ={setQ}
            events={data?.events || []}
            selectedDate={date}
            onSelectDate={setDate}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="aspect-video w-52 shrink-0 animate-pulse rounded-lg bg-black/5 dark:bg-white/10" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-black/5 dark:bg-white/10" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-black/5 dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}
