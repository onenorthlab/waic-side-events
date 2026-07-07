import { Link } from '@tanstack/react-router'
import { Plus, LogOut, User, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAttendee } from '@/lib/attendee-context'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { BrandWordmark } from './Brand'
import { LocaleToggle } from './LocaleToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navCls =
  'rounded-full px-3 py-1.5 text-sm font-medium text-ink/65 transition hover:text-ink dark:text-white/65 dark:hover:text-white [&.active]:bg-ink [&.active]:text-white dark:[&.active]:bg-white dark:[&.active]:text-ink'

function NotificationBell() {
  const { t } = useI18n()
  const { email } = useAttendee()
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!email) return
    let alive = true
    const load = () =>
      fetch('/api/attendee/notifications/unread-count')
        .then((r) => r.json())
        .then((d) => alive && setCount(d.count || 0))
        .catch(() => {})
    load()
    const h = setInterval(load, 30000)
    const onRead = () => setCount(0)
    window.addEventListener('notifications-read', onRead)
    return () => {
      alive = false
      clearInterval(h)
      window.removeEventListener('notifications-read', onRead)
    }
  }, [email])
  if (!email) return null
  return (
    <Link
      to="/notifications"
      aria-label={t('nav.notifications')}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:bg-black/5 hover:text-ink dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <Bell size={17} />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

export function Header({ showCreate = false }: { showCreate?: boolean }) {
  const { t } = useI18n()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.07] bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-[#131316]/90">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4">
        <BrandWordmark />

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          <Link to="/events" className={navCls}>
            {t('nav.events')}
          </Link>
          <Link to="/schedules" className={navCls}>
            {t('nav.schedules')}
          </Link>
          <Link to="/events/maps" className={navCls}>
            {t('nav.map')}
          </Link>
          <Link to="/me" className={navCls}>
            {t('nav.me')}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <LocaleToggle className="hidden sm:inline-flex" />
          <NotificationBell />
          {user ? (
            <>
              {showCreate && (
                <Link
                  to="/manage/events/new"
                  className="hidden items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 active:scale-[0.98] sm:inline-flex"
                >
                  <Plus size={15} /> {t('nav.createEvent')}
                </Link>
              )}
              <Link
                to="/manage/events"
                className="text-sm font-medium text-ink/70 hover:text-ink dark:text-white/70 dark:hover:text-white"
              >
                {t('nav.managedEvents')}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback>
                      <User size={16} />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-xs text-ink/50">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut size={14} className="mr-2" /> {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-black/12 px-4 py-2 text-sm font-semibold text-ink transition hover:border-black/25 dark:border-white/20 dark:text-white dark:hover:border-white/40"
            >
              {t('nav.publishEvent')}
            </Link>
          )}
        </div>
      </div>

      {/* 移动端次级导航：一行放下三个入口 */}
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 scrollbar-none sm:hidden">
        <Link to="/events" className={navCls}>
          {t('nav.events')}
        </Link>
        <Link to="/schedules" className={navCls}>
          {t('nav.schedules')}
        </Link>
        <Link to="/events/maps" className={navCls}>
          {t('nav.map')}
        </Link>
        <Link to="/me" className={navCls}>
          {t('nav.me')}
        </Link>
        <LocaleToggle className="ml-1 shrink-0" />
      </nav>
    </header>
  )
}
