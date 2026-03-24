<template>
  <div class="audit-log-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">操作日志</div>
            <div class="page-subtitle">集中查看系统关键操作、操作者、实体对象和字段变更。日志只查不改，详情单独展开查看。</div>
          </div>
          <el-button type="primary" @click="handleQuery">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="模块">
          <el-select v-model="queryParams.module" placeholder="全部" clearable style="width: 140px" @clear="handleQuery">
            <el-option v-for="item in moduleOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="动作">
          <el-select v-model="queryParams.action" placeholder="全部" clearable style="width: 140px" @clear="handleQuery">
            <el-option v-for="item in actionOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户">
          <el-input
            v-model="queryParams.username"
            placeholder="用户名"
            clearable
            style="width: 160px"
            @clear="handleQuery"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="实体">
          <el-select v-model="queryParams.entity_type" placeholder="全部" clearable style="width: 160px" @clear="handleQuery">
            <el-option v-for="item in entityTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="实体编号">
          <el-input
            v-model="queryParams.entity_id"
            placeholder="实体编号"
            clearable
            style="width: 140px"
            @clear="handleQuery"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="Trace / 用户 / 实体"
            clearable
            style="width: 220px"
            @clear="handleQuery"
            @keyup.enter="handleQuery"
          />
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
        <el-table-column label="时间与模块" width="210">
          <template #default="{ row }">
            <div class="time-block">
              <div>{{ row.created_at }}</div>
              <div class="time-block__meta">{{ row.module }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="日志摘要" min-width="420">
          <template #default="{ row }">
            <div class="log-main">
              <div class="log-main__title">{{ formatAuditSummary(row) }}</div>
              <div class="log-main__meta">
                <span>{{ getEntityTypeLabel(row.entity_type) }}</span>
                <span v-if="row.entity_id">{{ row.entity_id }}</span>
                <span>{{ getActionLabel(row.action, row.entity_type) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="用户与来源" min-width="220">
          <template #default="{ row }">
            <div class="user-block">
              <div>{{ row.username || '系统' }}</div>
              <div class="user-block__meta">{{ row.ip_address || '无 IP' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Trace" width="180">
          <template #default="{ row }">
            <div class="trace-block">{{ row.trace_id || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看详情</el-button>
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

    <el-dialog v-model="detailVisible" title="日志详情" width="920px">
      <div v-if="currentLog" class="detail-layout">
        <section class="detail-card detail-card--main">
          <div class="detail-main">
            <div class="detail-main__title">{{ formatAuditSummary(currentLog) }}</div>
            <div class="detail-main__meta">
              <span>{{ currentLog.created_at }}</span>
              <span>{{ currentLog.module }}</span>
              <span>{{ getActionLabel(currentLog.action, currentLog.entity_type) }}</span>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">基础信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>操作用户</span>
              <strong>{{ currentLog.username || '系统' }}</strong>
            </div>
            <div class="detail-item">
              <span>实体类型</span>
              <strong>{{ getEntityTypeLabel(currentLog.entity_type) }}</strong>
            </div>
            <div class="detail-item">
              <span>实体编号</span>
              <strong>{{ currentLog.entity_id || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>Trace ID</span>
              <strong>{{ currentLog.trace_id || '-' }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>客户端</span>
              <strong>{{ currentLog.user_agent || '-' }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">字段变更</div>
          <el-table :data="currentChangeRows" size="small" border>
            <el-table-column prop="key" label="字段" width="180" />
            <el-table-column prop="before" label="变更前" />
            <el-table-column prop="after" label="变更后" />
          </el-table>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getSystemAuditLogList } from '../api'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { useFieldLabelStore } from '@/modules/common/stores/fieldLabelStore'
import { useAuditLogFormatter } from '@/modules/common/composables/useAuditLogFormatter'
import type { AuditLog } from '../types'

const loading = ref(false)
const detailVisible = ref(false)
const logList = ref<AuditLog[]>([])
const total = ref(0)
const currentLog = ref<AuditLog | null>(null)
const localeStore = useLocaleStore()
const fieldLabelStore = useFieldLabelStore()
const { formatAuditSummary, getActionLabel, getChangeRows, getEntityTypeLabel } = useAuditLogFormatter()

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

const entityTypeOptions = [
  { value: 'Product', label: '产品' },
  { value: 'ProductGroup', label: '产品归组' },
  { value: 'ProductCombo', label: '产品组合' },
  { value: 'PurchaseOrder', label: '采购单' },
  { value: 'ReplenishmentPlan', label: '采购计划' },
  { value: 'SalesOrder', label: '销售订单' },
  { value: 'Shipment', label: '货件' },
  { value: 'PackagingItem', label: '包材' },
  { value: 'PackagingPurchaseOrder', label: '包材采购单' },
  { value: 'ExchangeRate', label: '汇率' },
  { value: 'ConfigCenter', label: '配置中心' },
  { value: 'Menu', label: '菜单' },
  { value: 'User', label: '用户' },
  { value: 'Role', label: '角色' },
  { value: 'System', label: '系统' }
]


const currentChangeRows = computed(() => {
  if (!currentLog.value?.changes) {
    return []
  }
  return getChangeRows(currentLog.value.changes)
})

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await getSystemAuditLogList({
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

const handleView = (row: AuditLog) => {
  currentLog.value = row
  detailVisible.value = true
}

onMounted(() => {
  fieldLabelStore.ensureLoaded(localeStore.locale)
  loadLogs()
})
</script>

<style scoped>
.audit-log-container {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.page-subtitle {
  margin-top: 6px;
  color: #6b7280;
  line-height: 1.6;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.summary-card__label,
.summary-card__hint {
  color: #6b7280;
  font-size: 13px;
}

.summary-card__value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 600;
  color: #111827;
}

.summary-card__hint {
  margin-top: 8px;
}

.search-form {
  margin-bottom: 16px;
}

.time-block,
.user-block,
.log-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-block__meta,
.user-block__meta,
.log-main__meta {
  color: #6b7280;
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.log-main__title,
.detail-main__title {
  font-size: 14px;
  line-height: 1.7;
  color: #111827;
}

.trace-block {
  color: #374151;
  word-break: break-all;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px 20px;
  background: #fff;
}

.detail-card--main {
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
}

.detail-main__meta {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-card__title {
  margin-bottom: 14px;
  font-weight: 600;
  color: #111827;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item span {
  color: #6b7280;
  font-size: 13px;
}

.detail-item strong {
  color: #111827;
  font-size: 14px;
  line-height: 1.6;
}

.detail-item--full {
  grid-column: 1 / -1;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header,
  .summary-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }
}
</style>

