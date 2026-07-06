import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import QRCode from 'qrcode'
import { BrandMark } from '../components/Brand'
import { detailDateLabel, timeLabel } from '../lib/format'
import { CheckCircle, Clock3, MapPin } from 'lucide-react'

interface TicketData {
  participant: { name: string; status: string; type: string; checkedIn: boolean; checkedInAt: string | null; code: string }
  event: { title: string; slug: string; schedules: any[]; location: any[]; eventType: string; mainImageUrl: string | null }
}

/** 电子票：报名者凭邮件链接打开，现场出示二维码。单手出示场景，暗底高对比。 */
export function TicketPage() {
  const { token } = useParams({ from: '/ticket/$token' })
  const [data, setData] = useState<TicketData | null>(null)
  const [qr, setQr] = useState('')
  const [state, setState] = useState<'loading' | 'ok' | 'invalid'>('loading')

  useEffect(() => {
    let alive = true
    fetch(`/api/ticket/${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!alive) return
        setData(d)
        setState('ok')
        return QRCode.toDataURL(token, { margin: 1, width: 480, color: { dark: '#17181c', light: '#ffffff' } })
      })
      .then((url) => alive && url && setQr(url))
      .catch(() => alive && setState('invalid'))
    return () => {
      alive = false
    }
  }, [token])

  const venue = data?.event.location?.[0]
  const approved = data?.participant.status === 'APPROVED'

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-ink px-4 py-8 dark:bg-[#0e0e11]">
      <Link to="/events" className="flex items-center gap-2 text-white/80 transition hover:text-white">
        <BrandMark size={22} />
        <span className="text-sm font-semibold">WAIC Side Events</span>
      </Link>

      {state === 'loading' && <div className="mt-24 h-72 w-full max-w-sm animate-pulse rounded-3xl bg-white/10" />}

      {state === 'invalid' && (
        <div className="mt-24 text-center">
          <p className="text-white/85">票码无效或已失效</p>
          <Link to="/events" className="mt-3 inline-block text-sm font-semibold text-white underline underline-offset-4">
            返回活动列表
          </Link>
        </div>
      )}

      {state === 'ok' && data && (
        <div className="mt-8 w-full max-w-sm overflow-hidden rounded-3xl bg-white text-ink shadow-2xl">
          <div className="px-6 pb-4 pt-6">
            <p className="text-xs font-semibold text-brand">电子票 · {data.participant.code}</p>
            <h1 className="mt-1.5 text-lg font-bold leading-snug">{data.event.title}</h1>
            <div className="mt-3 flex flex-col gap-1.5 text-sm text-ink/70">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} className="shrink-0 text-ink/40" />
                {detailDateLabel(data.event.schedules)}
                {timeLabel(data.event.schedules) && ` · ${timeLabel(data.event.schedules)}`}
              </span>
              {venue && (
                <span className="inline-flex items-start gap-1.5">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-ink/40" />
                  {venue.title || venue.displayText}
                </span>
              )}
            </div>
          </div>

          {/* 撕票线 */}
          <div className="relative flex items-center">
            <div className="absolute -left-3 h-6 w-6 rounded-full bg-ink dark:bg-[#0e0e11]" />
            <div className="mx-5 h-0 flex-1 border-t-2 border-dashed border-ink/15" />
            <div className="absolute -right-3 h-6 w-6 rounded-full bg-ink dark:bg-[#0e0e11]" />
          </div>

          <div className="flex flex-col items-center px-6 pb-7 pt-4">
            <p className="text-sm font-semibold">{data.participant.name}</p>
            {approved ? (
              data.participant.checkedIn ? (
                <div className="mt-4 flex flex-col items-center gap-2 py-8">
                  <CheckCircle size={44} className="text-brand" />
                  <p className="font-semibold">已入场</p>
                  {data.participant.checkedInAt && (
                    <p className="text-xs text-ink/50">{new Date(data.participant.checkedInAt).toLocaleString('zh-CN')}</p>
                  )}
                </div>
              ) : (
                <>
                  {qr && <img src={qr} alt="入场二维码" className="mt-3 h-56 w-56" />}
                  <p className="mt-2 text-center text-xs text-ink/50">
                    入场时向工作人员出示此二维码
                    <br />
                    扫码不便时报短码：<b className="font-mono text-ink">{data.participant.code}</b>
                  </p>
                </>
              )
            ) : (
              <div className="mt-4 rounded-xl bg-live/10 px-4 py-3 text-center text-sm text-ink/75">
                {data.participant.status === 'PENDING' ? '报名审核中，通过后此页面会显示入场二维码' : '报名未通过或已取消'}
              </div>
            )}
          </div>
        </div>
      )}

      {state === 'ok' && data && (
        <Link to="/$slug" params={{ slug: data.event.slug }} className="mt-5 text-sm text-white/60 transition hover:text-white">
          查看活动详情 →
        </Link>
      )}
    </div>
  )
}
