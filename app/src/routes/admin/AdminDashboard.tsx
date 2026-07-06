import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Clock, Ticket } from 'lucide-react'
import { toast } from 'sonner'

export function AdminDashboardPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, checkedIn: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/manage/events/${id}/participants?pageSize=1`)
      .then((r) => r.json())
      .then((data) => {
        const counts: Record<string, number> = {}
        ;(data.counts || []).forEach((c: any) => (counts[c.status] = c.count))
        setStats({
          total: data.total || 0,
          pending: counts['PENDING'] || 0,
          approved: counts['APPROVED'] || 0,
          checkedIn: 0,
        })
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载数据失败')
        setLoading(false)
      })
  }, [id])

  const Stat = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon size={18} className="text-ink/40" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{loading ? '-' : value}</div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">{t('admin.dashboard')}</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="总报名" value={stats.total} icon={Ticket} />
        <Stat label="待审批" value={stats.pending} icon={Clock} />
        <Stat label="已确认" value={stats.approved} icon={Users} />
        <Stat label="已签到" value={stats.checkedIn} icon={UserCheck} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>参与者趋势</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <p className="text-sm text-ink/50">暂无数据</p>
        </CardContent>
      </Card>
    </div>
  )
}
