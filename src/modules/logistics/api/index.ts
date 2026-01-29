import request from '@/utils/request'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type {
  LogisticsProvider,
  ShippingRate,
  CreateProviderParams,
  UpdateProviderParams,
  ProviderListParams,
  CreateRateParams,
  UpdateRateParams,
  RateListParams,
  QueryLatestRateParams,
  LogisticsService,
  CreateLogisticsServiceParams,
  UpdateLogisticsServiceParams,
  LogisticsServiceListParams
} from '../types'

// ==================== 物流供应商 API ====================

/**
 * 获取物流供应商列表
 */
export function getProviders(params?: ProviderListParams) {
  return request<ApiResponse<PaginatedResponse<LogisticsProvider>>>({
    url: '/api/v1/logistics-providers',
    method: 'get',
    params
  })
}

/**
 * 获取物流供应商详情
 */
export function getProvider(id: number) {
  return request<ApiResponse<LogisticsProvider>>({
    url: `/api/v1/logistics-providers/${id}`,
    method: 'get'
  })
}

/**
 * 创建物流供应商
 */
export function createProvider(data: CreateProviderParams) {
  return request<ApiResponse<LogisticsProvider>>({
    url: '/api/v1/logistics-providers',
    method: 'post',
    data
  })
}

/**
 * 更新物流供应商
 */
export function updateProvider(id: number, data: UpdateProviderParams) {
  return request<ApiResponse<LogisticsProvider>>({
    url: `/api/v1/logistics-providers/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除物流供应商
 */
export function deleteProvider(id: number) {
  return request<ApiResponse<void>>({
    url: `/api/v1/logistics-providers/${id}`,
    method: 'delete'
  })
}

// ==================== 运费报价 API ====================

/**
 * 获取运费报价列表
 */
export function getShippingRates(params?: RateListParams) {
  return request<ApiResponse<PaginatedResponse<ShippingRate>>>({
    url: '/api/v1/shipping-rates',
    method: 'get',
    params
  })
}

/**
 * 获取运费报价详情
 */
export function getShippingRate(id: number) {
  return request<ApiResponse<ShippingRate>>({
    url: `/api/v1/shipping-rates/${id}`,
    method: 'get'
  })
}

/**
 * 创建运费报价
 */
export function createShippingRate(data: CreateRateParams) {
  return request<ApiResponse<ShippingRate>>({
    url: '/api/v1/shipping-rates',
    method: 'post',
    data
  })
}

/**
 * 更新运费报价
 */
export function updateShippingRate(id: number, data: UpdateRateParams) {
  return request<ApiResponse<ShippingRate>>({
    url: `/api/v1/shipping-rates/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除运费报价
 */
export function deleteShippingRate(id: number) {
  return request<ApiResponse<void>>({
    url: `/api/v1/shipping-rates/${id}`,
    method: 'delete'
  })
}

/**
 * 查询最新有效报价
 */
export function queryLatestRate(params: QueryLatestRateParams) {
  return request<ApiResponse<ShippingRate>>({
    url: '/api/v1/shipping-rates/query-latest',
    method: 'get',
    params
  })
}

// ==================== 物流服务 API ====================

/**
 * 获取物流服务列表
 */
export function getLogisticsServices(params?: LogisticsServiceListParams) {
  return request<ApiResponse<PaginatedResponse<LogisticsService>>>({
    url: '/api/v1/logistics-services',
    method: 'get',
    params
  })
}

/**
 * 获取所有启用的物流服务
 */
export function getActiveServices() {
  return request<ApiResponse<LogisticsService[]>>({
    url: '/api/v1/logistics-services/active',
    method: 'get'
  })
}

/**
 * 根据运输方式获取服务
 */
export function getServicesByTransportMode(transportMode: string) {
  return request<ApiResponse<LogisticsService[]>>({
    url: '/api/v1/logistics-services/by-transport-mode',
    method: 'get',
    params: { transport_mode: transportMode }
  })
}

/**
 * 获取物流服务详情
 */
export function getLogisticsService(id: number) {
  return request<ApiResponse<LogisticsService>>({
    url: `/api/v1/logistics-services/${id}`,
    method: 'get'
  })
}

/**
 * 创建物流服务
 */
export function createLogisticsService(data: CreateLogisticsServiceParams) {
  return request<ApiResponse<LogisticsService>>({
    url: '/api/v1/logistics-services',
    method: 'post',
    data
  })
}

/**
 * 更新物流服务
 */
export function updateLogisticsService(id: number, data: UpdateLogisticsServiceParams) {
  return request<ApiResponse<LogisticsService>>({
    url: `/api/v1/logistics-services/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除物流服务
 */
export function deleteLogisticsService(id: number) {
  return request<ApiResponse<void>>({
    url: `/api/v1/logistics-services/${id}`,
    method: 'delete'
  })
}
