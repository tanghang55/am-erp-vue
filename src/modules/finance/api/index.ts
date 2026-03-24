/**
 * Finance Module API
 */

import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
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
  CostingSnapshotQueryParams,
  ProfitDashboardData,
  ProfitDashboardQueryParams,
  RebuildDailyProfitRequest,
  OrderProfitSummary,
  OrderProfitListQueryParams,
  OrderProfitDetail,
  ExchangeRate,
  ExchangeRateQueryParams,
  CreateExchangeRateRequest,
  UpdateExchangeRateStatusRequest,
  ProductCostLedgerQueryParams,
  ProductCostLedgerItem,
  ProductCostSummary
} from '../types'

const BASE_URL = '/api/finance'

// ============================================================================
// Cash Ledger API
// ============================================================================

/**
 * 获取现金流水列表
 */
export const getCashLedgerList = (params?: CashLedgerQueryParams) =>
  request<ApiResponse<PaginatedResponse<CashLedger>>>({
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
 * 冲销现金流水
 */
export const reverseCashLedger = (id: number, data?: { reason?: string }) =>
  request<ApiResponse<CashLedger>>({
    url: `${BASE_URL}/cash-ledger/${id}/reverse`,
    method: 'post',
    data
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
export const getCashLedgerSummary = (params?: Partial<CashLedgerQueryParams>) =>
  request<ApiResponse<CashLedgerSummary>>({
    url: `${BASE_URL}/cash-ledger/summary`,
    method: 'get',
    params
  })

/**
 * 按类别统计
 */
export const getCashLedgerSummaryByCategory = (params?: Partial<CashLedgerQueryParams>) =>
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
  request<ApiResponse<PaginatedResponse<CostingSnapshot>>>({
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
 * 获取产品的当前成本
 */
export const getCurrentCost = (productId: number, costType: string) =>
  request<ApiResponse<CostingSnapshot | null>>({
    url: `${BASE_URL}/costing/current/${productId}`,
    method: 'get',
    params: { cost_type: costType }
  })

/**
 * 获取产品的所有当前成本
 */
export const getAllCurrentCosts = (productId: number) =>
  request<ApiResponse<CostingSnapshot[]>>({
    url: `${BASE_URL}/costing/current/${productId}/all`,
    method: 'get'
  })

// ============================================================================
// Profit API
// ============================================================================

/**
 * 获取利润看板
 */
export const getProfitDashboard = (params?: ProfitDashboardQueryParams) =>
  request<ApiResponse<ProfitDashboardData>>({
    url: `${BASE_URL}/profit/dashboard`,
    method: 'get',
    params
  })

/**
 * 重建日利润快照
 */
export const rebuildDailyProfit = (data: RebuildDailyProfitRequest) =>
  request<ApiResponse<any[]>>({
    url: `${BASE_URL}/profit/rebuild`,
    method: 'post',
    data
  })

/**
 * 获取订单利润列表
 */
export const getOrderProfitList = (params?: OrderProfitListQueryParams) =>
  request<ApiResponse<PaginatedResponse<OrderProfitSummary>>>({
    url: `${BASE_URL}/profit/orders`,
    method: 'get',
    params
  })

/**
 * 获取订单利润详情
 */
export const getOrderProfitDetail = (orderId: number) =>
  request<ApiResponse<OrderProfitDetail>>({
    url: `${BASE_URL}/profit/orders/${orderId}`,
    method: 'get'
  })

// ============================================================================
// Product Cost Ledger API
// ============================================================================

/**
 * 获取产品成本台账列表
 */
export const getProductCostLedger = (params?: ProductCostLedgerQueryParams) =>
  request<ApiResponse<PaginatedResponse<ProductCostLedgerItem>>>({
    url: `${BASE_URL}/product-cost/ledger`,
    method: 'get',
    params
  })

/**
 * 获取产品成本汇总
 */
export const getProductCostSummary = (params?: ProductCostLedgerQueryParams) =>
  request<ApiResponse<ProductCostSummary>>({
    url: `${BASE_URL}/product-cost/summary`,
    method: 'get',
    params
  })

// ============================================================================
// Exchange Rate API
// ============================================================================

export const getExchangeRateList = (params?: ExchangeRateQueryParams) =>
  request<ApiResponse<PaginatedResponse<ExchangeRate>>>({
    url: `${BASE_URL}/exchange-rates`,
    method: 'get',
    params
  })

export const createExchangeRate = (data: CreateExchangeRateRequest) =>
  request<ApiResponse<ExchangeRate>>({
    url: `${BASE_URL}/exchange-rates`,
    method: 'post',
    data
  })

export const updateExchangeRateStatus = (id: number, data: UpdateExchangeRateStatusRequest) =>
  request<ApiResponse<null>>({
    url: `${BASE_URL}/exchange-rates/${id}/status`,
    method: 'patch',
    data
  })
