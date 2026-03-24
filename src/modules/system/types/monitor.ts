export type MonitorStatus = 'OK' | 'WARN' | 'ERROR'

export interface MonitorComponent {
  name: string
  status: MonitorStatus
  message?: string
  checked_at: string
  pending_count?: number
}

export interface MonitorTaskState {
  name: string
  status: MonitorStatus
  last_status?: string
  last_run_at?: string
  message?: string
}

export interface MonitorOverview {
  overall_status: MonitorStatus
  generated_at: string
  database: MonitorComponent
  migrations: MonitorComponent
  tasks: MonitorTaskState[]
  alerts: string[]
}

export interface MonitorRecentJob {
  id: number
  trace_id: string
  job_type: string
  job_name: string
  status: string
  started_at?: string
  finished_at?: string
  duration_ms?: number
  total_rows?: number
  success_rows?: number
  failed_rows?: number
  error_message?: string
  gmt_create: string
}

export interface MonitorRecentLog {
  id: number
  trace_id: string
  level: string
  module: string
  message: string
  context?: string
  exception?: string
  gmt_create: string
}
