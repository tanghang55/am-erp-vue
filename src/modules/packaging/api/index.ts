/**
 * Packaging Module API
 */

import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
import type {
  PackagingItem,
  CreatePackagingItemRequest,
  UpdatePackagingItemRequest,
  PackagingItemQueryParams,
  PackagingLedger,
  CreatePackagingLedgerRequest,
  PackagingLedgerQueryParams,
  UsageSummaryItem,
  PackagingProcurementPlan,
  PackagingPurchaseOrder,
  PackagingProcurementRun
} from '../types'

const BASE_URL = '/api/v1/packaging'

// ============================================================================
// Packaging Item API
// ============================================================================

/**
 * 获取包装材料列表
 */
export const getPackagingItemList = (params?: PackagingItemQueryParams) =>
  request<ApiResponse<PaginatedResponse<PackagingItem>>>({
    url: `${BASE_URL}/items`,
    method: 'get',
    params
  })

/**
 * 获取包装材料详情
 */
export const getPackagingItemById = (id: number) =>
  request<ApiResponse<PackagingItem>>({
    url: `${BASE_URL}/items/${id}`,
    method: 'get'
  })

/**
 * 创建包装材料
 */
export const createPackagingItem = (data: CreatePackagingItemRequest) =>
  request<ApiResponse<PackagingItem>>({
    url: `${BASE_URL}/items`,
    method: 'post',
    data
  })

/**
 * 更新包装材料
 */
export const updatePackagingItem = (id: number, data: UpdatePackagingItemRequest) =>
  request<ApiResponse<null>>({
    url: `${BASE_URL}/items/${id}`,
    method: 'put',
    data
  })

/**
 * 删除包装材料
 */
export const deletePackagingItem = (id: number) =>
  request<ApiResponse<null>>({
    url: `${BASE_URL}/items/${id}`,
    method: 'delete'
  })

/**
 * 获取低库存包装材料
 */
export const getLowStockItems = () =>
  request<ApiResponse<PackagingItem[]>>({
    url: `${BASE_URL}/items/low-stock`,
    method: 'get'
  })

// ============================================================================
// Packaging Ledger API
// ============================================================================

/**
 * 获取包装材料流水列表
 */
export const getPackagingLedgerList = (params?: PackagingLedgerQueryParams) =>
  request<ApiResponse<PaginatedResponse<PackagingLedger>>>({
    url: `${BASE_URL}/ledger`,
    method: 'get',
    params
  })

/**
 * 获取流水详情
 */
export const getPackagingLedgerById = (id: number) =>
  request<ApiResponse<PackagingLedger>>({
    url: `${BASE_URL}/ledger/${id}`,
    method: 'get'
  })

/**
 * 创建入库流水
 */
export const createInboundLedger = (data: CreatePackagingLedgerRequest) =>
  request<ApiResponse<PackagingLedger>>({
    url: `${BASE_URL}/ledger/inbound`,
    method: 'post',
    data
  })

/**
 * 创建出库流水
 */
export const createOutboundLedger = (data: CreatePackagingLedgerRequest) =>
  request<ApiResponse<PackagingLedger>>({
    url: `${BASE_URL}/ledger/outbound`,
    method: 'post',
    data
  })

/**
 * 创建调整流水
 */
export const createAdjustmentLedger = (data: CreatePackagingLedgerRequest) =>
  request<ApiResponse<PackagingLedger>>({
    url: `${BASE_URL}/ledger/adjustment`,
    method: 'post',
    data
  })

/**
 * 获取使用情况统计
 */
export const getUsageSummary = (params?: { date_from?: string; date_to?: string }) =>
  request<ApiResponse<UsageSummaryItem[]>>({
    url: `${BASE_URL}/ledger/usage-summary`,
    method: 'get',
    params
  })

export const getPackagingProcurementPlans = (params?: {
  page?: number
  page_size?: number
  date?: string
  status?: 'PENDING' | 'CONVERTED' | 'CANCELLED'
}) =>
  request<ApiResponse<PaginatedResponse<PackagingProcurementPlan>>>({
    url: `${BASE_URL}/procurement/plans`,
    method: 'get',
    params
  })

export const getPackagingProcurementRuns = (params?: {
  page?: number
  page_size?: number
  status?: 'RUNNING' | 'SUCCESS' | 'FAILED'
  trigger_type?: 'MANUAL' | 'SCHEDULED'
}) =>
  request<ApiResponse<PaginatedResponse<PackagingProcurementRun>>>({
    url: `${BASE_URL}/procurement/runs`,
    method: 'get',
    params
  })

export const generatePackagingProcurementPlans = (data?: { date?: string }) =>
  request<ApiResponse<{ generated_count: number; current_count: number; plans: PackagingProcurementPlan[] }>>({
    url: `${BASE_URL}/procurement/plans/generate`,
    method: 'post',
    data
  })

export const convertPackagingProcurementPlans = (data: {
  plan_ids?: number[]
  date?: string
  operator_id?: number
}) =>
  request<ApiResponse<PackagingPurchaseOrder>>({
    url: `${BASE_URL}/procurement/plans/convert`,
    method: 'post',
    data
  })

export const getPackagingPurchaseOrderList = (params?: {
  page?: number
  page_size?: number
  status?: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CLOSED'
}) =>
  request<ApiResponse<PaginatedResponse<PackagingPurchaseOrder>>>({
    url: `${BASE_URL}/procurement/orders`,
    method: 'get',
    params
  })

export const getPackagingPurchaseOrderDetail = (id: number) =>
  request<ApiResponse<PackagingPurchaseOrder>>({
    url: `${BASE_URL}/procurement/orders/${id}`,
    method: 'get'
  })

export const submitPackagingPurchaseOrder = (id: number, data?: { operator_id?: number }) =>
  request<ApiResponse<PackagingPurchaseOrder>>({
    url: `${BASE_URL}/procurement/orders/${id}/submit`,
    method: 'post',
    data
  })

export const receivePackagingPurchaseOrder = (
  id: number,
  data?: { received_qties?: Record<string, number>; operator_id?: number }
) =>
  request<ApiResponse<PackagingPurchaseOrder>>({
    url: `${BASE_URL}/procurement/orders/${id}/receive`,
    method: 'post',
    data
  })
