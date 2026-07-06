// 外部来源导入：公众号文章 / 网页 / 纯文本 → 结构化活动草稿
//
// 设计铁律：尊重主办方原文。正文原样转 Markdown（不改写、不总结），
// 海报与文中图片原图呈现（防盗链图走 /api/images/proxy 代理）。
// LLM 只负责抽取结构化字段（标题/时间/地点/标签），不碰正文。
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { parse as parseHtml } from 'node-html-parser'
import { NodeHtmlMarkdown } from 'node-html-markdown'

const app = new Hono()

const env = (c: any, key: string): string | undefined =>
  (c.env as any)?.[key] ?? (typeof process !== 'undefined' ? (process as any).env?.[key] : undefined)

// —— 抓取 ——

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function isWeChatUrl(url: string) {
  return /(^|\.)mp\.weixin\.qq\.com$/.test(new URL(url).hostname)
}

async function fetchHtml(url: string): Promise<string> {
  const headers: Record<string, string> = { 'User-Agent': CHROME_UA }
  if (isWeChatUrl(url)) headers['Referer'] = 'https://mp.weixin.qq.com/'
  const res = await fetch(url, { headers, redirect: 'follow' })
  if (!res.ok) throw new Error(`fetch_failed_${res.status}`)
  return await res.text()
}

// 防盗链 CDN（主要是微信 mmbiz）：改写为服务端代理
const HOTLINK_HOSTS = ['qpic.cn', 'qlogo.cn']
function needsProxy(src: string): boolean {
  try {
    const h = new URL(src).hostname
    return HOTLINK_HOSTS.some((d) => h === d || h.endsWith('.' + d))
  } catch {
    return false
  }
}
export function proxiedUrl(src: string): string {
  return needsProxy(src) ? `/api/images/proxy?url=${encodeURIComponent(src)}` : src
}

const CONTENT_SELECTORS = [
  '#js_content',
  '.rich_media_content',
  'article',
  '.post-content',
  '.article-content',
  '#content',
  'main',
]

interface Extracted {
  sourceTitle: string | null
  ogImage: string | null
  markdown: string
  images: string[]
}

function extractFromHtml(html: string): Extracted {
  const root = parseHtml(html)

  const meta = (prop: string) =>
    root.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
    root.querySelector(`meta[name="${prop}"]`)?.getAttribute('content') ||
    null
  const sourceTitle = meta('og:title') || root.querySelector('title')?.text?.trim() || null
  const ogImage = meta('og:image')

  let contentEl = null as ReturnType<typeof root.querySelector>
  for (const sel of CONTENT_SELECTORS) {
    const el = root.querySelector(sel)
    if (el && el.text.trim().length >= 120) {
      contentEl = el
      break
    }
  }
  if (!contentEl) contentEl = root.querySelector('body')
  if (!contentEl) throw new Error('no_content')

  // 懒加载图片修复 + 防盗链代理改写；收集图片清单供选封面
  const images: string[] = []
  for (const img of contentEl.querySelectorAll('img')) {
    const src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('src') || ''
    if (!src || src.startsWith('data:')) {
      img.remove()
      continue
    }
    const finalSrc = proxiedUrl(src)
    img.setAttribute('src', finalSrc)
    img.removeAttribute('data-src')
    img.removeAttribute('style')
    images.push(finalSrc)
  }
  // 公众号正文里的无语义容器很多，直接整体转 Markdown（保真，不重排内容）
  const markdown = NodeHtmlMarkdown.translate(contentEl.innerHTML, {
    keepDataImages: false,
    useLinkReferenceDefinitions: false,
  })
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { sourceTitle, ogImage: ogImage ? proxiedUrl(ogImage) : null, markdown, images }
}

// —— LLM 结构化抽取（GeneralCompute / minimax-m2.7）——

const FIELD_PROMPT = `你从一篇活动宣传文章中抽取结构化字段。只输出 JSON，不要输出其他内容。

规则：
- 只抽取，不创作。文中没有的字段填 null（数组填 []）。
- 不要改写、总结或润色正文，正文不归你管。
- 日期输出 YYYY-MM-DD；文中没写年份时按 ${new Date().getFullYear()} 年处理。时间输出 HH:mm（24 小时制）。
- venueName 是场地名（如某咖啡馆/酒店/园区），venueAddress 是详细地址，city 是城市名。
- tags 给 2-5 个简短中文标签（如：Agent、创业、路演、夜局、峰会）。
- eventType：线下=ONSITE，纯线上=ONLINE，都有=HYBRID，判断不了默认 ONSITE。

输出 JSON schema：
{
  "title": string,            // 活动名称（不是文章标题的营销前后缀，取活动本名）
  "catchphrase": string|null, // 一句话副标题，仅当文中明确有
  "schedules": [{"date": "YYYY-MM-DD", "startTime": "HH:mm", "endTime": "HH:mm"}],
  "venueName": string|null,
  "venueAddress": string|null,
  "city": string|null,
  "eventType": "ONSITE"|"ONLINE"|"HYBRID",
  "tags": string[],
  "organizerNames": string[]  // 主办/联合主办方名称
}`

async function llmExtract(c: any, text: string): Promise<any | null> {
  const apiKey = env(c, 'GENERALCOMPUTE_API_KEY')
  if (!apiKey) return null
  const baseUrl = env(c, 'GENERALCOMPUTE_BASE_URL') || 'https://api.generalcompute.com/v1'
  const model = env(c, 'GENERALCOMPUTE_MODEL') || 'minimax-m2.7'
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: FIELD_PROMPT },
        { role: 'user', content: text.slice(0, 12000) },
      ],
    }),
  })
  if (!res.ok) throw new Error(`llm_failed_${res.status}`)
  const data = (await res.json()) as any
  const content: string = data.choices?.[0]?.message?.content || ''
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

// —— 高德地理编码 ——

async function geocode(c: any, query: string, city: string | null): Promise<any | null> {
  const key = env(c, 'AMAP_KEY')
  if (!key || !query) return null
  try {
    const url = `https://restapi.amap.com/v3/place/text?key=${encodeURIComponent(key)}&keywords=${encodeURIComponent(query)}&city=${encodeURIComponent(city || '上海')}&offset=1&page=1`
    const res = await fetch(url)
    const data = (await res.json()) as any
    const poi = data.pois?.[0]
    if (!poi?.location) return null
    const [lng, lat] = String(poi.location).split(',').map(Number)
    return {
      title: poi.name,
      displayText: [poi.cityname, poi.adname, poi.address].filter(Boolean).join(''),
      city: poi.cityname || city,
      country: '中国',
      geo: { lat, lng },
      googleMapsURI: `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(poi.name)}`,
    }
  } catch {
    return null
  }
}

// —— 主入口 ——

const importSchema = z
  .object({
    url: z.string().url().optional(),
    text: z.string().min(20).optional(),
  })
  .refine((v) => v.url || v.text, { message: 'url 或 text 至少提供一个' })

app.post('/', zValidator('json', importSchema), async (c) => {
  const body = c.req.valid('json')

  let markdown = ''
  let sourceTitle: string | null = null
  let ogImage: string | null = null
  let images: string[] = []
  let sourceUrl: string | null = null

  if (body.url) {
    sourceUrl = body.url
    let html: string
    try {
      html = await fetchHtml(body.url)
    } catch {
      return c.json({ error: 'fetch_failed', message: '抓取失败：链接无法访问，或该平台阻止了抓取。可以把文章内容直接粘贴到文本框导入。' }, 422)
    }
    try {
      const ex = extractFromHtml(html)
      markdown = ex.markdown
      sourceTitle = ex.sourceTitle
      ogImage = ex.ogImage
      images = ex.images
    } catch {
      return c.json({ error: 'parse_failed', message: '解析失败：没有找到正文内容。可以把文章内容直接粘贴到文本框导入。' }, 422)
    }
    if (markdown.length < 50) {
      return c.json({ error: 'content_too_short', message: '正文太短，可能是需要登录或动态渲染的页面。请把内容直接粘贴导入。' }, 422)
    }
  } else {
    markdown = body.text!.trim()
  }

  // LLM 只抽字段；失败时降级为仅返回原文，让主办方手动补字段
  let fields: any = null
  let llmError: string | null = null
  try {
    fields = await llmExtract(c, `${sourceTitle ? `文章标题：${sourceTitle}\n\n` : ''}${markdown}`)
  } catch (e: any) {
    llmError = e?.message || 'llm_failed'
  }

  // 地理编码
  let location: any = null
  if (fields?.venueName || fields?.venueAddress) {
    location = await geocode(c, fields.venueName || fields.venueAddress, fields.city)
    if (location === null && fields.venueName) {
      // 搜不到 POI 时保留文字地址，人工可改
      location = {
        title: fields.venueName,
        displayText: fields.venueAddress || fields.venueName,
        city: fields.city || '上海',
        country: '中国',
      }
    }
  }

  return c.json({
    draft: {
      title: fields?.title || sourceTitle || '',
      catchphrase: fields?.catchphrase || null,
      description: markdown, // 原文保真 Markdown，不经 LLM
      descriptionFormat: 'markdown',
      schedules: Array.isArray(fields?.schedules) ? fields.schedules : [],
      eventType: fields?.eventType || 'ONSITE',
      tags: Array.isArray(fields?.tags) ? fields.tags : [],
      organizerNames: Array.isArray(fields?.organizerNames) ? fields.organizerNames : [],
      location: location ? [location] : [],
      mainImageUrl: ogImage || images[0] || null,
      images,
      sourceUrl,
    },
    warnings: [
      ...(llmError ? ['字段自动抽取失败，请手动填写标题/时间/地点'] : []),
      ...(fields && !fields.schedules?.length ? ['未识别到活动时间，请手动确认'] : []),
      ...(fields && !location ? ['未识别到活动地点，请手动确认'] : []),
    ],
  })
})

export default app
