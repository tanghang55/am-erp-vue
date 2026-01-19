<template>
  <div class="cash-ledger-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ labels.title }}</span>
          <el-button type="primary" @click="handleCreate">{{ labels.create }}</el-button>
        </div>
      </template>

      <!-- 汇总卡片 -->
      <el-row :gutter="16" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic :title="labels.totalIncome" :value="summary.total_income" :precision="2" prefix="¥">
            <template #suffix>
              <span style="font-size: 12px; color: #909399">({{ summary.income_count }}{{ labels.countUnit }})</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic :title="labels.totalExpense" :value="summary.total_expense" :precision="2" prefix="¥">
            <template #suffix>
              <span style="font-size: 12px; color: #909399">({{ summary.expense_count }}{{ labels.countUnit }})</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic
            :title="labels.netProfit"
            :value="summary.net_profit"
            :precision="2"
            prefix="¥"
            :value-style="{ color: summary.net_profit >= 0 ? '#67C23A' : '#F56C6C' }"
          />
        </el-col>
      </el-row>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item :label="labels.ledgerType">
          <el-select
            v-model="queryParams.ledger_type"
            :placeholder="labels.all"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in ledgerTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="labels.category">
          <el-select v-model="queryParams.category" :placeholder="labels.all" clearable style="width: 140px">
            <el-option
              v-for="item in categoryOptions"
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

        <el-form-item :label="labels.keyword">
          <el-input
            v-model="queryParams.keyword"
            :placeholder="labels.keywordPlaceholder"
            clearable
            style="width: 200px"
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
        <el-table-column :label="labels.ledgerType" width="80">
          <template #default="{ row }">
            <el-tag :type="getLedgerTypeColor(row.ledger_type)">
              {{ getLedgerTypeLabel(row.ledger_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.category" width="100">
          <template #default="{ row }">
            {{ getLedgerCategoryLabel(row.category) }}
          </template>
        </el-table-column>
        <el-table-column :label="labels.amount" width="140" align="right">
          <template #default="{ row }">
            <span
              :style="{
                color: row.ledger_type === 'INCOME' ? '#67C23A' : '#F56C6C',
                fontWeight: 'bold'
              }"
            >
              {{ row.ledger_type === 'INCOME' ? '+' : '-' }}{{ row.currency }} {{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" :label="labels.description" min-width="200" show-overflow-tooltip />
        <el-table-column :label="labels.occurredAt" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.occurred_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="labels.reference" width="150">
          <template #default="{ row }">
            <span v-if="row.reference_type">
              {{ row.reference_type }} #{{ row.reference_id }}
            </span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.actions" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">{{ labels.edit }}</el-button>
            <el-button link type="danger" @click="handleDelete(row)">{{ labels.delete }}</el-button>
          </template>
        </el-table-column>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item :label="labels.ledgerType" prop="ledger_type">
          <el-radio-group v-model="formData.ledger_type" @change="handleLedgerTypeChange">
            <el-radio
              v-for="item in ledgerTypeOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="labels.category" prop="category">
          <el-select v-model="formData.category" :placeholder="labels.categoryPlaceholder" style="width: 100%">
            <el-option
              v-for="item in formCategoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="labels.amount" prop="amount">
          <el-input-number
            v-model="formData.amount"
            :precision="2"
            :step="0.01"
            :min="0.01"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="labels.currency" prop="currency">
          <el-input v-model="formData.currency" placeholder="CNY" />
        </el-form-item>

        <el-form-item :label="labels.occurredAt" prop="occurred_at">
          <el-date-picker
            v-model="formData.occurred_at"
            type="datetime"
            :placeholder="labels.occurredAtPlaceholder"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="labels.description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            :placeholder="labels.descriptionPlaceholder"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  getCashLedgerList,
  createCashLedger,
  updateCashLedger,
  deleteCashLedger,
  getCashLedgerSummary
} from '../api'
import {
  type CashLedger,
  type CreateCashLedgerRequest,
  type CashLedgerQueryParams,
  type CashLedgerSummary,
  LedgerType,
  LedgerCategory
} from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Cash Ledger',
      create: 'New Entry',
      totalIncome: 'Total Income',
      totalExpense: 'Total Expense',
      netProfit: 'Net Profit',
      countUnit: 'items',
      ledgerType: 'Type',
      category: 'Category',
      amount: 'Amount',
      description: 'Description',
      occurredAt: 'Occurred At',
      reference: 'Reference',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      all: 'All',
      dateRange: 'Date Range',
      to: 'to',
      startDate: 'Start Date',
      endDate: 'End Date',
      keyword: 'Keyword',
      keywordPlaceholder: 'Search description',
      search: 'Search',
      reset: 'Reset',
      categoryPlaceholder: 'Select category',
      currency: 'Currency',
      occurredAtPlaceholder: 'Select date/time',
      descriptionPlaceholder: 'Enter description',
      cancel: 'Cancel',
      confirm: 'Confirm',
      createdTitle: 'New Entry',
      editTitle: 'Edit Entry',
      deleteConfirm: 'Delete entry #{id}?',
      confirmTitle: 'Confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      deleted: 'Deleted',
      updated: 'Updated',
      created: 'Created',
      loadFail: 'Failed to load ledger list',
      deleteFail: 'Delete failed',
      submitFail: 'Operation failed',
      typeRequired: 'Please select ledger type',
      categoryRequired: 'Please select category',
      amountRequired: 'Please enter amount',
      currencyRequired: 'Please enter currency'
    }
  }
  return {
    title: '现金流水管理',
    create: '新增流水',
    totalIncome: '总收入',
    totalExpense: '总支出',
    netProfit: '净利润',
    countUnit: '笔',
    ledgerType: '流水类型',
    category: '类别',
    amount: '金额',
    description: '描述',
    occurredAt: '发生日期',
    reference: '关联单据',
    actions: '操作',
    edit: '编辑',
    delete: '删除',
    all: '全部',
    dateRange: '日期范围',
    to: '至',
    startDate: '开始日期',
    endDate: '结束日期',
    keyword: '关键词',
    keywordPlaceholder: '搜索描述',
    search: '查询',
    reset: '重置',
    categoryPlaceholder: '请选择类别',
    currency: '货币',
    occurredAtPlaceholder: '选择日期时间',
    descriptionPlaceholder: '请输入描述',
    cancel: '取消',
    confirm: '确定',
    createdTitle: '新增流水',
    editTitle: '编辑流水',
    deleteConfirm: '确定要删除流水 #{id} 吗?',
    confirmTitle: '提示',
    confirmText: '确定',
    cancelText: '取消',
    deleted: '删除成功',
    updated: '更新成功',
    created: '创建成功',
    loadFail: '获取流水列表失败',
    deleteFail: '删除失败',
    submitFail: '操作失败',
    typeRequired: '请选择流水类型',
    categoryRequired: '请选择类别',
    amountRequired: '请输入金额',
    currencyRequired: '请输入货币'
  }
})

const ledgerTypeOptions = computed(() => {
  if (localeStore.isEnglish) {
    return [
      { label: 'Income', value: LedgerType.INCOME, type: 'success' },
      { label: 'Expense', value: LedgerType.EXPENSE, type: 'danger' }
    ]
  }
  return [
    { label: '收入', value: LedgerType.INCOME, type: 'success' },
    { label: '支出', value: LedgerType.EXPENSE, type: 'danger' }
  ]
})

const categoryLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      SALES_REVENUE: 'Sales Revenue',
      PURCHASE_COST: 'Purchase Cost',
      SHIPPING_FEE: 'Shipping Fee',
      PACKAGING_COST: 'Packaging Cost',
      OTHER_INCOME: 'Other Income',
      OTHER_EXPENSE: 'Other Expense'
    }
  }
  return {
    SALES_REVENUE: '销售收入',
    PURCHASE_COST: '采购成本',
    SHIPPING_FEE: '运费',
    PACKAGING_COST: '包装成本',
    OTHER_INCOME: '其他收入',
    OTHER_EXPENSE: '其他支出'
  }
})

// 数据
const loading = ref(false)
const ledgerList = ref<CashLedger[]>([])
const total = ref(0)
const dateRange = ref<[string, string] | null>(null)
const summary = ref<CashLedgerSummary>({
  total_income: 0,
  income_count: 0,
  total_expense: 0,
  expense_count: 0,
  net_profit: 0
})

// 查询参数
const queryParams = reactive<CashLedgerQueryParams>({
  page: 1,
  page_size: 20
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)

// 表单数据
const formData = reactive<CreateCashLedgerRequest>({
  ledger_type: LedgerType.EXPENSE,
  category: 'PURCHASE_COST' as any,
  amount: 0,
  currency: 'CNY',
  occurred_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
})

// 表单验证规则
const formRules = computed<FormRules>(() => ({
  ledger_type: [{ required: true, message: labels.value.typeRequired, trigger: 'change' }],
  category: [{ required: true, message: labels.value.categoryRequired, trigger: 'change' }],
  amount: [{ required: true, message: labels.value.amountRequired, trigger: 'blur' }],
  currency: [{ required: true, message: labels.value.currencyRequired, trigger: 'blur' }]
}))

// 计算属性
const allCategoryOptions = computed(() => {
  const labelsMap = categoryLabels.value as Record<string, string>
  return [
    { label: labelsMap[LedgerCategory.SALES_REVENUE], value: LedgerCategory.SALES_REVENUE, ledger_type: LedgerType.INCOME },
    { label: labelsMap[LedgerCategory.PURCHASE_COST], value: LedgerCategory.PURCHASE_COST, ledger_type: LedgerType.EXPENSE },
    { label: labelsMap[LedgerCategory.SHIPPING_FEE], value: LedgerCategory.SHIPPING_FEE, ledger_type: LedgerType.EXPENSE },
    { label: labelsMap[LedgerCategory.PACKAGING_COST], value: LedgerCategory.PACKAGING_COST, ledger_type: LedgerType.EXPENSE },
    { label: labelsMap[LedgerCategory.OTHER_INCOME], value: LedgerCategory.OTHER_INCOME, ledger_type: LedgerType.INCOME },
    { label: labelsMap[LedgerCategory.OTHER_EXPENSE], value: LedgerCategory.OTHER_EXPENSE, ledger_type: LedgerType.EXPENSE }
  ]
})

const categoryOptions = computed(() => {
  if (queryParams.ledger_type) {
    return allCategoryOptions.value.filter(item => item.ledger_type === queryParams.ledger_type)
  }
  return allCategoryOptions.value
})

const formCategoryOptions = computed(() => {
  return allCategoryOptions.value.filter(item => item.ledger_type === formData.ledger_type)
})

const getLedgerTypeLabel = (type: LedgerType) => {
  const match = ledgerTypeOptions.value.find(item => item.value === type)
  return match?.label || type
}

const getLedgerTypeColor = (type: LedgerType) => {
  const match = ledgerTypeOptions.value.find(item => item.value === type)
  return match?.type || 'info'
}

const getLedgerCategoryLabel = (category: LedgerCategory) => {
  const labelsMap = categoryLabels.value as Record<string, string>
  return labelsMap[category] || category
}

// 方法
const fetchList = async () => {
  loading.value = true
  try {
    const res = await getCashLedgerList(queryParams)
    ledgerList.value = res.data.items
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(`${labels.value.loadFail}: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const fetchSummary = async () => {
  try {
    const res = await getCashLedgerSummary({
      date_from: queryParams.date_from,
      date_to: queryParams.date_to
    })
    summary.value = res.data
  } catch (error: any) {
    console.error('Failed to load summary:', error)
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchList()
  fetchSummary()
}

const handleReset = () => {
  Object.assign(queryParams, {
    page: 1,
    page_size: 20,
    ledger_type: undefined,
    category: undefined,
    keyword: undefined,
    date_from: undefined,
    date_to: undefined
  })
  dateRange.value = null
  fetchList()
  fetchSummary()
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

const handleCreate = () => {
  dialogTitle.value = labels.value.createdTitle
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: CashLedger) => {
  dialogTitle.value = labels.value.editTitle
  editingId.value = row.id
  Object.assign(formData, {
    ledger_type: row.ledger_type,
    category: row.category,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    occurred_at: row.occurred_at
  })
  dialogVisible.value = true
}

const handleDelete = async (row: CashLedger) => {
  try {
    await ElMessageBox.confirm(labels.value.deleteConfirm.replace('{id}', String(row.id)), labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'warning'
    })

    await deleteCashLedger(row.id)
    ElMessage.success(labels.value.deleted)
    fetchList()
    fetchSummary()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`${labels.value.deleteFail}: ${error.message}`)
    }
  }
}

const handleLedgerTypeChange = () => {
  // 清空类别选择
  formData.category = '' as any
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (editingId.value) {
        await updateCashLedger(editingId.value, formData)
        ElMessage.success(labels.value.updated)
      } else {
        await createCashLedger(formData)
        ElMessage.success(labels.value.created)
      }

      dialogVisible.value = false
      fetchList()
      fetchSummary()
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
    ledger_type: LedgerType.EXPENSE,
    category: '' as any,
    amount: 0,
    currency: 'CNY',
    reference_type: undefined,
    reference_id: undefined,
    description: undefined,
    occurred_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
  })
}

const formatDateTime = (dateStr: string) => {
  return dateStr.replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  dialogTitle.value = labels.value.createdTitle
  fetchList()
  fetchSummary()
})
</script>

<style scoped>
.cash-ledger-container {
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
