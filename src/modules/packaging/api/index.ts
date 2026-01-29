/**
 * Packaging Module API
 */

import request from '@/utils/request'
import type { ApiResponse, PaginatedData } from '@/modules/common/types'
import type {
  PackagingItem,
  CreatePackagingItemRequest,
  UpdatePackagingItemRequest,
  PackagingItemQueryParams,
  PackagingLedger,
  CreatePackagingLedgerRequest,
  PackagingLedgerQueryParams,
  UsageSummaryItem
} from '../types'

const BASE_URL = '/api/v1/packaging'

// ============================================================================
// Packaging Item API
// ============================================================================

/**
 * 获取包装材料列表
 */
export const getPackagingItemList = (params?: PackagingItemQueryParams) =>
  request<ApiResponse<PaginatedData<PackagingItem>>>({
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
  request<ApiResponse<PaginatedData<PackagingLedger>>>({
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
