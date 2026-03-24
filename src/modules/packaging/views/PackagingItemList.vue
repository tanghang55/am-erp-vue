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

      <div class="search-toolbar">
        <div class="search-toolbar__intro">
          <div class="search-toolbar__title">{{ labels.searchTitle }}</div>
          <div class="search-toolbar__meta">{{ labels.searchDescription }}</div>
        </div>
        <el-form :inline="true" :model="queryParams" class="filter-form">
          <el-form-item :label="labels.keyword" class="filter-form__keyword">
            <el-input
              v-model="queryParams.keyword"
              :placeholder="labels.keywordPlaceholder"
              clearable
              style="width: 240px"
              @keyup.enter="handleQuery"
              @clear="handleQuery"
            />
          </el-form-item>

          <el-form-item :label="labels.category">
            <el-select
              v-model="queryParams.category"
              :placeholder="labels.all"
              clearable
              style="width: 120px"
              @clear="handleQuery"
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
            <el-select
              v-model="queryParams.status"
              :placeholder="labels.all"
              clearable
              style="width: 120px"
              @clear="handleQuery"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item class="filter-form__actions">
            <el-button type="primary" @click="handleQuery">{{ labels.search }}</el-button>
            <el-button @click="handleReset">{{ labels.reset }}</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 材料列表 -->
      <el-table v-loading="loading" :data="itemList" border stripe>
        <el-table-column :label="labels.itemInfo" min-width="240">
          <template #default="{ row }">
            <div class="item-main">
              <div class="item-main__code">{{ row.item_code }}</div>
              <div class="item-main__name">{{ row.item_name }}</div>
              <div v-if="row.specification" class="item-main__spec">{{ row.specification }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.category" width="100">
          <template #default="{ row }">
            <el-tag>{{ getPackagingCategoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.stockInfo" min-width="180">
          <template #default="{ row }">
            <div class="metric-block">
              <div class="metric-line">
                <span class="metric-label">{{ labels.stockQty }}</span>
                <span class="metric-value">{{ row.quantity_on_hand }} {{ row.unit }}</span>
              </div>
              <div class="metric-line" v-if="row.reorder_point !== null && row.reorder_point !== undefined">
                <span class="metric-label">{{ labels.reorderPoint }}</span>
                <span class="metric-value">{{ row.reorder_point }}</span>
              </div>
              <div class="metric-line" v-if="row.reorder_quantity !== null && row.reorder_quantity !== undefined">
                <span class="metric-label">{{ labels.reorderQty }}</span>
                <span class="metric-value">{{ row.reorder_quantity }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.costInfo" min-width="160">
          <template #default="{ row }">
            <div class="metric-block">
              <div class="metric-line">
                <span class="metric-label">{{ labels.unitCost }}</span>
                <span class="metric-value">{{ row.currency }} {{ Number(row.unit_cost).toFixed(4) }}</span>
              </div>
              <div class="metric-line">
                <span class="metric-label">{{ labels.currency }}</span>
                <span class="metric-value">{{ row.currency }}</span>
              </div>
              <div class="metric-line">
                <span class="metric-label">{{ labels.unit }}</span>
                <span class="metric-value">{{ row.unit }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.supplierInfo" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="item-main">
              <div class="item-main__name">{{ row.supplier_name || '-' }}</div>
              <div v-if="row.supplier_contact" class="item-main__spec">{{ row.supplier_contact }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.status" width="80">
          <template #default="{ row }">
            <div class="status-block">
              <el-tag :type="getPackagingStatusColor(row.status)">
                {{ getPackagingStatusLabel(row.status) }}
              </el-tag>
              <el-tag v-if="row.deletable === false" type="warning" effect="plain" size="small">不可删除</el-tag>
              <div v-if="row.reference_count" class="status-block__remark">{{ row.reference_count }} 处引用</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.actions" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="warning" @click="handleStockOperation(row)">{{ labels.stockOp }}</el-button>
            <el-button link type="primary" @click="handleEdit(row)">{{ labels.edit }}</el-button>
            <el-button link type="success" @click="viewLedger(row)">{{ labels.ledger }}</el-button>
            <el-tooltip :disabled="row.deletable !== false" :content="row.delete_block_reason || labels.notDeletable">
              <div class="inline-action">
                <el-button link type="danger" :disabled="row.deletable === false" @click="handleDelete(row)">{{ labels.delete }}</el-button>
              </div>
            </el-tooltip>
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
      width="860px"
      @close="handleDialogClose"
    >
      <div class="dialog-layout">
        <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px" class="dialog-form">
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
            <el-col :span="12">
              <el-form-item :label="labels.supplier">
                <SupplierSelector
                  v-model="selectedSupplierId"
                  type="PACKAGING"
                  :placeholder="labels.supplierPlaceholder"
                  @change="handleSupplierChange"
                />
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

        <div class="dialog-summary">
          <div class="detail-summary-title">{{ labels.dialogSummary }}</div>
          <div class="detail-summary-line">
            <span>{{ labels.category }}</span>
            <span>{{ currentCategoryLabel }}</span>
          </div>
          <div class="detail-summary-line">
            <span>{{ labels.unitCost }}</span>
            <span>{{ formData.currency || '-' }} {{ Number(formData.unit_cost || 0).toFixed(4) }}</span>
          </div>
          <div class="detail-summary-line">
            <span>{{ labels.unit }}</span>
            <span>{{ formData.unit || '-' }}</span>
          </div>
          <div class="detail-summary-line">
            <span>{{ labels.supplier }}</span>
            <span>{{ currentSupplierName }}</span>
          </div>
          <div class="detail-summary-line">
            <span>{{ labels.deleteStatus }}</span>
            <span>{{ currentDeleteStatus }}</span>
          </div>
          <div class="detail-summary-line detail-summary-line--total">
            <span>{{ labels.status }}</span>
            <span>{{ currentStatusLabel }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">{{ labels.confirm }}</el-button>
      </template>
    </el-dialog>

    <!-- 库存操作对话框 -->
    <el-dialog
      v-model="stockDialogVisible"
      :title="labels.stockOpTitle"
      width="500px"
      @close="handleStockDialogClose"
    >
      <div v-if="stockOperatingItem" class="stock-info">
        <div class="stock-info__name">{{ stockOperatingItem.item_name }}</div>
        <div class="stock-info__code">{{ stockOperatingItem.item_code }}</div>
        <div class="stock-info__meta">{{ labels.currentStock }}：{{ stockOperatingItem.quantity_on_hand }} {{ stockOperatingItem.unit }}</div>
      </div>

      <el-form :model="stockForm" ref="stockFormRef" label-width="100px">
        <el-form-item :label="labels.opType" prop="type">
          <el-radio-group v-model="stockForm.type">
            <el-radio value="IN">{{ labels.stockIn }}</el-radio>
            <el-radio value="OUT">{{ labels.stockOut }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="labels.quantity" prop="quantity">
          <el-input-number
            v-model="stockForm.quantity"
            :min="1"
            :precision="0"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item :label="labels.unitCost">
          <el-input-number
            v-model="stockForm.unit_cost"
            :precision="4"
            :min="0"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item :label="labels.notes">
          <el-input
            v-model="stockForm.notes"
            type="textarea"
            :rows="2"
            :placeholder="labels.notesPlaceholder"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="stockDialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" @click="handleStockSubmit" :loading="stockSubmitting">{{ labels.confirm }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import { buildCodeValidator } from '@/modules/common/utils/code'
import {
  getPackagingItemList,
  createPackagingItem,
  updatePackagingItem,
  deletePackagingItem,
  createInboundLedger,
  createOutboundLedger
} from '../api'
import type { Supplier } from '@/modules/supplier/types'
import SupplierSelector from '@/modules/supplier/components/SupplierSelector.vue'
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
      searchTitle: 'Search materials',
      searchDescription: 'Search quickly by material code, name, category and status.',
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
      itemInfo: 'Item Info',
      stockInfo: 'Stock',
      costInfo: 'Cost',
      supplierInfo: 'Supplier',
      edit: 'Edit',
      ledger: 'Ledger',
      delete: 'Delete',
      deleteStatus: 'Delete Status',
      notDeletable: 'Not Deletable',
      stockOp: 'Stock',
      stockOpTitle: 'Stock Operation',
      currentStock: 'Current Stock',
      opType: 'Operation',
      stockIn: 'Stock In',
      stockOut: 'Stock Out',
      quantity: 'Quantity',
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
      itemCount: 'Items',
      activeCount: 'Active',
      totalOnHand: 'Total On Hand',
      dialogSummary: 'Summary',
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
    searchTitle: '搜索包材物料',
    searchDescription: '按物料编码、名称、类别和状态快速定位包材。',
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
    itemInfo: '物料信息',
    stockInfo: '库存情况',
    costInfo: '成本信息',
    supplierInfo: '供应商',
    edit: '编辑',
    ledger: '流水',
    delete: '删除',
    deleteStatus: '删除状态',
    notDeletable: '不可删除',
    stockOp: '库存',
    stockOpTitle: '库存操作',
    currentStock: '当前库存',
    opType: '操作类型',
    stockIn: '入库',
    stockOut: '出库',
    quantity: '数量',
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
    itemCount: '物料数',
    activeCount: '启用数',
    totalOnHand: '总库存',
    dialogSummary: '本次摘要',
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
const selectedSupplierId = ref<number | null>(null)
const selectedSupplierName = ref('')

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
const currentEditItem = ref<PackagingItem | null>(null)

// 表单数据
const formData = reactive<CreatePackagingItemRequest>({
  item_code: '',
  item_name: '',
  category: 'BOX' as any,
  unit_cost: 0,
  currency: 'CNY',
  unit: 'PCS',
  supplier_id: undefined,
  status: PackagingStatus.ACTIVE
})

// 库存操作对话框
const stockDialogVisible = ref(false)
const stockOperatingItem = ref<PackagingItem | null>(null)
const stockSubmitting = ref(false)
const stockFormRef = ref<FormInstance>()
const stockForm = reactive({
  type: 'IN',
  quantity: 1,
  unit_cost: 0,
  notes: ''
})

// 表单验证规则
const validatePackagingItemCode = buildCodeValidator('物料编码只允许字母、数字、中划线、下划线')

const formRules = computed<FormRules>(() => ({
  item_code: [
    { required: true, message: labels.value.codeRequired, trigger: 'blur' },
    { validator: validatePackagingItemCode, trigger: 'blur' }
  ],
  item_name: [{ required: true, message: labels.value.nameRequired, trigger: 'blur' }],
  category: [{ required: true, message: labels.value.categoryRequired, trigger: 'change' }],
  unit_cost: [{ required: true, message: labels.value.unitCostRequired, trigger: 'blur' }]
}))

const currentCategoryLabel = computed(() => {
  return getPackagingCategoryLabel(formData.category)
})

const currentStatusLabel = computed(() => {
  return getPackagingStatusLabel(formData.status)
})

const currentSupplierName = computed(() => selectedSupplierName.value || '-')
const currentDeleteStatus = computed(() => {
  if (!currentEditItem.value) return '-'
  if (currentEditItem.value.deletable === false) {
    return currentEditItem.value.delete_block_reason || labels.value.notDeletable
  }
  return localeStore.isEnglish ? 'Deletable' : '可删除'
})

// 方法
const fetchList = async () => {
  loading.value = true
  try {
    const res = await getPackagingItemList(queryParams)
    itemList.value = res.data?.data || []
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
    category: undefined,
    status: undefined,
    keyword: undefined
  })
  fetchList()
}

const handleCreate = () => {
  dialogTitle.value = labels.value.createTitle
  editingId.value = null
  currentEditItem.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = async (row: PackagingItem) => {
  dialogTitle.value = labels.value.editTitle
  editingId.value = row.id
  currentEditItem.value = row
  Object.assign(formData, {
    item_code: row.item_code,
    item_name: row.item_name,
    category: row.category,
    specification: row.specification,
    unit_cost: row.unit_cost,
    currency: row.currency,
    unit: row.unit,
    supplier_id: row.supplier_id || undefined,
    status: row.status,
    notes: row.notes
  })
  selectedSupplierId.value = row.supplier_id || null
  selectedSupplierName.value = row.supplier_name || ''
  dialogVisible.value = true
}

const handleDelete = async (row: PackagingItem) => {
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || '已被业务数据引用，不可删除')
    return
  }
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
  currentEditItem.value = null
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
    supplier_id: undefined,
    status: PackagingStatus.ACTIVE,
    notes: undefined
  })
  selectedSupplierId.value = null
  selectedSupplierName.value = ''
}

// 供应商选择变化
const handleSupplierChange = (supplier: Supplier | null) => {
  if (supplier) {
    selectedSupplierId.value = supplier.id
    selectedSupplierName.value = supplier.supplier_name
    formData.supplier_id = supplier.id
  } else {
    selectedSupplierId.value = null
    selectedSupplierName.value = ''
    formData.supplier_id = undefined
  }
}

// 库存操作
const handleStockOperation = (row: PackagingItem) => {
  stockOperatingItem.value = row
  stockForm.type = 'IN'
  stockForm.quantity = 1
  stockForm.unit_cost = row.unit_cost || 0
  stockForm.notes = ''
  stockDialogVisible.value = true
}

const handleStockDialogClose = () => {
  stockOperatingItem.value = null
  stockForm.type = 'IN'
  stockForm.quantity = 1
  stockForm.unit_cost = 0
  stockForm.notes = ''
}

const handleStockSubmit = async () => {
  if (!stockOperatingItem.value) return
  if (stockForm.quantity <= 0) {
    ElMessage.warning(localeStore.isEnglish ? 'Quantity must be greater than 0' : '数量必须大于 0')
    return
  }

  stockSubmitting.value = true
  try {
    const ledgerData = {
      packaging_item_id: stockOperatingItem.value.id,
      quantity: stockForm.quantity,
      unit_cost: stockForm.unit_cost,
      notes: stockForm.notes || undefined,
      occurred_at: new Date().toISOString()
    }

    if (stockForm.type === 'IN') {
      await createInboundLedger(ledgerData)
      ElMessage.success(localeStore.isEnglish ? 'Stock-in completed' : '入库成功')
    } else {
      await createOutboundLedger(ledgerData)
      ElMessage.success(localeStore.isEnglish ? 'Stock-out completed' : '出库成功')
    }

    stockDialogVisible.value = false
    fetchList()
  } catch (error: any) {
    ElMessage.error(error.message || labels.value.submitFail)
  } finally {
    stockSubmitting.value = false
  }
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

<style scoped src="@/modules/packaging/styles/packaging-item-list.css"></style>


