// Product模块类型定义

export interface Supplier {
  id: number
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  status: 'ACTIVE' | 'DISABLED'
  created_at: string
  updated_at: string
}

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
  unit_cost?: string
  weight?: string
  dimensions?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  image_url?: string
  images?: string[]  // 产品图片数组（最多10张）
  remark?: string
  created_at: string
  updated_at: string
  supplier?: Supplier
}

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
  created_at: string
  updated_at: string
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

export interface SupplierListParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: string
}

export interface CreateSupplierParams {
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  status?: string
  remark?: string
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
