<template>
  <div class="warehouse-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">{{ labels.title }}</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            {{ labels.create }}
          </el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item :label="labels.type">
          <el-select v-model="searchForm.type" :placeholder="labels.all" clearable style="width: 150px">
            <el-option :label="typeLabels.OWN" value="OWN" />
            <el-option :label="typeLabels.FBA" value="FBA" />
            <el-option :label="typeLabels.THIRD_PARTY" value="THIRD_PARTY" />
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.status">
          <el-select v-model="searchForm.status" :placeholder="labels.all" clearable style="width: 120px">
            <el-option :label="statusLabels.ACTIVE" value="ACTIVE" />
            <el-option :label="statusLabels.INACTIVE" value="INACTIVE" />
            <el-option :label="statusLabels.CLOSED" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.keyword">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="labels.keywordPlaceholder"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="code" :label="labels.code" width="150" />
        <el-table-column prop="name" :label="labels.name" min-width="200" />
        <el-table-column prop="type" :label="labels.type" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="country" :label="labels.country" width="80" />
        <el-table-column prop="address" :label="labels.address" min-width="200" show-overflow-tooltip />
        <el-table-column prop="contact_person" :label="labels.contactPerson" width="120" />
        <el-table-column prop="contact_phone" :label="labels.contactPhone" width="140" />
        <el-table-column prop="status" :label="labels.status" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.actions" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ labels.view }}</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">{{ labels.edit }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">{{ labels.delete }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSearch"
        @current-change="handleSearch"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="warehouseForm"
        :rules="formRules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item :label="labels.code" prop="code">
          <el-input v-model="warehouseForm.code" :placeholder="labels.codePlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.name" prop="name">
          <el-input v-model="warehouseForm.name" :placeholder="labels.namePlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.type" prop="type">
          <el-select v-model="warehouseForm.type" :placeholder="labels.select" style="width: 100%">
            <el-option :label="typeLabels.OWN" value="OWN" />
            <el-option :label="typeLabels.FBA" value="FBA" />
            <el-option :label="typeLabels.THIRD_PARTY" value="THIRD_PARTY" />
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.countryCode" prop="country">
          <el-input v-model="warehouseForm.country" :placeholder="labels.countryPlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.address" prop="address">
          <el-input
            v-model="warehouseForm.address"
            type="textarea"
            :rows="3"
            :placeholder="labels.addressPlaceholder"
          />
        </el-form-item>
        <el-form-item :label="labels.contactPerson" prop="contact_person">
          <el-input v-model="warehouseForm.contact_person" :placeholder="labels.contactPersonPlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.contactPhone" prop="contact_phone">
          <el-input v-model="warehouseForm.contact_phone" :placeholder="labels.contactPhonePlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.contactEmail" prop="contact_email">
          <el-input v-model="warehouseForm.contact_email" :placeholder="labels.contactEmailPlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.status" prop="status">
          <el-radio-group v-model="warehouseForm.status">
            <el-radio label="ACTIVE">{{ statusLabels.ACTIVE }}</el-radio>
            <el-radio label="INACTIVE">{{ statusLabels.INACTIVE }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="labels.remark" prop="remark">
          <el-input
            v-model="warehouseForm.remark"
            type="textarea"
            :rows="2"
            :placeholder="labels.remarkPlaceholder"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ labels.save }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" :title="labels.detailTitle" width="600px">
      <el-descriptions :column="2" border v-if="currentWarehouse">
        <el-descriptions-item :label="labels.code">{{ currentWarehouse.code }}</el-descriptions-item>
        <el-descriptions-item :label="labels.name">{{ currentWarehouse.name }}</el-descriptions-item>
        <el-descriptions-item :label="labels.type">
          <el-tag :type="getTypeColor(currentWarehouse.type)">
            {{ getTypeLabel(currentWarehouse.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.status">
          <el-tag :type="getStatusColor(currentWarehouse.status)">
            {{ getStatusLabel(currentWarehouse.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.country">{{ currentWarehouse.country || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="labels.address" :span="2">{{ currentWarehouse.address || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="labels.contactPerson">{{ currentWarehouse.contact_person || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="labels.contactPhone">{{ currentWarehouse.contact_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="labels.contactEmail" :span="2">{{ currentWarehouse.contact_email || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="labels.remark" :span="2">{{ currentWarehouse.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="labels.createdAt" :span="2">{{ currentWarehouse.created_at }}</el-descriptions-item>
        <el-descriptions-item :label="labels.updatedAt" :span="2">{{ currentWarehouse.updated_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getWarehouseList,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse
} from '../api'
import type { Warehouse } from '../types'
import { WAREHOUSE_TYPE_CONFIG, WAREHOUSE_STATUS_CONFIG } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Warehouse Management',
      create: 'New Warehouse',
      type: 'Type',
      status: 'Status',
      all: 'All',
      keyword: 'Keyword',
      keywordPlaceholder: 'Warehouse code/name',
      search: 'Search',
      reset: 'Reset',
      code: 'Code',
      name: 'Name',
      country: 'Country',
      address: 'Address',
      contactPerson: 'Contact',
      contactPhone: 'Phone',
      contactEmail: 'Email',
      actions: 'Actions',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      select: 'Select',
      codePlaceholder: 'e.g. WH-US-001',
      namePlaceholder: 'e.g. US East Warehouse',
      countryCode: 'Country Code',
      countryPlaceholder: 'e.g. US, CN',
      addressPlaceholder: 'Enter warehouse address',
      contactPersonPlaceholder: 'Enter contact person',
      contactPhonePlaceholder: 'Enter contact phone',
      contactEmailPlaceholder: 'Enter contact email',
      remark: 'Remark',
      remarkPlaceholder: 'Enter remark',
      cancel: 'Cancel',
      save: 'Save',
      detailTitle: 'Warehouse Details',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      createTitle: 'New Warehouse',
      editTitle: 'Edit Warehouse',
      deleteConfirm: 'Delete warehouse "{name}"? You cannot delete a warehouse with inventory.',
      deleteTitle: 'Warning',
      deleteConfirmText: 'Confirm',
      deleteCancelText: 'Cancel',
      createdSuccess: 'Created',
      updatedSuccess: 'Updated',
      deletedSuccess: 'Deleted',
      codeRequired: 'Please enter warehouse code',
      nameRequired: 'Please enter warehouse name',
      typeRequired: 'Please select warehouse type'
    }
  }
  return {
    title: '仓库管理',
    create: '新建仓库',
    type: '仓库类型',
    status: '状态',
    all: '全部',
    keyword: '关键词',
    keywordPlaceholder: '仓库代码/名称',
    search: '搜索',
    reset: '重置',
    code: '仓库代码',
    name: '仓库名称',
    country: '国家',
    address: '地址',
    contactPerson: '联系人',
    contactPhone: '联系电话',
    contactEmail: '联系邮箱',
    actions: '操作',
    view: '查看',
    edit: '编辑',
    delete: '删除',
    select: '请选择',
    codePlaceholder: '如：WH-US-001',
    namePlaceholder: '如：US East Warehouse',
    countryCode: '国家代码',
    countryPlaceholder: '如：US, CN',
    addressPlaceholder: '请输入仓库地址',
    contactPersonPlaceholder: '请输入联系人',
    contactPhonePlaceholder: '请输入联系电话',
    contactEmailPlaceholder: '请输入联系邮箱',
    remark: '备注',
    remarkPlaceholder: '请输入备注',
    cancel: '取消',
    save: '保存',
    detailTitle: '仓库详情',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    createTitle: '新建仓库',
    editTitle: '编辑仓库',
    deleteConfirm: '确定要删除仓库"{name}"吗？如果仓库有库存将无法删除。',
    deleteTitle: '警告',
    deleteConfirmText: '确定',
    deleteCancelText: '取消',
    createdSuccess: '创建成功',
    updatedSuccess: '更新成功',
    deletedSuccess: '删除成功',
    codeRequired: '请输入仓库代码',
    nameRequired: '请输入仓库名称',
    typeRequired: '请选择仓库类型'
  }
})

const typeLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      FBA: 'Amazon FBA',
      THIRD_PARTY: 'Third-Party Warehouse',
      OWN: 'Owned Warehouse'
    }
  }
  return {
    FBA: 'Amazon FBA',
    THIRD_PARTY: '第三方仓库',
    OWN: '自有仓库'
  }
})

const statusLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      CLOSED: 'Closed'
    }
  }
  return {
    ACTIVE: '启用',
    INACTIVE: '停用',
    CLOSED: '关闭'
  }
})

// 列表数据
const list = ref<Warehouse[]>([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  type: '',
  status: '',
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

// 详情对话框
const detailVisible = ref(false)
const currentWarehouse = ref<Warehouse | null>(null)

// 表单数据
const warehouseForm = reactive({
  id: 0,
  code: '',
  name: '',
  type: 'OWN' as 'OWN' | 'FBA' | 'THIRD_PARTY',
  country: '',
  address: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  remark: ''
})

// 表单验证规则
const formRules = computed<FormRules>(() => ({
  code: [{ required: true, message: labels.value.codeRequired, trigger: 'blur' }],
  name: [{ required: true, message: labels.value.nameRequired, trigger: 'blur' }],
  type: [{ required: true, message: labels.value.typeRequired, trigger: 'change' }]
}))

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const res = await getWarehouseList({
      page: pagination.page,
      page_size: pagination.page_size,
      type: searchForm.type || undefined,
      status: searchForm.status || undefined,
      keyword: searchForm.keyword || undefined
    })

    if (res.success && res.data) {
      list.value = res.data.data
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message || 'Failed to load warehouse list')
    }
  } catch (error: any) {
    console.error('Failed to load warehouse list:', error)
    ElMessage.error(error.message || 'Failed to load warehouse list')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadList()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    type: '',
    status: '',
    keyword: ''
  })
  handleSearch()
}

// 创建
const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = labels.value.createTitle
  Object.assign(warehouseForm, {
    id: 0,
    code: '',
    name: '',
    type: 'OWN',
    country: '',
    address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    status: 'ACTIVE',
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Warehouse) => {
  isEdit.value = true
  dialogTitle.value = labels.value.editTitle
  Object.assign(warehouseForm, {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    country: row.country || '',
    address: row.address || '',
    contact_person: row.contact_person || '',
    contact_phone: row.contact_phone || '',
    contact_email: row.contact_email || '',
    status: row.status,
    remark: row.remark || ''
  })
  dialogVisible.value = true
}

// 查看
const handleView = (row: Warehouse) => {
  currentWarehouse.value = row
  detailVisible.value = true
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value) {
          await updateWarehouse(warehouseForm.id, warehouseForm)
          ElMessage.success(labels.value.updatedSuccess)
        } else {
          await createWarehouse(warehouseForm)
          ElMessage.success(labels.value.createdSuccess)
        }
        dialogVisible.value = false
        loadList()
      } catch (error) {
        console.error('Save failed:', error)
      } finally {
        saving.value = false
      }
    }
  })
}

// 删除
const handleDelete = async (row: Warehouse) => {
  try {
    await ElMessageBox.confirm(
      labels.value.deleteConfirm.replace('{name}', row.name),
      labels.value.deleteTitle,
      {
        confirmButtonText: labels.value.deleteConfirmText,
        cancelButtonText: labels.value.deleteCancelText,
        type: 'warning'
      }
    )

    await deleteWarehouse(row.id)
    ElMessage.success(labels.value.deletedSuccess)
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

// 辅助函数：获取类型标签
const getTypeLabel = (type: string) => {
  return (typeLabels.value as Record<string, string>)[type] || type
}

// 辅助函数：获取类型颜色
const getTypeColor = (type: string) => {
  return WAREHOUSE_TYPE_CONFIG[type as keyof typeof WAREHOUSE_TYPE_CONFIG]?.color || ''
}

// 辅助函数：获取状态标签
const getStatusLabel = (status: string) => {
  return (statusLabels.value as Record<string, string>)[status] || status
}

// 辅助函数：获取状态颜色
const getStatusColor = (status: string) => {
  return WAREHOUSE_STATUS_CONFIG[status as keyof typeof WAREHOUSE_STATUS_CONFIG]?.color || ''
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.warehouse-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 18px;
  font-weight: bold;
}

.search-form {
  margin-bottom: 20px;
}
</style>
