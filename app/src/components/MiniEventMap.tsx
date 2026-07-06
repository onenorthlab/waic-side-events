import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Map as MapIcon } from 'lucide-react'
import { useI18n } from '../lib/i18n'

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

export function MiniEventMap() {
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
          plugins: ['AMap.Marker'],
        })
        if (disposed || !ref.current) return

        const events = (gj.features || [])
          .map((f: any) => {
            const [lng, lat] = f.geometry.coordinates || []
            if (typeof lng !== 'number' || typeof lat !== 'number') return null
            return { lng, lat, title: f.properties?.title || '' }
          })
          .filter(Boolean) as { lng: number; lat: number; title: string }[]

        const center = events.length ? [events[0].lng, events[0].lat] : [121.4737, 31.2304]
        map = new AMap.Map(ref.current, {
          zoom: 10,
          center,
          viewMode: '2D',
          mapStyle: 'amap://styles/normal',
        })

        events.forEach((ev) => {
          const marker = new AMap.Marker({
            position: [ev.lng, ev.lat],
            title: ev.title,
          })
          map.add(marker)
        })

        if (events.length > 1) {
          map.setFitView(null, false, [20, 20, 20, 20], 10)
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
  }, [])

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
      <div ref={ref} className="h-full w-full" />
      <Link
        to="/events/maps"
        className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/5 dark:hover:bg-white/5"
      >
        <span className="pointer-events-none flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm dark:bg-neutral-900/90 dark:text-white">
          <MapIcon size={14} /> {t('events.mapView')}
        </span>
      </Link>
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink dark:border-white/20 dark:border-t-white" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-4 text-center text-xs text-red-600 dark:bg-black/80">
          {error}
        </div>
      )}
    </div>
  )
}
