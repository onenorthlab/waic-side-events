import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('登录成功')
      navigate({ to: '/manage/events' })
    } catch (err: any) {
      toast.error(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header showCreate={false} />
      <main className="mx-auto w-full max-w-[420px] flex-1 px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中…' : '登录'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-ink/60">
              还没有账号？{' '}
              <Link to="/register" className="font-medium text-brand-600 hover:underline">
                立即注册
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
