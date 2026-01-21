// Identity模块类型定义

export interface User {
  id: number
  username: string
  email?: string
  real_name?: string
  phone?: string
  status: 'ACTIVE' | 'DISABLED'
  last_login_at?: string | null
  gmt_create: string
  gmt_modified: string
}

export interface Role {
  id: number
  name: string
  display_name: string
  description?: string
  gmt_create: string
  gmt_modified: string
  permissions?: Permission[] | null
}

export interface Permission {
  id: number
  name: string
  code: string
  module: string
  description?: string
  status: 'ACTIVE' | 'DISABLED'
  gmt_create: string
  gmt_modified: string
}

export interface MenuItem {
  id: number
  title: string
  title_en?: string | null
  code: string
  path?: string | null
  component?: string | null
  icon?: string
  parent_id?: number | null
  sort?: number
  is_hidden?: number
  permission_code?: string | null
  status?: string
  children?: MenuItem[]
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  roles: Role[]
  permissions: Permission[]
  access_token: string
}
