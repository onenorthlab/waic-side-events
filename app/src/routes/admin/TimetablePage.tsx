import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Stage { id: string; name: string }
interface Speaker { id: string; name: string }
interface Session {
  id: string
  title: string
  stageId?: string
  speakerIds?: string[]
  date: string
  startTime: string
  endTime: string
}

export function TimetablePage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [sessions, setSessions] = useState<Session[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/manage/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(Array.isArray(data.sessions) ? data.sessions : [])
        setStages(Array.isArray(data.stages) ? data.stages : [])
        setSpeakers(Array.isArray(data.speakers) ? data.speakers : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载时间表失败')
        setLoading(false)
      })
  }, [id])

  const dates = Array.from(new Set(sessions.map((s) => s.date))).sort()

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">{t('admin.timetable')}</h2>
      {loading ? (
        <p className="text-sm text-ink/50">加载中…</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-ink/50">暂无场次。请先在“舞台”和“场次”页面添加。</p>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle>{date}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessions
                  .filter((s) => s.date === date)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((s) => (
                    <div key={s.id} className="flex items-start gap-4 rounded-lg border p-3 dark:border-white/10">
                      <div className="w-24 shrink-0 text-sm text-ink/70">
                        {s.startTime}<br/>{s.endTime}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{s.title}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {s.stageId && (
                            <Badge variant="outline">{stages.find((st) => st.id === s.stageId)?.name || '未知舞台'}</Badge>
                          )}
                          {s.speakerIds?.map((sid) => {
                            const sp = speakers.find((x) => x.id === sid)
                            return sp ? <Badge key={sid} variant="secondary">{sp.name}</Badge> : null
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
