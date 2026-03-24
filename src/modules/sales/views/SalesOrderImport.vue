<template>
  <div class="sales-order-import">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <div class="page-title">导入记录</div>
            <div class="page-subtitle">统一查看订单导入批次、执行结果和错误行，导入口仍在销售订单列表弹窗。</div>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="goList">前往订单列表导入</el-button>
          </div>
        </div>
      </template>

      <el-alert
        :closable="false"
        type="info"
        title="订单导入入口已统一到 销售订单 列表页弹窗。这里保留导入批次和错误行记录，便于追溯。"
      />

      <el-alert
        v-if="latestBatch"
        style="margin-top: 16px"
        type="info"
        :closable="false"
        :title="`批次 ${latestBatch.batch_no} - ${latestBatch.status}`"
        :description="`总行数 ${latestBatch.total_rows}，成功 ${latestBatch.success_rows}，失败 ${latestBatch.error_rows}`"
      />

    </el-card>

    <el-card style="margin-top: 16px">
      <template #header>
        <span>导入批次</span>
      </template>
      <el-table :data="batchList" v-loading="loading" border>
        <el-table-column prop="batch_no" label="批次号" width="220" />
        <el-table-column prop="file_name" label="文件名" min-width="180" />
        <el-table-column prop="status" label="状态" width="140" />
        <el-table-column prop="total_rows" label="总行数" width="100" />
        <el-table-column prop="success_rows" label="成功" width="100" />
        <el-table-column prop="error_rows" label="失败" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showErrors(row.id)">错误行</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-top: 16px" v-if="selectedBatchId > 0">
      <template #header>
        <span>错误行（批次 {{ selectedBatchId }}）</span>
      </template>
      <el-table :data="errorRows" v-loading="errorLoading" border>
        <el-table-column prop="row_no" label="行号" width="100" />
        <el-table-column prop="error_code" label="错误码" width="140" />
        <el-table-column prop="error_message" label="错误信息" min-width="220" />
        <el-table-column prop="raw_row" label="原始行" min-width="300" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getSalesOrderImportBatches,
  getSalesOrderImportErrors
} from '../api'
import type { SalesOrderImportBatch, SalesOrderImportRowError } from '../types'

const router = useRouter()

const loading = ref(false)
const errorLoading = ref(false)
const selectedBatchId = ref(0)
const latestBatch = ref<SalesOrderImportBatch | null>(null)
const batchList = ref<SalesOrderImportBatch[]>([])
const errorRows = ref<SalesOrderImportRowError[]>([])

const goList = () => {
  router.push('/sales/orders')
}

const fetchBatchList = async () => {
  loading.value = true
  try {
    const res = await getSalesOrderImportBatches({ page: 1, page_size: 20 })
    batchList.value = res.data.data || []
    latestBatch.value = batchList.value[0] || null
  } catch (error: unknown) {
    if (!(typeof error === 'object' && error !== null && '_handled' in error && error._handled)) {
      ElMessage.error(error instanceof Error ? error.message : '加载导入批次失败')
    }
  } finally {
    loading.value = false
  }
}

const showErrors = async (batchId: number) => {
  selectedBatchId.value = batchId
  errorLoading.value = true
  try {
    const res = await getSalesOrderImportErrors(batchId)
    errorRows.value = res.data || []
  } catch (error: unknown) {
    if (!(typeof error === 'object' && error !== null && '_handled' in error && error._handled)) {
      ElMessage.error(error instanceof Error ? error.message : '加载错误行失败')
    }
  } finally {
    errorLoading.value = false
  }
}

onMounted(fetchBatchList)
</script>

<style scoped>
.sales-order-import {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.page-subtitle {
  margin-top: 6px;
  color: #6b7280;
  line-height: 1.5;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.summary-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 16px;
}

.summary-card__label {
  color: #6b7280;
  font-size: 13px;
}

.summary-card__value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.summary-card__hint {
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .card-header {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
