import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EventContent } from '@/components/EventContent'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'
import { Link2, ClipboardPaste, Sparkles, AlertTriangle, ChevronDown, PencilLine } from 'lucide-react'

interface ImportDraft {
  title: string
  catchphrase: string | null
  description: string
  descriptionFormat: 'markdown'
  schedules: { date: string; startTime: string; endTime: string }[]
  eventType: string
  tags: string[]
  organizerNames: string[]
  location: any[]
  mainImageUrl: string | null
  images: string[]
  sourceUrl: string | null
}

type Mode = 'import' | 'manual'

export function EventCreatePage() {
  const { t } = useI18n()
  const [mode, setMode] = useState<Mode>('import')

  return (
    <div className="flex min-h-screen flex-col">
      <Header showCreate={false} />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pb-12 pt-8 md:pt-12">
        <h1 className="text-3xl font-bold tracking-tight text-ink dark:text-white">{t('nav.createEvent')}</h1>
        <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">
          已经发过公众号或文档？贴上链接，内容和海报会原样搬过来，不用重新排版。
        </p>

        <div className="mt-6 flex rounded-lg border border-black/[0.08] bg-white p-0.5 dark:border-white/12 dark:bg-neutral-900">
          {(
            [
              { key: 'import', label: '从链接 / 文章导入', icon: <Link2 size={14} /> },
              { key: 'manual', label: '手动创建', icon: <PencilLine size={14} /> },
            ] as { key: Mode; label: string; icon: React.ReactNode }[]
          ).map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ' +
                (mode === m.key
                  ? 'bg-ink text-white dark:bg-white dark:text-ink'
                  : 'text-ink/55 hover:text-ink dark:text-white/55 dark:hover:text-white')
              }
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        <div className="mt-6">{mode === 'import' ? <ImportFlow /> : <ManualForm />}</div>
      </main>
      <Footer />
    </div>
  )
}

function ImportFlow() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [draft, setDraft] = useState<ImportDraft | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const parse = async () => {
    if (!url && !text) {
      toast.error('请填入链接，或粘贴文章内容')
      return
    }
    setParsing(true)
    setDraft(null)
    try {
      const res = await fetch('/api/manage/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(url ? { url } : { text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || '解析失败')
      setDraft(data.draft)
      setWarnings(data.warnings || [])
      if (!data.draft.title) setWarnings((w) => [...w, '未识别到活动名称，请补充'])
    } catch (err: any) {
      toast.error(err.message || '解析失败')
      if (url) setShowTextInput(true)
    } finally {
      setParsing(false)
    }
  }

  const create = async () => {
    if (!draft?.title) {
      toast.error('请填写活动名称')
      return
    }
    setCreating(true)
    try {
      const schedules = draft.schedules?.length ? draft.schedules : undefined
      const res = await fetch('/api/manage/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          descriptionFormat: 'markdown',
          eventType: draft.eventType || 'ONSITE',
          timezone: 'Asia/Shanghai',
          schedules,
        }),
      })
      const created = await res.json()
      if (!res.ok) throw new Error(created.error || '创建失败')

      // 二段补全：导入抽取的富字段
      const patch: any = {}
      if (draft.catchphrase) patch.catchphrase = draft.catchphrase
      if (draft.tags?.length) patch.tags = draft.tags
      if (draft.location?.length) patch.location = draft.location
      if (draft.mainImageUrl) {
        patch.mainImageUrl = draft.mainImageUrl
        patch.thumbnailUrl = draft.mainImageUrl
      }
      if (Object.keys(patch).length) {
        await fetch(`/api/manage/events/${created.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {})
      }
      toast.success('活动草稿已创建，确认信息后即可发布')
      navigate({ to: `/manage/events/${created.id}/dashboard` })
    } catch (err: any) {
      toast.error(err.message || '创建失败')
    } finally {
      setCreating(false)
    }
  }

  const setField = (k: keyof ImportDraft, v: any) => setDraft((d) => (d ? { ...d, [k]: v } : d))
  const s0 = draft?.schedules?.[0]

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
        <div className="space-y-2">
          <Label htmlFor="import-url">公众号文章 / 网页链接</Label>
          <div className="flex gap-2">
            <Input
              id="import-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mp.weixin.qq.com/s/…"
              className="flex-1"
            />
            <Button onClick={parse} disabled={parsing} className="shrink-0 rounded-full px-5">
              <Sparkles size={14} className="mr-1.5" /> {parsing ? '解析中…' : '解析'}
            </Button>
          </div>
          <p className="text-xs text-ink/45 dark:text-white/45">
            正文和图片会原样保留，只自动识别名称、时间、地点等字段，识别结果你可以修改。
          </p>
        </div>

        <button
          onClick={() => setShowTextInput((s) => !s)}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          <ClipboardPaste size={13} /> 链接抓不到？直接粘贴文章内容
          <ChevronDown size={13} className={`transition ${showTextInput ? 'rotate-180' : ''}`} />
        </button>
        {showTextInput && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="把公众号文章或活动介绍全文粘贴到这里…"
            />
            <Button variant="outline" onClick={parse} disabled={parsing} className="rounded-full">
              {parsing ? '解析中…' : '解析粘贴内容'}
            </Button>
          </div>
        )}
      </div>

      {parsing && (
        <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
          <div className="h-4 w-24 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-black/[0.06] dark:bg-white/10" />
          <div className="h-9 w-2/3 animate-pulse rounded-lg bg-black/[0.06] dark:bg-white/10" />
          <div className="h-20 w-full animate-pulse rounded-lg bg-black/[0.06] dark:bg-white/10" />
        </div>
      )}

      {draft && (
        <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
          <h2 className="text-sm font-bold text-ink dark:text-white">确认活动信息</h2>

          {warnings.length > 0 && (
            <div className="mt-3 flex flex-col gap-1 rounded-xl bg-live/10 p-3">
              {warnings.map((w, i) => (
                <p key={i} className="flex items-center gap-1.5 text-xs text-ink/75 dark:text-white/75">
                  <AlertTriangle size={13} className="shrink-0 text-live" /> {w}
                </p>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>活动名称</Label>
              <Input value={draft.title} onChange={(e) => setField('title', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>日期</Label>
                <Input
                  type="date"
                  value={s0?.date || ''}
                  onChange={(e) =>
                    setField('schedules', [{ date: e.target.value, startTime: s0?.startTime || '10:00', endTime: s0?.endTime || '18:00' }])
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>开始</Label>
                <Input
                  type="time"
                  value={s0?.startTime || ''}
                  onChange={(e) => setField('schedules', [{ date: s0?.date || '', startTime: e.target.value, endTime: s0?.endTime || '18:00' }])}
                />
              </div>
              <div className="space-y-2">
                <Label>结束</Label>
                <Input
                  type="time"
                  value={s0?.endTime || ''}
                  onChange={(e) => setField('schedules', [{ date: s0?.date || '', startTime: s0?.startTime || '10:00', endTime: e.target.value }])}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>地点</Label>
              <Input
                value={draft.location?.[0] ? `${draft.location[0].title || ''}${draft.location[0].displayText ? ' · ' + draft.location[0].displayText : ''}` : ''}
                onChange={(e) => setField('location', [{ title: e.target.value, displayText: e.target.value, city: '上海', country: '中国' }])}
                placeholder="场地名 / 地址（发布前可在设置里精确定位）"
              />
            </div>
            <div className="space-y-2">
              <Label>标签</Label>
              <Input
                value={(draft.tags || []).join('、')}
                onChange={(e) => setField('tags', e.target.value.split(/[、,，\s]+/).filter(Boolean))}
                placeholder="用顿号分隔，如：Agent、创业、夜局"
              />
            </div>
            {draft.mainImageUrl && (
              <div className="space-y-2">
                <Label>封面（取自原文，可换）</Label>
                <img src={draft.mainImageUrl} alt="封面预览" className="max-h-44 rounded-xl object-cover" />
                {draft.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {draft.images.slice(0, 8).map((img) => (
                      <button
                        key={img}
                        onClick={() => setField('mainImageUrl', img)}
                        className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${draft.mainImageUrl === img ? 'border-brand' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                onClick={() => setShowPreview((s) => !s)}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                预览正文（原文保真，共 {draft.description.length} 字）
                <ChevronDown size={13} className={`transition ${showPreview ? 'rotate-180' : ''}`} />
              </button>
              {showPreview && (
                <div className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-black/[0.06] p-4 dark:border-white/10">
                  <EventContent content={draft.description} format="markdown" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={create} disabled={creating} size="lg" className="rounded-full px-8">
              {creating ? '创建中…' : '创建活动草稿'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ManualForm() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('18:00')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !date) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/manage/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          descriptionFormat: 'markdown',
          eventType: 'ONSITE',
          timezone: 'Asia/Shanghai',
          schedules: [{ date, startTime, endTime }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '创建失败')
      toast.success('活动创建成功')
      navigate({ to: `/manage/events/${data.id}/dashboard` })
    } catch (err: any) {
      toast.error(err.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            活动名称 <span className="text-red-500">*</span>
          </Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：WAIC Agent 创业夜局" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">活动介绍（支持 Markdown）</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="介绍活动内容、亮点…" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="date">
              日期 <span className="text-red-500">*</span>
            </Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">开始时间</Label>
            <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">结束时间</Label>
            <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => navigate({ to: '/manage/events' })}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="rounded-full px-6" disabled={submitting}>
            {submitting ? t('common.loading') : t('common.create')}
          </Button>
        </div>
      </form>
    </div>
  )
}
