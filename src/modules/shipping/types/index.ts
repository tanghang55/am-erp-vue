// Shipping module type definitions

import type { Warehouse } from '@/modules/inventory/types'
import type { Sku } from '@/modules/product/types'

// ============= Package Spec (装箱规格) =============

export interface PackageSpec {
  id: number
  name: string
  length: number
  width: number
  height: number
  weight: number
  quantity_per_box: number  // 每箱产品数量
  remark?: string
  status: PackageSpecStatus
  created_by?: number
  updated_by?: number
  gmt_create: string
  gmt_modified: string
}

export type PackageSpecStatus = 'ACTIVE' | 'INACTIVE'

export interface PackageSpecListParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: string
}

export interface CreatePackageSpecParams {
  name: string
  length: number
  width: number
  height: number
  weight: number
  quantity_per_box: number
  remark?: string
}

export interface UpdatePackageSpecParams {
  name?: string
  length?: number
  width?: number
  height?: number
  weight?: number
  quantity_per_box?: number
  remark?: string
  status?: string
}

// ============= Shipment =============

export interface Shipment {
  id: number
  shipment_number: string

  // 基础信息
  order_number?: string
  sales_channel?: string
  warehouse_id: number

  // 收货方信息
  destination_type?: DestinationType
  destination_name?: string
  destination_code?: string
  destination_contact?: string
  destination_phone?: string
  destination_address?: string

  // 物流信息
  carrier?: string
  shipping_method?: string
  tracking_number?: string

  // 包装信息
  box_count?: number
  total_weight?: number
  total_volume?: number

  // 费用
  shipping_cost: number
  currency: string

  // 时间节点
  ship_date?: string
  expected_delivery_date?: string
  actual_delivery_date?: string

  // 状态
  status: ShipmentStatus
  inventory_locked: boolean
  inventory_deducted: boolean

  // 备注
  remark?: string
  internal_notes?: string

  // 审计
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string

  // 关联
  warehouse?: Warehouse
  items?: ShipmentItem[]
}

export interface ShipmentItem {
  id: number
  shipment_id: number
  sku_id: number

  // 数量
  quantity_planned: number
  quantity_shipped: number

  // 装箱信息
  package_spec_id?: number
  box_quantity: number

  // 成本
  unit_cost: number
  currency: string

  // 备注
  remark?: string

  created_at: string
  updated_at: string

  // 关联
  sku?: Sku
  package_spec?: PackageSpec
}

export type ShipmentStatus = 'DRAFT' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export type DestinationType = 'PLATFORM_WAREHOUSE' | 'CUSTOMER' | 'OWN_WAREHOUSE' | 'SUPPLIER' | 'OTHER'

// API请求参数类型

export interface ShipmentListParams {
  page?: number
  page_size?: number
  status?: ShipmentStatus
  warehouse_id?: number
  order_number?: string
  tracking_number?: string
  keyword?: string
  date_from?: string
  date_to?: string
}

export interface CreateShipmentParams {
  order_number?: string
  sales_channel?: string
  warehouse_id: number

  destination_type?: DestinationType
  destination_name?: string
  destination_code?: string
  destination_contact?: string
  destination_phone?: string
  destination_address?: string

  carrier?: string
  shipping_method?: string
  expected_ship_date?: string
  expected_delivery_date?: string

  box_count?: number
  total_weight?: number
  total_volume?: number

  remark?: string
  internal_notes?: string

  items: CreateShipmentItemParams[]
}

export interface CreateShipmentItemParams {
  sku_id: number
  quantity_planned: number
  package_spec_id?: number
  box_quantity?: number
  unit_cost?: number
  currency?: string
  remark?: string
}

export interface MarkShippedParams {
  carrier?: string
  tracking_number?: string
  shipping_cost?: number
  currency?: string
  ship_date?: string
  remark?: string
}

export interface MarkDeliveredParams {
  actual_delivery_date?: string
  remark?: string
}

// UI配置常量

export const SHIPMENT_STATUS_CONFIG = {
  DRAFT: {
    label: '草稿',
    color: 'info',
    icon: '📝',
    description: '发货单草稿，可编辑'
  },
  CONFIRMED: {
    label: '已确认',
    color: 'primary',
    icon: '✓',
    description: '库存已锁定'
  },
  PACKED: {
    label: '已打包',
    color: 'warning',
    icon: '📦',
    description: '库存已扣减到待出'
  },
  SHIPPED: {
    label: '已发货',
    color: 'warning',
    icon: '🚚',
    description: '已交给物流'
  },
  DELIVERED: {
    label: '已送达',
    color: 'success',
    icon: '✅',
    description: '已送达目的地'
  },
  CANCELLED: {
    label: '已取消',
    color: 'danger',
    icon: '❌',
    description: '已取消'
  }
} as const

export const DESTINATION_TYPE_CONFIG = {
  PLATFORM_WAREHOUSE: {
    label: '平台仓库',
    description: 'Amazon FBA、eBay海外仓等'
  },
  CUSTOMER: {
    label: '客户',
    description: '直接发给客户'
  },
  OWN_WAREHOUSE: {
    label: '自有仓库',
    description: '仓库间调拨'
  },
  SUPPLIER: {
    label: '供应商',
    description: '退货给供应商'
  },
  OTHER: {
    label: '其他',
    description: '其他情况'
  }
} as const
