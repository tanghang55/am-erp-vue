// 共享类型定义

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
}

export interface PaginatedResponse<T = any> {
  total: number
  page: number
  page_size: number
  data: T[]
}

export interface UploadResponse {
  url: string
  filename: string
}
