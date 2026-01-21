import request from '@/utils/request'
import type { User, Role, Permission, MenuItem } from '../types'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'

// ==================== 用户管理接口 ====================

export interface UserListParams {
  page?: number
  page_size?: number
  status?: 'ACTIVE' | 'DISABLED'
  keyword?: string
}

/**
 * 获取用户列表
 */
export function getUserList(params: UserListParams) {
  return request<ApiResponse<PaginatedResponse<User>>>({
    url: '/api/v1/identity/users',
    method: 'get',
    params
  }).then((res) => mapPaginatedUsers(res))
}

/**
 * 获取用户详情
 */
export function getUserDetail(id: number) {
  return request<ApiResponse<{ user: User; roles: Role[]; permissions: Permission[] }>>({
    url: `/api/v1/identity/users/${id}`,
    method: 'get'
  }).then((res) => mapUserDetail(res))
}

/**
 * 创建用户
 */
export function createUser(data: Partial<User> & { password: string }) {
  return request<ApiResponse<User>>({
    url: '/api/v1/identity/users',
    method: 'post',
    data: mapUserPayload(data)
  }).then((res) => mapUserResponse(res))
}

/**
 * 更新用户
 */
export function updateUser(id: number, data: Partial<User>) {
  return request<ApiResponse<User>>({
    url: `/api/v1/identity/users/${id}`,
    method: 'put',
    data: mapUserPayload(data)
  }).then((res) => mapUserResponse(res))
}

/**
 * 删除用户（禁用）
 */
export function deleteUser(id: number) {
  return request<ApiResponse<{ message: string }>>({
    url: `/api/v1/identity/users/${id}`,
    method: 'delete'
  })
}

/**
 * 为用户分配角色
 */
export function assignUserRoles(userId: number, roleIds: number[]) {
  return request<ApiResponse<{ message: string }>>({
    url: `/api/v1/identity/users/${userId}/roles`,
    method: 'post',
    data: { role_ids: roleIds }
  })
}

// ==================== 菜单接口 ====================

/**
 * 获取菜单树
 */
export function getMenuList() {
  return request<ApiResponse<MenuItem[]>>({
    url: '/api/v1/menus/tree',
    method: 'get'
  })
}

// ==================== 角色接口 ====================

/**
 * 获取所有角色
 */
export function getRoleList() {
  return request<ApiResponse<Role[]>>({
    url: '/api/v1/identity/roles',
    method: 'get'
  })
}

// ==================== 权限接口 ====================

/**
 * 获取所有权限
 */
export function getPermissionList() {
  return request<ApiResponse<Permission[]>>({
    url: '/api/v1/identity/permissions',
    method: 'get'
  })
}

const mapUserPayload = (data: Partial<User> & { password?: string }) => {
  const payload: Record<string, any> = { ...data }
  if ('real_name' in payload) {
    payload.name = payload.real_name
    delete payload.real_name
  }
  return payload
}

const mapUser = (user: any): User => ({
  ...user,
  real_name: user.real_name || user.name,
  last_login_at: user.last_login_at ?? undefined,
  last_login_ip: user.last_login_ip ?? undefined
})

const mapRole = (role: any): Role => ({
  id: role.id,
  name: role.code || role.name,
  display_name: role.name || role.code,
  description: role.description,
  status: role.status,
  created_at: role.created_at,
  updated_at: role.updated_at
})

const mapPermission = (permission: any): Permission => ({
  id: permission.id,
  name: permission.code || permission.name,
  display_name: permission.name || permission.code,
  description: permission.description,
  module: permission.module,
  created_at: permission.created_at,
  updated_at: permission.updated_at
})

const mapPaginatedUsers = (res: ApiResponse<PaginatedResponse<User>>) => {
  if (res?.success && res.data?.data) {
    res.data.data = res.data.data.map((user) => mapUser(user as any)) as any
  }
  return res
}

const mapUserDetail = (res: ApiResponse<any>) => {
  if (res?.success && res.data) {
    const user = mapUser(res.data)
    const roles = (res.data.roles || user.roles || []).map(mapRole)
    const permissions = collectPermissions(res.data.roles || user.roles || [])
    res.data = { user, roles, permissions }
  }
  return res
}

const mapUserResponse = (res: ApiResponse<User>) => {
  if (res?.success && res.data) {
    res.data = mapUser(res.data)
  }
  return res
}

const collectPermissions = (roles: any[]) => {
  const map = new Map<number, Permission>()
  roles.forEach((role) => {
    ;(role.permissions || []).forEach((permission: any) => {
      const normalized = mapPermission(permission)
      if (!map.has(normalized.id)) {
        map.set(normalized.id, normalized)
      }
    })
  })
  return Array.from(map.values())
}
