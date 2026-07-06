// 日期/时间格式化 —— 中文站：schedules 的 date/startTime 是 Asia/Shanghai 墙钟字符串，直接展示不换算。
import type { Schedule } from './types'

const WD_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function ymd(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return { y, m: m - 1, day, wd: new Date(Date.UTC(y, m - 1, day)).getUTCDay() }
}

const thisYear = new Date().getFullYear()

export function groupDateLabel(dateStr: string | null): string {
  if (!dateStr) return '日期待定'
  const d = ymd(dateStr)
  const yearPrefix = d.y !== thisYear ? `${d.y}年` : ''
  return `${yearPrefix}${d.m + 1}月${d.day}日 ${WD_CN[d.wd]}`
}

export function detailDateLabel(schedules?: Schedule[]): string {
  if (!schedules?.length) return '日期待定'
  const f = ymd(schedules[0].date)
  const last = schedules[schedules.length - 1].date
  const yearPrefix = f.y !== thisYear ? `${f.y}年` : ''
  if (schedules[0].date === last) return `${yearPrefix}${f.m + 1}月${f.day}日 ${WD_CN[f.wd]}`
  const l = ymd(last)
  if (f.y === l.y && f.m === l.m) return `${yearPrefix}${f.m + 1}月${f.day}日 - ${l.day}日`
  return `${yearPrefix}${f.m + 1}月${f.day}日 - ${l.m + 1}月${l.day}日`
}

/** 短日期：日期条 chip 用，如「7/26 周六」 */
export function shortDateLabel(dateStr: string): { md: string; wd: string } {
  const d = ymd(dateStr)
  return { md: `${d.m + 1}/${d.day}`, wd: WD_CN[d.wd] }
}

export function timeLabel(schedules?: Schedule[]): string {
  const s = schedules?.[0]
  if (!s?.startTime) return ''
  return s.endTime ? `${s.startTime} - ${s.endTime}` : `${s.startTime} 开始`
}

export function firstDate(schedules?: Schedule[]): string | null {
  return schedules?.[0]?.date ?? null
}

export function dayKey(dateStr: string | null): string {
  return dateStr || 'tbd'
}

/** 判断活动当天是否正在进行（仅按日期粒度） */
export function isLiveToday(schedules?: Schedule[]): boolean {
  if (!schedules?.length) return false
  const today = new Date()
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return schedules.some((s) => s.date === key)
}

// —— session 时间(ISO 带 Z, 转 Asia/Shanghai 显示) ——
const TZ = 'Asia/Shanghai'
function tzParts(iso: string) {
  const p: Record<string, string> = {}
  const f = new Intl.DateTimeFormat('zh-CN', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
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
  const s = tzParts(startISO)
  const start = `${s.hour}:${s.minute}`
  if (!endISO) return start
  const e = tzParts(endISO)
  return `${start} - ${e.hour}:${e.minute}`
}

export function sessionDayKey(iso: string): string {
  const p = tzParts(iso)
  return `${p.month}月${p.day}日`
}

export function sessionDayLabel(iso: string): string {
  const p = tzParts(iso)
  return `${p.month}月${p.day}日 ${p.weekday}`
}
