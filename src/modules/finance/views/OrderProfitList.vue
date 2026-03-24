<template>
  <div class="order-profit-page">
    <section class="page-head">
      <div>
        <h1 class="page-head__title">订单利润</h1>
      </div>
      <div class="page-head__actions">
        <el-date-picker
          v-model="rebuildDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="重算日期"
          style="width: 160px"
        />
        <el-input
          v-model="rebuildMarketplace"
          placeholder="站点(可选)"
          clearable
          style="width: 140px"
        />
        <el-button type="warning" plain :loading="rebuildLoading" @click="handleRebuild">重算日利润</el-button>
      </div>
    </section>

    <section class="panel panel--search">
      <el-form :inline="true" class="filter-form">
        <el-form-item class="filter-form__keyword">
          <el-input
            v-model="queryKeyword"
            placeholder="订单号关键词"
            clearable
            style="width: 220px"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="queryMarketplace"
            placeholder="站点"
            clearable
            style="width: 140px"
            @keyup.enter="handleQuery"
            @clear="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item class="filter-form__actions">
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="panel panel--body">
      <el-table v-loading="loading" :data="orderProfitList" border stripe>
        <el-table-column label="订单信息" min-width="260">
          <template #default="{ row }">
            <div class="order-cell">
              <div class="order-cell__primary">{{ row.order_no || '-' }}</div>
              <div class="order-cell__secondary">{{ row.marketplace || '-' }} / {{ formatDateTime(row.occurred_at) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="利润结果" min-width="420">
          <template #default="{ row }">
            <div class="result-cell">
              <div class="result-cell__line">
                <span :class="row.order_net_profit_amount >= 0 ? 'metric-line__income' : 'metric-line__expense'">
                  净利 {{ row.base_currency }} {{ formatAmount(row.order_net_profit_amount) }}
                </span>
                <span :class="row.order_net_profit_amount >= 0 ? 'metric-line__income' : 'metric-line__expense'">
                  毛利率 {{ formatMargin(row) }}
                </span>
              </div>
              <div class="result-cell__line result-cell__line--secondary">
                <span>收入 {{ row.base_currency }} {{ formatAmount(row.sales_income_amount) }}</span>
                <span>成本 {{ row.base_currency }} {{ formatAmount(row.cogs_amount) }}</span>
                <span>费用 {{ row.base_currency }} {{ formatAmount(row.order_expense_amount) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.sales_order_id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-summary-line">
        <span>当前页收入 {{ currencyPrefix }}{{ formatAmount(pageSummary.sales_income_amount) }}</span>
        <span>成本 {{ currencyPrefix }}{{ formatAmount(pageSummary.cogs_amount) }}</span>
        <span>订单费用 {{ currencyPrefix }}{{ formatAmount(pageSummary.order_expense_amount) }}</span>
        <span :class="pageSummary.order_net_profit_amount >= 0 ? 'metric-line__income' : 'metric-line__expense'">
          净利 {{ currencyPrefix }}{{ formatAmount(pageSummary.order_net_profit_amount) }}
        </span>
        <span :class="pageSummary.order_net_profit_amount >= 0 ? 'metric-line__income' : 'metric-line__expense'">
          毛利率 {{ pageMargin }}
        </span>
        <span>共 {{ orderProfitList.length }} 单</span>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadOrderList"
          @size-change="handleSizeChange"
        />
      </div>
    </section>

    <OrderProfitDetailDialog v-model="detailVisible" :order-id="currentOrderId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import OrderProfitDetailDialog from '../components/OrderProfitDetailDialog.vue'
import { getOrderProfitList, rebuildDailyProfit } from '../api'
import type { OrderProfitSummary } from '../types'
import { useFinanceBaseCurrency } from '../composables/useFinanceBaseCurrency'

const loading = ref(false)
const rebuildLoading = ref(false)
const detailVisible = ref(false)
const currentOrderId = ref<number | null>(null)
const dateRange = ref<[string, string] | []>([])
const queryMarketplace = ref('')
const queryKeyword = ref('')
const rebuildDate = ref('')
const rebuildMarketplace = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const orderProfitList = ref<OrderProfitSummary[]>([])
const { currencyPrefix, loadBaseCurrency } = useFinanceBaseCurrency()

const buildQuery = () => {
  const params: Record<string, any> = {
    page: page.value,
    page_size: pageSize.value
  }
  if (queryKeyword.value.trim()) {
    params.keyword = queryKeyword.value.trim()
  }
  if (queryMarketplace.value.trim()) {
    params.marketplace = queryMarketplace.value.trim()
  }
  if (dateRange.value.length === 2) {
    params.date_from = dateRange.value[0]
    params.date_to = dateRange.value[1]
  }
  return params
}

const pageSummary = computed(() =>
  orderProfitList.value.reduce(
    (acc, row) => {
      acc.sales_income_amount += Number(row.sales_income_amount || 0)
      acc.cogs_amount += Number(row.cogs_amount || 0)
      acc.order_expense_amount += Number(row.order_expense_amount || 0)
      acc.order_net_profit_amount += Number(row.order_net_profit_amount || 0)
      return acc
    },
    {
      sales_income_amount: 0,
      cogs_amount: 0,
      order_expense_amount: 0,
      order_net_profit_amount: 0
    }
  )
)

const pageMargin = computed(() => {
  const income = Number(pageSummary.value.sales_income_amount || 0)
  if (!income) return '-'
  return `${((Number(pageSummary.value.order_net_profit_amount || 0) / income) * 100).toFixed(2)}%`
})

const loadOrderList = async () => {
  loading.value = true
  try {
    const resp = await getOrderProfitList(buildQuery())
    orderProfitList.value = resp.data.data || []
    total.value = resp.data.total || 0
  } finally {
    loading.value = false
  }
}

const handleQuery = async () => {
  page.value = 1
  await loadOrderList()
}

const handleReset = async () => {
  queryKeyword.value = ''
  queryMarketplace.value = ''
  dateRange.value = []
  page.value = 1
  pageSize.value = 10
  await loadOrderList()
}

const handleSizeChange = async () => {
  page.value = 1
  await loadOrderList()
}

const formatDateOnly = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const handleRebuild = async () => {
  if (!rebuildDate.value) {
    ElMessage.warning('请先选择重算日期')
    return
  }
  rebuildLoading.value = true
  try {
    await rebuildDailyProfit({
      biz_date: rebuildDate.value,
      marketplace: rebuildMarketplace.value.trim() || undefined
    })
    ElMessage.success('日利润快照重算完成')
    await loadOrderList()
  } finally {
    rebuildLoading.value = false
  }
}

const openDetail = (orderId: number) => {
  currentOrderId.value = orderId
  detailVisible.value = true
}

const formatAmount = (value: number, digits = 2) => Number(value || 0).toFixed(digits)

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

const formatMargin = (row: OrderProfitSummary) => {
  const income = Number(row.sales_income_amount || 0)
  if (!income) return '-'
  return `${((Number(row.order_net_profit_amount || 0) / income) * 100).toFixed(2)}%`
}

onMounted(async () => {
  rebuildDate.value = formatDateOnly(new Date())
  await loadBaseCurrency()
  await loadOrderList()
})
</script>

<style scoped>
.order-profit-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-head__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.page-head__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.panel {
  padding: 0;
}

.panel + .panel {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.panel__header,
.table-section__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel__title,
.table-section__header span:first-child {
  color: #0f172a;
  font-weight: 700;
}

.panel--body,
.table-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 12px;
}

.order-cell__primary {
  color: #0f172a;
  font-weight: 600;
}

.order-cell__secondary {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.result-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-cell__line {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  color: #0f172a;
  font-size: 13px;
}

.result-cell__line--secondary {
  color: #64748b;
  font-size: 12px;
}

.table-summary-line {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 20px;
  padding: 8px 0 0;
  color: #475569;
  font-size: 13px;
}

.table-summary-line .metric-line__income,
.table-summary-line .metric-line__expense {
  font-weight: 700;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

.metric-line__income {
  color: #15803d;
}

.metric-line__expense {
  color: #dc2626;
}
</style>
