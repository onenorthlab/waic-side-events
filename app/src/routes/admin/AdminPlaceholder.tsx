import { useI18n } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'

export function AdminPlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">{t(titleKey)}</h2>
      <Card>
        <CardContent className="py-12 text-center text-sm text-ink/50">{t('common.notInSlice')}</CardContent>
      </Card>
    </div>
  )
}
