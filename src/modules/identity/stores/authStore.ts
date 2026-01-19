import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '../api/auth'
import type { LoginParams } from '../types'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<any>(null)
  const permissions = ref<string[]>([])
  const roles = ref<any[]>([])
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
        const rawUser = payload.user || {}
        const rawRoles = rawUser.roles || payload.roles || []
        const normalizedRoles = rawRoles.map((role: any) => ({
          id: role.id,
          name: role.code || role.name,
          display_name: role.name || role.code,
          description: role.description,
          status: role.status,
          created_at: role.created_at,
          updated_at: role.updated_at,
          permissions: role.permissions || []
        }))

        user.value = {
          ...rawUser,
          real_name: rawUser.real_name || rawUser.name
        }
        roles.value = normalizedRoles
        permissions.value = normalizePermissions(normalizedRoles)

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
  const hasPermission = (permissionName: string) => {
    return permissions.value.includes(permissionName)
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

const normalizePermissions = (roles: any[]) => {
  const set = new Set<string>()
  roles.forEach((role) => {
    const perms = role.permissions || []
    perms.forEach((perm: any) => {
      if (perm?.code) {
        set.add(perm.code)
      } else if (typeof perm === 'string') {
        set.add(perm)
      }
    })
  })
  return Array.from(set)
}
