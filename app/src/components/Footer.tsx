import { Link } from '@tanstack/react-router'
import { Sun, Moon } from 'lucide-react'
import { toast } from '../lib/toast'
import { useI18n } from '../lib/i18n'

function toggleTheme() {
  const el = document.documentElement
  el.classList.toggle('dark')
  try {
    localStorage.setItem('theme', el.classList.contains('dark') ? 'dark' : 'light')
  } catch {}
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-ink/50 dark:text-white/50">{title}</h4>
      <div className="flex flex-col gap-2 text-sm text-ink/80 dark:text-white/75">{children}</div>
    </div>
  )
}

const linkCls = 'text-left hover:text-brand-600 dark:hover:text-brand transition'

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="mt-16 border-t border-black/10 bg-white dark:border-white/10 dark:bg-[#131314]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <img src="/4s_logo.svg" alt="4S" className="h-7 dark:invert" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="切换主题"
              className="flex items-center gap-1 rounded-lg border border-black/15 px-2.5 py-1.5 dark:border-white/20"
            >
              <Sun size={15} className="hidden dark:block" />
              <Moon size={15} className="dark:hidden" />
            </button>
          </div>
        </div>

        <Col title={t('footer.sitemap')}>
          <Link to="/events" className={linkCls}>
            {t('nav.events')}
          </Link>
          <Link to="/communities" className={linkCls}>
            {t('nav.communities')}
          </Link>
          <Link to="/playlists" className={linkCls}>
            {t('playlists.title')}
          </Link>
        </Col>

        <Col title={t('footer.company')}>
          <button className={linkCls} onClick={() => toast(t('common.notInSlice'))}>
            {t('footer.about')}
          </button>
          <button className={linkCls} onClick={() => toast(t('common.notInSlice'))}>
            {t('footer.contact')}
          </button>
        </Col>

        <Col title={t('footer.legal')}>
          <button className={linkCls} onClick={() => toast(t('common.notInSlice'))}>
            {t('footer.terms')}
          </button>
          <button className={linkCls} onClick={() => toast(t('common.notInSlice'))}>
            {t('footer.privacy')}
          </button>
          <button className={linkCls} onClick={() => toast(t('common.notInSlice'))}>
            {t('footer.commercial')}
          </button>
          <img src="/iso-27001.jpg" alt="ISO/IEC 27001 certified" className="mt-2 h-14 w-auto rounded" />
        </Col>
      </div>
      <div className="border-t border-black/5 py-5 text-center text-xs text-ink/50 dark:border-white/5 dark:text-white/40">
        {t('footer.rights')}
      </div>
    </footer>
  )
}
