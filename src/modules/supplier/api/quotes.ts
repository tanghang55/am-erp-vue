import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
import type { ProductQuoteRow, ProductSupplierQuote, QuoteListParams, QuoteUpsertParams } from '../types'

export function getProductQuoteList(params: QuoteListParams) {
  const query = {
    ...params,
    product_ids: params.product_ids?.length ? params.product_ids.join(',') : undefined
  }
  return request<ApiResponse<PaginatedResponse<ProductQuoteRow>>>({
    url: '/api/v1/suppliers/product-quotes',
    method: 'get',
    params: query
  })
}

export function getProductSupplierQuote(productId: number, supplierId: number) {
  return request<ApiResponse<ProductSupplierQuote>>({
    url: '/api/v1/suppliers/product-quotes/detail',
    method: 'get',
    params: {
      product_id: productId,
      supplier_id: supplierId
    }
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
