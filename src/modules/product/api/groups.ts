import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
import type {
  AttachProductGroupChildrenParams,
  CreateProductGroupParams,
  ProductGroup,
  ProductGroupListParams
} from '../types'

export function getProductGroupList(params: ProductGroupListParams) {
  return request<ApiResponse<PaginatedResponse<ProductGroup>>>({
    url: '/api/v1/product-parents',
    method: 'get',
    params
  })
}

export function getProductGroupDetail(id: number) {
  return request<ApiResponse<ProductGroup>>({
    url: `/api/v1/product-parents/${id}`,
    method: 'get'
  })
}

export function createProductGroup(data: CreateProductGroupParams) {
  return request<ApiResponse<ProductGroup>>({
    url: '/api/v1/product-parents',
    method: 'post',
    data
  })
}

export function updateProductGroup(id: number, data: Partial<CreateProductGroupParams>) {
  return request<ApiResponse<ProductGroup>>({
    url: `/api/v1/product-parents/${id}`,
    method: 'put',
    data
  })
}

export function deleteProductGroup(id: number) {
  return request<ApiResponse<null>>({
    url: `/api/v1/product-parents/${id}`,
    method: 'delete'
  })
}

export function attachProductGroupChildren(id: number, data: AttachProductGroupChildrenParams) {
  return request<ApiResponse<ProductGroup>>({
    url: `/api/v1/product-parents/${id}/children`,
    method: 'post',
    data
  })
}

export function detachProductGroupChild(id: number, childId: number) {
  return request<ApiResponse<ProductGroup>>({
    url: `/api/v1/product-parents/${id}/children/${childId}`,
    method: 'delete'
  })
}
