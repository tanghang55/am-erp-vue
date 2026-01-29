/**
 * Packaging Module TypeScript Types
 */

import type { ApiResponse, PaginatedData } from '@/modules/common/types'

// ============================================================================
// Packaging Item Types
// ============================================================================

/**
 * 包装类别
 */
export enum PackagingCategory {
  BOX = 'BOX',                 // 纸箱
  BAG = 'BAG',                 // 包装袋
  TAPE = 'TAPE',               // 胶带
  LABEL = 'LABEL',             // 标签
  BUBBLE_WRAP = 'BUBBLE_WRAP', // 气泡膜
  FILLER = 'FILLER',           // 填充物
  OTHER = 'OTHER'              // 其他
}

/**
 * 包装材料状态
 */
export enum PackagingStatus {
  ACTIVE = 'ACTIVE',     // 启用
  INACTIVE = 'INACTIVE'  // 停用
}

/**
 * 包装材料
 */
export interface PackagingItem {
  id: number
  trace_id: string
  item_code: string
  item_name: string
  category: PackagingCategory
  specification?: string | null
  unit_cost: number  // 单位成本 - 金额可以有小数
  currency: string
  unit: string
  quantity_on_hand: number  // 库存数量 - 整数
  reorder_point?: number | null  // 补货点 - 整数
  reorder_quantity?: number | null  // 补货数量 - 整数
  supplier_name?: string | null
  supplier_contact?: string | null
  status: PackagingStatus
  notes?: string | null
  created_by: number
  created_at: string
  updated_at: string
}

/**
 * 创建包装材料请求
 */
export interface CreatePackagingItemRequest {
  item_code: string
  item_name: string
  category: PackagingCategory
  specification?: string
  unit_cost?: number
  currency?: string
  unit?: string
  quantity_on_hand?: number
  reorder_point?: number
  reorder_quantity?: number
  supplier_name?: string
  supplier_contact?: string
  status?: PackagingStatus
  notes?: string
}

/**
 * 更新包装材料请求
 */
export interface UpdatePackagingItemRequest {
  item_code?: string
  item_name?: string
  category?: PackagingCategory
  specification?: string
  unit_cost?: number
  currency?: string
  unit?: string
  reorder_point?: number
  reorder_quantity?: number
  supplier_name?: string
  supplier_contact?: string
  status?: PackagingStatus
  notes?: string
}

/**
 * 包装材料查询参数
 */
export interface PackagingItemQueryParams {
  page?: number
  page_size?: number
  category?: PackagingCategory
  status?: PackagingStatus
  keyword?: string
  low_stock?: boolean
}

// ============================================================================
// Packaging Ledger Types
// ============================================================================

/**
 * 流水类型
 */
export enum TransactionType {
  IN = 'IN',               // 入库
  OUT = 'OUT',             // 出库
  ADJUSTMENT = 'ADJUSTMENT' // 调整
}

/**
 * 包装材料流水
 */
export interface PackagingLedger {
  id: number
  trace_id: string
  packaging_item_id: number
  transaction_type: TransactionType
  quantity: number  // 数量 - 整数（正数入库，负数出库）
  unit_cost: number  // 单位成本 - 金额可以有小数
  total_cost: number  // 总成本 - 金额可以有小数
  quantity_before: number  // 操作前库存 - 整数
  quantity_after: number  // 操作后库存 - 整数
  reference_type?: string | null
  reference_id?: number | null
  occurred_at: string
  notes?: string | null
  created_by: number
  created_at: string
  packaging_item?: PackagingItem
}

/**
 * 创建流水请求
 */
export interface CreatePackagingLedgerRequest {
  packaging_item_id: number
  quantity: number
  unit_cost?: number
  reference_type?: string
  reference_id?: number
  occurred_at?: string
  notes?: string
}

/**
 * 流水查询参数
 */
export interface PackagingLedgerQueryParams {
  page?: number
  page_size?: number
  packaging_item_id?: number
  transaction_type?: TransactionType
  date_from?: string
  date_to?: string
  reference_type?: string
  reference_id?: number
}

/**
 * 使用情况统计项
 */
export interface UsageSummaryItem {
  id: number
  item_code: string
  item_name: string
  category: PackagingCategory
  total_in: number
  total_out: number
  total_cost: number
}

// ============================================================================
// UI Constants
// ============================================================================

/**
 * 包装类别选项
 */
export const PACKAGING_CATEGORY_OPTIONS = [
  { label: '纸箱', value: PackagingCategory.BOX },
  { label: '包装袋', value: PackagingCategory.BAG },
  { label: '胶带', value: PackagingCategory.TAPE },
  { label: '标签', value: PackagingCategory.LABEL },
  { label: '气泡膜', value: PackagingCategory.BUBBLE_WRAP },
  { label: '填充物', value: PackagingCategory.FILLER },
  { label: '其他', value: PackagingCategory.OTHER }
]

/**
 * 包装材料状态选项
 */
export const PACKAGING_STATUS_OPTIONS = [
  { label: '启用', value: PackagingStatus.ACTIVE, type: 'success' },
  { label: '停用', value: PackagingStatus.INACTIVE, type: 'info' }
]

/**
 * 流水类型选项
 */
export const TRANSACTION_TYPE_OPTIONS = [
  { label: '入库', value: TransactionType.IN, type: 'success' },
  { label: '出库', value: TransactionType.OUT, type: 'danger' },
  { label: '调整', value: TransactionType.ADJUSTMENT, type: 'warning' }
]

/**
 * 常用单位选项
 */
export const UNIT_OPTIONS = [
  { label: '个', value: 'PCS' },
  { label: '卷', value: 'ROLL' },
  { label: '米', value: 'METER' },
  { label: '千克', value: 'KG' },
  { label: '箱', value: 'BOX' }
]

/**
 * 获取包装类别标签
 */
export function getPackagingCategoryLabel(category: PackagingCategory): string {
  return PACKAGING_CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category
}

/**
 * 获取状态标签
 */
export function getPackagingStatusLabel(status: PackagingStatus): string {
  return PACKAGING_STATUS_OPTIONS.find(opt => opt.value === status)?.label || status
}

/**
 * 获取状态颜色
 */
export function getPackagingStatusColor(status: PackagingStatus): string {
  return PACKAGING_STATUS_OPTIONS.find(opt => opt.value === status)?.type || 'info'
}

/**
 * 获取流水类型标签
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  return TRANSACTION_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type
}

/**
 * 获取流水类型颜色
 */
export function getTransactionTypeColor(type: TransactionType): string {
  return TRANSACTION_TYPE_OPTIONS.find(opt => opt.value === type)?.type || 'info'
}
