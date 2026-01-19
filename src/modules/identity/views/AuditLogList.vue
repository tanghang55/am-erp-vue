<template>
  <div class="audit-log-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <el-button type="primary" @click="handleQuery">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="模块">
          <el-select v-model="queryParams.module" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in moduleOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="动作">
          <el-select v-model="queryParams.action" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in actionOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户">
          <el-input v-model="queryParams.username" placeholder="用户名" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="实体">
          <el-input v-model="queryParams.entity_type" placeholder="Entity Type" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="实体ID">
          <el-input v-model="queryParams.entity_id" placeholder="Entity ID" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="trace/user/entity" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="logList" border stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-panel">
              <div class="expand-item">
                <span class="label">Trace ID</span>
                <span>{{ row.trace_id || '-' }}</span>
              </div>
              <div class="expand-item">
                <span class="label">IP</span>
                <span>{{ row.ip_address || '-' }}</span>
              </div>
              <div class="expand-item">
                <span class="label">User Agent</span>
                <span class="ua">{{ row.user_agent || '-' }}</span>
              </div>
              <div class="expand-item">
                <span class="label">Changes</span>
                <div class="changes">
                  <el-table v-if="row.changes" :data="getChangeRows(row.changes)" size="small" border>
                    <el-table-column prop="key" label="Field" width="180" />
                    <el-table-column prop="before" label="Before" />
                    <el-table-column prop="after" label="After" />
                  </el-table>
                  <span v-else>-</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="动作" width="140" />
        <el-table-column label="实体" min-width="200">
          <template #default="{ row }">
            <span>{{ row.entity_type || '-' }}</span>
            <span v-if="row.entity_id"> #{{ row.entity_id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="摘要" min-width="360">
          <template #default="{ row }">
            <div class="audit-summary">
              {{ formatAuditSummary(row) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户" width="140">
          <template #default="{ row }">
            <span>{{ row.username || '-' }}</span>
            <span v-if="row.user_id">({{ row.user_id }})</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.page_size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getAuditLogList } from '../api/system'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { useFieldLabelStore } from '@/modules/common/stores/fieldLabelStore'
import { useAuditLogFormatter } from '@/modules/common/composables/useAuditLogFormatter'
import type { AuditLog } from '../types'

const loading = ref(false)
const logList = ref<AuditLog[]>([])
const total = ref(0)
const localeStore = useLocaleStore()
const fieldLabelStore = useFieldLabelStore()
const { formatAuditSummary, getChangeRows } = useAuditLogFormatter()

const queryParams = reactive({
  page: 1,
  page_size: 20,
  module: '',
  action: '',
  username: '',
  entity_type: '',
  entity_id: '',
  keyword: ''
})

const dateRange = ref<string[] | null>(null)

const moduleOptions = [
  'Product',
  'Inventory',
  'Procurement',
  'Shipping',
  'Packaging',
  'Finance',
  'Imports',
  'Identity',
  'System'
]

const actionOptions = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'IMPORT',
  'ASSIGN_ROLE',
  'RECEIVE',
  'SHIP',
  'SUBMIT',
  'CLOSE'
]

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await getAuditLogList({
      page: queryParams.page,
      page_size: queryParams.page_size,
      module: queryParams.module || undefined,
      action: queryParams.action || undefined,
      username: queryParams.username || undefined,
      entity_type: queryParams.entity_type || undefined,
      entity_id: queryParams.entity_id || undefined,
      keyword: queryParams.keyword || undefined,
      date_from: dateRange.value?.[0],
      date_to: dateRange.value?.[1]
    })
    if (res.success) {
      logList.value = res.data.data
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  loadLogs()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.page_size = 20
  queryParams.module = ''
  queryParams.action = ''
  queryParams.username = ''
  queryParams.entity_type = ''
  queryParams.entity_id = ''
  queryParams.keyword = ''
  dateRange.value = null
  loadLogs()
}

onMounted(() => {
  fieldLabelStore.ensureLoaded(localeStore.locale)
  loadLogs()
})
</script>

<style scoped>
.audit-log-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
}

.filter-form {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.expand-panel {
  display: grid;
  gap: 8px;
  font-size: 13px;
  color: #4b5563;
}

.expand-item {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 10px;
}

.expand-item .label {
  font-weight: 600;
  color: #111827;
}

.ua {
  word-break: break-all;
}

.changes {
  padding: 6px 0;
}

.audit-summary {
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
}
</style>
