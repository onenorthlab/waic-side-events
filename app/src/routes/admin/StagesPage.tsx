import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, MapPin } from 'lucide-react'

interface Stage {
  id: string
  name: string
  description?: string
  location?: string
}

export function StagesPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Stage | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')

  const fetchEvent = () => {
    setLoading(true)
    fetch(`/api/manage/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setStages(Array.isArray(data.stages) ? data.stages : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载舞台失败')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchEvent()
  }, [id])

  const reset = () => {
    setName('')
    setDescription('')
    setLocation('')
    setEditing(null)
  }

  const openNew = () => {
    reset()
    setOpen(true)
  }

  const openEdit = (s: Stage) => {
    setEditing(s)
    setName(s.name)
    setDescription(s.description || '')
    setLocation(s.location || '')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = editing
      ? stages.map((s) => (s.id === editing.id ? { ...s, name, description, location } : s))
      : [...stages, { id: crypto.randomUUID(), name, description, location }]
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: next }),
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
    if (!confirm('确定删除该舞台？关联场次将失去舞台。')) return
    const next = stages.filter((s) => s.id !== sid)
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: next }),
      })
      if (!res.ok) throw new Error('删除失败')
      toast.success('已删除')
      fetchEvent()
    } catch {
      toast.error('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.stages')}</h2>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-2" /> 添加舞台
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>舞台列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-ink/50">加载中…</p>
          ) : stages.length === 0 ? (
            <p className="text-sm text-ink/50">暂无舞台。</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {stages.map((s) => (
                <div key={s.id} className="rounded-lg border p-4 dark:border-white/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      {s.location && <p className="flex items-center gap-1 text-sm text-ink/50"><MapPin size={12} /> {s.location}</p>}
                      {s.description && <p className="mt-1 text-sm text-ink/70">{s.description}</p>}
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
            <DialogTitle>{editing ? '编辑舞台' : '添加舞台'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>舞台名称</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>位置</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="例如：A馆主舞台" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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
