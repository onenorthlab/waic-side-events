import { lazy, Suspense } from 'react'
import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { EventsListPage } from './routes/EventsList'
import { BrandMark } from './components/Brand'

// 代码分割策略：首页（最高频入口）留主包；其余页面全部懒加载。
// 后台系（含 survey-creator）与扫码/二维码等重依赖只会进各自的 chunk，不拖累首屏。
const EventsMapPage = lazy(() => import('./routes/EventsMap').then((m) => ({ default: m.EventsMapPage })))
const EventDetailPage = lazy(() => import('./routes/EventDetail').then((m) => ({ default: m.EventDetailPage })))
const SchedulesPage = lazy(() => import('./routes/SchedulesPage').then((m) => ({ default: m.SchedulesPage })))
const TicketPage = lazy(() => import('./routes/TicketPage').then((m) => ({ default: m.TicketPage })))
const MePage = lazy(() => import('./routes/MePage').then((m) => ({ default: m.MePage })))
const StaffCheckinPage = lazy(() => import('./routes/StaffCheckin').then((m) => ({ default: m.StaffCheckinPage })))
const NotificationsPage = lazy(() => import('./routes/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const FeedbackFormPage = lazy(() => import('./routes/FeedbackPage').then((m) => ({ default: m.FeedbackFormPage })))
const LoginPage = lazy(() => import('./routes/Login').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./routes/Register').then((m) => ({ default: m.RegisterPage })))
const ManagedEventsListPage = lazy(() => import('./routes/ManagedEventsList').then((m) => ({ default: m.ManagedEventsListPage })))
const EventCreatePage = lazy(() => import('./routes/EventCreate').then((m) => ({ default: m.EventCreatePage })))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminDashboardPage = lazy(() => import('./routes/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboardPage })))
const AdminPlaceholderPage = lazy(() => import('./routes/admin/AdminPlaceholder').then((m) => ({ default: m.AdminPlaceholderPage })))
const EventSettingsPage = lazy(() => import('./routes/admin/EventSettings').then((m) => ({ default: m.EventSettingsPage })))
const ParticipantsPage = lazy(() => import('./routes/admin/ParticipantsPage').then((m) => ({ default: m.ParticipantsPage })))
const TicketsPage = lazy(() => import('./routes/admin/TicketsPage').then((m) => ({ default: m.TicketsPage })))
const SpeakersPage = lazy(() => import('./routes/admin/SpeakersPage').then((m) => ({ default: m.SpeakersPage })))
const AnnouncementsPage = lazy(() => import('./routes/admin/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })))
const StagesPage = lazy(() => import('./routes/admin/StagesPage').then((m) => ({ default: m.StagesPage })))
const SessionsPage = lazy(() => import('./routes/admin/SessionsPage').then((m) => ({ default: m.SessionsPage })))
const TimetablePage = lazy(() => import('./routes/admin/TimetablePage').then((m) => ({ default: m.TimetablePage })))
const EventFeaturesPage = lazy(() => import('./routes/admin/EventFeaturesPage').then((m) => ({ default: m.EventFeaturesPage })))
const PageDesignPage = lazy(() => import('./routes/admin/PageDesignPage').then((m) => ({ default: m.PageDesignPage })))
const SurveyEditorPage = lazy(() => import('./routes/admin/SurveyEditorPage').then((m) => ({ default: m.SurveyEditorPage })))
const AdminFeedbackPage = lazy(() => import('./routes/admin/FeedbackPage').then((m) => ({ default: m.FeedbackPage })))
const CheckinPage = lazy(() => import('./routes/admin/CheckinPage').then((m) => ({ default: m.CheckinPage })))
const StaffPage = lazy(() => import('./routes/admin/StaffPage').then((m) => ({ default: m.StaffPage })))

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <BrandMark size={32} />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-brand" />
        </div>
      </div>
    </div>
  )
}

const rootRoute = createRootRoute({
  component: () => (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  ),
})

// "/" → /events
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/events' })
  },
})

const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/events',
  component: EventsListPage,
})

const eventsMapRoute = createRoute({ getParentRoute: () => rootRoute, path: '/events/maps', component: EventsMapPage })
const schedulesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/schedules', component: SchedulesPage })
const ticketRoute = createRoute({ getParentRoute: () => rootRoute, path: '/ticket/$token', component: TicketPage })
const meRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me', component: MePage })
const staffCheckinRoute = createRoute({ getParentRoute: () => rootRoute, path: '/staff/$id/checkin', component: StaffCheckinPage })
const notificationsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/notifications', component: NotificationsPage })
const feedbackFormRoute = createRoute({ getParentRoute: () => rootRoute, path: '/feedback/$eventId', component: FeedbackFormPage })

// 活动详情: /<slug>(放最后, 让静态路由优先)
const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$slug',
  component: EventDetailPage,
})

// 认证
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
})

// 管理后台
const requireAuth = async () => {
  const res = await fetch('/api/auth/me')
  if (!res.ok) throw redirect({ to: '/login' })
}

const manageEventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/manage/events',
  component: ManagedEventsListPage,
  beforeLoad: requireAuth,
})

const manageEventsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/manage/events/new',
  component: EventCreatePage,
  beforeLoad: requireAuth,
})

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/manage/events/$id',
  component: AdminLayout,
  beforeLoad: requireAuth,
})

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/dashboard',
  component: AdminDashboardPage,
})

function placeholder(titleKey: string) {
  return () => <AdminPlaceholderPage titleKey={titleKey} />
}

const adminParticipantsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/participants', component: ParticipantsPage })
const adminCheckinRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/checkin', component: CheckinPage })
const adminMeetingsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/meetings', component: placeholder('admin.meetings') })
const adminTicketsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/tickets', component: TicketsPage })
const adminPaymentsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/payments', component: placeholder('admin.payments') })
const adminSurveysRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/surveys', component: SurveyEditorPage })
const adminSpeakersRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/speakers', component: SpeakersPage })
const adminAnnouncementsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/announcements', component: AnnouncementsPage })
const adminFeedbackRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/feedback', component: AdminFeedbackPage })
const adminStaffRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/staff', component: StaffPage })
const adminSettingsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/settings', component: EventSettingsPage })
const adminFeaturesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/features', component: EventFeaturesPage })
const adminDesignRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/design', component: PageDesignPage })
const adminTimetableRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/timetable', component: TimetablePage })
const adminStagesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/stages', component: StagesPage })
const adminSessionsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/sessions', component: SessionsPage })

const routeTree = rootRoute.addChildren([
  indexRoute,
  eventsRoute,
  eventsMapRoute,
  schedulesRoute,
  ticketRoute,
  meRoute,
  staffCheckinRoute,
  notificationsRoute,
  feedbackFormRoute,
  loginRoute,
  registerRoute,
  manageEventsRoute,
  manageEventsNewRoute,
  detailRoute,
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminParticipantsRoute,
    adminCheckinRoute,
    adminMeetingsRoute,
    adminTicketsRoute,
    adminPaymentsRoute,
    adminSurveysRoute,
    adminSpeakersRoute,
    adminAnnouncementsRoute,
    adminFeedbackRoute,
    adminStaffRoute,
    adminSettingsRoute,
    adminFeaturesRoute,
    adminDesignRoute,
    adminTimetableRoute,
    adminStagesRoute,
    adminSessionsRoute,
  ]),
])

export const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
