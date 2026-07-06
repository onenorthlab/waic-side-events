# WAIC Side-Events 项目制作与演进史

本文档记录本项目从最初构想到当前交付的完整过程，便于后续接手的 AI 或开发者快速理解项目背景、关键决策与迭代脉络。

---

## 一、起点：4s.link 复刻项目

项目最初源自对 [4s.link](https://4s.link)（4S Events Platform）的功能层复刻。目标是通过 `website-replication` skill 对着真实站点做登录态归档，逐字段对齐 `api.4s.link` 的真实契约，重建一套可运行的活动平台原型。

### 1.1 早期工作目录

- 本地路径：`/Users/kane/4s-replica-work/`
- 仓库：`https://github.com/onenorthlab/4s-replica`
- 结构：
  - `app/`：复刻 App（React + Hono + Drizzle）
  - `scripts/`：采集、登录态捕获、契约抽取脚本
  - `capture/`：原始 pages/assets/网络抓包归档（已 gitignore，仅保留 `DATA-MODEL.md` 契约文档）
  - `seed/`：从 4s.link 抽取的 JSON-LD/OG 种子数据

### 1.2 复刻阶段已实现的内容

- **Events 模块**：活动列表、详情、真实标签云、搜索、日期分组、pageInfo 分页。
- **Communities 模块**：3 列卡片网格、搜索、标签云、详情。
- **Playlists 模块**：Pickup 方卡、列表、详情。
- 数据模型逐字段对齐真实 Event（48 字段）、Community（19 字段）、Playlist（12 字段）。
- 响应信封与端点对齐 `api.4s.link`。

---

## 二、转向：WAIC Side-Events 周边活动平台

在复刻 4s.link 基础之上，项目被重新定位为 **WAIC（世界人工智能大会）周边活动平台**。核心诉求：

1. 让 WAIC 周边活动主办方低门槛发布活动。
2. 让参会者按时间、标签、地图发现与报名活动。
3. 通过 Agent 降低主办方录入成本（兼容公众号/腾讯文档/海报/口述）。
4. 提供反馈通道，便于快速迭代。

这次转向保留了 4s.link 复刻阶段沉淀下来的技术栈与部分 UI/UX 经验，但数据、品牌、功能重点全部切换为 WAIC 场景。

---

## 三、技术栈与架构选择

| 层级 | 选型 | 原因 |
|------|------|------|
| 前端框架 | React 19 + TanStack Router | 单页应用、文件式路由、类型安全 |
| 构建 | Vite 6 | 快速 HMR、SSR 构建服务端入口 |
| 样式 | Tailwind CSS v4 + shadcn/ui | 原子类 + 现成组件库，快速迭代 |
| 服务端 | Hono | 轻量、适配 Cloudflare Workers、类型友好 |
| ORM | Drizzle ORM | 同时适配 D1 与 better-sqlite3 本地开发 |
| 数据库 | Cloudflare D1 | 边缘部署、与 Workers 原生集成 |
| 地图 | 高德地图 JS API 2.0 | 国内地图合规、POI 数据完整 |
| 邮件 | Resend | 简单易用，支持发送报名/审核邮件 |
| 反馈 | Feedlog | 轻量嵌入，支持截图标注 |

### 3.1 本地开发 vs 生产

- **本地**：`better-sqlite3` + `app/data/app.db`，首次启动自动 seed。
- **生产**：Cloudflare D1，通过 `wrangler.jsonc` 绑定 `DB`。
- **部署**：`pnpm deploy` 一键构建前端 + SSR 服务端并上传 Workers。

---

## 四、迭代里程碑

### Milestone 1：拟真 WAIC 活动数据

- 创建了 8 个风格各异的 WAIC 周边活动。
- 每个活动覆盖完整配置项：标题、副标题、描述、日程、地点、票务、嘉宾、议程、公告、报名表单、自定义主题色等。
- 使用 Agnes AI（`agnes-image-2.1-flash`）生成活动封面图，让活动看起来真实可信。
- 地点使用高德搜索解析为带经纬度的结构化数据。

### Milestone 2：管理后台

- 管理员登录：`/manage/login`。
- 活动 CRUD：创建、编辑、发布/草稿。
- 票种管理：当前仅支持免费票。
- 报名表单：基于 SurveyJS 的自定义字段。
- 报名审核：通过/拒绝 + 自动邮件通知。
- 嘉宾、议程、舞台、公告等子模块。

### Milestone 3：地图接入

- 从 OpenStreetMap/Leaflet 切换到 **高德地图**。
- 新增 `/api/events/geojson` 统一返回活动坐标。
- 新增 `/events/maps` 全地图页。
- 首页侧边栏新增 `MiniEventMap`，展示上海概览与活动标记。
- 后端新增 `/api/amap/place` 代理，保护高德 Key。

### Milestone 4：日程聚合

- 新增 `/schedules` 页面。
- 聚合所有已发布活动的 sessions，按时间展示。

### Milestone 5：日历交互

- 右侧日历从静态展示升级为可交互过滤。
- 支持月份选择、前后翻页、有活动日期圈选、选中日期填充、清除选择。
- 活动列表顶部显示日期筛选 chip。
- 标签云改为从已发布活动实时统计中文标签。

### Milestone 6：反馈系统

- 嵌入 Feedlog 反馈组件（项目 ID：`proj_828241043e494584970c01dc4c0d25ac`）。
- 用户可在任意页面截图标注并提交意见。

### Milestone 7：Agent 创建活动 Skill

- 在 `~/.agents/skills/waic-event-creator/` 创建 Skill。
- 提供两种模式：
  1. **外部来源解析**：URL、公众号文章、腾讯文档、海报图片。
  2.  **口述/文字速创**：自然语言描述活动。
- 核心脚本 `create-event.js` 自动登录并调用管理 API 创建活动。
- 已验证案例：
  - 微信公众号 → [Booming Night · 世界之外](https://waic-side-events.ingle.workers.dev/booming-night-世界之外-55a11b)
  - 腾讯文档 → [WAIC 蚂蚁开源 × 红杉资本 × WaytoAGI Agent 创业局](https://waic-side-events.ingle.workers.dev/waic-蚂蚁开源-红杉资本-waytoagi-agent-创业局-b2bc5f)

### Milestone 8：项目整理与交接

- 将项目从混有 4s-replica 旧资料的 `/Users/kane/4s-replica-work/` 中拆出。
- 新建干净目录：`~/Projects/waic-side-events/`。
- 保留 `app/`、`docs/`、`README.md`、`.gitignore`。
- 重新初始化 Git 仓库并推送到 `https://github.com/onenorthlab/waic-side-events`。
- 创建飞书交接文档，记录架构、操作、Skill、地图、反馈、已知限制与下一步。

---

## 五、关键决策记录

### 5.1 为什么从 Leaflet 切换到高德？

- 4s.link 原方案使用 Google Maps/OpenStreetMap，在国内访问不稳定。
- WAIC 活动均在上海，国内 POI 与路线数据高德更准确。
- 高德 JS API 2.0 提供完整地图、标记、信息窗体能力。

### 5.2 为什么先做免费票？

- 真实支付需要接入微信/支付宝，涉及商户号、回调、合规，周期较长。
- 免费票已能覆盖 WAIC 周边活动主流场景（沙龙、路演、社交局）。
- 架构上预留了 `tickets.type` 字段，后续扩展付费票成本较低。

### 5.3 为什么用 Agent Skill 做导入？

- 主办方通常先在公众号、腾讯文档、朋友圈发布活动，不会主动来后台填写。
- 通过 Agent 解析外部来源，可以“尊重他们已经做好的海报和文章”，降低迁移成本。
- 口述速创覆盖小型活动场景，主办方无需做海报也能快速上线。

### 5.4 为什么保留 4s-replica 的旧目录？

- 旧目录中 `capture/`、`scripts/`、`seed/` 仍包含 4s.link 的原始采集资料与契约文档。
- 这些资料对未来继续对齐 4s.link 的某些高级功能可能有参考价值。
- WAIC 项目已完全独立到新目录，互不干扰。

---

## 六、踩坑与经验

### 6.1 日历组件的反复调整

- 最初日历是静态展示，用户反馈“不太对”。
- 对标 `https://4s.link/en/events?isPaid=true&date=2026-07-03` 后，调整为：
  - 地图在日历上方。
  - 有活动日期用绿色圆圈标记。
  - 选中日期填充显示。
  - 支持月份下拉、前后切换、清除选择。
- 经验：日历这类控件必须直接对标参考站，不能凭感觉实现。

### 6.2 地图 marker 与 zoom

- 首次接入高德时，默认 marker 过大、地图 zoom 过小。
- 后续通过自定义缩放级别与更小的标记样式优化。
- 经验：地图概览需要平衡“展示全部”与“视觉清晰”。

### 6.3 环境变量管理

- `RESEND_API_KEY`、`EMAIL_FROM`、`AMAP_KEY` 必须在 Cloudflare Secrets 中设置。
- `EMAIL_FROM` 必须使用 Resend 已验证域名，否则邮件会被拒收。
- 经验：本地开发与生产环境差异要提前文档化。

### 6.4 Agent 导入的封面图

- 外部来源（公众号/腾讯文档）的封面图不一定能直接复用。
- Agnes AI 可以生成封面，但需要 API Key。
- 经验：导入流程应允许“保留原图 / 自动生成 / 使用占位图”三种策略。

---

## 七、当前状态快照

- **生产环境**：https://waic-side-events.ingle.workers.dev
- **管理后台**：https://waic-side-events.ingle.workers.dev/manage/login
- **管理员账号**：`admin@waic.events` / `Admin1234!`
- **GitHub 仓库**：https://github.com/onenorthlab/waic-side-events
- **本地目录**：`~/Projects/waic-side-events`
- **飞书交接文档**：https://onenorth.feishu.cn/docx/EXBod5boooBO0bxxevicf0RSn6d
- **Agent Skill**：`~/.agents/skills/waic-event-creator/`

---

## 八、推荐阅读顺序（给接手者）

1. `README.md` — 项目概览与快速开始。
2. `docs/architecture.md` — 架构、路由、数据模型。
3. `docs/project-history.md` — 本文档，了解演进脉络。
4. `docs/admin-guide.md` — 后台操作。
5. `docs/agent-skill.md` — Agent 导入能力。
6. `app/src/server/index.ts` 与 `app/src/db/schema.ts` — 代码入口。

---

## 九、下一步建议（来自历史迭代中的未竟事项）

- 接入真实支付（微信/支付宝），支持付费票。
- 补齐列表/网格视图切换、价格过滤、日历 hover tooltip。
- 优化移动端响应式与地图交互。
- 固化 Agent Skill 的 URL 解析规则，减少 LLM 不确定性。
- 接入微信登录，降低参会者注册门槛。
- 增加活动数据统计看板。
