import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { toast } from 'sonner'

export function EventCreatePage() {
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
    <div className="flex min-h-screen flex-col">
      <Header showCreate={false} />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8">
        <h1 className="mb-6 font-display text-2xl font-bold text-ink dark:text-white">{t('nav.createEvent')}</h1>
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  活动名称 <span className="text-red-500">*</span>
                </Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：WAIC 2026 上海周边活动" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">活动描述</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="介绍活动内容、亮点…" />
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
                <Button type="button" variant="outline" onClick={() => navigate({ to: '/manage/events' })}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('common.loading') : t('common.create')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
