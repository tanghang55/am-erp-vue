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

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item :label="labels.itemId">
          <el-input-number
            v-model="queryParams.packaging_item_id"
            :controls="false"
            :placeholder="labels.itemIdPlaceholder"
            style="width: 120px"
            clearable
          />
        </el-form-item>

        <el-form-item :label="labels.transactionType">
          <el-select
            v-model="queryParams.transaction_type"
            :placeholder="labels.all"
            clearable
            style="width: 120px"
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

        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ labels.search }}</el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 流水列表 -->
      <el-table v-loading="loading" :data="ledgerList" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column :label="labels.itemInfo" min-width="180">
          <template #default="{ row }">
            <div v-if="row.packaging_item">
              <div>[{{ row.packaging_item.item_code }}]</div>
              <div style="color: #909399; font-size: 12px">
                {{ row.packaging_item.item_name }}
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
        <el-table-column :label="labels.quantityChange" width="150" align="right">
          <template #default="{ row }">
            <span
              :style="{
                color: Number(row.quantity) >= 0 ? '#67C23A' : '#F56C6C',
                fontWeight: 'bold'
              }"
            >
              {{ Number(row.quantity) >= 0 ? '+' : '' }}{{ Number(row.quantity).toFixed(2) }}
              {{ row.packaging_item?.unit || '' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.stockSnapshot" width="180" align="center">
          <template #default="{ row }">
            <div>
              {{ Number(row.quantity_before).toFixed(2) }} →
              {{ Number(row.quantity_after).toFixed(2) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.unitCost" width="120" align="right">
          <template #default="{ row }">
            {{ Number(row.unit_cost).toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column :label="labels.totalCost" width="120" align="right">
          <template #default="{ row }">
            {{ Number(row.total_cost).toFixed(2) }}
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
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item :label="labels.item" prop="packaging_item_id">
          <el-input-number
            v-model="formData.packaging_item_id"
            :controls="false"
            :placeholder="labels.itemIdInput"
            style="width: 100%"
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
import {
  type PackagingLedger,
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
      itemId: 'Item ID',
      itemIdPlaceholder: 'Item ID',
      transactionType: 'Transaction Type',
      all: 'All',
      dateRange: 'Date Range',
      to: 'to',
      startDate: 'Start Date',
      endDate: 'End Date',
      search: 'Search',
      reset: 'Reset',
      itemInfo: 'Item Info',
      quantityChange: 'Quantity Change',
      stockSnapshot: 'Stock Snapshot',
      unitCost: 'Unit Cost',
      totalCost: 'Total Cost',
      occurredAt: 'Occurred At',
      notes: 'Notes',
      item: 'Item',
      itemIdInput: 'Enter item ID',
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
      loadFail: 'Failed to load ledger list',
      submitFail: 'Operation failed',
      itemRequired: 'Please enter item ID',
      quantityRequired: 'Please enter quantity'
    }
  }
  return {
    title: '包装材料流水',
    create: '新增流水',
    inbound: '入库',
    outbound: '出库',
    adjustment: '调整',
    itemId: '物料ID',
    itemIdPlaceholder: '物料ID',
    transactionType: '流水类型',
    all: '全部',
    dateRange: '日期范围',
    to: '至',
    startDate: '开始日期',
    endDate: '结束日期',
    search: '查询',
    reset: '重置',
    itemInfo: '物料信息',
    quantityChange: '数量变化',
    stockSnapshot: '库存快照',
    unitCost: '单位成本',
    totalCost: '总成本',
    occurredAt: '发生时间',
    notes: '备注',
    item: '包装物料',
    itemIdInput: '输入物料ID',
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
    loadFail: '获取流水列表失败',
    submitFail: '操作失败',
    itemRequired: '请输入物料ID',
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

.filter-form {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
