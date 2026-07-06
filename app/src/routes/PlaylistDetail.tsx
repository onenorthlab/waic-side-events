import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { fetchPlaylist } from '../lib/api'
import type { Playlist } from '../lib/types'
import { ArrowLeft, ListVideo } from 'lucide-react'
import { useI18n } from '../lib/i18n'

export function PlaylistDetailPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/playlists/$id' })
  const [p, setP] = useState<Playlist | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading')

  useEffect(() => {
    let alive = true
    setState('loading')
    fetchPlaylist(id)
      .then((x) => alive && (setP(x), setState('ok')))
      .catch(() => alive && setState('notfound'))
    return () => {
      alive = false
    }
  }, [id])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {state === 'loading' && <div className="flex-1 py-24 text-center text-sm text-ink/40">Loading…</div>}
      {state === 'notfound' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
          <p className="text-ink/60 dark:text-white/60">{t('playlists.notFound')}</p>
          <Link to="/playlists" className="text-sm font-semibold text-brand-600 hover:underline">
            ← Back to Playlists
          </Link>
        </div>
      )}
      {state === 'ok' && p && (
        <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-8">
          <Link to="/playlists" className="mb-5 inline-flex items-center gap-1 text-sm text-ink/50 hover:text-ink dark:text-white/50">
            <ArrowLeft size={15} /> {t('playlists.title')}
          </Link>

          <div className="flex flex-col items-start gap-5 sm:flex-row">
            <div className="relative aspect-square w-40 shrink-0 overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800">
              {p.thumbnailImageUrl ? (
                <img src={p.thumbnailImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ListVideo className="text-white/70" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold text-ink dark:text-white">{p.name}</h1>
              {p.community?.name && (
                <Link
                  to="/communities/$slug"
                  params={{ slug: p.community.slug || p.community.id }}
                  className="mt-1 inline-block text-sm text-ink/60 hover:text-brand-600 dark:text-white/60"
                >
                  {p.community.name}
                </Link>
              )}
              <div className="mt-1 text-sm text-ink/45 dark:text-white/45">{t('playlists.eventCount', { n: p.itemCount })}</div>
              {p.description && <p className="mt-4 text-[15px] leading-relaxed text-ink/85 dark:text-white/80">{p.description}</p>}
            </div>
          </div>

          {/* 播单内活动清单需 /playlists/:id/items 接口(未采) —— 诚实标注 */}
          <div className="mt-8 rounded-xl border border-dashed border-black/15 p-4 text-sm text-ink/50 dark:border-white/15 dark:text-white/50">
            播单内 {p.itemCount} 个活动的清单需 <code className="text-xs">/playlists/:id/items</code> 接口，本切片未采集该子资源；播单元数据已契约级还原。
          </div>
        </main>
      )}
      <Footer />
    </div>
  )
}
