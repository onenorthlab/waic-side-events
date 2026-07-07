import { useEffect, useState } from 'react'
import { Link, useParams, useRouterState, Outlet } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { BrandMark } from '@/components/Brand'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Ticket,
  CreditCard,
  FileText,
  Mic2,
  Megaphone,
  Star,
  Settings,
  ToggleLeft,
  Palette,
  CalendarClock,
  Monitor,
  Clock,
  UserCog,
  ChevronLeft,
  ExternalLink,
  ScanLine,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  children?: { to: string; label: string; icon: React.ReactNode }[]
  /** 尚未实现的模块：置灰外显，提醒尽快补齐 */
  pending?: boolean
}

export function AdminLayout() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const router = useRouterState()
  const currentPath = router.location.pathname
  const [event, setEvent] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/manage/events/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setEvent)
      .catch(() => {})
  }, [id])

  const base = `/manage/events/${id}`

  const nav: NavItem[] = [
    { to: `${base}/dashboard`, label: t('admin.dashboard'), icon: <LayoutDashboard size={18} /> },
    // 元信息类：紧跟概览，主办方最常回访的配置入口（用户反馈：原来埋太深）
    { to: `${base}/settings`, label: t('admin.eventSettings'), icon: <Settings size={18} /> },
    { to: `${base}/participants`, label: t('admin.participants'), icon: <Users size={18} /> },
    { to: `${base}/checkin`, label: '现场签到', icon: <ScanLine size={18} /> },
    { to: `${base}/staff`, label: t('admin.staff'), icon: <UserCog size={18} /> },
    { to: `${base}/tickets`, label: t('admin.tickets'), icon: <Ticket size={18} /> },
    { to: `${base}/surveys`, label: t('admin.surveys'), icon: <FileText size={18} /> },
    { to: `${base}/speakers`, label: t('admin.speakers'), icon: <Mic2 size={18} /> },
    {
      to: `${base}/timetable`,
      label: t('admin.timetable'),
      icon: <CalendarClock size={18} />,
      children: [
        { to: `${base}/stages`, label: t('admin.stages'), icon: <Monitor size={18} /> },
        { to: `${base}/sessions`, label: t('admin.sessions'), icon: <Clock size={18} /> },
      ],
    },
    { to: `${base}/announcements`, label: t('admin.announcements'), icon: <Megaphone size={18} /> },
    { to: `${base}/features`, label: t('admin.eventFeatures'), icon: <ToggleLeft size={18} /> },
    { to: `${base}/design`, label: t('admin.pageDesign'), icon: <Palette size={18} /> },
    { to: `${base}/feedback`, label: t('admin.feedback'), icon: <Star size={18} /> },
    // —— 以下为待上线模块：置灰外显（团队备忘，尽快做掉）——
    { to: `${base}/meetings`, label: t('admin.meetings'), icon: <MessageSquare size={18} />, pending: true },
    { to: `${base}/payments`, label: t('admin.payments'), icon: <CreditCard size={18} />, pending: true },
  ]

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(`${path}/`)

  const stateLabel: Record<string, string> = {
    DRAFT: '草稿',
    PUBLISHED: '已发布',
    LIMITED: '限定访问',
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-[#131314]">
      <header className="sticky top-0 z-40 h-14 border-b bg-white dark:border-white/10 dark:bg-[#1a1a1b]">
        <div className="mx-auto flex h-full max-w-[1400px] items-center gap-4 px-4">
          <Link to="/events" className="flex items-center gap-2 shrink-0" aria-label="WAIC Side Events 首页">
            <BrandMark size={24} />
          </Link>
          <Link to="/manage/events" className="flex items-center gap-1 text-sm text-ink/60 hover:text-ink dark:text-white/60 dark:hover:text-white">
            <ChevronLeft size={16} /> 我管理的活动
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {event && (
              <a
                href={`/${event.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                <ExternalLink size={14} /> {t('admin.publicPage')}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 移动端：横滑导航条（现场签到等页面是手机场景） */}
      <nav className="sticky top-14 z-30 flex gap-1 overflow-x-auto border-b bg-white px-3 py-2 dark:border-white/10 dark:bg-[#1a1a1b] lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {nav.map((item) => (
          <a
            key={item.to}
            href={item.to}
            className={
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ' +
              (item.pending
                ? 'text-ink/30 dark:text-white/25'
                : isActive(item.to)
                  ? 'bg-ink font-medium text-white dark:bg-white dark:text-ink'
                  : 'text-ink/60 dark:text-white/60')
            }
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-4 py-6">
        {/* 左侧导航（桌面） */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20 rounded-xl border bg-white p-2 dark:border-white/10 dark:bg-[#1a1a1b]">
            <div className="mb-2 border-b px-3 pb-3 dark:border-white/10">
              <div className="truncate text-sm font-semibold">{event?.title || '活动名称'}</div>
              <div className="text-xs text-ink/50 dark:text-white/50">{stateLabel[event?.state] || 'Draft'}</div>
            </div>
            <nav className="flex flex-col gap-0.5">
              {nav.map((item) => (
                <div key={item.to}>
                  <a
                    href={item.to}
                    className={
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ' +
                      (item.pending
                        ? 'text-ink/35 hover:bg-black/[0.03] dark:text-white/30 dark:hover:bg-white/5'
                        : isActive(item.to)
                          ? 'bg-brand/10 font-medium text-brand-600 dark:bg-brand/15 dark:text-brand'
                          : 'text-ink/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10')
                    }
                  >
                    {item.icon}
                    {item.label}
                    {item.pending && (
                      <span className="ml-auto rounded bg-black/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-ink/40 dark:bg-white/10 dark:text-white/40">
                        待上线
                      </span>
                    )}
                  </a>
                  {item.children && isActive(item.to) && (
                    <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l pl-2 dark:border-white/10">
                      {item.children.map((child) => (
                        <a
                          key={child.to}
                          href={child.to}
                          className={
                            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition ' +
                            (isActive(child.to)
                              ? 'font-medium text-brand-600 dark:text-brand'
                              : 'text-ink/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10')
                          }
                        >
                          {child.icon}
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* 主内容 */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
