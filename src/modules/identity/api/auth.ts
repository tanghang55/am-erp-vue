import request from '@/utils/request'
import type { LoginParams } from '../types'
import type { ApiResponse } from '@/modules/common/types'

/**
 * 用户登录
 */
export function login(data: LoginParams) {
  return request<ApiResponse<any>>({
    url: '/api/v1/auth/login',
    method: 'post',
    data
  })
}

/**
 * 退出登录
 */
export function logout() {
  // 清除本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  return Promise.resolve()
}
