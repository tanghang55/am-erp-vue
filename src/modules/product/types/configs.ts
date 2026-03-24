export type ProductConfigType = 'BRAND' | 'DIMENSION_UNIT' | 'WEIGHT_UNIT'

export interface ProductConfigItem {
  id: number
  config_type: ProductConfigType
  item_code: string
  item_name: string
  status: 'ACTIVE' | 'INACTIVE'
  sort: number
  reference_count?: number
  deletable?: boolean
  delete_block_reason?: string
  remark?: string
  gmt_create: string
  gmt_modified: string
}

export interface ProductCategory {
  id: number
  parent_id?: number
  category_code: string
  category_name: string
  level: number
  status: 'ACTIVE' | 'INACTIVE'
  sort: number
  reference_count?: number
  deletable?: boolean
  delete_block_reason?: string
  remark?: string
  gmt_create: string
  gmt_modified: string
  children?: ProductCategory[]
}

export interface SaveProductCategoryParams {
  parent_id?: number
  category_code: string
  category_name: string
  status?: 'ACTIVE' | 'INACTIVE'
  sort?: number
  remark?: string
}

export interface ProductConfigListParams {
  page?: number
  page_size?: number
  keyword?: string
  config_type?: ProductConfigType
  status?: string
}

export interface SaveProductConfigParams {
  config_type: ProductConfigType
  item_code: string
  item_name: string
  status?: 'ACTIVE' | 'INACTIVE'
  sort?: number
  remark?: string
}
