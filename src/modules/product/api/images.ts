import { uploadImage } from '@/modules/common/api/upload'
import request from '@/utils/request'
import type { ApiResponse } from '@/modules/common/types'
import type { ProductImageUrl } from '../types'

export function getProductImageList(id: number) {
  return request<ApiResponse<ProductImageUrl[]>>({
    url: `/api/v1/products/${id}/images`,
    method: 'get'
  })
}

export function saveProductImageOrder(id: number, imageUrls: string[]) {
  return request<ApiResponse<ProductImageUrl[]>>({
    url: `/api/v1/products/${id}/images/reorder`,
    method: 'put',
    data: { image_urls: imageUrls }
  })
}

export async function uploadProductImage(_id: number, file: File) {
  const res = await uploadImage(file, 'products')
  return {
    success: true,
    data: {
      url: res.data.url
    }
  }
}

export function deleteProductImage(id: number, imageUrls: string[]) {
  return saveProductImageOrder(id, imageUrls)
}

export function setPrimaryProductImage(id: number, imageUrls: string[]) {
  return saveProductImageOrder(id, imageUrls)
}
