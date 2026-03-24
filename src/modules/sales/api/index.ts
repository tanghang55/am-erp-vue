import request from '@/utils/request'
import type { ApiResponse } from '@/modules/common/types'
import type {
  SalesOrder,
  SalesOrderImportBatch,
  SalesOrderImportRowError,
  SalesOrderListParams,
  SalesOrderListResponse
} from '../types'

const BASE_URL = '/api/v1/sales/orders'

export function getSalesOrderList(params: SalesOrderListParams) {
  return request<ApiResponse<SalesOrderListResponse>>({
    url: BASE_URL,
    method: 'get',
    params
  })
}

export function getSalesOrderDetail(id: number) {
  return request<ApiResponse<SalesOrder>>({
    url: `${BASE_URL}/${id}`,
    method: 'get'
  })
}

export function confirmSalesOrder(id: number) {
  return request<ApiResponse<null>>({
    url: `${BASE_URL}/${id}/confirm`,
    method: 'post'
  })
}

export function cancelSalesOrder(id: number) {
  return request<ApiResponse<null>>({
    url: `${BASE_URL}/${id}/cancel`,
    method: 'post'
  })
}

export function allocateSalesOrder(
  id: number,
  payload: { warehouse_id: number; lines: Array<{ item_id: number; qty_allocated: number }> }
) {
  return request<ApiResponse<null>>({
    url: `${BASE_URL}/${id}/allocate`,
    method: 'post',
    data: payload
  })
}

export function shipSalesOrder(
  id: number,
  payload: { warehouse_id: number; lines: Array<{ item_id: number; qty_shipped: number }> }
) {
  return request<ApiResponse<null>>({
    url: `${BASE_URL}/${id}/ship`,
    method: 'post',
    data: payload
  })
}

export function deliverSalesOrder(id: number) {
  return request<ApiResponse<null>>({
    url: `${BASE_URL}/${id}/deliver`,
    method: 'post'
  })
}

export function returnSalesOrder(
  id: number,
  payload: { warehouse_id: number; lines: Array<{ item_id: number; qty_returned: number }> }
) {
  return request<ApiResponse<null>>({
    url: `${BASE_URL}/${id}/return`,
    method: 'post',
    data: payload
  })
}

export function importSalesOrders(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  return request<ApiResponse<SalesOrderImportBatch>>({
    url: `${BASE_URL}/import`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getSalesOrderImportBatches(params: { page?: number; page_size?: number } = {}) {
  return request<ApiResponse<{ data: SalesOrderImportBatch[]; total: number; page: number; page_size: number }>>({
    url: `${BASE_URL}/imports`,
    method: 'get',
    params
  })
}

export function getSalesOrderImportBatch(id: number) {
  return request<ApiResponse<SalesOrderImportBatch>>({
    url: `${BASE_URL}/imports/${id}`,
    method: 'get'
  })
}

export function getSalesOrderImportErrors(id: number) {
  return request<ApiResponse<SalesOrderImportRowError[]>>({
    url: `${BASE_URL}/imports/${id}/errors`,
    method: 'get'
  })
}
