<template>
  <div class="menu-list-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">菜单管理</div>
            <div class="page-subtitle">维护导航、路由、权限编码和显示状态。菜单信息以台账方式管理，查看与编辑分离。</div>
          </div>
          <div class="page-header__actions">
            <el-button @click="handleReload" :loading="loading">刷新</el-button>
            <el-button type="primary" @click="handleCreate">新增菜单</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="菜单名称 / 路径 / 权限编码"
            clearable
            style="width: 240px"
            @clear="handleQuery"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 140px" @clear="handleQuery">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="显示">
          <el-select v-model="queryParams.is_hidden" placeholder="全部" clearable style="width: 140px" @clear="handleQuery">
            <el-option v-for="item in hiddenOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="menuList" border stripe>
        <el-table-column label="菜单信息" min-width="250">
          <template #default="{ row }">
            <div class="menu-main">
              <div class="menu-main__title">{{ row.title }}</div>
              <div class="menu-main__meta">
                <span>{{ row.code }}</span>
                <span v-if="row.title_en">{{ row.title_en }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="层级与路径" min-width="280">
          <template #default="{ row }">
            <div class="path-block">
              <div class="path-block__parent">{{ row.parent_title || '根节点' }}</div>
              <div class="path-block__meta">{{ row.full_path || row.path || '-' }}</div>
              <div class="path-block__meta" v-if="row.path && row.full_path !== row.path">{{ row.path }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="权限与组件" min-width="260">
          <template #default="{ row }">
            <div class="relation-block">
              <div>{{ row.permission_code || '未绑定权限' }}</div>
              <div class="relation-block__meta">{{ row.component || '未配置组件' }}</div>
              <div class="relation-block__meta">{{ row.icon || '未配置图标' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态与排序" width="180">
          <template #default="{ row }">
            <div class="status-block">
              <div class="status-block__row">
                <el-switch
                  v-model="row.status"
                  :active-value="'ACTIVE'"
                  :inactive-value="'DISABLED'"
                  :loading="statusLoading[row.id]"
                  @change="(value) => handleStatusChange(row, value)"
                />
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
                </el-tag>
              </div>
              <div class="status-block__row">
                <el-tag :type="row.is_hidden === 1 ? 'warning' : 'success'" size="small">
                  {{ row.is_hidden === 1 ? '隐藏' : '显示' }}
                </el-tag>
                <span class="status-block__sort">排序 {{ row.sort ?? 0 }}</span>
              </div>
            </div>
          </template>
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
                  <el-dropdown-item command="delete" class="danger-command">删除菜单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
          @size-change="handlePageSizeChange"
          @current-change="fetchMenus"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="菜单详情" width="780px">
      <div v-if="currentMenu" class="detail-layout">
        <section class="detail-card detail-card--main">
          <div class="detail-main">
            <div class="detail-main__title">{{ currentMenu.title }}</div>
            <div class="detail-main__meta">{{ currentMenu.code }}</div>
            <div class="detail-tags">
              <el-tag :type="currentMenu.status === 'ACTIVE' ? 'success' : 'info'">
                {{ currentMenu.status === 'ACTIVE' ? '启用' : '停用' }}
              </el-tag>
              <el-tag :type="currentMenu.is_hidden === 1 ? 'warning' : 'success'">
                {{ currentMenu.is_hidden === 1 ? '隐藏' : '显示' }}
              </el-tag>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">路由与层级</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>上级菜单</span>
              <strong>{{ currentMenu.parent_title || '根节点' }}</strong>
            </div>
            <div class="detail-item">
              <span>排序</span>
              <strong>{{ currentMenu.sort ?? 0 }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>完整路径</span>
              <strong>{{ currentMenu.full_path || currentMenu.path || '-' }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>前端路径</span>
              <strong>{{ currentMenu.path || '-' }}</strong>
            </div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">权限与组件</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>权限编码</span>
              <strong>{{ currentMenu.permission_code || '未绑定权限' }}</strong>
            </div>
            <div class="detail-item">
              <span>组件</span>
              <strong>{{ currentMenu.component || '未配置组件' }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>图标</span>
              <strong>{{ currentMenu.icon || '未配置图标' }}</strong>
            </div>
          </div>
        </section>
      </div>
    </el-dialog>

    <el-dialog v-model="drawerVisible" :title="drawerTitle" width="820px" @close="handleDrawerClose">
      <div class="dialog-layout">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="dialog-form">
          <div class="dialog-grid">
            <el-form-item label="菜单名称" prop="title" required>
              <el-input v-model="formData.title" />
            </el-form-item>
            <el-form-item label="英文名称">
              <el-input v-model="formData.title_en" />
            </el-form-item>
            <el-form-item label="菜单编码" prop="code" required>
              <el-input v-model="formData.code" :disabled="isEditing" />
            </el-form-item>
            <el-form-item label="上级菜单ID">
              <el-input-number v-model="formData.parent_id" :min="0" />
            </el-form-item>
            <el-form-item label="前端路径">
              <el-input v-model="formData.path" />
            </el-form-item>
            <el-form-item label="前端组件">
              <el-input v-model="formData.component" />
            </el-form-item>
            <el-form-item label="图标">
              <el-input v-model="formData.icon" />
            </el-form-item>
            <el-form-item label="权限编码" prop="permission_code">
              <el-input v-model="formData.permission_code" />
            </el-form-item>
            <el-form-item label="排序">
              <el-input-number v-model="formData.sort" :min="0" />
            </el-form-item>
            <el-form-item label="显示状态">
              <el-switch v-model="formData.is_hidden" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="菜单状态">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option label="启用" value="ACTIVE" />
                <el-option label="停用" value="DISABLED" />
              </el-select>
            </el-form-item>
          </div>
        </el-form>

        <aside class="dialog-aside">
          <div class="dialog-summary">
            <div class="dialog-summary__title">菜单摘要</div>
            <div class="dialog-summary__item">
              <span>菜单名称</span>
              <strong>{{ formData.title || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>菜单编码</span>
              <strong>{{ formData.code || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>前端路径</span>
              <strong>{{ formData.path || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>权限编码</span>
              <strong>{{ formData.permission_code || '未绑定权限' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>显示状态</span>
              <strong>{{ formData.is_hidden === 1 ? '隐藏' : '显示' }}</strong>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import type { DropdownCommand } from 'element-plus'
import { createMenu, deleteMenu, getMenuList, updateMenu, updateMenuStatus } from '../api'
import type { MenuRecord } from '../types'
import { buildCodeValidator, buildPermissionCodeValidator } from '@/modules/common/utils/code'

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const menuList = ref<MenuRecord[]>([])
const total = ref(0)
const currentMenu = ref<MenuRecord | null>(null)

const queryParams = reactive({
  keyword: '',
  status: '',
  is_hidden: '' as '' | '0' | '1',
  page: 1,
  page_size: 20
})

const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' }
]

const hiddenOptions = [
  { label: '显示', value: '0' },
  { label: '隐藏', value: '1' }
]

const drawerVisible = ref(false)
const detailVisible = ref(false)
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

const validateMenuCode = buildCodeValidator('菜单编码只允许字母、数字、中划线、下划线')
const validatePermissionCode = buildPermissionCodeValidator('权限编码只允许字母、数字、点号、中划线、下划线')

const formRules: FormRules = {
  title: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入菜单编码', trigger: 'blur' },
    { validator: validateMenuCode, trigger: 'blur' }
  ],
  permission_code: [{ validator: validatePermissionCode, trigger: 'blur' }]
}

const statusLoading = ref<Record<number, boolean>>({})

const isEditing = computed(() => editingId.value !== null)
const drawerTitle = computed(() => (isEditing.value ? '编辑菜单' : '新增菜单'))


const resetFormData = () => {
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
}

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

const handlePageSizeChange = () => {
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
  resetFormData()
  drawerVisible.value = true
}

const handleView = (row: MenuRecord) => {
  currentMenu.value = row
  detailVisible.value = true
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
    await ElMessageBox.confirm(`确认删除菜单「${row.title}」？`, '提示', {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    await deleteMenu(row.id)
    ElMessage.success('删除成功')
    fetchMenus()
  } catch (error) {
    // ignore cancel
  }
}

const handleRowCommand = (command: DropdownCommand, row: MenuRecord) => {
  if (command === 'delete') {
    handleDelete(row)
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
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
      ElMessage.success('菜单更新成功')
    } else {
      await createMenu(payload)
      ElMessage.success('菜单创建成功')
    }
    drawerVisible.value = false
    fetchMenus()
  } finally {
    saving.value = false
  }
}

const handleDrawerClose = () => {
  formRef.value?.clearValidate?.()
}

const handleStatusChange = async (row: MenuRecord, value: string) => {
  const previous = row.status
  statusLoading.value[row.id] = true
  try {
    await updateMenuStatus(row.id, { status: value })
    ElMessage.success('状态更新成功')
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

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-header__actions {
  display: flex;
  gap: 8px;
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

.menu-main__title,
.detail-main__title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.menu-main__meta,
.path-block__meta,
.relation-block__meta,
.detail-main__meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.path-block__parent,
.relation-block > div:first-child {
  color: #111827;
}

.status-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-block__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-block__sort {
  color: #6b7280;
  font-size: 13px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
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

.detail-card__title {
  margin-bottom: 14px;
  font-weight: 600;
  color: #111827;
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

.detail-item span {
  color: #6b7280;
  font-size: 13px;
}

.detail-item strong {
  color: #111827;
  font-size: 14px;
  line-height: 1.6;
}

.detail-item--full {
  grid-column: 1 / -1;
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

.dialog-summary__title {
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

.dialog-summary__item span {
  color: #6b7280;
  font-size: 13px;
}

.dialog-summary__item strong {
  color: #111827;
  font-size: 14px;
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
  .detail-grid,
  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>

