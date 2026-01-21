import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/modules/common/types'
import type { AuditLog, AuditLogQueryParams } from '../types'

const BASE_URL = '/api/v1/system'

export const getSystemAuditLogList = (params: AuditLogQueryParams) =>
  request<ApiResponse<PaginatedResponse<AuditLog>>>({
    url: `${BASE_URL}/logs`,
    method: 'get',
    params
  })
