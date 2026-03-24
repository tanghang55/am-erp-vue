<template>
  <div class="cash-ledger-audit-page">
    <section class="page-head">
      <div>
        <h1 class="page-head__title">现金流水操作日志</h1>
      </div>
      <el-button plain @click="router.push({ name: 'finance-cash-ledger' })">返回现金流水</el-button>
    </section>

    <section class="panel panel--search">
      <el-form :inline="true" class="filter-form">
        <el-form-item>
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="操作人 / 变更关键词"
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="query.action"
            clearable
            placeholder="动作关键词"
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
          />
        </el-form-item>
        <el-form-item class="filter-form__actions">
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="panel panel--body">
      <el-table v-loading="loading" :data="auditLogs" border stripe>
        <el-table-column label="操作信息" min-width="260">
          <template #default="{ row }">
            <div class="detail-cell">
              <div class="detail-cell__primary">{{ getActionLabel(row.action, row.entity_type) }}</div>
              <div class="detail-cell__secondary">{{ row.username || '-' }} / {{ formatDateTime(row.created_at) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="关联记录" min-width="180">
          <template #default="{ row }">
            <div class="detail-cell">
              <div class="detail-cell__primary">流水 #{{ row.entity_id || '-' }}</div>
              <div class="detail-cell__secondary">{{ row.entity_type || 'CashLedger' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="变更内容" min-width="420">
          <template #default="{ row }">
            <div class="audit-change-text">{{ formatAuditChanges(row) || '-' }}</div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-summary-line">
        <span class="summary-value">当前页 {{ auditLogs.length }} 条</span>
        <span>总计 {{ total }} 条</span>
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="loadAuditLogs"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { AuditLog } from '@/modules/system/types'
import { getSystemAuditLogList } from '@/modules/system/api/logs'
import { useAuditLogFormatter } from '@/modules/common/composables/useAuditLogFormatter'

const router = useRouter()
const { getActionLabel, formatAuditChanges } = useAuditLogFormatter()

const loading = ref(false)
const total = ref(0)
const auditLogs = ref<AuditLog[]>([])
const dateRange = ref<[string, string] | []>([])

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  action: ''
})

const buildParams = () => {
  const params: Record<string, unknown> = {
    page: query.page,
    page_size: query.page_size,
    module: 'Finance',
    entity_type: 'CashLedger'
  }
  if (query.keyword.trim()) params.keyword = query.keyword.trim()
  if (query.action.trim()) params.action = query.action.trim()
  if (dateRange.value.length === 2) {
    params.date_from = dateRange.value[0]
    params.date_to = dateRange.value[1]
  }
  return params
}

const loadAuditLogs = async () => {
  loading.value = true
  try {
    const res = await getSystemAuditLogList(buildParams())
    auditLogs.value = res.data.data || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const handleQuery = async () => {
  query.page = 1
  await loadAuditLogs()
}

const handleReset = async () => {
  query.page = 1
  query.page_size = 10
  query.keyword = ''
  query.action = ''
  dateRange.value = []
  await loadAuditLogs()
}

const handleSizeChange = async () => {
  query.page = 1
  await loadAuditLogs()
}

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

onMounted(loadAuditLogs)
</script>

<style scoped>
.cash-ledger-audit-page {
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

.detail-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-cell__primary {
  color: #0f172a;
  font-weight: 600;
}

.detail-cell__secondary {
  color: #64748b;
  font-size: 12px;
}

.audit-change-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #334155;
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
