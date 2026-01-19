import request from '@/utils/request'
import type {
  Shipment,
  ShipmentListParams,
  CreateShipmentParams,
  UpdateShipmentParams
} from '../types'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'

/**
 * 获取发货单列表
 */
export function getShipmentList(params: ShipmentListParams) {
  return request<ApiResponse<PaginatedResponse<Shipment>>>({
    url: '/api/shipping/shipments',
    method: 'get',
    params
  })
}

/**
 * 获取发货单详情
 */
export function getShipmentDetail(id: number) {
  return request<ApiResponse<Shipment>>({
    url: `/api/shipping/shipments/${id}`,
    method: 'get'
  })
}

/**
 * 创建发货单（自动创建销售出库流水）
 */
export function createShipment(data: CreateShipmentParams) {
  return request<ApiResponse<Shipment>>({
    url: '/api/shipping/shipments',
    method: 'post',
    data
  })
}

/**
 * 更新发货单（仅待处理状态可更新）
 */
export function updateShipment(id: number, data: UpdateShipmentParams) {
  return request<ApiResponse<Shipment>>({
    url: `/api/shipping/shipments/${id}`,
    method: 'put',
    data
  })
}

/**
 * 标记发货（PENDING/PROCESSING → SHIPPED）
 */
export function markShipped(id: number) {
  return request<ApiResponse<Shipment>>({
    url: `/api/shipping/shipments/${id}/ship`,
    method: 'post'
  })
}

/**
 * 标记签收（SHIPPED → DELIVERED）
 */
export function markDelivered(id: number) {
  return request<ApiResponse<Shipment>>({
    url: `/api/shipping/shipments/${id}/deliver`,
    method: 'post'
  })
}

/**
 * 取消发货单（→ CANCELLED）
 */
export function cancelShipment(id: number) {
  return request<ApiResponse<Shipment>>({
    url: `/api/shipping/shipments/${id}/cancel`,
    method: 'post'
  })
}
