import { Link } from '@tanstack/react-router'
import { Clock, MapPin, Wifi } from 'lucide-react'
import type { EventItem } from '../lib/types'
import { timeLabel } from '../lib/format'
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
  return <div className={`${className} bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800`} />
}

function ModeBadge({ eventType }: { eventType: string }) {
  const { t } = useI18n()
  const online = eventType === 'ONLINE'
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink/60 dark:text-white/60">
      {online ? <Wifi size={13} /> : <MapPin size={13} />}
      {online ? t('common.online') : t('common.offline')}
    </span>
  )
}

// 顶部 Pickup events —— 大横幅卡
export function PickupCard({ ev }: { ev: EventItem }) {
  return (
    <Link
      to="/$slug"
      params={{ slug: ev.slug }}
      className="group relative block aspect-[16/7] overflow-hidden rounded-xl bg-neutral-900"
    >
      <CoverImg ev={ev} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="line-clamp-2 text-lg font-bold text-white drop-shadow">{ev.title}</h3>
      </div>
    </Link>
  )
}

// 列表行
export function EventRow({ ev }: { ev: EventItem }) {
  return (
    <Link
      to="/$slug"
      params={{ slug: ev.slug }}
      className="group flex gap-4 rounded-xl p-2 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
    >
      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800 sm:w-52">
        <CoverImg ev={ev} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink group-hover:text-brand-600 dark:text-white">
          {ev.title}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {ev.schedules?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-ink/60 dark:text-white/60">
              <Clock size={13} /> {timeLabel(ev.schedules)}
            </span>
          )}
          <ModeBadge eventType={ev.eventType} />
        </div>
        {ev.tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ev.tags.slice(0, 6).map((t) => (
              <span
                key={t}
                className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] text-ink/70 dark:bg-white/10 dark:text-white/70"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
