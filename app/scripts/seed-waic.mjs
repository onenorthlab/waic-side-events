import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dir, '../data/4s.db')
const sqlite = new Database(DB_PATH)

const userId = process.argv[2]
if (!userId) {
  console.error('Usage: node scripts/seed-waic.mjs <createdByUserId>')
  process.exit(1)
}

const eventId = randomUUID()
const slugBase = 'waic-2026-shanghai-side-event'
const slug = `${slugBase}-${eventId.slice(0, 6)}`
const now = new Date().toISOString()

const schedules = [
  { date: '2026-07-10', startTime: '09:00', endTime: '17:30' },
  { date: '2026-07-11', startTime: '09:30', endTime: '16:00' },
]

const location = [{
  title: '上海世博展览馆',
  displayText: '上海市浦东新区国展路1099号',
  city: '上海',
  country: '中国',
}]

const speakers = [
  { id: 'spk-1', name: '李飞飞', title: '教授', organization: '斯坦福大学', imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop' },
  { id: 'spk-2', name: 'Andrew Ng', title: '创始人', organization: 'DeepLearning.AI', imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop' },
  { id: 'spk-3', name: '李彦宏', title: '创始人', organization: '百度', imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' },
  { id: 'spk-4', name: 'Yann LeCun', title: '首席 AI 科学家', organization: 'Meta', imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop' },
]

const stages = [
  { id: 'stage-main', name: '主论坛', location: 'H1 馆主舞台' },
  { id: 'stage-ai', name: 'AI 应用展区', location: 'H2 馆' },
]

const sessions = [
  { id: 's-1', title: 'WAIC 2026 开幕致辞', description: '主办方致辞与大会愿景', date: '2026-07-10', startTime: '09:00', endTime: '09:30', stageId: 'stage-main', speakerIds: ['spk-3'] },
  { id: 's-2', title: '基础模型下半场：从研究到产业', description: '探讨大模型技术趋势与商业化路径', date: '2026-07-10', startTime: '09:45', endTime: '10:45', stageId: 'stage-main', speakerIds: ['spk-1', 'spk-2'] },
  { id: 's-3', title: '多模态 AI 的产品实践', description: '视觉、语言与具身智能的融合应用', date: '2026-07-10', startTime: '11:00', endTime: '12:00', stageId: 'stage-main', speakerIds: ['spk-4'] },
  { id: 's-4', title: 'AI for Science 工作坊', description: '动手体验 AI 在科研中的工具链', date: '2026-07-10', startTime: '14:00', endTime: '16:00', stageId: 'stage-ai', speakerIds: ['spk-1'] },
  { id: 's-5', title: '圆桌：AI 治理与全球协作', description: '来自学界、企业与监管的多元视角', date: '2026-07-11', startTime: '10:00', endTime: '11:30', stageId: 'stage-main', speakerIds: ['spk-2', 'spk-3', 'spk-4'] },
]

const announcements = [
  { id: 'ann-1', title: '早鸟报名开启', body: '即日起至 6 月 30 日完成报名，可优先选择座位。', pinned: true, publishedAt: now },
  { id: 'ann-2', title: '交通指南', body: '建议乘坐地铁 8 号线至中华艺术宫站，步行约 8 分钟。', pinned: false, publishedAt: now },
]

const tags = ['WAIC', 'AI', '上海', '人工智能', '大模型']

const data = {
  title: 'WAIC 2026 上海周边活动',
  catchphrase: '汇聚全球 AI 领袖，洞见智能时代未来',
  description: '<p>作为 WAIC 2026 官方周边活动，本场峰会邀请全球顶尖学者、产业领袖与创业者，围绕基础模型、多模态 AI、AI for Science 与 AI 治理等议题展开深度对话。</p><p>活动采用线上线下混合形式，现场设主论坛与 AI 应用展区，欢迎开发者、研究者与创业者共同参与。</p>',
  eventType: 'HYBRID',
  state: 'PUBLISHED',
  timezone: 'Asia/Shanghai',
  schedules,
  location,
  tags,
  speakers,
  stages,
  sessions,
  announcements,
  mainImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1280&h=720&fit=crop',
  thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1280&h=720&fit=crop',
  onlineUrl: 'https://waic.example.com/live',
  onlineDescription: '线上直播链接将在活动前一天通过邮件发送给已确认参与者。',
  enabledTickets: true,
  enabledMeetings: false,
  enabledChat: true,
  enabledSideEvents: false,
  requiresApproval: true,
  maxParticipants: 500,
  participantListVisibility: 'APPROVED_ONLY',
  customStyle: { primaryColor: '#2563eb' },
  customNavigation: [],
  organizers: [],
  organizerContact: [{ type: 'email', value: 'contact@waic-shanghai.example.com', label: '主办方邮箱' }],
  snsAccounts: { x: 'waic_shanghai', instagram: '', facebook: '', youtube: '' },
}

const insertEvent = sqlite.prepare(`
  INSERT INTO events (
    id, slug, title, catchphrase, description, event_type, state, timezone,
    start_date, end_date, has_ended, featured, requires_approval,
    enabled_tickets, enabled_meetings, enabled_chat, enabled_side_events,
    max_participants, participant_list_visibility,
    schedules, location, tags, organizers, organizer_contact,
    stages, sessions, speakers, announcements,
    main_image_url, thumbnail_url,
    custom_style, custom_navigation, created_by, created_by_id, created_at, updated_at, data
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

insertEvent.run(
  eventId,
  slug,
  data.title,
  data.catchphrase,
  data.description,
  data.eventType,
  data.state,
  data.timezone,
  schedules[0].date,
  schedules[schedules.length - 1].date,
  0,
  1,
  data.requiresApproval ? 1 : 0,
  data.enabledTickets ? 1 : 0,
  data.enabledMeetings ? 1 : 0,
  data.enabledChat ? 1 : 0,
  data.enabledSideEvents ? 1 : 0,
  data.maxParticipants,
  data.participantListVisibility,
  JSON.stringify(schedules),
  JSON.stringify(location),
  JSON.stringify(tags),
  JSON.stringify([]),
  JSON.stringify(data.organizerContact),
  JSON.stringify(stages),
  JSON.stringify(sessions),
  JSON.stringify(speakers),
  JSON.stringify(announcements),
  data.mainImageUrl,
  data.thumbnailUrl,
  JSON.stringify(data.customStyle),
  JSON.stringify(data.customNavigation),
  JSON.stringify({ id: userId }),
  userId,
  now,
  now,
  JSON.stringify(data)
)

const insertTicket = sqlite.prepare(`
  INSERT INTO tickets (id, event_id, name, description, price, quantity, max_per_order, type, enabled, sort_order, created_at, updated_at)
  VALUES (?, ?, ?, ?, 0, ?, ?, 'FREE', 1, ?, ?, ?)
`)
insertTicket.run(randomUUID(), eventId, '普通票', '免费入场，含主论坛与展区通行', 500, 2, 0, now, now)
insertTicket.run(randomUUID(), eventId, 'VIP 票', '前排座位、嘉宾交流环节与资料包', 100, 1, 1, now, now)

console.log(`Seeded WAIC event: ${slug} (${eventId})`)
sqlite.close()
