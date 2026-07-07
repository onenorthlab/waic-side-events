import { useParams } from '@tanstack/react-router'
import { CheckinConsole } from '@/components/CheckinConsole'

export function CheckinPage() {
  const { id } = useParams({ from: '/manage/events/$id' })
  return <CheckinConsole apiBase={`/api/manage/events/${id}`} />
}
