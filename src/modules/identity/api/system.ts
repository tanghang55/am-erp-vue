import request from '@/utils/request'
import type {
  User,
  Role,
  Permission,
  MenuItem,
  IntegrationProviderSummary,
  IntegrationAuthorization,
  IntegrationSKUMapping,
  IntegrationSKUMappingStatus
} from '../types'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'

export interface UserListParams {
  page?: number
  page_size?: number
  status?: 'ACTIVE' | 'DISABLED'
  keyword?: string
}

export interface UserDetailResponse {
  user: User
  roles: Role[]
  permissions: Permission[]
}

export interface CreateUserPayload {
  username: string
  password: string
  real_name?: string
  email?: string
  phone?: string
  status?: 'ACTIVE' | 'DISABLED'
}

export interface UpdateUserPayload {
  password?: string
  real_name?: string
  email?: string
  phone?: string
  status?: 'ACTIVE' | 'DISABLED'
}

export function getUserList(params: UserListParams) {
  return request<ApiResponse<PaginatedResponse<User>>>({
    url: '/api/v1/identity/users',
    method: 'get',
    params
  })
}

export function getUserDetail(id: number) {
  return request<ApiResponse<UserDetailResponse>>({
    url: `/api/v1/identity/users/${id}`,
    method: 'get'
  })
}

export function createUser(data: CreateUserPayload) {
  return request<ApiResponse<User>>({
    url: '/api/v1/identity/users',
    method: 'post',
    data
  })
}

export function updateUser(id: number, data: UpdateUserPayload) {
  return request<ApiResponse<User>>({
    url: `/api/v1/identity/users/${id}`,
    method: 'put',
    data
  })
}

export function deleteUser(id: number) {
  return request<ApiResponse<null>>({
    url: `/api/v1/identity/users/${id}`,
    method: 'delete'
  })
}

export function assignUserRoles(userId: number, roleIds: number[]) {
  return request<ApiResponse<null>>({
    url: `/api/v1/identity/users/${userId}/roles`,
    method: 'post',
    data: { role_ids: roleIds }
  })
}

export function getMenuList() {
  return request<ApiResponse<MenuItem[]>>({
    url: '/api/v1/menus/tree',
    method: 'get'
  })
}

export function getRoleList() {
  return request<ApiResponse<Role[]>>({
    url: '/api/v1/identity/roles',
    method: 'get'
  })
}

export function getPermissionList() {
  return request<ApiResponse<Permission[]>>({
    url: '/api/v1/identity/permissions',
    method: 'get'
  })
}

export interface IntegrationAuthorizationListParams {
  page?: number
  page_size?: number
  provider_code?: string
  status?: string
}

export interface StartIntegrationAuthorizationPayload {
  provider_code: string
  account_alias?: string
}

export interface StartIntegrationAuthorizationResponse {
  authorization_id: number
  provider_code: string
  authorize_url: string
  oauth_state: string
  expire_at: string
}

export function getIntegrationProviderList() {
  return request<ApiResponse<IntegrationProviderSummary[]>>({
    url: '/api/v1/integrations/authorizations/providers',
    method: 'get'
  })
}

export function getIntegrationAuthorizationList(params: IntegrationAuthorizationListParams) {
  return request<ApiResponse<PaginatedResponse<IntegrationAuthorization>>>({
    url: '/api/v1/integrations/authorizations',
    method: 'get',
    params
  })
}

export function startIntegrationAuthorization(data: StartIntegrationAuthorizationPayload) {
  return request<ApiResponse<StartIntegrationAuthorizationResponse>>({
    url: '/api/v1/integrations/authorizations/start',
    method: 'post',
    data
  })
}

export function refreshIntegrationAuthorization(id: number) {
  return request<ApiResponse<IntegrationAuthorization>>({
    url: `/api/v1/integrations/authorizations/${id}/refresh`,
    method: 'post'
  })
}

export interface IntegrationSKUMappingListParams {
  page?: number
  page_size?: number
  provider_code?: string
  marketplace?: string
  status?: IntegrationSKUMappingStatus
  keyword?: string
  product_id?: number
}

export interface CreateIntegrationSKUMappingPayload {
  provider_code: string
  marketplace: string
  seller_sku: string
  product_id: number
  status?: IntegrationSKUMappingStatus
  remark?: string
}

export interface UpdateIntegrationSKUMappingPayload {
  product_id?: number
  status?: IntegrationSKUMappingStatus
  remark?: string
}

export interface ProductOption {
  id: number
  seller_sku: string
  title: string
  marketplace: string
}

export function getIntegrationSKUMappingList(params: IntegrationSKUMappingListParams) {
  return request<ApiResponse<PaginatedResponse<IntegrationSKUMapping>>>({
    url: '/api/v1/integrations/authorizations/sku-mappings',
    method: 'get',
    params
  })
}

export function createIntegrationSKUMapping(data: CreateIntegrationSKUMappingPayload) {
  return request<ApiResponse<IntegrationSKUMapping>>({
    url: '/api/v1/integrations/authorizations/sku-mappings',
    method: 'post',
    data
  })
}

export function updateIntegrationSKUMapping(id: number, data: UpdateIntegrationSKUMappingPayload) {
  return request<ApiResponse<IntegrationSKUMapping>>({
    url: `/api/v1/integrations/authorizations/sku-mappings/${id}`,
    method: 'put',
    data
  })
}

export function searchProductOptions(keyword: string) {
  return request<ApiResponse<PaginatedResponse<ProductOption>>>({
    url: '/api/v1/products',
    method: 'get',
    params: {
      page: 1,
      page_size: 20,
      keyword
    }
  })
}
