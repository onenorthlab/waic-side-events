import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { LocaleProvider } from './lib/i18n'
import { AuthProvider } from './lib/auth-context'
import { AttendeeProvider } from './lib/attendee-context'
import { Toaster } from '@/components/ui/sonner'
import './index.css'

// 主题初始化(持久化)
try {
  if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark')
} catch {}
// 语言初始化(持久化)：LocaleProvider 会在挂载后同步 document.documentElement.lang，
// 这里先做一次同步读取，避免首次渲染前出现闪烁。
try {
  const savedLocale = localStorage.getItem('locale')
  document.documentElement.lang = savedLocale === 'en' ? 'en' : 'zh'
} catch {
  document.documentElement.lang = 'zh'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <AuthProvider>
        <AttendeeProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" />
        </AttendeeProvider>
      </AuthProvider>
    </LocaleProvider>
  </StrictMode>
)
