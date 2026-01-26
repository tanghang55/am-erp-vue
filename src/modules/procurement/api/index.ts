import request from '@/utils/request'
import type {
  PurchaseOrder,
  PurchaseOrderListParams,
  CreatePurchaseOrderParams,
  ShipPurchaseOrderParams,
  ReceivePurchaseOrderParams
} from '../types'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'

/**
 * 获取采购单列表
 */
export function getPurchaseOrderList(params: PurchaseOrderListParams) {
  return request<ApiResponse<PaginatedResponse<PurchaseOrder>>>({
    url: '/api/procurement/purchase-orders',
    method: 'get',
    params
  })
}

/**
 * 获取采购单详情
 */
export function getPurchaseOrderDetail(id: number) {
  return request<ApiResponse<PurchaseOrder>>({
    url: `/api/procurement/purchase-orders/${id}`,
    method: 'get'
  })
}

/**
 * 创建采购单
 */
export function createPurchaseOrder(data: CreatePurchaseOrderParams) {
  return request<ApiResponse<PurchaseOrder>>({
    url: '/api/procurement/purchase-orders',
    method: 'post',
    data
  })
}

/**
 * 更新采购单
 */
export function updatePurchaseOrder(id: number, data: Partial<CreatePurchaseOrderParams>) {
  return request<ApiResponse<PurchaseOrder>>({
    url: `/api/procurement/purchase-orders/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除采购单
 */
export function deletePurchaseOrder(id: number) {
  return request<ApiResponse<{ message: string }>>({
    url: `/api/procurement/purchase-orders/${id}`,
    method: 'delete'
  })
}

/**
 * 提交采购单
 */
export function submitPurchaseOrder(id: number) {
  return request<ApiResponse<PurchaseOrder>>({
    url: `/api/procurement/purchase-orders/${id}/submit`,
    method: 'post'
  })
}

/**
 * 标记发货
 */
export function markPurchaseOrderShipped(id: number, data: ShipPurchaseOrderParams) {
  return request<ApiResponse<PurchaseOrder>>({
    url: `/api/procurement/purchase-orders/${id}/ship`,
    method: 'post',
    data
  })
}

/**
 * 到货验收
 */
export function receivePurchaseOrder(id: number, data: ReceivePurchaseOrderParams) {
  return request<ApiResponse<PurchaseOrder>>({
    url: `/api/procurement/purchase-orders/${id}/receive`,
    method: 'post',
    data
  })
}

/**
 * 关闭采购单
 */
export function closePurchaseOrder(id: number) {
  return request<ApiResponse<PurchaseOrder>>({
    url: `/api/procurement/purchase-orders/${id}/close`,
    method: 'post'
  })
}
