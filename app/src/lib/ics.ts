import type { EventItem } from './types'

// 生成并下载 .ics —— "Add to Calendar" 真实客户端实现(无需登录)。基于 schedules(JST 墙钟)。
function toDT(date: string, time: string): string {
  return date.replace(/-/g, '') + 'T' + (time || '00:00').replace(':', '') + '00'
}

export function downloadIcs(ev: EventItem) {
  const s = ev.schedules?.[0]
  if (!s) return
  const last = ev.schedules[ev.schedules.length - 1]
  const esc = (t: string) => (t || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  const plain = (ev.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//4S Events//EN',
    'BEGIN:VEVENT',
    `UID:${ev.id}@4s.link`,
    `DTSTART;TZID=${ev.timezone || 'Asia/Tokyo'}:${toDT(s.date, s.startTime)}`,
    `DTEND;TZID=${ev.timezone || 'Asia/Tokyo'}:${toDT(last.date, last.endTime)}`,
    `SUMMARY:${esc(ev.title)}`,
    `DESCRIPTION:${esc(plain)}`,
    `URL:https://4s.link/en/${ev.slug}`,
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
