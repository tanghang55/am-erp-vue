/**
 * Finance Module TypeScript Types
 */

import type { ApiResponse, PaginatedData } from '@/modules/common/types'

// ============================================================================
// Cash Ledger Types
// ============================================================================

/**
 * 流水类型
 */
export enum LedgerType {
  INCOME = 'INCOME',   // 收入
  EXPENSE = 'EXPENSE'  // 支出
}

/**
 * 流水类别
 */
export enum LedgerCategory {
  SALES_REVENUE = 'SALES_REVENUE',     // 销售收入
  PURCHASE_COST = 'PURCHASE_COST',     // 采购成本
  SHIPPING_FEE = 'SHIPPING_FEE',       // 运费
  PACKAGING_COST = 'PACKAGING_COST',   // 包装成本
  OTHER_INCOME = 'OTHER_INCOME',       // 其他收入
  OTHER_EXPENSE = 'OTHER_EXPENSE'      // 其他支出
}

/**
 * 关联单据类型
 */
export enum ReferenceType {
  PURCHASE_ORDER = 'PURCHASE_ORDER', // 采购订单
  SHIPMENT = 'SHIPMENT',             // 发货单
  MANUAL = 'MANUAL'                  // 手工录入
}

/**
 * 现金流水
 */
export interface CashLedger {
  id: number
  trace_id: string
  ledger_type: LedgerType
  category: LedgerCategory
  amount: number
  currency: string
  reference_type?: ReferenceType | null
  reference_id?: number | null
  description?: string | null
  occurred_at: string
  created_by: number
  created_at: string
  updated_at: string
}

/**
 * 创建现金流水请求
 */
export interface CreateCashLedgerRequest {
  ledger_type: LedgerType
  category: LedgerCategory
  amount: number
  currency?: string
  reference_type?: ReferenceType | null
  reference_id?: number | null
  description?: string
  occurred_at?: string
}

/**
 * 更新现金流水请求
 */
export interface UpdateCashLedgerRequest {
  ledger_type?: LedgerType
  category?: LedgerCategory
  amount?: number
  currency?: string
  reference_type?: ReferenceType | null
  reference_id?: number | null
  description?: string
  occurred_at?: string
}

/**
 * 现金流水查询参数
 */
export interface CashLedgerQueryParams {
  page?: number
  page_size?: number
  ledger_type?: LedgerType
  category?: LedgerCategory
  keyword?: string
  date_from?: string
  date_to?: string
  reference_type?: ReferenceType
  reference_id?: number
}

/**
 * 现金流水汇总
 */
export interface CashLedgerSummary {
  total_income: number
  income_count: number
  total_expense: number
  expense_count: number
  net_profit: number
}

/**
 * 按类别汇总项
 */
export interface CategorySummaryItem {
  ledger_type: LedgerType
  category: LedgerCategory
  total_amount: number
  count: number
}

// ============================================================================
// Costing Types
// ============================================================================

/**
 * 成本类型
 */
export enum CostType {
  PURCHASE = 'PURCHASE', // 采购成本
  LANDED = 'LANDED',     // 到岸成本
  AVERAGE = 'AVERAGE'    // 平均成本
}

/**
 * 成本快照
 */
export interface CostingSnapshot {
  id: number
  trace_id: string
  sku_id: number
  cost_type: CostType
  unit_cost: number
  currency: string
  effective_from: string
  effective_to?: string | null
  notes?: string | null
  created_by: number
  created_at: string
  updated_at: string
}

/**
 * 创建成本快照请求
 */
export interface CreateCostingSnapshotRequest {
  sku_id: number
  cost_type: CostType
  unit_cost: number
  currency?: string
  effective_from?: string
  effective_to?: string | null
  notes?: string
}

/**
 * 更新成本快照请求
 */
export interface UpdateCostingSnapshotRequest {
  unit_cost?: number
  currency?: string
  effective_from?: string
  effective_to?: string | null
  notes?: string
}

/**
 * 成本快照查询参数
 */
export interface CostingSnapshotQueryParams {
  page?: number
  page_size?: number
  sku_id?: number
  cost_type?: CostType
  is_current?: boolean
}

// ============================================================================
// UI Constants
// ============================================================================

/**
 * 流水类型选项
 */
export const LEDGER_TYPE_OPTIONS = [
  { label: '收入', value: LedgerType.INCOME, type: 'success' },
  { label: '支出', value: LedgerType.EXPENSE, type: 'danger' }
]

/**
 * 流水类别选项
 */
export const LEDGER_CATEGORY_OPTIONS = [
  { label: '销售收入', value: LedgerCategory.SALES_REVENUE, ledger_type: LedgerType.INCOME },
  { label: '采购成本', value: LedgerCategory.PURCHASE_COST, ledger_type: LedgerType.EXPENSE },
  { label: '运费', value: LedgerCategory.SHIPPING_FEE, ledger_type: LedgerType.EXPENSE },
  { label: '包装成本', value: LedgerCategory.PACKAGING_COST, ledger_type: LedgerType.EXPENSE },
  { label: '其他收入', value: LedgerCategory.OTHER_INCOME, ledger_type: LedgerType.INCOME },
  { label: '其他支出', value: LedgerCategory.OTHER_EXPENSE, ledger_type: LedgerType.EXPENSE }
]

/**
 * 成本类型选项
 */
export const COST_TYPE_OPTIONS = [
  { label: '采购成本', value: CostType.PURCHASE },
  { label: '到岸成本', value: CostType.LANDED },
  { label: '平均成本', value: CostType.AVERAGE }
]

/**
 * 获取流水类型标签
 */
export function getLedgerTypeLabel(type: LedgerType): string {
  return LEDGER_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type
}

/**
 * 获取流水类型颜色
 */
export function getLedgerTypeColor(type: LedgerType): string {
  return LEDGER_TYPE_OPTIONS.find(opt => opt.value === type)?.type || 'info'
}

/**
 * 获取流水类别标签
 */
export function getLedgerCategoryLabel(category: LedgerCategory): string {
  return LEDGER_CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category
}

/**
 * 获取成本类型标签
 */
export function getCostTypeLabel(type: CostType): string {
  return COST_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type
}

/**
 * 根据流水类型过滤类别选项
 */
export function getCategoryOptionsByLedgerType(ledgerType: LedgerType) {
  return LEDGER_CATEGORY_OPTIONS.filter(opt => opt.ledger_type === ledgerType)
}
