<template>
  <div class="parent-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ text.parentManagement }}</h3>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            {{ text.createParent }}
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item :label="text.keyword">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="text.keywordPlaceholder"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item :label="text.marketplace">
          <el-select v-model="searchForm.marketplace" :placeholder="text.all" clearable>
            <el-option :label="text.marketplaceUs" value="US" />
            <el-option :label="text.marketplaceCa" value="CA" />
            <el-option :label="text.marketplaceAu" value="AU" />
            <el-option :label="text.marketplaceUk" value="UK" />
            <el-option :label="text.marketplaceDe" value="DE" />
            <el-option :label="text.marketplaceJp" value="JP" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ text.search }}</el-button>
          <el-button @click="handleReset">{{ text.reset }}</el-button>
        </el-form-item>
      </el-form>

      <!-- Parent Product列表 -->
      <el-table :data="parentList" v-loading="loading" border stripe>
        <el-table-column prop="id" :label="text.id" width="80" />
        <el-table-column prop="parent_asin" :label="text.parentAsin" width="140" />
        <el-table-column prop="title" :label="text.title" min-width="300" show-overflow-tooltip />
        <el-table-column prop="marketplace" :label="text.marketplace" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ row.marketplace }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="brand" :label="text.brand" width="150" show-overflow-tooltip />
        <el-table-column prop="category" :label="text.category" width="150" show-overflow-tooltip />
        <el-table-column prop="status" :label="text.status" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="text.actions" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ text.view }}</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">{{ text.edit }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">{{ text.delete }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="parentForm" :rules="parentFormRules" ref="parentFormRef" label-width="140px">
        <el-form-item :label="text.parentAsin" prop="parent_asin">
          <el-input v-model="parentForm.parent_asin" />
        </el-form-item>
        <el-form-item :label="text.title" prop="title">
          <el-input v-model="parentForm.title" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="text.marketplace" prop="marketplace">
          <el-select v-model="parentForm.marketplace">
            <el-option :label="text.marketplaceUs" value="US" />
            <el-option :label="text.marketplaceCa" value="CA" />
            <el-option :label="text.marketplaceAu" value="AU" />
            <el-option :label="text.marketplaceUk" value="UK" />
            <el-option :label="text.marketplaceDe" value="DE" />
            <el-option :label="text.marketplaceJp" value="JP" />
          </el-select>
        </el-form-item>
        <el-form-item :label="text.brand">
          <el-input v-model="parentForm.brand" />
        </el-form-item>
        <el-form-item :label="text.category">
          <el-input v-model="parentForm.category" />
        </el-form-item>
        <el-form-item :label="text.status">
          <el-select v-model="parentForm.status">
            <el-option :label="text.statusActive" value="ACTIVE" />
            <el-option :label="text.statusInactive" value="INACTIVE" />
            <el-option :label="text.statusDiscontinued" value="DISCONTINUED" />
          </el-select>
        </el-form-item>
        <el-form-item :label="text.remark">
          <el-input v-model="parentForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ text.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ text.save }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" :title="text.detailTitle" width="600px">
      <el-descriptions :column="2" border v-if="currentParent">
        <el-descriptions-item :label="text.id">{{ currentParent.id }}</el-descriptions-item>
        <el-descriptions-item :label="text.parentAsin">{{ currentParent.parent_asin }}</el-descriptions-item>
        <el-descriptions-item :label="text.title" :span="2">{{ currentParent.title }}</el-descriptions-item>
        <el-descriptions-item :label="text.marketplace">{{ currentParent.marketplace }}</el-descriptions-item>
        <el-descriptions-item :label="text.brand">{{ currentParent.brand || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="text.category" :span="2">{{ currentParent.category || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="text.status">
          <el-tag :type="getStatusType(currentParent.status)">{{ currentParent.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="text.createdAt">{{ currentParent.created_at }}</el-descriptions-item>
        <el-descriptions-item :label="text.remark" :span="2">{{ currentParent.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getProductParentList, createProductParent, updateProductParent, deleteProductParent } from '../api'
import type { ProductParent } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

// 列表数据
const parentList = ref<ProductParent[]>([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  marketplace: ''
})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const saving = ref(false)
const parentFormRef = ref<FormInstance>()

const parentForm = reactive({
  parent_asin: '',
  title: '',
  marketplace: 'US',
  brand: '',
  category: '',
  status: 'ACTIVE',
  image_url: '',
  remark: ''
})

// 详情
const detailVisible = ref(false)
const currentParent = ref<ProductParent | null>(null)
const localeStore = useLocaleStore()
const text = computed(() => {
  if (localeStore.isEnglish) {
    return {
      parentManagement: 'Parent Product Management',
      createParent: 'Create Parent Product',
      keyword: 'Keyword',
      keywordPlaceholder: 'Parent ASIN or Title',
      marketplace: 'Marketplace',
      marketplaceUs: 'Amazon US',
      marketplaceCa: 'Amazon CA',
      marketplaceAu: 'Amazon AU',
      marketplaceUk: 'Amazon UK',
      marketplaceDe: 'Amazon DE',
      marketplaceJp: 'Amazon JP',
      search: 'Search',
      reset: 'Reset',
      id: 'ID',
      parentAsin: 'Parent ASIN',
      title: 'Title',
      brand: 'Brand',
      category: 'Category',
      status: 'Status',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusDiscontinued: 'Discontinued',
      actions: 'Actions',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      remark: 'Remark',
      cancel: 'Cancel',
      save: 'Save',
      detailTitle: 'Parent Product Details',
      createdAt: 'Created At',
      all: 'All',
      required: 'Required',
      warning: 'Warning',
      confirm: 'Confirm',
      createdSuccess: 'Parent product created successfully',
      updatedSuccess: 'Parent product updated successfully',
      deletedSuccess: 'Parent product deleted successfully'
    }
  }

  return {
    parentManagement: '父体产品管理',
    createParent: '新增父体产品',
    keyword: '关键词',
    keywordPlaceholder: '父体ASIN或标题',
    marketplace: '站点',
    marketplaceUs: '美国站',
    marketplaceCa: '加拿大站',
    marketplaceAu: '澳大利亚站',
    marketplaceUk: '英国站',
    marketplaceDe: '德国站',
    marketplaceJp: '日本站',
    search: '查询',
    reset: '重置',
    id: 'ID',
    parentAsin: '父体ASIN',
    title: '标题',
    brand: '品牌',
    category: '类目',
    status: '状态',
    statusActive: '启用',
    statusInactive: '停用',
    statusDiscontinued: '停售',
    actions: '操作',
    view: '查看',
    edit: '编辑',
    delete: '删除',
    remark: '备注',
    cancel: '取消',
    save: '保存',
    detailTitle: '父体产品详情',
    createdAt: '创建时间',
    all: '全部',
    required: '必填',
    warning: '提示',
    confirm: '确认',
    createdSuccess: '父体产品创建成功',
    updatedSuccess: '父体产品更新成功',
    deletedSuccess: '父体产品删除成功'
  }
})

const parentFormRules = computed<FormRules>(() => ({
  parent_asin: [{ required: true, message: text.value.required, trigger: 'blur' }],
  title: [{ required: true, message: text.value.required, trigger: 'blur' }],
  marketplace: [{ required: true, message: text.value.required, trigger: 'change' }]
}))

// 加载父体列表
const loadParentList = async () => {
  loading.value = true
  try {
    const res = await getProductParentList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      marketplace: searchForm.marketplace || undefined
    })

    if (res.success) {
      const items = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []
      parentList.value = items
      pagination.total = res.data?.total ?? res.total ?? 0
    }
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadParentList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.marketplace = ''
  handleSearch()
}

// 创建
const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = text.value.createParent
  Object.assign(parentForm, {
    parent_asin: '',
    title: '',
    marketplace: 'US',
    brand: '',
    category: '',
    status: 'ACTIVE',
    image_url: '',
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: ProductParent) => {
  isEdit.value = true
  dialogTitle.value = text.value.edit
  Object.assign(parentForm, {
    id: row.id,
    parent_asin: row.parent_asin,
    title: row.title,
    marketplace: row.marketplace,
    brand: row.brand || '',
    category: row.category || '',
    status: row.status,
    image_url: row.image_url || '',
    remark: row.remark || ''
  })
  dialogVisible.value = true
}

// 查看
const handleView = (row: ProductParent) => {
  currentParent.value = row
  detailVisible.value = true
}

// 保存
const handleSave = async () => {
  if (!parentFormRef.value) return

  await parentFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value) {
          await updateProductParent((parentForm as any).id, parentForm)
          ElMessage.success(text.value.updatedSuccess)
        } else {
          await createProductParent(parentForm)
          ElMessage.success(text.value.createdSuccess)
        }
        dialogVisible.value = false
        loadParentList()
      } finally {
        saving.value = false
      }
    }
  })
}

// 删除
const handleDelete = async (row: ProductParent) => {
  try {
    await ElMessageBox.confirm(
      localeStore.isEnglish
        ? `Are you sure to delete parent product "${row.parent_asin}"?`
        : `确认删除父体产品 "${row.parent_asin}"？`,
      text.value.warning,
      {
        confirmButtonText: text.value.confirm,
        cancelButtonText: text.value.cancel,
        type: 'warning'
      }
    )

    await deleteProductParent(row.id)
    ElMessage.success(text.value.deletedSuccess)
    loadParentList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

// 状态类型
const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    DISCONTINUED: 'danger'
  }
  return types[status] || 'info'
}

onMounted(() => {
  loadParentList()
})
</script>

<style scoped>
.parent-list-container {
  width: 100%;
  max-width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
