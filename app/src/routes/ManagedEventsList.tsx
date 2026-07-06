import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { Plus, Calendar, MapPin } from 'lucide-react'

export function ManagedEventsListPage() {
  const { t } = useI18n()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/manage/events')
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => setEvents(d.events || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header showCreate={false} />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-ink dark:text-white">{t('nav.managedEvents')}</h1>
          <Link to="/manage/events/new">
            <Button>
              <Plus size={16} className="mr-1.5" /> {t('nav.createEvent')}
            </Button>
          </Link>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-ink/50">{t('common.loading')}</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <p className="text-ink/60 dark:text-white/60">{t('admin.noEvents')}</p>
              <Link to="/manage/events/new">
                <Button>{t('admin.createFirstEvent')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((ev: any) => (
              <a key={ev.id} href={`/manage/events/${ev.id}/dashboard`}>
                <Card className="transition hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {ev.mainImageUrl ? (
                        <img src={ev.mainImageUrl} alt="" className="h-20 w-32 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="h-20 w-32 shrink-0 rounded-lg bg-black/5 dark:bg-white/10" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{ev.title}</h3>
                        <div className="mt-1 flex items-center gap-1 text-xs text-ink/60 dark:text-white/60">
                          <Calendar size={12} />
                          {ev.schedules?.[0]?.date || '待定'}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-ink/60 dark:text-white/60">
                          <MapPin size={12} />
                          {ev.location?.[0]?.displayText || ev.eventType === 'ONLINE' ? '线上' : '待定'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
