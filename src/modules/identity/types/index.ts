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
  roles?: Role[]
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

export interface IntegrationProviderSummary {
  code: string
  type: string
  display_name: string
}

export type IntegrationAuthorizationStatus = 'PENDING' | 'AUTHORIZED' | 'FAILED' | 'DISABLED'

export interface IntegrationAuthorization {
  id: number
  provider_code: string
  provider_type: string
  account_alias?: string | null
  seller_partner_id?: string | null
  status: IntegrationAuthorizationStatus
  access_token_expire_at?: string | null
  token_scope?: string | null
  last_authorized_at?: string | null
  last_refresh_at?: string | null
  refresh_fail_count?: number
  last_refresh_attempt_at?: string | null
  last_refresh_failed_at?: string | null
  last_error_message?: string | null
  created_by?: number | null
  updated_by?: number | null
  created_at: string
  updated_at: string
}

export type IntegrationSKUMappingStatus = 'ACTIVE' | 'DISABLED'

export interface IntegrationSKUMapping {
  id: number
  provider_code: string
  marketplace: string
  seller_sku: string
  product_id: number
  product_title?: string
  product_seller_sku?: string
  status: IntegrationSKUMappingStatus
  remark?: string | null
  created_by?: number | null
  updated_by?: number | null
  created_at: string
  updated_at: string
}
