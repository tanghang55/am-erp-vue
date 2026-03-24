<template>
  <div class="product-group-detail">
    <div class="page-header">
      <div class="page-header__content">
        <div class="page-header__title-row">
          <el-button text @click="handleBack">{{ text.back }}</el-button>
          <h2 class="page-title">{{ text.pageTitle }}</h2>
          <el-tag type="info" effect="plain" size="small">{{ text.lightweightTag }}</el-tag>
        </div>
        <p class="page-description">{{ text.pageSubtitle }}</p>
      </div>
      <div class="page-header__actions" v-if="group">
        <el-button @click="handleOpenEdit">{{ text.editParent }}</el-button>
        <el-button type="primary" @click="pickerVisible = true">{{ text.addChildren }}</el-button>
        <el-tooltip :disabled="group.child_count === 0" :content="text.deleteBlockedHint" placement="bottom">
          <div>
            <el-button type="danger" :disabled="group.child_count > 0" @click="handleDeleteGroup">{{ text.deleteGroup }}</el-button>
          </div>
        </el-tooltip>
      </div>
    </div>

    <div v-loading="loading" class="detail-content">
      <template v-if="group">
        <div class="detail-hero">
          <div class="detail-hero__content">
            <div class="detail-hero__title">{{ group.title }}</div>
            <div class="detail-hero__meta">
              <el-tag :type="getStatusType(group.status)">{{ getStatusLabel(group.status) }}</el-tag>
              <span>{{ group.parent_asin }}</span>
              <span>{{ group.marketplace }}</span>
            </div>
          </div>
        </div>

        <div class="summary-grid">
          <el-card v-for="card in summaryCards" :key="card.key" shadow="hover" class="summary-card">
            <div class="summary-card__label">{{ card.label }}</div>
            <div class="summary-card__value">{{ card.value }}</div>
            <div class="summary-card__hint">{{ card.hint }}</div>
          </el-card>
        </div>

        <div class="detail-layout">
          <div class="detail-main">
            <section class="detail-section-card">
              <div class="section-heading">
                <div class="section-heading__title">{{ text.groupInfo }}</div>
                <div class="section-heading__hint">{{ text.groupInfoHint }}</div>
              </div>
              <el-descriptions :column="2" border class="group-descriptions">
                <el-descriptions-item :label="text.parentAsin">{{ group.parent_asin }}</el-descriptions-item>
                <el-descriptions-item :label="text.marketplace">{{ group.marketplace }}</el-descriptions-item>
                <el-descriptions-item :label="text.brand">{{ group.brand || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="text.category">{{ group.category || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="text.remark" :span="2">{{ group.remark || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="text.updatedAt">{{ formatDateTime(group.gmt_modified) }}</el-descriptions-item>
              </el-descriptions>
            </section>

            <section class="detail-section-card">
              <div class="children-toolbar">
                <div>
                  <div class="section-heading__title">{{ text.childrenList }}</div>
                  <div class="section-heading__hint">{{ text.childrenSubtitle }}</div>
                </div>
                <el-button type="primary" @click="pickerVisible = true">{{ text.addChildren }}</el-button>
              </div>

              <el-table :data="group.children || []" border stripe>
                <el-table-column :label="text.image" width="90">
                  <template #default="{ row }">
                    <el-image
                      v-if="row.image_url"
                      :src="getFullImageUrl(row.image_url)"
                      :preview-src-list="[getFullImageUrl(row.image_url)]"
                      fit="cover"
                      style="width: 56px; height: 56px; border-radius: 6px"
                    />
                    <div v-else class="no-image">-</div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.productInfo" min-width="260">
                  <template #default="{ row }">
                    <div class="product-info-cell">
                      <div class="product-info-cell__sku">{{ row.seller_sku }}</div>
                      <div class="product-info-cell__meta">{{ row.asin || '-' }}</div>
                      <div class="product-info-cell__title">{{ row.title || '-' }}</div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.supplier" width="180">
                  <template #default="{ row }">
                    <div class="supplier-cell">
                      <div class="supplier-cell__name">{{ row.supplier_name || '-' }}</div>
                      <div class="supplier-cell__code">{{ row.supplier_code || '-' }}</div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.status" width="110" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)">
                      {{ getStatusLabel(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="text.updatedAt" width="170">
                  <template #default="{ row }">{{ formatDateTime(row.gmt_modified) }}</template>
                </el-table-column>
                <el-table-column :label="text.actions" width="120" fixed="right">
                  <template #default="{ row }">
                    <el-button type="danger" size="small" @click="handleDetach(row.id)">
                      {{ text.detach }}
                    </el-button>
                  </template>
                </el-table-column>

                <template #empty>
                  <div class="empty-state">{{ text.noChildren }}</div>
                </template>
              </el-table>
            </section>
          </div>

          <aside class="detail-side">
            <div class="side-card">
              <div class="side-card__title">{{ text.groupOverview }}</div>
              <div class="side-card__subtitle">{{ text.groupOverviewHint }}</div>
              <div class="side-metric-list">
                <div class="side-metric">
                  <span class="side-metric__label">{{ text.parentAsin }}</span>
                  <span class="side-metric__value">{{ group.parent_asin }}</span>
                </div>
                <div class="side-metric">
                  <span class="side-metric__label">{{ text.marketplace }}</span>
                  <span class="side-metric__value">{{ group.marketplace }}</span>
                </div>
                <div class="side-metric">
                  <span class="side-metric__label">{{ text.status }}</span>
                  <span class="side-metric__value">{{ getStatusLabel(group.status) }}</span>
                </div>
                <div class="side-metric">
                  <span class="side-metric__label">{{ text.brand }}</span>
                  <span class="side-metric__value">{{ group.brand || '-' }}</span>
                </div>
                <div class="side-metric">
                  <span class="side-metric__label">{{ text.updatedAt }}</span>
                  <span class="side-metric__value">{{ formatDateTime(group.gmt_modified) }}</span>
                </div>
                <div class="side-metric">
                  <span class="side-metric__label">{{ text.deleteStatus }}</span>
                  <span class="side-metric__value">{{ group.child_count > 0 ? text.notDeletable : text.deletable }}</span>
                </div>
              </div>
            </div>
            <div class="side-card side-card--muted">
              <div class="side-card__title">{{ text.groupRule }}</div>
              <div class="side-card__subtitle">{{ text.groupRuleHint }}</div>
            </div>
          </aside>
        </div>
      </template>
    </div>

    <ProductPickerDialog
      v-model="pickerVisible"
      :title="text.pickerTitle"
      :multiple="true"
      :show-inventory-columns="false"
      :product-params="pickerProductParams"
      @confirm="handleAttachChildren"
    />

    <el-dialog
      v-model="editVisible"
      :title="text.editGroup"
      width="1040px"
      destroy-on-close
      class="group-edit-dialog"
    >
      <div class="editor-main">
          <div class="editor-topbar">
            <div>
              <div class="editor-topbar__title">{{ text.editGroup }}</div>
              <div class="editor-topbar__hint">{{ text.editorHint }}</div>
            </div>
          </div>
          <div class="detail-section-card">
            <div class="section-heading">
              <div class="section-heading__title">{{ text.groupInfo }}</div>
              <div class="section-heading__hint">{{ text.editorFormHint }}</div>
            </div>
            <el-form ref="groupFormRef" :model="groupForm" :rules="groupFormRules" label-position="top">
              <div class="edit-grid">
                <el-form-item :label="text.parentAsin" prop="parent_asin">
                  <el-input v-model="groupForm.parent_asin" disabled />
                </el-form-item>
                <el-form-item :label="text.marketplace" prop="marketplace">
                  <el-input v-model="groupForm.marketplace" disabled />
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
        <el-button @click="editVisible = false">{{ text.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveParent">{{ text.save }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import ProductPickerDialog from '@/modules/product/components/ProductPickerDialog.vue'
import {
  attachProductGroupChildren,
  deleteProductGroup,
  detachProductGroupChild,
  getProductGroupDetail,
  updateProductGroup
} from '../api/groups'
import type { CreateProductGroupParams, ProductGroup, ProductSummary, ProductListParams } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const route = useRoute()
const router = useRouter()
const localeStore = useLocaleStore()

const parentId = computed(() => Number(route.params.id))
const loading = ref(false)
const saving = ref(false)
const pickerVisible = ref(false)
const editVisible = ref(false)
const group = ref<ProductGroup | null>(null)
const groupFormRef = ref<FormInstance>()

const groupForm = reactive<CreateProductGroupParams>({
  parent_asin: '',
  title: '',
  marketplace: '',
  brand: '',
  category: '',
  status: 'ACTIVE',
  image_url: '',
  remark: ''
})

const text = computed(() => {
  if (localeStore.isEnglish) {
    return {
      back: 'Back',
      pageTitle: 'Product Grouping Detail',
      pageSubtitle: 'Lightweight grouping for listing aggregation and grouped viewing. It does not affect procurement, inventory, or finance.',
      lightweightTag: 'Lightweight',
      groupInfo: 'Grouping Info',
      groupInfoHint: 'Maintain only grouping identity and archive fields here.',
      childrenList: 'Grouped Products',
      childrenSubtitle: 'This is lightweight grouping for viewing and listing aggregation. It does not affect procurement, inventory, or finance.',
      addChildren: 'Add Children',
      deleteGroup: 'Delete Grouping',
      editGroup: 'Edit Grouping',
      totalChildren: 'Total',
      activeChildren: 'Active',
      inactiveChildren: 'Inactive',
      marketplaceSummary: 'Marketplace',
      parentAsin: 'Parent ASIN',
      marketplace: 'Marketplace',
      brand: 'Brand',
      category: 'Category',
      remark: 'Remark',
      status: 'Status',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusDiscontinued: 'Discontinued',
      updatedAt: 'Updated At',
      image: 'Image',
      productInfo: 'Product Info',
      supplier: 'Supplier',
      actions: 'Actions',
      detach: 'Remove',
      noChildren: 'No children attached yet',
      pickerTitle: 'Select Children',
      groupOverview: 'Grouping Overview',
      groupOverviewHint: 'Quickly verify identity and current grouping scale.',
      groupRule: 'Grouping Rule',
      groupRuleHint: 'This grouping is for viewing and listing aggregation only. It does not change inventory or finance logic.',
      editorHint: 'Only archive fields are editable here. Grouping relationships are managed in the child list.',
      editorFormHint: 'Keep grouping identity stable. Do not treat this page as a business object editor.',
      titleColumn: 'Title',
      imageUrl: 'Image URL',
      cancel: 'Cancel',
      save: 'Save',
      warning: 'Warning',
      confirm: 'Confirm',
      required: 'Required',
      attachSuccess: 'Children attached successfully',
      detachSuccess: 'Child removed successfully',
      saveSuccess: 'Grouping updated successfully',
      deleteSuccess: 'Grouping deleted successfully',
      deleteStatus: 'Delete Status',
      deletable: 'Deletable',
      notDeletable: 'Not Deletable',
      deleteBlockedHint: 'Remove all children before deleting this grouping.'
    }
  }
  return {
    back: '返回',
    pageTitle: '产品归组详情',
    pageSubtitle: '这里只做轻量归组，用于 listing 聚合和查看，不参与采购、库存和财务运算。',
    lightweightTag: '轻量',
    groupInfo: '归组信息',
    groupInfoHint: '这里只维护归组身份和档案字段，不承载业务计算。',
    childrenList: '归组产品',
    childrenSubtitle: '这里只做轻量归组，用于查看和 listing 聚合，不影响采购、库存和财务口径。',
    addChildren: '添加子体',
    deleteGroup: '删除归组',
    editGroup: '编辑归组',
    totalChildren: '子体总数',
    activeChildren: '启用子体',
    inactiveChildren: '停用子体',
    marketplaceSummary: '站点',
    parentAsin: '父体 ASIN',
    marketplace: '站点',
    brand: '品牌',
    category: '类目',
    remark: '备注',
    status: '状态',
    statusActive: '启用',
    statusInactive: '停用',
    statusDiscontinued: '停售',
    updatedAt: '更新时间',
    image: '图片',
    productInfo: '产品信息',
    supplier: '供应商',
    actions: '操作',
    detach: '移除',
    noChildren: '当前还没有挂载子体',
    pickerTitle: '选择子体',
    groupOverview: '归组概览',
    groupOverviewHint: '这里快速核对归组身份、站点和当前挂载规模。',
    groupRule: '归组规则',
    groupRuleHint: '产品归组仅用于查看与 listing 聚合，不改变库存、采购、发货和财务逻辑。',
    editorHint: '这里只编辑归组档案字段，子体挂载请在列表区域处理。',
    editorFormHint: '保持归组身份稳定，不要把这里当成业务对象编辑页。',
    titleColumn: '标题',
    imageUrl: '图片地址',
    cancel: '取消',
    save: '保存',
    warning: '提示',
    confirm: '确认',
    required: '必填',
    attachSuccess: '子体挂载成功',
    detachSuccess: '子体移除成功',
    saveSuccess: '归组资料更新成功',
    deleteSuccess: '归组删除成功',
    deleteStatus: '删除状态',
    deletable: '可删除',
    notDeletable: '不可删除',
    deleteBlockedHint: '请先移除全部子体，再删除归组。'
  }
})

const summaryCards = computed(() => {
  if (!group.value) return []
  return [
    {
      key: 'total',
      label: text.value.totalChildren,
      value: String(group.value.child_count ?? group.value.children?.length ?? 0),
      hint: text.value.childrenSubtitle
    },
    {
      key: 'active',
      label: text.value.activeChildren,
      value: String(group.value.active_child_count ?? 0),
      hint: text.value.statusActive
    },
    {
      key: 'inactive',
      label: text.value.inactiveChildren,
      value: String(group.value.inactive_child_count ?? 0),
      hint: text.value.statusInactive
    },
    {
      key: 'marketplace',
      label: text.value.marketplaceSummary,
      value: group.value.marketplace || '-',
      hint: group.value.parent_asin || '-'
    }
  ]
})

const groupFormRules = computed<FormRules>(() => ({
  title: [{ required: true, message: text.value.required, trigger: 'blur' }],
  status: [{ required: true, message: text.value.required, trigger: 'change' }]
}))

const pickerProductParams = computed<Partial<ProductListParams>>(() => ({
  marketplace: group.value?.marketplace,
  only_parentless: true
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

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const getFullImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url}`
}

const syncGroupForm = () => {
  if (!group.value) return
  Object.assign(groupForm, {
    parent_asin: group.value.parent_asin,
    title: group.value.title,
    marketplace: group.value.marketplace,
    brand: group.value.brand || '',
    category: group.value.category || '',
    status: group.value.status,
    image_url: group.value.image_url || '',
    remark: group.value.remark || ''
  })
}

const loadDetail = async () => {
  if (!parentId.value) return
  loading.value = true
  try {
    const res = await getProductGroupDetail(parentId.value)
    group.value = res.data || null
    syncGroupForm()
  } finally {
    loading.value = false
  }
}

const handleAttachChildren = async (products: ProductSummary[]) => {
  if (!group.value || products.length === 0) return
  await attachProductGroupChildren(group.value.id, {
    child_ids: products.map(item => item.id)
  })
  ElMessage.success(text.value.attachSuccess)
  await loadDetail()
}

const handleDetach = async (childId: number) => {
  if (!group.value) return
  try {
    await ElMessageBox.confirm(
      localeStore.isEnglish ? 'Remove this child from the grouping?' : '确认从归组中移除这个子体？',
      text.value.warning,
      {
        confirmButtonText: text.value.confirm,
        cancelButtonText: text.value.cancel,
        type: 'warning'
      }
    )
    await detachProductGroupChild(group.value.id, childId)
    ElMessage.success(text.value.detachSuccess)
    await loadDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Detach product group child failed:', error)
    }
  }
}

const handleDeleteGroup = async () => {
  if (!group.value) return
  if ((group.value.child_count ?? 0) > 0) {
    ElMessage.warning(text.value.deleteBlockedHint)
    return
  }
  await ElMessageBox.confirm(
    localeStore.isEnglish ? `Are you sure to delete grouping ${group.value.parent_asin}?` : `确认删除归组 ${group.value.parent_asin}？`,
    text.value.warning,
    { type: 'warning', confirmButtonText: text.value.confirm, cancelButtonText: text.value.cancel }
  )
  await deleteProductGroup(group.value.id)
  ElMessage.success(text.value.deleteSuccess)
  router.push('/product/groups')
}

const handleOpenEdit = () => {
  syncGroupForm()
  editVisible.value = true
}

const handleSaveParent = async () => {
  if (!group.value || !groupFormRef.value) return
  const valid = await groupFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    await updateProductGroup(group.value.id, {
      parent_asin: groupForm.parent_asin,
      title: groupForm.title,
      marketplace: groupForm.marketplace,
      brand: groupForm.brand || undefined,
      category: groupForm.category || undefined,
      status: groupForm.status,
      image_url: groupForm.image_url || undefined,
      remark: groupForm.remark || undefined
    })
    ElMessage.success(text.value.saveSuccess)
    editVisible.value = false
    await loadDetail()
  } finally {
    saving.value = false
  }
}

const handleBack = () => {
  router.push({ name: 'product-groups' })
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
@import "../styles/workbench.css";

.product-group-detail {
  display: grid;
  gap: 16px;
}

.detail-content {
  min-height: 320px;
}

.detail-hero {
  padding: 18px 20px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.detail-hero__title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.detail-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  font-size: 13px;
  color: #475569;
}

.detail-layout {
  grid-template-columns: minmax(0, 1fr) 300px;
}

.detail-main {
  display: grid;
  gap: 16px;
}

.detail-side,
.editor-side {
  display: grid;
  gap: 16px;
}

.section-heading {
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
}

.section-heading__title,
.editor-topbar__title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.section-heading__hint,
.editor-topbar__hint {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.group-descriptions :deep(.el-descriptions__label) {
  width: 110px;
}

.children-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.product-info-cell {
  display: grid;
  gap: 4px;
}

.product-info-cell__sku {
  font-weight: 700;
  color: #0f172a;
}

.product-info-cell__meta,
.supplier-cell__code {
  font-size: 12px;
  color: #64748b;
}

.product-info-cell__title,
.supplier-cell__name {
  font-size: 13px;
  color: #475569;
}

.side-metric-list {
  display: grid;
  gap: 12px;
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

.no-image,
.empty-state {
  color: #94a3b8;
  font-size: 12px;
}

.editor-layout {
  grid-template-columns: minmax(0, 1fr) 300px;
}

.editor-main {
  display: grid;
  gap: 16px;
}

.editor-topbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.edit-grid .span-full {
  grid-column: 1 / -1;
}

@media (max-width: 1080px) {
  .detail-layout,
  .editor-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .children-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
