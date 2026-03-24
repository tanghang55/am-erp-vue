import type { Supplier } from '@/modules/supplier/types'

export type ProductSalesStatus = 'DRAFT' | 'ON_SALE' | 'REPLENISHING' | 'OFF_SHELF'

export interface ProductSummary {
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
  brand_id?: number
  brand_name?: string
  category_id?: number
  category_name?: string
  dimension_unit_id?: number
  dimension_unit_name?: string
  weight_unit_id?: number
  weight_unit_name?: string
  is_inspection_required?: number
  is_packing_required?: number
  unit_cost?: string
  weight?: string
  length?: string
  width?: string
  height?: string
  dimensions?: string
  inventory_available?: number
  inventory_reserved?: number
  inventory_inbound?: number
  status: ProductSalesStatus
  image_url?: string
  images?: string[]
  remark?: string
  reference_count?: number
  deletable?: boolean
  delete_block_reason?: string
  updated_by_name?: string
  gmt_create: string
  gmt_modified: string
  supplier?: Supplier
}

export interface ProductListParams {
  page?: number
  page_size?: number
  marketplace?: string
  status?: string
  statuses?: ProductSalesStatus[]
  supplier_id?: number
  brand_id?: number
  category_id?: number
  keyword?: string
  warehouse_id?: number
  only_standalone?: boolean
  exclude_combo_child?: boolean
  parent_id?: number
  only_parentless?: boolean
  only_with_packaging?: boolean
  packing_required?: number
}

export interface CreateProductParams {
  seller_sku: string
  asin: string
  title: string
  marketplace: string
  status?: ProductSalesStatus
  parent_id?: number
  combo_id?: number
  is_combo_main?: number
  supplier_id?: number
  brand_id?: number
  category_id?: number
  dimension_unit_id?: number
  weight_unit_id?: number
  is_inspection_required?: number
  is_packing_required?: number
  unit_cost?: number
  fnsku?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  dimensions?: string
  image_url?: string
  remark?: string
}
