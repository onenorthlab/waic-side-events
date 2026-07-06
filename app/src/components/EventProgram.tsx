import { useMemo, useState } from 'react'
import type { EventItem } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { Clock, MapPin, User } from 'lucide-react'

interface Stage { id: string; name: string }
interface Speaker { id: string; name: string; title?: string; organization?: string; imageUrl?: string }
interface Session { id: string; title: string; description?: string; date: string; startTime: string; endTime: string; stageId?: string; speakerIds?: string[] }

export function EventProgram({ ev }: { ev: EventItem }) {
  const sessions = (ev.sessions || []) as Session[]
  const speakers = (ev.speakers || []) as Speaker[]
  const announcements = (ev.announcements || []) as any[]
  if (!sessions.length && !speakers.length && !announcements.length) return null

  return (
    <div className="mt-10 space-y-10">
      {announcements.length > 0 && <Announcements list={announcements} />}
      {sessions.length > 0 && <Sessions sessions={sessions} stages={ev.stages as Stage[] || []} speakers={speakers} />}
      {speakers.length > 0 && <Speakers speakers={speakers} />}
    </div>
  )
}

function Announcements({ list }: { list: any[] }) {
  const pinned = list.filter((a) => a.pinned)
  const rest = list.filter((a) => !a.pinned)
  const items = [...pinned, ...rest]
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">公告</h2>
      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="rounded-xl border border-current/10 p-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">{a.title}</span>
              {a.pinned && <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">置顶</span>}
            </div>
            <p className="mt-1 whitespace-pre-line text-sm opacity-80">{a.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Sessions({ sessions, stages, speakers }: { sessions: Session[]; stages: Stage[]; speakers: Speaker[] }) {
  const { t } = useI18n()
  const groups = useMemo(() => {
    const sorted = sessions.slice().sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    const map = new Map<string, { label: string; items: Session[] }>()
    for (const s of sorted) {
      if (!map.has(s.date)) map.set(s.date, { label: s.date, items: [] })
      map.get(s.date)!.items.push(s)
    }
    return [...map.values()]
  }, [sessions])

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
        <Clock size={18} /> {t('detail.timetable')}
        <span className="text-sm font-normal opacity-50">{t('detail.sessions', { n: sessions.length })}</span>
      </h2>
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <h3 className="mb-2 text-sm font-bold opacity-70">{g.label}</h3>
            <div className="divide-y divide-current/10 rounded-xl border border-current/10">
              {g.items.map((s) => {
                const stage = stages.find((st) => st.id === s.stageId)
                const spk = (s.speakerIds || []).map((id) => speakers.find((x) => x.id === id)).filter(Boolean) as Speaker[]
                return (
                  <div key={s.id} className="flex gap-3 p-3">
                    <div className="w-28 shrink-0 text-xs font-medium tabular-nums opacity-70">
                      {s.startTime} - {s.endTime}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium leading-snug">{s.title}</div>
                      {s.description && <div className="mt-0.5 text-xs opacity-60">{s.description}</div>}
                      {stage && (
                        <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] opacity-55">
                          <MapPin size={11} /> {stage.name}
                        </div>
                      )}
                      {spk.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {spk.map((s) => (
                            <span key={s.id} className="inline-flex items-center gap-1 text-[11px] opacity-70">
                              <User size={10} /> {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Speakers({ speakers }: { speakers: Speaker[] }) {
  const { t } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? speakers : speakers.slice(0, 24)

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">
        {t('detail.speakers')} <span className="text-sm font-normal opacity-50">{speakers.length}</span>
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {shown.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5">
            {s.imageUrl ? (
              <img src={s.imageUrl} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="h-11 w-11 shrink-0 rounded-full bg-current/10" />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{s.name}</div>
              {s.title && <div className="truncate text-xs opacity-55">{s.title}</div>}
            </div>
          </div>
        ))}
      </div>
      {speakers.length > 24 && (
        <button onClick={() => setShowAll((v) => !v)} className="mt-4 text-sm font-medium text-brand-600 hover:underline">
          {showAll ? t('common.showLess') : t('detail.showAllSpeakers', { n: speakers.length })}
        </button>
      )}
    </section>
  )
}
