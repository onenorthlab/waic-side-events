import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { events, communities, playlists, users, participants, tickets } from './schema'
import { CREATE_EVENTS, CREATE_COMMUNITIES, CREATE_PLAYLISTS, CREATE_USERS, CREATE_PARTICIPANTS, CREATE_TICKETS } from './schema'
import seedEvents from '../data/events.json'
import seedCommunities from '../data/communities.json'
import seedPlaylists from '../data/playlists.json'

export const schema = { events, communities, playlists, users, participants, tickets }
export { events, communities, playlists, users, participants, tickets }
export { sql } from 'drizzle-orm'

let sqliteDb: ReturnType<typeof drizzleSqlite> | null = null
let sqliteRaw: Database.Database | null = null

function initSqlite() {
  if (sqliteDb) return sqliteDb
  const __dir = path.dirname(fileURLToPath(import.meta.url))
  const DB_PATH = path.join(__dir, '../../data/4s.db')
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  sqliteRaw = new Database(DB_PATH)
  sqliteRaw.pragma('journal_mode = WAL')
  sqliteDb = drizzleSqlite(sqliteRaw, { schema })

  sqliteRaw.exec(CREATE_EVENTS)
  sqliteRaw.exec(CREATE_COMMUNITIES)
  sqliteRaw.exec(CREATE_PLAYLISTS)
  sqliteRaw.exec(CREATE_USERS)
  sqliteRaw.exec(CREATE_PARTICIPANTS)
  sqliteRaw.exec(CREATE_TICKETS)

  // 种子（空库才灌）
  const count = (sqliteRaw.prepare('SELECT COUNT(*) AS c FROM events').get() as { c: number }).c
  if (count === 0) {
    const rows = (seedEvents as any[]).map((e) => {
      const sch = Array.isArray(e.schedules) ? e.schedules : []
      const startDate = sch[0]?.date ?? null
      const endDate = sch.length ? sch[sch.length - 1].date : startDate
      return {
        id: e.id,
        slug: e.slug,
        title: e.title,
        catchphrase: e.catchphrase ?? null,
        description: e.description ?? null,
        eventType: e.eventType ?? null,
        state: e.state ?? null,
        timezone: e.timezone ?? null,
        thumbnailUrl: e.thumbnailUrl ?? null,
        mainImageUrl: e.mainImageUrl ?? null,
        startDate,
        endDate,
        hasEnded: !!e.hasEnded,
        featured: !!e.featured,
        requiresApproval: !!e.requiresApproval,
        enabledTickets: !!e.enabledTickets,
        enabledMeetings: !!e.enabledMeetings,
        enabledChat: !!e.enabledChat,
        enabledSideEvents: !!e.enabledSideEvents,
        maxParticipants: e.maxParticipants ?? null,
        participantListVisibility: e.participantListVisibility ?? null,
        schedules: sch,
        location: e.location ?? null,
        tags: Array.isArray(e.tags) ? e.tags : [],
        organizers: e.organizers ?? null,
        customStyle: e.customStyle ?? null,
        customNavigation: e.customNavigation ?? null,
        organizerContact: e.organizerContact ?? null,
        stages: e.stages ?? null,
        sessions: e.sessions ?? null,
        speakers: e.speakers ?? null,
        announcements: e.announcements ?? null,
        surveySchema: e.surveySchema ?? null,
        createdBy: e.createdBy ?? null,
        createdAt: e.createdAt ?? null,
        updatedAt: e.updatedAt ?? null,
        data: e,
      }
    })
    const CHUNK = 50
    for (let i = 0; i < rows.length; i += CHUNK) sqliteDb.insert(events).values(rows.slice(i, i + CHUNK)).run()
    const n = (sqliteRaw.prepare('SELECT COUNT(*) AS c FROM events').get() as { c: number }).c
    console.error(`[db] seeded ${n} events → ${DB_PATH}`)
  }

  if ((sqliteRaw.prepare('SELECT COUNT(*) AS c FROM communities').get() as { c: number }).c === 0) {
    const rows = (seedCommunities as any[]).map((c) => ({
      id: c.id,
      slug: c.slug || c.id,
      name: c.name,
      description: c.description ?? null,
      logoUrl: c.logoUrl ?? null,
      logoDarkUrl: c.logoDarkUrl ?? null,
      visibility: c.visibility ?? null,
      joinType: c.joinType ?? null,
      enabledChat: !!c.enabledChat,
      memberCount: c.memberCount ?? 0,
      followersCount: c.followersCount ?? 0,
      featured: !!c.featured,
      websiteUrl: c.websiteUrl ?? null,
      tags: c.tags ?? [],
      customNavigation: c.customNavigation ?? null,
      createdBy: c.createdBy ?? null,
      createdAt: c.createdAt ?? null,
      updatedAt: c.updatedAt ?? null,
      data: c,
    }))
    for (let i = 0; i < rows.length; i += 50) sqliteDb.insert(communities).values(rows.slice(i, i + 50)).run()
    console.error(`[db] seeded ${rows.length} communities`)
  }

  if ((sqliteRaw.prepare('SELECT COUNT(*) AS c FROM playlists').get() as { c: number }).c === 0) {
    const rows = (seedPlaylists as any[]).map((p) => ({
      id: p.id,
      communityId: p.communityId ?? null,
      name: p.name,
      description: p.description ?? null,
      thumbnailImageUrl: p.thumbnailImageUrl ?? null,
      itemCount: p.itemCount ?? 0,
      featured: !!p.featured,
      sticky: !!p.sticky,
      sortOrder: p.sortOrder ?? 0,
      community: p.community ?? null,
      createdAt: p.createdAt ?? null,
      updatedAt: p.updatedAt ?? null,
      data: p,
    }))
    for (let i = 0; i < rows.length; i += 50) sqliteDb.insert(playlists).values(rows.slice(i, i + 50)).run()
    console.error(`[db] seeded ${rows.length} playlists`)
  }

  return sqliteDb
}

export interface EnvWithDB {
  DB?: D1Database
}

export type AppDb = BaseSQLiteDatabase<'async' | 'sync', any, typeof schema>

export function getDb(env?: any): AppDb {
  if (env?.DB) {
    return drizzleD1(env.DB, { schema }) as unknown as AppDb
  }
  return initSqlite() as unknown as AppDb
}

export function getRawSqlite() {
  initSqlite()
  return sqliteRaw!
}
