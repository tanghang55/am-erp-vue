// Inventory module type definitions

import type { ProductSummary } from '@/modules/product/types'

export interface Warehouse {
  id: number
  code: string
  name: string
  type: 'FBA' | 'THIRD_PARTY' | 'OWN'
  country?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED'
  remark?: string
  created_by?: number
  updated_by?: number
  created_at: string
  updated_at: string
  reference_count?: number
  deletable?: boolean
  delete_block_reason?: string
}

export interface InventoryBalance {
  id: number
  product_id: number
  warehouse_id: number
  available_quantity: number
  reserved_quantity: number
  damaged_quantity: number
  // 库存状态字段
  purchasing_in_transit: number   // 采购在途库存
  pending_inspection: number      // 待检库存
  raw_material: number            // 原料库存(上架库存)
  pending_shipment: number        // 待出库存
  logistics_in_transit: number    // 物流在途库存
  sellable: number                // 可售库存
  returned: number                // 退货库存
  total_quantity: number
  last_movement_at?: string
  created_at: string
  updated_at: string
  product?: ProductSummary
  warehouse?: Warehouse
}

export type InventoryLotStatus = 'OPEN' | 'CLOSED'

export interface InventoryLot {
  id: number
  product_id: number
  warehouse_id: number
  lot_no: string
  source_type?: string
  source_id?: number
  source_number?: string
  received_at: string
  unit_cost?: number
  qty_in: number
  qty_available: number
  qty_reserved: number
  qty_consumed: number
  status: InventoryLotStatus
  remark?: string
  created_at: string
  updated_at: string
  product?: {
    id: number
    seller_sku: string
    title: string
    asin?: string
  }
  warehouse?: {
    id: number
    code: string
    name: string
  }
}

export interface InventoryMovement {
  id: number
  trace_id?: string
  product_id: number
  warehouse_id: number
  movement_type: MovementType
  reference_type?: string
  reference_id?: number
  reference_number?: string
  quantity: number
  before_available?: number
  after_available?: number
  before_reserved?: number
  after_reserved?: number
  before_damaged?: number
  after_damaged?: number
  unit_cost?: string
  total_cost?: string
  remark?: string
  operator_id?: number
  operated_at: string
  created_at: string
  product?: ProductSummary
  warehouse?: Warehouse
  operator?: {
    id: number
    username: string
    real_name?: string
  }
}

export type MovementType =
  | 'PURCHASE_RECEIPT'       // 采购入库
  | 'SALES_SHIPMENT'         // 销售出库
  | 'STOCK_TAKE_ADJUSTMENT'  // 盘点调整
  | 'MANUAL_ADJUSTMENT'      // 手工调整
  | 'DAMAGE_WRITE_OFF'       // 损坏报损
  | 'RETURN_RECEIPT'         // 退货入库
  | 'TRANSFER_OUT'           // 调拨出库
  | 'TRANSFER_IN'            // 调拨入库
  // 库存状态流转类型
  | 'PURCHASE_SHIP'          // 供应商发货
  | 'WAREHOUSE_RECEIVE'      // 到仓收货
  | 'INSPECTION_PASS'        // 质检通过
  | 'INSPECTION_FAIL'        // 质检不合格
  | 'ASSEMBLY_CONSUME'       // 组装耗料
  | 'ASSEMBLY_COMPLETE'      // 组装完成
  | 'PACKING_SKIP_COMPLETE'  // 免打包直通
  | 'LOGISTICS_SHIP'         // 物流发货
  | 'PLATFORM_RECEIVE'       // 平台上架
  | 'RETURN_INSPECT'         // 退货质检

export const NON_CREATABLE_MOVEMENT_TYPES = [
  'PURCHASE_RECEIPT',
  'SALES_SHIPMENT',
  'RETURN_RECEIPT',
  'PURCHASE_SHIP',
  'WAREHOUSE_RECEIVE',
  'INSPECTION_PASS',
  'INSPECTION_FAIL',
  'ASSEMBLY_COMPLETE',
  'PACKING_SKIP_COMPLETE',
  'LOGISTICS_SHIP',
  'PLATFORM_RECEIVE'
] as const

// API请求参数类型

export interface WarehouseListParams {
  page?: number
  page_size?: number
  type?: string
  status?: string
  keyword?: string
}

export interface BalanceListParams {
  page?: number
  page_size?: number
  warehouse_id?: number
  product_id?: number
  low_stock?: boolean
  low_stock_threshold?: number
  zero_stock?: boolean
  keyword?: string
}

export interface MovementListParams {
  page?: number
  page_size?: number
  product_id?: number
  warehouse_id?: number
  movement_type?: MovementType
  date_from?: string
  date_to?: string
}

export interface InventoryLotListParams {
  page?: number
  page_size?: number
  product_id?: number
  warehouse_id?: number
  status?: InventoryLotStatus
  keyword?: string
}

export interface CreateWarehouseParams {
  code: string
  name: string
  type: 'FBA' | 'THIRD_PARTY' | 'OWN'
  country?: string
  address?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  status?: 'ACTIVE' | 'INACTIVE'
  remark?: string
}

export interface CreateMovementParams {
  product_id: number
  warehouse_id: number
  quantity: number
  reference_type?: string
  reference_id?: number
  reference_number?: string
  unit_cost?: number
  remark?: string
  operator_id?: number
  operated_at?: string
}

export interface CreateTransferParams {
  product_id: number
  from_warehouse_id: number
  to_warehouse_id: number
  quantity: number
  unit_cost?: number
  remark?: string
  operator_id?: number
  reference_type?: string
  reference_number?: string
}

// 流水类型配置（用于UI显示）
export const MOVEMENT_TYPE_CONFIG = {
  PURCHASE_RECEIPT: {
    label: '采购入库',
    color: 'success',
    icon: '📦'
  },
  SALES_SHIPMENT: {
    label: '销售出库',
    color: 'primary',
    icon: '📤'
  },
  STOCK_TAKE_ADJUSTMENT: {
    label: '盘点调整',
    color: 'warning',
    icon: '📊'
  },
  MANUAL_ADJUSTMENT: {
    label: '手工调整',
    color: 'info',
    icon: '✏️'
  },
  DAMAGE_WRITE_OFF: {
    label: '损坏报损',
    color: 'danger',
    icon: '💥'
  },
  RETURN_RECEIPT: {
    label: '退货入库',
    color: 'success',
    icon: '↩️'
  },
  TRANSFER_OUT: {
    label: '调拨出库',
    color: 'warning',
    icon: '🔄'
  },
  TRANSFER_IN: {
    label: '调拨入库',
    color: 'success',
    icon: '🔄'
  },
  // 库存状态流转类型
  PURCHASE_SHIP: {
    label: '供应商发货',
    color: 'info',
    icon: '🚚'
  },
  WAREHOUSE_RECEIVE: {
    label: '到仓收货',
    color: 'success',
    icon: '🏭'
  },
  INSPECTION_PASS: {
    label: '质检通过',
    color: 'success',
    icon: '✅'
  },
  INSPECTION_FAIL: {
    label: '质检不合格',
    color: 'danger',
    icon: '❌'
  },
  ASSEMBLY_CONSUME: {
    label: '打包耗材',
    color: 'warning',
    icon: '📦'
  },
  ASSEMBLY_COMPLETE: {
    label: '打包完成',
    color: 'primary',
    icon: '📤'
  },
  PACKING_SKIP_COMPLETE: {
    label: '免打包转待出',
    color: 'success',
    icon: '📦'
  },
  LOGISTICS_SHIP: {
    label: '物流发货',
    color: 'info',
    icon: '✈️'
  },
  PLATFORM_RECEIVE: {
    label: '平台上架',
    color: 'success',
    icon: '🏪'
  },
  RETURN_INSPECT: {
    label: '退货质检',
    color: 'warning',
    icon: '🔍'
  }
} as const

export const MOVEMENT_TYPE_LABELS: Record<MovementType, { zh: string; en: string }> = {
  PURCHASE_RECEIPT: { zh: '采购入库', en: 'Purchase Receipt' },
  SALES_SHIPMENT: { zh: '销售出库', en: 'Sales Shipment' },
  STOCK_TAKE_ADJUSTMENT: { zh: '盘点调整', en: 'Stock Take Adjustment' },
  MANUAL_ADJUSTMENT: { zh: '手工调整', en: 'Manual Adjustment' },
  DAMAGE_WRITE_OFF: { zh: '损坏报损', en: 'Damage Write-off' },
  RETURN_RECEIPT: { zh: '退货入库', en: 'Return Receipt' },
  TRANSFER_OUT: { zh: '调拨出库', en: 'Transfer Out' },
  TRANSFER_IN: { zh: '调拨入库', en: 'Transfer In' },
  PURCHASE_SHIP: { zh: '供应商发货', en: 'Purchase Ship' },
  WAREHOUSE_RECEIVE: { zh: '到仓收货', en: 'Warehouse Receive' },
  INSPECTION_PASS: { zh: '质检通过', en: 'Inspection Pass' },
  INSPECTION_FAIL: { zh: '质检不合格', en: 'Inspection Fail' },
  ASSEMBLY_CONSUME: { zh: '打包耗材', en: 'Packing Consume' },
  ASSEMBLY_COMPLETE: { zh: '打包完成', en: 'Packing Complete' },
  PACKING_SKIP_COMPLETE: { zh: '免打包转待出', en: 'Skip Packing Complete' },
  LOGISTICS_SHIP: { zh: '物流发货', en: 'Logistics Ship' },
  PLATFORM_RECEIVE: { zh: '平台上架', en: 'Platform Receive' },
  RETURN_INSPECT: { zh: '退货质检', en: 'Return Inspect' }
}

export const CREATABLE_MOVEMENT_TYPE_CONFIG = Object.fromEntries(
  Object.entries(MOVEMENT_TYPE_CONFIG).filter(
    ([type]) => !NON_CREATABLE_MOVEMENT_TYPES.includes(type as (typeof NON_CREATABLE_MOVEMENT_TYPES)[number])
  )
) as Record<Exclude<MovementType, (typeof NON_CREATABLE_MOVEMENT_TYPES)[number]>, typeof MOVEMENT_TYPE_CONFIG[keyof typeof MOVEMENT_TYPE_CONFIG]>

export const getMovementTypeLabel = (type: MovementType, isEnglish: boolean) =>
  MOVEMENT_TYPE_LABELS[type]?.[isEnglish ? 'en' : 'zh'] || type

// 仓库类型配置
export const WAREHOUSE_TYPE_CONFIG = {
  FBA: { label: 'Amazon FBA', color: 'primary' },
  THIRD_PARTY: { label: '第三方仓库', color: 'info' },
  OWN: { label: '自有仓库', color: 'success' }
} as const

// 仓库状态配置
export const WAREHOUSE_STATUS_CONFIG = {
  ACTIVE: { label: '启用', color: 'success' },
  INACTIVE: { label: '停用', color: 'warning' },
  CLOSED: { label: '关闭', color: 'danger' }
} as const
