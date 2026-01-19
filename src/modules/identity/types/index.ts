// Identity模块类型定义

export interface User {
  id: number
  username: string
  email?: string
  real_name?: string
  phone?: string
  status: 'ACTIVE' | 'DISABLED'
  last_login_at?: string
  last_login_ip?: string
  created_at: string
  updated_at: string
}

export interface Role {
  id: number
  name: string
  display_name: string
  description?: string
  status: 'ACTIVE' | 'DISABLED'
  created_at: string
  updated_at: string
}

export interface Permission {
  id: number
  name: string
  display_name: string
  description?: string
  module: string
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: number
  title: string
  title_en?: string | null
  code: string
  path?: string | null
  icon?: string
  parent_id?: number | null
  sort?: number
  status: 'ACTIVE' | 'DISABLED'
  children?: MenuItem[]
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  user: {
    id: number
    username: string
    real_name?: string
    email?: string
  }
  roles: Role[]
  permissions: string[]
}

export interface AuditLog {
  id: number
  trace_id?: string | null
  user_id?: number | null
  username?: string | null
  module: string
  action: string
  entity_type?: string | null
  entity_id?: string | null
  changes?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
  updated_at: string
}

export interface AuditLogQueryParams {
  page?: number
  page_size?: number
  module?: string
  action?: string
  user_id?: number
  username?: string
  entity_type?: string
  entity_id?: string
  keyword?: string
  date_from?: string
  date_to?: string
}
