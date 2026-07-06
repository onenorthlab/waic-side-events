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
import { Plus, Ticket, Trash2, Edit2 } from 'lucide-react'

interface TicketType {
  id: string
  name: string
  description?: string | null
  quantity?: number | null
  maxPerOrder: number
  saleStartsAt?: string | null
  saleEndsAt?: string | null
  type: 'FREE' | 'ONSITE'
  enabled: boolean
  sortOrder: number
}

export function TicketsPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [ticketList, setTicketList] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TicketType | null>(null)

  // Form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [maxPerOrder, setMaxPerOrder] = useState('1')
  const [saleStartsAt, setSaleStartsAt] = useState('')
  const [saleEndsAt, setSaleEndsAt] = useState('')
  const [ticketType, setTicketType] = useState<'FREE' | 'ONSITE'>('FREE')
  const [enabled, setEnabled] = useState(true)

  const fetchTickets = () => {
    setLoading(true)
    fetch(`/api/manage/events/${id}/tickets`)
      .then((r) => r.json())
      .then((data) => {
        setTicketList(data.tickets || [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载票种失败')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchTickets()
  }, [id])

  const resetForm = () => {
    setName('')
    setDescription('')
    setQuantity('')
    setMaxPerOrder('1')
    setSaleStartsAt('')
    setSaleEndsAt('')
    setTicketType('FREE')
    setEnabled(true)
    setEditing(null)
  }

  const openNew = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (t: TicketType) => {
    setEditing(t)
    setName(t.name)
    setDescription(t.description || '')
    setQuantity(t.quantity != null ? String(t.quantity) : '')
    setMaxPerOrder(String(t.maxPerOrder))
    setSaleStartsAt(t.saleStartsAt || '')
    setSaleEndsAt(t.saleEndsAt || '')
    setTicketType(t.type)
    setEnabled(t.enabled)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name,
      description: description || undefined,
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      maxPerOrder: parseInt(maxPerOrder || '1', 10),
      saleStartsAt: saleStartsAt || undefined,
      saleEndsAt: saleEndsAt || undefined,
      type: ticketType,
      enabled,
      sortOrder: editing ? editing.sortOrder : ticketList.length,
    }
    try {
      const url = editing
        ? `/api/manage/events/${id}/tickets/${editing.id}`
        : `/api/manage/events/${id}/tickets`
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('保存失败')
      toast.success(editing ? '已更新' : '已创建')
      setOpen(false)
      resetForm()
      fetchTickets()
    } catch {
      toast.error('保存失败')
    }
  }

  const handleDelete = async (tid: string) => {
    if (!confirm('确定删除该票种？')) return
    try {
      const res = await fetch(`/api/manage/events/${id}/tickets/${tid}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      toast.success('已删除')
      fetchTickets()
    } catch {
      toast.error('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.tickets')}</h2>
        <Button onClick={openNew}>
          <Plus size={16} className="mr-2" /> 新增票种
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>票种列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-ink/50">加载中…</p>
          ) : ticketList.length === 0 ? (
            <p className="text-sm text-ink/50">暂无票种，点击右上角新增。</p>
          ) : (
            <div className="space-y-3">
              {ticketList.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border p-4 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <Ticket size={20} className="text-ink/40" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        <Badge variant={t.enabled ? 'default' : 'secondary'}>{t.enabled ? '启用' : '停用'}</Badge>
                        <Badge variant="outline">{t.type === 'FREE' ? '免费' : '现场'}</Badge>
                      </div>
                      <p className="text-sm text-ink/50">
                        {t.description || '无描述'} · 限量 {t.quantity ?? '不限'} 张 · 每人最多 {t.maxPerOrder} 张
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
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
            <DialogTitle>{editing ? '编辑票种' : '新增票种'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>票种名称</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：普通票 / VIP票" required />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>数量（空表示不限）</Label>
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>每人限购</Label>
                <Input type="number" min={1} value={maxPerOrder} onChange={(e) => setMaxPerOrder(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input type="datetime-local" value={saleStartsAt} onChange={(e) => setSaleStartsAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <Input type="datetime-local" value={saleEndsAt} onChange={(e) => setSaleEndsAt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>票种类型</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" value="FREE" checked={ticketType === 'FREE'} onChange={() => setTicketType('FREE')} />
                  免费票
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="ONSITE" checked={ticketType === 'ONSITE'} onChange={() => setTicketType('ONSITE')} />
                  现场票
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <Label>启用</Label>
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
