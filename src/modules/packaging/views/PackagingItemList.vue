<template>
  <div class="packaging-item-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ labels.title }}</span>
          <div>
            <el-button type="warning" @click="viewLowStock">{{ labels.lowStock }}</el-button>
            <el-button type="primary" @click="handleCreate">{{ labels.create }}</el-button>
          </div>
        </div>
      </template>

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item :label="labels.category">
          <el-select
            v-model="queryParams.category"
            :placeholder="labels.all"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="labels.status">
          <el-select v-model="queryParams.status" :placeholder="labels.all" clearable style="width: 120px">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="labels.keyword">
          <el-input
            v-model="queryParams.keyword"
            :placeholder="labels.keywordPlaceholder"
            clearable
            style="width: 220px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ labels.search }}</el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 材料列表 -->
      <el-table v-loading="loading" :data="itemList" border stripe>
        <el-table-column prop="item_code" :label="labels.itemCode" width="120" />
        <el-table-column prop="item_name" :label="labels.itemName" min-width="150" />
        <el-table-column :label="labels.category" width="100">
          <template #default="{ row }">
            <el-tag>{{ getPackagingCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="specification" :label="labels.specification" min-width="150" show-overflow-tooltip />
        <el-table-column :label="labels.unitCost" width="120" align="right">
          <template #default="{ row }">
            {{ row.currency }} {{ Number(row.unit_cost).toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column :label="labels.stockQty" width="120" align="right">
          <template #default="{ row }">
            <span
              :style="{
                color:
                  row.reorder_point && row.quantity_on_hand <= row.reorder_point
                    ? '#F56C6C'
                    : '#606266'
              }"
            >
              {{ Number(row.quantity_on_hand).toFixed(2) }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.reorderPoint" width="100" align="right">
          <template #default="{ row }">
            {{ row.reorder_point ? Number(row.reorder_point).toFixed(2) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="supplier_name" :label="labels.supplier" width="120" show-overflow-tooltip />
        <el-table-column :label="labels.status" width="80">
          <template #default="{ row }">
            <el-tag :type="getPackagingStatusColor(row.status)">
              {{ getPackagingStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.actions" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">{{ labels.edit }}</el-button>
            <el-button link type="success" @click="viewLedger(row)">{{ labels.ledger }}</el-button>
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
      width="700px"
      @close="handleDialogClose"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="labels.itemCode" prop="item_code">
              <el-input v-model="formData.item_code" :placeholder="labels.itemCodePlaceholder" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.itemName" prop="item_name">
              <el-input v-model="formData.item_name" :placeholder="labels.itemNamePlaceholder" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="labels.category" prop="category">
              <el-select v-model="formData.category" :placeholder="labels.categoryPlaceholder" style="width: 100%">
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.specification">
              <el-input v-model="formData.specification" :placeholder="labels.specPlaceholder" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="labels.unitCost" prop="unit_cost">
              <el-input-number
                v-model="formData.unit_cost"
                :precision="4"
                :step="0.01"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="labels.currency">
              <el-input v-model="formData.currency" placeholder="CNY" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="labels.unit">
              <el-select v-model="formData.unit" :placeholder="labels.unitPlaceholder" style="width: 100%">
                <el-option
                  v-for="item in unitOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item :label="labels.initialStock">
              <el-input-number
                v-model="formData.quantity_on_hand"
                :precision="2"
                :min="0"
                style="width: 100%"
                :disabled="!!editingId"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="labels.reorderPoint">
              <el-input-number
                v-model="formData.reorder_point"
                :precision="2"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="labels.reorderQty">
              <el-input-number
                v-model="formData.reorder_quantity"
                :precision="2"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="labels.supplier">
              <el-input v-model="formData.supplier_name" :placeholder="labels.supplierPlaceholder" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.supplierContact">
              <el-input v-model="formData.supplier_contact" :placeholder="labels.supplierContactPlaceholder" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="labels.status">
          <el-radio-group v-model="formData.status">
            <el-radio
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
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
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  getPackagingItemList,
  createPackagingItem,
  updatePackagingItem,
  deletePackagingItem
} from '../api'
import {
  type PackagingItem,
  type CreatePackagingItemRequest,
  type PackagingItemQueryParams,
  PackagingStatus,
  PackagingCategory
} from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const router = useRouter()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Packaging Materials',
      lowStock: 'Low Stock Alert',
      create: 'New Item',
      category: 'Category',
      status: 'Status',
      all: 'All',
      keyword: 'Keyword',
      keywordPlaceholder: 'Search code or name',
      search: 'Search',
      reset: 'Reset',
      itemCode: 'Item Code',
      itemName: 'Item Name',
      specification: 'Spec',
      unitCost: 'Unit Cost',
      stockQty: 'Stock Qty',
      reorderPoint: 'Reorder Point',
      supplier: 'Supplier',
      actions: 'Actions',
      edit: 'Edit',
      ledger: 'Ledger',
      delete: 'Delete',
      itemCodePlaceholder: 'e.g. BOX-001',
      itemNamePlaceholder: 'e.g. Small box',
      categoryPlaceholder: 'Select category',
      specPlaceholder: 'e.g. 20x15x10cm',
      currency: 'Currency',
      unit: 'Unit',
      unitPlaceholder: 'Unit',
      initialStock: 'Initial Stock',
      reorderQty: 'Reorder Qty',
      supplierPlaceholder: 'Supplier name',
      supplierContact: 'Supplier Contact',
      supplierContactPlaceholder: 'Phone or email',
      notes: 'Notes',
      notesPlaceholder: 'Enter notes',
      cancel: 'Cancel',
      confirm: 'Confirm',
      createTitle: 'New Material',
      editTitle: 'Edit Material',
      deleteConfirm: 'Delete material "{name}"?',
      confirmTitle: 'Confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      deleted: 'Deleted',
      updated: 'Updated',
      created: 'Created',
      loadFail: 'Failed to load list',
      deleteFail: 'Delete failed',
      submitFail: 'Operation failed',
      codeRequired: 'Please enter item code',
      nameRequired: 'Please enter item name',
      categoryRequired: 'Please select category',
      unitCostRequired: 'Please enter unit cost'
    }
  }
  return {
    title: '包装材料管理',
    lowStock: '低库存预警',
    create: '新增材料',
    category: '类别',
    status: '状态',
    all: '全部',
    keyword: '关键词',
    keywordPlaceholder: '搜索物料编码或名称',
    search: '查询',
    reset: '重置',
    itemCode: '物料编码',
    itemName: '物料名称',
    specification: '规格',
    unitCost: '单位成本',
    stockQty: '库存数量',
    reorderPoint: '补货点',
    supplier: '供应商',
    actions: '操作',
    edit: '编辑',
    ledger: '流水',
    delete: '删除',
    itemCodePlaceholder: '如: BOX-001',
    itemNamePlaceholder: '如: 小号纸箱',
    categoryPlaceholder: '请选择类别',
    specPlaceholder: '如: 20x15x10cm',
    currency: '货币',
    unit: '单位',
    unitPlaceholder: '单位',
    initialStock: '初始库存',
    reorderQty: '建议补货量',
    supplierPlaceholder: '供应商名称',
    supplierContact: '供应商联系方式',
    supplierContactPlaceholder: '电话或邮箱',
    notes: '备注',
    notesPlaceholder: '请输入备注',
    cancel: '取消',
    confirm: '确定',
    createTitle: '新增包装材料',
    editTitle: '编辑包装材料',
    deleteConfirm: '确定要删除包装材料 "{name}" 吗?',
    confirmTitle: '提示',
    confirmText: '确定',
    cancelText: '取消',
    deleted: '删除成功',
    updated: '更新成功',
    created: '创建成功',
    loadFail: '获取列表失败',
    deleteFail: '删除失败',
    submitFail: '操作失败',
    codeRequired: '请输入物料编码',
    nameRequired: '请输入物料名称',
    categoryRequired: '请选择类别',
    unitCostRequired: '请输入单位成本'
  }
})

const categoryOptions = computed(() => {
  if (localeStore.isEnglish) {
    return [
      { label: 'Box', value: PackagingCategory.BOX },
      { label: 'Bag', value: PackagingCategory.BAG },
      { label: 'Tape', value: PackagingCategory.TAPE },
      { label: 'Label', value: PackagingCategory.LABEL },
      { label: 'Bubble Wrap', value: PackagingCategory.BUBBLE_WRAP },
      { label: 'Filler', value: PackagingCategory.FILLER },
      { label: 'Other', value: PackagingCategory.OTHER }
    ]
  }
  return [
    { label: '纸箱', value: PackagingCategory.BOX },
    { label: '包装袋', value: PackagingCategory.BAG },
    { label: '胶带', value: PackagingCategory.TAPE },
    { label: '标签', value: PackagingCategory.LABEL },
    { label: '气泡膜', value: PackagingCategory.BUBBLE_WRAP },
    { label: '填充物', value: PackagingCategory.FILLER },
    { label: '其他', value: PackagingCategory.OTHER }
  ]
})

const statusOptions = computed(() => {
  if (localeStore.isEnglish) {
    return [
      { label: 'Active', value: PackagingStatus.ACTIVE, type: 'success' },
      { label: 'Inactive', value: PackagingStatus.INACTIVE, type: 'info' }
    ]
  }
  return [
    { label: '启用', value: PackagingStatus.ACTIVE, type: 'success' },
    { label: '停用', value: PackagingStatus.INACTIVE, type: 'info' }
  ]
})

const unitOptions = computed(() => {
  if (localeStore.isEnglish) {
    return [
      { label: 'PCS', value: 'PCS' },
      { label: 'Roll', value: 'ROLL' },
      { label: 'Meter', value: 'METER' },
      { label: 'KG', value: 'KG' },
      { label: 'Box', value: 'BOX' }
    ]
  }
  return [
    { label: '个', value: 'PCS' },
    { label: '卷', value: 'ROLL' },
    { label: '米', value: 'METER' },
    { label: '千克', value: 'KG' },
    { label: '箱', value: 'BOX' }
  ]
})

const getPackagingCategoryLabel = (category: PackagingCategory) => {
  const match = categoryOptions.value.find(item => item.value === category)
  return match?.label || category
}

const getPackagingStatusLabel = (status: PackagingStatus) => {
  const match = statusOptions.value.find(item => item.value === status)
  return match?.label || status
}

const getPackagingStatusColor = (status: PackagingStatus) => {
  const match = statusOptions.value.find(item => item.value === status)
  return match?.type || 'info'
}

// 数据
const loading = ref(false)
const itemList = ref<PackagingItem[]>([])
const total = ref(0)

// 查询参数
const queryParams = reactive<PackagingItemQueryParams>({
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
const formData = reactive<CreatePackagingItemRequest>({
  item_code: '',
  item_name: '',
  category: 'BOX' as any,
  unit_cost: 0,
  currency: 'CNY',
  unit: 'PCS',
  quantity_on_hand: 0,
  status: PackagingStatus.ACTIVE
})

// 表单验证规则
const formRules = computed<FormRules>(() => ({
  item_code: [{ required: true, message: labels.value.codeRequired, trigger: 'blur' }],
  item_name: [{ required: true, message: labels.value.nameRequired, trigger: 'blur' }],
  category: [{ required: true, message: labels.value.categoryRequired, trigger: 'change' }],
  unit_cost: [{ required: true, message: labels.value.unitCostRequired, trigger: 'blur' }]
}))

// 方法
const fetchList = async () => {
  loading.value = true
  try {
    const res = await getPackagingItemList(queryParams)
    itemList.value = res.data.items
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
    category: undefined,
    status: undefined,
    keyword: undefined
  })
  fetchList()
}

const handleCreate = () => {
  dialogTitle.value = labels.value.createTitle
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: PackagingItem) => {
  dialogTitle.value = labels.value.editTitle
  editingId.value = row.id
  Object.assign(formData, {
    item_code: row.item_code,
    item_name: row.item_name,
    category: row.category,
    specification: row.specification,
    unit_cost: row.unit_cost,
    currency: row.currency,
    unit: row.unit,
    reorder_point: row.reorder_point,
    reorder_quantity: row.reorder_quantity,
    supplier_name: row.supplier_name,
    supplier_contact: row.supplier_contact,
    status: row.status,
    notes: row.notes
  })
  dialogVisible.value = true
}

const handleDelete = async (row: PackagingItem) => {
  try {
    await ElMessageBox.confirm(labels.value.deleteConfirm.replace('{name}', row.item_name), labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'warning'
    })

    await deletePackagingItem(row.id)
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
        await updatePackagingItem(editingId.value, formData)
        ElMessage.success(labels.value.updated)
      } else {
        await createPackagingItem(formData)
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
    item_code: '',
    item_name: '',
    category: 'BOX' as any,
    specification: undefined,
    unit_cost: 0,
    currency: 'CNY',
    unit: 'PCS',
    quantity_on_hand: 0,
    reorder_point: undefined,
    reorder_quantity: undefined,
    supplier_name: undefined,
    supplier_contact: undefined,
    status: PackagingStatus.ACTIVE,
    notes: undefined
  })
}

const viewLedger = (row: PackagingItem) => {
  router.push({
    name: 'packaging-ledger',
    query: { packaging_item_id: row.id }
  })
}

const viewLowStock = () => {
  queryParams.low_stock = true
  queryParams.page = 1
  fetchList()
}

onMounted(() => {
  dialogTitle.value = labels.value.createTitle
  fetchList()
})
</script>

<style scoped>
.packaging-item-container {
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
