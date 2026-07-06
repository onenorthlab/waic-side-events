import { useMemo, useState } from 'react'
import type { EventItem } from '../lib/types'
import { ChevronDown, X } from 'lucide-react'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function EventCalendar({
  events,
  selectedDate,
  onSelectDate,
}: {
  events: EventItem[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}) {
  const today = new Date()
  const [current, setCurrent] = useState(startOfMonth(today))
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  const year = current.getFullYear()
  const month = current.getMonth()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const startOffset = new Date(year, month, 1).getDay()

  const prevMonthDays = new Date(year, month, 0).getDate()
  const prevDays = Array.from({ length: startOffset }, (_, i) => prevMonthDays - startOffset + i + 1)
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)
  const endOffset = (7 - ((startOffset + totalDays) % 7)) % 7
  const nextDays = Array.from({ length: endOffset }, (_, i) => i + 1)

  const { counts, selected } = useMemo(() => {
    const counts = new Map<number, number>()
    let selectedDay: number | null = null
    for (const ev of events) {
      for (const s of ev.schedules || []) {
        if (!s.date) continue
        const d = new Date(s.date + 'T00:00:00')
        if (Number.isNaN(d.getTime())) continue
        if (d.getFullYear() === year && d.getMonth() === month) {
          counts.set(d.getDate(), (counts.get(d.getDate()) || 0) + 1)
        }
        if (selectedDate && d.toISOString().slice(0, 10) === selectedDate) {
          selectedDay = d.getDate()
        }
      }
    }
    return { counts, selected: selectedDay }
  }, [events, selectedDate, year, month])

  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) {
      const next = day > 20 ? addMonths(current, -1) : addMonths(current, 1)
      setCurrent(startOfMonth(next))
      const y = next.getFullYear()
      const m = next.getMonth()
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      onSelectDate(dateStr)
      return
    }
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (selectedDate === dateStr) {
      onSelectDate(null)
    } else {
      onSelectDate(dateStr)
    }
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-bold text-ink dark:text-white">日期</h4>
        <div className="relative flex items-center gap-1">
          <button
            onClick={() => setCurrent(addMonths(current, -1))}
            className="rounded p-1 text-ink/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            onClick={() => setShowMonthPicker((s) => !s)}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/10"
          >
            {current.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
            <ChevronDown size={14} />
          </button>
          {showMonthPicker && (
            <div className="absolute right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-neutral-800">
              {Array.from({ length: 24 }).map((_, i) => {
                const d = addMonths(startOfMonth(today), i - 12)
                const label = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrent(d)
                      setShowMonthPicker(false)
                    }}
                    className="block w-full rounded px-3 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
          <button
            onClick={() => setCurrent(addMonths(current, 1))}
            className="rounded p-1 text-ink/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
        {weekdayLabels.map((l, i) => (
          <div key={i} className={`text-xs font-medium ${i === 0 ? 'text-red-500' : 'text-ink/50 dark:text-white/50'}`}>
            {l}
          </div>
        ))}

        {prevDays.map((day) => (
          <DayCell key={`prev-${day}`} day={day} muted onClick={() => handleDayClick(day, false)} />
        ))}
        {days.map((day) => {
          const count = counts.get(day) || 0
          const isSelected = selected === day && selectedDate != null
          const isToday = isSameDay(today, new Date(year, month, day))
          return (
            <DayCell
              key={day}
              day={day}
              count={count}
              selected={isSelected}
              today={isToday}
              onClick={() => handleDayClick(day, true)}
            />
          )
        })}
        {nextDays.map((day) => (
          <DayCell key={`next-${day}`} day={day} muted onClick={() => handleDayClick(day, false)} />
        ))}
      </div>

      {selectedDate && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onSelectDate(null)}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
          >
            <X size={12} /> 清除选择
          </button>
        </div>
      )}
    </div>
  )
}

function DayCell({
  day,
  count,
  selected,
  today,
  muted,
  onClick,
}: {
  day: number
  count?: number
  selected?: boolean
  today?: boolean
  muted?: boolean
  onClick: () => void
}) {
  if (muted) {
    return (
      <button
        onClick={onClick}
        className="flex h-7 w-7 items-center justify-center text-ink/30 dark:text-white/30"
      >
        {day}
      </button>
    )
  }
  const hasEvents = (count || 0) > 0
  const base =
    'flex h-7 w-7 items-center justify-center rounded-full text-sm transition'
  if (selected) {
    return (
      <button
        onClick={onClick}
        title={`${count} 个活动`}
        className={`${base} bg-brand-600 font-semibold text-white hover:bg-brand-700`}
      >
        {day}
      </button>
    )
  }
  if (hasEvents) {
    return (
      <button
        onClick={onClick}
        title={`${count} 个活动`}
        className={`${base} border-2 border-brand-600 font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20`}
      >
        {day}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className={`${base} text-ink/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10 ${today ? 'font-bold text-brand-600' : ''}`}
    >
      {day}
    </button>
  )
}
