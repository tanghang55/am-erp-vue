import type { ProductSalesStatus, ProductSummary } from './products'

export interface ProductComboChild extends ProductSummary {
  qty_ratio: number
}

export interface ProductCombo {
  combo_id: number
  main_product: ProductSummary
  products: ProductComboChild[]
  locked: boolean
  lock_reason?: string
}

export interface ProductComboListParams {
  page?: number
  page_size?: number
  keyword?: string
  marketplace?: string
  statuses?: ProductSalesStatus[]
  locked?: string
}

export interface ComboUpsertParams {
  main_product_id: number
  children: Array<{
    product_id: number
    qty_ratio: number
  }>
}
