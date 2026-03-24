<template>
  <el-dialog
    :model-value="modelValue"
    title="订单利润详情"
    width="1120px"
    @update:model-value="handleVisibleChange"
  >
    <el-skeleton :loading="detailLoading" animated :rows="6">
      <template #default>
        <template v-if="detailData">
          <section class="summary-strip">
            <div class="summary-strip__section">
              <div class="summary-strip__title">订单信息</div>
              <div class="summary-strip__items">
                <div v-for="row in detailInfoRows" :key="row.key" class="summary-item">
                  <div class="summary-item__label">{{ row.label }}</div>
                  <div class="summary-item__value">{{ row.value }}</div>
                </div>
              </div>
            </div>

            <div class="summary-strip__section">
              <div class="summary-strip__title">利润结论</div>
              <div class="summary-strip__items">
                <div v-for="row in detailResultRows" :key="row.key" class="summary-item summary-item--result">
                  <div class="summary-item__label">{{ row.label }}</div>
                  <div class="summary-item__value" :class="row.highlightClass">{{ row.value }}</div>
                </div>
              </div>
            </div>
          </section>

          <div class="detail-summary-line">
            <span>订单 {{ detailData.summary.order_no || '-' }}</span>
            <span>站点 {{ detailData.summary.marketplace || '-' }}</span>
            <span>币种 {{ detailData.summary.base_currency || '-' }}</span>
            <span>产品 {{ detailData.lines.length }} 个</span>
            <span>费用 {{ detailData.expenses.length }} 条</span>
          </div>

          <div class="detail-view-tabs">
            <el-button :type="activeDetailTab === 'lines' ? 'primary' : 'default'" @click="activeDetailTab = 'lines'">产品利润</el-button>
            <el-button :type="activeDetailTab === 'expenses' ? 'primary' : 'default'" @click="activeDetailTab = 'expenses'">订单费用</el-button>
          </div>

          <div v-if="activeDetailTab === 'lines'" class="table-section">
            <div class="table-section__header table-section__header--dialog">
              <span>产品利润明细</span>
              <span class="table-section__meta">每个产品的收入、成本、毛利直接对照。</span>
            </div>
            <el-table :data="detailData.lines" border stripe size="small">
              <el-table-column label="产品" min-width="260">
                <template #default="{ row }">
                  <div class="product-cell">
                    <el-image
                      v-if="row.product_image_url"
                      :src="row.product_image_url"
                      fit="cover"
                      class="product-cell__image"
                    />
                    <div class="product-cell__content">
                      <div class="product-cell__sku">{{ row.seller_sku || row.product_id }}</div>
                      <div class="product-cell__title">{{ row.product_title || '-' }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="qty_shipped" label="发货数量" width="90" align="right" />
              <el-table-column prop="unit_price" label="销售单价" width="110" align="right">
                <template #default="{ row }">{{ detailData.summary.base_currency }} {{ formatAmount(row.unit_price) }}</template>
              </el-table-column>
              <el-table-column prop="income_amount" label="收入" min-width="110" align="right">
                <template #default="{ row }">{{ detailData.summary.base_currency }} {{ formatAmount(row.income_amount) }}</template>
              </el-table-column>
              <el-table-column prop="cogs_amount" label="成本" min-width="110" align="right">
                <template #default="{ row }">{{ detailData.summary.base_currency }} {{ formatAmount(row.cogs_amount) }}</template>
              </el-table-column>
              <el-table-column prop="gross_profit_amount" label="毛利" min-width="110" align="right">
                <template #default="{ row }">
                  <span :class="row.gross_profit_amount >= 0 ? 'metric-line__income' : 'metric-line__expense'">
                    {{ detailData.summary.base_currency }} {{ formatAmount(row.gross_profit_amount) }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div v-else class="table-section">
            <div class="table-section__header table-section__header--dialog">
              <span>订单费用明细</span>
              <span class="table-section__meta">这里看平台费、物流费和其它订单级费用。</span>
            </div>
            <el-table :data="detailData.expenses" border stripe size="small">
              <el-table-column label="费用" min-width="220">
                <template #default="{ row }">
                  <div class="expense-cell">
                    <div class="expense-cell__primary">{{ row.category || '-' }}</div>
                    <div class="expense-cell__secondary">{{ row.remark || '-' }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="base_currency" label="币种" width="90" />
              <el-table-column prop="base_amount" label="金额" min-width="120" align="right">
                <template #default="{ row }">{{ row.base_currency }} {{ formatAmount(row.base_amount) }}</template>
              </el-table-column>
              <el-table-column prop="occurred_at" label="发生时间" min-width="160">
                <template #default="{ row }">{{ formatDateTime(row.occurred_at) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </template>
    </el-skeleton>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { OrderProfitDetail } from '../types'
import { getOrderProfitDetail } from '../api'

const props = defineProps<{
  modelValue: boolean
  orderId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const detailLoading = ref(false)
const detailData = ref<OrderProfitDetail | null>(null)
const activeDetailTab = ref<'lines' | 'expenses'>('lines')

const detailInfoRows = computed(() => {
  if (!detailData.value) return []
  return [
    {
      key: 'order_no',
      label: '订单号',
      value: detailData.value.summary.order_no || '-'
    },
    {
      key: 'marketplace',
      label: '站点',
      value: detailData.value.summary.marketplace || '-'
    },
    {
      key: 'base_currency',
      label: '币种',
      value: detailData.value.summary.base_currency || '-'
    }
  ]
})

const detailResultRows = computed(() => {
  if (!detailData.value) return []
  const baseCurrency = detailData.value.summary.base_currency
  return [
    {
      key: 'sales_income_amount',
      label: '收入',
      value: `${baseCurrency} ${formatAmount(detailData.value.summary.sales_income_amount)}`,
      highlightClass: ''
    },
    {
      key: 'cogs_amount',
      label: '成本',
      value: `${baseCurrency} ${formatAmount(detailData.value.summary.cogs_amount)}`,
      highlightClass: ''
    },
    {
      key: 'order_expense_amount',
      label: '订单费用',
      value: `${baseCurrency} ${formatAmount(detailData.value.summary.order_expense_amount)}`,
      highlightClass: ''
    },
    {
      key: 'order_net_profit_amount',
      label: '订单净利',
      value: `${baseCurrency} ${formatAmount(detailData.value.summary.order_net_profit_amount)}`,
      highlightClass:
        detailData.value.summary.order_net_profit_amount >= 0 ? 'metric-line__income' : 'metric-line__expense'
    }
  ]
})

const loadDetail = async () => {
  if (!props.orderId) return
  detailLoading.value = true
  detailData.value = null
  activeDetailTab.value = 'lines'
  try {
    const resp = await getOrderProfitDetail(props.orderId)
    detailData.value = resp.data || null
  } finally {
    detailLoading.value = false
  }
}

const handleVisibleChange = (value: boolean) => {
  emit('update:modelValue', value)
  if (!value) {
    detailData.value = null
  }
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

watch(
  () => [props.modelValue, props.orderId] as const,
  ([visible, orderId]) => {
    if (visible && orderId) {
      void loadDetail()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.table-section__header,
.summary-strip__title {
  color: #0f172a;
  font-weight: 700;
}

.table-section__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.summary-strip {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e2e8f0;
}

.summary-strip__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-strip__items {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 12px;
}

.summary-item {
  min-width: 0;
}

.summary-item__label,
.table-section__meta {
  color: #64748b;
  font-size: 12px;
}

.summary-item__value {
  margin-top: 4px;
  color: #0f172a;
  font-weight: 600;
  line-height: 1.4;
}

.detail-summary-line {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 18px;
  padding: 10px 0 2px;
  color: #475569;
  font-size: 13px;
}

.detail-view-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.table-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-section__header--dialog {
  margin: 4px 0 0;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-cell__image {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  flex: 0 0 auto;
}

.product-cell__sku,
.expense-cell__primary {
  color: #0f172a;
  font-weight: 600;
}

.product-cell__title,
.expense-cell__secondary {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.metric-line__income {
  color: #15803d;
}

.metric-line__expense {
  color: #dc2626;
}

@media (max-width: 1200px) {
  .summary-strip__items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
