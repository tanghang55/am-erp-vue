<template>
  <div class="snapshot-history-page">
    <section class="page-head">
      <div>
        <h1 class="page-head__title">成本快照历史</h1>
      </div>
      <div class="page-head__actions">
        <el-button plain @click="router.push({ name: 'finance-costing' })">返回成本中心</el-button>
        <el-button type="primary" @click="handleCreateSnapshot">新增快照</el-button>
      </div>
    </section>

    <section class="panel panel--search">
      <el-form :inline="true" class="filter-form">
        <el-form-item>
          <ProductSelector
            v-model="query.product_id"
            placeholder="选择产品"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.cost_type" clearable placeholder="成本类型" style="width: 140px">
            <el-option v-for="item in costTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.is_current" clearable placeholder="状态" style="width: 140px">
            <el-option label="当前有效" :value="true" />
            <el-option label="已失效" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item class="filter-form__actions">
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="panel panel--body">
      <el-table v-loading="loading" :data="snapshotList" border stripe>
        <el-table-column label="产品" min-width="220">
          <template #default="{ row }">
            <div class="product-cell">
              <div class="product-cell__sku">{{ row.seller_sku || row.product_id }}</div>
              <div class="product-cell__title">{{ row.product_title || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="快照信息" min-width="160">
          <template #default="{ row }">
            <div class="source-cell">
              <div class="source-cell__primary">
                <el-tag>{{ getCostTypeLabel(row.cost_type) }}</el-tag>
                <el-tag :type="row.effective_to ? 'info' : 'success'">
                  {{ row.effective_to ? '已失效' : '当前有效' }}
                </el-tag>
              </div>
              <div class="source-cell__secondary">{{ row.currency }} {{ formatAmount(row.unit_cost, 4) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="有效区间" min-width="220">
          <template #default="{ row }">
            <div class="range-cell">
              <div>{{ formatDateTime(row.effective_from) }}</div>
              <div class="range-cell__to">{{ row.effective_to ? formatDateTime(row.effective_to) : '当前有效' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="备注 / 创建时间" min-width="180">
          <template #default="{ row }">
            <div class="source-cell">
              <div class="source-cell__primary">{{ row.notes || '暂无备注' }}</div>
              <div class="source-cell__secondary">{{ formatDateTime(row.created_at) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditSnapshot(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteSnapshot(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-summary-line">
        <span class="summary-value summary-value--active">当前有效 {{ activeCount }} 条</span>
        <span>已失效 {{ inactiveCount }} 条</span>
        <span>当前页 {{ snapshotList.length }} 条</span>
        <span>总计 {{ total }} 条</span>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadSnapshots"
          @size-change="handleSizeChange"
        />
      </div>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="产品" prop="product_id">
          <ProductSelector
            v-model="formData.product_id"
            placeholder="选择产品"
            style="width: 100%"
            :disabled="!!editingId"
          />
        </el-form-item>
        <el-form-item label="成本类型" prop="cost_type">
          <el-select
            v-model="formData.cost_type"
            placeholder="请选择成本类型"
            style="width: 100%"
            :disabled="!!editingId"
          >
            <el-option v-for="item in costTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位成本" prop="unit_cost">
          <el-input-number
            v-model="formData.unit_cost"
            :precision="4"
            :step="0.01"
            :min="0.0001"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="货币" prop="currency">
          <el-input v-model="formData.currency" />
        </el-form-item>
        <el-form-item label="生效时间" prop="effective_from">
          <el-date-picker
            v-model="formData.effective_from"
            type="datetime"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="失效时间">
          <el-date-picker
            v-model="formData.effective_to"
            type="datetime"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.notes" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import ProductSelector from '@/modules/product/components/ProductSelector.vue'
import {
  createCostingSnapshot,
  deleteCostingSnapshot,
  getCostingSnapshotList,
  updateCostingSnapshot
} from '../api'
import type {
  CostingSnapshot,
  CostingSnapshotQueryParams,
  CreateCostingSnapshotRequest
} from '../types'
import { CostType, getCostTypeLabel } from '../types'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const total = ref(0)
const snapshotList = ref<CostingSnapshot[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增快照')
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)

const query = reactive<CostingSnapshotQueryParams>({
  page: 1,
  page_size: 10,
  product_id: undefined,
  cost_type: undefined,
  is_current: undefined
})

const formData = reactive<CreateCostingSnapshotRequest>({
  product_id: 0,
  cost_type: CostType.PURCHASE,
  unit_cost: 0,
  currency: '',
  effective_from: ''
})

const formRules: FormRules = {
  product_id: [{ required: true, message: '请选择产品', trigger: 'blur' }],
  cost_type: [{ required: true, message: '请选择成本类型', trigger: 'change' }],
  unit_cost: [{ required: true, message: '请输入单位成本', trigger: 'blur' }],
  currency: [{ required: true, message: '请输入货币', trigger: 'blur' }],
  effective_from: [{ required: true, message: '请选择生效时间', trigger: 'change' }]
}

const costTypeOptions = [
  { label: '采购成本', value: CostType.PURCHASE },
  { label: '到岸成本', value: CostType.LANDED },
  { label: '平均成本', value: CostType.AVERAGE }
]

const activeCount = computed(() => snapshotList.value.filter(item => !item.effective_to).length)
const inactiveCount = computed(() => snapshotList.value.filter(item => !!item.effective_to).length)

const buildParams = (): CostingSnapshotQueryParams => {
  const params: CostingSnapshotQueryParams = {
    page: query.page,
    page_size: query.page_size
  }
  if (query.product_id) params.product_id = query.product_id
  if (query.cost_type) params.cost_type = query.cost_type
  if (typeof query.is_current === 'boolean') params.is_current = query.is_current
  return params
}

const loadSnapshots = async () => {
  loading.value = true
  try {
    const resp = await getCostingSnapshotList(buildParams())
    snapshotList.value = resp.data.data || []
    total.value = resp.data.total || 0
  } finally {
    loading.value = false
  }
}

const handleQuery = async () => {
  query.page = 1
  await loadSnapshots()
}

const handleReset = async () => {
  query.page = 1
  query.page_size = 10
  query.product_id = undefined
  query.cost_type = undefined
  query.is_current = undefined
  await loadSnapshots()
}

const handleSizeChange = async () => {
  query.page = 1
  await loadSnapshots()
}

const resetForm = () => {
  editingId.value = null
  dialogTitle.value = '新增快照'
  formData.product_id = 0
  formData.cost_type = CostType.PURCHASE
  formData.unit_cost = 0
  formData.currency = ''
  formData.effective_from = ''
  formData.effective_to = undefined
  formData.notes = ''
  formRef.value?.clearValidate()
}

const handleCreateSnapshot = () => {
  resetForm()
  dialogVisible.value = true
}

const handleEditSnapshot = (row: CostingSnapshot) => {
  editingId.value = row.id
  dialogTitle.value = '编辑快照'
  formData.product_id = row.product_id
  formData.cost_type = row.cost_type
  formData.unit_cost = row.unit_cost
  formData.currency = row.currency
  formData.effective_from = row.effective_from
  formData.effective_to = row.effective_to || undefined
  formData.notes = row.notes || ''
  dialogVisible.value = true
}

const handleDeleteSnapshot = async (row: CostingSnapshot) => {
  await ElMessageBox.confirm(`确认删除 ${row.seller_sku || row.product_id} 的快照吗？`, '删除确认', { type: 'warning' })
  await deleteCostingSnapshot(row.id)
  ElMessage.success('删除成功')
  await loadSnapshots()
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (editingId.value) {
      await updateCostingSnapshot(editingId.value, formData)
      ElMessage.success('快照已更新')
    } else {
      await createCostingSnapshot(formData)
      ElMessage.success('快照已创建')
    }
    dialogVisible.value = false
    await loadSnapshots()
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  resetForm()
}

const formatAmount = (value: number, digits = 2) => Number(value || 0).toFixed(digits)

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

onMounted(loadSnapshots)
</script>

<style scoped>
.snapshot-history-page {
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

.panel + .panel {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin-top: 12px;
}

.product-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.product-cell__sku,
.source-cell__primary {
  color: #0f172a;
  font-weight: 600;
}

.source-cell__primary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.product-cell__title,
.source-cell__secondary,
.range-cell__to {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.range-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  padding-top: 4px;
}

@media (max-width: 900px) {
  .page-head {
    flex-direction: column;
  }
}
</style>
