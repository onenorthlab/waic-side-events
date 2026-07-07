import { lazy, Suspense, useEffect, useState } from 'react'

// SurveyJS 很重（survey-core ~1MB+），只有配置了报名/反馈问卷的活动才需要。
// 这里做成懒加载岛：主包零 survey 依赖，用到时才拉 chunk。
const SurveyInner = lazy(async () => {
  const [{ Survey }, { Model }] = await Promise.all([import('survey-react-ui'), import('survey-core')])
  // @ts-expect-error vite 处理 css 导入，无类型声明
  await import('survey-core/survey-core.css')
  return {
    default: function SurveyHost({ elements, onModel }: { elements: any[]; onModel: (m: any) => void }) {
      const [model] = useState(() => new Model({ elements }))
      useEffect(() => {
        onModel(model)
      }, [model, onModel])
      return <Survey model={model} />
    },
  }
})

export function SurveyBlock({ elements, onModel }: { elements: any[]; onModel: (m: any) => void }) {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-black/[0.05] dark:bg-white/10" />}>
      <SurveyInner elements={elements} onModel={onModel} />
    </Suspense>
  )
}
