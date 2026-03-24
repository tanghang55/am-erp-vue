import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
import type {
  ProductCategory,
  ProductConfigItem,
  ProductConfigListParams,
  SaveProductCategoryParams,
  SaveProductConfigParams
} from '../types'

export function getProductConfigList(params: ProductConfigListParams) {
  return request<ApiResponse<PaginatedResponse<ProductConfigItem>>>({
    url: '/api/v1/product-configs',
    method: 'get',
    params
  })
}

export function createProductConfig(data: SaveProductConfigParams) {
  return request<ApiResponse<ProductConfigItem>>({
    url: '/api/v1/product-configs',
    method: 'post',
    data
  })
}

export function updateProductConfig(id: number, data: SaveProductConfigParams) {
  return request<ApiResponse<ProductConfigItem>>({
    url: `/api/v1/product-configs/${id}`,
    method: 'put',
    data
  })
}

export function deleteProductConfig(id: number) {
  return request<ApiResponse<null>>({
    url: `/api/v1/product-configs/${id}`,
    method: 'delete'
  })
}

export function getProductCategoryTree() {
  return request<ApiResponse<ProductCategory[]>>({
    url: '/api/v1/product-categories',
    method: 'get'
  })
}

export function createProductCategory(data: SaveProductCategoryParams) {
  return request<ApiResponse<ProductCategory>>({
    url: '/api/v1/product-categories',
    method: 'post',
    data
  })
}

export function updateProductCategory(id: number, data: SaveProductCategoryParams) {
  return request<ApiResponse<ProductCategory>>({
    url: `/api/v1/product-categories/${id}`,
    method: 'put',
    data
  })
}

export function deleteProductCategory(id: number) {
  return request<ApiResponse<null>>({
    url: `/api/v1/product-categories/${id}`,
    method: 'delete'
  })
}
