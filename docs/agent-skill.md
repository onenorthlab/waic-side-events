# WAIC Event Creator Agent Skill

用于让 AI Agent 在 WAIC Side-Events 平台上自动创建活动。

## 位置

```
~/.agents/skills/waic-event-creator/
├── SKILL.md
└── create-event.js
```

## 触发条件

当用户出现以下意图时调用本 Skill：

- “帮我创建/发布一个活动”
- “把这个活动页面/海报/文章转成可报名的活动”
- “我口述一个活动，你帮我录进去”
- “从 URL / 图片提取活动信息并创建”

## 能力概览

### 1. 外部来源解析

输入可以是：

- 活动报名页 URL
- 微信公众号文章 URL
- 腾讯文档 URL
- 海报/宣传图（本地图片路径）

Agent 会：

1. 使用 `FetchURL` 或浏览器/视觉工具提取正文与图片。
2. 提取标题、副标题、时间、地点、主办方、报名方式、费用、议程/嘉宾、标签。
3. 对缺失字段（如精确地点、票价）向用户确认一次。
4. 通过 `/api/amap/place` 将地点解析为带经纬度的结构。
5. 生成封面图（如原图不清晰，可用 Agnes AI 生成）。
6. 写入 JSON 并调用 `create-event.js` 创建活动。

### 2. 口述/文字速创

Agent 主动收集必要信息：

- 活动标题
- 时间（日期 + 起止时间）
- 地点（城市 + 场馆）
- 活动形式（线上/线下/混合）
- 预计人数
- 是否需要审批
- 票种/费用
- 活动简介

补齐字段后向用户展示摘要，确认后创建。

## 字段规范

创建活动所需 JSON 示例：

```json
{
  "title": "活动标题",
  "catchphrase": "一句话副标题",
  "description": "活动详细介绍，支持 Markdown/HTML",
  "eventType": "ONSITE",
  "state": "PUBLISHED",
  "timezone": "Asia/Shanghai",
  "schedules": [
    { "date": "2026-07-10", "startTime": "09:00", "endTime": "17:30" }
  ],
  "location": [
    {
      "title": "场地名称",
      "displayText": "完整地址",
      "city": "上海",
      "state": "上海",
      "country": "CN",
      "geo": { "lat": 31.1865, "lng": 121.4887 }
    }
  ],
  "thumbnailUrl": "https://...png",
  "mainImageUrl": "https://...png",
  "tags": ["WAIC2026", "AI", "上海"],
  "featured": false,
  "requiresApproval": true,
  "maxParticipants": 200,
  "enabledTickets": true,
  "enabledMeetings": false,
  "enabledChat": false,
  "enabledSideEvents": false,
  "participantListVisibility": "PRIVATE",
  "customStyle": {
    "primaryColor": "#0A4F46",
    "backgroundColor": "#F6FAF9",
    "theme": "light"
  },
  "organizerContact": [
    { "url": "mailto:xxx@waic.events", "label": "组委会邮箱" }
  ],
  "stages": [{ "id": "stage-main", "name": "主会场" }],
  "sessions": [
    {
      "id": "s1",
      "title": "开幕致辞",
      "date": "2026-07-10",
      "startTime": "09:00",
      "endTime": "09:30",
      "stageId": "stage-main",
      "speakerIds": []
    }
  ],
  "speakers": [],
  "announcements": [
    { "id": "a1", "title": "温馨提示", "body": "...", "pinned": true }
  ],
  "surveySchema": [
    { "type": "text", "name": "company", "title": "公司名称", "isRequired": true },
    { "type": "text", "name": "title", "title": "职位", "isRequired": true }
  ],
  "tickets": [
    { "name": "普通票", "description": "", "price": 0, "quantity": 200, "maxPerOrder": 1, "type": "FREE" }
  ]
}
```

## 调用方式

```bash
WAIC_EMAIL=admin@waic.events \
WAIC_PASSWORD=Admin1234! \
node ~/.agents/skills/waic-event-creator/create-event.js /tmp/new-event.json
```

脚本流程：

1. 登录获取 session cookie。
2. `POST /api/manage/events` 创建活动（最小字段）。
3. `PATCH /api/manage/events/:id` 写入完整字段。
4. `POST /api/manage/events/:id/tickets` 创建票种。

## 注意事项

- 当前平台票种仅支持免费票（`type: "FREE"`）。
- `surveySchema` 使用 SurveyJS 格式，常用类型：`text`、`comment`、`radiogroup`、`checkbox`。
- 地点含中文时，调用高德 API 前需 URL 编码。
- 创建成功后返回 `id` 与 `slug`，可引导用户到 `https://waic-side-events.ingle.workers.dev/{slug}` 预览。

## 已验证案例

- 微信公众号文章 → [Booming Night · 世界之外](https://waic-side-events.ingle.workers.dev/booming-night-世界之外-55a11b)
- 腾讯文档 → [WAIC 蚂蚁开源 × 红杉资本 × WaytoAGI Agent 创业局](https://waic-side-events.ingle.workers.dev/waic-蚂蚁开源-红杉资本-waytoagi-agent-创业局-b2bc5f)
