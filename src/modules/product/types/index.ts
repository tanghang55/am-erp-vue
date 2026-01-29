import type { Supplier } from '@/modules/supplier/types'

// Product模块类型定义

export interface Sku {
  id: number
  seller_sku: string
  asin: string
  title: string
  fnsku?: string
  marketplace: 'US' | 'CA' | 'AU' | 'UK' | 'DE' | 'JP'
  parent_id?: number
  combo_id?: number
  is_combo_main?: number
  supplier_id?: number
  supplier_name?: string
  supplier_code?: string
  unit_cost?: string
  weight?: string
  dimensions?: string
  inventory_available?: number
  inventory_reserved?: number
  inventory_inbound?: number
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  image_url?: string
  images?: string[]  // 产品图片数组（最多10张）
  remark?: string
  gmt_create: string
  gmt_modified: string
  supplier?: Supplier
}

export type ProductImageUrl = string

export interface ProductParent {
  id: number
  parent_asin: string
  title: string
  marketplace: 'US' | 'CA' | 'AU' | 'UK' | 'DE' | 'JP'
  brand?: string
  category?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  image_url?: string
  remark?: string
  gmt_create: string
  gmt_modified: string
}

export interface ProductCombo {
  combo_id: number
  main_product: Sku
  products: Sku[]
}

export interface SkuListParams {
  page?: number
  page_size?: number
  marketplace?: string
  status?: string
  supplier_id?: number
  keyword?: string
  warehouse_id?: number       // 仓库ID，如果指定则只返回该仓库有待出库存的产品
  exclude_combo_child?: boolean  // 排除组合子产品
}

export interface CreateSkuParams {
  seller_sku: string
  asin: string
  title: string
  marketplace: string
  parent_id?: number
  combo_id?: number
  is_combo_main?: boolean
  supplier_id?: number
  unit_cost?: number
  fnsku?: string
  weight?: number
  dimensions?: string
  image_url?: string
  remark?: string
}

export interface ComboUpsertParams {
  main_product_id: number
  product_ids: number[]
}

export interface ProductParentListParams {
  page?: number
  page_size?: number
  keyword?: string
  marketplace?: string
}

export interface CreateProductParentParams {
  parent_asin: string
  title: string
  marketplace: string
  brand?: string
  category?: string
  status?: string
  image_url?: string
  remark?: string
}

// ============= 产品包材配置 =============

/**
 * 产品包材配置项
 */
export interface ProductPackagingItem {
  id?: number
  product_id?: number
  packaging_item_id: number
  quantity_per_unit: number  // 每个产品需要的包材数量
  notes?: string
  // 包材信息（关联查询时返回）
  packaging_item?: {
    id: number
    item_code: string
    item_name: string
    specification?: string
    unit: string
    unit_cost: number
    currency: string
    quantity_on_hand: number
  }
}

/**
 * 创建/更新产品包材配置参数
 */
export interface SaveProductPackagingParams {
  packaging_items: Array<{
    packaging_item_id: number
    quantity_per_unit: number
    notes?: string
  }>
}
