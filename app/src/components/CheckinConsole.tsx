import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, AlertCircle, Camera, CameraOff, KeyboardIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface CheckinResult {
  result: 'ok' | 'already' | 'invalid' | 'not_approved' | 'wrong_event'
  message?: string
  name?: string
  type?: string
  checkedInAt?: string
}

/**
 * 现场核销台：工作人员用手机打开，对准参会者的电子票二维码。
 * 设计目标：单手、强反馈（颜色+大字）、断网重试友好、扫不了码有短码兜底。
 */
export function CheckinConsole({ apiBase }: { apiBase: string }) {
  const { t } = useI18n()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [result, setResult] = useState<CheckinResult | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [stats, setStats] = useState<{ approved: number; checkedIn: number } | null>(null)
  const [recent, setRecent] = useState<{ name: string; time: string; ok: boolean }[]>([])
  const lastTokenRef = useRef<{ token: string; at: number }>({ token: '', at: 0 })

  const loadStats = useCallback(() => {
    fetch(`${apiBase}/checkin/stats`)
      .then((r) => r.json())
      .then((d) => d.approved !== undefined && setStats(d))
      .catch(() => {})
  }, [apiBase])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const submit = useCallback(
    async (payload: { token?: string; code?: string }) => {
      setBusy(true)
      try {
        const res = await fetch(`${apiBase}/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data: CheckinResult = await res.json()
        setResult(data)
        if (data.result === 'ok') {
          setRecent((r) => [{ name: data.name || '', time: new Date().toLocaleTimeString('zh-CN'), ok: true }, ...r].slice(0, 20))
          loadStats()
          if (navigator.vibrate) navigator.vibrate(80)
        }
      } catch {
        setResult({ result: 'invalid', message: t('checkin.networkError') })
      } finally {
        setBusy(false)
      }
    },
    [apiBase, loadStats, t]
  )

  // 扫码循环
  useEffect(() => {
    if (!cameraOn) return
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const video = videoRef.current!
        video.srcObject = stream
        await video.play()
        scan()
      } catch (e: any) {
        setCameraError(e?.name === 'NotAllowedError' ? t('checkin.cameraPermissionDenied') : t('checkin.cameraStartFailed'))
        setCameraOn(false)
      }
    }

    function scan() {
      if (stopped) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(video, 0, 0)
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
        if (qr?.data) {
          const now = Date.now()
          // 同一张码 3 秒内不重复提交
          if (qr.data !== lastTokenRef.current.token || now - lastTokenRef.current.at > 3000) {
            lastTokenRef.current = { token: qr.data, at: now }
            submit({ token: qr.data })
          }
        }
      }
      raf = requestAnimationFrame(scan)
    }

    start()
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [cameraOn, submit])

  const resultStyle: Record<CheckinResult['result'], { bg: string; icon: React.ReactNode; label: string }> = {
    ok: { bg: 'bg-emerald-600', icon: <CheckCircle2 size={40} />, label: t('checkin.success') },
    already: { bg: 'bg-live', icon: <AlertCircle size={40} />, label: t('checkin.duplicate') },
    not_approved: { bg: 'bg-live', icon: <AlertCircle size={40} />, label: t('checkin.notAllowed') },
    wrong_event: { bg: 'bg-red-600', icon: <XCircle size={40} />, label: t('checkin.wrongTicket') },
    invalid: { bg: 'bg-red-600', icon: <XCircle size={40} />, label: t('checkin.invalidTicket') },
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('checkin.title')}</h2>
          <p className="mt-1 text-sm opacity-60">{t('checkin.subtitle')}</p>
        </div>
        {stats && (
          <p className="text-sm tabular-nums opacity-70">
            <b className="text-lg text-brand">{stats.checkedIn}</b> / {stats.approved} {t('checkin.checkedInOf')}
          </p>
        )}
      </div>

      {/* 结果反馈：全宽色块，隔米远也看得清 */}
      {result && (
        <div className={`mt-4 flex items-center gap-3 rounded-2xl p-4 text-white ${resultStyle[result.result].bg}`}>
          {resultStyle[result.result].icon}
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">
              {resultStyle[result.result].label}
              {result.name ? ` · ${result.name}` : ''}
            </p>
            <p className="text-sm opacity-90">
              {result.result === 'already' && result.checkedInAt
                ? `${result.message}（${new Date(result.checkedInAt).toLocaleTimeString('zh-CN')}）`
                : result.message || (result.type && result.type !== 'GENERAL' ? t('checkin.type', { type: result.type }) : t('checkin.welcome'))}
            </p>
          </div>
        </div>
      )}

      {/* 相机区 */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-black/[0.07] bg-neutral-950 dark:border-white/10">
        {cameraOn ? (
          <div className="relative aspect-square">
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-52 w-52 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]" />
            </div>
            <button
              onClick={() => setCameraOn(false)}
              className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink"
            >
              <CameraOff size={15} /> {t('checkin.closeCamera')}
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setCameraError('')
              setCameraOn(true)
            }}
            className="flex aspect-[2/1] w-full flex-col items-center justify-center gap-2 text-white/85 transition hover:text-white"
          >
            <Camera size={32} />
            <span className="text-sm font-semibold">{t('checkin.openCamera')}</span>
            {cameraError && <span className="max-w-[80%] text-center text-xs text-red-300">{cameraError}</span>}
          </button>
        )}
      </div>

      {/* 短码兜底 */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim()) submit({ code: code.trim() })
        }}
        className="mt-4 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <KeyboardIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('checkin.shortCodePlaceholder')}
            className="pl-10 font-mono uppercase"
            maxLength={8}
          />
        </div>
        <Button type="submit" disabled={busy || code.trim().length < 6} className="rounded-full px-6">
          {t('checkin.submit')}
        </Button>
      </form>

      {/* 本机最近核销记录 */}
      {recent.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold opacity-70">{t('checkin.recentRecords')}</h3>
          <ul className="mt-2 divide-y divide-black/[0.05] rounded-2xl border border-black/[0.07] bg-white text-sm dark:divide-white/10 dark:border-white/10 dark:bg-neutral-900">
            {recent.map((r, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5">
                <span className="font-medium">{r.name}</span>
                <span className="text-xs tabular-nums opacity-50">{r.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
