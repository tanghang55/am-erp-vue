<template>
  <div class="packaging-ledger-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ labels.title }}</span>
          <el-dropdown split-button type="primary" @command="handleCreateCommand">
            {{ labels.create }}
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="inbound">{{ labels.inbound }}</el-dropdown-item>
                <el-dropdown-item command="outbound">{{ labels.outbound }}</el-dropdown-item>
                <el-dropdown-item command="adjustment">{{ labels.adjustment }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>

      <div class="search-toolbar">
        <div class="search-toolbar__intro">
          <div class="search-toolbar__title">{{ labels.searchTitle }}</div>
          <div class="search-toolbar__meta">{{ labels.searchDescription }}</div>
        </div>
        <el-form :inline="true" :model="queryParams" class="filter-form">
          <el-form-item :label="labels.itemId" class="filter-form__item">
            <PackagingItemSelector
              v-model="queryParams.packaging_item_id"
              :placeholder="labels.itemSelectorPlaceholder"
              :clearable="true"
            />
          </el-form-item>

          <el-form-item :label="labels.transactionType">
            <el-select
              v-model="queryParams.transaction_type"
              :placeholder="labels.all"
              clearable
              style="width: 140px"
              @clear="handleQuery"
            >
              <el-option
                v-for="item in transactionTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="labels.dateRange">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              :range-separator="labels.to"
              :start-placeholder="labels.startDate"
              :end-placeholder="labels.endDate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateRangeChange"
            />
          </el-form-item>

          <el-form-item class="filter-form__actions">
            <el-button type="primary" @click="handleQuery">{{ labels.search }}</el-button>
            <el-button @click="handleReset">{{ labels.reset }}</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 流水列表 -->
      <el-table v-loading="loading" :data="ledgerList" border stripe>
        <el-table-column :label="labels.itemInfo" min-width="180">
          <template #default="{ row }">
            <div v-if="row.packaging_item">
              <div class="item-name">{{ row.packaging_item.item_name }}</div>
              <div class="item-code">
                {{ row.packaging_item.item_code }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.transactionType" width="100">
          <template #default="{ row }">
            <el-tag :type="getTransactionTypeColor(row.transaction_type)">
              {{ getTransactionTypeLabel(row.transaction_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.quantityInfo" min-width="220">
          <template #default="{ row }">
            <div class="quantity-block">
              <div class="quantity-line">
                <span class="quantity-label">{{ labels.quantityChange }}</span>
                <span
                  class="quantity-value"
                  :class="Number(row.quantity) >= 0 ? 'quantity-value--positive' : 'quantity-value--negative'"
                >
                  {{ Number(row.quantity) >= 0 ? '+' : '' }}{{ Number(row.quantity).toFixed(2) }}
                  {{ row.packaging_item?.unit || '' }}
                </span>
              </div>
              <div class="quantity-line">
                <span class="quantity-label">{{ labels.stockSnapshot }}</span>
                <span class="quantity-value">{{ Number(row.quantity_before).toFixed(2) }} → {{ Number(row.quantity_after).toFixed(2) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.costInfo" min-width="180">
          <template #default="{ row }">
            <div class="quantity-block">
              <div class="quantity-line">
                <span class="quantity-label">{{ labels.unitCost }}</span>
                <span class="quantity-value">{{ Number(row.unit_cost).toFixed(4) }}</span>
              </div>
              <div class="quantity-line">
                <span class="quantity-label">{{ labels.totalCost }}</span>
                <span class="quantity-value">{{ Number(row.total_cost).toFixed(2) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.occurredAt" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.occurred_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="notes" :label="labels.notes" min-width="150" show-overflow-tooltip />
      </el-table>

      <!-- 分页 -->
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

      <!-- 创建流水对话框 -->
      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
        <div class="dialog-layout">
          <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px" class="dialog-form">
            <el-form-item :label="labels.item" prop="packaging_item_id">
              <PackagingItemSelector
                v-model="formData.packaging_item_id"
                :placeholder="labels.itemSelectorInput"
                @change="handlePackagingItemChange"
              />
            </el-form-item>

            <el-form-item :label="labels.quantity" prop="quantity">
              <el-input-number
                v-model="formData.quantity"
                :precision="2"
                :step="1"
                :min="0.01"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item :label="labels.unitCost">
              <el-input-number
                v-model="formData.unit_cost"
                :precision="4"
                :step="0.01"
                :min="0"
                style="width: 100%"
                :placeholder="labels.unitCostPlaceholder"
              />
            </el-form-item>

            <el-form-item :label="labels.occurredAt">
              <el-date-picker
                v-model="formData.occurred_at"
                type="datetime"
                :placeholder="labels.occurredAtPlaceholder"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>

            <el-form-item :label="labels.notes">
              <el-input
                v-model="formData.notes"
                type="textarea"
                :rows="3"
                :placeholder="labels.notesPlaceholder"
              />
            </el-form-item>
          </el-form>

          <div class="dialog-summary">
            <div class="detail-summary-title">{{ labels.dialogSummary }}</div>
            <div class="detail-summary-line">
              <span>{{ labels.transactionType }}</span>
              <span>{{ currentTransactionTypeLabel }}</span>
            </div>
            <div class="detail-summary-line">
              <span>{{ labels.quantity }}</span>
              <span>{{ Number(formData.quantity || 0).toFixed(2) }}</span>
            </div>
            <div class="detail-summary-line">
              <span>{{ labels.unitCost }}</span>
              <span>{{ Number(formData.unit_cost || 0).toFixed(4) }}</span>
            </div>
            <div class="detail-summary-line detail-summary-line--total">
              <span>{{ labels.totalCost }}</span>
              <span>{{ dialogTotalCost }}</span>
            </div>
          </div>
        </div>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">{{ labels.confirm }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  getPackagingLedgerList,
  createInboundLedger,
  createOutboundLedger,
  createAdjustmentLedger
} from '../api'
import PackagingItemSelector from '../components/PackagingItemSelector.vue'
import {
  type PackagingLedger,
  type PackagingItem,
  type CreatePackagingLedgerRequest,
  type PackagingLedgerQueryParams,
  TransactionType
} from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const route = useRoute()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Packaging Ledger',
      create: 'New Entry',
      inbound: 'Inbound',
      outbound: 'Outbound',
      adjustment: 'Adjustment',
      itemId: 'Item',
      itemSelectorPlaceholder: 'Select item',
      transactionType: 'Transaction Type',
      all: 'All',
      dateRange: 'Date Range',
      searchTitle: 'Search ledger entries',
      searchDescription: 'Search quickly by item, transaction type and date range.',
      to: 'to',
      startDate: 'Start Date',
      endDate: 'End Date',
      search: 'Search',
      reset: 'Reset',
      itemInfo: 'Item Info',
      quantityChange: 'Quantity Change',
      quantityInfo: 'Quantity',
      stockSnapshot: 'Stock Snapshot',
      costInfo: 'Cost',
      unitCost: 'Unit Cost',
      totalCost: 'Total Cost',
      occurredAt: 'Occurred At',
      notes: 'Notes',
      item: 'Item',
      itemSelectorInput: 'Select item',
      quantity: 'Quantity',
      unitCostPlaceholder: 'Leave empty to use default cost',
      occurredAtPlaceholder: 'Select date/time',
      notesPlaceholder: 'Enter notes',
      cancel: 'Cancel',
      confirm: 'Confirm',
      createInbound: 'Create Inbound Entry',
      createOutbound: 'Create Outbound Entry',
      createAdjustment: 'Create Adjustment Entry',
      created: 'Created',
      entryCount: 'Entries',
      netChange: 'Net Change',
      dialogSummary: 'Summary',
      loadFail: 'Failed to load ledger list',
      submitFail: 'Operation failed',
      itemRequired: 'Please select item',
      quantityRequired: 'Please enter quantity'
    }
  }
  return {
    title: '包装材料流水',
    create: '新增流水',
    inbound: '入库',
    outbound: '出库',
    adjustment: '调整',
    itemId: '包材',
    itemSelectorPlaceholder: '选择包材',
    transactionType: '流水类型',
    all: '全部',
    dateRange: '日期范围',
    searchTitle: '搜索包材流水',
    searchDescription: '按包材、流水类型和日期范围快速定位库存变动。',
    to: '至',
    startDate: '开始日期',
    endDate: '结束日期',
    search: '查询',
    reset: '重置',
    itemInfo: '物料信息',
    quantityChange: '数量变化',
    quantityInfo: '数量情况',
    stockSnapshot: '库存快照',
    costInfo: '成本情况',
    unitCost: '单位成本',
    totalCost: '总成本',
    occurredAt: '发生时间',
    notes: '备注',
    item: '包装物料',
    itemSelectorInput: '选择包材',
    quantity: '数量',
    unitCostPlaceholder: '留空使用默认成本',
    occurredAtPlaceholder: '选择日期时间',
    notesPlaceholder: '请输入备注',
    cancel: '取消',
    confirm: '确定',
    createInbound: '创建入库流水',
    createOutbound: '创建出库流水',
    createAdjustment: '创建调整流水',
    created: '创建成功',
    entryCount: '流水数',
    netChange: '净变化',
    dialogSummary: '本次摘要',
    loadFail: '获取流水列表失败',
    submitFail: '操作失败',
    itemRequired: '请选择包材',
    quantityRequired: '请输入数量'
  }
})

const transactionTypeOptions = computed(() => {
  if (localeStore.isEnglish) {
    return [
      { label: 'Inbound', value: TransactionType.IN, type: 'success' },
      { label: 'Outbound', value: TransactionType.OUT, type: 'danger' },
      { label: 'Adjustment', value: TransactionType.ADJUSTMENT, type: 'warning' }
    ]
  }
  return [
    { label: '入库', value: TransactionType.IN, type: 'success' },
    { label: '出库', value: TransactionType.OUT, type: 'danger' },
    { label: '调整', value: TransactionType.ADJUSTMENT, type: 'warning' }
  ]
})

const getTransactionTypeLabel = (type: TransactionType) => {
  const match = transactionTypeOptions.value.find(item => item.value === type)
  return match?.label || type
}

const getTransactionTypeColor = (type: TransactionType) => {
  const match = transactionTypeOptions.value.find(item => item.value === type)
  return match?.type || 'info'
}

const currentTransactionTypeLabel = computed(() => {
  const typeMap: Record<typeof transactionType.value, TransactionType> = {
    inbound: TransactionType.IN,
    outbound: TransactionType.OUT,
    adjustment: TransactionType.ADJUSTMENT
  }
  return getTransactionTypeLabel(typeMap[transactionType.value])
})

// 数据
const loading = ref(false)
const ledgerList = ref<PackagingLedger[]>([])
const total = ref(0)
const dateRange = ref<[string, string] | null>(null)

// 查询参数
const queryParams = reactive<PackagingLedgerQueryParams>({
  page: 1,
  page_size: 20,
  packaging_item_id: route.query.packaging_item_id
    ? Number(route.query.packaging_item_id)
    : undefined
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const transactionType = ref<'inbound' | 'outbound' | 'adjustment'>('inbound')

// 表单数据
const formData = reactive<CreatePackagingLedgerRequest>({
  packaging_item_id: 0,
  quantity: 0,
  occurred_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
})

// 表单验证规则
const formRules = computed<FormRules>(() => ({
  packaging_item_id: [{ required: true, message: labels.value.itemRequired, trigger: 'blur' }],
  quantity: [{ required: true, message: labels.value.quantityRequired, trigger: 'blur' }]
}))

const dialogTotalCost = computed(() => {
  const quantity = Number(formData.quantity || 0)
  const unitCost = Number(formData.unit_cost || 0)
  return (quantity * unitCost).toFixed(2)
})

// 方法
const fetchList = async () => {
  loading.value = true
  try {
    const res = await getPackagingLedgerList(queryParams)
    ledgerList.value = res.data?.data || []
    total.value = res.data?.total || 0
  } catch (error: any) {
    ElMessage.error(`${labels.value.loadFail}: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchList()
}

const handleReset = () => {
  Object.assign(queryParams, {
    page: 1,
    page_size: 20,
    packaging_item_id: undefined,
    transaction_type: undefined,
    date_from: undefined,
    date_to: undefined
  })
  dateRange.value = null
  fetchList()
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

const handleCreateCommand = (command: 'inbound' | 'outbound' | 'adjustment') => {
  transactionType.value = command
  const titles = {
    inbound: labels.value.createInbound,
    outbound: labels.value.createOutbound,
    adjustment: labels.value.createAdjustment
  }
  dialogTitle.value = titles[command]
  resetForm()
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const apiMap = {
        inbound: createInboundLedger,
        outbound: createOutboundLedger,
        adjustment: createAdjustmentLedger
      }

      await apiMap[transactionType.value](formData)
      ElMessage.success(labels.value.created)

      dialogVisible.value = false
      fetchList()
    } catch (error: any) {
      ElMessage.error(`${labels.value.submitFail}: ${error.message}`)
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
    packaging_item_id: queryParams.packaging_item_id || 0,
    quantity: 0,
    unit_cost: undefined,
    occurred_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    notes: undefined
  })
}

const handlePackagingItemChange = (item: PackagingItem | null) => {
  if (!item) return
  if (formData.unit_cost === undefined || formData.unit_cost === null) {
    formData.unit_cost = item.unit_cost
  }
}

const formatDateTime = (dateStr: string) => {
  return dateStr.replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  dialogTitle.value = labels.value.createInbound
  fetchList()
})
</script>

<style scoped>
.packaging-ledger-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
}

.search-toolbar__intro {
  min-width: 220px;
}

.search-toolbar__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.search-toolbar__meta {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.filter-form {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px 16px;
}

.filter-form__item {
  min-width: 220px;
}

.filter-form__actions {
  margin-left: auto;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-tile {
  padding: 14px 16px;
  border-radius: 12px;
  background: #f7f9fc;
}

.summary-label {
  color: #909399;
  font-size: 12px;
}

.summary-value {
  margin-top: 8px;
  color: #303133;
  font-size: 22px;
  font-weight: 600;
}

.summary-value--positive {
  color: #67c23a;
}

.summary-value--negative {
  color: #f56c6c;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.item-name {
  color: #111827;
  font-weight: 600;
}

.item-code {
  color: #6b7280;
  font-size: 12px;
}

.quantity-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quantity-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.quantity-label {
  color: #909399;
  font-size: 12px;
}

@media (max-width: 960px) {
  .search-toolbar {
    flex-direction: column;
  }

  .search-toolbar__intro {
    min-width: 0;
  }
}

.quantity-value {
  color: #303133;
  font-weight: 600;
}

.quantity-value--positive {
  color: #67c23a;
}

.quantity-value--negative {
  color: #f56c6c;
}

.dialog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 16px;
}

.dialog-summary {
  padding: 14px 16px;
  border-radius: 12px;
  background: #f7f9fc;
  align-self: start;
}

.detail-summary-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.detail-summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  color: #606266;
  font-size: 13px;
}

.detail-summary-line--total {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  color: #303133;
  font-weight: 600;
}

@media (max-width: 960px) {
  .dialog-layout {
    grid-template-columns: 1fr;
  }
}
</style>

