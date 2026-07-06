import { useEffect, useRef, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react'
import 'survey-core/survey-core.css'
import 'survey-creator-core/survey-creator-core.css'

interface SurveyQuestion {
  type: string
  name: string
  title?: string
  isRequired?: boolean
  choices?: string[]
}

export function SurveyEditorPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schema, setSchema] = useState<SurveyQuestion[]>([])
  const creatorRef = useRef<SurveyCreator | null>(null)

  useEffect(() => {
    fetch(`/api/manage/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSchema(Array.isArray(data.surveySchema) ? data.surveySchema : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载报名表单失败')
        setLoading(false)
      })
  }, [id])

  const save = async () => {
    setSaving(true)
    try {
      const elements = (creatorRef.current?.JSON?.elements || []) as SurveyQuestion[]
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveySchema: elements }),
      })
      if (!res.ok) throw new Error('保存失败')
      setSchema(elements)
      toast.success('保存成功')
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-ink/50">加载中…</div>

  const creator = new SurveyCreator({ showLogicTab: false, showTranslationTab: false })
  creatorRef.current = creator
  creator.JSON = { elements: schema }
  creator.onModified.add(() => {
    setSchema((creatorRef.current?.JSON?.elements || []) as SurveyQuestion[])
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.surveys')}</h2>
        <Button onClick={save} disabled={saving}>{saving ? '保存中…' : '保存表单'}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>报名表单编辑器</CardTitle>
        </CardHeader>
        <CardContent>
          <SurveyCreatorComponent creator={creator} />
        </CardContent>
      </Card>
    </div>
  )
}
