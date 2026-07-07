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
import { Ticket, LogOut, MailCheck, MapPin, Wifi, CheckCircle2, ScanLine } from 'lucide-react'

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

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  APPROVED: { label: '已确认', cls: 'bg-emerald-600 text-white' },
  PENDING: { label: '审核中', cls: 'bg-live text-white' },
  REJECTED: { label: '未通过', cls: 'bg-neutral-400 text-white dark:bg-neutral-600' },
  CANCELLED: { label: '已取消', cls: 'bg-neutral-400 text-white dark:bg-neutral-600' },
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
      toast.error('请输入有效邮箱')
      return
    }
    setBusy(true)
    try {
      const { devCode } = await requestOtp(email)
      setSent(true)
      setCooldown(60)
      if (devCode) {
        setCode(devCode)
        toast.info(`本地开发模式：验证码 ${devCode} 已自动填入`)
      } else {
        toast.success('验证码已发送到邮箱')
      }
    } catch (e: any) {
      toast.error(e.message || '发送失败')
    } finally {
      setBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await verify(email, code)
      toast.success('登录成功')
    } catch (err: any) {
      toast.error(err.message || '验证失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-md">
      <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">我的</h1>
      <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">
        用报名时的邮箱登录，就能看到你所有的报名记录和电子票。无需注册、无需密码。
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-card dark:border-white/10 dark:bg-neutral-900">
        <div className="space-y-2">
          <Label htmlFor="me-email">邮箱</Label>
          <div className="flex gap-2">
            <Input
              id="me-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1"
              required
            />
            <Button type="button" variant="outline" className="shrink-0 rounded-full" onClick={send} disabled={busy || cooldown > 0}>
              {cooldown > 0 ? `${cooldown}s` : sent ? '重新发送' : '发验证码'}
            </Button>
          </div>
        </div>
        {sent && (
          <div className="space-y-2">
            <Label htmlFor="me-code">验证码</Label>
            <Input
              id="me-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="6 位数字"
              maxLength={6}
              inputMode="numeric"
              className="font-mono tracking-[0.3em]"
              required
            />
          </div>
        )}
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy || !sent || code.length < 6}>
          <MailCheck size={16} className="mr-1.5" /> 登录
        </Button>
      </form>
    </div>
  )
}

function MyRegistrations() {
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
          <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">我的报名</h1>
          <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">{email}</p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-1 rounded-full border border-black/12 px-3.5 py-1.5 text-xs font-medium text-ink/60 transition hover:text-ink dark:border-white/20 dark:text-white/60 dark:hover:text-white"
        >
          <LogOut size={13} /> 退出
        </button>
      </div>

      {regs === null ? (
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/10" />
          ))}
        </div>
      ) : regs.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white py-16 text-center shadow-card dark:border-white/10 dark:bg-neutral-900">
          <p className="text-sm text-ink/55 dark:text-white/55">这个邮箱还没有报名记录</p>
          <Link to="/events" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
            去看看有什么活动 →
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {upcoming.length > 0 && <RegGroup title="即将参加" items={upcoming} />}
          {past.length > 0 && <RegGroup title="已结束" items={past} dim />}
        </div>
      )}
    </div>
  )
}

function RegGroup({ title, items, dim }: { title: string; items: MyRegistration[]; dim?: boolean }) {
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
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                  {r.type === 'STAFF' && (
                    <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-white dark:text-ink">工作人员</span>
                  )}
                  {r.type === 'SPEAKER' && (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">嘉宾</span>
                  )}
                  {r.checkedIn && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 size={12} /> 已入场
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
                    <span className="truncate">{r.event.eventType === 'ONLINE' ? '线上' : venue?.title || venue?.displayText || '线下'}</span>
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {r.ticketUrl && (
                    <a
                      href={r.ticketUrl}
                      className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 active:scale-[0.97]"
                    >
                      <Ticket size={13} /> 电子票
                    </a>
                  )}
                  {r.type === 'STAFF' && r.status === 'APPROVED' && !r.event.hasEnded && (
                    <Link
                      to="/staff/$id/checkin"
                      params={{ id: r.eventId }}
                      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-50 active:scale-[0.97]"
                    >
                      <ScanLine size={13} /> 工作人员核销台
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
