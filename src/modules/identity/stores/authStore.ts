import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '../api/auth'
import type { LoginParams, User, Role, Permission } from '../types'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const roles = ref<Role[]>([])
  const isLoggedIn = computed(() => !!user.value)

  // 从localStorage恢复状态
  const restoreFromStorage = () => {
    const savedUser = localStorage.getItem('user')
    const savedPermissions = localStorage.getItem('permissions')
    const savedRoles = localStorage.getItem('roles')

    if (savedUser) {
      user.value = JSON.parse(savedUser)
    }
    if (savedPermissions) {
      permissions.value = JSON.parse(savedPermissions)
    }
    if (savedRoles) {
      roles.value = JSON.parse(savedRoles)
    }
  }

  // 登录
  const login = async (params: LoginParams) => {
    try {
      const res = await loginApi(params)

      if (res.success) {
        const payload = res.data || {}

        // 直接使用后端返回的数据
        user.value = payload.user
        roles.value = payload.roles || []

        // 提取权限码列表
        const rawPermissions = payload.permissions || []
        permissions.value = extractPermissionCodes(rawPermissions)

        // 保存到localStorage
        if (payload.access_token) {
          localStorage.setItem('token', payload.access_token)
        }
        localStorage.setItem('user', JSON.stringify(user.value))
        localStorage.setItem('permissions', JSON.stringify(permissions.value))
        localStorage.setItem('roles', JSON.stringify(roles.value))

        ElMessage.success('Login successful')
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  // 登出
  const logout = async () => {
    await logoutApi()
    user.value = null
    permissions.value = []
    roles.value = []
    localStorage.removeItem('user')
    localStorage.removeItem('permissions')
    localStorage.removeItem('roles')
    localStorage.removeItem('token')
  }

  // 检查权限
  const hasPermission = (permissionCode: string) => {
    // admin 角色拥有所有权限
    if (roles.value.some((role) => role.name === 'admin')) {
      return true
    }
    return permissions.value.includes(permissionCode)
  }

  // 检查角色
  const hasRole = (roleName: string) => {
    return roles.value.some((role) => role.name === roleName)
  }

  // 初始化时恢复状态
  restoreFromStorage()

  return {
    user,
    permissions,
    roles,
    isLoggedIn,
    login,
    logout,
    hasPermission,
    hasRole
  }
})

// 从权限对象数组中提取权限码
const extractPermissionCodes = (permissions: Permission[] | string[]): string[] => {
  const codes: string[] = []
  permissions.forEach((perm) => {
    if (typeof perm === 'string') {
      codes.push(perm)
    } else if (perm?.code) {
      codes.push(perm.code)
    }
  })
  return codes
}
