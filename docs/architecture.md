# WAIC Side-Events 架构说明

## 整体架构

```
┌─────────────────────────────────────────────┐
│                 浏览器 / 移动端               │
│   React 19 SPA  +  TanStack Router           │
│   Tailwind v4 + shadcn/ui + 高德地图 JS API   │
└─────────────────────┬───────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────┐
│           Cloudflare Workers                 │
│   Hono 路由 + Drizzle ORM + D1 数据库        │
│   静态资源 (dist/) 通过 Workers Assets  serving│
└─────────────────────┬───────────────────────┘
                      │ SQL
┌─────────────────────▼───────────────────────┐
│          Cloudflare D1 (SQLite)              │
│   events / tickets / registrations / users   │
└─────────────────────────────────────────────┘
```

## 前端路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 重定向到活动列表 |
| `/events` | 活动列表 | 支持过滤、搜索、日历 |
| `/events/maps` | 全地图页 | 高德地图聚合展示 |
| `/schedules` | 日程聚合 | 跨活动 session 列表 |
| `/events/:slug` | 活动详情 | 报名、日程、嘉宾 |
| `/manage/login` | 管理员登录 | 账号密码登录 |
| `/manage/events` | 活动管理 | 创建/编辑/发布 |
| `/manage/events/:id/registrations` | 报名审核 | 查看、批准、拒绝 |

## 后端路由

### 公开 API

- `GET /api/events` — 活动列表
- `GET /api/events/:slug` — 活动详情
- `GET /api/events/geojson` — 活动位置 GeoJSON
- `GET /api/tags/usage?entity=event` — 标签使用统计
- `GET /api/amap/place` — 高德地点搜索代理

### 管理 API

- `POST /api/auth/login` — 登录
- `POST /api/manage/events` — 创建活动（最小字段）
- `PATCH /api/manage/events/:id` — 更新活动完整字段
- `POST /api/manage/events/:id/tickets` — 创建票种
- `GET /api/manage/events/:id/registrations` — 报名列表
- `POST /api/manage/events/:id/registrations/:rid/approve` — 通过审核
- `POST /api/manage/events/:id/registrations/:rid/reject` — 拒绝审核

## 数据模型

### events

活动主表，关键字段：

- `id`, `slug`, `title`, `catchphrase`
- `description`（富文本/HTML）
- `eventType`: `ONSITE` | `ONLINE` | `HYBRID`
- `state`: `PUBLISHED` | `DRAFT`
- `timezone`: 默认 `Asia/Shanghai`
- `schedules`: JSON 数组 `{ date, startTime, endTime }`
- `location`: JSON 数组 `{ title, displayText, city, state, country, geo }`
- `tags`: JSON 数组
- `customStyle`: `{ primaryColor, backgroundColor, theme }`
- `organizerContact`, `stages`, `sessions`, `speakers`, `announcements`, `surveySchema`
- `maxParticipants`, `requiresApproval`, `participantListVisibility`

### tickets

- `eventId`, `name`, `description`, `price`, `quantity`, `maxPerOrder`, `type`
- 当前仅支持 `type = FREE`

### registrations

- `eventId`, `ticketId`, `userId`, `status`（PENDING / APPROVED / REJECTED）
- `answers`: JSON，存储 surveySchema 的填写结果

### users

- `id`, `email`, `passwordHash`, `role`（ADMIN / USER）

## 本地开发

本地使用 `better-sqlite3` 运行，Drizzle 通过 `dialect: sqlite` 连接。生产环境通过 `c.env.DB` 绑定 D1。

## 部署

构建产物：

- `dist/`：前端静态文件
- `dist-server/server.prod.js`：服务端入口

`wrangler.jsonc` 配置：

- `main`: `src/worker.ts`
- `assets.directory`: `./dist`
- `d1_databases`: 绑定 `DB`

运行 `pnpm deploy` 即可将前后端一并部署到 Cloudflare Workers。
