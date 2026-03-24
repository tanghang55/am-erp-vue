<template>
  <div class="cash-ledger-page">
    <section class="page-head">
      <div>
        <h1 class="page-head__title">现金流水</h1>
      </div>
      <div class="page-head__actions">
        <el-button plain @click="router.push({ name: 'finance-cash-ledger-audit' })">操作日志</el-button>
        <el-button type="primary" @click="handleCreate">新增流水</el-button>
      </div>
    </section>

    <section class="panel panel--search">
      <el-form :inline="true" class="filter-form">
        <el-form-item class="filter-form__keyword">
          <el-input
            v-model="queryParams.keyword"
            placeholder="描述 / trace / 节点关键词"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryParams.ledger_type" placeholder="收支类型" clearable style="width: 120px">
            <el-option v-for="item in ledgerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryParams.category" placeholder="流水类别" clearable style="width: 150px">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryParams.reference_type" placeholder="来源单据" clearable style="width: 140px">
            <el-option v-for="item in referenceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="queryParams.marketplace"
            clearable
            placeholder="站点"
            style="width: 120px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="queryParams.occurred_node"
            clearable
            placeholder="发生节点"
            style="width: 160px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item class="filter-form__actions">
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="panel panel--body">
      <el-table v-loading="loading" :data="ledgerList" border stripe>
        <el-table-column label="发生时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.occurred_at) }}</template>
        </el-table-column>
        <el-table-column label="收支金额" min-width="220">
          <template #default="{ row }">
            <div class="amount-cell">
              <div>
                <el-tag :type="row.ledger_type === LedgerType.INCOME ? 'success' : 'danger'">
                  {{ getLedgerTypeLabel(row.ledger_type) }}
                </el-tag>
              </div>
              <div :class="row.ledger_type === LedgerType.INCOME ? 'amount-cell__value--income' : 'amount-cell__value--expense'">
                {{ row.ledger_type === LedgerType.INCOME ? '+' : '-' }}{{ row.original_currency }} {{ formatAmount(row.original_amount) }}
              </div>
              <div class="amount-cell__meta">
                基准 {{ row.base_currency }} {{ formatAmount(row.base_amount) }}
                <span v-if="Number(row.fx_rate || 1) !== 1"> / 汇率 {{ formatAmount(row.fx_rate, 6) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务信息" min-width="320">
          <template #default="{ row }">
            <div class="detail-cell">
              <div class="detail-cell__primary">{{ row.description || getLedgerCategoryLabel(row.category) }}</div>
              <div class="detail-cell__secondary">{{ getLedgerCategoryLabel(row.category) }}</div>
              <div class="detail-cell__secondary">{{ formatOccurredNode(row.occurred_node) }} / {{ row.marketplace || '全部站点' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="来源信息" min-width="180">
          <template #default="{ row }">
            <div class="detail-cell">
              <div class="detail-cell__primary">{{ formatReferenceType(row.reference_type) }}</div>
              <div class="detail-cell__secondary">{{ row.reference_id ? `#${row.reference_id}` : '-' }}</div>
              <div class="detail-cell__secondary">{{ row.trace_id || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="记录信息" min-width="170">
          <template #default="{ row }">
            <div class="detail-cell">
              <div class="detail-cell__primary">{{ row.created_by_name || `用户#${row.created_by}` }}</div>
              <div class="detail-cell__secondary">{{ formatDateTime(row.created_at) }}</div>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-summary-line">
        <span class="summary-value summary-value--income">收入 {{ currencyPrefix }}{{ formatAmount(summary.total_income) }}</span>
        <span class="summary-value summary-value--expense">支出 {{ currencyPrefix }}{{ formatAmount(summary.total_expense) }}</span>
        <span :class="summary.net_profit >= 0 ? 'summary-value summary-value--income' : 'summary-value summary-value--expense'">
          净额 {{ currencyPrefix }}{{ formatAmount(summary.net_profit) }}
        </span>
        <span>共 {{ summary.income_count + summary.expense_count }} 笔</span>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.page_size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleFactsPageChange"
          @current-change="fetchList"
        />
      </div>
    </section>

    <el-dialog v-model="dialogVisible" title="新增现金流水" width="680px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-form-item label="流水类型" prop="ledger_type">
          <el-radio-group v-model="formData.ledger_type" @change="handleLedgerTypeChange">
            <el-radio v-for="item in ledgerTypeOptions" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="formData.category" placeholder="请选择类别" style="width: 100%">
            <el-option v-for="item in formCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="formData.amount" :precision="2" :step="0.01" :min="0.01" style="width: 100%" />
        </el-form-item>
        <el-form-item label="货币" prop="currency">
          <el-input v-model="formData.currency" />
        </el-form-item>
        <el-form-item label="站点">
          <el-input v-model="formData.marketplace" placeholder="如 US/JP" />
        </el-form-item>
        <el-form-item label="发生节点">
          <el-input v-model="formData.occurred_node" placeholder="如 PROCUREMENT / SHIPMENT / MANUAL" />
        </el-form-item>
        <el-form-item label="来源单据类型">
          <el-select v-model="formData.reference_type" placeholder="可选" clearable style="width: 100%">
            <el-option v-for="item in referenceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源单据ID">
          <el-input-number v-model="formData.reference_id" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="发生时间" prop="occurred_at">
          <el-date-picker
            v-model="formData.occurred_at"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="说明这笔钱是什么、为什么发生"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useFinanceBaseCurrency } from '../composables/useFinanceBaseCurrency'
import { createCashLedger, getCashLedgerList, getCashLedgerSummary } from '../api'
import {
  type CashLedger,
  type CashLedgerQueryParams,
  type CashLedgerSummary,
  type CreateCashLedgerRequest,
  LedgerCategory,
  LedgerType,
  ReferenceType
} from '../types'

const router = useRouter()
const { baseCurrency, currencyPrefix, loadBaseCurrency } = useFinanceBaseCurrency()

const loading = ref(false)
const ledgerList = ref<CashLedger[]>([])
const total = ref(0)
const dateRange = ref<[string, string] | null>(null)
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const summary = ref<CashLedgerSummary>({
  total_income: 0,
  income_count: 0,
  total_expense: 0,
  expense_count: 0,
  net_profit: 0
})

const queryParams = reactive<CashLedgerQueryParams>({
  page: 1,
  page_size: 10
})

const formData = reactive<CreateCashLedgerRequest>({
  ledger_type: LedgerType.EXPENSE,
  category: LedgerCategory.PURCHASE_COST,
  amount: 0,
  currency: '',
  occurred_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
})

const formRules: FormRules = {
  ledger_type: [{ required: true, message: '请选择流水类型', trigger: 'change' }],
  category: [{ required: true, message: '请选择类别', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  currency: [{ required: true, message: '请输入货币', trigger: 'blur' }]
}

const ledgerTypeOptions = [
  { label: '收入', value: LedgerType.INCOME },
  { label: '支出', value: LedgerType.EXPENSE }
]

const allCategoryOptions = [
  { label: '销售收入', value: LedgerCategory.SALES_REVENUE, ledger_type: LedgerType.INCOME },
  { label: '采购成本', value: LedgerCategory.PURCHASE_COST, ledger_type: LedgerType.EXPENSE },
  { label: '运费', value: LedgerCategory.SHIPPING_FEE, ledger_type: LedgerType.EXPENSE },
  { label: '包装成本', value: LedgerCategory.PACKAGING_COST, ledger_type: LedgerType.EXPENSE },
  { label: '其他收入', value: LedgerCategory.OTHER_INCOME, ledger_type: LedgerType.INCOME },
  { label: '其他支出', value: LedgerCategory.OTHER_EXPENSE, ledger_type: LedgerType.EXPENSE }
]

const referenceTypeOptions = [
  { label: '采购单', value: ReferenceType.PURCHASE_ORDER },
  { label: '发货单', value: ReferenceType.SHIPMENT },
  { label: '手工', value: ReferenceType.MANUAL }
]

const categoryOptions = computed(() => {
  if (!queryParams.ledger_type) return allCategoryOptions
  return allCategoryOptions.filter(item => item.ledger_type === queryParams.ledger_type)
})

const formCategoryOptions = computed(() => allCategoryOptions.filter(item => item.ledger_type === formData.ledger_type))

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getCashLedgerList(queryParams)
    ledgerList.value = res.data.data
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const fetchSummary = async () => {
  const params = {
    ledger_type: queryParams.ledger_type,
    category: queryParams.category,
    marketplace: queryParams.marketplace,
    occurred_node: queryParams.occurred_node,
    keyword: queryParams.keyword,
    reference_type: queryParams.reference_type,
    reference_id: queryParams.reference_id,
    date_from: queryParams.date_from,
    date_to: queryParams.date_to
  }
  const summaryResp = await getCashLedgerSummary(params)
  summary.value = summaryResp.data
}

const handleQuery = async () => {
  queryParams.page = 1
  await Promise.all([fetchList(), fetchSummary()])
}

const handleReset = async () => {
  Object.assign(queryParams, {
    page: 1,
    page_size: 10,
    ledger_type: undefined,
    category: undefined,
    marketplace: undefined,
    occurred_node: undefined,
    keyword: undefined,
    date_from: undefined,
    date_to: undefined,
    reference_type: undefined,
    reference_id: undefined
  })
  dateRange.value = null
  await Promise.all([fetchList(), fetchSummary()])
}

const handleDateRangeChange = (value: [string, string] | null) => {
  if (value) {
    queryParams.date_from = value[0]
    queryParams.date_to = value[1]
  } else {
    queryParams.date_from = undefined
    queryParams.date_to = undefined
  }
}

const handleCreate = () => {
  resetForm()
  dialogVisible.value = true
}

const handleLedgerTypeChange = () => {
  formData.category = '' as LedgerCategory
}

const handleFactsPageChange = async () => {
  queryParams.page = 1
  await fetchList()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await createCashLedger(formData)
      ElMessage.success('创建成功')
      dialogVisible.value = false
      await Promise.all([fetchList(), fetchSummary()])
    } catch (error: any) {
      ElMessage.error(error.message || '创建失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetForm()
}

const resetForm = () => {
  Object.assign(formData, {
    ledger_type: LedgerType.EXPENSE,
    category: '' as LedgerCategory,
    amount: 0,
    currency: baseCurrency.value,
    marketplace: undefined,
    occurred_node: undefined,
    reference_type: undefined,
    reference_id: undefined,
    description: undefined,
    occurred_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  })
}

const getLedgerTypeLabel = (type: LedgerType) => (type === LedgerType.INCOME ? '收入' : '支出')

const getLedgerCategoryLabel = (category: LedgerCategory | string) => {
  const map: Record<string, string> = {
    SALES_REVENUE: '销售收入',
    PURCHASE_COST: '采购成本',
    SHIPPING_FEE: '运费',
    PACKAGING_COST: '包装成本',
    OTHER_INCOME: '其他收入',
    OTHER_EXPENSE: '其他支出'
  }
  return map[category] || category
}

const formatOccurredNode = (value?: string | null) => {
  if (!value) return '未标记节点'
  const map: Record<string, string> = {
    MANUAL: '手工录入',
    REVERSED: '冲销',
    PROCUREMENT: '采购',
    SHIPMENT: '发货',
    PROFIT: '利润',
    CASH_LEDGER: '现金流水'
  }
  return map[value] || value
}

const formatReferenceType = (value?: string | null) => {
  if (!value) return '无关联单据'
  const map: Record<string, string> = {
    PURCHASE_ORDER: '采购单',
    SHIPMENT: '发货单',
    MANUAL: '手工'
  }
  return map[value] || value
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').slice(0, 19)
}

const formatAmount = (value: number, digits = 2) => Number(value || 0).toFixed(digits)

onMounted(async () => {
  await loadBaseCurrency()
  if (!formData.currency) {
    formData.currency = baseCurrency.value
  }
  await Promise.all([fetchList(), fetchSummary()])
})
</script>

<style scoped>
.cash-ledger-page {
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

.page-head__subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
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

.panel__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.panel__title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.panel__meta,
.amount-cell__meta,
.detail-cell__secondary,
.audit-change-text {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.table-summary-line {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 2px 0;
  color: #475569;
  font-size: 13px;
}

.summary-value {
  font-weight: 700;
}

.summary-value--income {
  color: #15803d;
}

.summary-value--expense {
  color: #dc2626;
}

.amount-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.amount-cell__value--income {
  color: #15803d;
  font-weight: 700;
}

.amount-cell__value--expense {
  color: #dc2626;
  font-weight: 700;
}

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-cell__primary {
  color: #0f172a;
  font-weight: 600;
}

.filter-form__actions {
  margin-left: 4px;
}

.audit-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
  }

  .page-head__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
