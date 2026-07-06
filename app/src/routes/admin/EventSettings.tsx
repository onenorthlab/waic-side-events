import { useEffect, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Calendar, Clock, MapPin, Plus, Trash2, X, Globe, Mail, Link2, AtSign } from 'lucide-react'

interface Schedule {
  date: string
  startTime: string
  endTime: string
}

interface Venue {
  title?: string
  displayText: string
  city?: string
  country?: string
}

interface OrganizerContact {
  type: 'email' | 'url'
  value: string
  label?: string
}

const TIMEZONES = [
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'UTC',
]

const EVENT_TYPES = [
  { value: 'ONSITE', label: '线下' },
  { value: 'ONLINE', label: '线上' },
  { value: 'HYBRID', label: '线上线下混合' },
]

const STATES = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'LIMITED', label: '限定访问' },
]

export function EventSettingsPage() {
  const { t } = useI18n()
  const { id } = useParams({ from: '/manage/events/$id' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [catchphrase, setCatchphrase] = useState('')
  const [description, setDescription] = useState('')
  const [state, setState] = useState('DRAFT')
  const [eventType, setEventType] = useState('ONSITE')
  const [timezone, setTimezone] = useState('Asia/Shanghai')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [onlineUrl, setOnlineUrl] = useState('')
  const [onlineDescription, setOnlineDescription] = useState('')
  const [organizerEmail, setOrganizerEmail] = useState('')
  const [contacts, setContacts] = useState<OrganizerContact[]>([])
  const [sns, setSns] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [mainImageUrl, setMainImageUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  // Amap venue search
  const [venueSearch, setVenueSearch] = useState('')
  const [venueSearchCity, setVenueSearchCity] = useState('上海')
  const [venueResults, setVenueResults] = useState<any[]>([])
  const [venueSearching, setVenueSearching] = useState(false)

  useEffect(() => {
    fetch(`/api/manage/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title || '')
        setCatchphrase(data.catchphrase || '')
        setDescription(data.description || '')
        setState(data.state || 'DRAFT')
        setEventType(data.eventType || 'ONSITE')
        setTimezone(data.timezone || 'Asia/Shanghai')
        setSchedules(data.schedules || [])
        setVenues((data.location || []).map((v: any) => ({ title: v.title || '', displayText: v.displayText || '', city: v.city, country: v.country })))
        setOnlineUrl(data.onlineUrl || '')
        setOnlineDescription(data.onlineDescription || '')
        setOrganizerEmail(data.organizerEmail || '')
        setContacts((data.organizerContact || []).map((c: any) => ({ type: c.type || 'url', value: c.value || c.url || '', label: c.label || '' })))
        setSns(data.snsAccounts || { x: '', instagram: '', facebook: '', youtube: '' })
        setTags(data.tags || [])
        setMainImageUrl(data.mainImageUrl || '')
        setThumbnailUrl(data.thumbnailUrl || '')
        setLoading(false)
      })
      .catch(() => {
        toast.error('加载活动失败')
        setLoading(false)
      })
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        title,
        catchphrase,
        description,
        state,
        eventType,
        timezone,
        schedules,
        location: venues.map((v) => ({ title: v.title, displayText: v.displayText, city: v.city, country: v.country })),
        onlineUrl,
        onlineDescription,
        organizerEmail,
        organizerContact: contacts.map((c) => ({ type: c.type, value: c.value, label: c.label })),
        snsAccounts: sns,
        tags,
        mainImageUrl,
        thumbnailUrl,
      }
      const res = await fetch(`/api/manage/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '保存失败')
      toast.success('保存成功')
    } catch (err: any) {
      toast.error(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const addSchedule = () => {
    setSchedules([...schedules, { date: '', startTime: '10:00', endTime: '18:00' }])
  }

  const updateSchedule = (idx: number, field: keyof Schedule, value: string) => {
    const next = [...schedules]
    next[idx] = { ...next[idx], [field]: value }
    setSchedules(next)
  }

  const removeSchedule = (idx: number) => {
    setSchedules(schedules.filter((_, i) => i !== idx))
  }

  const addVenue = () => {
    setVenues([...venues, { title: '', displayText: '', city: '', country: '' }])
  }

  const updateVenue = (idx: number, field: keyof Venue, value: string) => {
    const next = [...venues]
    next[idx] = { ...next[idx], [field]: value }
    setVenues(next)
  }

  const removeVenue = (idx: number) => {
    setVenues(venues.filter((_, i) => i !== idx))
  }

  const searchVenue = async () => {
    if (!venueSearch.trim()) return
    setVenueSearching(true)
    try {
      const res = await fetch(`/api/amap/place?keywords=${encodeURIComponent(venueSearch)}&city=${encodeURIComponent(venueSearchCity)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '搜索失败')
      setVenueResults(data.pois || [])
    } catch {
      toast.error('地点搜索失败')
    } finally {
      setVenueSearching(false)
    }
  }

  const applyVenue = (poi: any) => {
    setVenues([{
      title: poi.name,
      displayText: [poi.city, poi.district, poi.address].filter(Boolean).join(' ') || venueSearch,
      city: poi.city,
      country: '中国',
    }])
    setVenueResults([])
  }

  const addContact = () => {
    setContacts([...contacts, { type: 'url', value: '', label: '' }])
  }

  const updateContact = (idx: number, field: keyof OrganizerContact, value: string) => {
    const next = [...contacts]
    next[idx] = { ...next[idx], [field]: value }
    setContacts(next)
  }

  const removeContact = (idx: number) => {
    setContacts(contacts.filter((_, i) => i !== idx))
  }

  const addTag = () => {
    const raw = tagInput.trim()
    if (!raw) return
    const tag = raw.startsWith('#') ? raw.slice(1) : raw
    if (tag && !tags.includes(tag)) setTags([...tags, tag])
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  if (loading) return <div className="py-12 text-center text-sm text-ink/50">{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t('admin.eventSettings')}</h2>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('common.loading') : t('common.save')}
        </Button>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">活动名称</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catchphrase">副标题 / 一句话介绍</Label>
            <Input id="catchphrase" value={catchphrase} onChange={(e) => setCatchphrase(e.target.value)} placeholder="例如：WAIC 上海最值得参加的周边活动" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">活动描述</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
          </div>
          <div className="space-y-2">
            <Label>发布状态</Label>
            <Select value={state} onValueChange={(v) => setState(v ?? 'DRAFT')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 图片 */}
      <Card>
        <CardHeader>
          <CardTitle>主图 / 分享图</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mainImageUrl">主图 URL</Label>
              <Input id="mainImageUrl" value={mainImageUrl} onChange={(e) => setMainImageUrl(e.target.value)} placeholder="https://..." />
              {mainImageUrl && <img src={mainImageUrl} alt="" className="mt-2 h-32 w-full rounded-lg object-cover" />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">分享图 URL（推荐 1280×720）</Label>
              <Input id="thumbnailUrl" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." />
              {thumbnailUrl && <img src={thumbnailUrl} alt="" className="mt-2 h-32 w-full rounded-lg object-cover" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日程 */}
      <Card>
        <CardHeader>
          <CardTitle>日程</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>时区</Label>
            <Select value={timezone} onValueChange={(v) => setTimezone(v ?? 'Asia/Shanghai')}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            {schedules.map((sch, idx) => (
              <div key={idx} className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">日期</Label>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-ink/40" />
                    <Input type="date" value={sch.date} onChange={(e) => updateSchedule(idx, 'date', e.target.value)} />
                  </div>
                </div>
                <div className="w-32 space-y-2">
                  <Label className="text-xs">开始</Label>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-ink/40" />
                    <Input type="time" value={sch.startTime} onChange={(e) => updateSchedule(idx, 'startTime', e.target.value)} />
                  </div>
                </div>
                <div className="w-32 space-y-2">
                  <Label className="text-xs">结束</Label>
                  <Input type="time" value={sch.endTime} onChange={(e) => updateSchedule(idx, 'endTime', e.target.value)} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeSchedule(idx)}>
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addSchedule}>
            <Plus size={14} className="mr-1" /> 添加日期
          </Button>
        </CardContent>
      </Card>

      {/* 活动形式与场地 */}
      <Card>
        <CardHeader>
          <CardTitle>活动形式与场地</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>活动形式</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v ?? 'ONSITE')}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((et) => (
                  <SelectItem key={et.value} value={et.value}>
                    {et.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(eventType === 'ONSITE' || eventType === 'HYBRID') && (
            <div className="space-y-3">
              <Label>场地</Label>
              <div className="flex gap-2">
                <Input placeholder="搜索地点（如：上海世博展览馆）" value={venueSearch} onChange={(e) => setVenueSearch(e.target.value)} className="flex-1" />
                <Input placeholder="城市" value={venueSearchCity} onChange={(e) => setVenueSearchCity(e.target.value)} className="w-24" />
                <Button variant="secondary" size="sm" onClick={searchVenue} disabled={venueSearching}>
                  搜索
                </Button>
              </div>
              {venueResults.length > 0 && (
                <div className="rounded-lg border dark:border-white/10">
                  {venueResults.map((poi) => (
                    <button
                      key={poi.id}
                      onClick={() => applyVenue(poi)}
                      className="w-full border-b p-2 text-left text-sm last:border-b-0 hover:bg-muted dark:border-white/10"
                    >
                      <span className="font-medium">{poi.name}</span>
                      <span className="ml-2 text-ink/50">{poi.city} {poi.district} {poi.address}</span>
                    </button>
                  ))}
                </div>
              )}
              {venues.map((v, idx) => (
                <div key={idx} className="space-y-2 rounded-lg border p-3 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-ink/40" />
                    <Input placeholder="场地名称" value={v.title} onChange={(e) => updateVenue(idx, 'title', e.target.value)} className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeVenue(idx)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                  <Input placeholder="详细地址" value={v.displayText} onChange={(e) => updateVenue(idx, 'displayText', e.target.value)} />
                  <div className="flex gap-2">
                    <Input placeholder="城市" value={v.city} onChange={(e) => updateVenue(idx, 'city', e.target.value)} />
                    <Input placeholder="国家" value={v.country} onChange={(e) => updateVenue(idx, 'country', e.target.value)} />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addVenue}>
                <Plus size={14} className="mr-1" /> 添加场地
              </Button>
            </div>
          )}

          {(eventType === 'ONLINE' || eventType === 'HYBRID') && (
            <div className="space-y-3">
              <Separator />
              <Label>在线会场</Label>
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-ink/40" />
                <Input placeholder="https://..." value={onlineUrl} onChange={(e) => setOnlineUrl(e.target.value)} className="flex-1" />
              </div>
              <Textarea placeholder="参会说明（仅对已确认者显示）" value={onlineDescription} onChange={(e) => setOnlineDescription(e.target.value)} rows={3} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 组织者与联系 */}
      <Card>
        <CardHeader>
          <CardTitle>组织者与联系方式</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizerEmail">主办方联系邮箱</Label>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-ink/40" />
              <Input id="organizerEmail" type="email" value={organizerEmail} onChange={(e) => setOrganizerEmail(e.target.value)} className="flex-1" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>联系链接</Label>
            {contacts.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Link2 size={14} className="text-ink/40" />
                <Input placeholder="https://..." value={c.value} onChange={(e) => updateContact(idx, 'value', e.target.value)} className="flex-1" />
                <Input placeholder="显示标签" value={c.label} onChange={(e) => updateContact(idx, 'label', e.target.value)} className="w-32" />
                <Button variant="ghost" size="icon" onClick={() => removeContact(idx)}>
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addContact}>
              <Plus size={14} className="mr-1" /> 添加链接
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SNS */}
      <Card>
        <CardHeader>
          <CardTitle>官方 SNS 账号</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: 'x', label: 'X (Twitter)', prefix: 'x.com/' },
              { key: 'instagram', label: 'Instagram', prefix: 'instagram.com/' },
              { key: 'facebook', label: 'Facebook', prefix: 'facebook.com/' },
              { key: 'youtube', label: 'YouTube', prefix: 'youtube.com/@' },
            ].map(({ key, label, prefix }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`sns-${key}`}>{label}</Label>
                <div className="flex items-center gap-2">
                  <AtSign size={14} className="text-ink/40" />
                  <span className="text-sm text-ink/50">{prefix}</span>
                  <Input id={`sns-${key}`} value={sns[key] || ''} onChange={(e) => setSns({ ...sns, [key]: e.target.value })} className="flex-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 标签 */}
      <Card>
        <CardHeader>
          <CardTitle>标签</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                #{tag}
                <button onClick={() => removeTag(tag)}>
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="输入标签后按回车" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
            <Button variant="outline" size="sm" onClick={addTag}>
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </div>
  )
}
