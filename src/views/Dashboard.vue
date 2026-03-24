<template>
  <div class="dashboard-page">
    <section class="section">
      <div class="section-head">
        <div class="section-title">订单趋势看板</div>
        <div class="section-actions">
          <el-radio-group v-model="trendDays" size="small">
            <el-radio-button :label="7">最近7天</el-radio-button>
            <el-radio-button :label="15">最近15天</el-radio-button>
            <el-radio-button :label="30">最近30天</el-radio-button>
          </el-radio-group>
          <el-button size="small" @click="handleRefresh" :loading="loading">刷新</el-button>
          <span class="refresh-time">更新：{{ lastRefreshedAt || '-' }}</span>
        </div>
      </div>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">订单总量</div>
          <div class="metric-value">{{ formatNumber(totalOrders) }}</div>
          <div class="metric-note">环比 {{ orderPeriodChange }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">销售额</div>
          <div class="metric-value">{{ formatCurrency(totalSales) }}</div>
          <div class="metric-note">环比 {{ salesPeriodChange }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">平均客单价</div>
          <div class="metric-value">{{ formatCurrency(avgOrderAmount) }}</div>
          <div class="metric-note">销售额 / 订单量</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">昨日单量 / 销售额</div>
          <div class="metric-value">{{ formatNumber(yesterdayOrders) }} / {{ formatCurrency(yesterdaySales) }}</div>
          <div class="metric-note">最近一天快照</div>
        </div>
      </div>

      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">
            <div class="chart-legend">
              <span class="legend-item">
                <i class="legend-dot legend-order"></i>
                订单量
              </span>
              <span class="legend-item">
                <i class="legend-dot legend-sales"></i>
                销售额
              </span>
            </div>
            <span class="panel-note">近{{ trendDays }}天</span>
          </div>
        </template>

        <div class="line-chart-wrap">
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="line-chart-svg" preserveAspectRatio="none">
            <g v-for="line in chartGridLines" :key="line.y">
              <line
                :x1="chartPadding.left"
                :x2="chartWidth - chartPadding.right"
                :y1="line.y"
                :y2="line.y"
                class="chart-grid-line"
              />
              <text :x="6" :y="line.y + 4" class="chart-axis-text">{{ line.orderLabel }}</text>
              <text :x="chartWidth - 4" :y="line.y + 4" class="chart-axis-text" text-anchor="end">
                {{ line.salesLabel }}
              </text>
            </g>

            <polyline :points="orderLinePoints" class="chart-line-order" />
            <polyline :points="salesLinePoints" class="chart-line-sales" />

            <g v-for="point in chartPoints" :key="point.date">
              <circle :cx="point.x" :cy="point.orderY" r="2.6" class="chart-point-order" />
              <circle :cx="point.x" :cy="point.salesY" r="2.6" class="chart-point-sales" />
            </g>

            <g v-for="tick in xAxisTicks" :key="tick.date">
              <text :x="tick.x" :y="chartHeight - 6" text-anchor="middle" class="chart-axis-text">
                {{ tick.label }}
              </text>
            </g>
          </svg>
        </div>
      </el-card>
    </section>

    <section class="section double-grid">
      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">
            <span>采购计划（重要提醒）</span>
            <span class="panel-note">高风险 {{ procurementHighRiskCount }} 条</span>
          </div>
        </template>

        <div class="mini-kpi-row">
          <div class="mini-kpi">
            <span>待处理</span>
            <strong>{{ formatNumber(procurementPendingCount) }}</strong>
          </div>
          <div class="mini-kpi">
            <span>建议采购总量</span>
            <strong>{{ formatNumber(procurementSuggestedTotal) }}</strong>
          </div>
          <div class="mini-kpi">
            <span>超24小时</span>
            <strong>{{ formatNumber(procurementAgingCount) }}</strong>
          </div>
        </div>

        <div class="dist-block">
          <div class="dist-title">风险分布</div>
          <div class="dist-row">
            <span>HIGH</span>
            <el-progress :percentage="procurementRiskPercents.high" :stroke-width="10" color="#ef4444" />
          </div>
          <div class="dist-row">
            <span>MEDIUM</span>
            <el-progress :percentage="procurementRiskPercents.medium" :stroke-width="10" color="#f59e0b" />
          </div>
          <div class="dist-row">
            <span>LOW</span>
            <el-progress :percentage="procurementRiskPercents.low" :stroke-width="10" color="#22c55e" />
          </div>
        </div>

        <el-table :data="procurementRows.slice(0, 6)" border stripe size="small" max-height="240">
          <el-table-column prop="product_label" label="产品" width="140" />
          <el-table-column prop="shortage_qty" label="缺口" width="90" align="right" />
          <el-table-column prop="suggested_qty" label="建议采购" width="100" align="right" />
          <el-table-column prop="plan_age_hours" label="滞留(小时)" width="100" align="right" />
          <el-table-column label="风险" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="getRiskTagType(row.level)">{{ row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="提醒原因" min-width="160" show-overflow-tooltip />
        </el-table>
      </el-card>

      <el-card shadow="never" class="panel-card">
        <template #header>
          <div class="panel-title">
            <span>发货在途</span>
            <span class="panel-note">异常 {{ transitAbnormalCount }} 票</span>
          </div>
        </template>

        <div class="transit-overview">
          <div class="donut" :style="transitDonutStyle">
            <div class="donut-inner">
              <div class="donut-num">{{ transitShipmentCount }}</div>
              <div class="donut-text">在途总票</div>
            </div>
          </div>
          <div class="donut-legend">
            <div class="legend-row">
              <i class="legend-dot legend-normal"></i>
              正常：{{ transitStatusCounts.normal }}
            </div>
            <div class="legend-row">
              <i class="legend-dot legend-delay"></i>
              延迟：{{ transitStatusCounts.delay }}
            </div>
            <div class="legend-row">
              <i class="legend-dot legend-risk"></i>
              高风险：{{ transitStatusCounts.risk }}
            </div>
            <div class="legend-row eta-row">7天内ETA：{{ transitEtaSoonCount }}</div>
          </div>
        </div>

        <div class="eta-bars">
          <div v-for="bucket in etaBuckets" :key="bucket.label" class="eta-item">
            <div class="eta-col">
              <div class="eta-fill" :style="{ height: `${bucket.percent}%` }"></div>
            </div>
            <div class="eta-count">{{ bucket.count }}</div>
            <div class="eta-label">{{ bucket.label }}</div>
          </div>
        </div>

        <el-table :data="transitRows.slice(0, 6)" border stripe size="small" max-height="220">
          <el-table-column prop="shipment_no" label="货件号" width="170" />
          <el-table-column prop="days_in_transit" label="在途天数" width="90" align="right" />
          <el-table-column prop="eta" label="ETA" width="105" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getTransitTagType(row.status)">{{ getTransitStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        </el-table>
      </el-card>
    </section>

    <section class="section">
      <div class="section-title">库存断货风险</div>
      <el-card shadow="never" class="panel-card">
        <div class="risk-list">
          <div v-for="row in inventoryRiskRows" :key="row.product_label" class="risk-row">
            <div class="risk-main">
              <div class="risk-sku">
                <span>{{ row.product_label }}</span>
                <el-tag :type="getRiskTagType(row.level)" size="small">{{ row.level }}</el-tag>
              </div>
              <div class="risk-values">
                可售天数 {{ row.sellable_days }} / 现货 {{ row.on_hand }} / 在途 {{ row.in_transit }} / 日均 {{ row.daily_sales }}
              </div>
              <div class="risk-suggestion">{{ row.suggestion }}</div>
            </div>
            <div class="risk-bar">
              <el-progress :percentage="toCoveragePercent(row.sellable_days)" :stroke-width="12" />
            </div>
          </div>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getSalesOrderList } from '@/modules/sales/api'
import type { SalesOrder } from '@/modules/sales/types'
import { listReplenishmentPlans } from '@/modules/procurement/api'
import type { ReplenishmentPlan } from '@/modules/procurement/types'
import { getShipmentList } from '@/modules/shipping/api'
import type { Shipment } from '@/modules/shipping/types'
import { getBalanceList } from '@/modules/inventory/api'
import type { InventoryBalance } from '@/modules/inventory/types'
import type {
  ChartPoint,
  EtaBucket,
  InventoryRiskRow,
  ProcurementReminderRow,
  TransitRow,
  TrendPoint
} from '@/modules/dashboard/types'
import {
  buildInventoryRiskRows,
  buildProcurementRows,
  buildTransitRows,
  buildTrendSeries,
  calcPeriodChange,
  formatCurrency,
  formatDateTime,
  formatNumber,
  getRiskTagType,
  getTransitStatusLabel,
  getTransitTagType,
  parseNumber,
  toCoveragePercent
} from '@/modules/dashboard/utils/dashboard'
import '@/modules/dashboard/styles/dashboard.css'

defineOptions({
  name: 'DashboardWorkbench'
})

const loading = ref(false)
const lastRefreshedAt = ref('')
const trendDays = ref<7 | 15 | 30>(15)
const orderSeries = ref<TrendPoint[]>([])
const salesSeries = ref<TrendPoint[]>([])
const procurementRows = ref<ProcurementReminderRow[]>([])
const transitRows = ref<TransitRow[]>([])
const inventoryRiskRows = ref<InventoryRiskRow[]>([])

const chartWidth = 1000
const chartHeight = 280
const chartPadding = {
  left: 42,
  right: 42,
  top: 20,
  bottom: 34
}

const todayDate = computed(() => {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
})

const visibleOrderSeries = computed(() => orderSeries.value.slice(-trendDays.value))
const visibleSalesSeries = computed(() => salesSeries.value.slice(-trendDays.value))

const totalOrders = computed(() => visibleOrderSeries.value.reduce((sum, item) => sum + item.value, 0))
const totalSales = computed(() => visibleSalesSeries.value.reduce((sum, item) => sum + item.value, 0))
const avgOrderAmount = computed(() => (totalOrders.value > 0 ? totalSales.value / totalOrders.value : 0))
const yesterdayOrders = computed(() => visibleOrderSeries.value.at(-1)?.value ?? 0)
const yesterdaySales = computed(() => visibleSalesSeries.value.at(-1)?.value ?? 0)

const orderPeriodChange = computed(() => calcPeriodChange(orderSeries.value.map(item => item.value), trendDays.value))
const salesPeriodChange = computed(() => calcPeriodChange(salesSeries.value.map(item => item.value), trendDays.value))

const procurementPendingCount = computed(() => procurementRows.value.length)
const procurementHighRiskCount = computed(() => procurementRows.value.filter(item => item.level === 'HIGH').length)
const procurementSuggestedTotal = computed(() => procurementRows.value.reduce((sum, item) => sum + item.suggested_qty, 0))
const procurementAgingCount = computed(() => procurementRows.value.filter(item => item.plan_age_hours >= 24).length)

const procurementRiskPercents = computed(() => {
  const total = procurementRows.value.length
  if (total === 0) {
    return { high: 0, medium: 0, low: 0 }
  }
  const high = Math.round((procurementRows.value.filter(item => item.level === 'HIGH').length / total) * 100)
  const medium = Math.round((procurementRows.value.filter(item => item.level === 'MEDIUM').length / total) * 100)
  const low = Math.max(0, 100 - high - medium)
  return { high, medium, low }
})

const transitShipmentCount = computed(() => transitRows.value.length)
const transitStatusCounts = computed(() => ({
  normal: transitRows.value.filter(item => item.status === 'NORMAL').length,
  delay: transitRows.value.filter(item => item.status === 'DELAY').length,
  risk: transitRows.value.filter(item => item.status === 'RISK').length
}))
const transitAbnormalCount = computed(() => transitStatusCounts.value.delay + transitStatusCounts.value.risk)

const transitDonutStyle = computed(() => {
  const total = transitShipmentCount.value
  if (total === 0) {
    return { background: '#e5e7eb' }
  }
  const normalPct = (transitStatusCounts.value.normal / total) * 100
  const delayPct = (transitStatusCounts.value.delay / total) * 100
  const riskPct = Math.max(0, 100 - normalPct - delayPct)
  return {
    background: `conic-gradient(#22c55e 0 ${normalPct}%, #f59e0b ${normalPct}% ${normalPct + delayPct}%, #ef4444 ${normalPct + delayPct}% ${normalPct + delayPct + riskPct}%)`
  }
})

const transitEtaSoonCount = computed(() => {
  const today = new Date(todayDate.value)
  return transitRows.value.filter((item) => {
    const eta = new Date(item.eta)
    const diffDays = Math.floor((eta.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    return diffDays >= 0 && diffDays <= 7
  }).length
})

const etaBuckets = computed<EtaBucket[]>(() => {
  const today = new Date(todayDate.value)
  const dayCounts: EtaBucket[] = Array.from({ length: 7 }, (_, idx) => ({
    label: `D+${idx + 1}`,
    count: 0,
    percent: 0
  }))
  for (const row of transitRows.value) {
    const eta = new Date(row.eta)
    const diffDays = Math.floor((eta.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    if (diffDays >= 1 && diffDays <= 7) {
      dayCounts[diffDays - 1].count += 1
    }
  }
  const maxCount = Math.max(...dayCounts.map(item => item.count), 1)
  return dayCounts.map(item => ({
    ...item,
    percent: item.count === 0 ? 4 : Math.round((item.count / maxCount) * 100)
  }))
})

const chartPoints = computed<ChartPoint[]>(() => {
  const orders = visibleOrderSeries.value
  const sales = visibleSalesSeries.value
  const count = Math.min(orders.length, sales.length)
  if (count === 0) return []

  const innerWidth = chartWidth - chartPadding.left - chartPadding.right
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const stepX = count > 1 ? innerWidth / (count - 1) : 0
  const maxOrders = Math.max(...orders.map(item => item.value), 1)
  const maxSales = Math.max(...sales.map(item => item.value), 1)

  return Array.from({ length: count }, (_, idx) => {
    const orderItem = orders[idx]
    const salesItem = sales[idx]
    const x = chartPadding.left + stepX * idx
    const orderY = chartPadding.top + innerHeight - (orderItem.value / maxOrders) * innerHeight
    const salesY = chartPadding.top + innerHeight - (salesItem.value / maxSales) * innerHeight
    return {
      date: orderItem.date,
      label: orderItem.label,
      x,
      orderY,
      salesY
    }
  })
})

const orderLinePoints = computed(() => chartPoints.value.map(point => `${point.x},${point.orderY}`).join(' '))
const salesLinePoints = computed(() => chartPoints.value.map(point => `${point.x},${point.salesY}`).join(' '))

const xAxisTicks = computed(() => {
  const points = chartPoints.value
  if (points.length <= 8) return points
  const step = Math.ceil(points.length / 7)
  return points.filter((point, idx) => idx % step === 0 || idx === points.length - 1)
})

const chartGridLines = computed(() => {
  const lines: Array<{ y: number; orderLabel: string; salesLabel: string }> = []
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const orderMax = Math.max(...visibleOrderSeries.value.map(item => item.value), 1)
  const salesMax = Math.max(...visibleSalesSeries.value.map(item => item.value), 1)
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  for (const tick of ticks) {
    const y = chartPadding.top + innerHeight * (1 - tick)
    lines.push({
      y,
      orderLabel: formatNumber(Math.round(orderMax * tick)),
      salesLabel: formatCurrency(Math.round(salesMax * tick))
    })
  }
  return lines
})

const fetchSalesOrders = async () => {
  const pageSize = 200
  const maxPages = 20
  const allRows: SalesOrder[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= maxPages) {
    const res = await getSalesOrderList({
      page,
      page_size: pageSize
    })
    const rows = res.data.data || []
    const total = res.data.total || 0
    totalPages = Math.max(1, Math.ceil(total / pageSize))
    allRows.push(...rows)
    if (rows.length === 0) {
      break
    }
    page += 1
  }

  return allRows
}

const fetchReplenishmentPlansForToday = async () => {
  const pageSize = 200
  const maxPages = 10
  const allRows: ReplenishmentPlan[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= maxPages) {
    const res = await listReplenishmentPlans({
      page,
      page_size: pageSize,
      date: todayDate.value,
      status: 'PENDING'
    })
    const rows = res.data.data || []
    const total = res.data.total || 0
    totalPages = Math.max(1, Math.ceil(total / pageSize))
    allRows.push(...rows)
    if (rows.length === 0) {
      break
    }
    page += 1
  }

  return allRows
}

const fetchShippedShipments = async () => {
  const pageSize = 200
  const maxPages = 10
  const allRows: Shipment[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= maxPages) {
    const res = await getShipmentList({
      page,
      page_size: pageSize,
      status: 'SHIPPED'
    })
    const rows = res.data.data || []
    const total = res.data.total || 0
    totalPages = Math.max(1, Math.ceil(total / pageSize))
    allRows.push(...rows)
    if (rows.length === 0) {
      break
    }
    page += 1
  }

  return allRows
}

const fetchInventoryRiskBalances = async () => {
  const fetchBalances = async (params: { low_stock?: boolean; zero_stock?: boolean; low_stock_threshold?: number }) => {
    const pageSize = 200
    const maxPages = 10
    const allRows: InventoryBalance[] = []
    let page = 1
    let totalPages = 1

    while (page <= totalPages && page <= maxPages) {
      const res = await getBalanceList({
        page,
        page_size: pageSize,
        ...params
      })
      const rows = res.data.data || []
      const total = res.data.total || 0
      totalPages = Math.max(1, Math.ceil(total / pageSize))
      allRows.push(...rows)
      if (rows.length === 0) {
        break
      }
      page += 1
    }

    return allRows
  }

  const [lowStockRows, zeroStockRows] = await Promise.all([
    fetchBalances({ low_stock: true, low_stock_threshold: 30 }),
    fetchBalances({ zero_stock: true })
  ])

  const merged = new Map<number, InventoryBalance>()
  for (const row of [...lowStockRows, ...zeroStockRows]) {
    merged.set(row.id, row)
  }
  return Array.from(merged.values())
}

const loadDashboard = async () => {
  loading.value = true
  try {
    const [salesOrders, plans, shipments, balances] = await Promise.all([
      fetchSalesOrders().catch(() => [] as SalesOrder[]),
      fetchReplenishmentPlansForToday().catch(() => [] as ReplenishmentPlan[]),
      fetchShippedShipments().catch(() => [] as Shipment[]),
      fetchInventoryRiskBalances().catch(() => [] as InventoryBalance[])
    ])

    const trend = buildTrendSeries(salesOrders)
    orderSeries.value = trend.orderRows
    salesSeries.value = trend.salesRows
    procurementRows.value = buildProcurementRows(plans)
    transitRows.value = buildTransitRows(shipments, todayDate.value)
    inventoryRiskRows.value = buildInventoryRiskRows(balances, trend.productDailySales)
    lastRefreshedAt.value = formatDateTime(new Date())
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  await loadDashboard()
}

onMounted(async () => {
  await loadDashboard()
})
</script>

<style scoped src="@/modules/dashboard/styles/dashboard.css"></style>

