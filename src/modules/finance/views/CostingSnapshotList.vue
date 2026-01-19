<template>
  <div class="costing-snapshot-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ labels.title }}</span>
          <el-button type="primary" @click="handleCreate">{{ labels.create }}</el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item :label="labels.skuId">
          <el-input-number
            v-model="queryParams.sku_id"
            :controls="false"
            :placeholder="labels.skuIdPlaceholder"
            style="width: 140px"
            clearable
          />
        </el-form-item>

        <el-form-item :label="labels.costType">
          <el-select
            v-model="queryParams.cost_type"
            :placeholder="labels.all"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in costTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="labels.status">
          <el-select
            v-model="queryParams.is_current"
            :placeholder="labels.all"
            clearable
            style="width: 120px"
          >
            <el-option :label="labels.current" :value="true" />
            <el-option :label="labels.expired" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ labels.search }}</el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 快照列表 -->
      <el-table v-loading="loading" :data="snapshotList" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="sku_id" :label="labels.skuId" width="100" />
        <el-table-column :label="labels.costType" width="120">
          <template #default="{ row }">
            <el-tag>{{ getCostTypeLabel(row.cost_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.unitCost" width="140" align="right">
          <template #default="{ row }">
            <span style="font-weight: bold">
              {{ row.currency }} {{ Number(row.unit_cost).toFixed(4) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.effectiveRange" min-width="280">
          <template #default="{ row }">
            <div>
              <span style="color: #67c23a">{{ labels.start }}: {{ formatDateTime(row.effective_from) }}</span>
            </div>
            <div v-if="row.effective_to">
              <span style="color: #f56c6c">{{ labels.end }}: {{ formatDateTime(row.effective_to) }}</span>
            </div>
            <div v-else>
              <el-tag type="success" size="small">{{ labels.current }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="notes" :label="labels.notes" min-width="200" show-overflow-tooltip />
        <el-table-column :label="labels.createdAt" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
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
        <el-form-item :label="labels.skuId" prop="sku_id">
          <el-input-number
            v-model="formData.sku_id"
            :controls="false"
            :placeholder="labels.skuIdInput"
            style="width: 100%"
            :disabled="!!editingId"
          />
        </el-form-item>

        <el-form-item :label="labels.costType" prop="cost_type">
          <el-select
            v-model="formData.cost_type"
            :placeholder="labels.costTypePlaceholder"
            style="width: 100%"
            :disabled="!!editingId"
          >
            <el-option
              v-for="item in costTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="labels.unitCost" prop="unit_cost">
          <el-input-number
            v-model="formData.unit_cost"
            :precision="4"
            :step="0.01"
            :min="0.0001"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="labels.currency" prop="currency">
          <el-input v-model="formData.currency" placeholder="CNY" />
        </el-form-item>

        <el-form-item :label="labels.effectiveFrom" prop="effective_from">
          <el-date-picker
            v-model="formData.effective_from"
            type="datetime"
            :placeholder="labels.effectiveFromPlaceholder"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="labels.effectiveTo">
          <el-date-picker
            v-model="formData.effective_to"
            type="datetime"
            :placeholder="labels.effectiveToPlaceholder"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            clearable
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

        <el-alert
          v-if="!editingId && !formData.effective_to"
          :title="labels.warning"
          type="warning"
          :closable="false"
          style="margin-bottom: 16px"
        />
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  getCostingSnapshotList,
  createCostingSnapshot,
  updateCostingSnapshot,
  deleteCostingSnapshot
} from '../api'
import {
  type CostingSnapshot,
  type CreateCostingSnapshotRequest,
  type CostingSnapshotQueryParams,
  CostType
} from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Costing Snapshots',
      create: 'New Snapshot',
      skuId: 'SKU ID',
      skuIdPlaceholder: 'SKU ID',
      skuIdInput: 'Enter SKU ID',
      costType: 'Cost Type',
      costTypePlaceholder: 'Select cost type',
      status: 'Status',
      all: 'All',
      current: 'Current',
      expired: 'Expired',
      search: 'Search',
      reset: 'Reset',
      unitCost: 'Unit Cost',
      effectiveRange: 'Effective Range',
      start: 'Start',
      end: 'End',
      notes: 'Notes',
      notesPlaceholder: 'Enter notes',
      createdAt: 'Created At',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      currency: 'Currency',
      effectiveFrom: 'Effective From',
      effectiveFromPlaceholder: 'Select effective date',
      effectiveTo: 'Effective To',
      effectiveToPlaceholder: 'Leave empty for current',
      warning: 'Note: Creating a current snapshot will expire other snapshots for the same SKU and cost type.',
      cancel: 'Cancel',
      confirm: 'Confirm',
      createdTitle: 'New Snapshot',
      editTitle: 'Edit Snapshot',
      deleteConfirm: 'Delete snapshot #{id}?',
      confirmTitle: 'Confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      deleted: 'Deleted',
      updated: 'Updated',
      created: 'Created',
      loadFail: 'Failed to load snapshots',
      deleteFail: 'Delete failed',
      submitFail: 'Operation failed',
      skuRequired: 'Please enter SKU ID',
      costTypeRequired: 'Please select cost type',
      unitCostRequired: 'Please enter unit cost',
      currencyRequired: 'Please enter currency',
      effectiveFromRequired: 'Please select effective date'
    }
  }
  return {
    title: '成本快照管理',
    create: '新增快照',
    skuId: 'SKU ID',
    skuIdPlaceholder: 'SKU ID',
    skuIdInput: '输入 SKU ID',
    costType: '成本类型',
    costTypePlaceholder: '请选择成本类型',
    status: '状态',
    all: '全部',
    current: '当前有效',
    expired: '已失效',
    search: '查询',
    reset: '重置',
    unitCost: '单位成本',
    effectiveRange: '有效期',
    start: '开始',
    end: '结束',
    notes: '备注',
    notesPlaceholder: '请输入备注',
    createdAt: '创建时间',
    actions: '操作',
    edit: '编辑',
    delete: '删除',
    currency: '货币',
    effectiveFrom: '生效日期',
    effectiveFromPlaceholder: '选择生效日期',
    effectiveTo: '失效日期',
    effectiveToPlaceholder: '留空表示当前有效',
    warning: '注意：创建为当前有效成本时，同 SKU + 同类型的其他成本快照将自动失效',
    cancel: '取消',
    confirm: '确定',
    createdTitle: '新增快照',
    editTitle: '编辑快照',
    deleteConfirm: '确定要删除快照 #{id} 吗?',
    confirmTitle: '提示',
    confirmText: '确定',
    cancelText: '取消',
    deleted: '删除成功',
    updated: '更新成功',
    created: '创建成功',
    loadFail: '获取快照列表失败',
    deleteFail: '删除失败',
    submitFail: '操作失败',
    skuRequired: '请输入 SKU ID',
    costTypeRequired: '请选择成本类型',
    unitCostRequired: '请输入单位成本',
    currencyRequired: '请输入货币',
    effectiveFromRequired: '请选择生效日期'
  }
})

const costTypeOptions = computed(() => {
  if (localeStore.isEnglish) {
    return [
      { label: 'Purchase', value: CostType.PURCHASE },
      { label: 'Landed', value: CostType.LANDED },
      { label: 'Average', value: CostType.AVERAGE }
    ]
  }
  return [
    { label: '采购成本', value: CostType.PURCHASE },
    { label: '到岸成本', value: CostType.LANDED },
    { label: '平均成本', value: CostType.AVERAGE }
  ]
})

const getCostTypeLabelLocalized = (type: CostType) => {
  const match = costTypeOptions.value.find(item => item.value === type)
  return match?.label || type
}

// 数据
const loading = ref(false)
const snapshotList = ref<CostingSnapshot[]>([])
const total = ref(0)

// 查询参数
const queryParams = reactive<CostingSnapshotQueryParams>({
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
const formData = reactive<CreateCostingSnapshotRequest>({
  sku_id: 0,
  cost_type: CostType.PURCHASE,
  unit_cost: 0,
  currency: 'CNY',
  effective_from: new Date().toISOString().slice(0, 19).replace('T', ' ')
})

// 表单验证规则
const formRules = computed<FormRules>(() => ({
  sku_id: [{ required: true, message: labels.value.skuRequired, trigger: 'blur' }],
  cost_type: [{ required: true, message: labels.value.costTypeRequired, trigger: 'change' }],
  unit_cost: [{ required: true, message: labels.value.unitCostRequired, trigger: 'blur' }],
  currency: [{ required: true, message: labels.value.currencyRequired, trigger: 'blur' }],
  effective_from: [{ required: true, message: labels.value.effectiveFromRequired, trigger: 'change' }]
}))

// 方法
const fetchList = async () => {
  loading.value = true
  try {
    const res = await getCostingSnapshotList(queryParams)
    snapshotList.value = res.data.items
    total.value = res.data.total
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
    sku_id: undefined,
    cost_type: undefined,
    is_current: undefined
  })
  fetchList()
}

const handleCreate = () => {
  dialogTitle.value = labels.value.createdTitle
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: CostingSnapshot) => {
  dialogTitle.value = labels.value.editTitle
  editingId.value = row.id
  Object.assign(formData, {
    sku_id: row.sku_id,
    cost_type: row.cost_type,
    unit_cost: row.unit_cost,
    currency: row.currency,
    effective_from: row.effective_from,
    effective_to: row.effective_to,
    notes: row.notes
  })
  dialogVisible.value = true
}

const handleDelete = async (row: CostingSnapshot) => {
  try {
    await ElMessageBox.confirm(labels.value.deleteConfirm.replace('{id}', String(row.id)), labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'warning'
    })

    await deleteCostingSnapshot(row.id)
    ElMessage.success(labels.value.deleted)
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`${labels.value.deleteFail}: ${error.message}`)
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (editingId.value) {
        await updateCostingSnapshot(editingId.value, formData)
        ElMessage.success(labels.value.updated)
      } else {
        await createCostingSnapshot(formData)
        ElMessage.success(labels.value.created)
      }

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
    sku_id: 0,
    cost_type: CostType.PURCHASE,
    unit_cost: 0,
    currency: 'CNY',
    effective_from: new Date().toISOString().slice(0, 19).replace('T', ' '),
    effective_to: undefined,
    notes: undefined
  })
}

const formatDateTime = (dateStr: string) => {
  return dateStr.replace('T', ' ').slice(0, 19)
}

const getCostTypeLabel = (type: CostType) => {
  return getCostTypeLabelLocalized(type)
}

onMounted(() => {
  dialogTitle.value = labels.value.createdTitle
  fetchList()
})
</script>

<style scoped>
.costing-snapshot-container {
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
