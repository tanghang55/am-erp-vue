<template>
  <div class="system-settings-container">
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

      <!-- 筛选区域 -->
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item :label="labels.scope">
          <el-select v-model="queryParams.scope_type" style="width: 140px">
            <el-option
              v-for="item in scopeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.scopeId">
          <el-input-number
            v-model="queryParams.scope_id"
            :min="0"
            :disabled="queryParams.scope_type === 'GLOBAL'"
          />
        </el-form-item>
        <el-form-item>
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

      <!-- 列表 -->
      <el-table v-loading="loading" :data="settingList" border stripe>
        <el-table-column prop="setting_key" :label="labels.key" width="220" />
        <el-table-column :label="labels.type" width="140">
          <template #default="{ row }">
            <el-tag :type="row.setting_type === 'SYSTEM' ? 'info' : 'success'">
              {{ row.setting_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" :label="labels.value" min-width="160" />
        <el-table-column prop="description" :label="labels.description" min-width="220" show-overflow-tooltip />
        <el-table-column prop="updated_at" :label="labels.updatedAt" width="170" />
        <el-table-column :label="labels.actions" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="row.setting_type === 'SYSTEM'" @click="handleEdit(row)">
              {{ labels.edit }}
            </el-button>
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
      width="640px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" label-width="120px">
        <el-form-item :label="labels.key" required>
          <el-select
            v-model="formData.setting_key"
            filterable
            allow-create
            default-first-option
            :disabled="isEditing"
            style="width: 100%"
            @change="handleKeyChange"
          >
            <el-option
              v-for="item in catalogOptions"
              :key="item.key"
              :label="item.key"
              :value="item.key"
            />
          </el-select>
          <div class="setting-hint">{{ labels.keyExample }}</div>
        </el-form-item>
        <el-form-item :label="labels.value" required>
          <el-input v-model="formData.value" :placeholder="labels.valuePlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            :placeholder="labels.descriptionPlaceholder"
          />
        </el-form-item>
        <el-form-item :label="labels.type" required>
          <el-select v-model="formData.setting_type" :disabled="isEditing" style="width: 100%">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          {{ labels.save }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { getSystemSettings, createSystemSetting, updateSystemSetting } from '../api'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import type { SystemSetting, SettingCatalogItem } from '../types'

const localeStore = useLocaleStore()

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const settingList = ref<SystemSetting[]>([])
const total = ref(0)
const catalogOptions = ref<SettingCatalogItem[]>([])

const queryParams = reactive({
  keyword: '',
  page: 1,
  page_size: 20
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const editingId = ref<number | null>(null)

const formData = reactive({
  setting_key: '',
  value: '',
  description: '',
  setting_type: 'CUSTOM'
})

const typeOptions = [
  { label: 'SYSTEM', value: 'SYSTEM' },
  { label: 'CUSTOM', value: 'CUSTOM' }
]

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'System Settings',
      save: 'Save',
      reload: 'Reload',
      add: 'Add Setting',
      search: 'Search',
      reset: 'Reset',
      edit: 'Edit',
      cancel: 'Cancel',
      key: 'Key',
      type: 'Type',
      value: 'Value',
      description: 'Description',
      actions: 'Actions',
      updatedAt: 'Updated At',
      keyExample: 'Example: DEFAULT_CURRENCY, ALERT_DAYS',
      keywordPlaceholder: 'Search key or description',
      valuePlaceholder: 'Enter value',
      descriptionPlaceholder: 'Describe this setting'
    }
  }
  return {
    title: '系统设置',
    save: '保存',
    reload: '重新加载',
    add: '新增配置',
    search: '查询',
    reset: '重置',
    edit: '编辑',
    cancel: '取消',
    key: 'Key',
    type: '类型',
    value: 'Value',
    description: '描述',
    actions: '操作',
    updatedAt: '更新时间',
    keyExample: '示例: DEFAULT_CURRENCY, ALERT_DAYS',
    keywordPlaceholder: '搜索 Key 或描述',
    valuePlaceholder: '请输入值',
    descriptionPlaceholder: '请输入描述'
  }
})

const isEditing = computed(() => editingId.value !== null)

const fetchSettings = async () => {
  loading.value = true
  try {
    const res = await getSystemSettings({
      keyword: queryParams.keyword || undefined,
      page: queryParams.page,
      page_size: queryParams.page_size
    })
    settingList.value = res.data.items
    total.value = res.data.total
    catalogOptions.value = res.data.catalog || []
  } catch (error: any) {
    ElMessage.error('加载系统设置失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchSettings()
}

const handleReset = () => {
  queryParams.keyword = ''
  queryParams.page = 1
  queryParams.page_size = 20
  fetchSettings()
}

const handleReload = () => {
  fetchSettings()
}

const handleCreate = () => {
  dialogTitle.value = labels.value.add
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: SystemSetting) => {
  dialogTitle.value = labels.value.edit
  editingId.value = row.id
  Object.assign(formData, {
    setting_key: row.setting_key,
    value: row.value,
    description: row.description || '',
    scope_type: row.scope_type,
    scope_id: row.scope_id
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formData.setting_key || !formData.value) {
    ElMessage.error(labels.value.valuePlaceholder)
    return
  }

  saving.value = true
  try {
  if (editingId.value) {
      await updateSystemSetting(editingId.value, {
        value: formData.value,
        description: formData.description
      })
      ElMessage.success(localeStore.isEnglish ? 'Updated' : '更新成功')
  } else {
    await createSystemSetting({
      setting_key: formData.setting_key,
      value: formData.value,
      description: formData.description,
      setting_type: formData.setting_type
    })
    ElMessage.success(localeStore.isEnglish ? 'Created' : '新增成功')
  }
    dialogVisible.value = false
    fetchSettings()
  } catch (error: any) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetForm()
}

const resetForm = () => {
  Object.assign(formData, {
    setting_key: '',
    value: '',
    description: '',
    setting_type: 'CUSTOM'
  })
}

const handleKeyChange = (value: string) => {
  const upperValue = value.toUpperCase()
  if (upperValue !== formData.setting_key) {
    formData.setting_key = upperValue
  }
  const match = catalogOptions.value.find((item) => item.key === upperValue)
  if (match && !formData.description) {
    formData.description = match.description || ''
  }
  if (match && match.setting_type) {
    formData.setting_type = match.setting_type
  }
}

onMounted(() => {
  fetchSettings()
})
</script>

<style scoped>
.system-settings-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-form {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.setting-hint {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}
</style>
