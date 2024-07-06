import type { ERole } from '~/enums/role.enum'
import type { ECommunityStatus } from '~/enums/community-status.enum'

export interface User {
  _id: string
  username: string
  full_name: string
  email: string
  avatar?: string
  phone: string
  bio?: string
  ref?: string
  roles?: string[]
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Level {
  id: string
  name: string
  point: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Community {
  _id: string
  name: string
  short_name: string
  status: (typeof ECommunityStatus)[keyof typeof ECommunityStatus]
  topic_id: string
  owner_id: string
  auto_pay_package?: boolean
  total_members: number
  total_admin: number
  introduce: string
  description: string
  package_code: string
  icon?: string
  thumbnail?: string
  slides?: {
    id: number
    name: string
    type: string
    ext: string
    url: string
    size: number
  }[]
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: string
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface IMetaPaginate {
  page: number
  take: number
  itemCount: number
  pageCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface IResponsePagination<T> {
  data: T[]
  meta: IMetaPaginate
}

export interface Role {
  _id: string
  name: (typeof ERole)[keyof typeof ERole]
}
