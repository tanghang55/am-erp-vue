/**
 * System Module API
 */

import request from '@/utils/request'
import type { ApiResponse } from '@/modules/common/types'
import type {
  FieldLabelListResponse,
  CreateFieldLabelRequest,
  UpdateFieldLabelRequest,
  MenuListResponse,
  CreateMenuRequest,
  UpdateMenuRequest,
  UpdateMenuStatusRequest
} from '../types'

const BASE_URL = '/api/v1/system'

/**
 * 获取标签配置列表
 */
export const getFieldLabelList = (params?: { keyword?: string; page?: number; page_size?: number }) =>
  request<ApiResponse<FieldLabelListResponse>>({
    url: `${BASE_URL}/field-labels/manage`,
    method: 'get',
    params
  })

/**
 * 新增标签配置
 */
export const createFieldLabel = (data: CreateFieldLabelRequest) =>
  request<ApiResponse<any>>({
    url: `${BASE_URL}/field-labels`,
    method: 'post',
    data
  })

/**
 * 更新标签配置
 */
export const updateFieldLabel = (id: number, data: UpdateFieldLabelRequest) =>
  request<ApiResponse<any>>({
    url: `${BASE_URL}/field-labels/${id}`,
    method: 'put',
    data
  })

/**
 * 删除标签配置
 */
export const deleteFieldLabel = (id: number) =>
  request<ApiResponse<any>>({
    url: `${BASE_URL}/field-labels/${id}`,
    method: 'delete'
  })

// ==================== Menu Management ====================

export const getMenuList = (params?: {
  page?: number
  page_size?: number
  keyword?: string
  status?: string
  is_hidden?: number
  parent_id?: number
}) =>
  request<ApiResponse<MenuListResponse>>({
    url: '/api/v1/menus',
    method: 'get',
    params
  })

export const createMenu = (data: CreateMenuRequest) =>
  request<ApiResponse<any>>({
    url: '/api/v1/menus',
    method: 'post',
    data
  })

export const updateMenu = (id: number, data: UpdateMenuRequest) =>
  request<ApiResponse<any>>({
    url: `/api/v1/menus/${id}`,
    method: 'put',
    data
  })

export const updateMenuStatus = (id: number, data: UpdateMenuStatusRequest) =>
  request<ApiResponse<any>>({
    url: `/api/v1/menus/${id}/status`,
    method: 'patch',
    data
  })

export const deleteMenu = (id: number) =>
  request<ApiResponse<any>>({
    url: `/api/v1/menus/${id}`,
    method: 'delete'
  })

export * from './logs'
export * from './monitor'
export * from './configCenter'
