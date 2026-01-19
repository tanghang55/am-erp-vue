// Shipping module type definitions

import type { Warehouse } from '@/modules/inventory/types'
import type { Sku } from '@/modules/product/types'

export interface Shipment {
  id: number
  shipment_number: string
  order_number?: string
  marketplace?: string
  warehouse_id: number
  status: ShipmentStatus
  carrier?: string
  tracking_number?: string
  shipping_method?: string
  shipping_cost: string
  currency: string
  recipient_name?: string
  recipient_address?: string
  recipient_phone?: string
  shipped_at?: string
  delivered_at?: string
  remark?: string
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
  warehouse?: Warehouse
  items?: ShipmentItem[]
}

export interface ShipmentItem {
  id: number
  shipment_id: number
  sku_id: number
  qty_ordered: number
  qty_shipped: number
  unit_price: string
  currency: string
  subtotal: string
  created_at: string
  updated_at: string
  sku?: Sku
}

export type ShipmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

// API请求参数类型

export interface ShipmentListParams {
  page?: number
  page_size?: number
  status?: ShipmentStatus
  warehouse_id?: number
  marketplace?: string
  keyword?: string
}

export interface CreateShipmentParams {
  order_number?: string
  marketplace?: string
  warehouse_id: number
  carrier?: string
  tracking_number?: string
  shipping_method?: string
  shipping_cost?: number
  currency?: string
  recipient_name?: string
  recipient_address?: string
  recipient_phone?: string
  remark?: string
  items: CreateShipmentItemParams[]
}

export interface CreateShipmentItemParams {
  sku_id: number
  qty_ordered?: number
  qty_shipped: number
  unit_price?: number
}

export interface UpdateShipmentParams {
  order_number?: string
  marketplace?: string
  carrier?: string
  tracking_number?: string
  shipping_method?: string
  shipping_cost?: number
  recipient_name?: string
  recipient_address?: string
  recipient_phone?: string
  remark?: string
}

// UI配置常量

export const SHIPMENT_STATUS_CONFIG = {
  PENDING: {
    label: '待处理',
    color: 'info',
    icon: '📋'
  },
  PROCESSING: {
    label: '处理中',
    color: 'primary',
    icon: '⚙️'
  },
  SHIPPED: {
    label: '已发货',
    color: 'warning',
    icon: '🚚'
  },
  DELIVERED: {
    label: '已签收',
    color: 'success',
    icon: '✅'
  },
  CANCELLED: {
    label: '已取消',
    color: 'danger',
    icon: '❌'
  }
} as const

// 常用站点
export const MARKETPLACES = [
  'Amazon US',
  'Amazon UK',
  'Amazon DE',
  'Amazon FR',
  'Amazon IT',
  'Amazon ES',
  'Amazon JP',
  'eBay',
  'Walmart',
  'Shopify',
  'Other'
] as const

// 常用物流承运商
export const CARRIERS = [
  'FedEx',
  'UPS',
  'DHL',
  'USPS',
  'China Post',
  'SF Express',
  'YTO Express',
  'Other'
] as const
