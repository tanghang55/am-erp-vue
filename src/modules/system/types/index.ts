/**
 * System Module TypeScript Types
 */

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
  data: FieldLabel[]
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

export interface AuditLog {
  id: number
  trace_id?: string | null
  user_id?: number | null
  username?: string | null
  module: string
  action: string
  entity_type?: string | null
  entity_id?: string | null
  changes?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
  updated_at: string
}

export interface AuditLogQueryParams {
  page?: number
  page_size?: number
  module?: string
  action?: string
  user_id?: number
  username?: string
  entity_type?: string
  entity_id?: string
  keyword?: string
  date_from?: string
  date_to?: string
}

export interface MenuRecord {
  id: number
  title: string
  title_en?: string | null
  code: string
  parent_id?: number | null
  path?: string | null
  component?: string | null
  icon?: string | null
  sort?: number | null
  is_hidden?: number | null
  permission_code?: string | null
  status?: string | null
  parent_title?: string | null
  full_path?: string | null
}

export interface MenuListResponse {
  data: MenuRecord[]
  total: number
}

export interface CreateMenuRequest {
  title: string
  title_en?: string
  code: string
  parent_id?: number | null
  path?: string
  component?: string
  icon?: string
  sort?: number
  is_hidden?: number
  permission_code?: string
  status?: string
}

export interface UpdateMenuRequest extends Partial<CreateMenuRequest> {}

export interface UpdateMenuStatusRequest {
  status: string
}

export * from './monitor'
export * from './configCenter'
