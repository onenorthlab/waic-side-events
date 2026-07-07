import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useAttendee } from '../lib/attendee-context'
import { detailDateLabel } from '../lib/format'
import { CoverFallback, BrandDot } from '../components/EventCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import { Ticket, LogOut, MailCheck, MapPin, Wifi, CheckCircle2, ScanLine, QrCode, Heart, Star } from 'lucide-react'
import { useI18n } from '../lib/i18n'

interface MyRegistration {
  id: string
  eventId: string
  status: string
  type: string
  checkedIn: boolean
  createdAt: string | null
  ticketUrl: string | null
  event: {
    slug: string
    title: string
    schedules: any[]
    location: any[] | null
    eventType: string
    thumbnailUrl: string | null
    mainImageUrl: string | null
    hasEnded: boolean
  }
}

const STATUS_STYLE: Record<string, { key: string; cls: string }> = {
  APPROVED: { key: 'me.statusApproved', cls: 'bg-emerald-600 text-white' },
  PENDING: { key: 'me.statusPending', cls: 'bg-live text-white' },
  REJECTED: { key: 'me.statusRejected', cls: 'bg-neutral-400 text-white dark:bg-neutral-600' },
  CANCELLED: { key: 'me.statusCancelled', cls: 'bg-neutral-400 text-white dark:bg-neutral-600' },
}

export function MePage() {
  const { email, loading } = useAttendee()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pb-12 pt-8 md:pt-12">
        {loading ? (
          <div className="mt-8 h-48 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/10" />
        ) : email ? (
          <MyRegistrations />
        ) : (
          <LoginCard />
        )}
      </main>
      <Footer />
    </div>
  )
}

function LoginCard() {
  const { t } = useI18n()
  const { requestOtp, verify } = useAttendee()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const h = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(h)
  }, [cooldown])

  const send = async () => {
    if (!email.includes('@')) {
      toast.error(t('me.invalidEmail'))
      return
    }
    setBusy(true)
    try {
      const { devCode } = await requestOtp(email)
      setSent(true)
      setCooldown(60)
      if (devCode) {
        setCode(devCode)
        toast.info(t('me.devCodeAutofill', { code: devCode }))
      } else {
        toast.success(t('me.codeSent'))
      }
    } catch (e: any) {
      toast.error(e.message || t('me.sendFailed'))
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await verify(email, code)
      toast.success(t('me.loginSuccess'))
    } catch (err: any) {
      toast.error(err.message || t('me.verifyFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-md">
      <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">{t('me.title')}</h1>
      <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">
        {t('me.loginSubtitle')}
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-card dark:border-white/10 dark:bg-neutral-900">
        <div className="space-y-2">
          <Label htmlFor="me-email">{t('me.email')}</Label>
          <div className="flex gap-2">
            <Input
              id="me-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('me.emailPlaceholder')}
              className="flex-1"
              required
            />
            <Button type="button" variant="outline" className="shrink-0 rounded-full" onClick={send} disabled={busy || cooldown > 0}>
              {cooldown > 0 ? `${cooldown}s` : sent ? t('me.resend') : t('me.sendCode')}
            </Button>
          </div>
        </div>
        {sent && (
          <div className="space-y-2">
            <Label htmlFor="me-code">{t('me.code')}</Label>
            <Input
              id="me-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder={t('me.codePlaceholder')}
              maxLength={6}
              inputMode="numeric"
              className="font-mono tracking-[0.3em]"
              required
            />
          </div>
        )}
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy || !sent || code.length < 6}>
          <MailCheck size={16} className="mr-1.5" /> {t('me.login')}
        </Button>
      </form>
    </div>
  )
}

function MyRegistrations() {
  const { t } = useI18n()
  const { email, logout } = useAttendee()
  const [regs, setRegs] = useState<MyRegistration[] | null>(null)

  useEffect(() => {
    fetch('/api/attendee/registrations')
      .then((r) => r.json())
      .then((d) => setRegs(d.registrations || []))
      .catch(() => setRegs([]))
  }, [])

  const upcoming = (regs || []).filter((r) => !r.event.hasEnded)
  const past = (regs || []).filter((r) => r.event.hasEnded)

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">{t('me.myRegistrations')}</h1>
          <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">{email}</p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-1 rounded-full border border-black/12 px-3.5 py-1.5 text-xs font-medium text-ink/60 transition hover:text-ink dark:border-white/20 dark:text-white/60 dark:hover:text-white"
        >
          <LogOut size={13} /> {t('me.logout')}
        </button>
      </div>

      <PersonalCode />

      {regs === null ? (
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/10" />
          ))}
        </div>
      ) : regs.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white py-16 text-center shadow-card dark:border-white/10 dark:bg-neutral-900">
          <p className="text-sm text-ink/55 dark:text-white/55">{t('me.noRegistrationsYet')}</p>
          <Link to="/events" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
            {t('me.browseEvents')}
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {upcoming.length > 0 && <RegGroup title={t('me.upcoming')} items={upcoming} />}
          {past.length > 0 && <RegGroup title={t('me.past')} items={past} dim />}
        </div>
      )}

      <MyBookmarks />
    </div>
  )
}

/** 一人一码：所有活动通用的个人入场码（现场也可作名片交换） */
function PersonalCode() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [qr, setQr] = useState('')

  const load = async () => {
    if (qr) {
      setOpen((o) => !o)
      return
    }
    try {
      const res = await fetch('/api/attendee/personal-code')
      const d = await res.json()
      if (!res.ok) throw new Error()
      const url = await QRCode.toDataURL(d.token, { margin: 1, width: 400, color: { dark: '#17181c', light: '#ffffff' } })
      setQr(url)
      setOpen(true)
    } catch {
      toast.error(t('me.getEntryCodeFailed'))
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-brand/15 bg-brand-50 shadow-card dark:border-brand/30 dark:bg-brand/10">
      <button onClick={load} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
          <QrCode size={20} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-ink dark:text-white">{t('me.myEntryCode')}</span>
          <span className="block text-xs text-ink/55 dark:text-white/55">{t('me.entryCodeHint')}</span>
        </span>
        <span className="text-xs font-semibold text-brand">{open ? t('me.collapse') : t('me.show')}</span>
      </button>
      {open && qr && (
        <div className="flex flex-col items-center gap-2 border-t border-brand/10 bg-white pb-6 pt-4 dark:bg-neutral-900">
          <img src={qr} alt={t('me.entryCodeAlt')} className="h-52 w-52" />
          <p className="text-xs text-ink/45 dark:text-white/45">{t('me.entryCodeShowStaffHint')}</p>
        </div>
      )}
    </div>
  )
}

interface BookmarkItem {
  eventId: string
  slug: string
  title: string
  schedules: any[]
  location: any[] | null
  eventType: string
  thumbnailUrl: string | null
  mainImageUrl: string | null
  hasEnded: boolean
}

function MyBookmarks() {
  const { t } = useI18n()
  const [items, setItems] = useState<BookmarkItem[] | null>(null)

  useEffect(() => {
    fetch('/api/attendee/bookmarks')
      .then((r) => r.json())
      .then((d) => setItems(d.bookmarks || []))
      .catch(() => setItems([]))
  }, [])

  if (!items || items.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
        <Heart size={13} className="fill-brand text-brand" />
        {t('me.myBookmarks')}
        <span className="font-normal text-ink/40 dark:text-white/40">{items.length}</span>
      </h2>
      <div className="mt-2 flex flex-col gap-2.5">
        {items.map((b) => {
          const cover = b.thumbnailUrl || b.mainImageUrl
          return (
            <Link
              key={b.eventId}
              to="/$slug"
              params={{ slug: b.slug }}
              className="flex gap-4 rounded-2xl border border-black/[0.05] bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover dark:border-white/[0.07] dark:bg-neutral-900"
            >
              <div className="relative aspect-[4/3] w-20 shrink-0 self-center overflow-hidden rounded-xl">
                {cover ? (
                  <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <CoverFallback title={b.title} className="absolute inset-0" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <p className="line-clamp-2 text-sm font-semibold text-ink dark:text-white">{b.title}</p>
                <p className="text-xs font-medium text-brand">{detailDateLabel(b.schedules)}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function RegGroup({ title, items, dim }: { title: string; items: MyRegistration[]; dim?: boolean }) {
  const { t } = useI18n()
  return (
    <section>
      <h2 className="flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
        <BrandDot />
        {title}
        <span className="font-normal text-ink/40 dark:text-white/40">{items.length}</span>
      </h2>
      <div className={`mt-2 flex flex-col gap-2.5 ${dim ? 'opacity-70' : ''}`}>
        {items.map((r) => {
          const st = STATUS_STYLE[r.status] || STATUS_STYLE.PENDING
          const cover = r.event.thumbnailUrl || r.event.mainImageUrl
          const venue = r.event.location?.[0]
          return (
            <div
              key={r.id}
              className="flex gap-4 rounded-2xl border border-black/[0.05] bg-white p-3 shadow-card dark:border-white/[0.07] dark:bg-neutral-900 sm:p-4"
            >
              <Link to="/$slug" params={{ slug: r.event.slug }} className="relative aspect-[4/3] w-24 shrink-0 self-center overflow-hidden rounded-xl sm:w-32">
                {cover ? (
                  <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <CoverFallback title={r.event.title} className="absolute inset-0" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{t(st.key)}</span>
                  {r.type === 'STAFF' && (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-white dark:text-ink">{t('me.staffTag')}</span>
                  )}
                  {r.type === 'SPEAKER' && (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">{t('me.speakerTag')}</span>
                  )}
                  {r.checkedIn && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 size={12} /> {t('me.checkedIn')}
                    </span>
                  )}
                </div>
                <Link
                  to="/$slug"
                  params={{ slug: r.event.slug }}
                  className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink hover:text-brand dark:text-white"
                >
                  {r.event.title}
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/55 dark:text-white/55">
                  <span className="font-medium text-brand">{detailDateLabel(r.event.schedules)}</span>
                  <span className="inline-flex min-w-0 items-center gap-1">
                    {r.event.eventType === 'ONLINE' ? <Wifi size={12} /> : <MapPin size={12} />}
                    <span className="truncate">{r.event.eventType === 'ONLINE' ? t('common.online') : venue?.title || venue?.displayText || t('common.offline')}</span>
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {r.ticketUrl && (
                    <a
                      href={r.ticketUrl}
                      className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 active:scale-[0.97]"
                    >
                      <Ticket size={13} /> {t('me.eTicket')}
                    </a>
                  )}
                  {r.type === 'STAFF' && r.status === 'APPROVED' && !r.event.hasEnded && (
                    <Link
                      to="/staff/$id/checkin"
                      params={{ id: r.eventId }}
                      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-50 active:scale-[0.97]"
                    >
                      <ScanLine size={13} /> {t('me.staffCheckinConsole')}
                    </Link>
                  )}
                  {r.status === 'APPROVED' && r.event.hasEnded && (
                    <Link
                      to="/feedback/$eventId"
                      params={{ eventId: r.eventId }}
                      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-50 active:scale-[0.97]"
                    >
                      <Star size={13} /> {t('me.writeFeedback')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
