export type ConfigCenterValueType = 'STRING' | 'INT' | 'BOOL' | 'ENUM'

export interface ConfigCenterModuleSummary {
  module_code: string
  module_name: string
  sort: number
}

export interface ConfigCenterItem {
  config_key: string
  label: string
  description: string
  value_type: ConfigCenterValueType
  scope_type: string
  default_value: string
  value: string
  options: string[]
  sort: number
}

export interface ConfigCenterGroup {
  group_code: string
  group_name: string
  items: ConfigCenterItem[]
}

export interface ConfigCenterModuleDetail {
  module_code: string
  module_name: string
  groups: ConfigCenterGroup[]
}

export interface UpdateConfigCenterModuleRequest {
  values: Record<string, string>
}
