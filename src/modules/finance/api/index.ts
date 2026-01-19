/**
 * Finance Module API
 */

import request from '@/utils/request'
import type { ApiResponse, PaginatedData } from '@/modules/common/types'
import type {
  CashLedger,
  CreateCashLedgerRequest,
  UpdateCashLedgerRequest,
  CashLedgerQueryParams,
  CashLedgerSummary,
  CategorySummaryItem,
  CostingSnapshot,
  CreateCostingSnapshotRequest,
  UpdateCostingSnapshotRequest,
  CostingSnapshotQueryParams
} from '../types'

const BASE_URL = '/api/finance'

// ============================================================================
// Cash Ledger API
// ============================================================================

/**
 * 获取现金流水列表
 */
export const getCashLedgerList = (params?: CashLedgerQueryParams) =>
  request<ApiResponse<PaginatedData<CashLedger>>>({
    url: `${BASE_URL}/cash-ledger`,
    method: 'get',
    params
  })

/**
 * 获取现金流水详情
 */
export const getCashLedgerById = (id: number) =>
  request<ApiResponse<CashLedger>>({
    url: `${BASE_URL}/cash-ledger/${id}`,
    method: 'get'
  })

/**
 * 创建现金流水
 */
export const createCashLedger = (data: CreateCashLedgerRequest) =>
  request<ApiResponse<CashLedger>>({
    url: `${BASE_URL}/cash-ledger`,
    method: 'post',
    data
  })

/**
 * 更新现金流水
 */
export const updateCashLedger = (id: number, data: UpdateCashLedgerRequest) =>
  request<ApiResponse<null>>({
    url: `${BASE_URL}/cash-ledger/${id}`,
    method: 'put',
    data
  })

/**
 * 删除现金流水
 */
export const deleteCashLedger = (id: number) =>
  request<ApiResponse<null>>({
    url: `${BASE_URL}/cash-ledger/${id}`,
    method: 'delete'
  })

/**
 * 获取现金流水汇总统计
 */
export const getCashLedgerSummary = (params?: { date_from?: string; date_to?: string }) =>
  request<ApiResponse<CashLedgerSummary>>({
    url: `${BASE_URL}/cash-ledger/summary`,
    method: 'get',
    params
  })

/**
 * 按类别统计
 */
export const getCashLedgerSummaryByCategory = (params?: { date_from?: string; date_to?: string }) =>
  request<ApiResponse<CategorySummaryItem[]>>({
    url: `${BASE_URL}/cash-ledger/summary-by-category`,
    method: 'get',
    params
  })

// ============================================================================
// Costing API
// ============================================================================

/**
 * 获取成本快照列表
 */
export const getCostingSnapshotList = (params?: CostingSnapshotQueryParams) =>
  request<ApiResponse<PaginatedData<CostingSnapshot>>>({
    url: `${BASE_URL}/costing/snapshots`,
    method: 'get',
    params
  })

/**
 * 获取成本快照详情
 */
export const getCostingSnapshotById = (id: number) =>
  request<ApiResponse<CostingSnapshot>>({
    url: `${BASE_URL}/costing/snapshots/${id}`,
    method: 'get'
  })

/**
 * 创建成本快照
 */
export const createCostingSnapshot = (data: CreateCostingSnapshotRequest) =>
  request<ApiResponse<CostingSnapshot>>({
    url: `${BASE_URL}/costing/snapshots`,
    method: 'post',
    data
  })

/**
 * 更新成本快照
 */
export const updateCostingSnapshot = (id: number, data: UpdateCostingSnapshotRequest) =>
  request<ApiResponse<null>>({
    url: `${BASE_URL}/costing/snapshots/${id}`,
    method: 'put',
    data
  })

/**
 * 删除成本快照
 */
export const deleteCostingSnapshot = (id: number) =>
  request<ApiResponse<null>>({
    url: `${BASE_URL}/costing/snapshots/${id}`,
    method: 'delete'
  })

/**
 * 获取 SKU 的当前成本
 */
export const getCurrentCost = (skuId: number, costType: string) =>
  request<ApiResponse<CostingSnapshot | null>>({
    url: `${BASE_URL}/costing/current/${skuId}`,
    method: 'get',
    params: { cost_type: costType }
  })

/**
 * 获取 SKU 的所有当前成本
 */
export const getAllCurrentCosts = (skuId: number) =>
  request<ApiResponse<CostingSnapshot[]>>({
    url: `${BASE_URL}/costing/current/${skuId}/all`,
    method: 'get'
  })
