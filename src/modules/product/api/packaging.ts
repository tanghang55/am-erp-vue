import request from '@/utils/request'
import type { ApiResponse } from '@/modules/common/types'
import type { ProductPackagingItem, SaveProductPackagingParams } from '../types'

export function getProductPackagingItems(productId: number) {
  return request<ApiResponse<ProductPackagingItem[]>>({
    url: `/api/v1/products/${productId}/packaging-items`,
    method: 'get'
  })
}

export function saveProductPackagingItems(productId: number, data: SaveProductPackagingParams) {
  return request<ApiResponse<ProductPackagingItem[]>>({
    url: `/api/v1/products/${productId}/packaging-items`,
    method: 'put',
    data
  })
}
