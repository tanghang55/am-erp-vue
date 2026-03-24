import request from '@/utils/request'
import type {
  PurchaseOrder,
  PurchaseOrderListParams,
  CreatePurchaseOrderParams,
  CreatePurchaseOrderBatchParams,
  ShipPurchaseOrderParams,
  ReceivePurchaseOrderParams,
  InspectPurchaseOrderParams,
  ForceCompletePurchaseOrderParams,
  ReplenishmentConfig,
  ReplenishmentStrategy,
  ReplenishmentPlan,
  ReplenishmentRun
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

export function createPurchaseOrderBatch(data: CreatePurchaseOrderBatchParams) {
  return request<ApiResponse<PurchaseOrder[]>>({
    url: '/api/procurement/purchase-orders/batch',
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

export function inspectPurchaseOrder(id: number, data: InspectPurchaseOrderParams) {
  return request<ApiResponse<PurchaseOrder>>({
    url: `/api/procurement/purchase-orders/${id}/inspect`,
    method: 'post',
    data
  })
}

/**
 * 完成采购单
 */
export function closePurchaseOrder(id: number) {
  return request<ApiResponse<PurchaseOrder>>({
    url: `/api/procurement/purchase-orders/${id}/close`,
    method: 'post'
  })
}

export function forceCompletePurchaseOrder(id: number, data: ForceCompletePurchaseOrderParams) {
  return request<ApiResponse<PurchaseOrder>>({
    url: `/api/procurement/purchase-orders/${id}/force-complete`,
    method: 'post',
    data
  })
}

export function getReplenishmentConfig() {
  return request<ApiResponse<ReplenishmentConfig>>({
    url: '/api/procurement/replenishment/config',
    method: 'get'
  })
}

export function updateReplenishmentConfig(data: Partial<ReplenishmentConfig>) {
  return request<ApiResponse<ReplenishmentConfig>>({
    url: '/api/procurement/replenishment/config',
    method: 'put',
    data
  })
}

export function listReplenishmentStrategies(params?: {
  page?: number
  page_size?: number
  keyword?: string
}) {
  return request<ApiResponse<PaginatedResponse<ReplenishmentStrategy>>>({
    url: '/api/procurement/replenishment/strategies',
    method: 'get',
    params
  })
}

export function upsertReplenishmentStrategy(data: {
  id?: number
  name: string
  priority: number
  is_enabled: number
  product_id?: number
  warehouse_id?: number
  supplier_id?: number
  marketplace?: string
  condition_json?: string
  demand_window_days: number
  procurement_cycle_days: number
  pack_days: number
  logistics_days: number
  safety_days: number
  zero_sales_purchase_qty: number
  moq: number
  order_multiple: number
  remark?: string
  operator_id?: number
}) {
  return request<ApiResponse<ReplenishmentStrategy>>({
    url: '/api/procurement/replenishment/strategies',
    method: 'post',
    data
  })
}

export function listReplenishmentPlans(params?: {
  page?: number
  page_size?: number
  date?: string
  status?: string
}) {
  return request<ApiResponse<PaginatedResponse<ReplenishmentPlan>>>({
    url: '/api/procurement/replenishment/plans',
    method: 'get',
    params
  })
}

export function deleteReplenishmentPlan(id: number) {
  return request<ApiResponse<{ deleted: boolean }>>({
    url: `/api/procurement/replenishment/plans/${id}`,
    method: 'delete'
  })
}

export function generateReplenishmentPlans(data?: { operator_id?: number }) {
  return request<
    ApiResponse<{
      generated: boolean
      generated_count: number
      current_count: number
      plans: ReplenishmentPlan[]
    }>
  >({
    url: '/api/procurement/replenishment/plans/generate',
    method: 'post',
    data
  })
}

export function listReplenishmentRuns(params?: {
  page?: number
  page_size?: number
  status?: string
  trigger_type?: string
}) {
  return request<ApiResponse<PaginatedResponse<ReplenishmentRun>>>({
    url: '/api/procurement/replenishment/runs',
    method: 'get',
    params
  })
}

export function convertReplenishmentPlans(
  data: { plan_ids?: number[]; date?: string; operator_id?: number }
) {
  return request<ApiResponse<{ created_count: number; orders: PurchaseOrder[] }>>({
    url: '/api/procurement/replenishment/plans/convert',
    method: 'post',
    data
  })
}
