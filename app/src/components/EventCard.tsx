import { Link } from '@tanstack/react-router'
import { Clock, MapPin, Wifi } from 'lucide-react'
import type { EventItem } from '../lib/types'
import { timeLabel, detailDateLabel, isLiveToday } from '../lib/format'
import { useI18n } from '../lib/i18n'

const cover = (ev: EventItem) => ev.thumbnailUrl || ev.mainImageUrl || null

function CoverImg({ ev, className }: { ev: EventItem; className?: string }) {
  const src = cover(ev)
  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className={className}
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
        }}
      />
    )
  }
  return <div className={`${className} bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700`} />
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-live px-2 py-0.5 text-[11px] font-semibold text-white">
      进行中
    </span>
  )
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
      className="group grid overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition hover:border-black/15 hover:shadow-[0_8px_32px_rgb(23_24_28/0.08)] dark:border-white/10 dark:bg-neutral-900 dark:hover:border-white/20 md:grid-cols-[1fr_1.1fr]"
    >
      <div className="order-2 flex flex-col justify-center gap-3 p-5 md:order-1 md:p-8">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand">
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

// 列表行：左内容右缩略图（微信文章列表心智），移动端一等公民
export function EventRow({ ev }: { ev: EventItem }) {
  return (
    <Link
      to="/$slug"
      params={{ slug: ev.slug }}
      className="group flex gap-4 rounded-2xl border border-transparent p-3 transition hover:border-black/[0.07] hover:bg-white dark:hover:border-white/10 dark:hover:bg-neutral-900 sm:p-4"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand">
          {ev.schedules?.[0]?.startTime && <span>{ev.schedules[0].startTime}</span>}
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
      <div className="relative aspect-[4/3] w-28 shrink-0 self-center overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 sm:aspect-[16/10] sm:w-48">
        <CoverImg ev={ev} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
      </div>
    </Link>
  )
}
