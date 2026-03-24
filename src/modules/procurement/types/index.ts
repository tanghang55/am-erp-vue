// Procurement module type definitions

import type { Supplier } from '@/modules/supplier/types'
import type { ProductSummary } from '@/modules/product/types'

export interface PurchaseOrder {
  id: number
  po_number: string
  batch_no?: string
  supplier_id?: number
  warehouse_id?: number
  marketplace?: string
  status: PurchaseOrderStatus
  currency: string
  total_amount: string
  ordered_at?: string
  ordered_by?: number
  ordered_by_name?: string
  shipped_at?: string
  shipped_by?: number
  shipped_by_name?: string
  received_at?: string
  received_by?: number
  received_by_name?: string
  inspected_at?: string
  inspected_by?: number
  inspected_by_name?: string
  closed_at?: string
  completed_by?: number
  completed_by_name?: string
  is_force_completed?: number
  force_completed_at?: string
  force_completed_by?: number
  force_completed_by_name?: string
  force_complete_reason?: string
  remark?: string
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
  supplier?: Supplier
  items?: PurchaseOrderItem[]
  qty_pending_inspection_total?: number
}

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  product_id: number
  qty_ordered: number
  qty_received: number
  qty_inspection_pass?: number
  qty_inspection_fail?: number
  qty_pending_inspection?: number
  unit_cost: string
  currency: string
  subtotal: string
  created_at: string
  updated_at: string
  product?: ProductSummary
}

export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'SHIPPED' | 'RECEIVED' | 'CLOSED'

// API请求参数类型

export interface PurchaseOrderListParams {
  page?: number
  page_size?: number
  status?: PurchaseOrderStatus
  supplier_id?: number
  marketplace?: string
  keyword?: string
}

export interface CreatePurchaseOrderParams {
  supplier_id?: number
  marketplace?: string
  currency?: string
  remark?: string
  items: CreatePurchaseOrderItemParams[]
}

export interface CreatePurchaseOrderBatchParams {
  orders: CreatePurchaseOrderParams[]
}

export interface CreatePurchaseOrderItemParams {
  product_id: number
  qty_ordered: number
  unit_cost: number
}

export interface ShipPurchaseOrderParams {
  warehouse_id: number
}

export interface ReceivePurchaseOrderParams {
  received_qties: Record<number, number>  // { item_id: qty }
  warehouse_id?: number
}

export interface InspectPurchaseOrderParams {
  pass_qties: Record<number, number>
  fail_qties: Record<number, number>
}

export interface ForceCompletePurchaseOrderParams {
  reason: string
}

export interface ReplenishmentConfig {
  id: number
  is_enabled: number
  interval_minutes: number
  demand_window_days: number
  default_lead_time_days: number
  default_safety_days: number
  default_moq: number
  default_order_multiple: number
  last_generated_date?: string
  last_cleanup_date?: string
  created_at?: string
  updated_at?: string
}

export interface ReplenishmentStrategy {
  id: number
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
  created_at?: string
  updated_at?: string
  seller_sku?: string
  product_title?: string
  warehouse_code?: string
  warehouse_name?: string
  supplier_code?: string
  supplier_name?: string
}

export interface ReplenishmentPlan {
  id: number
  plan_date: string
  product_id: number
  seller_sku?: string
  product_title?: string
  product_image_url?: string
  warehouse_id: number
  warehouse_code?: string
  warehouse_name?: string
  supplier_id?: number
  supplier_code?: string
  supplier_name?: string
  strategy_id?: number
  strategy_name?: string
  daily_demand: number
  demand_window_days: number
  coverage_days: number
  net_supply: number
  target_stock: number
  shortage_qty: number
  suggested_qty: number
  moq: number
  order_multiple: number
  unit_cost?: number
  status: 'PENDING' | 'CONVERTED' | 'CANCELLED'
  purchase_order_id?: number
  purchase_order_number?: string
  purchase_order_numbers?: string
  converted_at?: string
  remark?: string
  packaging_shortage_qty?: number
  packaging_alert?: string
  created_at?: string
  updated_at?: string
}

export interface ReplenishmentRun {
  id: number
  run_no: string
  trigger_type: 'SCHEDULED' | 'MANUAL'
  status: 'RUNNING' | 'SUCCESS' | 'FAILED'
  window_days: number
  started_at?: string
  finished_at?: string
  input_summary?: string
  output_summary?: string
  error_message?: string
  created_by?: number
  created_at?: string
  updated_at?: string
}

// UI配置常量

export const PURCHASE_ORDER_STATUS_CONFIG = {
  DRAFT: {
    label: '草稿',
    color: 'info',
    icon: '📝'
  },
  ORDERED: {
    label: '已下单',
    color: 'primary',
    icon: '📋'
  },
  SHIPPED: {
    label: '已发货',
    color: 'warning',
    icon: '🚚'
  },
  RECEIVED: {
    label: '已收货',
    color: 'success',
    icon: '✅'
  },
  CLOSED: {
    label: '已完成',
    color: '',
    icon: '🔒'
  }
} as const
