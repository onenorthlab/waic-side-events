import { useI18n } from '@/lib/i18n'

/**
 * 语言切换：EN / 中 文字 pill toggle。钴蓝强调当前选中项，遵循 .impeccable.md 圆角体系。
 */
export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()

  const itemCls = (active: boolean) =>
    'rounded-full px-2.5 py-1 text-xs font-semibold transition ' +
    (active ? 'bg-brand text-white' : 'text-ink/50 hover:text-ink dark:text-white/50 dark:hover:text-white')

  return (
    <div
      role="group"
      aria-label="Language"
      className={
        'inline-flex items-center gap-0.5 rounded-full border border-black/12 p-0.5 dark:border-white/20 ' + (className || '')
      }
    >
      <button type="button" onClick={() => setLocale('en')} className={itemCls(locale === 'en')}>
        EN
      </button>
      <button type="button" onClick={() => setLocale('zh')} className={itemCls(locale === 'zh')}>
        中
      </button>
    </div>
  )
}
