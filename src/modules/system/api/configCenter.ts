import request from '@/utils/request'
import type { ApiResponse } from '@/modules/common/types'
import type {
  ConfigCenterModuleDetail,
  ConfigCenterModuleSummary,
  UpdateConfigCenterModuleRequest
} from '../types/configCenter'

const BASE_URL = '/api/v1/system/config-center'

export const getConfigCenterModules = () =>
  request<ApiResponse<ConfigCenterModuleSummary[]>>({
    url: `${BASE_URL}/modules`,
    method: 'get'
  })

export const getConfigCenterModule = (moduleCode: string) =>
  request<ApiResponse<ConfigCenterModuleDetail>>({
    url: `${BASE_URL}/modules/${moduleCode}`,
    method: 'get'
  })

export const updateConfigCenterModule = (moduleCode: string, data: UpdateConfigCenterModuleRequest) =>
  request<ApiResponse<ConfigCenterModuleDetail>>({
    url: `${BASE_URL}/modules/${moduleCode}`,
    method: 'put',
    data
  })
