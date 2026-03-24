<template>
  <div class="exchange-rate-page">
    <section class="page-head">
      <div>
        <h1 class="page-head__title">汇率管理</h1>
      </div>
      <el-button type="primary" @click="openCreateDialog">新增汇率</el-button>
    </section>

    <section class="panel panel--search">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item>
          <el-select v-model="queryParams.from_currency" clearable placeholder="原币种" class="filter-item" @clear="loadList">
            <el-option v-for="item in CURRENCY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryParams.to_currency" clearable placeholder="目标币种" class="filter-item" @clear="loadList">
            <el-option v-for="item in CURRENCY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryParams.status" clearable placeholder="状态" class="filter-item" @clear="loadList">
            <el-option
              v-for="item in EXCHANGE_RATE_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="filter-form__actions">
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="panel panel--body">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="汇率信息" min-width="280">
          <template #default="{ row }">
            <div class="pair-block">
              <div class="pair-block__title">
                <span>{{ row.from_currency }} → {{ row.to_currency }}</span>
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </div>
              <div class="pair-block__rate">{{ formatRate(row.rate) }}</div>
              <div class="pair-block__meta">{{ getSourceLabel(row.source_type) }} / {{ row.source_version || '无版本' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="时间信息" min-width="220">
          <template #default="{ row }">
            <div class="time-block">
              <div>生效 {{ row.effective_at }}</div>
              <div class="time-block__meta">更新 {{ row.updated_at }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="备注信息" min-width="220">
          <template #default="{ row }">
            <div class="status-block">
              <div class="status-block__remark">{{ row.remark || '暂无备注' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看详情</el-button>
            <el-button size="small" type="primary" @click="toggleStatus(row)">
              {{ row.status === 'ACTIVE' ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-summary-line">
        <span class="summary-value summary-value--active">启用 {{ activeCount }} 条</span>
        <span>停用 {{ inactiveCount }} 条</span>
        <span>当前页 {{ list.length }} 条</span>
        <span>总计 {{ total }} 条</span>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.page_size"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="loadList"
          @size-change="handleSizeChange"
        />
      </div>
    </section>

    <el-dialog v-model="dialogVisible" title="新增汇率" width="640px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="dialog-grid">
          <el-form-item label="原币种" prop="from_currency">
            <el-select v-model="form.from_currency" placeholder="请选择原币种" style="width: 100%">
              <el-option v-for="item in CURRENCY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="目标币种" prop="to_currency">
            <el-select v-model="form.to_currency" placeholder="请选择目标币种" style="width: 100%">
              <el-option v-for="item in CURRENCY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="汇率" prop="rate">
            <el-input-number
              v-model="form.rate"
              :min="minimumRate"
              :precision="exchangeRateScale"
              :step="rateStep"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="生效时间" prop="effective_at">
            <el-date-picker
              v-model="form.effective_at"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择生效时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="备注" class="dialog-grid__full">
            <el-input v-model="form.remark" type="textarea" :rows="4" maxlength="200" show-word-limit />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="汇率详情" width="680px">
      <div v-if="currentRate" class="detail-layout">
        <section class="detail-section">
          <div class="detail-section__title">基础信息</div>
          <div class="detail-list">
            <div v-for="row in detailBaseRows" :key="row.label" class="detail-list__row">
              <div class="detail-list__label">{{ row.label }}</div>
              <div class="detail-list__value">{{ row.value }}</div>
            </div>
          </div>
        </section>

        <section class="detail-section">
          <div class="detail-section__title">来源与备注</div>
          <div class="detail-list">
            <div v-for="row in detailMetaRows" :key="row.label" class="detail-list__row">
              <div class="detail-list__label">{{ row.label }}</div>
              <div class="detail-list__value">{{ row.value }}</div>
            </div>
          </div>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { parsePaginatedResponse } from '@/utils/api'
import {
  CURRENCY_OPTIONS,
  EXCHANGE_RATE_STATUS_OPTIONS,
  type ExchangeRate,
  type ExchangeRateQueryParams,
  type CreateExchangeRateRequest,
  type ExchangeRateStatus
} from '../types'
import { createExchangeRate, getExchangeRateList, updateExchangeRateStatus } from '../api'
import { useFinanceBaseCurrency } from '../composables/useFinanceBaseCurrency'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const list = ref<ExchangeRate[]>([])
const total = ref(0)
const currentRate = ref<ExchangeRate | null>(null)
const formRef = ref<FormInstance>()
const { exchangeRateScale, loadFinanceConfig } = useFinanceBaseCurrency()

const queryParams = reactive<ExchangeRateQueryParams>({
  page: 1,
  page_size: 10,
  from_currency: '',
  to_currency: '',
  status: undefined
})

const form = reactive<CreateExchangeRateRequest>({
  from_currency: '',
  to_currency: '',
  rate: 1,
  effective_at: '',
  remark: ''
})

const rules: FormRules = {
  from_currency: [{ required: true, message: '请选择原币种', trigger: 'change' }],
  to_currency: [{ required: true, message: '请选择目标币种', trigger: 'change' }],
  rate: [{ required: true, message: '请输入汇率', trigger: 'blur' }],
  effective_at: [{ required: true, message: '请选择生效时间', trigger: 'change' }]
}

const minimumRate = computed(() => {
  if (exchangeRateScale.value <= 0) {
    return 1
  }
  return Math.pow(10, -exchangeRateScale.value)
})

const rateStep = computed(() => {
  if (exchangeRateScale.value <= 0) {
    return 1
  }
  return Math.pow(10, -exchangeRateScale.value)
})

const detailBaseRows = computed(() => {
  if (!currentRate.value) return []
  return [
    { label: '汇率对', value: `${currentRate.value.from_currency} → ${currentRate.value.to_currency}` },
    { label: '汇率值', value: formatRate(currentRate.value.rate) },
    { label: '状态', value: getStatusLabel(currentRate.value.status) },
    { label: '生效时间', value: currentRate.value.effective_at },
    { label: '更新时间', value: currentRate.value.updated_at }
  ]
})

const detailMetaRows = computed(() => {
  if (!currentRate.value) return []
  return [
    { label: '来源', value: getSourceLabel(currentRate.value.source_type) },
    { label: '版本', value: currentRate.value.source_version || '无版本' },
    { label: '备注', value: currentRate.value.remark || '暂无备注' }
  ]
})

const activeCount = computed(() => list.value.filter(item => item.status === 'ACTIVE').length)
const inactiveCount = computed(() => list.value.filter(item => item.status !== 'ACTIVE').length)

const formatNow = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const formatRate = (value: number) => Number(value || 0).toFixed(exchangeRateScale.value)
const getStatusLabel = (status: ExchangeRateStatus) => EXCHANGE_RATE_STATUS_OPTIONS.find((item) => item.value === status)?.label || status
const getSourceLabel = (sourceType?: string) => (sourceType === 'MANUAL' ? '手工维护' : sourceType || '-')

const resetForm = () => {
  form.from_currency = ''
  form.to_currency = ''
  form.rate = 1
  form.effective_at = formatNow()
  form.remark = ''
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getExchangeRateList(queryParams)
    const { items, total: totalCount } = parsePaginatedResponse(res)
    list.value = items
    total.value = totalCount
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  queryParams.page = 1
  queryParams.page_size = 10
  queryParams.from_currency = ''
  queryParams.to_currency = ''
  queryParams.status = undefined
  loadList()
}

const handleSizeChange = () => {
  queryParams.page = 1
  loadList()
}

const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const handleView = (row: ExchangeRate) => {
  currentRate.value = row
  detailVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  if (form.from_currency === form.to_currency) {
    ElMessage.warning('相同币种不需要维护汇率')
    return
  }
  submitting.value = true
  try {
    await createExchangeRate(form)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (row: ExchangeRate) => {
  const nextStatus: ExchangeRateStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  await ElMessageBox.confirm(
    `确认${nextStatus === 'ACTIVE' ? '启用' : '停用'} ${row.from_currency} → ${row.to_currency} 这条汇率吗？`,
    '提示',
    { type: 'warning' }
  )
  await updateExchangeRateStatus(row.id, { status: nextStatus })
  ElMessage.success('状态已更新')
  loadList()
}

onMounted(async () => {
  await loadFinanceConfig()
  await loadList()
})
</script>

<style scoped>
.exchange-rate-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-head__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.panel {
  padding: 0;
}

.panel + .panel {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.panel--body {
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

.filter-item {
  width: 150px;
}

.pair-block,
.time-block,
.status-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pair-block__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #111827;
  font-weight: 600;
}

.pair-block__rate {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.pair-block__meta,
.time-block__meta,
.status-block__remark {
  color: #6b7280;
  font-size: 13px;
}

.table-summary-line {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 8px;
  color: #475569;
  font-size: 12px;
}

.summary-value {
  font-weight: 700;
}

.summary-value--active {
  color: #15803d;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;
}

.dialog-grid__full {
  grid-column: 1 / -1;
}

.detail-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-section__title {
  color: #0f172a;
  font-weight: 700;
}

.detail-list {
  border-top: 1px solid #e2e8f0;
}

.detail-list__row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-list__label {
  color: #64748b;
  font-size: 12px;
}

.detail-list__value {
  color: #0f172a;
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
  }

  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
