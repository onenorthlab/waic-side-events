import { useEffect, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScanLine, UserCog, ArrowRight } from 'lucide-react'

interface StaffRow {
  id: string
  name: string
  email: string
  status: string
  checkedIn: boolean
}

/**
 * 工作人员管理：本产品的模型是"工作人员=被指派的参会者"——
 * 志愿者先自己报名活动，主办方在参与者列表把 TA 指派为「工作人员」，
 * TA 用报名邮箱登录「我的」即可打开本活动核销台（自己也照常参加活动）。
 */
export function StaffPage() {
  const { id } = useParams({ from: '/manage/events/$id' })
  const [staff, setStaff] = useState<StaffRow[] | null>(null)

  useEffect(() => {
    fetch(`/api/manage/events/${id}/participants?pageSize=100`)
      .then((r) => r.json())
      .then((d) => setStaff((d.participants || []).filter((p: any) => p.type === 'STAFF')))
      .catch(() => setStaff([]))
  }, [id])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">工作人员</h2>
        <p className="mt-1 text-sm opacity-60">
          工作人员是被你指派的报名者：TA 在现场帮忙扫码验票，自己也照常参加活动。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">如何添加工作人员</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm opacity-80">
          <p>1. 让 TA 先在活动页正常报名（任何邮箱都行）。</p>
          <p>
            2. 在
            <Link to="/manage/events/$id/participants" params={{ id }} className="mx-1 font-semibold text-brand hover:underline">
              参与者列表
            </Link>
            里把 TA 的身份改为「工作人员」（报名需先审核通过）。
          </p>
          <p>3. TA 用报名邮箱登录本站「我的」页面，就能打开本活动的核销台开始扫码。</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog size={16} /> 已指派 {staff ? `（${staff.length}）` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff === null ? (
            <div className="h-16 animate-pulse rounded-xl bg-black/[0.05] dark:bg-white/10" />
          ) : staff.length === 0 ? (
            <div className="py-8 text-center text-sm opacity-50">
              还没有工作人员。去
              <Link to="/manage/events/$id/participants" params={{ id }} className="mx-1 font-semibold text-brand hover:underline">
                参与者列表
              </Link>
              指派第一位。
            </div>
          ) : (
            <ul className="divide-y divide-black/[0.05] dark:divide-white/10">
              {staff.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="truncate text-xs opacity-50">{s.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      s.status === 'APPROVED' ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400' : 'bg-live/10 text-live'
                    }`}
                  >
                    {s.status === 'APPROVED' ? '已生效' : '待审核通过后生效'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Link
        to="/manage/events/$id/checkin"
        params={{ id }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
      >
        <ScanLine size={15} /> 打开主办方核销台 <ArrowRight size={14} />
      </Link>
    </div>
  )
}
