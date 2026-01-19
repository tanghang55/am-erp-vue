<template>
  <div class="supplier-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Supplier Management</h3>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            Create Supplier
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="Keyword">
          <el-input
            v-model="searchForm.keyword"
            placeholder="Name or Contact Person"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="searchForm.status" placeholder="All" clearable>
            <el-option label="Active" value="ACTIVE" />
            <el-option label="Disabled" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">Search</el-button>
          <el-button @click="handleReset">Reset</el-button>
        </el-form-item>
      </el-form>

      <!-- 供应商列表 -->
      <el-table :data="supplierList" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="Name" width="200" show-overflow-tooltip />
        <el-table-column prop="contact_person" label="Contact Person" width="150" />
        <el-table-column prop="phone" label="Phone" width="150" />
        <el-table-column prop="email" label="Email" width="200" show-overflow-tooltip />
        <el-table-column prop="address" label="Address" min-width="250" show-overflow-tooltip />
        <el-table-column prop="status" label="Status" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">View</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">Delete</el-button>
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
      <el-form :model="supplierForm" :rules="supplierFormRules" ref="supplierFormRef" label-width="140px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="supplierForm.name" />
        </el-form-item>
        <el-form-item label="Contact Person">
          <el-input v-model="supplierForm.contact_person" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="supplierForm.phone" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="supplierForm.email" />
        </el-form-item>
        <el-form-item label="Address">
          <el-input v-model="supplierForm.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-radio-group v-model="supplierForm.status">
            <el-radio value="ACTIVE">Active</el-radio>
            <el-radio value="DISABLED">Disabled</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Remark">
          <el-input v-model="supplierForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Save</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" title="Supplier Details" width="600px">
      <el-descriptions :column="2" border v-if="currentSupplier">
        <el-descriptions-item label="ID">{{ currentSupplier.id }}</el-descriptions-item>
        <el-descriptions-item label="Name">{{ currentSupplier.name }}</el-descriptions-item>
        <el-descriptions-item label="Contact Person">{{ currentSupplier.contact_person || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Phone">{{ currentSupplier.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Email" :span="2">{{ currentSupplier.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Address" :span="2">{{ currentSupplier.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Status">
          <el-tag :type="currentSupplier.status === 'ACTIVE' ? 'success' : 'info'">
            {{ currentSupplier.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Created At">{{ currentSupplier.created_at }}</el-descriptions-item>
        <el-descriptions-item label="Remark" :span="2">{{ currentSupplier.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSupplierList, createSupplier, updateSupplier, deleteSupplier } from '../api'
import type { Supplier } from '../types'

// 列表数据
const supplierList = ref<Supplier[]>([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
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
const supplierFormRef = ref<FormInstance>()

const supplierForm = reactive({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  status: 'ACTIVE',
  remark: ''
})

const supplierFormRules: FormRules = {
  name: [{ required: true, message: 'Required', trigger: 'blur' }],
  status: [{ required: true, message: 'Required', trigger: 'change' }]
}

// 详情
const detailVisible = ref(false)
const currentSupplier = ref<Supplier | null>(null)

// 加载供应商列表
const loadSupplierList = async () => {
  loading.value = true
  try {
    const res = await getSupplierList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined
    })

    if (res.success) {
      supplierList.value = res.data.data
      pagination.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadSupplierList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  handleSearch()
}

// 创建
const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = 'Create Supplier'
  Object.assign(supplierForm, {
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    status: 'ACTIVE',
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Supplier) => {
  isEdit.value = true
  dialogTitle.value = 'Edit Supplier'
  Object.assign(supplierForm, {
    id: row.id,
    name: row.name,
    contact_person: row.contact_person || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    status: row.status,
    remark: row.remark || ''
  })
  dialogVisible.value = true
}

// 查看
const handleView = (row: Supplier) => {
  currentSupplier.value = row
  detailVisible.value = true
}

// 保存
const handleSave = async () => {
  if (!supplierFormRef.value) return

  await supplierFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value) {
          await updateSupplier((supplierForm as any).id, supplierForm)
          ElMessage.success('Supplier updated successfully')
        } else {
          await createSupplier(supplierForm)
          ElMessage.success('Supplier created successfully')
        }
        dialogVisible.value = false
        loadSupplierList()
      } finally {
        saving.value = false
      }
    }
  })
}

// 删除
const handleDelete = async (row: Supplier) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure to delete supplier "${row.name}"?`,
      'Warning',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    await deleteSupplier(row.id)
    ElMessage.success('Supplier deleted successfully')
    loadSupplierList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

onMounted(() => {
  loadSupplierList()
})
</script>

<style scoped>
.supplier-list-container {
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
