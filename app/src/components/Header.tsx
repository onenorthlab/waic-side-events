import { Link } from '@tanstack/react-router'
import { Calendar, Plus, LogOut, User, Clock } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Header({ showCreate = false }: { showCreate?: boolean }) {
  const { t } = useI18n()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-black/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#131314]/95">
      <div className="mx-auto flex h-full max-w-[1200px] items-center gap-6 px-4">
        <Link to="/events" className="flex items-center gap-2 shrink-0" aria-label="4S home">
          <img src="/4s_logo_symbol_black.svg" alt="4S" className="h-6 w-6 dark:invert" />
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link
            to="/events"
            className="flex items-center gap-1.5 font-medium text-ink/80 hover:text-ink dark:text-white/80 dark:hover:text-white [&.active]:font-semibold [&.active]:text-ink dark:[&.active]:text-white"
          >
            <Calendar size={16} /> {t('nav.events')}
          </Link>
          <Link
            to="/schedules"
            className="flex items-center gap-1.5 font-medium text-ink/80 hover:text-ink dark:text-white/80 dark:hover:text-white [&.active]:font-semibold [&.active]:text-ink dark:[&.active]:text-white"
          >
            <Clock size={16} /> 日程
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              {showCreate && (
                <Link to="/manage/events/new">
                  <Button size="sm">
                    <Plus size={16} className="mr-1.5" /> {t('nav.createEvent')}
                  </Button>
                </Link>
              )}
              <Link to="/manage/events" className="text-sm font-semibold text-ink hover:text-brand-600 dark:text-white">
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
            <Link to="/login">
              <Button variant="ghost" size="sm">
                {t('nav.signUpLogin')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
