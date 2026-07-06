# WAIC Side-Events

WAIC（世界人工智能大会）周边活动的发布、报名与聚合平台。让主办方低门槛创建活动，让参会者按时间、标签、地图快速发现并报名 WAIC 周边活动。

[![Deploy](https://img.shields.io/badge/deploy-Cloudflare%20Workers-orange)](https://waic-side-events.ingle.workers.dev)
[![Stack](https://img.shields.io/badge/stack-React%2019%20%7C%20Hono%20%7C%20D1-blue)](./docs/architecture.md)

**线上地址**：https://waic-side-events.ingle.workers.dev  
**管理后台**：https://waic-side-events.ingle.workers.dev/manage/login  
**管理员账号**：`admin@waic.events` / `Admin1234!`

---

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [部署](#部署)
- [环境变量](#环境变量)
- [项目结构](#项目结构)
- [Agent 创建活动 Skill](#agent-创建活动-skill)
- [反馈系统](#反馈系统)
- [地图与高德接入](#地图与高德接入)
- [文档](#文档)
- [许可证](#许可证)

---

## 功能特性

- 🎪 **活动发布**：标题、副标题、多日程、场地、嘉宾、议程、公告、报名表单、票务。
- 🔍 **多维发现**：按时间、标签、关键词、日历日期过滤；右侧地图概览。
- 🗺️ **地图聚合**：高德地图展示全量活动地点，支持全地图页 `/events/maps`。
- 📅 **日程聚合**：跨活动日程统一展示 `/schedules`。
- 🎟️ **报名与审核**：免费票报名、表单自定义、管理员审核、邮件通知。
- 🤖 **Agent 导入**：支持从 URL（公众号/腾讯文档/报名页）或口述快速创建活动。
- 💬 **用户反馈**：嵌入 Feedlog，随时截图标注反馈。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TanStack Router + Vite + Tailwind CSS v4 + shadcn/ui |
| 服务端 | Hono（Cloudflare Workers） |
| ORM | Drizzle ORM |
| 数据库 | Cloudflare D1 / better-sqlite3（本地） |
| 地图 | 高德地图 JS API 2.0 |
| 邮件 | Resend |
| 反馈 | Feedlog |

## 快速开始

```bash
# 1. 进入应用目录
cd app

# 2. 安装依赖
pnpm install

# 3. 本地开发
pnpm dev
```

打开 http://localhost:5173。

本地开发默认使用 `better-sqlite3`，数据库文件位于 `data/app.db`，首次启动会自动初始化。

## 部署

项目使用 Cloudflare Workers + D1 部署。

```bash
# 登录 Cloudflare
npx wrangler login

# 部署
pnpm deploy
```

## 环境变量

在 Cloudflare Dashboard 或通过 `wrangler secret put` 设置：

| 变量 | 说明 | 是否必填 |
|------|------|----------|
| `RESEND_API_KEY` | Resend API Key，用于发送邮件 | 生产必填 |
| `EMAIL_FROM` | 发件人地址，需 Resend 验证域名 | 生产必填 |
| `AMAP_KEY` | 高德地图 Web 服务 Key | 生产必填 |

可选：首次部署后可通过种子脚本创建默认管理员账号。

## 项目结构

```
waic-side-events/
├── app/                    # 主应用（前端 + 后端）
│   ├── src/
│   │   ├── components/     # 公共组件
│   │   ├── routes/         # 页面路由
│   │   ├── server/         # Hono API
│   │   ├── db/             # Drizzle schema / migrations
│   │   └── lib/            # 工具函数
│   ├── public/             # 静态资源
│   ├── scripts/            # 种子与迁移脚本
│   └── wrangler.jsonc      # Workers 配置
├── docs/                   # 项目文档
│   ├── architecture.md     # 架构说明
│   └── agent-skill.md      # Agent Skill 使用说明
├── data/                   # 本地开发数据
├── scripts/                # 采集与辅助脚本
└── README.md
```

## Agent 创建活动 Skill

为降低主办方录入成本，项目提供 Agent Skill，位置：

```
~/.agents/skills/waic-event-creator/
```

功能：
- **外部来源解析**：粘贴活动报名页、公众号文章、腾讯文档或上传海报，Agent 自动提取字段并创建活动。
- **口述/文字速创**：用自然语言描述活动，Agent 补齐字段后直接创建。

详见 [docs/agent-skill.md](./docs/agent-skill.md)。

## 反馈系统

站点右下角已嵌入 Feedlog 反馈组件，项目 ID：`proj_828241043e494584970c01dc4c0d25ac`。用户可截图标注并提交意见。

## 地图与高德接入

- 前端使用高德 JS API 2.0 渲染地图与标记。
- 后端 `/api/amap/place` 代理高德 Web 服务，保护 Key。
- 活动地点在管理后台通过高德搜索解析为带经纬度的结构化数据。
- 地图数据统一从 `/api/events/geojson` 获取。

## 文档

- [架构说明](./docs/architecture.md)
- [Agent Skill 说明](./docs/agent-skill.md)
- [管理后台操作指南](./docs/admin-guide.md)（可选）

## 许可证

内部项目，版权归属 onenorthlab。
