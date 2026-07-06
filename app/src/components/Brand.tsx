import { Link } from '@tanstack/react-router'

// 品牌字标：钴蓝方块 mark + 双行 wordmark。单一几何 mark，刻意不做复杂图形。
export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="30" height="30" rx="8" className="fill-brand" />
      <path
        d="M7 10.5 L10.5 21.5 L13.5 13 L16.5 21.5 L20 10.5"
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.5" cy="20" r="2.1" fill="white" />
    </svg>
  )
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/events" className="flex items-center gap-2.5" aria-label="WAIC Side Events 首页">
      <BrandMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-ink dark:text-white">WAIC Side Events</span>
          <span className="mt-0.5 text-[10px] font-medium tracking-[0.08em] text-ink/45 dark:text-white/45">
            世界人工智能大会 · 周边活动
          </span>
        </span>
      )}
    </Link>
  )
}
