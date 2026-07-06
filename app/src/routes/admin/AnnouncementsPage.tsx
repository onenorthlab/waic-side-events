import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Megaphone, Trash2, Edit2 } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  body: string
  pinned: boolean
  publishedAt: string
}

export function AnnouncementsPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)

  const fetchEvent = () => {
    setLoading(true)
    fetch(`/api/manage/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data.announcements) ? data.announcements : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载公告失败')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchEvent()
  }, [id])

  const reset = () => {
    setTitle('')
    setBody('')
    setPinned(false)
    setEditing(null)
  }

  const openNew = () => {
    reset()
    setOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setTitle(a.title)
    setBody(a.body)
    setPinned(a.pinned)
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = editing
      ? items.map((a) => (a.id === editing.id ? { ...a, title, body, pinned } : a))
      : [{ id: crypto.randomUUID(), title, body, pinned, publishedAt: new Date().toISOString() }, ...items]
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcements: next }),
      })
      if (!res.ok) throw new Error('保存失败')
      toast.success(editing ? '已更新' : '已发布')
      setOpen(false)
      reset()
      fetchEvent()
    } catch {
      toast.error('保存失败')
    }
  }

  const remove = async (aid: string) => {
    if (!confirm('确定删除该公告？')) return
    const next = items.filter((a) => a.id !== aid)
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcements: next }),
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
        <h2 className="font-display text-2xl font-bold">{t('admin.announcements')}</h2>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-2" /> 发布公告
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>公告列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-ink/50">加载中…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-ink/50">暂无公告。</p>
          ) : (
            <div className="space-y-3">
              {items.map((a) => (
                <div key={a.id} className="rounded-lg border p-4 dark:border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Megaphone size={18} className="text-ink/40" />
                      <span className="font-medium">{a.title}</span>
                      {a.pinned && <Badge variant="secondary">置顶</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink/70">{a.body}</p>
                  <p className="mt-2 text-xs text-ink/40">{new Date(a.publishedAt).toLocaleString('zh-CN')}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑公告' : '发布公告'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} required />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={pinned} onCheckedChange={setPinned} />
              <Label>置顶</Label>
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
