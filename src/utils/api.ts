/**
 * API 响应统一解析工具
 * 用于处理后端返回的数据格式，确保前端统一使用
 */

// API响应格式（request.ts拦截器返回的格式）
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
}

// 分页数据格式（后端PageData）
export interface PageData<T = any> {
  data: T[]
  total: number
  page?: number
}

// 解析后的分页结果
export interface ParsedPageResult<T = any> {
  items: T[]
  total: number
  page?: number
}

/**
 * 解析分页响应数据
 *
 * @param response API响应对象
 * @returns 解析后的分页结果
 *
 * @example
 * ```typescript
 * const response = await getProviders({ page: 1, page_size: 20 })
 * const { items, total } = parsePaginatedResponse(response)
 * list.value = items
 * pagination.total = total
 * ```
 */
export function parsePaginatedResponse<T = any>(
  response: ApiResponse<PageData<T>>
): ParsedPageResult<T> {
  const pageData = response.data || {}

  return {
    items: pageData.data || [],
    total: pageData.total || 0,
    page: pageData.page
  }
}

/**
 * 解析单个对象响应数据
 *
 * @param response API响应对象
 * @returns 数据对象
 *
 * @example
 * ```typescript
 * const response = await getProvider(id)
 * const provider = parseResponse(response)
 * ```
 */
export function parseResponse<T = any>(response: ApiResponse<T>): T {
  return response.data
}

/**
 * 检查响应是否成功
 *
 * @param response API响应对象
 * @returns 是否成功
 */
export function isSuccess(response: ApiResponse): boolean {
  return response.success === true
}
