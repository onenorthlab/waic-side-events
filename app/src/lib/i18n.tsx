import { createContext, useContext, type ReactNode } from 'react'

// 中文版固定使用中文，保留 hooks 接口以便后续扩展
function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`))
}

const M: Record<string, string> = {
  // 导航 / 通用
  'nav.events': '活动',
  'nav.createEvent': '创建活动',
  'nav.signUpLogin': '注册 / 登录',
  'nav.logout': '退出登录',
  'nav.managedEvents': '我管理的活动',
  'common.online': '线上',
  'common.offline': '线下',
  'common.hybrid': '线上线下',
  'common.showMore': '展开更多',
  'common.showLess': '收起',
  'common.notFound': '未找到',
  'common.save': '保存',
  'common.cancel': '取消',
  'common.create': '创建',
  'common.delete': '删除',
  'common.edit': '编辑',
  'common.search': '搜索',
  'common.loading': '加载中…',
  'common.notInSlice': '本功能尚未实现。',
  'common.required': '必填',
  'common.optional': '可选',

  // Events 列表
  'events.title': '活动',
  'events.pickup': '精选活动',
  'events.upcoming': '即将开始',
  'events.past': '已结束',
  'events.count': '{n} 个活动',
  'events.emptyUpcoming': '暂无即将开始的活动',
  'events.emptyPast': '暂无已结束的活动',
  'events.mapView': '地图查看',
  'events.back': '返回活动',
  'events.notFound': '未找到该活动',
  'events.backToList': '← 返回活动列表',

  // 筛选
  'filter.keyword': '关键词',
  'filter.searchEvents': '搜索活动…',
  'filter.tag': '标签',

  // 活动详情
  'detail.addToCalendar': '添加到日历',
  'detail.organizers': '主办方',
  'detail.timetable': '时间表',
  'detail.sessions': '{n} 场',
  'detail.speakers': '嘉宾',
  'detail.showAllSpeakers': '查看全部 {n} 位嘉宾',
  'detail.noDescription': '暂无简介。',

  // 地图
  'map.viewEvent': '查看活动 →',

  // Footer
  'footer.sitemap': '站点地图',
  'footer.company': '公司',
  'footer.about': '关于我们',
  'footer.contact': '联系我们',
  'footer.legal': '法律',
  'footer.terms': '服务条款',
  'footer.privacy': '隐私政策',
  'footer.commercial': '特定商业交易法标注',
  'footer.rights': '© 2026 4S. 保留所有权利。',

  // 后台管理
  'admin.dashboard': '数据概览',
  'admin.participants': '参与者',
  'admin.tickets': '票务',
  'admin.payments': '支付',
  'admin.surveys': '报名表单',
  'admin.speakers': '嘉宾',
  'admin.announcements': '公告',
  'admin.feedback': '反馈',
  'admin.eventSettings': '活动设置',
  'admin.eventFeatures': '功能开关',
  'admin.pageDesign': '页面设计',
  'admin.timetable': '时间表',
  'admin.stages': '舞台',
  'admin.sessions': '场次',
  'admin.staff': '工作人员',
  'admin.meetings': '会议',
  'admin.chat': '聊天',
  'admin.publicPage': '公开页面',
  'admin.noEvents': '你还没有创建活动',
  'admin.createFirstEvent': '创建第一个活动',
}

interface Ctx {
  t: (key: string, vars?: Record<string, string | number>) => string
}
const LocaleCtx = createContext<Ctx>({ t: (k) => k })

export function LocaleProvider({ children }: { children: ReactNode }) {
  const t = (key: string, vars?: Record<string, string | number>) => interpolate(M[key] ?? key, vars)
  return <LocaleCtx.Provider value={{ t }}>{children}</LocaleCtx.Provider>
}

export const useI18n = () => useContext(LocaleCtx)
