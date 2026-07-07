import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// 真双语 i18n：中文默认 + 英文。策略与 4s.link 相同，只翻译 UI 层
// （导航/按钮/表单标签/系统文案/空态提示），活动内容（标题/正文）保持主办方原文不翻译。
function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`))
}

export type Locale = 'zh' | 'en'

const zh: Record<string, string> = {
  // 导航 / 通用
  'nav.events': '活动',
  'nav.schedules': '日程',
  'nav.map': '地图',
  'nav.me': '我的',
  'nav.createEvent': '创建活动',
  'nav.publishEvent': '发布活动',
  'nav.signUpLogin': '注册 / 登录',
  'nav.logout': '退出登录',
  'nav.managedEvents': '我管理的活动',
  'nav.notifications': '通知',
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
  'common.clearSearch': '清除搜索',
  'common.theme': '主题',
  'common.toggleTheme': '切换深浅色主题',

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
  'events.heroTitle': '这一周，AI 圈都在哪儿',
  'events.heroSubtitle': 'WAIC 世界人工智能大会期间的周边聚会、路演、峰会与夜局，一站看全、一键报名。',
  'events.clearAllFilters': '清除全部筛选',
  'events.sessionsCount': '{n} 场',
  'events.mapEntry': '地图',

  // 筛选
  'filter.keyword': '关键词',
  'filter.searchEvents': '搜索活动…',
  'filter.tag': '标签',

  // DateStrip
  'dateStrip.all': '全部',
  'dateStrip.today': '今天',

  // EventCard
  'card.live': '进行中',
  'card.upcomingSoon': '即将开始',

  // 活动详情
  'detail.addToCalendar': '添加到日历',
  'detail.organizers': '主办方',
  'detail.organizerFallback': '主办方',
  'detail.timetable': '时间表',
  'detail.sessions': '{n} 场',
  'detail.speakers': '嘉宾',
  'detail.showAllSpeakers': '查看全部 {n} 位嘉宾',
  'detail.noDescription': '暂无简介。',
  'detail.ended': '活动已结束',
  'detail.alreadyRegistered': '已报名 ✓',
  'detail.registerNow': '立即报名',
  'detail.enterOnlineVenue': '进入线上会场',
  'detail.navigate': '导航',
  'detail.limitedTo': '限 {n} 人',
  'detail.requiresApproval': '报名需主办方审核',
  'detail.registerTitle': '报名参加',
  'detail.registerHintApproval': '提交后等待主办方审核，通过后发电子票',
  'detail.registerHintFree': '免费报名，确认邮件附电子票',
  'detail.registerDialogTitle': '报名 · {title}',
  'detail.registrationSuccess': '报名成功',
  'detail.registrationPendingReview': '已提交，等待审核',
  'detail.confirmationEmailSent': '确认邮件已发送。凭邮件中的电子票入场。',
  'detail.pendingReviewNotice': '审核通过后会通过邮件通知你，并附上电子票。',
  'detail.viewTicket': '查看电子票',
  'detail.close': '关闭',
  'detail.name': '姓名',
  'detail.email': '邮箱',
  'detail.ticketEmailHint': '电子票和活动通知会发送到这个邮箱',
  'detail.showInParticipantList': '在「谁会来」名单中展示我的名字',
  'detail.submitting': '提交中…',
  'detail.confirmRegistration': '确认报名',
  'detail.fillSurveyRequired': '请完整填写报名表单',
  'detail.alreadyRegisteredError': '该邮箱已报名过本活动',
  'detail.soldOut': '名额已满',
  'detail.registerFailed': '报名失败，请稍后重试',
  'detail.registerFailedGeneric': '报名失败',

  // 谁会来 / 主办方
  'participants.title': '谁会来',
  'participants.confirmed': '{n} 人已确认',
  'participants.approvedOnlyHint': '报名通过后可查看参会者名单',
  'participants.hiddenByChoice': '参会者选择了不公开展示',
  'participants.speakerTag': '嘉宾',
  'participants.moreCount': '还有 {n} 人',

  // EventActions
  'actions.bookmark': '收藏',
  'actions.unbookmark': '取消收藏',
  'actions.share': '分享',
  'actions.loginToBookmark': '登录后可以收藏活动',
  'actions.goLogin': '去登录',
  'actions.bookmarkedHint': '已收藏，可在「我的」查看',
  'actions.unbookmarkedHint': '已取消收藏',
  'actions.actionFailed': '操作失败，请重试',
  'actions.linkCopied': '活动链接已复制，去分享给朋友吧',
  'actions.copyFailed': '复制失败，请手动复制地址栏链接',

  // 地图
  'map.viewEvent': '查看活动 →',
  'map.title': '活动地图',
  'map.subtitle': '看看每个局离你有多远',
  'map.listEntry': '列表',
  'map.loadFailed': '地图加载失败',

  // Schedules 日程总表
  'schedules.title': '日程总表',
  'schedules.subtitle': '全部周边活动的公开场次，按日期与时间排好，方便你规划每一天。',
  'schedules.empty': '暂无公开日程。',

  // 我的
  'me.title': '我的',
  'me.loginSubtitle': '用报名时的邮箱登录，就能看到你所有的报名记录和电子票。无需注册、无需密码。',
  'me.email': '邮箱',
  'me.emailPlaceholder': 'your@email.com',
  'me.resend': '重新发送',
  'me.sendCode': '发验证码',
  'me.code': '验证码',
  'me.codePlaceholder': '6 位数字',
  'me.login': '登录',
  'me.invalidEmail': '请输入有效邮箱',
  'me.devCodeAutofill': '本地开发模式：验证码 {code} 已自动填入',
  'me.codeSent': '验证码已发送到邮箱',
  'me.sendFailed': '发送失败',
  'me.loginSuccess': '登录成功',
  'me.verifyFailed': '验证失败',
  'me.myRegistrations': '我的报名',
  'me.logout': '退出',
  'me.noRegistrationsYet': '这个邮箱还没有报名记录',
  'me.browseEvents': '去看看有什么活动 →',
  'me.upcoming': '即将参加',
  'me.past': '已结束',
  'me.myEntryCode': '我的入场码',
  'me.entryCodeHint': '一码通用：所有报名过的活动都能凭它入场',
  'me.collapse': '收起',
  'me.show': '出示',
  'me.entryCodeAlt': '个人入场码',
  'me.entryCodeShowStaffHint': '向工作人员出示此码完成签到',
  'me.getEntryCodeFailed': '获取个人码失败',
  'me.myBookmarks': '我的收藏',
  'me.staffTag': '工作人员',
  'me.speakerTag': '嘉宾',
  'me.checkedIn': '已入场',
  'me.eTicket': '电子票',
  'me.staffCheckinConsole': '工作人员核销台',
  'me.writeFeedback': '写反馈',
  'me.statusApproved': '已确认',
  'me.statusPending': '审核中',
  'me.statusRejected': '未通过',
  'me.statusCancelled': '已取消',

  // 通知
  'notifications.title': '通知',
  'notifications.loginHint': '登录后可以收到审核结果和活动公告通知',
  'notifications.goLogin': '去登录 →',
  'notifications.empty': '还没有通知',

  // 电子票
  'ticket.eTicket': '电子票',
  'ticket.invalidTicket': '票码无效或已失效',
  'ticket.backToEvents': '返回活动列表',
  'ticket.checkedIn': '已入场',
  'ticket.showQrHint': '入场时向工作人员出示此二维码',
  'ticket.shortCodeHint': '扫码不便时报短码：',
  'ticket.underReview': '报名审核中，通过后此页面会显示入场二维码',
  'ticket.notApprovedOrCancelled': '报名未通过或已取消',
  'ticket.viewEventDetail': '查看活动详情 →',
  'ticket.qrAlt': '入场二维码',

  // 工作人员核销台
  'staffCheckin.loginRequired': '请先在「我的」页面用邮箱登录，再打开核销台。',
  'staffCheckin.noPermission': '没有权限',
  'staffCheckin.loadFailed': '加载失败，请重试',
  'staffCheckin.goLogin': '去登录',
  'staffCheckin.backToMe': '返回我的',
  'staffCheckin.consoleLabel': '工作人员核销台',

  // 现场核销台
  'checkin.title': '现场签到',
  'checkin.subtitle': '扫参会者电子票二维码，或输入票面短码',
  'checkin.checkedInOf': '已入场',
  'checkin.success': '核销成功',
  'checkin.duplicate': '重复核销',
  'checkin.notAllowed': '不可入场',
  'checkin.wrongTicket': '票不对',
  'checkin.invalidTicket': '无效票',
  'checkin.welcome': '欢迎入场',
  'checkin.type': '类型：{type}',
  'checkin.networkError': '网络异常，请重试',
  'checkin.closeCamera': '关闭相机',
  'checkin.openCamera': '开启相机扫码',
  'checkin.cameraPermissionDenied': '相机权限被拒绝，请在浏览器设置里允许，或改用短码输入',
  'checkin.cameraStartFailed': '相机启动失败，请改用短码输入',
  'checkin.shortCodePlaceholder': '输入票面 8 位短码',
  'checkin.submit': '核销',
  'checkin.recentRecords': '本机核销记录',

  // 反馈（前台）
  'feedback.title': '活动反馈',
  'feedback.overallRating': '总体评分',
  'feedback.overallRatingHint': '你对这次活动的整体体验打几分？',
  'feedback.submitting': '提交中…',
  'feedback.submit': '提交反馈',
  'feedback.ratingRequired': '请先给出总体评分',
  'feedback.submitFailed': '提交失败',
  'feedback.submitSuccess': '反馈已提交，感谢你的支持',
  'feedback.loadFailed': '无法加载反馈表单',
  'feedback.networkError': '网络错误，请稍后重试',
  'feedback.pleaseLogin': '请先登录',
  'feedback.loginHint': '用报名时的邮箱登录后，才能填写活动反馈。',
  'feedback.unavailable': '暂时无法填写',
  'feedback.unavailableHint': '活动不存在或你还没有资格填写反馈',
  'feedback.backToRegistrations': '返回我的报名 →',
  'feedback.thankYou': '感谢你的反馈',
  'feedback.yourRating': '你的评分：',
  'feedback.starAriaLabel': '{n} 星',

  // Footer
  'footer.sitemap': '站点地图',
  'footer.company': '公司',
  'footer.about': '关于我们',
  'footer.contact': '联系我们',
  'footer.legal': '法律',
  'footer.terms': '服务条款',
  'footer.privacy': '隐私政策',
  'footer.commercial': '特定商业交易法标注',
  'footer.rights': '© 2026 WAIC Side Events',

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

  // 后台：功能开关页（EventFeaturesPage，反馈点名过中英混排）
  'admin.eventFeaturesPage.loading': '加载中…',
  'admin.eventFeaturesPage.loadFailed': '加载失败',
  'admin.eventFeaturesPage.save': '保存',
  'admin.eventFeaturesPage.saveSuccess': '保存成功',
  'admin.eventFeaturesPage.saveFailed': '保存失败',
  'admin.eventFeaturesPage.featureToggles': '功能开关',
  'admin.eventFeaturesPage.enableTickets': '启用票务',
  'admin.eventFeaturesPage.enableTicketsDesc': '开启后参与者可选择票种报名',
  'admin.eventFeaturesPage.enableMeetings': '启用会议预约',
  'admin.eventFeaturesPage.enableMeetingsDesc': '允许参与者预约 1:1 会议',
  'admin.eventFeaturesPage.enableChat': '启用聊天',
  'admin.eventFeaturesPage.enableChatDesc': '活动内参与者可互相聊天',
  'admin.eventFeaturesPage.enableSideEvents': '启用周边活动',
  'admin.eventFeaturesPage.enableSideEventsDesc': '显示并管理子活动/边会',
  'admin.eventFeaturesPage.requiresApproval': '报名需审批',
  'admin.eventFeaturesPage.requiresApprovalDesc': '新报名默认待审批，需手动确认',
  'admin.eventFeaturesPage.registrationLimits': '报名限制',
  'admin.eventFeaturesPage.maxParticipants': '最大参与人数（空表示不限）',
  'admin.eventFeaturesPage.participantVisibility': '参与者名单可见性',
  'admin.eventFeaturesPage.visibilityPublic': '公开',
  'admin.eventFeaturesPage.visibilityApprovedOnly': '仅已确认者可见',
  'admin.eventFeaturesPage.visibilityPrivate': '仅组织者可见',
}

const en: Record<string, string> = {
  // Nav / common
  'nav.events': 'Events',
  'nav.schedules': 'Schedule',
  'nav.map': 'Map',
  'nav.me': 'Me',
  'nav.createEvent': 'Create Event',
  'nav.publishEvent': 'Host an Event',
  'nav.signUpLogin': 'Sign up / Log in',
  'nav.logout': 'Log out',
  'nav.managedEvents': 'My Events',
  'nav.notifications': 'Notifications',
  'common.online': 'Online',
  'common.offline': 'In-person',
  'common.hybrid': 'Hybrid',
  'common.showMore': 'Show more',
  'common.showLess': 'Show less',
  'common.notFound': 'Not found',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.create': 'Create',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.search': 'Search',
  'common.loading': 'Loading…',
  'common.notInSlice': 'This feature is not available yet.',
  'common.required': 'Required',
  'common.optional': 'Optional',
  'common.clearSearch': 'Clear search',
  'common.theme': 'Theme',
  'common.toggleTheme': 'Toggle light/dark theme',

  // Events list
  'events.title': 'Events',
  'events.pickup': 'Featured',
  'events.upcoming': 'Upcoming',
  'events.past': 'Past',
  'events.count': '{n} events',
  'events.emptyUpcoming': 'No upcoming events right now',
  'events.emptyPast': 'No past events yet',
  'events.mapView': 'Map view',
  'events.back': 'Back to events',
  'events.notFound': 'Event not found',
  'events.backToList': '← Back to events',
  'events.heroTitle': 'Where AI is gathering this week',
  'events.heroSubtitle': 'All the meetups, demo days, summits, and night socials around WAIC, browse and RSVP in one place.',
  'events.clearAllFilters': 'Clear all filters',
  'events.sessionsCount': '{n} sessions',
  'events.mapEntry': 'Map',

  // Filters
  'filter.keyword': 'Keyword',
  'filter.searchEvents': 'Search events…',
  'filter.tag': 'Tag',

  // DateStrip
  'dateStrip.all': 'All',
  'dateStrip.today': 'Today',

  // EventCard
  'card.live': 'Live now',
  'card.upcomingSoon': 'Starting soon',

  // Event detail
  'detail.addToCalendar': 'Add to calendar',
  'detail.organizers': 'Organizers',
  'detail.organizerFallback': 'Organizer',
  'detail.timetable': 'Timetable',
  'detail.sessions': '{n} sessions',
  'detail.speakers': 'Speakers',
  'detail.showAllSpeakers': 'View all {n} speakers',
  'detail.noDescription': 'No description yet.',
  'detail.ended': 'Event ended',
  'detail.alreadyRegistered': 'Registered ✓',
  'detail.registerNow': 'RSVP now',
  'detail.enterOnlineVenue': 'Join online venue',
  'detail.navigate': 'Directions',
  'detail.limitedTo': 'Limited to {n}',
  'detail.requiresApproval': 'Registration needs organizer approval',
  'detail.registerTitle': 'RSVP',
  'detail.registerHintApproval': 'Awaiting organizer approval; your e-ticket follows once approved',
  'detail.registerHintFree': 'Free to join, your e-ticket arrives by email',
  'detail.registerDialogTitle': 'RSVP · {title}',
  'detail.registrationSuccess': 'You’re in',
  'detail.registrationPendingReview': 'Submitted, awaiting review',
  'detail.confirmationEmailSent': 'Confirmation sent. Show the e-ticket in your email at the door.',
  'detail.pendingReviewNotice': 'We’ll email you once it’s approved, with your e-ticket attached.',
  'detail.viewTicket': 'View e-ticket',
  'detail.close': 'Close',
  'detail.name': 'Name',
  'detail.email': 'Email',
  'detail.ticketEmailHint': 'Your e-ticket and event updates go to this address',
  'detail.showInParticipantList': 'Show my name in the "Who’s coming" list',
  'detail.submitting': 'Submitting…',
  'detail.confirmRegistration': 'Confirm RSVP',
  'detail.fillSurveyRequired': 'Please complete the registration form',
  'detail.alreadyRegisteredError': 'This email has already registered for this event',
  'detail.soldOut': 'Sold out',
  'detail.registerFailed': 'Registration failed, please try again',
  'detail.registerFailedGeneric': 'Registration failed',

  // Participants / organizers
  'participants.title': 'Who’s coming',
  'participants.confirmed': '{n} confirmed',
  'participants.approvedOnlyHint': 'Attendee list unlocks once you’re approved',
  'participants.hiddenByChoice': 'Attendees chose to stay private',
  'participants.speakerTag': 'Speaker',
  'participants.moreCount': '+{n} more',

  // EventActions
  'actions.bookmark': 'Save',
  'actions.unbookmark': 'Unsave',
  'actions.share': 'Share',
  'actions.loginToBookmark': 'Log in to save events',
  'actions.goLogin': 'Log in',
  'actions.bookmarkedHint': 'Saved, find it under "Me"',
  'actions.unbookmarkedHint': 'Removed from saved',
  'actions.actionFailed': 'Something went wrong, please try again',
  'actions.linkCopied': 'Link copied, go share it with friends',
  'actions.copyFailed': 'Copy failed, please copy the address bar link manually',

  // Map
  'map.viewEvent': 'View event →',
  'map.title': 'Event Map',
  'map.subtitle': 'See how far each event is from you',
  'map.listEntry': 'List',
  'map.loadFailed': 'Failed to load the map',

  // Schedules
  'schedules.title': 'Full Schedule',
  'schedules.subtitle': 'Every public session across all side events, sorted by date and time so you can plan each day.',
  'schedules.empty': 'No public sessions yet.',

  // Me
  'me.title': 'Me',
  'me.loginSubtitle': 'Log in with the email you registered with to see all your RSVPs and e-tickets. No signup, no password.',
  'me.email': 'Email',
  'me.emailPlaceholder': 'your@email.com',
  'me.resend': 'Resend',
  'me.sendCode': 'Send code',
  'me.code': 'Code',
  'me.codePlaceholder': '6-digit code',
  'me.login': 'Log in',
  'me.invalidEmail': 'Please enter a valid email',
  'me.devCodeAutofill': 'Dev mode: code {code} was auto-filled',
  'me.codeSent': 'Code sent to your email',
  'me.sendFailed': 'Failed to send',
  'me.loginSuccess': 'Logged in',
  'me.verifyFailed': 'Verification failed',
  'me.myRegistrations': 'My RSVPs',
  'me.logout': 'Log out',
  'me.noRegistrationsYet': 'No RSVPs yet for this email',
  'me.browseEvents': 'Browse events →',
  'me.upcoming': 'Upcoming',
  'me.past': 'Past',
  'me.myEntryCode': 'My entry code',
  'me.entryCodeHint': 'One code for every event you’ve registered for',
  'me.collapse': 'Hide',
  'me.show': 'Show',
  'me.entryCodeAlt': 'Personal entry code',
  'me.entryCodeShowStaffHint': 'Show this to staff to check in',
  'me.getEntryCodeFailed': 'Failed to get your entry code',
  'me.myBookmarks': 'Saved events',
  'me.staffTag': 'Staff',
  'me.speakerTag': 'Speaker',
  'me.checkedIn': 'Checked in',
  'me.eTicket': 'E-ticket',
  'me.staffCheckinConsole': 'Staff check-in console',
  'me.writeFeedback': 'Leave feedback',
  'me.statusApproved': 'Confirmed',
  'me.statusPending': 'Under review',
  'me.statusRejected': 'Not approved',
  'me.statusCancelled': 'Cancelled',

  // Notifications
  'notifications.title': 'Notifications',
  'notifications.loginHint': 'Log in to receive review results and event announcements',
  'notifications.goLogin': 'Log in →',
  'notifications.empty': 'No notifications yet',

  // Ticket
  'ticket.eTicket': 'E-ticket',
  'ticket.invalidTicket': 'This ticket is invalid or expired',
  'ticket.backToEvents': 'Back to events',
  'ticket.checkedIn': 'Checked in',
  'ticket.showQrHint': 'Show this QR code to staff at the door',
  'ticket.shortCodeHint': 'If scanning isn’t possible, use the short code:',
  'ticket.underReview': 'Your registration is under review; the entry QR code will appear here once approved',
  'ticket.notApprovedOrCancelled': 'Registration was not approved or has been cancelled',
  'ticket.viewEventDetail': 'View event details →',
  'ticket.qrAlt': 'Entry QR code',

  // Staff check-in
  'staffCheckin.loginRequired': 'Log in with your email under "Me" first, then open the check-in console.',
  'staffCheckin.noPermission': 'No permission',
  'staffCheckin.loadFailed': 'Failed to load, please try again',
  'staffCheckin.goLogin': 'Log in',
  'staffCheckin.backToMe': 'Back to Me',
  'staffCheckin.consoleLabel': 'Staff check-in console',

  // Check-in console
  'checkin.title': 'On-site check-in',
  'checkin.subtitle': 'Scan an attendee’s e-ticket QR code, or enter the short code',
  'checkin.checkedInOf': 'checked in',
  'checkin.success': 'Checked in',
  'checkin.duplicate': 'Already checked in',
  'checkin.notAllowed': 'Not eligible',
  'checkin.wrongTicket': 'Wrong event',
  'checkin.invalidTicket': 'Invalid ticket',
  'checkin.welcome': 'Welcome',
  'checkin.type': 'Type: {type}',
  'checkin.networkError': 'Network error, please try again',
  'checkin.closeCamera': 'Close camera',
  'checkin.openCamera': 'Start camera scan',
  'checkin.cameraPermissionDenied': 'Camera access denied, allow it in your browser settings, or use the short code instead',
  'checkin.cameraStartFailed': 'Couldn’t start the camera, use the short code instead',
  'checkin.shortCodePlaceholder': 'Enter the 8-character short code',
  'checkin.submit': 'Check in',
  'checkin.recentRecords': 'Recent check-ins on this device',

  // Feedback (public)
  'feedback.title': 'Event Feedback',
  'feedback.overallRating': 'Overall rating',
  'feedback.overallRatingHint': 'How was your overall experience at this event?',
  'feedback.submitting': 'Submitting…',
  'feedback.submit': 'Submit feedback',
  'feedback.ratingRequired': 'Please give an overall rating first',
  'feedback.submitFailed': 'Submission failed',
  'feedback.submitSuccess': 'Feedback submitted, thanks for your support',
  'feedback.loadFailed': 'Couldn’t load the feedback form',
  'feedback.networkError': 'Network error, please try again later',
  'feedback.pleaseLogin': 'Please log in first',
  'feedback.loginHint': 'Log in with the email you registered with to leave feedback.',
  'feedback.unavailable': 'Not available right now',
  'feedback.unavailableHint': 'This event doesn’t exist, or you’re not eligible to leave feedback',
  'feedback.backToRegistrations': 'Back to my RSVPs →',
  'feedback.thankYou': 'Thanks for your feedback',
  'feedback.yourRating': 'Your rating: ',
  'feedback.starAriaLabel': '{n} stars',

  // Footer
  'footer.sitemap': 'Sitemap',
  'footer.company': 'Company',
  'footer.about': 'About us',
  'footer.contact': 'Contact us',
  'footer.legal': 'Legal',
  'footer.terms': 'Terms of service',
  'footer.privacy': 'Privacy policy',
  'footer.commercial': 'Commercial Transactions Act notice',
  'footer.rights': '© 2026 WAIC Side Events',

  // Admin
  'admin.dashboard': 'Overview',
  'admin.participants': 'Participants',
  'admin.tickets': 'Tickets',
  'admin.payments': 'Payments',
  'admin.surveys': 'Registration form',
  'admin.speakers': 'Speakers',
  'admin.announcements': 'Announcements',
  'admin.feedback': 'Feedback',
  'admin.eventSettings': 'Event settings',
  'admin.eventFeatures': 'Feature toggles',
  'admin.pageDesign': 'Page design',
  'admin.timetable': 'Timetable',
  'admin.stages': 'Stages',
  'admin.sessions': 'Sessions',
  'admin.staff': 'Staff',
  'admin.meetings': 'Meetings',
  'admin.chat': 'Chat',
  'admin.publicPage': 'Public page',
  'admin.noEvents': 'You haven’t created any events yet',
  'admin.createFirstEvent': 'Create your first event',

  // Admin: Event Features page
  'admin.eventFeaturesPage.loading': 'Loading…',
  'admin.eventFeaturesPage.loadFailed': 'Failed to load',
  'admin.eventFeaturesPage.save': 'Save',
  'admin.eventFeaturesPage.saveSuccess': 'Saved',
  'admin.eventFeaturesPage.saveFailed': 'Save failed',
  'admin.eventFeaturesPage.featureToggles': 'Feature toggles',
  'admin.eventFeaturesPage.enableTickets': 'Enable ticketing',
  'admin.eventFeaturesPage.enableTicketsDesc': 'Let attendees pick a ticket type when registering',
  'admin.eventFeaturesPage.enableMeetings': 'Enable meeting booking',
  'admin.eventFeaturesPage.enableMeetingsDesc': 'Allow attendees to book 1:1 meetings',
  'admin.eventFeaturesPage.enableChat': 'Enable chat',
  'admin.eventFeaturesPage.enableChatDesc': 'Let attendees chat with each other in the event',
  'admin.eventFeaturesPage.enableSideEvents': 'Enable side events',
  'admin.eventFeaturesPage.enableSideEventsDesc': 'Show and manage sub-events/side sessions',
  'admin.eventFeaturesPage.requiresApproval': 'Require approval to register',
  'admin.eventFeaturesPage.requiresApprovalDesc': 'New registrations default to pending, need manual approval',
  'admin.eventFeaturesPage.registrationLimits': 'Registration limits',
  'admin.eventFeaturesPage.maxParticipants': 'Max participants (leave blank for unlimited)',
  'admin.eventFeaturesPage.participantVisibility': 'Participant list visibility',
  'admin.eventFeaturesPage.visibilityPublic': 'Public',
  'admin.eventFeaturesPage.visibilityApprovedOnly': 'Approved attendees only',
  'admin.eventFeaturesPage.visibilityPrivate': 'Organizers only',
}

const DICTS: Record<Locale, Record<string, string>> = { zh, en }

interface Ctx {
  t: (key: string, vars?: Record<string, string | number>) => string
  locale: Locale
  setLocale: (l: Locale) => void
}
const LocaleCtx = createContext<Ctx>({ t: (k) => k, locale: 'zh', setLocale: () => {} })

function readInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem('locale')
    if (saved === 'zh' || saved === 'en') return saved
  } catch {}
  return 'zh'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem('locale', l)
    } catch {}
  }

  const t = (key: string, vars?: Record<string, string | number>) =>
    interpolate(DICTS[locale][key] ?? DICTS.zh[key] ?? key, vars)

  return <LocaleCtx.Provider value={{ t, locale, setLocale }}>{children}</LocaleCtx.Provider>
}

export const useI18n = () => useContext(LocaleCtx)
