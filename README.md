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
- [项目演进史](#项目演进史)
- [许可证](#许可证)

---

## 功能特性

- 🎪 **活动发布**：标题、副标题、多日程、场地、嘉宾、议程、公告、报名表单、票务。
- 📲 **站内导入**（2026-07 新）：管理后台贴公众号文章/网页链接或粘贴全文，正文与海报原样保留（Markdown 保真 + 防盗链图片代理），MiniMax 自动抽取名称/时间/地点/标签，确认即成草稿。
- 📝 **Markdown 正文**：活动描述支持完整 Markdown 渲染（GFM），兼容历史 HTML 数据。
- 🔍 **多维发现**：会期日期条 + 标签 + 关键词 + 月历过滤；桌面右栏地图概览。
- 🗺️ **地图聚合**：高德地图展示全量活动地点，支持全地图页 `/events/maps`。
- 📅 **日程聚合**：跨活动日程统一展示 `/schedules`。
- 🎟️ **报名 · 电子票 · 现场签到**（2026-07 新）：报名通过后获得 HMAC 签名电子票（二维码 + 8 位短码），工作人员用 `/manage/events/:id/checkin` 手机扫码核销，防重复、防伪造、实时统计。
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
| `GENERALCOMPUTE_API_KEY` | GeneralCompute LLM Key（导入字段抽取，minimax-m2.7） | 导入功能必填 |
| `TICKET_SECRET` | 电子票 HMAC 签名密钥（`openssl rand -hex 32`） | 生产必填 |

`GENERALCOMPUTE_BASE_URL` / `GENERALCOMPUTE_MODEL` 为普通 vars，已写在 `wrangler.jsonc`。

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
│   ├── agent-skill.md      # Agent Skill 使用说明
│   ├── admin-guide.md      # 管理后台操作指南
│   └── project-history.md  # 项目制作与演进史
├── data/                   # 本地开发数据
├── scripts/                # 采集与辅助脚本
└── README.md
```

## 站内导入（替代原 Agent Skill）

2026-07 起，活动导入已内建到产品里，不再依赖外部 Agent Skill：

1. 登录后进入「创建活动」→「从链接 / 文章导入」。
2. 贴公众号文章或网页链接（抓不到时可直接粘贴全文）。
3. 系统原样保留正文与图片（**尊重主办方原文，绝不改写**；微信防盗链图片走 `/api/images/proxy` 代理），并用 MiniMax 2.7 只抽取结构化字段（名称/时间/地点/标签/主办方），地点经高德地理编码落点。
4. 确认信息后生成草稿，在后台补充票务/表单后发布。

原 `~/.agents/skills/waic-event-creator/` Skill 仍可用但已非主路径，见 [docs/agent-skill.md](./docs/agent-skill.md)。

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
- [管理后台操作指南](./docs/admin-guide.md)
- [项目制作与演进史](./docs/project-history.md)

## 项目演进史

本项目源自一次活动平台复刻实验，后转向为 WAIC 周边活动平台；2026-07 完成品牌独立与整站重设计（钴蓝视觉、移动端一等公民、站内导入、电子票签到，作为 WaytoAGI 2.0 的先导项目）。完整演进见 [docs/project-history.md](./docs/project-history.md)。

## 许可证

内部项目，版权归属 onenorthlab。
