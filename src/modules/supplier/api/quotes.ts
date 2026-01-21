import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
import type { ProductQuoteRow, QuoteListParams, QuoteUpsertParams } from '../types'

export function getProductQuoteList(params: QuoteListParams) {
  return request<ApiResponse<PaginatedResponse<ProductQuoteRow>>>({
    url: '/api/v1/suppliers/product-quotes',
    method: 'get',
    params
  })
}

export function createQuote(data: QuoteUpsertParams) {
  return request<ApiResponse<null>>({
    url: '/api/v1/suppliers/product-quotes',
    method: 'post',
    data
  })
}

export function updateQuote(data: QuoteUpsertParams) {
  return request<ApiResponse<null>>({
    url: '/api/v1/suppliers/product-quotes',
    method: 'put',
    data
  })
}

export function deleteQuote(productId: number, supplierId: number) {
  return request<ApiResponse<null>>({
    url: '/api/v1/suppliers/product-quotes',
    method: 'delete',
    data: {
      product_id: productId,
      supplier_id: supplierId
    }
  })
}

export function setDefaultSupplier(productId: number, supplierId: number) {
  return request<ApiResponse<null>>({
    url: '/api/v1/suppliers/product-quotes/default',
    method: 'post',
    data: {
      product_id: productId,
      supplier_id: supplierId
    }
  })
}
