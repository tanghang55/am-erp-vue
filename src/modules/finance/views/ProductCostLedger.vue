<template>
  <div class="cost-center-page">
    <section class="page-head">
      <div>
        <h1 class="page-head__title">成本中心</h1>
      </div>
      <div class="page-head__actions">
        <el-button plain @click="router.push({ name: 'finance-costing-snapshots' })">快照历史</el-button>
      </div>
    </section>

    <section class="panel panel--search">
      <el-form :inline="true" class="filter-form">
        <el-form-item>
          <ProductSelector
            v-model="queryForm.product_id"
            placeholder="选择产品"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <WarehouseSelector
            v-model="queryForm.warehouse_id"
            placeholder="选择仓库"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="queryForm.marketplace"
            clearable
            placeholder="站点"
            style="width: 140px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            range-separator="至"
          />
        </el-form-item>
        <el-form-item class="filter-form__actions">
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="panel panel--body">
      <el-table v-loading="loading" :data="ledgerList" border stripe>
        <el-table-column prop="occurred_at" label="时间" min-width="160">
          <template #default="{ row }">{{ formatDateTime(row.occurred_at) }}</template>
        </el-table-column>
        <el-table-column label="成本对象" min-width="320">
          <template #default="{ row }">
            <div class="product-cell product-cell--stacked">
              <div class="product-cell__sku">{{ row.seller_sku || row.product_id }}</div>
              <div class="product-cell__title">{{ row.product_title || '-' }}</div>
              <div class="product-cell__meta">
                {{ row.warehouse_name || row.warehouse_code || row.warehouse_id || '-' }}
                <template v-if="row.marketplace"> / {{ row.marketplace }}</template>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="来源信息" min-width="240">
          <template #default="{ row }">
            <div class="source-cell">
              <div class="source-cell__primary">{{ getProductCostReferenceSummary(row).primary }}</div>
              <div class="source-cell__secondary">{{ getProductCostReferenceSummary(row).secondary }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成本结果" min-width="240">
          <template #default="{ row }">
            <div class="amount-stack amount-stack--align-left">
              <div class="amount-stack__row">
                <el-tag :type="getProductCostDirectionTagType(row.direction)">
                  {{ formatProductCostDirection(row.direction) }}
                </el-tag>
                <span class="amount-stack__value">{{ formatProductCostQuantity(row) }}</span>
              </div>
              <div class="amount-stack__value">{{ formatProductCostUnitCost(row) }}</div>
              <div class="warehouse-cell__secondary">{{ row.original_currency }} {{ formatAmount(row.original_amount) }}</div>
              <div class="warehouse-cell__secondary">基准 {{ row.base_currency }} {{ formatAmount(row.base_amount) }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-summary-line table-summary-line--wrap">
        <span>采购 {{ currentCostMap.PURCHASE?.currency || baseCurrency }} {{ formatAmount(currentCostMap.PURCHASE?.unit_cost || 0, 4) }}</span>
        <span class="summary-value summary-value--strong">到岸 {{ currentCostMap.LANDED?.currency || baseCurrency }} {{ formatAmount(currentCostMap.LANDED?.unit_cost || 0, 4) }}</span>
        <span>平均 {{ currentCostMap.AVERAGE?.currency || baseCurrency }} {{ formatAmount(currentCostMap.AVERAGE?.unit_cost || 0, 4) }}</span>
        <span>入库 {{ summary.base_currency }} {{ formatAmount(summary.inbound_amount) }}</span>
        <span>出库 {{ summary.base_currency }} {{ formatAmount(summary.outbound_amount) }}</span>
        <span class="summary-value">净成本 {{ summary.base_currency }} {{ formatAmount(summary.net_amount) }}</span>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadLedger"
          @size-change="handleLedgerSizeChange"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ProductSelector from '@/modules/product/components/ProductSelector.vue'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import { useFinanceBaseCurrency } from '../composables/useFinanceBaseCurrency'
import {
  getAllCurrentCosts,
  getProductCostLedger,
  getProductCostSummary
} from '../api'
import type {
  CostingSnapshot,
  ProductCostLedgerItem,
  ProductCostLedgerQueryParams,
  ProductCostSummary
} from '../types'
import {
  formatProductCostDirection,
  formatProductCostQuantity,
  formatProductCostUnitCost,
  getProductCostDirectionTagType,
  getProductCostReferenceSummary
} from '../utils/productCostLedger'

const router = useRouter()
const { baseCurrency, loadBaseCurrency } = useFinanceBaseCurrency()

const loading = ref(false)

const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dateRange = ref<[string, string] | []>([])
const currentCosts = ref<CostingSnapshot[]>([])
const ledgerList = ref<ProductCostLedgerItem[]>([])

const queryForm = ref({
  product_id: undefined as number | undefined,
  warehouse_id: undefined as number | undefined,
  marketplace: ''
})

const summary = ref<ProductCostSummary>({
  base_currency: 'USD',
  inbound_qty: 0,
  inbound_amount: 0,
  outbound_qty: 0,
  outbound_amount: 0,
  net_qty: 0,
  net_amount: 0,
  avg_inbound_unit_cost: 0,
  avg_outbound_unit_cost: 0
})

const currentCostMap = computed<Record<string, CostingSnapshot | null>>(() => {
  const map = new Map(currentCosts.value.map(item => [item.cost_type, item]))
  return {
    PURCHASE: map.get('PURCHASE') || null,
    LANDED: map.get('LANDED') || null,
    AVERAGE: map.get('AVERAGE') || null
  }
})

const buildLedgerParams = (): ProductCostLedgerQueryParams => {
  const params: ProductCostLedgerQueryParams = {
    page: page.value,
    page_size: pageSize.value
  }
  if (queryForm.value.product_id) params.product_id = queryForm.value.product_id
  if (queryForm.value.warehouse_id) params.warehouse_id = queryForm.value.warehouse_id
  if (queryForm.value.marketplace.trim()) params.marketplace = queryForm.value.marketplace.trim()
  if (dateRange.value.length === 2) {
    params.date_from = dateRange.value[0]
    params.date_to = dateRange.value[1]
  }
  return params
}

const loadCurrentCosts = async () => {
  if (!queryForm.value.product_id) {
    currentCosts.value = []
    return
  }
  const resp = await getAllCurrentCosts(queryForm.value.product_id)
  currentCosts.value = resp.data || []
}

const loadSummary = async () => {
  const resp = await getProductCostSummary(buildLedgerParams())
  summary.value = resp.data
}

const loadLedger = async () => {
  loading.value = true
  try {
    const resp = await getProductCostLedger(buildLedgerParams())
    ledgerList.value = resp.data.data
    total.value = resp.data.total
  } finally {
    loading.value = false
  }
}

const loadAll = async () => {
  await Promise.all([loadCurrentCosts(), loadSummary(), loadLedger()])
}

const handleQuery = async () => {
  page.value = 1
  await loadAll()
}

const handleReset = async () => {
  queryForm.value = {
    product_id: undefined,
    warehouse_id: undefined,
    marketplace: ''
  }
  currentCosts.value = []
  dateRange.value = []
  page.value = 1
  pageSize.value = 10
  await loadAll()
}

const handleLedgerSizeChange = async () => {
  page.value = 1
  await loadLedger()
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ').slice(0, 19)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

const formatAmount = (value: number, digits = 2) => Number(value || 0).toFixed(digits)

onMounted(async () => {
  await loadBaseCurrency()
  await loadAll()
})
</script>

<style scoped>
.cost-center-page {
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
  gap: 8px;
}

.panel {
  padding: 0;
}

.panel + .panel {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.panel--body {
  padding-bottom: 12px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 0;
}

.product-cell,
.warehouse-cell,
.source-cell,
.range-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.product-cell--with-image {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.product-cell__image {
  width: 46px;
  height: 46px;
  border-radius: 6px;
}

.product-cell__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.product-cell__sku,
.warehouse-cell__primary,
.source-cell__primary {
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 1.4;
}

.product-cell__title,
.product-cell__meta,
.warehouse-cell__secondary,
.source-cell__secondary,
.range-cell__to {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.product-cell--stacked {
  gap: 4px;
}

.amount-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.amount-stack--align-left {
  align-items: flex-start;
}

.amount-stack__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.amount-stack__value {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.summary-value {
  color: #0f172a;
  font-weight: 700;
}

.summary-value--strong {
  color: #0f766e;
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
  }
}

</style>
