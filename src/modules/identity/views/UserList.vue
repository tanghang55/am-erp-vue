<template>
  <div class="user-list-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">用户管理</div>
            <div class="page-subtitle">维护 ERP 用户档案、登录状态和权限摘要。查看、编辑、删除各自独立，不再混在一个入口里。</div>
          </div>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建用户
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="用户名 / 邮箱 / 姓名"
            clearable
            style="width: 240px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px" @clear="handleSearch">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="userList" v-loading="loading" border stripe>
        <el-table-column label="用户" min-width="260">
          <template #default="{ row }">
            <div class="user-main">
              <div class="user-main__title">{{ row.real_name || row.username }}</div>
              <div class="user-main__meta">
                <span>{{ row.username }}</span>
                <span v-if="row.real_name">{{ row.real_name }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="联系方式" min-width="240">
          <template #default="{ row }">
            <div class="contact-block">
              <div>{{ row.email || '未填写邮箱' }}</div>
              <div class="contact-block__meta">{{ row.phone || '未填写手机号' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态与登录" min-width="220">
          <template #default="{ row }">
            <div class="status-block">
              <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
              </el-tag>
              <div class="status-block__meta">
                最近登录：{{ row.last_login_at || '从未登录' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ row.gmt_create }}</template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看详情</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-dropdown @command="(command) => handleRowCommand(command, row)">
              <el-button size="small">
                更多
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="delete"
                    :disabled="row.id === authStore.user?.id"
                    class="danger-command"
                  >
                    删除用户
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="loadUserList"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="820px" @close="handleDialogClose">
      <div class="dialog-layout">
        <el-form :model="userForm" :rules="userFormRules" ref="userFormRef" label-position="top" class="dialog-form">
          <div class="dialog-grid">
            <el-form-item label="用户名" prop="username" v-if="!isEdit">
              <el-input v-model="userForm.username" placeholder="4-50 个字符" />
            </el-form-item>
            <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
              <el-input
                v-model="userForm.password"
                type="password"
                :placeholder="isEdit ? '留空表示不修改' : '至少 8 个字符'"
              />
            </el-form-item>
            <el-form-item label="姓名" prop="real_name">
              <el-input v-model="userForm.real_name" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" type="email" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="userForm.phone" />
            </el-form-item>
            <el-form-item label="状态">
              <el-radio-group v-model="userForm.status">
                <el-radio value="ACTIVE">启用</el-radio>
                <el-radio value="DISABLED">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </div>
        </el-form>

        <aside class="dialog-aside">
          <div class="dialog-summary">
            <div class="dialog-summary__title">档案摘要</div>
            <div class="dialog-summary__item">
              <span>用户名</span>
              <strong>{{ userForm.username || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>姓名</span>
              <strong>{{ userForm.real_name || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>邮箱</span>
              <strong>{{ userForm.email || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>状态</span>
              <strong>{{ userForm.status === 'ACTIVE' ? '启用' : '停用' }}</strong>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="用户详情" width="820px">
      <div v-if="currentUser" class="detail-layout">
        <section class="detail-card detail-card--main">
          <div class="detail-main">
            <div class="detail-main__title">{{ currentUser.user.real_name || currentUser.user.username }}</div>
            <div class="detail-main__meta">{{ currentUser.user.username }}</div>
            <div class="detail-tags">
              <el-tag :type="currentUser.user.status === 'ACTIVE' ? 'success' : 'info'">
                {{ currentUser.user.status === 'ACTIVE' ? '启用' : '停用' }}
              </el-tag>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">基础信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>用户名</span>
              <strong>{{ currentUser.user.username }}</strong>
            </div>
            <div class="detail-item">
              <span>姓名</span>
              <strong>{{ currentUser.user.real_name || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>邮箱</span>
              <strong>{{ currentUser.user.email || '-' }}</strong>
            </div>
            <div class="detail-item">
              <span>手机号</span>
              <strong>{{ currentUser.user.phone || '-' }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">登录与归档</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>最近登录</span>
              <strong>{{ currentUser.user.last_login_at || '从未登录' }}</strong>
            </div>
            <div class="detail-item">
              <span>创建时间</span>
              <strong>{{ currentUser.user.gmt_create }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">角色</div>
          <div class="tag-list">
            <el-tag v-for="role in currentUser.roles" :key="role.id" type="info">{{ role.display_name }}</el-tag>
            <span v-if="!currentUser.roles.length">未分配角色</span>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">权限</div>
          <div class="tag-list">
            <el-tag v-for="perm in currentUser.permissions" :key="perm.id" size="small">{{ perm.name }}</el-tag>
            <span v-if="!currentUser.permissions.length">未分配权限</span>
          </div>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import type { DropdownCommand } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  createUser,
  deleteUser,
  getUserDetail,
  getUserList,
  updateUser,
  type UserDetailResponse
} from '../api/system'
import type { User } from '../types'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

const userList = ref<User[]>([])
const loading = ref(false)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const saving = ref(false)
const userFormRef = ref<FormInstance>()

interface UserFormData {
  id?: number
  username: string
  password: string
  real_name: string
  email: string
  phone: string
  status: 'ACTIVE' | 'DISABLED'
}

const userForm = reactive<UserFormData>({
  username: '',
  password: '',
  real_name: '',
  email: '',
  phone: '',
  status: 'ACTIVE'
})

const userFormRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const detailVisible = ref(false)
const currentUser = ref<UserDetailResponse | null>(null)


const loadUserList = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status as 'ACTIVE' | 'DISABLED' | undefined
    })
    userList.value = res.data.data
    pagination.total = res.data.total
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUserList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  handleSearch()
}

const resetUserForm = () => {
  Object.assign(userForm, {
    id: undefined,
    username: '',
    password: '',
    real_name: '',
    email: '',
    phone: '',
    status: 'ACTIVE'
  })
}

const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新建用户'
  resetUserForm()
  dialogVisible.value = true
}

const handleEdit = (row: User) => {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    password: '',
    real_name: row.real_name || '',
    email: row.email || '',
    phone: row.phone || '',
    status: row.status
  })
  dialogVisible.value = true
}

const handleView = async (row: User) => {
  try {
    const res = await getUserDetail(row.id)
    currentUser.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('Failed to load user details:', error)
  }
}

const handleSave = async () => {
  if (!userFormRef.value) return
  await userFormRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (isEdit.value) {
        const data: {
          real_name: string
          email: string
          phone: string
          status: 'ACTIVE' | 'DISABLED'
          password?: string
        } = {
          real_name: userForm.real_name,
          email: userForm.email,
          phone: userForm.phone,
          status: userForm.status
        }
        if (userForm.password) {
          data.password = userForm.password
        }
        await updateUser(userForm.id as number, data)
        ElMessage.success('用户更新成功')
      } else {
        await createUser(userForm)
        ElMessage.success('用户创建成功')
      }
      dialogVisible.value = false
      loadUserList()
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确认删除用户「${row.username}」？删除后将停用该用户。`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteUser(row.id)
    ElMessage.success('用户删除成功')
    loadUserList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete user:', error)
    }
  }
}

const handleRowCommand = (command: DropdownCommand, row: User) => {
  if (command === 'delete') {
    handleDelete(row)
  }
}

const handleDialogClose = () => {
  userFormRef.value?.resetFields()
  userForm.id = undefined
}

onMounted(() => {
  loadUserList()
})
</script>

<style scoped>
.user-list-container {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.page-subtitle {
  margin-top: 6px;
  color: #6b7280;
  line-height: 1.6;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.summary-card__label,
.summary-card__hint {
  color: #6b7280;
  font-size: 13px;
}

.summary-card__value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 600;
  color: #111827;
}

.summary-card__hint {
  margin-top: 8px;
}

.search-form {
  margin-bottom: 16px;
}

.user-main__title,
.detail-main__title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.user-main__meta,
.contact-block__meta,
.status-block__meta,
.detail-main__meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
}

.status-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 20px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 16px;
}

.dialog-aside {
  border-left: 1px solid #e5e7eb;
  padding-left: 20px;
}

.dialog-summary {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
  background: #f8fafc;
}

.dialog-summary__title,
.detail-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.dialog-summary__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-summary__item:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.dialog-summary__item span,
.detail-item span {
  color: #6b7280;
  font-size: 13px;
}

.dialog-summary__item strong,
.detail-item strong {
  color: #111827;
  font-size: 14px;
}

.detail-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px 20px;
  background: #fff;
}

.detail-card--main {
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
}

.detail-tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.danger-command) {
  color: var(--el-color-danger);
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dialog-layout {
    grid-template-columns: 1fr;
  }

  .dialog-aside {
    border-left: 0;
    padding-left: 0;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .summary-grid,
  .dialog-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

