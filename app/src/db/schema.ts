import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// events 表 —— 标量字段=列(可查询/排序/筛选); 结构化/关系字段=JSON 列; `data`=完整对象快照。
export interface Schedule {
  date: string
  startTime: string
  endTime: string
}

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  catchphrase: text('catchphrase'),
  description: text('description'),
  eventType: text('event_type'), // ONSITE | ONLINE
  state: text('state'), // PUBLISHED | DRAFT
  timezone: text('timezone'),
  thumbnailUrl: text('thumbnail_url'),
  mainImageUrl: text('main_image_url'),
  // 派生: 便于排序/时间筛选
  startDate: text('start_date'),
  endDate: text('end_date'),
  hasEnded: integer('has_ended', { mode: 'boolean' }),
  featured: integer('featured', { mode: 'boolean' }),
  requiresApproval: integer('requires_approval', { mode: 'boolean' }),
  enabledTickets: integer('enabled_tickets', { mode: 'boolean' }),
  enabledMeetings: integer('enabled_meetings', { mode: 'boolean' }),
  enabledChat: integer('enabled_chat', { mode: 'boolean' }),
  enabledSideEvents: integer('enabled_side_events', { mode: 'boolean' }),
  maxParticipants: integer('max_participants'),
  participantListVisibility: text('participant_list_visibility'),
  // 结构化/关系字段(JSON) —— 保真存原始
  schedules: text('schedules', { mode: 'json' }).$type<Schedule[]>(),
  location: text('location', { mode: 'json' }),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  organizers: text('organizers', { mode: 'json' }),
  customStyle: text('custom_style', { mode: 'json' }),
  customNavigation: text('custom_navigation', { mode: 'json' }),
  organizerContact: text('organizer_contact', { mode: 'json' }),
  stages: text('stages', { mode: 'json' }),
  sessions: text('sessions', { mode: 'json' }),
  speakers: text('speakers', { mode: 'json' }),
  announcements: text('announcements', { mode: 'json' }),
  surveySchema: text('survey_schema', { mode: 'json' }),
  createdBy: text('created_by', { mode: 'json' }),
  createdById: text('created_by_id'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
  // 完整原始 Event(48字段) —— 响应直接回它, 契约 100% 保真
  data: text('data', { mode: 'json' }),
})

export type EventRow = typeof events.$inferSelect

// 建表 DDL(drizzle 不自动建表; init 时执行, 与上方 schema 保持一致)
export const CREATE_EVENTS = `
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, title TEXT NOT NULL, catchphrase TEXT,
  description TEXT, event_type TEXT, state TEXT, timezone TEXT,
  thumbnail_url TEXT, main_image_url TEXT, start_date TEXT, end_date TEXT,
  has_ended INTEGER, featured INTEGER, requires_approval INTEGER,
  enabled_tickets INTEGER, enabled_meetings INTEGER, enabled_chat INTEGER, enabled_side_events INTEGER,
  max_participants INTEGER, participant_list_visibility TEXT,
  schedules TEXT, location TEXT, tags TEXT, organizers TEXT, custom_style TEXT,
  custom_navigation TEXT, organizer_contact TEXT, stages TEXT, sessions TEXT, speakers TEXT,
  announcements TEXT, survey_schema TEXT, created_by TEXT, created_by_id TEXT, created_at TEXT, updated_at TEXT, data TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_date);
`

// users 表 —— 平台用户/组织者
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  nativeName: text('native_name'),
  avatarUrl: text('avatar_url'),
  slug: text('slug').unique(),
  title: text('title'),
  bio: text('bio'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
})

export type UserRow = typeof users.$inferSelect

export const CREATE_USERS = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  first_name TEXT, last_name TEXT, native_name TEXT, avatar_url TEXT, slug TEXT UNIQUE,
  title TEXT, bio TEXT, created_at TEXT, updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);
`

// participants 表 —— 活动报名者/参与者
export const participants = sqliteTable('participants', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull(),
  userId: text('user_id'),
  email: text('email').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING | APPROVED | REJECTED | CANCELLED
  type: text('type').default('GENERAL'), // GENERAL | VIP | SPEAKER | STAFF | MEDIA
  ticketId: text('ticket_id'),
  checkedIn: integer('checked_in', { mode: 'boolean' }).default(false),
  checkedInAt: text('checked_in_at'),
  notes: text('notes'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
  data: text('data', { mode: 'json' }),
})

export type ParticipantRow = typeof participants.$inferSelect

export const CREATE_PARTICIPANTS = `
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL, user_id TEXT, email TEXT NOT NULL,
  name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', type TEXT DEFAULT 'GENERAL',
  ticket_id TEXT, checked_in INTEGER DEFAULT 0, checked_in_at TEXT, notes TEXT,
  created_at TEXT, updated_at TEXT, data TEXT
);
CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(event_id, email);
`

// tickets 表 —— 票种（当前仅支持免费/现场票）
export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').default(0),
  quantity: integer('quantity'),
  maxPerOrder: integer('max_per_order').default(1),
  saleStartsAt: text('sale_starts_at'),
  saleEndsAt: text('sale_ends_at'),
  type: text('type').default('FREE'), // FREE | ONSITE
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
  data: text('data', { mode: 'json' }),
})

export type TicketRow = typeof tickets.$inferSelect

export const CREATE_TICKETS = `
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  price INTEGER DEFAULT 0, quantity INTEGER, max_per_order INTEGER DEFAULT 1,
  sale_starts_at TEXT, sale_ends_at TEXT, type TEXT DEFAULT 'FREE', enabled INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0, created_at TEXT, updated_at TEXT, data TEXT
);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
`
