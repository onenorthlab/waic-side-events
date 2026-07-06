import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { EventsListPage } from './routes/EventsList'
import { EventsMapPage } from './routes/EventsMap'
import { EventDetailPage } from './routes/EventDetail'
import { CommunitiesListPage } from './routes/CommunitiesList'
import { CommunityDetailPage } from './routes/CommunityDetail'
import { PlaylistsListPage } from './routes/PlaylistsList'
import { PlaylistDetailPage } from './routes/PlaylistDetail'
import { SchedulesPage } from './routes/SchedulesPage'
import { ManagedEventsListPage } from './routes/ManagedEventsList'
import { EventCreatePage } from './routes/EventCreate'
import { LoginPage } from './routes/Login'
import { RegisterPage } from './routes/Register'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboardPage } from './routes/admin/AdminDashboard'
import { AdminPlaceholderPage } from './routes/admin/AdminPlaceholder'
import { EventSettingsPage } from './routes/admin/EventSettings'
import { ParticipantsPage } from './routes/admin/ParticipantsPage'
import { TicketsPage } from './routes/admin/TicketsPage'
import { SpeakersPage } from './routes/admin/SpeakersPage'
import { AnnouncementsPage } from './routes/admin/AnnouncementsPage'
import { StagesPage } from './routes/admin/StagesPage'
import { SessionsPage } from './routes/admin/SessionsPage'
import { TimetablePage } from './routes/admin/TimetablePage'
import { EventFeaturesPage } from './routes/admin/EventFeaturesPage'
import { PageDesignPage } from './routes/admin/PageDesignPage'
import { SurveyEditorPage } from './routes/admin/SurveyEditorPage'

const rootRoute = createRootRoute({ component: () => <Outlet /> })

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
const communitiesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/communities', component: CommunitiesListPage })
const communityDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/communities/$slug', component: CommunityDetailPage })
const playlistsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/playlists', component: PlaylistsListPage })
const playlistDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/playlists/$id', component: PlaylistDetailPage })

// 活动详情:归档真实路由是 /en/<slug>;切片单 locale,简化为 /<slug>(放最后, 让静态路由优先)
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
const adminMeetingsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/meetings', component: placeholder('admin.meetings') })
const adminTicketsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/tickets', component: TicketsPage })
const adminPaymentsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/payments', component: placeholder('admin.payments') })
const adminSurveysRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/surveys', component: SurveyEditorPage })
const adminSpeakersRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/speakers', component: SpeakersPage })
const adminAnnouncementsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/announcements', component: AnnouncementsPage })
const adminFeedbackRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/feedback', component: placeholder('admin.feedback') })
const adminStaffRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/staff', component: placeholder('admin.staff') })
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
  communitiesRoute,
  communityDetailRoute,
  playlistsRoute,
  playlistDetailRoute,
  loginRoute,
  registerRoute,
  manageEventsRoute,
  manageEventsNewRoute,
  detailRoute,
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminParticipantsRoute,
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
