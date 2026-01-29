<template>
  <div class="field-label-container">
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
        <el-form-item :label="labels.key">
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

      <el-table v-loading="loading" :data="labelList" border stripe>
        <el-table-column prop="label_key" :label="labels.key" width="220" />
        <el-table-column :label="labels.zhLabel" min-width="180">
          <template #default="{ row }">
            {{ row.labels?.['zh-CN'] || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="labels.enLabel" min-width="180">
          <template #default="{ row }">
            {{ row.labels?.['en-US'] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" :label="labels.updatedAt" width="170" />
        <el-table-column :label="labels.actions" width="150" fixed="right">
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" label-width="140px">
        <el-form-item :label="labels.key" required>
          <el-input
            v-model="formData.label_key"
            :disabled="isEditing"
            :placeholder="labels.keyPlaceholder"
            @input="handleKeyChange"
          />
          <div class="label-hint">{{ labels.keyHint }}</div>
        </el-form-item>
        <el-form-item :label="labels.zhLabel">
          <el-input v-model="formData.label_zh" :placeholder="labels.zhPlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.enLabel">
          <el-input v-model="formData.label_en" :placeholder="labels.enPlaceholder" />
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
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { getFieldLabelList, createFieldLabel, updateFieldLabel, deleteFieldLabel } from '../api'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import type { FieldLabel } from '../types'

const localeStore = useLocaleStore()

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const labelList = ref<FieldLabel[]>([])
const total = ref(0)

const queryParams = reactive({
  keyword: '',
  page: 1,
  page_size: 20
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const editingId = ref<number | null>(null)

const formData = reactive({
  label_key: '',
  label_zh: '',
  label_en: ''
})

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Label Config',
      add: 'Add Label',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      reload: 'Reload',
      search: 'Search',
      reset: 'Reset',
      key: 'Key',
      zhLabel: 'zh-CN',
      enLabel: 'en-US',
      actions: 'Actions',
      updatedAt: 'Updated At',
      keyPlaceholder: 'e.g. product.list.title',
      keywordPlaceholder: 'Search key',
      zhPlaceholder: 'Chinese label',
      enPlaceholder: 'English label',
      keyHint: 'Key must be dot-path and unique.'
    }
  }
  return {
    title: '标签配置',
    add: '新增标签',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    reload: '刷新',
    search: '查询',
    reset: '重置',
    key: 'Key',
    zhLabel: 'zh-CN',
    enLabel: 'en-US',
    actions: '操作',
    updatedAt: '更新时间',
    keyPlaceholder: '例如: product.list.title',
    keywordPlaceholder: '搜索 Key',
    zhPlaceholder: '中文显示名',
    enPlaceholder: '英文显示名',
    keyHint: 'Key 必须为小写点分层且唯一。'
  }
})

const isEditing = computed(() => editingId.value !== null)

const fetchLabels = async () => {
  loading.value = true
  try {
    const res = await getFieldLabelList({
      keyword: queryParams.keyword || undefined,
      page: queryParams.page,
      page_size: queryParams.page_size
    })
    if (res.success) {
      labelList.value = res.data?.data || []
      total.value = res.data?.total || 0
    }
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.page = 1
  fetchLabels()
}

const handleReset = () => {
  queryParams.keyword = ''
  queryParams.page = 1
  queryParams.page_size = 20
  fetchLabels()
}

const handleReload = () => {
  fetchLabels()
}

const handleCreate = () => {
  dialogTitle.value = labels.value.add
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: FieldLabel) => {
  dialogTitle.value = labels.value.edit
  editingId.value = row.id
  Object.assign(formData, {
    label_key: row.label_key || '',
    label_zh: row.labels?.['zh-CN'] || '',
    label_en: row.labels?.['en-US'] || ''
  })
  dialogVisible.value = true
}

const handleDelete = async (row: FieldLabel) => {
  try {
    await ElMessageBox.confirm(
      localeStore.isEnglish ? 'Confirm delete?' : '确认删除该标签？',
      localeStore.isEnglish ? 'Warning' : '提示',
      {
        confirmButtonText: localeStore.isEnglish ? 'Confirm' : '确认',
        cancelButtonText: localeStore.isEnglish ? 'Cancel' : '取消',
        type: 'warning'
      }
    )
    await deleteFieldLabel(row.id)
    ElMessage.success(localeStore.isEnglish ? 'Deleted' : '删除成功')
    fetchLabels()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const handleSubmit = async () => {
  const labelKey = formData.label_key.trim().toLowerCase()
  const labelZh = formData.label_zh.trim()
  const labelEn = formData.label_en.trim()

  if (!labelKey) {
    ElMessage.error(labels.value.keyPlaceholder)
    return
  }
  if (!labelZh && !labelEn) {
    ElMessage.error(localeStore.isEnglish ? 'At least one label is required.' : '至少填写一个语言')
    return
  }

  saving.value = true
  try {
    const payload = {
      label_key: labelKey,
      labels: {
        'zh-CN': labelZh || undefined,
        'en-US': labelEn || undefined
      }
    }
    if (editingId.value) {
      await updateFieldLabel(editingId.value, { labels: payload.labels })
      ElMessage.success(localeStore.isEnglish ? 'Updated' : '更新成功')
    } else {
      await createFieldLabel(payload)
      ElMessage.success(localeStore.isEnglish ? 'Created' : '新增成功')
    }
    dialogVisible.value = false
    fetchLabels()
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
    label_key: '',
    label_zh: '',
    label_en: ''
  })
}

const handleKeyChange = () => {
  if (formData.label_key) {
    formData.label_key = formData.label_key.toLowerCase()
  }
}

onMounted(() => {
  fetchLabels()
})
</script>

<style scoped>
.field-label-container {
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

.label-hint {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}
</style>
