import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import { EventCalendar } from './EventCalendar'
import { MiniEventMap } from './MiniEventMap'
import type { EventItem } from '../lib/types'

export function FilterSidebar({
  tags,
  selectedTag,
  q,
  onTag,
  onQ,
  events,
  selectedDate,
  onSelectDate,
}: {
  tags: string[]
  selectedTag: string
  q: string
  onTag: (t: string) => void
  onQ: (v: string) => void
  events: EventItem[]
  selectedDate: string | null
  onSelectDate: (d: string | null) => void
}) {
  const { t } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? tags : tags.slice(0, 12)

  return (
    <aside className="flex w-full flex-col gap-5">
      {/* 地图概览 */}
      <MiniEventMap />

      {/* 活动日历 */}
      <EventCalendar events={events} selectedDate={selectedDate} onSelectDate={onSelectDate} />

      {/* Keyword */}
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-ink dark:text-white">{t('filter.keyword')}</h4>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={q}
            onChange={(e) => onQ(e.target.value)}
            placeholder={t('filter.searchEvents')}
            className="w-full rounded-lg border border-black/12 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-brand dark:border-white/15 dark:bg-neutral-900"
          />
          {q && (
            <button onClick={() => onQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Tag */}
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold text-ink dark:text-white">{t('filter.tag')}</h4>
        <div className="flex flex-wrap gap-1.5">
          {shown.map((t) => {
            const active = selectedTag === t
            return (
              <button
                key={t}
                onClick={() => onTag(active ? '' : t)}
                className={
                  'rounded-full border px-2.5 py-1 text-xs transition ' +
                  (active
                    ? 'border-brand bg-brand/15 font-semibold text-brand-600'
                    : 'border-black/12 text-ink/70 hover:border-black/25 dark:border-white/15 dark:text-white/70')
                }
              >
                #{t}
              </button>
            )
          })}
        </div>
        {tags.length > 12 && (
          <button
            onClick={() => setShowAll((s) => !s)}
            className="self-start text-xs font-medium text-brand-600 hover:underline"
          >
            {showAll ? t('common.showLess') : `${t('common.showMore')} (${tags.length - 12})`}
          </button>
        )}
      </div>
    </aside>
  )
}
