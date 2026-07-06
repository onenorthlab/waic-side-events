import { Link } from '@tanstack/react-router'
import { Plus, LogOut, User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { BrandWordmark } from './Brand'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navCls =
  'rounded-full px-3 py-1.5 text-sm font-medium text-ink/65 transition hover:text-ink dark:text-white/65 dark:hover:text-white [&.active]:bg-ink [&.active]:text-white dark:[&.active]:bg-white dark:[&.active]:text-ink'

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
            日程
          </Link>
          <Link to="/events/maps" className={navCls}>
            地图
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
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
              发布活动
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
          日程
        </Link>
        <Link to="/events/maps" className={navCls}>
          地图
        </Link>
      </nav>
    </header>
  )
}
