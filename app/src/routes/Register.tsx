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

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('密码至少需要 8 位')
      return
    }
    setLoading(true)
    try {
      await register({ email, password, firstName, lastName })
      toast.success('注册成功')
      navigate({ to: '/manage/events' })
    } catch (err: any) {
      toast.error(err.message || '注册失败')
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
            <CardTitle className="text-xl">注册</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">名</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="名" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">姓</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="姓" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="至少 8 位" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '注册中…' : '注册'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-ink/60">
              已有账号？{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:underline">
                直接登录
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
