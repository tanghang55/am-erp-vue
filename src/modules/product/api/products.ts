import request from '@/utils/request'
import type { AuditLog } from '@/modules/system/types'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
import type {
  CreateProductParams,
  ProductListParams,
  ProductSummary
} from '../types'

export function getProductList(params: ProductListParams) {
  const { statuses, ...rest } = params
  return request<ApiResponse<PaginatedResponse<ProductSummary>>>({
    url: '/api/v1/products',
    method: 'get',
    params: {
      ...rest,
      statuses: statuses?.length ? statuses.join(',') : undefined
    }
  })
}

export function getProductDetail(id: number) {
  return request<ApiResponse<ProductSummary>>({
    url: `/api/v1/products/${id}`,
    method: 'get'
  })
}

export function createProduct(data: CreateProductParams) {
  return request<ApiResponse<ProductSummary>>({
    url: '/api/v1/products',
    method: 'post',
    data
  })
}

export function updateProduct(id: number, data: Partial<CreateProductParams>) {
  return request<ApiResponse<ProductSummary>>({
    url: `/api/v1/products/${id}`,
    method: 'put',
    data
  })
}

export function deleteProduct(id: number) {
  return request<ApiResponse<{ message: string }>>({
    url: `/api/v1/products/${id}`,
    method: 'delete'
  })
}

export function getProductAuditLogs(productId: number, page = 1, pageSize = 10) {
  return request<ApiResponse<PaginatedResponse<AuditLog>>>({
    url: '/api/v1/system/logs',
    method: 'get',
    params: {
      entity_type: 'Product',
      entity_id: String(productId),
      page,
      page_size: pageSize
    }
  })
}
