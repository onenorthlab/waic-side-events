import { Link } from '@tanstack/react-router'
import { Sun, Moon } from 'lucide-react'
import { BrandMark } from './Brand'
import { LocaleToggle } from './LocaleToggle'
import { useI18n } from '@/lib/i18n'

function toggleTheme() {
  const el = document.documentElement
  el.classList.toggle('dark')
  try {
    localStorage.setItem('theme', el.classList.contains('dark') ? 'dark' : 'light')
  } catch {}
}

const linkCls = 'text-sm text-ink/60 transition hover:text-ink dark:text-white/60 dark:hover:text-white'

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="mt-20 border-t border-black/[0.07] dark:border-white/10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BrandMark size={22} />
          <span className="text-sm font-semibold text-ink dark:text-white">WAIC Side Events</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link to="/events" className={linkCls}>
            {t('nav.events')}
          </Link>
          <Link to="/schedules" className={linkCls}>
            {t('nav.schedules')}
          </Link>
          <Link to="/events/maps" className={linkCls}>
            {t('nav.map')}
          </Link>
          <Link to="/login" className={linkCls}>
            {t('nav.publishEvent')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleToggle />
          <button
            onClick={toggleTheme}
            aria-label={t('common.toggleTheme')}
            className="flex w-fit items-center gap-1 rounded-full border border-black/12 px-3 py-1.5 text-ink/70 transition hover:border-black/25 dark:border-white/20 dark:text-white/70 dark:hover:border-white/40"
          >
            <Sun size={14} className="hidden dark:block" />
            <Moon size={14} className="dark:hidden" />
            <span className="text-xs font-medium">{t('common.theme')}</span>
          </button>
        </div>
      </div>
      <div className="border-t border-black/[0.05] py-5 text-center text-xs text-ink/40 dark:border-white/[0.06] dark:text-white/35">
        {t('footer.rights')}
      </div>
    </footer>
  )
}
