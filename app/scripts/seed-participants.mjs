import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dir, '../data/4s.db')
const sqlite = new Database(DB_PATH)

const eventId = process.argv[2]
if (!eventId) {
  console.error('Usage: node scripts/seed-participants.mjs <eventId>')
  process.exit(1)
}

const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆', '赵敏', '黄磊', '周杰', '吴婷']
const insert = sqlite.prepare(`
  INSERT INTO participants (id, event_id, email, name, status, type, checked_in, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const now = new Date().toISOString()
const txn = sqlite.transaction(() => {
  for (let i = 0; i < names.length; i++) {
    insert.run(
      randomUUID(),
      eventId,
      `participant${i + 1}@example.com`,
      names[i],
      i < 5 ? 'PENDING' : i < 8 ? 'APPROVED' : 'REJECTED',
      i === 7 ? 'SPEAKER' : i === 8 ? 'VIP' : 'GENERAL',
      i === 6 ? 1 : 0,
      new Date(Date.now() - i * 86400000).toISOString(),
      now
    )
  }
})
txn()
console.log(`Inserted ${names.length} participants for event ${eventId}`)
sqlite.close()
