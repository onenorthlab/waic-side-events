# WAIC Side-Events App

WAIC 周边活动平台的主应用，包含前端 React SPA 与后端 Hono API。

## 快速开始

```bash
cd app
pnpm install
pnpm dev
```

访问 http://localhost:5173。

本地开发使用 `better-sqlite3`，数据库文件位于 `data/app.db`，首次启动会自动建表并写入种子数据。

## 脚本

| 脚本 | 说明 |
|------|------|
| `pnpm dev` | Vite 本地开发 |
| `pnpm build` | 构建前端 + SSR 服务端 |
| `pnpm build:server` | 仅构建服务端入口 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm cf:preview` | Wrangler 本地预览 |
| `pnpm deploy` | 部署到 Cloudflare Workers |

## 主要模块

- `src/routes/` — TanStack Router 页面
- `src/server/` — Hono API 路由
- `src/db/` — Drizzle schema 与数据库连接
- `src/components/` — 公共组件（日历、地图、侧边栏等）
- `src/lib/` — 工具函数、邮件、API 客户端

## 环境变量

开发时不需要额外配置；生产部署前请在 Cloudflare Secrets 中设置：

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `AMAP_KEY`

## 部署

```bash
pnpm deploy
```

详见项目根目录 [README.md](../README.md) 与 [docs/architecture.md](../docs/architecture.md)。
