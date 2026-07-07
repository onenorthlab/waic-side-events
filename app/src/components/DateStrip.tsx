import { useEffect, useState } from 'react'
import { shortDateLabel } from '../lib/format'
import { useI18n } from '../lib/i18n'

/**
 * 会期日期条：WAIC 是一周内的活动集群，「哪天有什么局」是参会者的第一心智，
 * 所以日期是首要筛选轴（而不是通用月历）。横向滚动，移动端单手可刷。
 */
export function DateStrip({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string | null
  onSelectDate: (d: string | null) => void
}) {
  const { t } = useI18n()
  const [dates, setDates] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/events/counts-by-date')
      .then((r) => r.json())
      .then((d) => setDates(d.dates || []))
      .catch(() => {})
  }, [])

  if (!dates.length) return null

  const base =
    'flex shrink-0 flex-col items-center rounded-xl border px-3.5 py-2 leading-none shadow-card transition active:scale-[0.97]'
  const idle =
    'border-black/[0.08] bg-white text-ink/70 hover:border-black/20 dark:border-white/12 dark:bg-neutral-900 dark:text-white/70 dark:hover:border-white/30'
  const active = 'border-brand bg-brand text-white shadow-card-hover dark:border-brand dark:bg-brand dark:text-white'

  return (
    <div className="-mx-4 overflow-x-auto px-4 scrollbar-none">
      <div className="flex gap-2 pb-1">
        <button
          onClick={() => onSelectDate(null)}
          className={`${base} justify-center ${selectedDate === null ? active : idle}`}
        >
          <span className="text-sm font-semibold">{t('dateStrip.all')}</span>
        </button>
        {dates.map((d) => {
          const { md, wd } = shortDateLabel(d)
          const isActive = selectedDate === d
          return (
            <button key={d} onClick={() => onSelectDate(isActive ? null : d)} className={`${base} ${isActive ? active : idle}`}>
              <span className="text-sm font-bold tabular-nums">{md}</span>
              <span className={`mt-1 text-[11px] ${isActive ? 'opacity-70' : 'opacity-50'}`}>{wd}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
