import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
import type { ComboUpsertParams, ProductCombo, ProductComboListParams } from '../types'

export function getProductComboList(params?: ProductComboListParams) {
  const { statuses, ...rest } = params || {}
  return request<ApiResponse<PaginatedResponse<ProductCombo>>>({
    url: '/api/v1/product-combos',
    method: 'get',
    params: {
      ...rest,
      statuses: statuses?.length ? statuses.join(',') : undefined
    }
  })
}

export function getProductComboDetail(id: number) {
  return request<ApiResponse<ProductCombo>>({
    url: `/api/v1/product-combos/${id}`,
    method: 'get'
  })
}

export function createProductCombo(data: ComboUpsertParams) {
  return request<ApiResponse<ProductCombo>>({
    url: '/api/v1/product-combos',
    method: 'post',
    data
  })
}

export function updateProductCombo(id: number, data: ComboUpsertParams) {
  return request<ApiResponse<ProductCombo>>({
    url: `/api/v1/product-combos/${id}`,
    method: 'put',
    data
  })
}

export function deleteProductCombo(id: number) {
  return request<ApiResponse<{ message: string }>>({
    url: `/api/v1/product-combos/${id}`,
    method: 'delete'
  })
}
