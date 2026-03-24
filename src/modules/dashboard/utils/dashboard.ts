import type { SalesOrder, SalesOrderStatus } from '@/modules/sales/types'
import type { ReplenishmentPlan } from '@/modules/procurement/types'
import type { Shipment } from '@/modules/shipping/types'
import type { InventoryBalance } from '@/modules/inventory/types'
import type {
  InventoryRiskRow,
  ProcurementReminderRow,
  RiskLevel,
  TransitRow,
  TransitStatus,
  TrendPoint
} from '@/modules/dashboard/types'

const riskLevelRank: Record<RiskLevel, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
}

export const formatNumber = (value: number) => value.toLocaleString()

export const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

export const formatChange = (current: number, previous: number) => {
  if (previous <= 0) return 'N/A'
  const delta = ((current - previous) / previous) * 100
  const prefix = delta >= 0 ? '+' : ''
  return `${prefix}${delta.toFixed(1)}%`
}

export const calcPeriodChange = (series: number[], days: number) => {
  const current = series.slice(-days).reduce((sum, value) => sum + value, 0)
  const previousRange = series.slice(-(days * 2), -days)
  if (previousRange.length < days) return 'N/A'
  const previous = previousRange.reduce((sum, value) => sum + value, 0)
  return formatChange(current, previous)
}

export const getRiskTagType = (level: RiskLevel) => {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'success'
}

export const getTransitTagType = (status: TransitStatus) => {
  if (status === 'RISK') return 'danger'
  if (status === 'DELAY') return 'warning'
  return 'success'
}

export const getTransitStatusLabel = (status: TransitStatus) => {
  if (status === 'RISK') return '高风险'
  if (status === 'DELAY') return '延迟'
  return '正常'
}

export const toCoveragePercent = (sellableDays: number) => {
  const targetDays = 7
  return Math.max(0, Math.min(100, Math.round((sellableDays / targetDays) * 100)))
}

export const formatDateTime = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const parseNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export const normalizeDateKey = (value?: string | null) => {
  if (!value) return ''
  const key = value.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getDate()}`.padStart(2, '0')
  return `${parsed.getFullYear()}-${month}-${day}`
}

export const buildRecentDateKeys = (days: number) => {
  const keys: string[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const month = `${d.getMonth() + 1}`.padStart(2, '0')
    const day = `${d.getDate()}`.padStart(2, '0')
    keys.push(`${d.getFullYear()}-${month}-${day}`)
  }
  return keys
}

export const buildTrendSeries = (orders: SalesOrder[]) => {
  const allKeys = buildRecentDateKeys(60)
  const orderMap = new Map<string, number>()
  const salesMap = new Map<string, number>()
  const productQty30Days = new Map<number, number>()
  const start30DayKey = allKeys[allKeys.length - 30]
  const includedStatuses = new Set<SalesOrderStatus>([
    'CONFIRMED',
    'ALLOCATED',
    'SHIPPED',
    'DELIVERED',
    'RETURNED'
  ])

  for (const key of allKeys) {
    orderMap.set(key, 0)
    salesMap.set(key, 0)
  }

  for (const order of orders) {
    if (!includedStatuses.has(order.order_status)) continue
    const key = normalizeDateKey(order.order_date)
    if (!key || !orderMap.has(key)) continue
    orderMap.set(key, (orderMap.get(key) || 0) + 1)
    salesMap.set(key, (salesMap.get(key) || 0) + parseNumber(order.order_amount))

    if (key >= start30DayKey && Array.isArray(order.items)) {
      for (const item of order.items) {
        productQty30Days.set(item.product_id, (productQty30Days.get(item.product_id) || 0) + parseNumber(item.qty_ordered))
      }
    }
  }

  const orderRows: TrendPoint[] = allKeys.map((key) => ({
    date: key,
    label: key.slice(5),
    value: orderMap.get(key) || 0
  }))
  const salesRows: TrendPoint[] = allKeys.map((key) => ({
    date: key,
    label: key.slice(5),
    value: Math.round(salesMap.get(key) || 0)
  }))

  const productDailySales = new Map<number, number>()
  for (const [productID, totalQty] of productQty30Days.entries()) {
    productDailySales.set(productID, totalQty / 30)
  }

  return { orderRows, salesRows, productDailySales }
}

export const calcPlanAgeHours = (createdAt?: string) => {
  if (!createdAt) return 0
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return 0
  const diffMs = Date.now() - created.getTime()
  if (diffMs <= 0) return 0
  return Math.floor(diffMs / (1000 * 60 * 60))
}

export const buildProcurementRows = (plans: ReplenishmentPlan[]) => {
  const rows: ProcurementReminderRow[] = plans.map((plan) => {
    const ageHours = calcPlanAgeHours(plan.created_at)
    const shortage = parseNumber(plan.shortage_qty)
    let level: RiskLevel = 'LOW'
    if (ageHours >= 24 || shortage >= 100) {
      level = 'HIGH'
    } else if (ageHours >= 12 || shortage >= 40) {
      level = 'MEDIUM'
    }

    let reason = plan.remark || ''
    if (!reason) {
      if (shortage >= 100) {
        reason = '缺口较大，需优先采购'
      } else if (ageHours >= 24) {
        reason = '计划滞留超过24小时'
      } else if (parseNumber(plan.net_supply) <= 0) {
        reason = '净供给不足'
      } else {
        reason = '常规补货'
      }
    }

    return {
      product_label: plan.seller_sku || String(plan.product_id),
      warehouse: String(plan.warehouse_id),
      daily_sales: parseNumber(plan.daily_demand),
      net_supply: parseNumber(plan.net_supply),
      shortage_qty: shortage,
      suggested_qty: parseNumber(plan.suggested_qty),
      plan_age_hours: ageHours,
      level,
      reason
    }
  })

  rows.sort((a, b) => {
    const levelDiff = riskLevelRank[b.level] - riskLevelRank[a.level]
    if (levelDiff !== 0) return levelDiff
    return b.shortage_qty - a.shortage_qty
  })
  return rows
}

export const buildTransitRows = (shipments: Shipment[], todayKey: string) => {
  const today = new Date(todayKey)

  const rows: TransitRow[] = shipments.map((row) => {
    const shippedAt = row.shipped_at || row.ship_date || row.created_at
    const shippedDate = shippedAt ? new Date(shippedAt) : null
    const daysInTransit = shippedDate && !Number.isNaN(shippedDate.getTime())
      ? Math.max(0, Math.floor((today.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0
    const etaKey = normalizeDateKey(row.expected_delivery_date)

    let status: TransitStatus = 'NORMAL'
    if (etaKey) {
      if (etaKey < todayKey || daysInTransit >= 12) {
        status = 'RISK'
      } else if (daysInTransit >= 8) {
        status = 'DELAY'
      }
    } else if (daysInTransit >= 12) {
      status = 'RISK'
    } else if (daysInTransit >= 8) {
      status = 'DELAY'
    }

    return {
      shipment_no: row.shipment_number || '-',
      carrier: row.carrier || '-',
      tracking_no: row.tracking_number || '-',
      days_in_transit: daysInTransit,
      eta: etaKey || '-',
      cartons: parseNumber(row.box_count),
      status,
      remark: row.remark || (status === 'NORMAL' ? '运输正常' : status === 'DELAY' ? '在途偏长' : '需要人工跟进')
    }
  })

  rows.sort((a, b) => {
    const rank = { RISK: 3, DELAY: 2, NORMAL: 1 }
    const statusDiff = rank[b.status] - rank[a.status]
    if (statusDiff !== 0) return statusDiff
    return b.days_in_transit - a.days_in_transit
  })
  return rows
}

export const buildInventoryRiskRows = (balances: InventoryBalance[], productDailySales: Map<number, number>) => {
  const rows: InventoryRiskRow[] = balances.map((row) => {
    const productID = Number(row.product_id)
    const onHand = parseNumber(row.sellable)
    const inTransit = parseNumber(row.purchasing_in_transit) + parseNumber(row.pending_inspection)
    const inferredDailySales = Math.max(1, Math.round((onHand + inTransit) / 20))
    const dailySales = Math.max(0.2, productDailySales.get(productID) || inferredDailySales)
    const sellableDays = onHand / dailySales

    let level: RiskLevel = 'LOW'
    if (sellableDays < 2) {
      level = 'HIGH'
    } else if (sellableDays < 5) {
      level = 'MEDIUM'
    }

    let suggestion = '保持当前补货节奏'
    if (level === 'HIGH') {
      suggestion = '建议今天内补货并评估加急方案'
    } else if (level === 'MEDIUM') {
      suggestion = '建议跟进采购计划，避免下周断货'
    }

    return {
      product_label: row.product?.seller_sku || String(productID),
      sellable_days: Number(sellableDays.toFixed(1)),
      on_hand: Math.round(onHand),
      in_transit: Math.round(inTransit),
      daily_sales: Number(dailySales.toFixed(1)),
      level,
      suggestion
    }
  })

  rows.sort((a, b) => {
    const levelDiff = riskLevelRank[b.level] - riskLevelRank[a.level]
    if (levelDiff !== 0) return levelDiff
    return a.sellable_days - b.sellable_days
  })
  return rows.slice(0, 12)
}
