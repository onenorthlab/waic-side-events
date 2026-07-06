import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  url: string
}

export function PageDesignPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [loading, setLoading] = useState(true)
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [navItems, setNavItems] = useState<NavItem[]>([])

  useEffect(() => {
    fetch(`/api/manage/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const style = data.customStyle || {}
        setPrimaryColor(style.primaryColor || '#3b82f6')
        setNavItems(Array.isArray(data.customNavigation) ? data.customNavigation : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载失败')
        setLoading(false)
      })
  }, [id])

  const save = async () => {
    try {
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customStyle: { primaryColor },
          customNavigation: navItems,
        }),
      })
      if (!res.ok) throw new Error('保存失败')
      toast.success('保存成功')
    } catch {
      toast.error('保存失败')
    }
  }

  const addNav = () => {
    setNavItems([...navItems, { id: crypto.randomUUID(), label: '', url: '' }])
  }

  const updateNav = (idx: number, field: keyof NavItem, value: string) => {
    const next = [...navItems]
    next[idx] = { ...next[idx], [field]: value }
    setNavItems(next)
  }

  const removeNav = (idx: number) => {
    setNavItems(navItems.filter((_, i) => i !== idx))
  }

  if (loading) return <div className="py-12 text-center text-sm text-ink/50">加载中…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.pageDesign')}</h2>
        <Button onClick={save}>保存</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>主题色</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-12 w-20" />
            <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>自定义导航</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {navItems.map((item, idx) => (
            <div key={item.id} className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label className="text-xs">名称</Label>
                <Input value={item.label} onChange={(e) => updateNav(idx, 'label', e.target.value)} />
              </div>
              <div className="flex-1 space-y-2">
                <Label className="text-xs">链接</Label>
                <Input value={item.url} onChange={(e) => updateNav(idx, 'url', e.target.value)} placeholder="https://..." />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeNav(idx)}>
                <Trash2 size={16} className="text-red-500" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addNav}>
            <Plus size={14} className="mr-1" /> 添加导航项
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} size="lg">保存</Button>
      </div>
    </div>
  )
}
