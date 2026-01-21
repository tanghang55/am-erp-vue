// Procurement module type definitions

import type { Supplier } from '@/modules/supplier/types'
import type { Sku } from '@/modules/product/types'

export interface PurchaseOrder {
  id: number
  po_number: string
  supplier_id?: number
  marketplace?: string
  status: PurchaseOrderStatus
  currency: string
  total_amount: string
  ordered_at?: string
  shipped_at?: string
  received_at?: string
  remark?: string
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
  supplier?: Supplier
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  sku_id: number
  qty_ordered: number
  qty_received: number
  unit_cost: string
  currency: string
  subtotal: string
  created_at: string
  updated_at: string
  sku?: Sku
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

export interface CreatePurchaseOrderItemParams {
  sku_id: number
  qty_ordered: number
  unit_cost: number
}

export interface ReceivePurchaseOrderParams {
  received_qties: Record<number, number>  // { item_id: qty }
  warehouse_id: number
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
    label: '已关闭',
    color: '',
    icon: '🔒'
  }
} as const
