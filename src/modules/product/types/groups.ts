import type { ProductSummary } from './products'

export interface ProductGroup {
  id: number
  parent_asin: string
  title: string
  marketplace: 'US' | 'CA' | 'AU' | 'UK' | 'DE' | 'JP'
  brand?: string
  category?: string
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'
  image_url?: string
  remark?: string
  child_count: number
  active_child_count: number
  inactive_child_count: number
  children?: ProductSummary[]
  gmt_create: string
  gmt_modified: string
}

export interface ProductGroupListParams {
  page?: number
  page_size?: number
  keyword?: string
  marketplace?: string
  status?: string
  has_children?: string
}

export interface CreateProductGroupParams {
  parent_asin: string
  title: string
  marketplace: string
  brand?: string
  category?: string
  status?: string
  image_url?: string
  remark?: string
}

export interface AttachProductGroupChildrenParams {
  child_ids: number[]
}
