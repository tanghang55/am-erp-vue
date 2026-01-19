import request from '@/utils/request'
import type { ApiResponse } from '@/modules/common/types'

export function getFieldLabels(locale: string) {
  return request<ApiResponse<{ locale: string; labels: Record<string, string> }>>({
    url: '/api/v1/system/field-labels',
    method: 'get',
    params: { locale }
  })
}
