<template>
  <div class="finance-overview">
    <section class="page-head">
      <div>
        <h1 class="page-head__title">财务总览</h1>
        <div class="page-head__meta">
          {{ currentRangeLabel }} · 基准币 {{ currencyPrefix.replace(' ', '') }}
        </div>
      </div>
    </section>

    <section class="toolbar">
      <div class="toolbar__presets">
        <el-button
          v-for="preset in rangePresets"
          :key="preset.value"
          :type="activePreset === preset.value ? 'primary' : 'default'"
          plain
          @click="handlePresetChange(preset.value)"
        >
          {{ preset.label }}
        </el-button>
      </div>
      <el-date-picker
        v-model="customRange"
        type="daterange"
        unlink-panels
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="handleCustomRangeChange"
      />
    </section>

    <section class="overview-section">
      <div class="section-title">经营趋势</div>
      <div class="trend-panel">
        <div class="trend-panel__legend">
          <span class="trend-panel__legend-item">
            <span class="trend-panel__legend-dot trend-panel__legend-dot--cash"></span>
            净现金流
          </span>
          <span class="trend-panel__legend-item">
            <span class="trend-panel__legend-dot trend-panel__legend-dot--profit"></span>
            净利润
          </span>
        </div>
        <div class="trend-panel__chart">
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="trend-panel__svg" preserveAspectRatio="none">
            <g v-for="line in chartGridLines" :key="line.y">
              <line
                :x1="chartPadding.left"
                :x2="chartWidth - chartPadding.right"
                :y1="line.y"
                :y2="line.y"
                class="trend-panel__grid"
              />
              <text :x="6" :y="line.y + 4" class="trend-panel__axis-text">{{ currencyPrefix }}{{ line.label }}</text>
            </g>

            <polyline :points="cashLinePoints" class="trend-panel__line trend-panel__line--cash" />
            <polyline :points="profitLinePoints" class="trend-panel__line trend-panel__line--profit" />

            <g v-for="point in chartPoints" :key="point.label">
              <circle :cx="point.x" :cy="point.cashY" r="3" class="trend-panel__point trend-panel__point--cash" />
              <circle :cx="point.x" :cy="point.profitY" r="3" class="trend-panel__point trend-panel__point--profit" />
              <text :x="point.x" :y="chartHeight - 8" text-anchor="middle" class="trend-panel__axis-text">
                {{ point.label }}
              </text>
            </g>
          </svg>
        </div>
      </div>
    </section>

    <section class="overview-section">
      <div class="section-title">期间经营结果</div>
      <div class="result-table">
        <div class="result-table__head">
          <div>指标</div>
          <div>当前值</div>
          <div>上期值</div>
          <div>变化</div>
          <div>观察</div>
        </div>
        <div v-for="row in overviewRows" :key="row.key" class="result-table__row">
          <div class="result-table__metric">
            <div class="result-table__metric-name">{{ row.label }}</div>
            <div class="result-table__metric-code">{{ row.code }}</div>
          </div>
          <div :class="['result-table__value', getValueClass(row)]">
            {{ formatMetricValue(row.current, row.type) }}
          </div>
          <div class="result-table__value result-table__value--previous">
            {{ formatMetricValue(row.previous, row.type) }}
          </div>
          <div :class="['result-table__delta', getDeltaClass(row.change)]">
            {{ formatDelta(row.change, row.type) }}
          </div>
          <div class="result-table__note">{{ row.note }}</div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type RangePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
type MetricType = 'currency' | 'percent' | 'count'

interface OverviewMetric {
  key: string
  label: string
  code: string
  type: MetricType
  current: number
  previous: number
  note: string
}

interface MetricDataset {
  metrics: OverviewMetric[]
}

interface TrendPoint {
  label: string
  cash: number
  profit: number
}

const currencyPrefix = '$'
const activePreset = ref<RangePreset>('month')
const customRange = ref<[string, string] | []>([])
const chartWidth = 1000
const chartHeight = 240
const chartPadding = {
  top: 14,
  right: 18,
  bottom: 28,
  left: 74
}

const rangePresets = [
  { label: '今日', value: 'today' as RangePreset },
  { label: '本周', value: 'week' as RangePreset },
  { label: '本月', value: 'month' as RangePreset },
  { label: '本季', value: 'quarter' as RangePreset },
  { label: '本年', value: 'year' as RangePreset }
]

const trendSeriesMap: Record<Exclude<RangePreset, 'custom'>, TrendPoint[]> = {
  today: [
    { label: '09', cash: 82, profit: 75 },
    { label: '10', cash: 96, profit: 88 },
    { label: '11', cash: 118, profit: 105 },
    { label: '12', cash: 135, profit: 129 },
    { label: '13', cash: 150, profit: 141 },
    { label: '14', cash: 122, profit: 116 },
    { label: '15', cash: 138, profit: 132 }
  ],
  week: [
    { label: '周一', cash: 520, profit: 508 },
    { label: '周二', cash: 618, profit: 595 },
    { label: '周三', cash: 584, profit: 562 },
    { label: '周四', cash: 702, profit: 681 },
    { label: '周五', cash: 655, profit: 630 },
    { label: '周六', cash: 548, profit: 521 },
    { label: '周日', cash: 491, profit: 468 }
  ],
  month: [
    { label: 'W1', cash: 3180, profit: 3012 },
    { label: 'W2', cash: 3468, profit: 3290 },
    { label: 'W3', cash: 3714, profit: 3528 },
    { label: 'W4', cash: 3655, profit: 3410 },
    { label: 'W5', cash: 4020, profit: 3776 }
  ],
  quarter: [
    { label: '1月', cash: 12840, profit: 11960 },
    { label: '2月', cash: 13980, profit: 13120 },
    { label: '3月', cash: 16602, profit: 15518 }
  ],
  year: [
    { label: 'Q1', cash: 40656, profit: 38920 },
    { label: 'Q2', cash: 42118, profit: 40286 },
    { label: 'Q3', cash: 43422, profit: 41810 },
    { label: 'Q4', cash: 45120, profit: 43508 }
  ]
}

const mockDatasets: Record<Exclude<RangePreset, 'custom'>, MetricDataset> = {
  today: {
    metrics: [
      { key: 'income', label: '收入', code: 'CASH_IN', type: 'currency', current: 1880.5, previous: 1640.2, note: '主要来自平台回款' },
      { key: 'expense', label: '支出', code: 'CASH_OUT', type: 'currency', current: 923.3, previous: 1104.8, note: '采购付款下降' },
      { key: 'cash_net', label: '净现金流', code: 'CASH_NET', type: 'currency', current: 957.2, previous: 535.4, note: '现金流转正' },
      { key: 'sales', label: '销售额', code: 'SALES', type: 'currency', current: 2360.8, previous: 2193.5, note: '订单收入稳定' },
      { key: 'cogs', label: 'COGS', code: 'COGS', type: 'currency', current: 1188.2, previous: 1014.7, note: '受打包耗材影响' },
      { key: 'expense_order', label: '订单费用', code: 'ORDER_EXP', type: 'currency', current: 215.4, previous: 188.6, note: '运费略有抬升' },
      { key: 'profit_net', label: '净利润', code: 'NET_PROFIT', type: 'currency', current: 957.2, previous: 990.2, note: '低于昨日' },
    ]
  },
  week: {
    metrics: [
      { key: 'income', label: '收入', code: 'CASH_IN', type: 'currency', current: 9230.8, previous: 8741.4, note: '平台回款正常' },
      { key: 'expense', label: '支出', code: 'CASH_OUT', type: 'currency', current: 5112.6, previous: 4630.5, note: '采购支出增加' },
      { key: 'cash_net', label: '净现金流', code: 'CASH_NET', type: 'currency', current: 4118.2, previous: 4110.9, note: '基本持平' },
      { key: 'sales', label: '销售额', code: 'SALES', type: 'currency', current: 11583.6, previous: 10980.2, note: '销售额稳步增长' },
      { key: 'cogs', label: 'COGS', code: 'COGS', type: 'currency', current: 5648.7, previous: 5210.6, note: '成本上升需跟踪' },
      { key: 'expense_order', label: '订单费用', code: 'ORDER_EXP', type: 'currency', current: 1816.7, previous: 1658.4, note: '头程分摊增加' },
      { key: 'profit_net', label: '净利润', code: 'NET_PROFIT', type: 'currency', current: 4118.2, previous: 4111.2, note: '利润基本持平' },
    ]
  },
  month: {
    metrics: [
      { key: 'income', label: '收入', code: 'CASH_IN', type: 'currency', current: 38210.4, previous: 36142.6, note: '平台回款增长明显' },
      { key: 'expense', label: '支出', code: 'CASH_OUT', type: 'currency', current: 24193.7, previous: 22806.4, note: '采购与运费同步增长' },
      { key: 'cash_net', label: '净现金流', code: 'CASH_NET', type: 'currency', current: 14016.7, previous: 13336.2, note: '现金流保持为正' },
      { key: 'sales', label: '销售额', code: 'SALES', type: 'currency', current: 48621.3, previous: 45210.5, note: '营收较上月提升' },
      { key: 'cogs', label: 'COGS', code: 'COGS', type: 'currency', current: 22604.1, previous: 20988.8, note: '采购与打包成本抬升' },
      { key: 'expense_order', label: '订单费用', code: 'ORDER_EXP', type: 'currency', current: 12000.5, previous: 11285.5, note: '物流和平台费用占比高' },
      { key: 'profit_net', label: '净利润', code: 'NET_PROFIT', type: 'currency', current: 14016.7, previous: 12936.2, note: '净利润增长但压力仍在' },
    ]
  },
  quarter: {
    metrics: [
      { key: 'income', label: '收入', code: 'CASH_IN', type: 'currency', current: 119832.8, previous: 112640.3, note: '回款保持增长' },
      { key: 'expense', label: '支出', code: 'CASH_OUT', type: 'currency', current: 76410.5, previous: 71984.2, note: '采购扩张带动支出增长' },
      { key: 'cash_net', label: '净现金流', code: 'CASH_NET', type: 'currency', current: 43422.3, previous: 40656.1, note: '现金净流入稳定' },
      { key: 'sales', label: '销售额', code: 'SALES', type: 'currency', current: 151883.2, previous: 142930.4, note: '销售规模扩大' },
      { key: 'cogs', label: 'COGS', code: 'COGS', type: 'currency', current: 71844.8, previous: 67102.6, note: '采购成本随规模上升' },
      { key: 'expense_order', label: '订单费用', code: 'ORDER_EXP', type: 'currency', current: 36616.1, previous: 34931.7, note: '物流费用增长需关注' },
      { key: 'profit_net', label: '净利润', code: 'NET_PROFIT', type: 'currency', current: 43422.3, previous: 40906.1, note: '利润增加但费用占比偏高' },
    ]
  },
  year: {
    metrics: [
      { key: 'income', label: '收入', code: 'CASH_IN', type: 'currency', current: 392206.3, previous: 365880.6, note: '全年回款增长' },
      { key: 'expense', label: '支出', code: 'CASH_OUT', type: 'currency', current: 256142.1, previous: 241905.8, note: '采购与费用同步增长' },
      { key: 'cash_net', label: '净现金流', code: 'CASH_NET', type: 'currency', current: 136064.2, previous: 123974.8, note: '现金流整体健康' },
      { key: 'sales', label: '销售额', code: 'SALES', type: 'currency', current: 511823.4, previous: 476240.1, note: '营收持续增长' },
      { key: 'cogs', label: 'COGS', code: 'COGS', type: 'currency', current: 243620.5, previous: 227814.4, note: '原材料与运输成本增长' },
      { key: 'expense_order', label: '订单费用', code: 'ORDER_EXP', type: 'currency', current: 132138.7, previous: 124450.9, note: '费用控制仍需加强' },
      { key: 'profit_net', label: '净利润', code: 'NET_PROFIT', type: 'currency', current: 136064.2, previous: 123974.8, note: '利润规模增长' },
    ]
  }
}

const currentRangeLabel = computed(() => {
  if (activePreset.value === 'custom' && customRange.value.length === 2) {
    return `${customRange.value[0]} 至 ${customRange.value[1]}`
  }
  return rangePresets.find((item) => item.value === activePreset.value)?.label ?? '本月'
})

const activeDataset = computed<MetricDataset>(() => {
  if (activePreset.value === 'custom') {
    return buildCustomDataset()
  }
  return mockDatasets[activePreset.value]
})

const activeTrendData = computed(() => {
  if (activePreset.value === 'custom') {
    return buildCustomTrend()
  }
  return trendSeriesMap[activePreset.value]
})

const overviewRows = computed(() =>
  activeDataset.value.metrics.map((item) => ({
    ...item,
    change: item.current - item.previous
  }))
)

const maxChartValue = computed(() => {
  const values = activeTrendData.value.flatMap((item) => [item.cash, item.profit])
  return Math.max(...values, 1)
})

const chartPoints = computed(() => {
  const points = activeTrendData.value
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0
  return points.map((point, index) => {
    const x = chartPadding.left + stepX * index
    const cashY = chartPadding.top + innerHeight - (point.cash / maxChartValue.value) * innerHeight
    const profitY = chartPadding.top + innerHeight - (point.profit / maxChartValue.value) * innerHeight
    return { ...point, x, cashY, profitY }
  })
})

const cashLinePoints = computed(() => chartPoints.value.map((point) => `${point.x},${point.cashY}`).join(' '))
const profitLinePoints = computed(() => chartPoints.value.map((point) => `${point.x},${point.profitY}`).join(' '))

const chartGridLines = computed(() => {
  const ticks = 4
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom
  return Array.from({ length: ticks + 1 }, (_, index) => {
    const ratio = index / ticks
    return {
      y: chartPadding.top + innerHeight * (1 - ratio),
      label: Math.round(maxChartValue.value * ratio).toFixed(0)
    }
  })
})

const handlePresetChange = (preset: RangePreset) => {
  activePreset.value = preset
  if (preset !== 'custom') {
    customRange.value = []
  }
}

const handleCustomRangeChange = (value: [string, string] | [] | null) => {
  if (value && value.length === 2) {
    customRange.value = value
    activePreset.value = 'custom'
  }
}

const buildCustomDataset = (): MetricDataset => {
  const days = getCustomRangeDays()
  const scale = Math.max(1, days / 7)
  const round = (value: number) => Number(value.toFixed(2))
  return {
    metrics: [
      { key: 'income', label: '收入', code: 'CASH_IN', type: 'currency', current: round(9230.8 * scale), previous: round(8741.4 * scale), note: `按 ${days} 天区间估算` },
      { key: 'expense', label: '支出', code: 'CASH_OUT', type: 'currency', current: round(5112.6 * scale), previous: round(4630.5 * scale), note: `按 ${days} 天区间估算` },
      { key: 'cash_net', label: '净现金流', code: 'CASH_NET', type: 'currency', current: round(4118.2 * scale), previous: round(4110.9 * scale), note: `按 ${days} 天区间估算` },
      { key: 'sales', label: '销售额', code: 'SALES', type: 'currency', current: round(11583.6 * scale), previous: round(10980.2 * scale), note: `按 ${days} 天区间估算` },
      { key: 'cogs', label: 'COGS', code: 'COGS', type: 'currency', current: round(5648.7 * scale), previous: round(5210.6 * scale), note: `按 ${days} 天区间估算` },
      { key: 'expense_order', label: '订单费用', code: 'ORDER_EXP', type: 'currency', current: round(1816.7 * scale), previous: round(1658.4 * scale), note: `按 ${days} 天区间估算` },
      { key: 'profit_net', label: '净利润', code: 'NET_PROFIT', type: 'currency', current: round(4118.2 * scale), previous: round(4111.2 * scale), note: `按 ${days} 天区间估算` },
      { key: 'margin', label: '毛利率', code: 'MARGIN', type: 'percent', current: 35.55, previous: 37.44, note: '按区间结果估算' }
    ]
  }
}

const buildCustomTrend = () => {
  const days = getCustomRangeDays()
  const buckets = days <= 7 ? days : 6
  const scale = Math.max(1, days / 7)
  return Array.from({ length: buckets }, (_, index) => {
    const base = 420 + index * 36 * scale
    return {
      label: days <= 7 ? `${index + 1}` : `T${index + 1}`,
      cash: Number((base + (index % 2 === 0 ? 40 : -18) * scale).toFixed(2)),
      profit: Number((base * 0.92 + (index % 2 === 0 ? 26 : -12) * scale).toFixed(2))
    }
  })
}

const getCustomRangeDays = () => {
  if (customRange.value.length !== 2) return 7
  const [from, to] = customRange.value
  const start = new Date(from).getTime()
  const end = new Date(to).getTime()
  const diff = Math.max(end - start, 0)
  return Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)) + 1)
}

const formatMetricValue = (value: number, type: MetricType) => {
  if (type === 'percent') return `${value.toFixed(2)}%`
  if (type === 'count') return `${Math.round(value)}`
  return `${currencyPrefix}${value.toFixed(2)}`
}

const formatDelta = (value: number, type: MetricType) => {
  const prefix = value > 0 ? '+' : ''
  if (type === 'percent') return `${prefix}${value.toFixed(2)}%`
  if (type === 'count') return `${prefix}${Math.round(value)}`
  return `${prefix}${currencyPrefix}${value.toFixed(2)}`
}

const getDeltaClass = (value: number) => {
  if (value > 0) return 'result-table__delta result-table__delta--up'
  if (value < 0) return 'result-table__delta result-table__delta--down'
  return 'result-table__delta'
}

const getValueClass = (row: { key: string; current: number }) => {
  if (row.key === 'expense') return 'result-table__value--expense'
  if (row.key === 'cash_net' || row.key === 'profit_net') {
    return row.current >= 0 ? 'result-table__value--income' : 'result-table__value--expense'
  }
  return ''
}
</script>

<style scoped>
.finance-overview {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-head {
  display: flex;
  align-items: flex-start;
}

.page-head__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.page-head__meta {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.overview-section {
  padding: 0;
}

.section-title {
  margin-bottom: 10px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.trend-panel__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-bottom: 10px;
}

.trend-panel__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}

.trend-panel__legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.trend-panel__legend-dot--cash {
  background: #2563eb;
}

.trend-panel__legend-dot--profit {
  background: #16a34a;
}

.trend-panel__chart {
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 10px 0 0;
}

.trend-panel__svg {
  display: block;
  width: 100%;
  height: 240px;
}

.trend-panel__grid {
  stroke: #e2e8f0;
  stroke-width: 1;
}

.trend-panel__axis-text {
  fill: #94a3b8;
  font-size: 11px;
}

.trend-panel__line {
  fill: none;
  stroke-width: 2.5;
}

.trend-panel__line--cash {
  stroke: #2563eb;
}

.trend-panel__line--profit {
  stroke: #16a34a;
}

.trend-panel__point {
  stroke: #fff;
  stroke-width: 1.5;
}

.trend-panel__point--cash {
  fill: #2563eb;
}

.trend-panel__point--profit {
  fill: #16a34a;
}

.result-table,
.result-table__head,
.result-table__row {
  display: grid;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.result-table__head {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.result-table__head,
.result-table__row {
  grid-template-columns: minmax(148px, 0.9fr) minmax(100px, 0.7fr) minmax(100px, 0.7fr) minmax(100px, 0.7fr) minmax(220px, 1.2fr);
}

.result-table__metric-name,
.result-table__metric-name {
  color: #0f172a;
  font-weight: 700;
}

.result-table__metric-code {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 11px;
}

.result-table__value {
  color: #0f172a;
  font-weight: 700;
}

.result-table__value--previous {
  color: #475569;
  font-weight: 600;
}

.result-table__value--income {
  color: #15803d;
}

.result-table__value--expense {
  color: #dc2626;
}

.result-table__delta {
  color: #0f172a;
  font-weight: 700;
}

.result-table__delta--up {
  color: #15803d;
}

.result-table__delta--down {
  color: #dc2626;
}

.result-table__note {
  color: #475569;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .page-head {
    flex-direction: column;
  }

  .result-table__head,
  .result-table__row {
    grid-template-columns: 1fr;
  }
}
</style>
