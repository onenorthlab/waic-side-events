import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { useI18n } from '../lib/i18n'
import { List, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    AMap?: any
    AMapLoader?: {
      load: (opts: { key: string; version: string; plugins?: string[] }) => Promise<any>
    }
  }
}

function loadAmapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('amap-loader')) {
      if (window.AMapLoader) return resolve()
      const check = setInterval(() => {
        if (window.AMapLoader) {
          clearInterval(check)
          resolve()
        }
      }, 100)
      return
    }
    const script = document.createElement('script')
    script.id = 'amap-loader'
    script.src = 'https://webapi.amap.com/loader.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load AMap loader'))
    document.body.appendChild(script)
  })
}

interface MapEvent {
  slug: string
  title: string
  catchphrase?: string
  thumbnailUrl?: string
  lng: number
  lat: number
}

export function EventsMapPage() {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let disposed = false
    let map: any = null

    async function init() {
      try {
        const [cfg, gj] = await Promise.all([
          fetch('/api/config').then((r) => r.json()),
          fetch('/api/events/geojson?timeFilter=upcoming').then((r) => r.json()),
        ])
        const amapKey = cfg.amapKey
        if (!amapKey) throw new Error('Amap key not configured')

        await loadAmapScript()
        const AMap = await window.AMapLoader!.load({
          key: amapKey,
          version: '2.0',
          plugins: ['AMap.Marker', 'AMap.InfoWindow'],
        })
        if (disposed || !ref.current) return

        const events: MapEvent[] = []
        for (const f of gj.features || []) {
          const [lng, lat] = f.geometry.coordinates || []
          const p = f.properties || {}
          if (typeof lng !== 'number' || typeof lat !== 'number') continue
          events.push({ slug: p.slug, title: p.title, catchphrase: p.catchphrase, thumbnailUrl: p.thumbnailUrl, lng, lat })
        }

        const center = events.length ? [events[0].lng, events[0].lat] : [121.4737, 31.2304]
        map = new AMap.Map(ref.current, {
          zoom: 11,
          center,
          viewMode: '2D',
        })

        const infoWindow = new AMap.InfoWindow({
          offset: new AMap.Pixel(0, -30),
          closeWhenClickMap: true,
        })

        events.forEach((ev) => {
          const marker = new AMap.Marker({
            position: [ev.lng, ev.lat],
            title: ev.title,
          })
          marker.on('click', () => {
            const content = `
              <div style="min-width:220px;max-width:280px;font-family:sans-serif;">
                ${ev.thumbnailUrl ? `<img src="${ev.thumbnailUrl}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />` : ''}
                <div style="font-weight:700;font-size:15px;color:#111;margin-bottom:4px;">${ev.title}</div>
                ${ev.catchphrase ? `<div style="font-size:12px;color:#666;margin-bottom:8px;">${ev.catchphrase}</div>` : ''}
                <a href="/${ev.slug}" style="color:#14b551;font-weight:600;font-size:13px;text-decoration:none;">${t('map.viewEvent')}</a>
              </div>
            `
            infoWindow.setContent(content)
            infoWindow.open(map, marker.getPosition())
          })
          map.add(marker)
        })

        if (events.length > 1) {
          map.setFitView(null, false, [60, 60, 60, 60], 11)
        }
        setLoading(false)
      } catch (err: any) {
        setError(err.message || '地图加载失败')
        setLoading(false)
      }
    }

    init()
    return () => {
      disposed = true
      if (map) {
        try {
          map.destroy()
        } catch {}
      }
    }
  }, [t])

  return (
    <div className="flex min-h-screen flex-col">
      <Header showCreate />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">活动地图</h1>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">看看每个局离你有多远</p>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-medium text-ink/70 transition hover:text-ink dark:border-white/12 dark:bg-neutral-900 dark:text-white/70 dark:hover:text-white"
          >
            <List size={15} /> 列表
          </Link>
        </div>
        <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-black/[0.07] dark:border-white/10">
          <div ref={ref} className="h-full w-full" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60">
              <Loader2 className="h-6 w-6 animate-spin text-ink/50" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6 text-center text-sm text-red-600 dark:bg-black/80">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
