import { useEffect, useMemo, useState } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

import { fetchEvents } from '../lib/api'
import type { EventItem } from '../lib/types'
import { Clock, MapPin, ExternalLink } from 'lucide-react'
import { groupDateLabel, shortDateLabel } from '../lib/format'
import { BrandDot, LiveBadge } from '../components/EventCard'

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

/** 场地色标：同场地同色，扫一眼颜色就知道在哪。中性冷色阶，不与钴蓝主色打架。 */
const VENUE_COLORS = ['#8da2c0', '#b8a98f', '#95b5a4', '#b697b3', '#a3a3ad', '#c0a48d']
function venueColor(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return VENUE_COLORS[h % VENUE_COLORS.length]
}

function nowStamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + mins
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
}

function SpeakerChip({ sp }: { sp: Speaker }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {sp.imageUrl ? (
        <img src={sp.imageUrl} alt="" className="h-[22px] w-[22px] rounded-full object-cover" />
      ) : (
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand dark:bg-white/10 dark:text-white/80">
          {(sp.name || '?').slice(0, 1)}
        </span>
      )}
      <span className="text-xs text-ink/70 dark:text-white/70">{sp.name}</span>
    </span>
  )
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

  const now = nowStamp()

  return (
    <div className="flex min-h-screen flex-col">
      <Header showCreate />
      <main className="mx-auto w-full max-w-[900px] flex-1 px-4 pb-8 pt-8 md:pt-12">
        <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">日程总表</h1>
        <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">
          全部周边活动的公开场次，按日期与时间排好，方便你规划每一天。
        </p>

        {/* 日期跳转条：与列表页日期条同语言 */}
        {groups.length > 1 && (
          <div className="-mx-4 mt-6 overflow-x-auto px-4 scrollbar-none">
            <div className="flex gap-2 pb-1">
              {groups.map((g) => {
                const { md, wd } = shortDateLabel(g.date)
                const isToday = g.date === now.date
                return (
                  <button
                    key={g.date}
                    onClick={() => document.getElementById(`day-${g.date}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className={
                      'flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 leading-none shadow-card transition active:scale-[0.97] ' +
                      (isToday
                        ? 'border-brand bg-brand text-white'
                        : 'border-black/[0.08] bg-white text-ink/70 hover:border-black/20 dark:border-white/12 dark:bg-neutral-900 dark:text-white/70')
                    }
                  >
                    <span className="text-sm font-bold tabular-nums">{md}</span>
                    <span className={`mt-1 text-[11px] ${isToday ? 'opacity-80' : 'opacity-50'}`}>{isToday ? '今天' : wd}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/10" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="py-20 text-center text-sm text-ink/50">暂无公开日程。</div>
        ) : (
          <div className="mt-6 space-y-10">
            {groups.map((g) => (
              <section key={g.date} id={`day-${g.date}`} className="scroll-mt-24">
                <h2 className="sticky top-16 z-10 -mx-4 flex items-center gap-2 bg-paper/95 px-4 py-2 text-sm font-bold text-ink backdrop-blur dark:bg-[#131316]/95 dark:text-white">
                  <BrandDot />
                  {groupDateLabel(g.date)}
                  <span className="font-normal text-ink/40 dark:text-white/40">{g.sessions.length} 场</span>
                </h2>
                <div className="mt-2 flex flex-col gap-2.5">
                  {g.sessions.map((s) => {
                    const venue = s.stage?.name || s.event.location?.[0]?.title || ''
                    const live = g.date === now.date && s.startTime <= now.time && now.time <= s.endTime
                    const upcomingSoon = g.date === now.date && !live && s.startTime > now.time && s.startTime <= addMinutes(now.time, 60)
                    return (
                      <a
                        key={s.id}
                        href={`/${s.event.slug}`}
                        className={
                          'group relative flex flex-col gap-2 overflow-hidden rounded-2xl border bg-white p-4 pl-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-card-hover dark:bg-neutral-900 sm:flex-row sm:gap-5 ' +
                          (live ? 'border-live/40' : 'border-black/[0.05] hover:border-black/10 dark:border-white/[0.07] dark:hover:border-white/15')
                        }
                      >
                        {/* 场地色条 */}
                        {venue && (
                          <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: venueColor(venue) }} aria-hidden="true" />
                        )}
                        <div className="flex w-28 shrink-0 items-start gap-2 pt-0.5">
                          <span className="text-sm font-semibold tabular-nums text-ink/80 dark:text-white/80">
                            {s.startTime} - {s.endTime}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-semibold leading-snug text-ink group-hover:text-brand dark:text-white">
                              {s.title}
                            </span>
                            {live && <LiveBadge />}
                            {upcomingSoon && (
                              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand dark:bg-brand/20">
                                即将开始
                              </span>
                            )}
                            <ExternalLink size={12} className="opacity-40" />
                          </div>
                          {s.description && <p className="mt-1 line-clamp-2 text-sm text-ink/55 dark:text-white/55">{s.description}</p>}
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <span className="inline-flex items-center gap-1 text-xs text-ink/50 dark:text-white/50">
                              <Clock size={12} /> {s.event.title}
                            </span>
                            {venue && (
                              <span className="inline-flex items-center gap-1 text-xs text-ink/50 dark:text-white/50">
                                <MapPin size={12} /> {venue}
                              </span>
                            )}
                          </div>
                          {s.speakers.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              {s.speakers.slice(0, 6).map((sp) => (
                                <SpeakerChip key={sp.id} sp={sp} />
                              ))}
                              {s.speakers.length > 6 && (
                                <span className="text-xs text-ink/40 dark:text-white/40">+{s.speakers.length - 6}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </a>
                    )
                  })}
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
