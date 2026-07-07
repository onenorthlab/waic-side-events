import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// 参会者轻账号：邮箱即账号（验证码登录），与主办方 useAuth 相互独立。
interface AttendeeCtx {
  email: string | null
  loading: boolean
  requestOtp: (email: string) => Promise<{ devCode?: string }>
  verify: (email: string, code: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AttendeeContext = createContext<AttendeeCtx | null>(null)

export function AttendeeProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const res = await fetch('/api/attendee/me')
      if (res.ok) {
        const data = await res.json()
        setEmail(data.email)
      } else {
        setEmail(null)
      }
    } catch {
      setEmail(null)
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  const requestOtp = async (em: string) => {
    const res = await fetch('/api/attendee/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: em }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '发送失败')
    return { devCode: data.devCode }
  }

  const verify = async (em: string, code: string) => {
    const res = await fetch('/api/attendee/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: em, code }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '验证失败')
    setEmail(data.email)
  }

  const logout = async () => {
    await fetch('/api/attendee/logout', { method: 'POST' })
    setEmail(null)
  }

  return (
    <AttendeeContext.Provider value={{ email, loading, requestOtp, verify, logout, refresh }}>
      {children}
    </AttendeeContext.Provider>
  )
}

export function useAttendee() {
  const ctx = useContext(AttendeeContext)
  if (!ctx) throw new Error('useAttendee must be used within AttendeeProvider')
  return ctx
}
