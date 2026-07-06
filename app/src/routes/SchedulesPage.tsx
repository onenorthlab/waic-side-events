import { useEffect, useMemo, useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

import { fetchEvents } from '../lib/api'
import type { EventItem } from '../lib/types'
import { Clock, MapPin, ExternalLink } from 'lucide-react'
import { groupDateLabel } from '../lib/format'

const formatDay = (d: string) => groupDateLabel(d)

interface Session {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  stageId?: string
  speakerIds?: string[]
}

interface Stage { id: string; name: string }
interface Speaker { id: string; name: string; title?: string; organization?: string; imageUrl?: string }

interface SessionWithEvent extends Session {
  event: EventItem
  stage?: Stage
  speakers: Speaker[]
}

export function SchedulesPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents({ timeFilter: 'upcoming', perPage: 100 })
      .then((res) => setEvents(res.events || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const groups = useMemo(() => {
    const items: SessionWithEvent[] = []
    for (const ev of events) {
      const sessions = (ev.sessions || []) as Session[]
      const stages = (ev.stages || []) as Stage[]
      const speakers = (ev.speakers || []) as Speaker[]
      for (const s of sessions) {
        items.push({
          ...s,
          event: ev,
          stage: stages.find((st) => st.id === s.stageId),
          speakers: (s.speakerIds || []).map((id) => speakers.find((sp) => sp.id === id)).filter(Boolean) as Speaker[],
        })
      }
    }
    items.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    const map = new Map<string, SessionWithEvent[]>()
    for (const item of items) {
      if (!map.has(item.date)) map.set(item.date, [])
      map.get(item.date)!.push(item)
    }
    return [...map.entries()].map(([date, sessions]) => ({ date, sessions }))
  }, [events])

  return (
    <div className="flex min-h-screen flex-col">
      <Header showCreate />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-8 pt-8 md:pt-12">
        <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">日程总表</h1>
        <p className="mb-8 mt-1.5 text-sm text-ink/55 dark:text-white/55">
          全部周边活动的公开场次，按日期与时间排好，方便你规划每一天。
        </p>

        {loading ? (
          <div className="py-20 text-center text-sm text-ink/40">加载中…</div>
        ) : groups.length === 0 ? (
          <div className="py-20 text-center text-sm text-ink/50">暂无公开日程。</div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.date}>
                <h2 className="mb-3 text-sm font-bold text-ink dark:text-white">{formatDay(g.date)}</h2>
                <div className="divide-y divide-black/[0.06] rounded-2xl border border-black/[0.07] bg-white dark:divide-white/10 dark:border-white/10 dark:bg-neutral-900">
                  {g.sessions.map((s) => (
                    <div key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:gap-4">
                      <div className="w-28 shrink-0 text-sm font-medium tabular-nums opacity-70">
                        {s.startTime} - {s.endTime}
                      </div>
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/${s.event.slug}`}
                          className="text-base font-semibold hover:text-brand hover:underline"
                        >
                          {s.title}
                          <ExternalLink size={12} className="ml-1 inline opacity-50" />
                        </a>
                        {s.description && <p className="mt-0.5 text-sm opacity-60">{s.description}</p>}
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs opacity-60">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} /> {s.event.title}
                          </span>
                          {s.stage && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} /> {s.stage.name}
                            </span>
                          )}
                          {s.speakers.length > 0 && (
                            <span>{s.speakers.map((sp) => sp.name).join('、')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
