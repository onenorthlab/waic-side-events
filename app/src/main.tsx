import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { LocaleProvider } from './lib/i18n'
import { AuthProvider } from './lib/auth-context'
import { Toaster } from '@/components/ui/sonner'
import './index.css'

// 主题初始化(持久化)
try {
  if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark')
} catch {}
document.documentElement.lang = 'zh'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </AuthProvider>
    </LocaleProvider>
  </StrictMode>
)
