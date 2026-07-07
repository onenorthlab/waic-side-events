import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Clock, MapPin, Wifi } from 'lucide-react'
import type { EventItem } from '../lib/types'
import { timeLabel, detailDateLabel, isLiveToday } from '../lib/format'
import { useI18n } from '../lib/i18n'

const cover = (ev: EventItem) => ev.thumbnailUrl || ev.mainImageUrl || null

/**
 * 品牌化图片兜底：钴蓝渐变 + 活动首字大排版 + 点阵母题。
 * 没图的活动也不寒酸，且加载失败时同样落到这里（不是留白）。
 */
export function CoverFallback({ title, className }: { title: string; className?: string }) {
  const glyph = (title || 'W').trim().slice(0, 1)
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-brand via-[#1e37cf] to-[#141f7a] ${className || ''}`}>
      <svg className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden="true">
        <defs>
          <pattern id="dotgrid" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.3" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>
      <span className="absolute -bottom-[0.18em] -right-[0.02em] select-none font-bold leading-none text-white/25 [font-size:5.5em]">
        {glyph}
      </span>
      <span className="absolute left-[7%] top-[10%] h-2 w-2 rounded-full bg-white/80" />
    </div>
  )
}

function CoverImg({ ev, className }: { ev: EventItem; className?: string }) {
  const src = cover(ev)
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <CoverFallback title={ev.title} className={className} />
  return <img src={src} alt="" loading="lazy" className={className} onError={() => setFailed(true)} />
}

export function LiveBadge() {
  const { t } = useI18n()
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-live px-2 py-0.5 text-[11px] font-semibold text-white">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      {t('card.live')}
    </span>
  )
}

/** 母题：钴蓝圆点（源自字标 "W." 的句点），用于分组标题/日期强调 */
export function BrandDot({ className }: { className?: string }) {
  return <span className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-brand ${className || ''}`} aria-hidden="true" />
}

function VenueLabel({ ev }: { ev: EventItem }) {
  const { t } = useI18n()
  const online = ev.eventType === 'ONLINE'
  const venue = ev.location?.[0]
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-xs text-ink/55 dark:text-white/55">
      {online ? <Wifi size={13} className="shrink-0" /> : <MapPin size={13} className="shrink-0" />}
      <span className="truncate">{online ? t('common.online') : venue?.title || venue?.displayText || t('common.offline')}</span>
    </span>
  )
}

// 置顶活动：编辑感大卡（文左图右，移动端上下堆叠）
export function FeaturedCard({ ev }: { ev: EventItem }) {
  return (
    <Link
      to="/$slug"
      params={{ slug: ev.slug }}
      className="group grid overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-black/12 hover:shadow-card-hover dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20 md:grid-cols-[1fr_1.1fr]"
    >
      <div className="order-2 flex flex-col justify-center gap-3 p-5 md:order-1 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand">
          <BrandDot />
          {detailDateLabel(ev.schedules)}
          {isLiveToday(ev.schedules) && !ev.hasEnded && <LiveBadge />}
        </div>
        <h3 className="text-xl font-bold leading-snug tracking-tight text-ink dark:text-white md:text-[26px]">
          {ev.title}
        </h3>
        {ev.catchphrase && <p className="line-clamp-2 text-sm text-ink/60 dark:text-white/60">{ev.catchphrase}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {ev.schedules?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-ink/55 dark:text-white/55">
              <Clock size={13} /> {timeLabel(ev.schedules)}
            </span>
          )}
          <VenueLabel ev={ev} />
        </div>
      </div>
      <div className="relative order-1 aspect-[16/9] overflow-hidden md:order-2 md:aspect-auto md:min-h-[240px]">
        <CoverImg ev={ev} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      </div>
    </Link>
  )
}

// 列表行：左内容右缩略图。默认态就是一张完整的卡（白底+轻影），不靠 hover 显形
export function EventRow({ ev }: { ev: EventItem }) {
  return (
    <Link
      to="/$slug"
      params={{ slug: ev.slug }}
      className="group flex gap-4 rounded-2xl border border-black/[0.05] bg-white p-3 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-black/10 hover:shadow-card-hover dark:border-white/[0.07] dark:bg-neutral-900 dark:hover:border-white/15 sm:p-4"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand">
          {ev.schedules?.[0]?.startTime && <span className="tabular-nums">{ev.schedules[0].startTime}</span>}
          {isLiveToday(ev.schedules) && !ev.hasEnded && <LiveBadge />}
        </div>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-ink group-hover:text-brand dark:text-white sm:text-base">
          {ev.title}
        </h3>
        <VenueLabel ev={ev} />
        {ev.tags?.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {ev.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] text-ink/60 dark:bg-white/10 dark:text-white/60"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="relative aspect-[4/3] w-28 shrink-0 self-center overflow-hidden rounded-xl sm:aspect-[16/10] sm:w-48">
        <CoverImg ev={ev} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
      </div>
    </Link>
  )
}
