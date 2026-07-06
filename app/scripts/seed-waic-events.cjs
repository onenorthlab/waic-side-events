const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const imageUrls = JSON.parse(fs.readFileSync(path.join(__dirname, 'event-image-urls.json'), 'utf-8'))

const adminId = '87016ca7-3202-47c6-b521-9d1635976a1b'
const adminEmail = 'admin@waic.events'
const now = new Date().toISOString()

function uuid() { return crypto.randomUUID() }
function sqlString(s) {
  if (s == null) return 'NULL'
  return "'" + String(s).replace(/'/g, "''") + "'"
}
function json(o) { return sqlString(JSON.stringify(o)) }

const baseEvents = [
  {
    slug: 'waic-ai-for-good-summit',
    title: 'WAIC 2026 · AI for Good 全球峰会',
    catchphrase: '让人工智能成为向善的力量',
    description:
      '作为 WAIC 2026 上海主论坛之一，AI for Good 全球峰会汇聚联合国机构、各国政府代表、顶尖 AI 学者与社会创新者，围绕 AI 伦理、可持续发展目标（SDGs）、数字包容与全球治理展开深度对话。峰会设置主旨演讲、圆桌论坛与政策发布环节，共同探讨如何让 AI 技术真正服务于人类共同福祉。',
    eventType: 'ONSITE',
    state: 'PUBLISHED',
    timezone: 'Asia/Shanghai',
    schedules: [{ date: '2026-07-10', startTime: '09:00', endTime: '17:30' }],
    location: [
      {
        title: '上海世博中心',
        displayText: '上海市浦东新区世博大道1500号 上海世博中心 红厅',
        city: '上海',
        state: '上海',
        country: 'CN',
        geo: { lat: 31.1865, lng: 121.4887 },
      },
    ],
    tags: ['WAIC2026', '主论坛', 'AI伦理', 'SDGs', '全球治理', '现场活动'],
    featured: true,
    requiresApproval: true,
    maxParticipants: 800,
    enabledTickets: true,
    enabledMeetings: true,
    enabledChat: false,
    enabledSideEvents: true,
    participantListVisibility: 'ADMIN_ONLY',
    customStyle: { primaryColor: '#0A4F46', backgroundColor: '#F6FAF9', theme: 'light' },
    organizerContact: [
      { url: 'mailto:ai-for-good@waic.events', label: '组委会邮箱' },
      { url: 'https://waic.org', label: 'WAIC 官网' },
    ],
    stages: [
      { id: 'stage-red', name: '红厅 · 主会场' },
      { id: 'stage-green', name: '绿厅 · 政策发布' },
    ],
    speakers: [
      { id: 'sp-1', name: '李思远', title: 'WAIC 2026 程序委员会主席', organization: '上海人工智能实验室', imageUrl: '' },
      { id: 'sp-2', name: 'Dr. Sarah Chen', title: 'AI Ethics Lead', organization: 'UN Global Pulse', imageUrl: '' },
      { id: 'sp-3', name: '王浩然', title: '联合创始人', organization: '智源研究院', imageUrl: '' },
    ],
    sessions: [
      { id: 'sess-1', title: '开幕致辞：AI 向善的全球共识', description: '主办方与联合国代表致辞', date: '2026-07-10', startTime: '09:00', endTime: '09:30', stageId: 'stage-red', speakerIds: ['sp-1'] },
      { id: 'sess-2', title: '主旨演讲：SDGs 时代的 AI 责任', description: '', date: '2026-07-10', startTime: '09:30', endTime: '10:30', stageId: 'stage-red', speakerIds: ['sp-2'] },
      { id: 'sess-3', title: '圆桌：全球 AI 治理框架的中国实践', description: '政策、产业与学界三方对话', date: '2026-07-10', startTime: '14:00', endTime: '15:30', stageId: 'stage-green', speakerIds: ['sp-1', 'sp-3'] },
    ],
    announcements: [
      { id: 'ann-1', title: '入场须知', body: '请携带身份证件，于 8:30 开始签到。峰会实行审批制，请提前提交报名信息。', pinned: true },
    ],
    surveySchema: [
      { type: 'text', name: 'organization', title: '所在机构', isRequired: true },
      { type: 'text', name: 'title', title: '职位', isRequired: true },
      { type: 'comment', name: 'interest', title: '您最关注的议题' },
    ],
    tickets: [
      { name: '普通票', description: '含全天参会资格与资料包', price: 0, quantity: 500, maxPerOrder: 1, type: 'FREE', sortOrder: 0 },
      { name: 'VIP 嘉宾票', description: '含前排座位、闭门午宴与嘉宾交流环节', price: 0, quantity: 100, maxPerOrder: 1, type: 'FREE', sortOrder: 1 },
    ],
  },
  {
    slug: 'waic-smart-manufacturing-robotics',
    title: '智能制造与工业机器人边会',
    catchphrase: '走进张江，看机器人如何重塑产线',
    description:
      '探访张江机器人产业园，实地观摩工业机器人、协作机器人与 AI 视觉检测系统在现代产线中的应用。边会结合展厅参观、企业路演与技术工作坊，面向制造业 CIO、产线负责人与机器人创业者开放。',
    eventType: 'ONSITE',
    state: 'PUBLISHED',
    timezone: 'Asia/Shanghai',
    schedules: [{ date: '2026-07-11', startTime: '13:30', endTime: '18:00' }],
    location: [
      {
        title: '张江机器人产业园',
        displayText: '上海市浦东新区张江高科技园区 张江机器人产业园 A栋',
        city: '上海',
        state: '上海',
        country: 'CN',
        geo: { lat: 31.2033, lng: 121.6056 },
      },
    ],
    tags: ['WAIC2026', '智能制造', '机器人', '产业参观', '张江'],
    featured: true,
    requiresApproval: true,
    maxParticipants: 120,
    enabledTickets: true,
    enabledMeetings: false,
    enabledChat: false,
    enabledSideEvents: false,
    participantListVisibility: 'ALL',
    customStyle: { primaryColor: '#E66B2E', backgroundColor: '#FFF8F3', theme: 'light' },
    organizerContact: [{ url: 'mailto:robotics@waic.events', label: '联系组委会' }],
    stages: [{ id: 'stage-demo', name: '路演厅' }],
    speakers: [
      { id: 'sp-r1', name: '陈工', title: '智能制造事业部总监', organization: 'ABB 机器人', imageUrl: '' },
      { id: 'sp-r2', name: '林晓峰', title: 'CTO', organization: '节卡机器人', imageUrl: '' },
    ],
    sessions: [
      { id: 'sess-r1', title: '产业园展厅参观', description: '协作机器人、AGV、AI 质检产线', date: '2026-07-11', startTime: '13:30', endTime: '15:00', stageId: 'stage-demo', speakerIds: [] },
      { id: 'sess-r2', title: '企业路演：从单点自动化到柔性智造', description: '', date: '2026-07-11', startTime: '15:30', endTime: '17:00', stageId: 'stage-demo', speakerIds: ['sp-r1', 'sp-r2'] },
    ],
    announcements: [],
    surveySchema: [
      { type: 'text', name: 'company', title: '公司名称', isRequired: true },
      { type: 'text', name: 'role', title: '您在公司的角色', isRequired: true },
      { type: 'text', name: 'useCase', title: '您关注的机器人应用场景' },
    ],
    tickets: [
      { name: '参观票', description: '含园区参观与企业路演', price: 0, quantity: 100, maxPerOrder: 2, type: 'FREE', sortOrder: 0 },
    ],
  },
  {
    slug: 'waic-ai-medical-imaging-summit',
    title: 'AI 医疗影像专题研讨会',
    catchphrase: '从影像识别到临床决策的 AI 跃迁',
    description:
      '聚焦 AI 在医学影像、病理分析与临床辅助决策中的最新进展。研讨会邀请三甲医院放射科主任、AI 医疗创业公司与药监局专家，分享大模型在影像报告生成、多病种筛查与质控中的真实落地案例。线上同步直播，方便外地专家参与。',
    eventType: 'HYBRID',
    state: 'PUBLISHED',
    timezone: 'Asia/Shanghai',
    schedules: [{ date: '2026-07-12', startTime: '09:30', endTime: '12:00' }],
    location: [
      {
        title: '上海中心大厦',
        displayText: '上海市浦东新区陆家嘴银城中路501号 上海中心大厦 52层会议厅',
        city: '上海',
        state: '上海',
        country: 'CN',
        geo: { lat: 31.2304, lng: 121.505 },
      },
    ],
    tags: ['WAIC2026', '智慧医疗', 'AI影像', '线上直播', '临床决策'],
    featured: false,
    requiresApproval: false,
    maxParticipants: 300,
    enabledTickets: true,
    enabledMeetings: true,
    enabledChat: true,
    enabledSideEvents: false,
    participantListVisibility: 'ALL',
    customStyle: { primaryColor: '#1E6FDC', backgroundColor: '#F3F8FF', theme: 'light' },
    organizerContact: [{ url: 'mailto:health@waic.events', label: '医疗专题组' }],
    stages: [{ id: 'stage-med', name: '上海中心会议厅' }],
    speakers: [
      { id: 'sp-m1', name: '张主任', title: '放射科主任', organization: '复旦大学附属肿瘤医院', imageUrl: '' },
      { id: 'sp-m2', name: '刘博士', title: 'CEO', organization: '数坤科技', imageUrl: '' },
    ],
    sessions: [
      { id: 'sess-m1', title: '大模型辅助影像报告生成的临床验证', description: '', date: '2026-07-12', startTime: '09:30', endTime: '10:30', stageId: 'stage-med', speakerIds: ['sp-m1'] },
      { id: 'sess-m2', title: '从肺结节到多病种：AI 筛查产品化之路', description: '', date: '2026-07-12', startTime: '10:45', endTime: '11:45', stageId: 'stage-med', speakerIds: ['sp-m2'] },
    ],
    announcements: [
      { id: 'ann-m1', title: '线上参会链接', body: '报名后将通过邮件发送腾讯会议直播链接，请留意收件箱。', pinned: false },
    ],
    surveySchema: [
      { type: 'text', name: 'hospital', title: '所在医疗机构', isRequired: true },
      { type: 'text', name: 'department', title: '科室' },
      { type: 'text', name: 'telemedicine', title: '是否参加线上直播？', inputType: 'radio', choices: ['线上', '线下'] },
    ],
    tickets: [
      { name: '线下参会票', description: '含现场座位与茶歇', price: 0, quantity: 120, maxPerOrder: 1, type: 'FREE', sortOrder: 0 },
      { name: '线上直播票', description: '通过邮件获取直播链接', price: 0, quantity: 500, maxPerOrder: 1, type: 'FREE', sortOrder: 1 },
    ],
  },
  {
    slug: 'waic-llm-startup-investor-pitch',
    title: '大模型创业与投资对接会',
    catchphrase: '一场只有创始人和投资人的深夜对话',
    description:
      '闭门路演，仅限 60 人。5 家大模型应用层初创公司进行 8 分钟路演，随后与一线 VC 合伙人进行自由对接。适合正在寻求种子轮到 A 轮的大模型创业者、关注 AI 应用的投资人及产业战略方。',
    eventType: 'ONSITE',
    state: 'PUBLISHED',
    timezone: 'Asia/Shanghai',
    schedules: [{ date: '2026-07-10', startTime: '19:00', endTime: '22:00' }],
    location: [
      {
        title: '西岸美术馆',
        displayText: '上海市徐汇区龙腾大道2600号 西岸美术馆 B1 报告厅',
        city: '上海',
        state: '上海',
        country: 'CN',
        geo: { lat: 31.1568, lng: 121.4579 },
      },
    ],
    tags: ['WAIC2026', '大模型', '创业', '投资', '闭门路演', '夜间活动'],
    featured: true,
    requiresApproval: true,
    maxParticipants: 60,
    enabledTickets: true,
    enabledMeetings: true,
    enabledChat: false,
    enabledSideEvents: false,
    participantListVisibility: 'ADMIN_ONLY',
    customStyle: { primaryColor: '#6B2FBF', backgroundColor: '#1A1025', theme: 'dark', textColor: '#FFFFFF', titleTextColor: '#FFFFFF' },
    organizerContact: [{ url: 'mailto:vc@waic.events', label: '投资人对接' }],
    stages: [{ id: 'stage-pitch', name: 'B1 报告厅' }],
    speakers: [
      { id: 'sp-p1', name: '赵明远', title: '合伙人', organization: '红杉中国', imageUrl: '' },
      { id: 'sp-p2', name: '孙嘉', title: '投资总监', organization: '高榕资本', imageUrl: '' },
    ],
    sessions: [
      { id: 'sess-p1', title: '路演上半场：AI Native 应用', description: '3 个 8 分钟路演', date: '2026-07-10', startTime: '19:30', endTime: '20:30', stageId: 'stage-pitch', speakerIds: [] },
      { id: 'sess-p2', title: '自由对接与冷餐会', description: '', date: '2026-07-10', startTime: '20:45', endTime: '22:00', stageId: 'stage-pitch', speakerIds: [] },
    ],
    announcements: [
      { id: 'ann-p1', title: '闭门活动，审核后入场', body: '请完整填写机构与职位信息，组委会将在 24 小时内完成审核。', pinned: true },
    ],
    surveySchema: [
      { type: 'text', name: 'fund', title: '所在基金/机构', isRequired: true },
      { type: 'text', name: 'investmentStage', title: '关注阶段', isRequired: true },
      { type: 'text', name: 'linkedin', title: 'LinkedIn 或机构主页' },
    ],
    tickets: [
      { name: '投资人票', description: '仅开放给投资机构与产业 CVC', price: 0, quantity: 25, maxPerOrder: 1, type: 'FREE', sortOrder: 0 },
      { name: '创始人票', description: '需提交项目简介，审核后通过', price: 0, quantity: 35, maxPerOrder: 1, type: 'FREE', sortOrder: 1 },
    ],
  },
  {
    slug: 'waic-ai-education-classroom',
    title: 'AI 教育未来课堂体验日',
    catchphrase: '让孩子与 AI 一起探索未来',
    description:
      '面向教育工作者、家长与青少年的公益体验日。现场展示 AI 辅助备课、个性化学习路径、口语陪练与编程启蒙等场景，并设有亲子互动工作坊。活动免费向公众开放，鼓励家庭共同参与。',
    eventType: 'ONSITE',
    state: 'PUBLISHED',
    timezone: 'Asia/Shanghai',
    schedules: [{ date: '2026-07-13', startTime: '09:00', endTime: '16:00' }],
    location: [
      {
        title: '华东师范大学',
        displayText: '上海市普陀区中山北路3663号 华东师范大学 科学会堂',
        city: '上海',
        state: '上海',
        country: 'CN',
        geo: { lat: 31.228, lng: 121.405 },
      },
    ],
    tags: ['WAIC2026', 'AI教育', '公益', '亲子', '体验日'],
    featured: false,
    requiresApproval: false,
    maxParticipants: 400,
    enabledTickets: true,
    enabledMeetings: false,
    enabledChat: false,
    enabledSideEvents: false,
    participantListVisibility: 'ALL',
    customStyle: { primaryColor: '#F59E0B', backgroundColor: '#FFFBEB', theme: 'light' },
    organizerContact: [{ url: 'mailto:edu@waic.events', label: '教育专题组' }],
    stages: [
      { id: 'stage-edu-main', name: '科学会堂' },
      { id: 'stage-edu-workshop', name: '互动教室 A' },
    ],
    speakers: [
      { id: 'sp-e1', name: '周老师', title: '教育学部副教授', organization: '华东师范大学', imageUrl: '' },
      { id: 'sp-e2', name: 'Emma Liu', title: '产品负责人', organization: '猿辅导 AI Lab', imageUrl: '' },
    ],
    sessions: [
      { id: 'sess-e1', title: 'AI 如何改变课堂：从备课到评价', description: '', date: '2026-07-13', startTime: '09:30', endTime: '10:30', stageId: 'stage-edu-main', speakerIds: ['sp-e1'] },
      { id: 'sess-e2', title: '亲子工作坊：用 AI 画一本故事书', description: '需家长陪同，现场提供设备', date: '2026-07-13', startTime: '14:00', endTime: '15:30', stageId: 'stage-edu-workshop', speakerIds: ['sp-e2'] },
    ],
    announcements: [
      { id: 'ann-e1', title: '亲子工作坊名额有限', body: '每个报名账号最多可带 1 名 6-14 岁儿童，请提前报名锁定名额。', pinned: true },
    ],
    surveySchema: [
      { type: 'text', name: 'childAge', title: '孩子年龄（如参加亲子工作坊）' },
      { type: 'text', name: 'school', title: '所在学校或教育机构' },
      { type: 'comment', name: 'expectation', title: '您希望了解的教育 AI 场景' },
    ],
    tickets: [
      { name: '公众体验票', description: '面向教育工作者、家长与青少年', price: 0, quantity: 400, maxPerOrder: 3, type: 'FREE', sortOrder: 0 },
    ],
  },
  {
    slug: 'waic-autonomous-driving-roadshow',
    title: '自动驾驶与车路协同路演',
    catchphrase: '上车，去嘉定看自动驾驶落地',
    description:
      '前往国家智能网联汽车（上海）试点示范区，实地体验 L4 级 Robotaxi、智能公交与车路协同演示。活动包含试乘体验、技术讲解与政策闭门座谈，适合汽车产业链从业者、城市交通管理者与投资人。',
    eventType: 'ONSITE',
    state: 'PUBLISHED',
    timezone: 'Asia/Shanghai',
    schedules: [{ date: '2026-07-11', startTime: '08:30', endTime: '15:00' }],
    location: [
      {
        title: '国家智能网联汽车（上海）试点示范区',
        displayText: '上海市嘉定区安亭镇博园路7566号 智能网联汽车示范区',
        city: '上海',
        state: '上海',
        country: 'CN',
        geo: { lat: 31.286, lng: 121.183 },
      },
    ],
    tags: ['WAIC2026', '自动驾驶', '车路协同', '嘉定', '试乘体验'],
    featured: false,
    requiresApproval: true,
    maxParticipants: 80,
    enabledTickets: true,
    enabledMeetings: false,
    enabledChat: false,
    enabledSideEvents: false,
    participantListVisibility: 'ALL',
    customStyle: { primaryColor: '#10B981', backgroundColor: '#ECFDF5', theme: 'light' },
    organizerContact: [{ url: 'mailto:av@waic.events', label: '自动驾驶专题组' }],
    stages: [{ id: 'stage-av', name: '示范区体验中心' }],
    speakers: [
      { id: 'sp-a1', name: '郑骏', title: '首席科学家', organization: 'AutoX 安途', imageUrl: '' },
      { id: 'sp-a2', name: '吴敏', title: '副总裁', organization: 'momenta', imageUrl: '' },
    ],
    sessions: [
      { id: 'sess-a1', title: 'Robotaxi 试乘体验', description: '分组试乘，每组约 20 分钟', date: '2026-07-11', startTime: '09:30', endTime: '11:30', stageId: 'stage-av', speakerIds: [] },
      { id: 'sess-a2', title: '车路协同技术解析与政策座谈', description: '', date: '2026-07-11', startTime: '13:30', endTime: '14:30', stageId: 'stage-av', speakerIds: ['sp-a1', 'sp-a2'] },
    ],
    announcements: [
      { id: 'ann-a1', title: '集合与接驳', body: '请于 8:30 在人民广场集合乘坐大巴前往嘉定，自驾请提前报备车牌。', pinned: true },
    ],
    surveySchema: [
      { type: 'text', name: 'company', title: '公司名称', isRequired: true },
      { type: 'text', name: 'role', title: '职务', isRequired: true },
      { type: 'text', name: 'licensePlate', title: '自驾车牌（如需停车）' },
    ],
    tickets: [
      { name: '试乘体验票', description: '含大巴接驳、试乘与技术讲解', price: 0, quantity: 80, maxPerOrder: 1, type: 'FREE', sortOrder: 0 },
    ],
  },
  {
    slug: 'waic-ai-art-design-workshop',
    title: 'AI 艺术与设计创作坊',
    catchphrase: '在 M50，和 AI 一起创作',
    description:
      '面向设计师、艺术家与创意工作者的半日创作坊。现场演示 Midjourney、Stable Diffusion 与自研工作流，指导参与者完成一幅 AI 辅助视觉作品。活动强调人机协作，鼓励跨学科交流。',
    eventType: 'ONSITE',
    state: 'PUBLISHED',
    timezone: 'Asia/Shanghai',
    schedules: [{ date: '2026-07-12', startTime: '14:00', endTime: '18:00' }],
    location: [
      {
        title: 'M50 创意园',
        displayText: '上海市普陀区莫干山路50号 M50 创意园 7号楼',
        city: '上海',
        state: '上海',
        country: 'CN',
        geo: { lat: 31.245, lng: 121.45 },
      },
    ],
    tags: ['WAIC2026', 'AI艺术', '设计', 'M50', '创作坊'],
    featured: true,
    requiresApproval: false,
    maxParticipants: 50,
    enabledTickets: true,
    enabledMeetings: false,
    enabledChat: true,
    enabledSideEvents: false,
    participantListVisibility: 'ALL',
    customStyle: { primaryColor: '#EC4899', backgroundColor: '#FDF2F8', theme: 'light' },
    organizerContact: [{ url: 'mailto:art@waic.events', label: '艺术专题组' }],
    stages: [{ id: 'stage-art', name: '7号楼创作空间' }],
    speakers: [
      { id: 'sp-art1', name: '陆川', title: '数字艺术家', organization: '某知名设计工作室', imageUrl: '' },
      { id: 'sp-art2', name: '苏菲', title: 'AI 设计工具产品经理', organization: 'Canva 中国', imageUrl: '' },
    ],
    sessions: [
      { id: 'sess-art1', title: 'AI 图像生成工作流演示', description: '从 prompt 到成品海报', date: '2026-07-12', startTime: '14:00', endTime: '15:30', stageId: 'stage-art', speakerIds: ['sp-art1'] },
      { id: 'sess-art2', title: '分组创作：我的 WAIC 主题海报', description: '现场出图并打印带走', date: '2026-07-12', startTime: '15:45', endTime: '17:30', stageId: 'stage-art', speakerIds: ['sp-art1', 'sp-art2'] },
    ],
    announcements: [],
    surveySchema: [
      { type: 'text', name: 'portfolio', title: '个人作品或社交账号链接' },
      { type: 'text', name: 'tool', title: '您常用的 AI 设计工具' },
      { type: 'comment', name: 'idea', title: '想尝试的创作方向' },
    ],
    tickets: [
      { name: '创作坊门票', description: '含创作指导、设备与作品打印', price: 0, quantity: 50, maxPerOrder: 1, type: 'FREE', sortOrder: 0 },
    ],
  },
  {
    slug: 'waic-sustainable-ai-energy',
    title: '可持续 AI 与能源边会',
    catchphrase: '让算力更绿色',
    description:
      '在崇明生态岛举办的一场低碳主题边会，探讨数据中心能效、绿色算力、AI 驱动的能源调度与碳中和路径。活动采用碳中和办会标准，现场提供新能源接驳车，并提供线上直播选项。',
    eventType: 'HYBRID',
    state: 'PUBLISHED',
    timezone: 'Asia/Shanghai',
    schedules: [{ date: '2026-07-14', startTime: '09:00', endTime: '13:00' }],
    location: [
      {
        title: '崇明生态岛会议中心',
        displayText: '上海市崇明区陈家镇东滩大道2000号 崇明生态岛会议中心',
        city: '上海',
        state: '上海',
        country: 'CN',
        geo: { lat: 31.516, lng: 121.816 },
      },
    ],
    tags: ['WAIC2026', '绿色AI', '碳中和', '崇明', '可持续能源'],
    featured: false,
    requiresApproval: true,
    maxParticipants: 150,
    enabledTickets: true,
    enabledMeetings: true,
    enabledChat: false,
    enabledSideEvents: false,
    participantListVisibility: 'ALL',
    customStyle: { primaryColor: '#059669', backgroundColor: '#F0FDF4', theme: 'light' },
    organizerContact: [{ url: 'mailto:green@waic.events', label: '绿色 AI 专题组' }],
    stages: [{ id: 'stage-green', name: '生态会议厅' }],
    speakers: [
      { id: 'sp-g1', name: '何静', title: '首席可持续发展官', organization: '阿里云', imageUrl: '' },
      { id: 'sp-g2', name: 'Markus Weber', title: '能源 AI 研究员', organization: 'TUM', imageUrl: '' },
    ],
    sessions: [
      { id: 'sess-g1', title: '绿色数据中心：从 PUE 到可再生能源', description: '', date: '2026-07-14', startTime: '09:30', endTime: '10:30', stageId: 'stage-green', speakerIds: ['sp-g1'] },
      { id: 'sess-g2', title: 'AI 电网调度与碳足迹追踪', description: '', date: '2026-07-14', startTime: '10:45', endTime: '11:45', stageId: 'stage-green', speakerIds: ['sp-g2'] },
      { id: 'sess-g3', title: '圆桌：AI 发展的环境责任', description: '', date: '2026-07-14', startTime: '12:00', endTime: '12:45', stageId: 'stage-green', speakerIds: ['sp-g1', 'sp-g2'] },
    ],
    announcements: [
      { id: 'ann-g1', title: '新能源接驳车报名', body: '组委会提供从人民广场至崇明的往返新能源大巴，请在报名表中勾选是否需要。', pinned: true },
    ],
    surveySchema: [
      { type: 'text', name: 'organization', title: '所在机构', isRequired: true },
      { type: 'text', name: 'field', title: '您关注的绿色 AI 领域' },
      { type: 'text', name: 'shuttle', title: '是否需要接驳车？', inputType: 'radio', choices: ['需要', '不需要'] },
    ],
    tickets: [
      { name: '线下参会票', description: '含会场参与与午餐（素食为主）', price: 0, quantity: 120, maxPerOrder: 1, type: 'FREE', sortOrder: 0 },
      { name: '线上直播票', description: '邮件获取直播链接', price: 0, quantity: 500, maxPerOrder: 1, type: 'FREE', sortOrder: 1 },
    ],
  },
]

function buildEvent(base, imageUrl) {
  const id = uuid()
  const startDate = base.schedules[0].date
  const endDate = base.schedules[base.schedules.length - 1].date
  const data = {
    id,
    slug: base.slug,
    startDate,
    endDate,
    title: base.title,
    catchphrase: base.catchphrase,
    description: base.description,
    eventType: base.eventType,
    state: base.state,
    timezone: base.timezone,
    schedules: base.schedules,
    location: base.location,
    thumbnailUrl: imageUrl,
    mainImageUrl: imageUrl,
    tags: base.tags,
    featured: base.featured,
    enabledTickets: base.enabledTickets,
    enabledMeetings: base.enabledMeetings,
    enabledChat: base.enabledChat,
    enabledSideEvents: base.enabledSideEvents,
    maxParticipants: base.maxParticipants,
    requiresApproval: base.requiresApproval,
    participantListVisibility: base.participantListVisibility,
    customStyle: base.customStyle,
    organizerContact: base.organizerContact,
    stages: base.stages,
    sessions: base.sessions,
    speakers: base.speakers,
    announcements: base.announcements,
    surveySchema: base.surveySchema,
    createdBy: { id: adminId, email: adminEmail },
    createdById: adminId,
    createdAt: now,
    updatedAt: now,
    hasEnded: false,
  }
  return {
    id,
    data,
    tickets: base.tickets,
  }
}

const events = baseEvents.map((base) => {
  const img = imageUrls.find((i) => i.slug === base.slug)
  if (!img) throw new Error(`Missing image URL for ${base.slug}`)
  return buildEvent(base, img.url)
})

const eventSql = events
  .map((ev) => {
    const d = ev.data
    return `INSERT INTO events (id, slug, title, catchphrase, description, event_type, state, timezone, schedules, location, thumbnail_url, main_image_url, start_date, end_date, has_ended, featured, requires_approval, enabled_tickets, enabled_meetings, enabled_chat, enabled_side_events, max_participants, participant_list_visibility, custom_style, organizer_contact, stages, sessions, speakers, announcements, survey_schema, created_by, created_by_id, created_at, updated_at, data) VALUES (
      ${sqlString(d.id)},
      ${sqlString(d.slug)},
      ${sqlString(d.title)},
      ${sqlString(d.catchphrase)},
      ${sqlString(d.description)},
      ${sqlString(d.eventType)},
      ${sqlString(d.state)},
      ${sqlString(d.timezone)},
      ${json(d.schedules)},
      ${json(d.location)},
      ${sqlString(d.thumbnailUrl)},
      ${sqlString(d.mainImageUrl)},
      ${sqlString(d.startDate)},
      ${sqlString(d.endDate)},
      ${d.hasEnded ? 1 : 0},
      ${d.featured ? 1 : 0},
      ${d.requiresApproval ? 1 : 0},
      ${d.enabledTickets ? 1 : 0},
      ${d.enabledMeetings ? 1 : 0},
      ${d.enabledChat ? 1 : 0},
      ${d.enabledSideEvents ? 1 : 0},
      ${d.maxParticipants ?? 'NULL'},
      ${sqlString(d.participantListVisibility)},
      ${json(d.customStyle)},
      ${json(d.organizerContact)},
      ${json(d.stages)},
      ${json(d.sessions)},
      ${json(d.speakers)},
      ${json(d.announcements)},
      ${json(d.surveySchema)},
      ${json(d.createdBy)},
      ${sqlString(d.createdById)},
      ${sqlString(d.createdAt)},
      ${sqlString(d.updatedAt)},
      ${json(d)}
    );`
  })
  .join('\n')

const ticketSql = events
  .flatMap((ev) =>
    ev.tickets.map((t, idx) => {
      const ticketId = uuid()
      return `INSERT INTO tickets (id, event_id, name, description, price, quantity, max_per_order, sale_starts_at, sale_ends_at, type, enabled, sort_order, created_at, updated_at, data) VALUES (
        ${sqlString(ticketId)},
        ${sqlString(ev.data.id)},
        ${sqlString(t.name)},
        ${sqlString(t.description)},
        ${t.price ?? 0},
        ${t.quantity ?? 'NULL'},
        ${t.maxPerOrder ?? 1},
        NULL,
        NULL,
        ${sqlString(t.type)},
        1,
        ${idx},
        ${sqlString(now)},
        ${sqlString(now)},
        ${json({ id: ticketId, eventId: ev.data.id, ...t })}
      );`
    })
  )
  .join('\n')

const sql = `-- Seeded 8 WAIC 2026 side events\n${eventSql}\n${ticketSql}`
const outPath = path.join(__dirname, 'seed-waic-events.sql')
fs.writeFileSync(outPath, sql)
console.log(`Wrote ${events.length} events and SQL to ${outPath}`)
