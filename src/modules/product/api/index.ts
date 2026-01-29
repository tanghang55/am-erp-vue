import request from '@/utils/request'
import type {
  Sku,
  SkuListParams,
  CreateSkuParams,
  ProductParent,
  ProductParentListParams,
  CreateProductParentParams,
  ProductCombo,
  ComboUpsertParams,
  ProductImageUrl,
  ProductPackagingItem,
  SaveProductPackagingParams
} from '../types'
import type { AuditLog } from '@/modules/system/types'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'

/**
 * 获取SKU列表
 */
export function getSkuList(params: SkuListParams) {
  return request<ApiResponse<PaginatedResponse<Sku>>>({
    url: '/api/v1/products',
    method: 'get',
    params
  })
}

/**
 * 获取SKU详情
 */
export function getSkuDetail(id: number) {
  return request<ApiResponse<Sku>>({
    url: `/api/v1/products/${id}`,
    method: 'get'
  })
}

/**
 * 创建SKU
 */
export function createSku(data: CreateSkuParams) {
  return request<ApiResponse<Sku>>({
    url: '/api/v1/products',
    method: 'post',
    data
  })
}

/**
 * 更新SKU
 */
export function updateSku(id: number, data: Partial<CreateSkuParams>) {
  return request<ApiResponse<Sku>>({
    url: `/api/v1/products/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除SKU
 */
export function deleteSku(id: number) {
  return request<ApiResponse<{ message: string }>>({
    url: `/api/v1/products/${id}`,
    method: 'delete'
  })
}

/**
 * 获取SKU图片列表
 */
export function getSkuImageList(id: number) {
  return request<ApiResponse<ProductImageUrl[]>>({
    url: `/api/v1/products/${id}/images`,
    method: 'get'
  })
}

/**
 * 保存SKU图片排序
 */
export function saveSkuImageOrder(id: number, imageUrls: string[]) {
  return request<ApiResponse<ProductImageUrl[]>>({
    url: `/api/v1/products/${id}/images/reorder`,
    method: 'put',
    data: { image_urls: imageUrls }
  })
}

/**
 * 上传SKU图片 (TODO: 待Go后端实现)
 */
export function uploadSkuImage(id: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return request<ApiResponse<Sku>>({
    url: `/api/v1/products/${id}/images`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 删除SKU图片 (TODO: 待Go后端实现)
 */
export function deleteSkuImage(id: number, imageUrl: string) {
  return request<ApiResponse<Sku>>({
    url: `/api/v1/products/${id}/images`,
    method: 'delete',
    data: { image_url: imageUrl }
  })
}

/**
 * 设置主图 (TODO: 待Go后端实现)
 */
export function setPrimarySkuImage(id: number, imageUrl: string) {
  return request<ApiResponse<Sku>>({
    url: `/api/v1/products/${id}/images/primary`,
    method: 'put',
    data: { image_url: imageUrl }
  })
}

/**
 * 获取SKU审计日志 (TODO: 待Go后端实现)
 */
export function getSkuAuditLogs(skuId: number, page = 1, pageSize = 10) {
  return request<ApiResponse<PaginatedResponse<AuditLog>>>({
    url: '/api/v1/identity/audit-logs',
    method: 'get',
    params: {
      entity_type: 'Product',
      entity_id: String(skuId),
      page,
      page_size: pageSize
    }
  })
}

/**
 * 获取父体列表 (TODO: 待Go后端实现)
 */
export function getProductParentList(params: ProductParentListParams) {
  return request<ApiResponse<PaginatedResponse<ProductParent>>>({
    url: '/api/v1/product-parents',
    method: 'get',
    params
  })
}

/**
 * 获取父体详情 (TODO: 待Go后端实现)
 */
export function getProductParentDetail(id: number) {
  return request<ApiResponse<ProductParent>>({
    url: `/api/v1/product-parents/${id}`,
    method: 'get'
  })
}

/**
 * 创建父体 (TODO: 待Go后端实现)
 */
export function createProductParent(data: CreateProductParentParams) {
  return request<ApiResponse<ProductParent>>({
    url: '/api/v1/product-parents',
    method: 'post',
    data
  })
}

/**
 * 更新父体 (TODO: 待Go后端实现)
 */
export function updateProductParent(id: number, data: Partial<CreateProductParentParams>) {
  return request<ApiResponse<null>>({
    url: `/api/v1/product-parents/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除父体 (TODO: 待Go后端实现)
 */
export function deleteProductParent(id: number) {
  return request<ApiResponse<null>>({
    url: `/api/v1/product-parents/${id}`,
    method: 'delete'
  })
}

/**
 * 获取组合列表
 */
export function getProductComboList(page = 1, pageSize = 20) {
  return request<ApiResponse<PaginatedResponse<ProductCombo>>>({
    url: '/api/v1/product-combos',
    method: 'get',
    params: {
      page,
      page_size: pageSize
    }
  })
}

/**
 * 获取组合详情
 */
export function getProductComboDetail(id: number) {
  return request<ApiResponse<ProductCombo>>({
    url: `/api/v1/product-combos/${id}`,
    method: 'get'
  })
}

/**
 * 创建组合
 */
export function createProductCombo(data: ComboUpsertParams) {
  return request<ApiResponse<ProductCombo>>({
    url: '/api/v1/product-combos',
    method: 'post',
    data
  })
}

/**
 * 更新组合
 */
export function updateProductCombo(id: number, data: ComboUpsertParams) {
  return request<ApiResponse<ProductCombo>>({
    url: `/api/v1/product-combos/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除组合
 */
export function deleteProductCombo(id: number) {
  return request<ApiResponse<{ message: string }>>({
    url: `/api/v1/product-combos/${id}`,
    method: 'delete'
  })
}

// ============= 产品包材配置 API =============

/**
 * 获取产品的包材配置列表
 */
export function getProductPackagingItems(productId: number) {
  return request<ApiResponse<ProductPackagingItem[]>>({
    url: `/api/v1/products/${productId}/packaging-items`,
    method: 'get'
  })
}

/**
 * 保存产品的包材配置
 */
export function saveProductPackagingItems(productId: number, data: SaveProductPackagingParams) {
  return request<ApiResponse<ProductPackagingItem[]>>({
    url: `/api/v1/products/${productId}/packaging-items`,
    method: 'put',
    data
  })
}
