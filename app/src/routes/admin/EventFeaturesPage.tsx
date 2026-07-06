import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export function EventFeaturesPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [loading, setLoading] = useState(true)

  const [enabledTickets, setEnabledTickets] = useState(false)
  const [enabledMeetings, setEnabledMeetings] = useState(false)
  const [enabledChat, setEnabledChat] = useState(false)
  const [enabledSideEvents, setEnabledSideEvents] = useState(false)
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState('')
  const [participantListVisibility, setParticipantListVisibility] = useState('PUBLIC')

  useEffect(() => {
    fetch(`/api/manage/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setEnabledTickets(!!data.enabledTickets)
        setEnabledMeetings(!!data.enabledMeetings)
        setEnabledChat(!!data.enabledChat)
        setEnabledSideEvents(!!data.enabledSideEvents)
        setRequiresApproval(!!data.requiresApproval)
        setMaxParticipants(data.maxParticipants != null ? String(data.maxParticipants) : '')
        setParticipantListVisibility(data.participantListVisibility || 'PUBLIC')
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载失败')
        setLoading(false)
      })
  }, [id])

  const save = async () => {
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabledTickets,
          enabledMeetings,
          enabledChat,
          enabledSideEvents,
          requiresApproval,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
          participantListVisibility,
        }),
      })
      if (!res.ok) throw new Error('保存失败')
      toast.success('保存成功')
    } catch {
      toast.error('保存失败')
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-ink/50">加载中…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.eventFeatures')}</h2>
        <Button onClick={save}>保存</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>功能开关</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { label: '启用票务', desc: '开启后参与者可选择票种报名', value: enabledTickets, onChange: setEnabledTickets },
            { label: '启用会议预约', desc: '允许参与者预约 1:1 会议', value: enabledMeetings, onChange: setEnabledMeetings },
            { label: '启用聊天', desc: '活动内参与者可互相聊天', value: enabledChat, onChange: setEnabledChat },
            { label: '启用周边活动', desc: '显示并管理子活动/边会', value: enabledSideEvents, onChange: setEnabledSideEvents },
            { label: '报名需审批', desc: '新报名默认待审批，需手动确认', value: requiresApproval, onChange: setRequiresApproval },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-ink/50">{item.desc}</p>
              </div>
              <Switch checked={item.value} onCheckedChange={item.onChange} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>报名限制</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>最大参与人数（空表示不限）</Label>
            <Input type="number" min={1} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>参与者名单可见性</Label>
            <Select value={participantListVisibility} onValueChange={(v) => setParticipantListVisibility(v ?? 'PUBLIC')}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">公开</SelectItem>
                <SelectItem value="APPROVED_ONLY">仅已确认者可见</SelectItem>
                <SelectItem value="PRIVATE">仅组织者可见</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} size="lg">保存</Button>
      </div>
    </div>
  )
}
