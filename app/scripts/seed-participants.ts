import { db, participants } from '../src/db/index.ts'
import { randomUUID } from 'node:crypto'

const eventId = process.argv[2]
if (!eventId) {
  console.error('Usage: node --experimental-strip-types scripts/seed-participants.ts <eventId>')
  process.exit(1)
}

const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆', '赵敏', '黄磊', '周杰', '吴婷']
const rows = names.map((name, i) => ({
  id: randomUUID(),
  eventId,
  email: `participant${i + 1}@example.com`,
  name,
  status: i < 5 ? 'PENDING' : i < 8 ? 'APPROVED' : 'REJECTED',
  type: i === 7 ? 'SPEAKER' : i === 8 ? 'VIP' : 'GENERAL',
  checkedIn: i === 6,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
}))

db.insert(participants).values(rows).run()
console.log(`Inserted ${rows.length} participants for event ${eventId}`)
