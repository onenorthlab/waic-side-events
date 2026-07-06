import type { EventItem } from './types'

// 生成并下载 .ics —— "添加到日历" 客户端实现(无需登录)。基于 schedules(Asia/Shanghai 墙钟)。
function toDT(date: string, time: string): string {
  return date.replace(/-/g, '') + 'T' + (time || '00:00').replace(':', '') + '00'
}

export function downloadIcs(ev: EventItem) {
  const s = ev.schedules?.[0]
  if (!s) return
  const last = ev.schedules[ev.schedules.length - 1]
  const esc = (t: string) => (t || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  const plain = (ev.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://waic-side-events.ingle.workers.dev'
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WAIC Side Events//CN',
    'BEGIN:VEVENT',
    `UID:${ev.id}@waic-side-events`,
    `DTSTART;TZID=${ev.timezone || 'Asia/Shanghai'}:${toDT(s.date, s.startTime)}`,
    `DTEND;TZID=${ev.timezone || 'Asia/Shanghai'}:${toDT(last.date, last.endTime)}`,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(plain)}`,
    `URL:${origin}/${encodeURIComponent(ev.slug)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${ev.slug}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
