import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useAttendee } from '../lib/attendee-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Survey } from 'survey-react-ui'
import { Model } from 'survey-core'
import 'survey-core/survey-core.css'
import { Star, CheckCircle2 } from 'lucide-react'

interface FeedbackFormData {
  event: { id: string; title: string; slug: string }
  feedbackSchema: any[]
  submitted: boolean
  response: { rating: number | null; answers: Record<string, any> | null } | null
}

type LoadState = 'loading' | 'ok' | 'unauthorized' | 'forbidden' | 'not_found'

/** 星星评分：1-5，必填。 */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition active:scale-90"
            aria-label={`${n} 星`}
          >
            <Star
              size={36}
              className={filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-ink/20 dark:text-white/20'}
            />
          </button>
        )
      })}
    </div>
  )
}

export function FeedbackFormPage() {
  const { eventId } = useParams({ from: '/feedback/$eventId' })
  const { email, loading: attendeeLoading } = useAttendee()
  const [state, setState] = useState<LoadState>('loading')
  const [data, setData] = useState<FeedbackFormData | null>(null)
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(0)
  const [surveyModel, setSurveyModel] = useState<Model | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (attendeeLoading) return
    if (!email) {
      setState('unauthorized')
      return
    }
    fetch(`/api/attendee/events/${eventId}/feedback-form`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) {
          setMessage(d.message || '无法加载反馈表单')
          setState(d.error === 'not_found' ? 'not_found' : 'forbidden')
          return
        }
        setData(d)
        if (d.submitted && d.response) {
          setRating(d.response.rating || 0)
          setDone(true)
        }
        if (Array.isArray(d.feedbackSchema) && d.feedbackSchema.length > 0) {
          const model = new Model({ elements: d.feedbackSchema })
          if (d.response?.answers) model.data = d.response.answers
          setSurveyModel(model)
        }
        setState('ok')
      })
      .catch(() => {
        setMessage('网络错误，请稍后重试')
        setState('forbidden')
      })
  }, [eventId, email, attendeeLoading])

  const submit = async () => {
    if (rating < 1) {
      toast.error('请先给出总体评分')
      return
    }
    if (surveyModel && surveyModel.hasErrors(false)) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/attendee/events/${eventId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, answers: surveyModel ? surveyModel.data : {} }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.message || '提交失败')
      setDone(true)
      toast.success('反馈已提交，感谢你的支持')
    } catch (e: any) {
      toast.error(e.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[560px] flex-1 px-4 pb-12 pt-8 md:pt-12">
        {state === 'loading' && (
          <div className="mt-8 h-72 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/10" />
        )}

        {state === 'unauthorized' && (
          <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-neutral-900">
            <h1 className="text-xl font-bold text-ink dark:text-white">请先登录</h1>
            <p className="mt-2 text-sm text-ink/55 dark:text-white/55">
              用报名时的邮箱登录后，才能填写活动反馈。
            </p>
            <Link
              to="/me"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              去登录
            </Link>
          </div>
        )}

        {(state === 'forbidden' || state === 'not_found') && (
          <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-neutral-900">
            <h1 className="text-xl font-bold text-ink dark:text-white">暂时无法填写</h1>
            <p className="mt-2 text-sm text-ink/55 dark:text-white/55">{message || '活动不存在或你还没有资格填写反馈'}</p>
            <Link to="/me" className="mt-5 inline-block text-sm font-semibold text-brand hover:underline">
              返回我的报名 →
            </Link>
          </div>
        )}

        {state === 'ok' && data && !done && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">活动反馈</h1>
            <p className="mt-1.5 text-sm text-ink/55 dark:text-white/55">{data.event.title}</p>

            <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-card dark:border-white/10 dark:bg-neutral-900">
              <p className="text-sm font-semibold text-ink dark:text-white">总体评分</p>
              <p className="mt-1 text-xs text-ink/50 dark:text-white/50">你对这次活动的整体体验打几分？</p>
              <div className="mt-3">
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>

            {surveyModel && (
              <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-2 shadow-card dark:border-white/10 dark:bg-neutral-900">
                <Survey model={surveyModel} />
              </div>
            )}

            <Button size="lg" className="mt-6 w-full rounded-full" onClick={submit} disabled={submitting}>
              {submitting ? '提交中…' : '提交反馈'}
            </Button>
          </div>
        )}

        {state === 'ok' && data && done && (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-neutral-900">
            <CheckCircle2 size={40} className="text-brand" />
            <h1 className="mt-3 text-xl font-bold text-ink dark:text-white">感谢你的反馈</h1>
            <p className="mt-2 text-sm text-ink/55 dark:text-white/55">
              你的评分：<span className="font-semibold text-brand">{rating} / 5</span>
            </p>
            <Link to="/me" className="mt-5 text-sm font-semibold text-brand hover:underline">
              返回我的报名 →
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
