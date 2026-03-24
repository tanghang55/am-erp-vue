// 物流供应商类型
export type ProviderType = 'FREIGHT_FORWARDER' | 'COURIER' | 'SHIPPING_LINE' | 'AIRLINE'

// 物流供应商状态
export type ProviderStatus = 'ACTIVE' | 'INACTIVE'

// 运输方式
export type TransportMode = 'EXPRESS' | 'AIR' | 'SEA' | 'RAIL' | 'TRUCK'

// 计费方式
export type PricingMethod = 'PER_KG' | 'PER_CBM' | 'PER_PACKAGE' | 'FIXED'

// 报价状态
export type RateStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

// 服务状态
export type ServiceStatus = 'ACTIVE' | 'INACTIVE'

// 物流供应商
export interface LogisticsProvider {
  id: number
  provider_code: string
  provider_name: string
  provider_type: ProviderType
  service_types?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  account_number?: string
  credit_days?: number
  remark?: string
  status: ProviderStatus
  created_at: string
  updated_at: string
  reference_count?: number
  deletable?: boolean
  delete_block_reason?: string
}

// 运费报价
export interface ShippingRate {
  id: number
  provider_id: number
  origin_warehouse_id: number
  destination_warehouse_id: number
  transport_mode: TransportMode
  service_id?: number  // 物流服务ID
  service_name?: string  // 保留以兼容旧数据
  pricing_method: PricingMethod
  base_rate: number
  currency: string
  other_fee: number  // 其他费用（数字）
  min_weight?: number
  transit_days?: number
  effective_date: string
  expiry_date?: string
  remark?: string
  status: RateStatus
  created_at: string
  updated_at: string
  reference_count?: number
  deletable?: boolean
  delete_block_reason?: string

  // 关联数据
  provider?: LogisticsProvider
  origin_warehouse?: any
  destination_warehouse?: any
  service?: LogisticsService
}

// 供应商类型配置
export const PROVIDER_TYPE_CONFIG: Record<ProviderType, { label: string; color: string }> = {
  FREIGHT_FORWARDER: { label: '货代', color: 'primary' },
  COURIER: { label: '快递', color: 'success' },
  SHIPPING_LINE: { label: '船公司', color: 'info' },
  AIRLINE: { label: '航空', color: 'warning' }
}

// 供应商状态配置
export const PROVIDER_STATUS_CONFIG: Record<ProviderStatus, { label: string; color: string }> = {
  ACTIVE: { label: '启用', color: 'success' },
  INACTIVE: { label: '停用', color: 'info' }
}

// 运输方式配置
export const TRANSPORT_MODE_CONFIG: Record<TransportMode, { label: string; icon: string }> = {
  EXPRESS: { label: '快递', icon: '📦' },
  AIR: { label: '空运', icon: '✈️' },
  SEA: { label: '海运', icon: '🚢' },
  RAIL: { label: '铁路', icon: '🚂' },
  TRUCK: { label: '卡车', icon: '🚚' }
}

// 计费方式配置
export const PRICING_METHOD_CONFIG: Record<PricingMethod, { label: string }> = {
  PER_KG: { label: '按公斤' },
  PER_CBM: { label: '按立方' },
  PER_PACKAGE: { label: '按件' },
  FIXED: { label: '固定价格' }
}

// 报价状态配置
export const RATE_STATUS_CONFIG: Record<RateStatus, { label: string; color: string }> = {
  ACTIVE: { label: '有效', color: 'success' },
  INACTIVE: { label: '停用', color: 'info' },
  EXPIRED: { label: '已过期', color: 'danger' }
}

// 创建供应商参数
export interface CreateProviderParams {
  provider_code: string
  provider_name: string
  provider_type: ProviderType
  service_types?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  account_number?: string
  credit_days?: number
  remark?: string
  status?: ProviderStatus
}

// 更新供应商参数
export interface UpdateProviderParams extends Partial<CreateProviderParams> {}

// 供应商列表查询参数
export interface ProviderListParams {
  page?: number
  page_size?: number
  provider_type?: ProviderType
  status?: ProviderStatus
  keyword?: string
}

// 创建报价参数
export interface CreateRateParams {
  provider_id: number
  origin_warehouse_id: number
  destination_warehouse_id: number
  transport_mode: TransportMode
  service_id?: number  // 物流服务ID
  service_name?: string  // 保留以兼容旧数据
  pricing_method: PricingMethod
  base_rate: number
  currency?: string
  other_fee?: number  // 其他费用（数字）
  min_weight?: number
  transit_days?: number
  effective_date: string
  expiry_date?: string
  remark?: string
  status?: RateStatus
}

// 更新报价参数
export interface UpdateRateParams extends Partial<CreateRateParams> {}

// 报价列表查询参数
export interface RateListParams {
  page?: number
  page_size?: number
  provider_id?: number
  origin_warehouse_id?: number
  destination_warehouse_id?: number
  transport_mode?: TransportMode
  status?: RateStatus
}

// 查询最新报价参数
export interface QueryLatestRateParams {
  origin_warehouse_id: number
  destination_warehouse_id: number
  transport_mode: TransportMode
  provider_id?: number  // 物流供应商ID（可选，但建议提供以精确匹配）
  weight?: number  // 货物重量，用于匹配最小起送量
  query_date?: string
}

// 物流服务
export interface LogisticsService {
  id: number
  service_code: string
  service_name: string
  transport_mode: TransportMode
  destination_region?: string
  description?: string
  status: ServiceStatus
  created_at: string
  updated_at: string
  reference_count?: number
  deletable?: boolean
  delete_block_reason?: string
}

// 创建物流服务参数
export interface CreateLogisticsServiceParams {
  service_code: string
  service_name: string
  transport_mode: TransportMode
  destination_region?: string
  description?: string
  status?: ServiceStatus
}

// 更新物流服务参数
export interface UpdateLogisticsServiceParams extends Partial<CreateLogisticsServiceParams> {}

// 物流服务列表查询参数
export interface LogisticsServiceListParams {
  page?: number
  page_size?: number
  transport_mode?: TransportMode
  status?: ServiceStatus
  keyword?: string
}

// 服务状态配置
export const SERVICE_STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string }> = {
  ACTIVE: { label: '启用', color: 'success' },
  INACTIVE: { label: '停用', color: 'info' }
}
