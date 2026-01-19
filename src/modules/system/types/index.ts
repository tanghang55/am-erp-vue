/**
 * System Module TypeScript Types
 */

export interface SettingCatalogItem {
  key: string
  default_value: string | null
  description?: string | null
  setting_type?: string | null
}

export interface SystemSetting {
  id: number
  scope_type: string
  scope_id: number
  setting_key: string
  setting_type: string
  value: string
  description?: string | null
  created_at: string
  updated_at: string
}

export interface SystemSettingsListResponse {
  scope_type: string
  scope_id: number
  items: SystemSetting[]
  total: number
  page: number
  page_size: number
  catalog: SettingCatalogItem[]
}

export interface CreateSystemSettingRequest {
  setting_key: string
  value: string
  description?: string
  setting_type?: string
  scope_type?: string
  scope_id?: number
}

export interface UpdateSystemSettingRequest {
  value: string
  description?: string
}

export interface FieldLabel {
  id: number
  label_key: string
  module?: string
  scene?: string
  status?: string
  remark?: string
  labels: Record<string, string>
  created_at: string
  updated_at: string
}

export interface FieldLabelListResponse {
  items: FieldLabel[]
  total: number
  page: number
  page_size: number
}

export interface CreateFieldLabelRequest {
  label_key: string
  module?: string
  scene?: string
  status?: string
  remark?: string
  labels: Record<string, string>
}

export interface UpdateFieldLabelRequest {
  module?: string
  scene?: string
  status?: string
  remark?: string
  labels: Record<string, string>
}
