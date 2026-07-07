import { useEffect, useRef, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react'
import { Star } from 'lucide-react'
import 'survey-core/survey-core.css'
import 'survey-creator-core/survey-creator-core.css'

interface FeedbackQuestion {
  type: string
  name: string
  title?: string
  isRequired?: boolean
  choices?: string[]
}

interface FeedbackResponseRow {
  id: string
  email: string
  rating: number | null
  answers: Record<string, any> | null
  createdAt: string | null
}

/** 姓名/邮箱中段脱敏：ab***@test.local */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) return `${local[0] || ''}***@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

export function FeedbackPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schema, setSchema] = useState<FeedbackQuestion[]>([])
  const creatorRef = useRef<SurveyCreator | null>(null)

  const [responses, setResponses] = useState<FeedbackResponseRow[]>([])
  const [total, setTotal] = useState(0)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [ratedCount, setRatedCount] = useState(0)
  const [respLoading, setRespLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/manage/events/${id}/feedback-schema`)
      .then((r) => r.json())
      .then((data) => {
        setSchema(Array.isArray(data.feedbackSchema) ? data.feedbackSchema : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载反馈问卷失败')
        setLoading(false)
      })
    loadResponses()
  }, [id])

  const loadResponses = () => {
    setRespLoading(true)
    fetch(`/api/manage/events/${id}/feedback-responses`)
      .then((r) => r.json())
      .then((data) => {
        setResponses(data.responses || [])
        setTotal(data.total || 0)
        setAverageRating(data.averageRating ?? null)
        setRatedCount(data.ratedCount || 0)
        setRespLoading(false)
      })
      .catch(() => {
        toast.error('加载反馈结果失败')
        setRespLoading(false)
      })
  }

  const save = async () => {
    setSaving(true)
    try {
      const elements = (creatorRef.current?.JSON?.elements || []) as FeedbackQuestion[]
      const res = await fetch(`/api/manage/events/${id}/feedback-schema`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackSchema: elements }),
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
    setSchema((creatorRef.current?.JSON?.elements || []) as FeedbackQuestion[])
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.feedback')}</h2>
        <Button onClick={save} disabled={saving}>{saving ? '保存中…' : '保存问卷'}</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>满意度反馈问卷编辑器</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-ink/70 dark:bg-brand/10 dark:text-white/70">
            <Star size={16} className="mt-0.5 shrink-0 text-brand" />
            <p>
              参会者填写反馈时，最上方会固定展示一个「总体评分 1-5 星」，为必填项，由系统统一渲染，无需在下方问卷中重复添加。
              以下编辑器只用于配置评分之外的补充问题（如文字建议、单选题等）。
            </p>
          </div>
          <SurveyCreatorComponent creator={creator} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>回收结果</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-card dark:border-white/10 dark:bg-neutral-900">
              <p className="text-sm text-ink/50 dark:text-white/50">平均总体评分</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-brand">
                  {averageRating != null ? averageRating.toFixed(1) : '-'}
                </span>
                <span className="text-sm text-ink/40 dark:text-white/40">/ 5</span>
              </div>
              <p className="mt-1 text-xs text-ink/40 dark:text-white/40">基于 {ratedCount} 份评分</p>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-card dark:border-white/10 dark:bg-neutral-900">
              <p className="text-sm text-ink/50 dark:text-white/50">反馈总数</p>
              <div className="mt-1 text-4xl font-bold">{total}</div>
              <p className="mt-1 text-xs text-ink/40 dark:text-white/40">已提交的反馈份数</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>邮箱</TableHead>
                <TableHead>评分</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>答案摘要</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {respLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-ink/50">加载中…</TableCell></TableRow>
              ) : responses.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-ink/50">暂无反馈</TableCell></TableRow>
              ) : (
                responses.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{maskEmail(r.email)}</TableCell>
                    <TableCell>
                      {r.rating != null ? (
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Star size={14} className="fill-amber-500" /> {r.rating}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-ink/50">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '-'}
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate text-sm text-ink/60" title={JSON.stringify(r.answers || {})}>
                      {r.answers && Object.keys(r.answers).length > 0 ? JSON.stringify(r.answers) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
