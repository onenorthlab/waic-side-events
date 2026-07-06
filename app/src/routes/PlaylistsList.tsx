import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { fetchPlaylists } from '../lib/api'
import type { Playlist, PlaylistsResponse } from '../lib/types'
import { ListVideo } from 'lucide-react'
import { useI18n } from '../lib/i18n'

function Thumb({ p, className }: { p: Playlist; className?: string }) {
  if (p.thumbnailImageUrl) return <img src={p.thumbnailImageUrl} alt="" loading="lazy" className={className} />
  return (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800`}>
      <ListVideo className="text-white/70" />
    </div>
  )
}

function PlaylistRow({ p }: { p: Playlist }) {
  const { t } = useI18n()
  return (
    <Link
      to="/playlists/$id"
      params={{ id: p.id }}
      className="group flex gap-3 rounded-xl p-2 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
    >
      <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800">
        <Thumb p={p} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]" />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-600 dark:text-white">{p.name}</h3>
        {p.community?.name && <div className="mt-1 truncate text-xs text-ink/55 dark:text-white/55">{p.community.name}</div>}
        <div className="mt-0.5 text-xs text-ink/45 dark:text-white/45">{t('playlists.eventCount', { n: p.itemCount })}</div>
      </div>
    </Link>
  )
}

export function PlaylistsListPage() {
  const { t } = useI18n()
  const [data, setData] = useState<PlaylistsResponse | null>(null)
  const [pickup, setPickup] = useState<Playlist[]>([])

  useEffect(() => {
    fetchPlaylists({ featured: true, perPage: 3 }).then((r) => setPickup(r.playlists)).catch(() => {})
    fetchPlaylists({ perPage: 30 }).then(setData).catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-ink dark:text-white">{t('playlists.title')}</h1>

        {pickup.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2 text-sm font-semibold text-ink/70 dark:text-white/70">{t('playlists.pickup')}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:max-w-2xl">
              {pickup.map((p) => (
                <Link
                  key={p.id}
                  to="/playlists/$id"
                  params={{ id: p.id }}
                  className="group relative block aspect-square overflow-hidden rounded-xl bg-neutral-900"
                >
                  <Thumb p={p} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow">{p.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {data && (
          <section className="mt-8">
            <p className="mb-2 text-xs text-ink/40 dark:text-white/40">{t('playlists.count', { n: data.pageInfo.totalCount })}</p>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {data.playlists.map((p) => (
                <PlaylistRow key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
