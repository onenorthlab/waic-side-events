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
import { Plus, Trash2, Edit2, User } from 'lucide-react'

interface Speaker {
  id: string
  name: string
  title?: string
  organization?: string
  bio?: string
  imageUrl?: string
}

export function SpeakersPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Speaker | null>(null)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [organization, setOrganization] = useState('')
  const [bio, setBio] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const fetchEvent = () => {
    setLoading(true)
    fetch(`/api/manage/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSpeakers(Array.isArray(data.speakers) ? data.speakers : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载嘉宾失败')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchEvent()
  }, [id])

  const reset = () => {
    setName('')
    setTitle('')
    setOrganization('')
    setBio('')
    setImageUrl('')
    setEditing(null)
  }

  const openNew = () => {
    reset()
    setOpen(true)
  }

  const openEdit = (s: Speaker) => {
    setEditing(s)
    setName(s.name)
    setTitle(s.title || '')
    setOrganization(s.organization || '')
    setBio(s.bio || '')
    setImageUrl(s.imageUrl || '')
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = editing
      ? speakers.map((s) => (s.id === editing.id ? { ...s, name, title, organization, bio, imageUrl } : s))
      : [...speakers, { id: crypto.randomUUID(), name, title, organization, bio, imageUrl }]
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakers: next }),
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
    if (!confirm('确定删除该嘉宾？')) return
    const next = speakers.filter((s) => s.id !== sid)
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakers: next }),
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
        <h2 className="font-display text-2xl font-bold">{t('admin.speakers')}</h2>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-2" /> 添加嘉宾
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>嘉宾列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-ink/50">加载中…</p>
          ) : speakers.length === 0 ? (
            <p className="text-sm text-ink/50">暂无嘉宾。</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {speakers.map((s) => (
                <div key={s.id} className="flex items-start gap-4 rounded-lg border p-4 dark:border-white/10">
                  {s.imageUrl ? (
                    <img src={s.imageUrl} alt={s.name} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <User size={24} className="text-ink/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-ink/70">{s.title}{s.title && s.organization ? ' · ' : ''}{s.organization}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-ink/50">{s.bio || '暂无简介'}</p>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑嘉宾' : '添加嘉宾'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>职位</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>所属机构</Label>
                <Input value={organization} onChange={(e) => setOrganization(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>头像 URL</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>简介</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
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
