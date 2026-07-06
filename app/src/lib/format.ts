// 日期/时间格式化 —— 基于真实 schedules(date/startTime 为 JST 墙钟字符串, 直接展示不做时区换算)。
import type { Schedule } from './types'

const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WD_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function ymd(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return { y, m: m - 1, day, wd: new Date(Date.UTC(y, m - 1, day)).getUTCDay() }
}

export function groupDateLabel(dateStr: string | null): string {
  if (!dateStr) return 'Date TBD'
  const d = ymd(dateStr)
  return `${MO[d.m]} ${d.day}, ${d.y} ${WD[d.wd]}`
}

export function detailDateLabel(schedules?: Schedule[]): string {
  if (!schedules?.length) return 'Date TBD'
  const f = ymd(schedules[0].date)
  const last = schedules[schedules.length - 1].date
  if (schedules[0].date === last) return `${MO[f.m]} ${f.day}, ${f.y} (${WD_SHORT[f.wd]})`
  const l = ymd(last)
  if (f.y === l.y && f.m === l.m) return `${MO[f.m]} ${f.day}–${l.day}, ${f.y}`
  return `${MO[f.m]} ${f.day} – ${MO[l.m]} ${l.day}, ${l.y}`
}

export function timeLabel(schedules?: Schedule[]): string {
  const t = schedules?.[0]?.startTime
  if (!t) return ''
  const [h, mm] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${String(mm).padStart(2, '0')} ${ap}-`
}

export function firstDate(schedules?: Schedule[]): string | null {
  return schedules?.[0]?.date ?? null
}

export function dayKey(dateStr: string | null): string {
  return dateStr || 'tbd'
}

// —— session 时间(ISO 带 Z, 转 Asia/Tokyo 显示) ——
const JST = 'Asia/Tokyo'
function jstParts(iso: string) {
  const p: Record<string, string> = {}
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: JST,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  for (const x of f.formatToParts(new Date(iso))) p[x.type] = x.value
  return p
}

export function sessionTimeRange(startISO: string, endISO?: string): string {
  if (!startISO) return ''
  const s = jstParts(startISO)
  const start = `${s.hour}:${s.minute}`
  if (!endISO) return start
  const e = jstParts(endISO)
  return `${start}–${e.hour}:${e.minute}`
}

export function sessionDayKey(iso: string): string {
  const p = jstParts(iso)
  return `${p.month} ${p.day}`
}

export function sessionDayLabel(iso: string): string {
  const p = jstParts(iso)
  return `${p.month} ${p.day} (${p.weekday})`
}

