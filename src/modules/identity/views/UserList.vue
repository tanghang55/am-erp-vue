<template>
  <div class="user-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>User Management</h3>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            Create User
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="Keyword">
          <el-input
            v-model="searchForm.keyword"
            placeholder="Username, email or name"
            clearable
            @clear="handleSearch"
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

      <!-- 用户列表 -->
      <el-table :data="userList" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="Username" width="150" />
        <el-table-column prop="real_name" label="Real Name" width="150" />
        <el-table-column prop="email" label="Email" width="200" />
        <el-table-column prop="phone" label="Phone" width="150" />
        <el-table-column prop="status" label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="Last Login" width="180" />
        <el-table-column prop="created_at" label="Created At" width="180" />
        <el-table-column label="Actions" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">View</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">Edit</el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
              :disabled="row.id === authStore.user?.id"
            >
              Delete
            </el-button>
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
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="userForm" :rules="userFormRules" ref="userFormRef" label-width="120px">
        <el-form-item label="Username" prop="username" v-if="!isEdit">
          <el-input v-model="userForm.username" placeholder="4-50 characters" />
        </el-form-item>
        <el-form-item label="Password" :prop="isEdit ? '' : 'password'">
          <el-input
            v-model="userForm.password"
            type="password"
            :placeholder="isEdit ? 'Leave blank to keep unchanged' : 'At least 8 characters'"
          />
        </el-form-item>
        <el-form-item label="Real Name" prop="real_name">
          <el-input v-model="userForm.real_name" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="userForm.email" type="email" />
        </el-form-item>
        <el-form-item label="Phone" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Save</el-button>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailVisible" title="User Details" width="700px">
      <el-descriptions :column="2" border v-if="currentUser">
        <el-descriptions-item label="ID">{{ currentUser.user.id }}</el-descriptions-item>
        <el-descriptions-item label="Username">{{
          currentUser.user.username
        }}</el-descriptions-item>
        <el-descriptions-item label="Real Name">{{
          currentUser.user.real_name
        }}</el-descriptions-item>
        <el-descriptions-item label="Email">{{ currentUser.user.email }}</el-descriptions-item>
        <el-descriptions-item label="Phone">{{ currentUser.user.phone }}</el-descriptions-item>
        <el-descriptions-item label="Status">
          <el-tag :type="currentUser.user.status === 'ACTIVE' ? 'success' : 'danger'">
            {{ currentUser.user.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Last Login">{{
          currentUser.user.last_login_at || 'Never'
        }}</el-descriptions-item>
        <el-descriptions-item label="Created At">{{
          currentUser.user.created_at
        }}</el-descriptions-item>
        <el-descriptions-item label="Roles" :span="2">
          <el-tag
            v-for="role in currentUser.roles"
            :key="role.id"
            type="info"
            style="margin-right: 5px"
          >
            {{ role.display_name }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Permissions" :span="2">
          <el-tag
            v-for="perm in currentUser.permissions"
            :key="perm.id"
            size="small"
            style="margin: 2px"
          >
            {{ perm.name }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser
} from '../api/system'
import type { User } from '../types'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

// 列表数据
const userList = ref<User[]>([])
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
const userFormRef = ref<FormInstance>()

const userForm = reactive({
  username: '',
  password: '',
  real_name: '',
  email: '',
  phone: ''
})

const userFormRules: FormRules = {
  username: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter password', trigger: 'blur' }],
  email: [{ type: 'email', message: 'Invalid email format', trigger: 'blur' }]
}

// 详情对话框
const detailVisible = ref(false)
const currentUser = ref<UserDetailResponse['data'] | null>(null)

// 加载用户列表
const loadUserList = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status as any
    })

    if (res.success) {
      userList.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadUserList()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  handleSearch()
}

// 创建用户
const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = 'Create User'
  Object.assign(userForm, {
    username: '',
    password: '',
    real_name: '',
    email: '',
    phone: ''
  })
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row: User) => {
  isEdit.value = true
  dialogTitle.value = 'Edit User'
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    password: '',
    real_name: row.real_name,
    email: row.email,
    phone: row.phone
  })
  dialogVisible.value = true
}

// 查看用户详情
const handleView = async (row: User) => {
  try {
    const res = await getUserDetail(row.id)
    if (res.success) {
      currentUser.value = res.data
      detailVisible.value = true
    }
  } catch (error) {
    console.error('Failed to load user details:', error)
  }
}

// 保存用户
const handleSave = async () => {
  if (!userFormRef.value) return

  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value) {
          const data: any = {
            real_name: userForm.real_name,
            email: userForm.email,
            phone: userForm.phone
          }
          if (userForm.password) {
            data.password = userForm.password
          }
          await updateUser((userForm as any).id, data)
          ElMessage.success('User updated successfully')
        } else {
          await createUser(userForm)
          ElMessage.success('User created successfully')
        }
        dialogVisible.value = false
        loadUserList()
      } finally {
        saving.value = false
      }
    }
  })
}

// 删除用户
const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure to delete user "${row.username}"? This will disable the user.`,
      'Warning',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    await deleteUser(row.id)
    ElMessage.success('User deleted successfully')
    loadUserList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete user:', error)
    }
  }
}

// 关闭对话框
const handleDialogClose = () => {
  userFormRef.value?.resetFields()
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
.user-list-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.user-list-container :deep(.el-card) {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 表格优化 */
:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table__body-wrapper) {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}
</style>
