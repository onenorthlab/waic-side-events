import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, Clock } from 'lucide-react'

interface Stage {
  id: string
  name: string
}

interface Speaker {
  id: string
  name: string
}

interface Session {
  id: string
  title: string
  description?: string
  stageId?: string
  speakerIds?: string[]
  date: string
  startTime: string
  endTime: string
}

export function SessionsPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [sessions, setSessions] = useState<Session[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Session | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stageId, setStageId] = useState('')
  const [speakerIds, setSpeakerIds] = useState<string[]>([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  const fetchEvent = () => {
    setLoading(true)
    fetch(`/api/manage/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(Array.isArray(data.sessions) ? data.sessions : [])
        setStages(Array.isArray(data.stages) ? data.stages : [])
        setSpeakers(Array.isArray(data.speakers) ? data.speakers : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载场次失败')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchEvent()
  }, [id])

  const reset = () => {
    setTitle('')
    setDescription('')
    setStageId('')
    setSpeakerIds([])
    setDate('')
    setStartTime('09:00')
    setEndTime('10:00')
    setEditing(null)
  }

  const openNew = () => {
    reset()
    setOpen(true)
  }

  const openEdit = (s: Session) => {
    setEditing(s)
    setTitle(s.title)
    setDescription(s.description || '')
    setStageId(s.stageId || '')
    setSpeakerIds(s.speakerIds || [])
    setDate(s.date)
    setStartTime(s.startTime)
    setEndTime(s.endTime)
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Session = {
      id: editing ? editing.id : crypto.randomUUID(),
      title,
      description,
      stageId: stageId || undefined,
      speakerIds,
      date,
      startTime,
      endTime,
    }
    const next = editing ? sessions.map((s) => (s.id === editing.id ? payload : s)) : [...sessions, payload]
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: next }),
      })
      if (!res.ok) throw new Error('保存失败')
      toast.success(editing ? '已更新' : '已添加')
      setOpen(false)
      reset()
      fetchEvent()
    } catch {
      toast.error('保存失败')
    }
  }

  const remove = async (sid: string) => {
    if (!confirm('确定删除该场次？')) return
    const next = sessions.filter((s) => s.id !== sid)
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: next }),
      })
      if (!res.ok) throw new Error('删除失败')
      toast.success('已删除')
      fetchEvent()
    } catch {
      toast.error('删除失败')
    }
  }

  const toggleSpeaker = (sid: string) => {
    setSpeakerIds((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.sessions')}</h2>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-2" /> 添加场次
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>场次列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-ink/50">加载中…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-ink/50">暂无场次。</p>
          ) : (
            <div className="space-y-3">
              {sessions
                .slice()
                .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
                .map((s) => (
                  <div key={s.id} className="rounded-lg border p-4 dark:border-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-ink/40" />
                          <span className="text-sm text-ink/70">{s.date} {s.startTime} - {s.endTime}</span>
                          {s.stageId && <span className="text-sm text-ink/50">· {stages.find((st) => st.id === s.stageId)?.name || '未知舞台'}</span>}
                        </div>
                        <p className="mt-1 font-medium">{s.title}</p>
                        {s.description && <p className="text-sm text-ink/70">{s.description}</p>}
                        {s.speakerIds && s.speakerIds.length > 0 && (
                          <p className="mt-1 text-sm text-ink/50">嘉宾：{s.speakerIds.map((sid) => speakers.find((sp) => sp.id === sid)?.name).filter(Boolean).join('、')}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑场次' : '添加场次'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>日期</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>开始</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>结束</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>舞台</Label>
              <Select value={stageId} onValueChange={(v) => setStageId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="选择舞台" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((st) => (
                    <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>嘉宾</Label>
              <div className="flex flex-wrap gap-2">
                {speakers.map((sp) => (
                  <label key={sp.id} className="flex items-center gap-1 rounded-full border px-3 py-1 text-sm dark:border-white/10">
                    <input type="checkbox" checked={speakerIds.includes(sp.id)} onChange={() => toggleSpeaker(sp.id)} />
                    {sp.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
              <Button type="submit">保存</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
