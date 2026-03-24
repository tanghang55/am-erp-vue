import request from '@/utils/request'
import type { ApiResponse } from '@/modules/common/types'
import type { MonitorOverview, MonitorRecentJob, MonitorRecentLog } from '../types'

const BASE_URL = '/api/v1/system/monitor'

export const getMonitorOverview = () =>
  request<ApiResponse<MonitorOverview>>({
    url: `${BASE_URL}/overview`,
    method: 'get'
  })

export const getRecentMonitorJobs = (params?: { status?: string; trace_id?: string; limit?: number }) =>
  request<ApiResponse<MonitorRecentJob[]>>({
    url: `${BASE_URL}/jobs`,
    method: 'get',
    params
  })

export const getRecentMonitorLogs = (params?: { level?: string; trace_id?: string; limit?: number }) =>
  request<ApiResponse<MonitorRecentLog[]>>({
    url: `${BASE_URL}/logs`,
    method: 'get',
    params
  })
