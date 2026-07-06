import type { EventItem, EventsResponse, TagUsage, Community, CommunitiesResponse, Playlist, PlaylistsResponse } from './types'

export async function fetchEvents(params: {
  page?: number
  perPage?: number
  timeFilter?: string
  featured?: boolean
  tag?: string
  q?: string
  date?: string
}): Promise<EventsResponse> {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('perPage', String(params.perPage))
  if (params.timeFilter) sp.set('timeFilter', params.timeFilter)
  if (params.featured) sp.set('featured', 'true')
  if (params.tag) sp.set('tag', params.tag)
  if (params.q) sp.set('q', params.q)
  if (params.date) sp.set('date', params.date)
  sp.set('sort', 'startTime')
  const res = await fetch(`/api/events?${sp.toString()}`)
  if (!res.ok) throw new Error('failed to load events')
  return res.json()
}

export async function fetchEvent(slug: string): Promise<EventItem> {
  const res = await fetch(`/api/events/${encodeURIComponent(slug)}`)
  if (res.status === 404) throw new Error('not_found')
  if (!res.ok) throw new Error('failed to load event')
  return res.json()
}

export async function fetchCommunities(params: { page?: number; perPage?: number; featured?: boolean; tag?: string; q?: string }): Promise<CommunitiesResponse> {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('perPage', String(params.perPage))
  if (params.featured) sp.set('featured', 'true')
  if (params.tag) sp.set('tag', params.tag)
  if (params.q) sp.set('q', params.q)
  const res = await fetch(`/api/communities?${sp.toString()}`)
  if (!res.ok) throw new Error('failed to load communities')
  return res.json()
}

export async function fetchCommunity(slug: string): Promise<Community> {
  const res = await fetch(`/api/communities/${encodeURIComponent(slug)}`)
  if (res.status === 404) throw new Error('not_found')
  if (!res.ok) throw new Error('failed to load community')
  return res.json()
}

export async function fetchPlaylists(params: { page?: number; perPage?: number; featured?: boolean }): Promise<PlaylistsResponse> {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.perPage) sp.set('perPage', String(params.perPage))
  if (params.featured) sp.set('featured', 'true')
  const res = await fetch(`/api/playlists?${sp.toString()}`)
  if (!res.ok) throw new Error('failed to load playlists')
  return res.json()
}

export async function fetchPlaylist(id: string): Promise<Playlist> {
  const res = await fetch(`/api/playlists/${encodeURIComponent(id)}`)
  if (res.status === 404) throw new Error('not_found')
  if (!res.ok) throw new Error('failed to load playlist')
  return res.json()
}

export async function fetchTags(): Promise<string[]> {
  try {
    const res = await fetch('/api/tags/usage?entity=event')
    if (!res.ok) return []
    const j: TagUsage = await res.json()
    const g = j.groups?.find((x) => x.entity === 'event') || j.groups?.[0]
    return (g?.tags || []).map((t) => t.name)
  } catch {
    return []
  }
}
