export interface Supplier {
  id: number
  supplier_code: string
  name: string
  status: 'ACTIVE' | 'DISABLED'
  remark?: string
  reference_count?: number
  deletable?: boolean
  delete_block_reason?: string
  gmt_create: string
  gmt_modified: string
  types?: SupplierType[]
  contacts?: SupplierContact[]
  accounts?: SupplierAccount[]
  tags?: SupplierTag[]
}

export type SupplierType = 'PRODUCT' | 'PACKAGING' | 'LOGISTICS'

export interface SupplierContact {
  id: number
  supplier_id: number
  name: string
  phone?: string
  email?: string
  position?: string
  is_primary?: number
  gmt_create?: string
  gmt_modified?: string
}

export interface SupplierAccount {
  id: number
  supplier_id: number
  bank_name: string
  bank_account: string
  currency?: string
  tax_no?: string
  payment_terms?: string
  gmt_create?: string
  gmt_modified?: string
}

export interface SupplierTag {
  id: number
  supplier_id: number
  tag: string
  gmt_create?: string
  gmt_modified?: string
}

export interface SupplierListParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: string
  type?: SupplierType | string
}

export interface CreateSupplierParams {
  supplier_code: string
  name: string
  status?: string
  remark?: string
  types?: SupplierType[]
}

export interface ProductSupplierQuote {
  id: number
  product_id: number
  supplier_id: number
  price: number | string
  currency: string
  qty_moq: number
  lead_time_days: number
  status: string
  remark?: string
  gmt_create?: string
  gmt_modified?: string
  supplier_name?: string
  supplier_code?: string
}

export interface ProductQuoteRow {
  product_id: number
  seller_sku: string
  asin: string
  marketplace: string
  title: string
  image_url?: string
  default_supplier_id: number
  quotes: ProductSupplierQuote[]
}

export interface QuoteListParams {
  page?: number
  page_size?: number
  keyword?: string
  marketplace?: string
  product_id?: number
  product_ids?: number[]
  supplier_id?: number
}

export interface QuoteUpsertParams {
  product_id: number
  supplier_id: number
  price: number
  currency: string
  qty_moq: number
  lead_time_days: number
  status?: string
  remark?: string
}
