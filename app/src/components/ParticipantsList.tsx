import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

interface PublicParticipant {
  name: string
  isSpeaker: boolean
}

const AVATAR_BG = ['#2745e8', '#8da2c0', '#95b5a4', '#b697b3', '#c0a48d', '#1c34c4']
function avatarColor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_BG[h % AVATAR_BG.length]
}

/** 详情页参会者板块：社会认同（"谁会来"是报名决策的关键）。尊重主办方可见性设置与个人隐藏选项。 */
export function ParticipantsList({ slug }: { slug: string }) {
  const [data, setData] = useState<{ visibility: string; total: number; participants: PublicParticipant[] } | null>(null)

  useEffect(() => {
    fetch(`/api/events/${encodeURIComponent(slug)}/participants`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
  }, [slug])

  if (!data || data.visibility === 'PRIVATE' || data.total === 0) return null

  const shown = data.participants.slice(0, 12)
  const hiddenCount = data.total - shown.length

  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
        <Users size={14} className="text-ink/40 dark:text-white/40" />
        谁会来
        <span className="font-normal text-ink/40 dark:text-white/40">{data.total} 人已确认</span>
      </h3>
      {data.participants.length === 0 ? (
        <p className="text-xs text-ink/45 dark:text-white/45">
          {data.visibility === 'APPROVED_ONLY' ? '报名通过后可查看参会者名单' : '参会者选择了不公开展示'}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {shown.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] py-1 pl-1 pr-2.5 dark:bg-white/[0.07]">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ backgroundColor: avatarColor(p.name) }}
                >
                  {(p.name || '?').slice(0, 1)}
                </span>
                <span className="max-w-24 truncate text-xs text-ink/75 dark:text-white/75">{p.name}</span>
                {p.isSpeaker && (
                  <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-semibold text-white">嘉宾</span>
                )}
              </span>
            ))}
          </div>
          {hiddenCount > 0 && <p className="text-xs text-ink/40 dark:text-white/40">还有 {hiddenCount} 人</p>}
        </>
      )}
    </div>
  )
}
