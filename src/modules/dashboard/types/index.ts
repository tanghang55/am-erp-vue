export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type TransitStatus = 'NORMAL' | 'DELAY' | 'RISK'

export interface TrendPoint {
  date: string
  label: string
  value: number
}

export interface ProcurementReminderRow {
  product_label: string
  warehouse: string
  daily_sales: number
  net_supply: number
  shortage_qty: number
  suggested_qty: number
  plan_age_hours: number
  level: RiskLevel
  reason: string
}

export interface TransitRow {
  shipment_no: string
  carrier: string
  tracking_no: string
  days_in_transit: number
  eta: string
  cartons: number
  status: TransitStatus
  remark: string
}

export interface InventoryRiskRow {
  product_label: string
  sellable_days: number
  on_hand: number
  in_transit: number
  daily_sales: number
  level: RiskLevel
  suggestion: string
}

export interface ChartPoint {
  date: string
  label: string
  x: number
  orderY: number
  salesY: number
}

export interface EtaBucket {
  label: string
  count: number
  percent: number
}
