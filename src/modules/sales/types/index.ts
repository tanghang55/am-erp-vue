export type SalesOrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'ALLOCATED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'

export interface SalesOrderItem {
  id: number
  sales_order_id?: number
  line_no: number
  product_id: number
  seller_sku?: string
  product_title?: string
  product_image_url?: string
  qty_ordered: number
  qty_allocated: number
  qty_shipped: number
  qty_returned: number
  unit_price: number
  subtotal: number
  remark?: string | null
}

export interface SalesOrder {
  id: number
  order_no: string
  source_type: string
  external_order_no?: string | null
  sales_channel?: string | null
  marketplace?: string | null
  order_status: SalesOrderStatus
  order_date: string
  confirm_at?: string | null
  allocated_at?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  cancelled_at?: string | null
  currency: string
  order_amount: number
  remark?: string | null
  items: SalesOrderItem[]
  created_at: string
  updated_at: string
}

export interface SalesOrderListParams {
  status?: SalesOrderStatus
  marketplace?: string
  keyword?: string
  page?: number
  page_size?: number
}

export interface SalesOrderListResponse {
  data: SalesOrder[]
  total: number
  page: number
  page_size: number
}

export type ReportImportStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'PARTIAL_SUCCESS'

export interface SalesOrderImportBatch {
  id: number
  batch_no: string
  report_type: string
  file_name: string
  file_hash: string
  status: ReportImportStatus
  total_rows: number
  success_rows: number
  error_rows: number
  message?: string | null
  operator_id?: number | null
  started_at?: string | null
  finished_at?: string | null
  created_at: string
  updated_at: string
}

export interface SalesOrderImportRowError {
  id: number
  report_import_id: number
  row_no: number
  error_code?: string | null
  error_message: string
  raw_row?: string | null
  created_at: string
  updated_at: string
}
