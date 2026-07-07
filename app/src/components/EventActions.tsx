import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Heart, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAttendee } from '../lib/attendee-context'
import type { EventItem } from '../lib/types'
import { detailDateLabel } from '../lib/format'

/** 详情页动作组：收藏（需登录）+ 分享（系统分享/复制文案） */
export function EventActions({ ev }: { ev: EventItem }) {
  const { email } = useAttendee()
  const navigate = useNavigate()
  const [bookmarked, setBookmarked] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!email) return
    fetch(`/api/attendee/bookmarks/${ev.id}`)
      .then((r) => r.json())
      .then((d) => setBookmarked(!!d.bookmarked))
      .catch(() => {})
  }, [email, ev.id])

  const toggleBookmark = async () => {
    if (!email) {
      toast('登录后可以收藏活动', { action: { label: '去登录', onClick: () => navigate({ to: '/me' }) } })
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/attendee/bookmarks/${ev.id}`, { method: bookmarked ? 'DELETE' : 'PUT' })
      const d = await res.json()
      if (!res.ok) throw new Error()
      setBookmarked(!!d.bookmarked)
      toast.success(d.bookmarked ? '已收藏，可在「我的」查看' : '已取消收藏')
    } catch {
      toast.error('操作失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    const url = `${location.origin}/${encodeURIComponent(ev.slug)}`
    const text = `${ev.title} · ${detailDateLabel(ev.schedules)}`
    if (navigator.share) {
      try {
        await navigator.share({ title: ev.title, text, url })
        return
      } catch {
        /* 用户取消，落回复制 */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      toast.success('活动链接已复制，去分享给朋友吧')
    } catch {
      toast.error('复制失败，请手动复制地址栏链接')
    }
  }

  const btn =
    'flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink/60 transition hover:border-black/25 hover:text-ink active:scale-95 dark:border-white/15 dark:text-white/60 dark:hover:border-white/35 dark:hover:text-white'

  return (
    <div className="flex items-center gap-2">
      <button onClick={toggleBookmark} disabled={busy} aria-label={bookmarked ? '取消收藏' : '收藏'} className={btn}>
        <Heart size={16} className={bookmarked ? 'fill-brand text-brand' : ''} />
      </button>
      <button onClick={share} aria-label="分享" className={btn}>
        <Share2 size={16} />
      </button>
    </div>
  )
}
