// 类型对齐 api.4s.link 真实 Event(见 capture/4s-auth/contracts/DATA-MODEL.md)。
export interface Schedule {
  date: string // YYYY-MM-DD (JST wall-clock)
  startTime: string // HH:mm
  endTime: string
}

export interface CustomStyle {
  theme?: 'light' | 'dark' | string
  textColor?: string
  textSubColor?: string
  primaryColor?: string
  titleTextColor?: string
  backgroundColor?: string
  primaryButtonLabelColor?: string
}

export interface EventLocation {
  title?: string
  displayText?: string
  city?: string
  state?: string
  country?: string
  geo?: { lat: number; lng: number }
  googleMapsURI?: string
}

export interface EventItem {
  id: string
  slug: string
  title: string
  catchphrase: string | null
  eventType: 'ONSITE' | 'ONLINE' | string
  state: string
  timezone: string
  schedules: Schedule[]
  location: EventLocation[] | null
  thumbnailUrl: string | null
  mainImageUrl: string | null
  tags: string[]
  featured: boolean
  enabledTickets: boolean
  enabledMeetings: boolean
  maxParticipants: number | null
  requiresApproval: boolean
  participantListVisibility: string
  // 详情独有
  description?: string
  customStyle?: CustomStyle | null
  organizers?: any[]
  organizerContact?: { url: string; label: string }[]
  stages?: any[]
  sessions?: any[]
  speakers?: any[]
  announcements?: any[]
  surveySchema?: any[]
  createdBy?: any
  hasEnded?: boolean
}

export interface PageInfo {
  totalCount: number
  totalPages: number
  page: number
  perPage: number
}

export interface EventsResponse {
  events: EventItem[]
  pageInfo: PageInfo
}

export interface TagUsage {
  groups: { entity: string; category: string | null; tags: { name: string; count: number }[] }[]
}

