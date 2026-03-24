import request from '@/utils/request'
import type {
  Shipment,
  ShipmentListParams,
  CreateShipmentParams,
  UpdateShipmentParams,
  MarkShippedParams,
  MarkDeliveredParams,
  PackageSpec,
  PackageSpecListParams,
  CreatePackageSpecParams,
  UpdatePackageSpecParams,
  PackageSpecPackagingItem,
  SavePackageSpecPackagingParams
} from '../types'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
import type { CreateMovementParams, InventoryMovement } from '@/modules/inventory/types'

// Re-export types for convenience
export type { MarkShippedParams, MarkDeliveredParams }

/**
 * 获取发货单列表
 */
export function getShipmentList(params: ShipmentListParams) {
  return request<ApiResponse<PaginatedResponse<Shipment>>>({
    url: '/api/v1/shipments',
    method: 'get',
    params
  })
}

/**
 * 获取发货单详情
 */
export function getShipmentDetail(id: number) {
  return request<ApiResponse<Shipment>>({
    url: `/api/v1/shipments/${id}`,
    method: 'get'
  })
}

/**
 * 创建发货单（草稿状态）
 */
export function createShipment(data: CreateShipmentParams) {
  return request<ApiResponse<Shipment>>({
    url: '/api/v1/shipments',
    method: 'post',
    data
  })
}

/**
 * 编辑发货单
 */
export function updateShipment(id: number, data: UpdateShipmentParams) {
  return request<ApiResponse<Shipment>>({
    url: `/api/v1/shipments/${id}`,
    method: 'put',
    data
  })
}

/**
 * 确认发货单 (DRAFT → CONFIRMED)
 * 锁定库存，检查库存是否充足
 */
export function confirmShipment(id: number) {
  return request<ApiResponse<void>>({
    url: `/api/v1/shipments/${id}/confirm`,
    method: 'post',
    data: {}
  })
}

/**
 * 标记发货 (CONFIRMED → SHIPPED)
 * 库存流转：待出库存 → 物流在途
 */
export function markShipped(id: number, data: MarkShippedParams) {
  return request<ApiResponse<void>>({
    url: `/api/v1/shipments/${id}/ship`,
    method: 'post',
    data
  })
}

/**
 * 标记送达 (SHIPPED → DELIVERED)
 * 无库存变化，仅状态更新
 */
export function markDelivered(id: number, data?: MarkDeliveredParams) {
  return request<ApiResponse<void>>({
    url: `/api/v1/shipments/${id}/delivered`,
    method: 'post',
    data: data || {}
  })
}

/**
 * 平台上架（货件接收）
 * 单次只处理一个产品，避免前端批量循环带来半成功状态。
 */
export function receiveShipmentItem(data: CreateMovementParams) {
  return request<ApiResponse<InventoryMovement>>({
    url: '/api/v1/inventory/movements/platform-receive',
    method: 'post',
    data
  })
}

/**
 * 取消发货单（带回滚）
 * 根据当前状态决定回滚策略
 */
export function cancelShipment(id: number, remark?: string) {
  return request<ApiResponse<void>>({
    url: `/api/v1/shipments/${id}/cancel`,
    method: 'post',
    data: {
      remark
    }
  })
}

/**
 * 删除发货单
 * 仅允许删除DRAFT或CANCELLED状态的发货单
 */
export function deleteShipment(id: number) {
  return request<ApiResponse<void>>({
    url: `/api/v1/shipments/${id}`,
    method: 'delete'
  })
}

// ============= Package Spec (装箱规格) API =============

/**
 * 获取装箱规格列表
 */
export function getPackageSpecList(params: PackageSpecListParams) {
  return request<ApiResponse<PaginatedResponse<PackageSpec>>>({
    url: '/api/v1/package-specs',
    method: 'get',
    params
  })
}

/**
 * 获取装箱规格详情
 */
export function getPackageSpecDetail(id: number) {
  return request<ApiResponse<PackageSpec>>({
    url: `/api/v1/package-specs/${id}`,
    method: 'get'
  })
}

/**
 * 创建装箱规格
 */
export function createPackageSpec(data: CreatePackageSpecParams) {
  return request<ApiResponse<PackageSpec>>({
    url: '/api/v1/package-specs',
    method: 'post',
    data
  })
}

/**
 * 更新装箱规格
 */
export function updatePackageSpec(id: number, data: UpdatePackageSpecParams) {
  return request<ApiResponse<PackageSpec>>({
    url: `/api/v1/package-specs/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除装箱规格
 */
export function deletePackageSpec(id: number) {
  return request<ApiResponse<void>>({
    url: `/api/v1/package-specs/${id}`,
    method: 'delete'
  })
}

// ============= 装箱规格包材配置 API =============

/**
 * 获取装箱规格的包材配置列表
 */
export function getPackageSpecPackagingItems(packageSpecId: number) {
  return request<ApiResponse<PackageSpecPackagingItem[]>>({
    url: `/api/v1/package-specs/${packageSpecId}/packaging-items`,
    method: 'get'
  })
}

/**
 * 保存装箱规格的包材配置
 */
export function savePackageSpecPackagingItems(packageSpecId: number, data: SavePackageSpecPackagingParams) {
  return request<ApiResponse<PackageSpecPackagingItem[]>>({
    url: `/api/v1/package-specs/${packageSpecId}/packaging-items`,
    method: 'put',
    data
  })
}
