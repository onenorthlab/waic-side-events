// 内存数据层 —— 生产(CF Worker)/开发通用, 打包 JSON, 无原生模块(better-sqlite3 只在本地 DB 版用)。
// 只读切片; 响应仍回完整原始对象(契约保真)。派生轻量索引供筛选/排序。
import eventsRaw from '../data/events.json'
import communitiesRaw from '../data/communities.json'
import playlistsRaw from '../data/playlists.json'

export const EVENTS = (eventsRaw as any[]).map((e) => ({
  data: e,
  id: e.id,
  slug: e.slug,
  title: e.title || '',
  description: e.description || '',
  state: e.state,
  startDate: e.schedules?.[0]?.date ?? null,
  hasEnded: !!e.hasEnded,
  featured: !!e.featured,
  tags: (Array.isArray(e.tags) ? e.tags : []) as string[],
  schedules: (e.schedules || []) as { date: string }[],
}))

export const COMMUNITIES = (communitiesRaw as any[]).map((c) => ({
  data: c,
  id: c.id,
  slug: c.slug || c.id,
  name: c.name || '',
  description: c.description || '',
  featured: !!c.featured,
  memberCount: c.memberCount || 0,
  tags: (c.tags || []) as { name: string }[],
}))

export const PLAYLISTS = (playlistsRaw as any[]).map((p) => ({
  data: p,
  id: p.id,
  featured: !!p.featured,
  sticky: !!p.sticky,
  itemCount: p.itemCount || 0,
}))
