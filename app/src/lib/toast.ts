// 极简命令式 toast。用途:给"本公开面切片未包含"的控件(登录/创建活动/Communities 等
// 登录后功能)一个诚实反馈 —— 满足"无死控件"(点了有反应)且不臆造功能。
let host: HTMLDivElement | null = null

export function toast(msg: string) {
  if (typeof document === 'undefined') return
  if (!host) {
    host = document.createElement('div')
    host.style.cssText =
      'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none'
    document.body.appendChild(host)
  }
  const el = document.createElement('div')
  el.textContent = msg
  el.style.cssText =
    'background:#131314;color:#fff;font-size:13px;line-height:1.4;padding:10px 16px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);max-width:min(90vw,420px);opacity:0;transition:opacity .18s,transform .18s;transform:translateY(6px)'
  host.appendChild(el)
  requestAnimationFrame(() => {
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
  })
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(6px)'
    setTimeout(() => el.remove(), 200)
  }, 2600)
}

export const NOT_IN_SLICE = '本切片仅复刻公开的 Events 模块；此功能属登录后 / 其他模块，尚未包含。'
