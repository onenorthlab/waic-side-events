import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { fetchEvent } from '../lib/api'
import type { EventItem } from '../lib/types'
import { detailDateLabel, timeLabel } from '../lib/format'
import { downloadIcs } from '../lib/ics'
import { EventProgram } from '../components/EventProgram'
import { useI18n } from '../lib/i18n'
import { CalendarPlus, Clock, MapPin, Wifi, ArrowLeft, ExternalLink, Ticket, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Survey } from 'survey-react-ui'
import { Model } from 'survey-core'
import 'survey-core/survey-core.css'

function Organizers({ ev }: { ev: EventItem }) {
  const { t } = useI18n()
  const list: { user?: any; community?: any }[] = []
  if (ev.createdBy) list.push({ user: ev.createdBy })
  for (const o of ev.organizers || []) {
    if (o?.user) list.push({ user: o.user })
    else if (o?.community) list.push({ community: o.community })
  }
  const seen = new Set<string>()
  const uniq = list.filter((x) => {
    const k = x.user?.id || x.community?.id
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
  if (!uniq.length) return null
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold">{t('detail.organizers')}</h3>
      {uniq.slice(0, 8).map((x, i) => {
        const u = x.user || x.community
        const name = x.user ? u.nativeName || [u.firstName, u.lastName].filter(Boolean).join(' ') : u.name
        const img = x.user ? u.avatarUrl : u.logoUrl || u.iconUrl
        return (
          <div key={u.id || i} className="flex items-center gap-2.5">
            {img ? (
              <img src={img} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-black/10 dark:bg-white/15" />
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{name || 'Organizer'}</div>
              {x.user?.title && <div className="truncate text-xs opacity-60">{u.title}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Registration({ ev }: { ev: EventItem }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const hasSurvey = Array.isArray(ev.surveySchema) && ev.surveySchema.length > 0
  const surveyJson = hasSurvey ? { elements: ev.surveySchema } : null
  const [surveyModel] = useState(() => surveyJson ? new Model(surveyJson) : null)

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (hasSurvey && surveyModel && surveyModel.hasErrors(false)) {
      toast.error('请完整填写报名表单')
      return
    }
    setSubmitting(true)
    try {
      const payload: any = { name, email }
      if (hasSurvey && surveyModel) payload.answers = surveyModel.data
      const res = await fetch(`/api/events/${ev.slug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '报名失败')
      setDone(true)
      toast.success(data.status === 'APPROVED' ? '报名成功' : '报名已提交，等待审批')
    } catch (err: any) {
      toast.error(err.message || '报名失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        size="lg"
        className="mt-4 w-full"
        onClick={() => setOpen(true)}
        style={{ backgroundColor: ev.customStyle?.primaryColor || undefined }}
      >
        <Ticket size={18} className="mr-2" /> 立即报名
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>报名：{ev.title}</DialogTitle>
          </DialogHeader>
          {done ? (
            <div className="py-6 text-center">
              <CheckCircle size={48} className="mx-auto text-green-500" />
              <p className="mt-4 font-medium">报名成功</p>
              <p className="text-sm text-ink/50">确认邮件已发送，请查收。</p>
              <Button className="mt-4" onClick={() => setOpen(false)}>关闭</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>邮箱</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {hasSurvey && surveyModel && (
                <div className="rounded-lg border p-3 dark:border-white/10">
                  <Survey model={surveyModel} />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? '提交中…' : '确认报名'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function EventDetailPage() {
  const { t } = useI18n()
  const { slug } = useParams({ from: '/$slug' })
  const [ev, setEv] = useState<EventItem | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading')

  useEffect(() => {
    let alive = true
    setState('loading')
    fetchEvent(slug)
      .then((e) => alive && (setEv(e), setState('ok')))
      .catch(() => alive && setState('notfound'))
    return () => {
      alive = false
    }
  }, [slug])

  const cs = ev?.customStyle
  const themed = !!(cs && (cs.backgroundColor || cs.textColor))
  const wrapStyle = themed ? { backgroundColor: cs!.backgroundColor || undefined, color: cs!.textColor || undefined } : undefined
  const accent = cs?.primaryColor
  const venue = ev?.location?.[0]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {state === 'loading' && <div className="flex-1 py-24 text-center text-sm text-ink/40">Loading…</div>}
      {state === 'notfound' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
          <p className="text-ink/60 dark:text-white/60">{t('events.notFound')}</p>
          <Link to="/events" className="text-sm font-semibold text-brand-600 hover:underline">
            {t('events.backToList')}
          </Link>
        </div>
      )}
      {state === 'ok' && ev && (
        <main className="flex-1" style={wrapStyle}>
          {/* 事件标题条 */}
          <div className="border-b border-black/10 bg-neutral-900 dark:border-white/10" style={themed ? { background: cs!.backgroundColor, borderColor: 'rgba(255,255,255,.12)' } : undefined}>
            <div className="mx-auto max-w-[1200px] px-4 py-3">
              <p className="truncate text-sm font-medium text-white/90" style={themed ? { color: cs!.textColor } : undefined}>
                {ev.title}
              </p>
            </div>
          </div>

          {ev.mainImageUrl && (
            <div className="bg-neutral-900" style={themed ? { background: cs!.backgroundColor } : undefined}>
              <div className="mx-auto max-w-[900px] px-4 py-6">
                <img src={ev.mainImageUrl} alt={ev.title} className="mx-auto max-h-[560px] w-full rounded-xl object-contain" />
              </div>
            </div>
          )}

          <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-8 lg:grid-cols-[1fr_300px]">
            <article className={themed ? '' : 'text-ink dark:text-white'}>
              <Link to="/events" className="mb-4 inline-flex items-center gap-1 text-sm opacity-60 hover:opacity-100">
                <ArrowLeft size={15} /> {t('nav.events')}
              </Link>
              <h1 className="font-display text-3xl font-bold leading-tight" style={cs?.titleTextColor ? { color: cs.titleTextColor } : undefined}>
                {ev.title}
              </h1>
              {ev.catchphrase && <p className="mt-1 text-base opacity-70">{ev.catchphrase}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-lg font-semibold">{detailDateLabel(ev.schedules)}</span>
                <button
                  onClick={() => downloadIcs(ev)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:opacity-80"
                  style={{ borderColor: accent || 'currentColor', color: accent || undefined }}
                >
                  <CalendarPlus size={15} /> {t('detail.addToCalendar')}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm opacity-80">
                {ev.schedules?.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={15} /> {timeLabel(ev.schedules)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  {ev.eventType === 'ONLINE' ? <Wifi size={15} /> : <MapPin size={15} />}
                  {ev.eventType === 'ONLINE' ? t('common.online') : t('common.offline')}
                </span>
              </div>

              {venue && (
                <a
                  href={venue.googleMapsURI || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-start gap-1.5 text-sm opacity-80 hover:opacity-100"
                >
                  <MapPin size={15} className="mt-0.5 shrink-0" />
                  <span>
                    {venue.title && <b>{venue.title} · </b>}
                    {venue.displayText}
                    {venue.googleMapsURI && <ExternalLink size={12} className="ml-1 inline" />}
                  </span>
                </a>
              )}

              {ev.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ev.tags.map((t) => (
                    <span key={t} className="rounded-full bg-black/[0.06] px-2.5 py-1 text-xs opacity-80 dark:bg-white/10">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {ev.description ? (
                <div className="prose-4s mt-6 max-w-none text-[15px] opacity-95" dangerouslySetInnerHTML={{ __html: ev.description }} />
              ) : (
                <p className="mt-6 opacity-60">{t('detail.noDescription')}</p>
              )}

              <div className="mt-6 lg:hidden">
                <Registration ev={ev} />
              </div>
            </article>

            <aside className="hidden space-y-6 lg:block">
              <Registration ev={ev} />
              <Organizers ev={ev} />
            </aside>
          </div>

          {/* 议程 + 嘉宾(大会型活动有 sessions/stages/speakers 时显示) */}
          <div className="mx-auto max-w-[1200px] px-4 pb-10">
            <EventProgram ev={ev} />
          </div>
        </main>
      )}
      <Footer />
    </div>
  )
}
