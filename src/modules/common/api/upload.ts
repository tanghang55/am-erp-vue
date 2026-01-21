import request from '@/utils/request'
import type { UploadResponse, ApiResponse } from '../types'

/**
 * Upload image file
 * @param file File to upload
 * @param subDir Subdirectory (default: 'products')
 * @returns Promise with uploaded file URL
 */
export function uploadImage(file: File, subDir: string = 'products') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('subDir', subDir)

  return request<ApiResponse<UploadResponse>>({
    url: '/api/v1/upload/image',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
