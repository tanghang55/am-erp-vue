<template>
  <div class="replenishment-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>采购计划（日）</span>
          <div class="header-actions">
            <el-button plain @click="handleOpenStrategies">策略配置</el-button>
            <el-button plain @click="handleOpenRunLogs">运行日志</el-button>
            <el-button type="primary" :loading="generating" @click="handleGenerate">生成今日计划</el-button>
            <el-button @click="handleReload">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="plan-header">
        <div>今日计划：{{ todayDate }}</div>
        <el-button
          type="primary"
          :disabled="selectedPlanIds.length === 0"
          :loading="converting"
          @click="handleConvertPlans"
        >
          一键转采购单
        </el-button>
      </div>

      <el-table :data="plans" v-loading="loadingPlans" border stripe @selection-change="handlePlanSelectionChange">
        <el-table-column type="selection" width="50" :selectable="isPlanSelectable" />
        <el-table-column label="产品" min-width="280">
          <template #default="{ row }">
            <div class="product-cell">
              <img
                v-if="row.product_image_url"
                :src="row.product_image_url"
                :alt="row.seller_sku || 'sku'"
                class="product-cell__image"
              />
              <div class="product-cell__content">
                <div class="product-cell__code">{{ row.seller_sku || row.product_id }}</div>
                <div class="product-cell__title">{{ row.product_title || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="仓库" min-width="140">
          <template #default="{ row }">
            <div class="entity-cell">
              <div class="entity-cell__primary">{{ row.warehouse_name || row.warehouse_code || '-' }}</div>
              <div class="entity-cell__secondary" v-if="row.warehouse_code">{{ row.warehouse_code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="供应商" min-width="160">
          <template #default="{ row }">
            <div class="entity-cell">
              <div class="entity-cell__primary">{{ row.supplier_name || '-' }}</div>
              <div class="entity-cell__secondary" v-if="row.supplier_code">{{ row.supplier_code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="策略" min-width="180">
          <template #default="{ row }">
            <div class="entity-cell">
              <div class="entity-cell__primary">{{ row.strategy_name || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="daily_demand" label="日均销量" width="90" />
        <el-table-column prop="coverage_days" label="覆盖天数" width="90" />
        <el-table-column prop="net_supply" label="净供给" width="90" />
        <el-table-column prop="target_stock" label="目标库存" width="100" />
        <el-table-column prop="shortage_qty" label="缺口" width="80" />
        <el-table-column prop="suggested_qty" label="建议采购" width="100" />
        <el-table-column prop="packaging_shortage_qty" label="包材缺口" width="100" />
        <el-table-column prop="packaging_alert" label="包材提示" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PENDING' ? 'warning' : row.status === 'CONVERTED' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="采购单" min-width="150">
          <template #default="{ row }">
            <div class="entity-cell">
              <div class="entity-cell__primary">{{ row.purchase_order_numbers || row.purchase_order_number || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'PENDING'"
              size="small"
              type="danger"
              text
              @click="handleDeletePlan(row)"
            >
              删除
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="runLogDialogVisible" title="采购计划运行日志" width="90%">
      <div class="run-log-toolbar">
        <el-button @click="fetchRuns" :loading="loadingRuns">刷新日志</el-button>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  convertReplenishmentPlans,
  deleteReplenishmentPlan,
  generateReplenishmentPlans,
  listReplenishmentPlans,
  listReplenishmentRuns
} from '@/modules/procurement/api'
import type { ReplenishmentPlan, ReplenishmentRun } from '@/modules/procurement/types'

const router = useRouter()

const loadingPlans = ref(false)
const loadingRuns = ref(false)
const generating = ref(false)
const converting = ref(false)
const runLogDialogVisible = ref(false)

const plans = ref<ReplenishmentPlan[]>([])
const runs = ref<ReplenishmentRun[]>([])
const selectedPlanIds = ref<number[]>([])

const todayDate = computed(() => {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
})

const fetchPlans = async () => {
  loadingPlans.value = true
  try {
    const res = await listReplenishmentPlans({
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

const fetchRuns = async () => {
  loadingRuns.value = true
  try {
    const res = await listReplenishmentRuns({
      page: 1,
      page_size: 50
    })
    runs.value = res.data.data
  } finally {
    loadingRuns.value = false
  }
}

const handleOpenStrategies = () => {
  router.push('/procurement/replenishment/strategies')
}

const handleOpenRunLogs = async () => {
  runLogDialogVisible.value = true
  await fetchRuns()
}

const handleGenerate = async () => {
  generating.value = true
  try {
    const res = await generateReplenishmentPlans()
    if (res.data.generated) {
      ElMessage.success(`今日新增 ${res.data.generated_count} 条计划，当前共 ${res.data.current_count} 条`)
    } else {
      ElMessage.info(`今天未新增计划，当前共 ${res.data.current_count} 条`)
    }
    await fetchPlans()
    if (runLogDialogVisible.value) {
      await fetchRuns()
    }
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '生成失败'))
  } finally {
    generating.value = false
  }
}

const handleConvertPlans = async () => {
  if (selectedPlanIds.value.length === 0) {
    ElMessage.warning('请至少选择一条计划')
    return
  }
  converting.value = true
  try {
    const res = await convertReplenishmentPlans({
      plan_ids: selectedPlanIds.value,
      date: todayDate.value
    })
    ElMessage.success(`已生成 ${res.data.created_count} 张采购单`)
    await fetchPlans()
    if (runLogDialogVisible.value) {
      await fetchRuns()
    }
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '转采购单失败'))
  } finally {
    converting.value = false
  }
}

const handleDeletePlan = async (row: ReplenishmentPlan) => {
  try {
    await ElMessageBox.confirm(
      `确认删除计划 #${row.id}（产品 ${row.seller_sku || row.product_id}）？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteReplenishmentPlan(row.id)
    ElMessage.success('删除成功')
    await fetchPlans()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error, '删除失败'))
    }
  }
}

const handlePlanSelectionChange = (rows: ReplenishmentPlan[]) => {
  selectedPlanIds.value = rows.map((row) => row.id)
}

const isPlanSelectable = (row: ReplenishmentPlan) => row.status === 'PENDING'

const handleReload = async () => {
  await fetchPlans()
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  const year = parsed.getFullYear()
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getDate()}`.padStart(2, '0')
  const hours = `${parsed.getHours()}`.padStart(2, '0')
  const minutes = `${parsed.getMinutes()}`.padStart(2, '0')
  const seconds = `${parsed.getSeconds()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const formatDuration = (startedAt?: string, finishedAt?: string) => {
  if (!startedAt || !finishedAt) return '-'
  const start = new Date(startedAt).getTime()
  const end = new Date(finishedAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '-'
  const seconds = Math.floor((end - start) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainSeconds = seconds % 60
  return `${minutes}m${remainSeconds}s`
}

const getRunStatusType = (status: ReplenishmentRun['status']) => {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  return 'warning'
}

const getRunStatusLabel = (status: ReplenishmentRun['status']) => {
  if (status === 'SUCCESS') return '成功'
  if (status === 'FAILED') return '失败'
  return '运行中'
}

const getRunPlanCount = (outputSummary?: string) => {
  if (!outputSummary) return '-'
  try {
    const parsed = JSON.parse(outputSummary) as Record<string, unknown>
    const generatedCount = parsed.generated_count
    if (typeof generatedCount === 'number') {
      return generatedCount
    }
    const currentCount = parsed.current_count
    if (typeof currentCount === 'number') {
      return currentCount
    }
    const count = parsed.count
    if (typeof count === 'number') {
      return count
    }
    return '-'
  } catch {
    return '-'
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
  await handleReload()
})
</script>

<style scoped>
.replenishment-page {
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

.plan-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0;
}

.run-log-toolbar {
  margin-bottom: 8px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-cell__image {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--el-border-color-light);
  background: #fff;
  flex-shrink: 0;
}

.product-cell__content,
.entity-cell {
  min-width: 0;
}

.product-cell__code,
.entity-cell__primary {
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 1.4;
}

.product-cell__title,
.entity-cell__secondary {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
  margin-top: 2px;
}
</style>
