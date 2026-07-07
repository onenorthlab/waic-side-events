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
        toast.error(t('admin.eventFeaturesPage.loadFailed'))
        setLoading(false)
      })
  }, [id, t])

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
      if (!res.ok) throw new Error(t('admin.eventFeaturesPage.saveFailed'))
      toast.success(t('admin.eventFeaturesPage.saveSuccess'))
    } catch {
      toast.error(t('admin.eventFeaturesPage.saveFailed'))
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-ink/50">{t('admin.eventFeaturesPage.loading')}</div>

  const toggles = [
    { label: t('admin.eventFeaturesPage.enableTickets'), desc: t('admin.eventFeaturesPage.enableTicketsDesc'), value: enabledTickets, onChange: setEnabledTickets },
    { label: t('admin.eventFeaturesPage.enableMeetings'), desc: t('admin.eventFeaturesPage.enableMeetingsDesc'), value: enabledMeetings, onChange: setEnabledMeetings },
    { label: t('admin.eventFeaturesPage.enableChat'), desc: t('admin.eventFeaturesPage.enableChatDesc'), value: enabledChat, onChange: setEnabledChat },
    { label: t('admin.eventFeaturesPage.enableSideEvents'), desc: t('admin.eventFeaturesPage.enableSideEventsDesc'), value: enabledSideEvents, onChange: setEnabledSideEvents },
    { label: t('admin.eventFeaturesPage.requiresApproval'), desc: t('admin.eventFeaturesPage.requiresApprovalDesc'), value: requiresApproval, onChange: setRequiresApproval },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.eventFeatures')}</h2>
        <Button onClick={save}>{t('admin.eventFeaturesPage.save')}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.eventFeaturesPage.featureToggles')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {toggles.map((item) => (
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
          <CardTitle>{t('admin.eventFeaturesPage.registrationLimits')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('admin.eventFeaturesPage.maxParticipants')}</Label>
            <Input type="number" min={1} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('admin.eventFeaturesPage.participantVisibility')}</Label>
            <Select value={participantListVisibility} onValueChange={(v) => setParticipantListVisibility(v ?? 'PUBLIC')}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">{t('admin.eventFeaturesPage.visibilityPublic')}</SelectItem>
                <SelectItem value="APPROVED_ONLY">{t('admin.eventFeaturesPage.visibilityApprovedOnly')}</SelectItem>
                <SelectItem value="PRIVATE">{t('admin.eventFeaturesPage.visibilityPrivate')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} size="lg">{t('admin.eventFeaturesPage.save')}</Button>
      </div>
    </div>
  )
}
