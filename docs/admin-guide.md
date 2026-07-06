# WAIC Side-Events 管理后台操作指南

## 登录

访问 https://waic-side-events.ingle.workers.dev/manage/login

默认管理员账号：

- 邮箱：`admin@waic.events`
- 密码：`Admin1234!`

## 创建活动

1. 登录后点击右上角“创建活动”。
2. 填写基础信息：标题、副标题、活动形式、状态、时区。
3. 添加日程：可添加多天或多场次。
4. 添加地点：输入场馆名称与地址，系统会通过高德 API 解析经纬度。
5. 设置封面图与主图。
6. 配置标签、主题色、报名表单字段。
7. 添加嘉宾与议程（可选）。
8. 添加公告（可选）。
9. 发布活动。

## 配置票种

- 进入活动管理页 → “票种”。
- 当前仅支持免费票：
  - `type = FREE`
  - `price = 0`
- 设置数量与每人限购数量。

## 报名表单

- 使用 SurveyJS 格式定义表单字段。
- 常用字段类型：`text`、`comment`、`radiogroup`、`checkbox`。
- 可设置 `isRequired: true` 强制填写。

## 报名审核

1. 进入活动管理页 → “报名管理”。
2. 查看报名者提交的答案。
3. 点击“通过”或“拒绝”。
4. 通过审核后，系统会自动发送邮件通知（需配置 Resend 与 EMAIL_FROM）。

## 邮件配置

在 Cloudflare Secrets 中设置：

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
```

`EMAIL_FROM` 必须使用已在 Resend 验证的域名，否则邮件可能被拒收。

## 地图检查

- 确保活动地点已正确解析经纬度。
- 可在 `/events/maps` 页面查看所有活动标记。

## 常见问题

**Q：活动创建后首页看不到？**  
A：检查活动 `state` 是否为 `PUBLISHED`，且 `schedules` 不为空。

**Q：用户报名后没收到邮件？**  
A：检查 `RESEND_API_KEY` 与 `EMAIL_FROM` 是否已设置，以及发件域名是否已验证。

**Q：地图地点搜索失败？**  
A：检查 `AMAP_KEY` 是否已设置，且 Key 已开通“Web服务API”与“Web端(JS API)”。
