/**
 * Finance Module TypeScript Types
 */

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
  status: 'NORMAL' | 'REVERSED'
  reversal_of_id?: number | null
  category: LedgerCategory
  amount: number
  currency: string
  original_currency: string
  original_amount: number
  base_currency: string
  base_amount: number
  fx_rate: number
  fx_source?: string
  fx_version?: string
  fx_time?: string
  marketplace?: string | null
  occurred_node?: string | null
  reference_type?: ReferenceType | null
  reference_id?: number | null
  description?: string | null
  occurred_at: string
  created_by: number
  created_by_name?: string
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
  marketplace?: string | null
  occurred_node?: string | null
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
  marketplace?: string | null
  occurred_node?: string | null
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
  marketplace?: string
  occurred_node?: string
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
  product_id: number
  seller_sku?: string
  product_title?: string
  product_image_url?: string
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
  product_id: number
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
  product_id?: number
  cost_type?: CostType
  is_current?: boolean
}

// ============================================================================
// Profit Types
// ============================================================================

export interface ProfitDashboardQueryParams {
  date_from?: string
  date_to?: string
  marketplace?: string
}

export interface ProfitDashboardSummary {
  sales_income_amount: number
  cogs_amount: number
  gross_profit_amount: number
  order_expense_amount: number
  order_net_profit_amount: number
  public_expense_amount: number
  operating_net_profit_amount: number
  order_count: number
  shipped_qty: number
}

export interface DailyProfitSnapshot {
  id: number
  biz_date: string
  marketplace: string
  base_currency: string
  sales_income_amount: number
  cogs_amount: number
  gross_profit_amount: number
  order_expense_amount: number
  order_net_profit_amount: number
  public_expense_amount: number
  operating_net_profit_amount: number
  order_count: number
  shipped_qty: number
  snapshot_status: 'NORMAL' | 'RECALCULATED'
  source_version: string
  built_at: string
  builder_id?: number | null
}

export interface ProfitDashboardData {
  items: DailyProfitSnapshot[]
  summary: ProfitDashboardSummary
}

export interface RebuildDailyProfitRequest {
  biz_date: string
  marketplace?: string
}

export interface OrderProfitListQueryParams {
  page?: number
  page_size?: number
  date_from?: string
  date_to?: string
  marketplace?: string
  keyword?: string
}

export interface OrderProfitSummary {
  sales_order_id: number
  order_no: string
  marketplace: string
  base_currency: string
  sales_income_amount: number
  cogs_amount: number
  gross_profit_amount: number
  order_expense_amount: number
  order_net_profit_amount: number
  occurred_at: string
}

export interface OrderProfitLine {
  sales_order_item_id: number
  product_id: number
  seller_sku: string
  product_title: string
  product_image_url: string
  qty_shipped: number
  unit_price: number
  income_amount: number
  cogs_amount: number
  gross_profit_amount: number
}

export interface OrderProfitExpense {
  id: number
  category: string
  base_currency: string
  base_amount: number
  occurred_at: string
  remark?: string | null
}

export interface OrderProfitDetail {
  summary: OrderProfitSummary
  lines: OrderProfitLine[]
  expenses: OrderProfitExpense[]
}

// ============================================================================
// Product Cost Ledger Types
// ============================================================================

export type ProductCostDirection = 'INBOUND' | 'OUTBOUND' | 'NEUTRAL'

export interface ProductCostLedgerQueryParams {
  page?: number
  page_size?: number
  product_id?: number
  warehouse_id?: number
  marketplace?: string
  date_from?: string
  date_to?: string
}

export interface ProductCostLedgerItem {
  direction: ProductCostDirection
  source_type: string
  occurred_at: string
  product_id: number
  seller_sku?: string | null
  product_title?: string | null
  warehouse_id?: number | null
  warehouse_code?: string | null
  warehouse_name?: string | null
  marketplace?: string | null
  quantity: number
  unit_cost_original: number
  original_currency: string
  original_amount: number
  base_currency: string
  base_amount: number
  reference_type?: string | null
  reference_id?: number | null
  reference_number?: string | null
}

export interface ProductCostSummary {
  base_currency: string
  inbound_qty: number
  inbound_amount: number
  outbound_qty: number
  outbound_amount: number
  net_qty: number
  net_amount: number
  avg_inbound_unit_cost: number
  avg_outbound_unit_cost: number
}

// ============================================================================
// Exchange Rate Types
// ============================================================================

export type ExchangeRateStatus = 'ACTIVE' | 'INACTIVE'
export type ExchangeRateSourceType = 'MANUAL'

export interface ExchangeRate {
  id: number
  from_currency: string
  to_currency: string
  rate: number
  source_type: ExchangeRateSourceType
  source_version: string
  effective_at: string
  status: ExchangeRateStatus
  remark?: string | null
  created_by: number
  updated_by: number
  created_at: string
  updated_at: string
}

export interface ExchangeRateQueryParams {
  page?: number
  page_size?: number
  from_currency?: string
  to_currency?: string
  status?: ExchangeRateStatus
}

export interface CreateExchangeRateRequest {
  from_currency: string
  to_currency: string
  rate: number
  effective_at?: string
  remark?: string
}

export interface UpdateExchangeRateStatusRequest {
  status: ExchangeRateStatus
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

export const CURRENCY_OPTIONS = ['USD', 'CNY', 'JPY', 'AUD', 'EUR', 'GBP', 'CAD'].map((value) => ({
  label: value,
  value
}))

export const EXCHANGE_RATE_STATUS_OPTIONS = [
  { label: '启用', value: 'ACTIVE' as ExchangeRateStatus },
  { label: '停用', value: 'INACTIVE' as ExchangeRateStatus }
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
