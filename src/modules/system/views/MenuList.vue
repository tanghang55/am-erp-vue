<template>
  <div class="menu-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ labels.title }}</span>
          <div class="header-actions">
            <el-button @click="handleReload" :loading="loading">
              {{ labels.reload }}
            </el-button>
            <el-button type="primary" @click="handleCreate">
              {{ labels.add }}
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item :label="labels.keyword">
          <el-input
            v-model="queryParams.keyword"
            :placeholder="labels.keywordPlaceholder"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item :label="labels.status">
          <el-select v-model="queryParams.status" style="width: 140px">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.hidden">
          <el-select v-model="queryParams.is_hidden" style="width: 140px">
            <el-option
              v-for="item in hiddenOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ labels.search }}</el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="menuList" border stripe>
        <el-table-column prop="title" :label="labels.titleCol" width="160" />
        <el-table-column prop="title_en" :label="labels.titleEnCol" width="160" />
        <el-table-column prop="parent_title" :label="labels.parentTitle" width="160" />
        <el-table-column prop="full_path" :label="labels.fullPath" min-width="220" show-overflow-tooltip />
        <el-table-column prop="path" :label="labels.path" min-width="180" show-overflow-tooltip />
        <el-table-column prop="permission_code" :label="labels.permissionCode" min-width="180" show-overflow-tooltip />
        <el-table-column :label="labels.status" width="120">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'ACTIVE'"
              :inactive-value="'DISABLED'"
              :loading="statusLoading[row.id]"
              @change="(value) => handleStatusChange(row, value)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="labels.hidden" width="120">
          <template #default="{ row }">
            <el-tag :type="row.is_hidden === 1 ? 'warning' : 'success'">
              {{ row.is_hidden === 1 ? labels.hiddenYes : labels.hiddenNo }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" :label="labels.sort" width="80" />
        <el-table-column :label="labels.actions" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">{{ labels.edit }}</el-button>
            <el-button link type="danger" @click="handleDelete(row)">{{ labels.delete }}</el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="520px" @close="handleDrawerClose">
      <el-form ref="formRef" :model="formData" label-width="140px">
        <el-form-item :label="labels.titleCol" required>
          <el-input v-model="formData.title" />
        </el-form-item>
        <el-form-item :label="labels.titleEnCol">
          <el-input v-model="formData.title_en" />
        </el-form-item>
        <el-form-item :label="labels.code" required>
          <el-input v-model="formData.code" :disabled="isEditing" />
        </el-form-item>
        <el-form-item :label="labels.parentId">
          <el-input-number v-model="formData.parent_id" :min="0" />
        </el-form-item>
        <el-form-item :label="labels.path">
          <el-input v-model="formData.path" />
        </el-form-item>
        <el-form-item :label="labels.component">
          <el-input v-model="formData.component" />
        </el-form-item>
        <el-form-item :label="labels.icon">
          <el-input v-model="formData.icon" />
        </el-form-item>
        <el-form-item :label="labels.permissionCode">
          <el-input v-model="formData.permission_code" />
        </el-form-item>
        <el-form-item :label="labels.sort">
          <el-input-number v-model="formData.sort" :min="0" />
        </el-form-item>
        <el-form-item :label="labels.hidden">
          <el-switch v-model="formData.is_hidden" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="labels.status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="DISABLED" value="DISABLED" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          {{ labels.save }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { getMenuList, createMenu, updateMenu, updateMenuStatus, deleteMenu } from '../api'
import type { MenuRecord } from '../types'

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const menuList = ref<MenuRecord[]>([])
const total = ref(0)

const queryParams = reactive({
  keyword: '',
  status: '',
  is_hidden: '',
  page: 1,
  page_size: 20
})

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'DISABLED', value: 'DISABLED' }
]

const hiddenOptions = [
  { label: 'All', value: '' },
  { label: 'Visible', value: '0' },
  { label: 'Hidden', value: '1' }
]

const drawerVisible = ref(false)
const editingId = ref<number | null>(null)

const formData = reactive({
  title: '',
  title_en: '',
  code: '',
  parent_id: null as number | null,
  path: '',
  component: '',
  icon: '',
  sort: 0,
  is_hidden: 0,
  permission_code: '',
  status: 'ACTIVE'
})

const statusLoading = ref<Record<number, boolean>>({})

const labels = computed(() => ({
  title: 'Menu List',
  add: 'Add Menu',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  reload: 'Reload',
  search: 'Search',
  reset: 'Reset',
  keyword: 'Keyword',
  keywordPlaceholder: 'Search title/path/permission',
  titleCol: 'Title',
  titleEnCol: 'Title (EN)',
  parentTitle: 'Parent',
  fullPath: 'Full Path',
  path: 'Path',
  code: 'Code',
  parentId: 'Parent ID',
  component: 'Component',
  icon: 'Icon',
  permissionCode: 'Permission Code',
  status: 'Status',
  hidden: 'Hidden',
  hiddenYes: 'Hidden',
  hiddenNo: 'Visible',
  sort: 'Sort',
  actions: 'Actions',
  createTitle: 'Create Menu',
  editTitle: 'Edit Menu'
}))

const isEditing = computed(() => editingId.value !== null)
const drawerTitle = computed(() => (isEditing.value ? labels.value.editTitle : labels.value.createTitle))

const fetchMenus = async () => {
  loading.value = true
  try {
    const res = await getMenuList({
      keyword: queryParams.keyword || undefined,
      status: queryParams.status || undefined,
      is_hidden: queryParams.is_hidden === '' ? undefined : Number(queryParams.is_hidden),
      page: queryParams.page,
      page_size: queryParams.page_size
    })
    if (res.success) {
      menuList.value = res.data.data
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchMenus()
}

const handleReset = () => {
  queryParams.keyword = ''
  queryParams.status = ''
  queryParams.is_hidden = ''
  queryParams.page = 1
  queryParams.page_size = 20
  fetchMenus()
}

const handleReload = () => {
  fetchMenus()
}

const handleCreate = () => {
  editingId.value = null
  formData.title = ''
  formData.title_en = ''
  formData.code = ''
  formData.parent_id = null
  formData.path = ''
  formData.component = ''
  formData.icon = ''
  formData.sort = 0
  formData.is_hidden = 0
  formData.permission_code = ''
  formData.status = 'ACTIVE'
  drawerVisible.value = true
}

const handleEdit = (row: MenuRecord) => {
  editingId.value = row.id
  formData.title = row.title
  formData.title_en = row.title_en || ''
  formData.code = row.code
  formData.parent_id = row.parent_id ?? null
  formData.path = row.path || ''
  formData.component = row.component || ''
  formData.icon = row.icon || ''
  formData.sort = row.sort ?? 0
  formData.is_hidden = row.is_hidden ?? 0
  formData.permission_code = row.permission_code || ''
  formData.status = row.status || 'ACTIVE'
  drawerVisible.value = true
}

const handleDelete = async (row: MenuRecord) => {
  try {
    await ElMessageBox.confirm('Delete this menu?', 'Confirm', {
      type: 'warning'
    })
    await deleteMenu(row.id)
    ElMessage.success('Deleted')
    fetchMenus()
  } catch (error) {
    // Cancelled
  }
}

const handleSubmit = async () => {
  saving.value = true
  try {
    const payload = {
      title: formData.title,
      title_en: formData.title_en || undefined,
      code: formData.code,
      parent_id: formData.parent_id || undefined,
      path: formData.path || undefined,
      component: formData.component || undefined,
      icon: formData.icon || undefined,
      sort: formData.sort,
      is_hidden: formData.is_hidden,
      permission_code: formData.permission_code || undefined,
      status: formData.status
    }

    if (isEditing.value && editingId.value !== null) {
      await updateMenu(editingId.value, payload)
      ElMessage.success('Updated')
    } else {
      await createMenu(payload)
      ElMessage.success('Created')
    }
    drawerVisible.value = false
    fetchMenus()
  } finally {
    saving.value = false
  }
}

const handleDrawerClose = () => {
  if (formRef.value) {
    formRef.value.clearValidate?.()
  }
}

const handleStatusChange = async (row: MenuRecord, value: string) => {
  const previous = row.status
  statusLoading.value[row.id] = true
  try {
    await updateMenuStatus(row.id, { status: value })
  } catch (error) {
    row.status = previous || 'DISABLED'
  } finally {
    statusLoading.value[row.id] = false
  }
}

onMounted(() => {
  fetchMenus()
})
</script>

<style scoped>
.menu-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filter-form {
  margin-bottom: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
