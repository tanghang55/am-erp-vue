<template>
  <div class="field-label-container">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">字段标签</div>
            <div class="page-subtitle">统一维护页面字段的中文和英文显示名。标签是配置，不是业务数据，查看和编辑要分开。</div>
          </div>
          <div class="page-header__actions">
            <el-button @click="handleReload" :loading="loading">刷新</el-button>
            <el-button type="primary" @click="handleCreate">新增标签</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="标签 Key / 中文名 / 英文名"
            clearable
            style="width: 260px"
            @clear="handleQuery"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="labelList" border stripe>
        <el-table-column label="标签信息" min-width="300">
          <template #default="{ row }">
            <div class="label-main">
              <div class="label-main__title">{{ row.labels?.['zh-CN'] || row.labels?.['en-US'] || '未配置显示名' }}</div>
              <div class="label-main__meta">{{ row.label_key }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="语言内容" min-width="260">
          <template #default="{ row }">
            <div class="language-block">
              <div>中文：{{ row.labels?.['zh-CN'] || '未配置' }}</div>
              <div class="language-block__meta">英文：{{ row.labels?.['en-US'] || '未配置' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ row.updated_at }}</template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看详情</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-dropdown @command="(command) => handleRowCommand(command, row)">
              <el-button size="small">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="delete" class="danger-command">删除标签</el-dropdown-item>
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
          @current-change="fetchLabels"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="标签详情" width="760px">
      <div v-if="currentLabel" class="detail-layout">
        <section class="detail-card detail-card--main">
          <div class="detail-main">
            <div class="detail-main__title">{{ currentLabel.labels?.['zh-CN'] || currentLabel.labels?.['en-US'] || '未配置显示名' }}</div>
            <div class="detail-main__meta">{{ currentLabel.label_key }}</div>
          </div>
        </section>

        <section class="detail-card">
          <div class="detail-card__title">语言内容</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span>中文</span>
              <strong>{{ currentLabel.labels?.['zh-CN'] || '未配置' }}</strong>
            </div>
            <div class="detail-item">
              <span>英文</span>
              <strong>{{ currentLabel.labels?.['en-US'] || '未配置' }}</strong>
            </div>
            <div class="detail-item detail-item--full">
              <span>更新时间</span>
              <strong>{{ currentLabel.updated_at }}</strong>
            </div>
          </div>
        </section>
      </div>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="820px" @close="handleDialogClose">
      <div class="dialog-layout">
        <el-form ref="formRef" :model="formData" label-position="top" class="dialog-form">
          <div class="dialog-grid">
            <el-form-item label="标签 Key" required>
              <el-input
                v-model="formData.label_key"
                :disabled="isEditing"
                placeholder="例如：product.list.title"
                @input="handleKeyChange"
              />
              <div class="label-hint">Key 使用小写点分层，创建后不允许修改。</div>
            </el-form-item>
            <el-form-item label="中文名称">
              <el-input v-model="formData.label_zh" placeholder="中文显示名" />
            </el-form-item>
            <el-form-item label="英文名称">
              <el-input v-model="formData.label_en" placeholder="English label" />
            </el-form-item>
          </div>
        </el-form>

        <aside class="dialog-aside">
          <div class="dialog-summary">
            <div class="dialog-summary__title">标签摘要</div>
            <div class="dialog-summary__item">
              <span>标签 Key</span>
              <strong>{{ formData.label_key || '-' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>中文</span>
              <strong>{{ formData.label_zh || '未配置' }}</strong>
            </div>
            <div class="dialog-summary__item">
              <span>英文</span>
              <strong>{{ formData.label_en || '未配置' }}</strong>
            </div>
          </div>
        </aside>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import type { DropdownCommand } from 'element-plus'
import { createFieldLabel, deleteFieldLabel, getFieldLabelList, updateFieldLabel } from '../api'
import type { FieldLabel } from '../types'

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const labelList = ref<FieldLabel[]>([])
const total = ref(0)
const currentLabel = ref<FieldLabel | null>(null)

const queryParams = reactive({
  keyword: '',
  page: 1,
  page_size: 20
})

const dialogVisible = ref(false)
const detailVisible = ref(false)
const editingId = ref<number | null>(null)

const formData = reactive({
  label_key: '',
  label_zh: '',
  label_en: ''
})

const isEditing = computed(() => editingId.value !== null)
const dialogTitle = computed(() => (isEditing.value ? '编辑标签' : '新增标签'))


const resetForm = () => {
  formData.label_key = ''
  formData.label_zh = ''
  formData.label_en = ''
}

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

const handlePageSizeChange = () => {
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
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleView = (row: FieldLabel) => {
  currentLabel.value = row
  detailVisible.value = true
}

const handleEdit = (row: FieldLabel) => {
  editingId.value = row.id
  formData.label_key = row.label_key || ''
  formData.label_zh = row.labels?.['zh-CN'] || ''
  formData.label_en = row.labels?.['en-US'] || ''
  dialogVisible.value = true
}

const handleDelete = async (row: FieldLabel) => {
  try {
    await ElMessageBox.confirm(`确认删除标签「${row.label_key}」？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteFieldLabel(row.id)
    ElMessage.success('删除成功')
    fetchLabels()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const handleRowCommand = (command: DropdownCommand, row: FieldLabel) => {
  if (command === 'delete') {
    handleDelete(row)
  }
}

const handleSubmit = async () => {
  const labelKey = formData.label_key.trim().toLowerCase()
  const labelZh = formData.label_zh.trim()
  const labelEn = formData.label_en.trim()

  if (!labelKey) {
    ElMessage.error('请填写标签 Key')
    return
  }

  if (!labelZh && !labelEn) {
    ElMessage.error('至少填写一个语言')
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
      ElMessage.success('更新成功')
    } else {
      await createFieldLabel(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchLabels()
  } finally {
    saving.value = false
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields?.()
  resetForm()
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

.label-main__title,
.detail-main__title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.label-main__meta,
.language-block__meta,
.detail-main__meta {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
}

.language-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.dialog-summary__item span,
.label-hint {
  color: #6b7280;
  font-size: 13px;
}

.dialog-summary__item strong {
  color: #111827;
  font-size: 14px;
}

.label-hint {
  margin-top: 8px;
  line-height: 1.6;
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

