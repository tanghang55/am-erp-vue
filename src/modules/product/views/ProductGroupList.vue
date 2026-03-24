<template>
  <div class="product-group-list">
    <div class="page-header">
      <div class="page-header__content">
        <div class="page-header__title-row">
          <h2 class="page-title">{{ text.title }}</h2>
          <el-tag type="info" effect="plain" size="small">{{ text.lightweightTag }}</el-tag>
        </div>
        <p class="page-description">{{ text.subtitle }}</p>
      </div>
      <div class="page-header__actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          {{ text.create }}
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="workspace-card">
      <div class="workspace-toolbar">
        <div class="workspace-toolbar__intro">
          <div class="workspace-toolbar__title">{{ text.archiveTitle }}</div>
          <div class="workspace-toolbar__meta">
            {{ text.currentPageRecords.replace('{count}', String(groupList.length)) }}
          </div>
        </div>

        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item :label="text.keyword">
            <el-input
              v-model="searchForm.keyword"
              :placeholder="text.keywordPlaceholder"
              clearable
              style="width: 260px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item :label="text.marketplace">
            <el-select v-model="searchForm.marketplace" clearable style="width: 140px">
              <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item :label="text.status">
            <el-select v-model="searchForm.status" clearable style="width: 140px">
              <el-option :label="text.statusActive" value="ACTIVE" />
              <el-option :label="text.statusInactive" value="INACTIVE" />
              <el-option :label="text.statusDiscontinued" value="DISCONTINUED" />
            </el-select>
          </el-form-item>
          <el-form-item :label="text.childrenFilter">
            <el-select v-model="searchForm.has_children" clearable style="width: 140px">
              <el-option :label="text.childrenAll" value="" />
              <el-option :label="text.childrenAttached" value="true" />
              <el-option :label="text.childrenEmpty" value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">{{ text.search }}</el-button>
            <el-button @click="handleReset">{{ text.reset }}</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="groupList" v-loading="loading" border stripe>
        <el-table-column prop="parent_asin" :label="text.parentAsin" width="150" />
        <el-table-column :label="text.titleColumn" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="group-title-cell">
              <div class="group-title-main">{{ row.title }}</div>
              <div class="group-title-meta">
                <el-tag size="small" :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
                <span>{{ row.brand || '-' }}</span>
                <span>{{ row.category || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="marketplace" :label="text.marketplace" width="100" align="center" />
        <el-table-column :label="text.childrenSummary" width="210" align="center">
          <template #default="{ row }">
            <div class="count-stack">
              <div>
                <span class="count-value">{{ row.child_count ?? 0 }}</span>
                <span class="count-label">{{ text.totalChildren }}</span>
              </div>
              <div>
                <span class="count-value success">{{ row.active_child_count ?? 0 }}</span>
                <span class="count-label">{{ text.activeChildren }}</span>
              </div>
              <div>
                <span class="count-value muted">{{ row.inactive_child_count ?? 0 }}</span>
                <span class="count-label">{{ text.inactiveChildren }}</span>
              </div>
            </div>
            <el-tag v-if="(row.child_count ?? 0) > 0" size="small" type="warning" effect="plain">
              {{ text.notDeletable }}
            </el-tag>
            <div v-if="getDeleteBlockReason(row)" class="delete-block-reason">
              {{ getDeleteBlockReason(row) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.updatedAt" width="170">
          <template #default="{ row }">{{ formatDateTime(row.gmt_modified) }}</template>
        </el-table-column>
        <el-table-column :label="text.actions" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ text.detail }}</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">{{ text.edit }}</el-button>
            <el-tooltip v-if="getDeleteBlockReason(row)" :content="getDeleteBlockReason(row)" placement="top">
              <span class="action-button-wrapper">
                <el-button size="small" type="danger" disabled>
                  {{ text.delete }}
                </el-button>
              </span>
            </el-tooltip>
            <el-button v-else size="small" type="danger" @click="handleDelete(row)">
              {{ text.delete }}
            </el-button>
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
          @current-change="loadGroupList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1040px"
      destroy-on-close
      class="group-edit-dialog"
    >
      <div class="editor-main">
        <div class="editor-topbar">
          <div>
            <div class="editor-topbar__title">{{ dialogTitle }}</div>
            <div class="editor-topbar__hint">{{ text.editorHint }}</div>
          </div>
        </div>

        <div class="form-section">
          <div class="section-heading">
            <div class="section-heading__title">{{ text.basicInfo }}</div>
            <div class="section-heading__hint">{{ text.basicInfoHint }}</div>
          </div>
          <el-form ref="groupFormRef" :model="groupForm" :rules="groupFormRules" label-position="top">
            <div class="edit-grid">
              <el-form-item :label="text.parentAsin" prop="parent_asin">
                <el-input v-model="groupForm.parent_asin" :disabled="isEdit" />
              </el-form-item>
              <el-form-item :label="text.marketplace" prop="marketplace">
                <el-select v-model="groupForm.marketplace" :disabled="isEdit" style="width: 100%">
                  <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
              <el-form-item :label="text.titleColumn" prop="title" class="span-full">
                <el-input v-model="groupForm.title" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item :label="text.brand">
                <el-input v-model="groupForm.brand" />
              </el-form-item>
              <el-form-item :label="text.category">
                <el-input v-model="groupForm.category" />
              </el-form-item>
              <el-form-item :label="text.status" prop="status">
                <el-select v-model="groupForm.status" style="width: 100%">
                  <el-option :label="text.statusActive" value="ACTIVE" />
                  <el-option :label="text.statusInactive" value="INACTIVE" />
                  <el-option :label="text.statusDiscontinued" value="DISCONTINUED" />
                </el-select>
              </el-form-item>
              <el-form-item :label="text.imageUrl">
                <el-input v-model="groupForm.image_url" />
              </el-form-item>
              <el-form-item :label="text.remark" class="span-full">
                <el-input v-model="groupForm.remark" type="textarea" :rows="3" />
              </el-form-item>
            </div>
          </el-form>
        </div>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ text.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ text.save }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  createProductGroup,
  deleteProductGroup,
  getProductGroupList,
  updateProductGroup
} from '../api/groups'
import type { CreateProductGroupParams, ProductGroup } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const router = useRouter()
const localeStore = useLocaleStore()

const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']

const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref('')
const groupFormRef = ref<FormInstance>()
const groupList = ref<ProductGroup[]>([])

const searchForm = reactive({
  keyword: '',
  marketplace: '',
  status: '',
  has_children: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const groupForm = reactive<CreateProductGroupParams & { id?: number }>({
  parent_asin: '',
  title: '',
  marketplace: 'US',
  brand: '',
  category: '',
  status: 'ACTIVE',
  image_url: '',
  remark: ''
})

const text = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Product Grouping',
      subtitle: 'Use lightweight grouping for viewing and listing aggregation. It does not drive procurement, inventory, or finance.',
      lightweightTag: 'Lightweight',
      archiveTitle: 'Grouping Archive',
      currentPageRecords: '{count} grouping records on current page',
      create: 'Create Group',
      keyword: 'Keyword',
      keywordPlaceholder: 'Parent ASIN / Title',
      marketplace: 'Marketplace',
      status: 'Status',
      childrenFilter: 'Children',
      childrenAll: 'All',
      childrenAttached: 'Attached',
      childrenEmpty: 'Empty',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusDiscontinued: 'Discontinued',
      search: 'Search',
      reset: 'Reset',
      parentAsin: 'Parent ASIN',
      titleColumn: 'Title',
      brand: 'Brand',
      category: 'Category',
      childrenSummary: 'Children Summary',
      totalChildren: 'Total',
      activeChildren: 'Active',
      inactiveChildren: 'Inactive',
      updatedAt: 'Updated At',
      actions: 'Actions',
      detail: 'Grouping Detail',
      edit: 'Edit',
      delete: 'Delete',
      imageUrl: 'Image URL',
      remark: 'Remark',
      cancel: 'Cancel',
      save: 'Save',
      warning: 'Warning',
      confirm: 'Confirm',
      required: 'Required',
      basicInfo: 'Basic Information',
      basicInfoHint: 'Maintain grouping identity and marketplace attributes first. Child product relations are managed on the detail page.',
      editorHint: 'This dialog only maintains grouping identity. Child product assignment stays in the detail page.',
      groupOverview: 'Grouping Overview',
      groupOverviewHint: 'Use the right panel to verify identity fields before saving.',
      lightweightRule: 'Grouping Rule',
      lightweightRuleHint: 'Grouping is only for viewing and listing aggregation. It does not change procurement, inventory, or finance behavior.',
      createTitle: 'Create Product Group',
      editTitle: 'Edit Product Group',
      createdSuccess: 'Product group created successfully',
      updatedSuccess: 'Product group updated successfully',
      deletedSuccess: 'Product group deleted successfully',
      notDeletable: 'Cannot Delete',
      deleteBlockedByChildren: 'Remove all child products before deleting this grouping.'
    }
  }
  return {
    title: '产品归组',
    subtitle: '这里只做轻量归组，用于查看和 listing 聚合，不参与采购、库存和财务计算。',
    lightweightTag: '轻量',
    archiveTitle: '归组档案',
    currentPageRecords: '当前页共 {count} 条归组记录',
    create: '新增归组',
    keyword: '关键词',
    keywordPlaceholder: '父体 ASIN / 标题',
    marketplace: '站点',
    status: '状态',
    childrenFilter: '子体',
    childrenAll: '全部',
    childrenAttached: '已挂载',
    childrenEmpty: '空归组',
    statusActive: '启用',
    statusInactive: '停用',
    statusDiscontinued: '停售',
    search: '查询',
    reset: '重置',
    parentAsin: '父体 ASIN',
    titleColumn: '标题',
    brand: '品牌',
    category: '类目',
    childrenSummary: '子体概况',
    totalChildren: '总数',
    activeChildren: '启用',
    inactiveChildren: '停用',
    updatedAt: '更新时间',
    actions: '操作',
    detail: '归组详情',
    edit: '编辑',
    delete: '删除',
    imageUrl: '图片地址',
    remark: '备注',
    cancel: '取消',
    save: '保存',
    warning: '提示',
    confirm: '确认',
    required: '必填',
    basicInfo: '基础信息',
    basicInfoHint: '先确认归组身份、站点和基础档案，子体关系放到详情页维护。',
    editorHint: '这里仅维护归组身份信息，不在弹窗里处理子体挂载关系。',
    groupOverview: '归组概览',
    groupOverviewHint: '右侧只做核对，不替代左侧录入。',
    lightweightRule: '归组规则',
    lightweightRuleHint: '归组只是展示和 listing 聚合，不影响采购、库存和财务。',
    createTitle: '新增产品归组',
    editTitle: '编辑产品归组',
    createdSuccess: '产品归组创建成功',
    updatedSuccess: '产品归组更新成功',
    deletedSuccess: '产品归组删除成功',
    notDeletable: '不可删除',
    deleteBlockedByChildren: '请先移除全部子体，再删除归组。'
  }
})

const groupFormRules = computed<FormRules>(() => ({
  parent_asin: [{ required: true, message: text.value.required, trigger: 'blur' }],
  title: [{ required: true, message: text.value.required, trigger: 'blur' }],
  marketplace: [{ required: true, message: text.value.required, trigger: 'change' }],
  status: [{ required: true, message: text.value.required, trigger: 'change' }]
}))

const getStatusType = (status: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    DISCONTINUED: 'danger'
  }
  return map[status] || 'warning'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: text.value.statusActive,
    INACTIVE: text.value.statusInactive,
    DISCONTINUED: text.value.statusDiscontinued
  }
  return map[status] || status
}

const getDeleteBlockReason = (row: ProductGroup) => {
  if ((row.child_count ?? 0) > 0) {
    return text.value.deleteBlockedByChildren
  }
  return ''
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const loadGroupList = async () => {
  loading.value = true
  try {
    const res = await getProductGroupList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      marketplace: searchForm.marketplace || undefined,
      status: searchForm.status || undefined,
      has_children: searchForm.has_children || undefined
    })
    const items = Array.isArray(res.data?.data) ? res.data.data : []
    groupList.value = items
    pagination.total = res.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

const resetGroupForm = () => {
  Object.assign(groupForm, {
    id: undefined,
    parent_asin: '',
    title: '',
    marketplace: 'US',
    brand: '',
    category: '',
    status: 'ACTIVE',
    image_url: '',
    remark: ''
  })
}

const handleSearch = () => {
  pagination.page = 1
  loadGroupList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.marketplace = ''
  searchForm.status = ''
  searchForm.has_children = ''
  handleSearch()
}

const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = text.value.createTitle
  resetGroupForm()
  dialogVisible.value = true
}

const handleEdit = (row: ProductGroup) => {
  isEdit.value = true
  dialogTitle.value = text.value.editTitle
  Object.assign(groupForm, {
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

const handleView = (row: ProductGroup) => {
  router.push({ name: 'product-groups-detail', params: { id: row.id } })
}

const handleSave = async () => {
  if (!groupFormRef.value) return
  const valid = await groupFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload: CreateProductGroupParams = {
      parent_asin: groupForm.parent_asin,
      title: groupForm.title,
      marketplace: groupForm.marketplace,
      brand: groupForm.brand || undefined,
      category: groupForm.category || undefined,
      status: groupForm.status,
      image_url: groupForm.image_url || undefined,
      remark: groupForm.remark || undefined
    }

    if (isEdit.value && groupForm.id) {
      await updateProductGroup(groupForm.id, payload)
      ElMessage.success(text.value.updatedSuccess)
    } else {
      await createProductGroup(payload)
      ElMessage.success(text.value.createdSuccess)
    }
    dialogVisible.value = false
    loadGroupList()
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: ProductGroup) => {
  const deleteBlockedReason = getDeleteBlockReason(row)
  if (deleteBlockedReason) {
    ElMessage.warning(deleteBlockedReason)
    return
  }
  try {
    await ElMessageBox.confirm(
      localeStore.isEnglish
        ? `Delete product group ${row.parent_asin}?`
        : `确认删除产品归组 ${row.parent_asin}？`,
      text.value.warning,
      {
        confirmButtonText: text.value.confirm,
        cancelButtonText: text.value.cancel,
        type: 'warning'
      }
    )
    await deleteProductGroup(row.id)
    ElMessage.success(text.value.deletedSuccess)
    await loadGroupList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete product group failed:', error)
    }
  }
}

onMounted(() => {
  loadGroupList()
})
</script>

<style scoped>
@import "../styles/workbench.css";

.product-group-list {
  display: grid;
  gap: 16px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.group-title-cell {
  display: grid;
  gap: 6px;
}

.group-title-main {
  font-weight: 600;
  color: #0f172a;
}

.group-title-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
}

.count-stack {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.count-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.count-value.success {
  color: #16a34a;
}

.count-value.muted {
  color: #64748b;
}

.count-label {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #94a3b8;
}

.delete-block-reason {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: #64748b;
}

.action-button-wrapper {
  display: inline-flex;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.editor-layout {
  grid-template-columns: minmax(0, 1fr) 300px;
}

.editor-main {
  display: grid;
  gap: 16px;
}

.editor-topbar__title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.editor-topbar__hint {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.form-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.section-heading {
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
}

.section-heading__title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.section-heading__hint {
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.edit-grid .span-full {
  grid-column: 1 / -1;
}

.editor-side {
  display: grid;
  gap: 16px;
}

.side-metric-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.side-metric {
  display: grid;
  gap: 4px;
}

.side-metric__label {
  font-size: 12px;
  color: #94a3b8;
}

.side-metric__value {
  font-size: 13px;
  color: #0f172a;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .edit-grid {
    grid-template-columns: 1fr;
  }

  .count-stack {
    flex-direction: column;
    gap: 6px;
  }
}

</style>
