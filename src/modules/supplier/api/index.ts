import request from '@/utils/request'
import type {
  Supplier,
  SupplierListParams,
  CreateSupplierParams,
  SupplierContact,
  SupplierAccount,
  SupplierTag
} from '../types'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'

export function getSupplierList(params: SupplierListParams) {
  return request<ApiResponse<PaginatedResponse<Supplier>>>({
    url: '/api/v1/suppliers',
    method: 'get',
    params
  })
}

export function getSupplierDetail(id: number) {
  return request<ApiResponse<Supplier>>({
    url: `/api/v1/suppliers/${id}`,
    method: 'get'
  })
}

export function createSupplier(data: CreateSupplierParams) {
  return request<ApiResponse<Supplier>>({
    url: '/api/v1/suppliers',
    method: 'post',
    data
  })
}

export function updateSupplier(id: number, data: Partial<CreateSupplierParams>) {
  return request<ApiResponse<null>>({
    url: `/api/v1/suppliers/${id}`,
    method: 'put',
    data
  })
}

export function deleteSupplier(id: number) {
  return request<ApiResponse<null>>({
    url: `/api/v1/suppliers/${id}`,
    method: 'delete'
  })
}

export function createSupplierContact(
  supplierId: number,
  data: Omit<SupplierContact, 'id' | 'supplier_id' | 'gmt_create' | 'gmt_modified'>
) {
  return request<ApiResponse<SupplierContact>>({
    url: `/api/v1/suppliers/${supplierId}/contacts`,
    method: 'post',
    data
  })
}

export function updateSupplierContact(
  supplierId: number,
  data: Omit<SupplierContact, 'supplier_id' | 'gmt_create' | 'gmt_modified'>
) {
  return request<ApiResponse<SupplierContact>>({
    url: `/api/v1/suppliers/${supplierId}/contacts`,
    method: 'put',
    data
  })
}

export function deleteSupplierContact(supplierId: number, id: number) {
  return request<ApiResponse<null>>({
    url: `/api/v1/suppliers/${supplierId}/contacts`,
    method: 'delete',
    data: { id }
  })
}

export function createSupplierAccount(
  supplierId: number,
  data: Omit<SupplierAccount, 'id' | 'supplier_id' | 'gmt_create' | 'gmt_modified'>
) {
  return request<ApiResponse<SupplierAccount>>({
    url: `/api/v1/suppliers/${supplierId}/accounts`,
    method: 'post',
    data
  })
}

export function updateSupplierAccount(
  supplierId: number,
  data: Omit<SupplierAccount, 'supplier_id' | 'gmt_create' | 'gmt_modified'>
) {
  return request<ApiResponse<SupplierAccount>>({
    url: `/api/v1/suppliers/${supplierId}/accounts`,
    method: 'put',
    data
  })
}

export function deleteSupplierAccount(supplierId: number, id: number) {
  return request<ApiResponse<null>>({
    url: `/api/v1/suppliers/${supplierId}/accounts`,
    method: 'delete',
    data: { id }
  })
}

export function createSupplierTag(
  supplierId: number,
  data: Omit<SupplierTag, 'id' | 'supplier_id' | 'gmt_create' | 'gmt_modified'>
) {
  return request<ApiResponse<SupplierTag>>({
    url: `/api/v1/suppliers/${supplierId}/tags`,
    method: 'post',
    data
  })
}

export function updateSupplierTag(
  supplierId: number,
  data: Omit<SupplierTag, 'supplier_id' | 'gmt_create' | 'gmt_modified'>
) {
  return request<ApiResponse<SupplierTag>>({
    url: `/api/v1/suppliers/${supplierId}/tags`,
    method: 'put',
    data
  })
}

export function deleteSupplierTag(supplierId: number, id: number) {
  return request<ApiResponse<null>>({
    url: `/api/v1/suppliers/${supplierId}/tags`,
    method: 'delete',
    data: { id }
  })
}

export * from './quotes'
