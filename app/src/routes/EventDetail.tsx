import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { fetchEvent } from '../lib/api'
import type { EventItem } from '../lib/types'
import { detailDateLabel, timeLabel, isLiveToday } from '../lib/format'
import { downloadIcs } from '../lib/ics'
import { EventProgram } from '../components/EventProgram'
import { EventContent } from '../components/EventContent'
import { LiveBadge } from '../components/EventCard'
import { useI18n } from '../lib/i18n'
import { useAttendee } from '../lib/attendee-context'
import { CalendarPlus, Clock, MapPin, Wifi, ArrowLeft, ExternalLink, CheckCircle, Users, ShieldCheck } from 'lucide-react'
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
      <h3 className="text-sm font-bold text-ink dark:text-white">{t('detail.organizers')}</h3>
      {uniq.slice(0, 8).map((x, i) => {
        const u = x.user || x.community
        const name = x.user ? u.nativeName || [u.firstName, u.lastName].filter(Boolean).join(' ') : u.name
        const img = x.user ? u.avatarUrl : u.logoUrl || u.iconUrl
        return (
          <div key={u.id || i} className="flex items-center gap-2.5">
            {img ? (
              <img src={img} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand dark:bg-white/10 dark:text-white">
                {(name || 'O').slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink dark:text-white">{name || '主办方'}</div>
              {x.user?.title && <div className="truncate text-xs text-ink/50 dark:text-white/50">{u.title}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function useRegistration(ev: EventItem) {
  const { email: attendeeEmail } = useAttendee()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  useEffect(() => {
    if (attendeeEmail) setEmail((prev) => prev || attendeeEmail)
  }, [attendeeEmail])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ status: string; ticketUrl?: string } | null>(null)
  const hasSurvey = Array.isArray(ev.surveySchema) && ev.surveySchema.length > 0
  const [surveyModel] = useState(() => (hasSurvey ? new Model({ elements: ev.surveySchema }) : null))

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
      if (!res.ok) {
        const msg =
          data.error === 'already_registered' ? '该邮箱已报名过本活动' : data.error === 'sold_out' ? '名额已满' : '报名失败，请稍后重试'
        throw new Error(msg)
      }
      setResult({ status: data.status, ticketUrl: data.ticketUrl })
      toast.success(data.status === 'APPROVED' ? '报名成功' : '报名已提交，等待主办方审核')
    } catch (err: any) {
      toast.error(err.message || '报名失败')
    } finally {
      setSubmitting(false)
    }
  }

  return { open, setOpen, name, setName, email, setEmail, submitting, result, submit, hasSurvey, surveyModel }
}

function RegistrationDialog({ ev, reg }: { ev: EventItem; reg: ReturnType<typeof useRegistration> }) {
  return (
    <Dialog open={reg.open} onOpenChange={reg.setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug">报名 · {ev.title}</DialogTitle>
        </DialogHeader>
        {reg.result ? (
          <div className="py-6 text-center">
            <CheckCircle size={44} className="mx-auto text-brand" />
            <p className="mt-4 font-semibold text-ink dark:text-white">
              {reg.result.status === 'APPROVED' ? '报名成功' : '已提交，等待审核'}
            </p>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">
              {reg.result.status === 'APPROVED'
                ? '确认邮件已发送。凭邮件中的电子票入场。'
                : '审核通过后会通过邮件通知你，并附上电子票。'}
            </p>
            {reg.result.ticketUrl && (
              <a
                href={reg.result.ticketUrl}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                查看电子票
              </a>
            )}
            <div className="mt-4">
              <Button variant="outline" onClick={() => reg.setOpen(false)}>
                关闭
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={reg.submit} className="space-y-4">
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input value={reg.name} onChange={(e) => reg.setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input type="email" value={reg.email} onChange={(e) => reg.setEmail(e.target.value)} required />
              <p className="text-xs text-ink/45 dark:text-white/45">电子票和活动通知会发送到这个邮箱</p>
            </div>
            {reg.hasSurvey && reg.surveyModel && (
              <div className="rounded-xl border border-black/[0.08] p-3 dark:border-white/12">
                <Survey model={reg.surveyModel} />
              </div>
            )}
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={reg.submitting}>
              {reg.submitting ? '提交中…' : '确认报名'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {state === 'loading' && <DetailSkeleton />}
      {state === 'notfound' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
          <p className="text-ink/60 dark:text-white/60">{t('events.notFound')}</p>
          <Link to="/events" className="text-sm font-semibold text-brand hover:underline">
            {t('events.backToList')}
          </Link>
        </div>
      )}
      {state === 'ok' && ev && <DetailBody ev={ev} />}
      <Footer />
    </div>
  )
}

function DetailBody({ ev }: { ev: EventItem }) {
  const { t } = useI18n()
  const reg = useRegistration(ev)
  const venue = ev.location?.[0]
  const accent = ev.customStyle?.primaryColor
  const ended = !!ev.hasEnded

  const registerCta = (
    <button
      onClick={() => reg.setOpen(true)}
      disabled={ended}
      className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      style={accent ? { backgroundColor: accent } : undefined}
    >
      {ended ? '活动已结束' : reg.result ? '已报名 ✓' : '立即报名'}
    </button>
  )

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-28 pt-6 lg:pb-10">
      <Link
        to="/events"
        className="inline-flex items-center gap-1 text-sm text-ink/50 transition hover:text-ink dark:text-white/50 dark:hover:text-white"
      >
        <ArrowLeft size={15} /> {t('nav.events')}
      </Link>

      {/* 海报：主办方自己设计的图完整呈现（模糊放大同图做衬底，letterbox 不显灰）；无图时用品牌化 hero，页面不塌陷 */}
      {ev.mainImageUrl ? (
        <div className="relative mt-4 overflow-hidden rounded-2xl shadow-card">
          <img src={ev.mainImageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl brightness-[0.72] saturate-[1.2]" />
          <img src={ev.mainImageUrl} alt={ev.title} className="relative mx-auto max-h-[520px] w-auto max-w-full object-contain" />
        </div>
      ) : (
        <div className="relative mt-4 flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-[#1e37cf] to-[#141f7a] p-6 shadow-card md:min-h-[280px] md:p-8">
          <svg className="absolute inset-0 h-full w-full opacity-[0.16]" aria-hidden="true">
            <defs>
              <pattern id="hero-dotgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.4" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-dotgrid)" />
          </svg>
          <span className="pointer-events-none absolute -right-4 -top-10 select-none text-[10rem] font-bold leading-none text-white/15">
            {(ev.title || 'W').trim().slice(0, 1)}
          </span>
          <p className="relative text-sm font-semibold text-white/85">{detailDateLabel(ev.schedules)}</p>
          <p className="relative mt-1 line-clamp-2 text-2xl font-bold leading-snug text-white md:text-3xl">{ev.title}</p>
        </div>
      )}

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
        <article>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand">
            {detailDateLabel(ev.schedules)}
            {isLiveToday(ev.schedules) && !ended && <LiveBadge />}
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-ink dark:text-white md:text-[32px]">
            {ev.title}
          </h1>
          {ev.catchphrase && <p className="mt-2 text-base text-ink/60 dark:text-white/60">{ev.catchphrase}</p>}

          {/* 关键信息卡：30 秒决策所需的一切 */}
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-card dark:border-white/10 dark:bg-neutral-900">
            {ev.schedules?.length > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-sm text-ink/80 dark:text-white/80">
                  <Clock size={16} className="shrink-0 text-ink/40 dark:text-white/40" />
                  {timeLabel(ev.schedules)}
                </span>
                <button
                  onClick={() => downloadIcs(ev)}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  <CalendarPlus size={13} /> {t('detail.addToCalendar')}
                </button>
              </div>
            )}
            {/* 线上参会入口：主办方填了 onlineUrl 就展示（线上活动的核心信息） */}
            {(ev.onlineUrl || ev.onlineDescription) && (
              <div className="flex items-start gap-2.5 text-sm text-ink/80 dark:text-white/80">
                <Wifi size={16} className="mt-0.5 shrink-0 text-ink/40 dark:text-white/40" />
                <span className="min-w-0">
                  {ev.onlineUrl && (
                    <a
                      href={ev.onlineUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                    >
                      进入线上会场 <ExternalLink size={12} />
                    </a>
                  )}
                  {ev.onlineDescription && <span className="block text-xs text-ink/50 dark:text-white/50">{ev.onlineDescription}</span>}
                </span>
              </div>
            )}
            <div className={`flex items-start gap-2.5 text-sm text-ink/80 dark:text-white/80 ${ev.eventType === 'ONLINE' && ev.onlineUrl ? 'hidden' : ''}`}>
              {ev.eventType === 'ONLINE' ? (
                <>
                  <Wifi size={16} className="mt-0.5 shrink-0 text-ink/40 dark:text-white/40" />
                  <span>{t('common.online')}</span>
                </>
              ) : (
                <>
                  <MapPin size={16} className="mt-0.5 shrink-0 text-ink/40 dark:text-white/40" />
                  <span>
                    {venue ? (
                      <>
                        {venue.title && <b className="font-semibold">{venue.title}</b>}
                        {venue.title && venue.displayText && ' · '}
                        {venue.displayText}
                        {venue.googleMapsURI && (
                          <a
                            href={venue.googleMapsURI}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-semibold text-brand hover:underline"
                          >
                            导航 <ExternalLink size={11} />
                          </a>
                        )}
                      </>
                    ) : (
                      t('common.offline')
                    )}
                  </span>
                </>
              )}
            </div>
            {(ev.maxParticipants || ev.requiresApproval) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50 dark:text-white/50">
                {ev.maxParticipants && (
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} /> 限 {ev.maxParticipants} 人
                  </span>
                )}
                {ev.requiresApproval && (
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck size={13} /> 报名需主办方审核
                  </span>
                )}
              </div>
            )}
          </div>

          {ev.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ev.tags.map((tg) => (
                <span
                  key={tg}
                  className="rounded-full bg-black/[0.05] px-2.5 py-1 text-xs text-ink/60 dark:bg-white/10 dark:text-white/60"
                >
                  {tg}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            {ev.description ? (
              <EventContent content={ev.description} format={ev.descriptionFormat} />
            ) : (
              <p className="text-ink/50 dark:text-white/50">{t('detail.noDescription')}</p>
            )}
          </div>
        </article>

        {/* 桌面右栏：报名 + 主办方 */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-5">
            {/* 报名卡：全页最重要动作，钴蓝浅底 + 更强投影，视觉权重高于信息卡 */}
            <div className="rounded-2xl border border-brand/15 bg-brand-50 p-5 shadow-card-hover dark:border-brand/30 dark:bg-brand/10">
              <p className="text-sm font-bold text-ink dark:text-white">报名参加</p>
              <p className="mt-1 text-xs text-ink/55 dark:text-white/55">
                {ev.requiresApproval ? '提交后等待主办方审核，通过后发电子票' : '免费报名，确认邮件附电子票'}
              </p>
              <div className="mt-4">{registerCta}</div>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-card dark:border-white/10 dark:bg-neutral-900">
              <Organizers ev={ev} />
              {(ev.organizerContact?.length ?? 0) > 0 && (
                <div className="mt-4 flex flex-col gap-1.5 border-t border-black/[0.06] pt-3 dark:border-white/10">
                  {ev.organizerContact!.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                    >
                      {c.label || c.url} <ExternalLink size={11} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* 议程 + 嘉宾 */}
      <div className="mt-10">
        <EventProgram ev={ev} />
      </div>

      {/* 移动端底部固定操作条 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.08] bg-white/92 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-bar backdrop-blur-md dark:border-white/12 dark:bg-neutral-900/92 lg:hidden">
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <button
            onClick={() => downloadIcs(ev)}
            aria-label={t('detail.addToCalendar')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/12 text-ink/70 transition active:scale-95 dark:border-white/20 dark:text-white/70"
          >
            <CalendarPlus size={18} />
          </button>
          <div className="flex-1">{registerCta}</div>
        </div>
      </div>

      <RegistrationDialog ev={ev} reg={reg} />
    </main>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-6">
      <div className="mt-4 aspect-[16/7] w-full animate-pulse rounded-2xl bg-black/[0.06] dark:bg-white/10" />
      <div className="mt-6 h-4 w-32 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
      <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
      <div className="mt-5 h-28 w-full animate-pulse rounded-2xl bg-black/[0.06] dark:bg-white/10 lg:w-2/3" />
    </div>
  )
}
