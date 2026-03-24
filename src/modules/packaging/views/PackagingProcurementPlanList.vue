<template>
  <div class="packaging-procurement-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>包材采购计划</span>
          <div class="header-actions">
            <el-button plain @click="handleOpenPurchaseOrders">查看包材采购单</el-button>
            <el-button plain @click="handleOpenRunLogs">运行日志</el-button>
            <el-button type="primary" :loading="generating" @click="handleGeneratePlans">生成今日计划</el-button>
            <el-button :loading="loadingPlans" @click="loadPlans">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="plan-toolbar">
        <div>计划日期：{{ todayDate }}</div>
        <el-button
          type="success"
          :disabled="selectedPlanIds.length === 0"
          :loading="converting"
          @click="handleConvertPlans"
        >
          转包材采购单
        </el-button>
      </div>

      <el-table
        :data="plans"
        v-loading="loadingPlans"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" :selectable="isPlanSelectable" />
        <el-table-column label="包材" min-width="200">
          <template #default="{ row }">
            <div class="entity-cell">
              <div class="entity-cell__primary">{{ row.packaging_item_name || '-' }}</div>
              <div class="entity-cell__secondary" v-if="row.packaging_item_code">{{ row.packaging_item_code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="库存情况" min-width="150">
          <template #default="{ row }">
            <div class="metric-cell">
              <div class="metric-cell__primary">当前库存 {{ row.on_hand_qty }}</div>
              <div class="metric-cell__secondary">需求量 {{ row.required_qty }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="采购建议" min-width="150">
          <template #default="{ row }">
            <div class="metric-cell">
              <div class="metric-cell__primary metric-cell__primary--danger">缺口 {{ row.shortage_qty }}</div>
              <div class="metric-cell__secondary">建议采购 {{ row.suggested_qty }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="采购单" min-width="150">
          <template #default="{ row }">
            <div class="entity-cell">
              <div class="entity-cell__primary">{{ row.packaging_purchase_order_number || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      </el-table>
    </el-card>

    <el-dialog v-model="runLogDialogVisible" title="包材采购计划运行日志" width="90%">
      <div class="run-log-toolbar">
        <el-button @click="loadRuns" :loading="loadingRuns">刷新日志</el-button>
      </div>
      <el-table :data="runs" v-loading="loadingRuns" border stripe height="60vh">
        <el-table-column prop="run_no" label="运行批次" min-width="220" />
        <el-table-column label="触发方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.trigger_type === 'SCHEDULED' ? 'info' : 'primary'">
              {{ row.trigger_type === 'SCHEDULED' ? '定时' : '手动' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRunStatusType(row.status)">
              {{ getRunStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.started_at) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.finished_at) }}
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="90" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.started_at, row.finished_at) }}
          </template>
        </el-table-column>
        <el-table-column label="计划数" width="90" align="center">
          <template #default="{ row }">
            {{ getRunPlanCount(row.output_summary) }}
          </template>
        </el-table-column>
        <el-table-column prop="error_message" label="错误信息" min-width="220" show-overflow-tooltip />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import type { PackagingProcurementPlan, PackagingProcurementRun } from '../types'
import {
  convertPackagingProcurementPlans,
  generatePackagingProcurementPlans,
  getPackagingProcurementPlans,
  getPackagingProcurementRuns
} from '../api'

const router = useRouter()

const loadingPlans = ref(false)
const generating = ref(false)
const converting = ref(false)
const loadingRuns = ref(false)
const runLogDialogVisible = ref(false)

const plans = ref<PackagingProcurementPlan[]>([])
const runs = ref<PackagingProcurementRun[]>([])
const selectedPlanIds = ref<number[]>([])

const todayDate = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
})

const loadPlans = async () => {
  loadingPlans.value = true
  try {
    const res = await getPackagingProcurementPlans({
      page: 1,
      page_size: 500,
      date: todayDate.value
    })
    plans.value = res.data.data
    selectedPlanIds.value = []
  } finally {
    loadingPlans.value = false
  }
}

const loadRuns = async () => {
  loadingRuns.value = true
  try {
    const res = await getPackagingProcurementRuns({
      page: 1,
      page_size: 50
    })
    runs.value = res.data.data
  } finally {
    loadingRuns.value = false
  }
}

const handleGeneratePlans = async () => {
  generating.value = true
  try {
    const res = await generatePackagingProcurementPlans({ date: todayDate.value })
    if (res.data.generated_count > 0) {
      ElMessage.success(`今日新增 ${res.data.generated_count} 条包材计划，当前共 ${res.data.current_count} 条`)
    } else {
      ElMessage.info(`今天未新增包材计划，当前共 ${res.data.current_count} 条`)
    }
    await loadPlans()
    if (runLogDialogVisible.value) {
      await loadRuns()
    }
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '生成计划失败'))
  } finally {
    generating.value = false
  }
}

const handleSelectionChange = (rows: PackagingProcurementPlan[]) => {
  selectedPlanIds.value = rows.map((row) => row.id)
}

const isPlanSelectable = (row: PackagingProcurementPlan) => row.status === 'PENDING'

const handleOpenPurchaseOrders = () => {
  router.push('/packaging/procurement-orders')
}

const handleOpenRunLogs = async () => {
  runLogDialogVisible.value = true
  await loadRuns()
}

const handleConvertPlans = async () => {
  if (selectedPlanIds.value.length === 0) {
    ElMessage.warning('请至少选择一条计划')
    return
  }
  converting.value = true
  try {
    const res = await convertPackagingProcurementPlans({
      plan_ids: selectedPlanIds.value,
      date: todayDate.value
    })
    ElMessage.success(`已生成包材采购单：${res.data.po_number}`)
    await loadPlans()
    if (runLogDialogVisible.value) {
      await loadRuns()
    }
    router.push('/packaging/procurement-orders')
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '转单失败'))
  } finally {
    converting.value = false
  }
}

const statusTagType = (status: PackagingProcurementPlan['status']) => {
  if (status === 'CONVERTED') return 'success'
  if (status === 'CANCELLED') return 'info'
  return 'warning'
}

const getRunStatusType = (status: PackagingProcurementRun['status']) => {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  return 'warning'
}

const getRunStatusLabel = (status: PackagingProcurementRun['status']) => {
  if (status === 'SUCCESS') return '成功'
  if (status === 'FAILED') return '失败'
  return '运行中'
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

const formatDuration = (startedAt?: string, finishedAt?: string) => {
  if (!startedAt || !finishedAt) return '-'
  const start = new Date(startedAt).getTime()
  const end = new Date(finishedAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '-'
  const seconds = Math.round((end - start) / 1000)
  return `${seconds}s`
}

const getRunPlanCount = (outputSummary?: string) => {
  if (!outputSummary) return 0
  try {
    const parsed = JSON.parse(outputSummary) as { generated_count?: number; current_count?: number; count?: number }
    return parsed.generated_count ?? parsed.current_count ?? parsed.count ?? 0
  } catch {
    return 0
  }
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  return fallback
}

onMounted(async () => {
  await loadPlans()
})
</script>

<style scoped>
.packaging-procurement-page {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.plan-toolbar {
  margin: 8px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.plan-summary {
  margin-bottom: 12px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
  padding: 12px 14px;
}

.summary-card__label {
  color: #909399;
  font-size: 12px;
}

.summary-card__value {
  margin-top: 6px;
  color: #303133;
  font-size: 22px;
  font-weight: 700;
}

.run-log-toolbar {
  margin-bottom: 12px;
  display: flex;
  justify-content: flex-end;
}

.entity-cell__primary {
  font-weight: 600;
  color: #303133;
}

.entity-cell__secondary {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}

.metric-cell__primary {
  color: #303133;
  font-weight: 600;
}

.metric-cell__primary--danger {
  color: #e65a5a;
}

.metric-cell__secondary {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .plan-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
