import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Search, Download, CheckCircle, XCircle, UserCheck } from 'lucide-react'

interface Participant {
  id: string
  name: string
  email: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  type: string
  checkedIn: boolean
  createdAt: string
  notes?: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '待审批',
  APPROVED: '已确认',
  REJECTED: '已拒绝',
  CANCELLED: '已取消',
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
  CANCELLED: 'outline',
}

export function ParticipantsPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [participants, setParticipants] = useState<Participant[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    fetch(`/api/manage/events/${id}/participants?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setParticipants(data.participants || [])
        setTotal(data.total || 0)
        const c: Record<string, number> = {}
        ;(data.counts || []).forEach((x: any) => (c[x.status] = x.count))
        setCounts(c)
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载参与者失败')
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [id, page, status])

  const updateStatus = async (pid: string, next: Participant['status']) => {
    setActionId(pid)
    try {
      const res = await fetch(`/api/manage/events/${id}/participants/${pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error('更新失败')
      toast.success('状态已更新')
      fetchData()
    } catch {
      toast.error('更新失败')
    } finally {
      setActionId(null)
    }
  }

  // 指派身份：工作人员获得本活动核销台权限（从「我的」页进入），嘉宾/VIP/媒体用于运营区分
  const updateType = async (pid: string, next: string) => {
    setActionId(pid)
    try {
      const res = await fetch(`/api/manage/events/${id}/participants/${pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: next }),
      })
      if (!res.ok) throw new Error('更新失败')
      toast.success(next === 'STAFF' ? '已指派为工作人员，TA 登录「我的」即可打开核销台' : '身份已更新')
      fetchData()
    } catch {
      toast.error('更新失败')
    } finally {
      setActionId(null)
    }
  }

  const exportCsv = () => {
    window.open(`/api/manage/events/${id}/participants/export.csv`)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.participants')}</h2>
        <Button variant="outline" onClick={exportCsv}>
          <Download size={16} className="mr-2" /> 导出 CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((s) => (
          <Card key={s} className={status === s ? 'border-primary' : ''} onClick={() => { setStatus(status === s ? '' : s); setPage(1) }}>
            <CardContent className="flex cursor-pointer items-center justify-between p-4">
              <div>
                <p className="text-sm text-ink/50">{STATUS_LABELS[s]}</p>
                <p className="text-2xl font-bold">{counts[s] || 0}</p>
              </div>
              <Badge variant={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>参与者列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索姓名或邮箱" className="pl-9" onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchData())} />
            </div>
            <Button variant="secondary" onClick={() => { setPage(1); fetchData() }}>搜索</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>签到</TableHead>
                <TableHead>报名时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-ink/50">加载中…</TableCell></TableRow>
              ) : participants.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-ink/50">暂无参与者</TableCell></TableRow>
              ) : (
                participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>
                      <select
                        value={p.type}
                        disabled={actionId === p.id}
                        onChange={(e) => updateType(p.id, e.target.value)}
                        className="rounded-lg border border-black/10 bg-transparent px-2 py-1 text-sm dark:border-white/15"
                        title="指派身份（工作人员将获得核销台权限）"
                      >
                        <option value="GENERAL">普通</option>
                        <option value="VIP">VIP</option>
                        <option value="SPEAKER">嘉宾</option>
                        <option value="STAFF">工作人员</option>
                        <option value="MEDIA">媒体</option>
                      </select>
                    </TableCell>
                    <TableCell><Badge variant={STATUS_COLORS[p.status]}>{STATUS_LABELS[p.status]}</Badge></TableCell>
                    <TableCell>{p.checkedIn ? <UserCheck size={16} className="text-green-500" /> : '-'}</TableCell>
                    <TableCell className="text-sm text-ink/50">{p.createdAt ? new Date(p.createdAt).toLocaleString('zh-CN') : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {p.status === 'PENDING' && (
                          <Button size="sm" variant="outline" disabled={actionId === p.id} onClick={() => updateStatus(p.id, 'APPROVED')}>
                            <CheckCircle size={14} className="mr-1 text-green-500" /> 确认
                          </Button>
                        )}
                        {(p.status === 'PENDING' || p.status === 'APPROVED') && (
                          <Button size="sm" variant="outline" disabled={actionId === p.id} onClick={() => updateStatus(p.id, 'REJECTED')}>
                            <XCircle size={14} className="mr-1 text-red-500" /> 拒绝
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/50">共 {total} 条</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
              <span className="px-2 py-1 text-sm">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
