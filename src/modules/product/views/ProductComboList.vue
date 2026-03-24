<template>
  <div class="product-combo-list">
    <div class="page-header">
      <div class="page-header__content">
        <div class="page-header__title-row">
          <h2 class="page-title">{{ text.comboTitle }}</h2>
          <el-tag type="success" effect="plain" size="small">{{ text.bundleTag }}</el-tag>
        </div>
        <p class="page-description">{{ text.comboSubtitle }}</p>
      </div>
      <div class="page-header__actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          {{ text.createCombo }}
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="workspace-card">
      <div class="workspace-toolbar">
        <div class="workspace-toolbar__intro">
          <div class="workspace-toolbar__title">{{ text.archiveTitle }}</div>
          <div class="workspace-toolbar__meta">{{ text.currentPageRecords.replace('{count}', String(comboList.length)) }}</div>
        </div>
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item :label="text.keyword">
            <el-input v-model="searchForm.keyword" :placeholder="text.keywordPlaceholder" clearable style="width: 280px" @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item :label="text.marketplace">
            <el-select v-model="searchForm.marketplace" clearable style="width: 140px">
              <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item :label="text.salesStatus">
            <el-select v-model="searchForm.statuses" multiple collapse-tags collapse-tags-tooltip clearable style="width: 220px">
              <el-option v-for="item in salesStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="text.lockedFilter">
            <el-select v-model="searchForm.locked" clearable style="width: 140px">
              <el-option :label="text.lockedAll" value="" />
              <el-option :label="text.locked" value="true" />
              <el-option :label="text.editable" value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">{{ text.search }}</el-button>
            <el-button @click="handleReset">{{ text.reset }}</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="comboList" v-loading="loading" border stripe empty-text="暂无组合数据">
        <el-table-column :label="text.mainProduct" min-width="340">
          <template #default="{ row }">
            <div class="product-cell">
              <el-image class="product-cell__image" :src="row.main_product?.image_url || ''" fit="cover">
                <template #error><div class="image-empty">{{ text.noImage }}</div></template>
              </el-image>
              <div class="product-cell__content">
                <div class="product-cell__topline">
                  <el-tag type="success" size="small">{{ text.main }}</el-tag>
                  <span class="product-cell__sku">{{ row.main_product?.seller_sku || '-' }}</span>
                  <el-tag :type="statusTagType(row.main_product?.status)" size="small">{{ getStatusLabel(row.main_product?.status) }}</el-tag>
                </div>
                <div class="product-cell__title">{{ row.main_product?.title || '-' }}</div>
                <div class="product-cell__meta">
                  <span>{{ row.main_product?.marketplace || '-' }}</span>
                  <span>{{ text.childCountShort.replace('{count}', String(row.products?.length ?? 0)) }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="text.childrenStructure" min-width="420">
          <template #default="{ row }">
            <div v-if="row.products?.length" class="children-list">
              <div v-for="child in row.products" :key="child.id" class="child-pill">
                <el-image class="child-pill__image" :src="child.image_url || ''" fit="cover">
                  <template #error><div class="image-empty">{{ text.noImageShort }}</div></template>
                </el-image>
                <div class="child-pill__content">
                  <div class="child-pill__sku">{{ child.seller_sku }}</div>
                  <div class="child-pill__title">{{ child.title }}</div>
                </div>
                <div class="child-pill__ratio">x{{ child.qty_ratio }}</div>
              </div>
            </div>
            <div v-else class="empty-hint">{{ text.noChildren }}</div>
          </template>
        </el-table-column>

        <el-table-column :label="text.status" width="200">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag v-if="row.locked" type="danger">{{ text.locked }}</el-tag>
              <el-tag v-else type="success">{{ text.editable }}</el-tag>
              <div class="status-cell__hint">{{ row.lock_reason || (row.locked ? text.lockedHint : text.editableHint) }}</div>
              <div class="status-cell__delete">{{ row.locked ? text.notDeletable : text.deletable }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="text.actions" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-bar">
              <el-button size="small" @click="handleView(row)">{{ text.view }}</el-button>
              <el-button size="small" type="primary" :disabled="row.locked" @click="handleEdit(row)">{{ text.edit }}</el-button>
              <el-dropdown trigger="click">
                <el-button size="small">{{ text.more }}</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-tooltip :disabled="!row.locked" :content="row.lock_reason || text.lockedHint" placement="left">
                      <div>
                        <el-dropdown-item :disabled="row.locked" @click="handleDelete(row)">{{ text.delete }}</el-dropdown-item>
                      </div>
                    </el-tooltip>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.page_size" :page-sizes="[10, 20, 50]" :total="pagination.total" layout="total, sizes, prev, pager, next, jumper" @size-change="loadComboList" @current-change="loadComboList" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1160px" destroy-on-close>
      <div class="editor-main">
          <div class="editor-topbar">
            <div class="editor-topbar__title">{{ dialogTitle }}</div>
            <div class="editor-topbar__hint">{{ text.editorHint }}</div>
          </div>
          <el-form ref="comboFormRef" :model="comboForm" :rules="comboFormRules" label-position="top" class="editor-form">
            <div class="section-card">
              <div class="section-heading">
                <div class="section-heading__title">{{ text.mainProduct }}</div>
                <div class="section-heading__hint">{{ text.mainPickerHint }}</div>
              </div>
              <el-form-item prop="main_product_id">
                <div class="picker-entry">
                  <el-button type="primary" plain @click="openMainPicker">{{ text.selectMain }}</el-button>
                  <span class="picker-entry__hint">{{ text.mainPickerActionHint }}</span>
                </div>
              </el-form-item>
              <div v-if="selectedMainProduct" class="selected-card">
                <el-image class="selected-card__image" :src="selectedMainProduct.image_url || ''" fit="cover">
                  <template #error><div class="image-empty">{{ text.noImage }}</div></template>
                </el-image>
                <div class="selected-card__content">
                  <div class="product-cell__topline">
                    <el-tag type="success" size="small">{{ text.main }}</el-tag>
                    <span class="product-cell__sku">{{ selectedMainProduct.seller_sku }}</span>
                  </div>
                  <div class="product-cell__title">{{ selectedMainProduct.title }}</div>
                </div>
              </div>
              <div v-else class="empty-hint empty-hint--block">{{ text.selectMainFirst }}</div>
            </div>
            <div class="section-card">
              <div class="section-heading section-heading--spread">
                <div>
                  <div class="section-heading__title">{{ text.childProducts }}</div>
                  <div class="section-heading__hint">{{ text.childProductsDesc }}</div>
                </div>
                <div class="section-metrics">
                  <span>{{ text.childCount.replace('{count}', String(comboForm.children.length)) }}</span>
                  <span>{{ text.totalRatio.replace('{count}', String(totalChildRatio)) }}</span>
                </div>
              </div>
              <el-form-item>
                <div class="picker-entry">
                  <el-button type="primary" plain @click="openChildPicker">{{ text.addChild }}</el-button>
                  <span class="picker-entry__hint">{{ text.childPickerHint }}</span>
                </div>
              </el-form-item>
              <div v-if="comboForm.children.length" class="child-editor">
                <div v-for="(child, index) in comboForm.children" :key="child.product_id" class="child-editor__row">
                  <div class="child-editor__index">{{ index + 1 }}</div>
                  <div class="child-editor__product">
                    <el-image class="child-editor__image" :src="getProductById(child.product_id)?.image_url || ''" fit="cover">
                      <template #error><div class="image-empty">{{ text.noImageShort }}</div></template>
                    </el-image>
                    <div>
                      <div class="child-pill__sku">{{ getProductById(child.product_id)?.seller_sku || child.product_id }}</div>
                      <div class="child-pill__title">{{ getProductById(child.product_id)?.title || '-' }}</div>
                    </div>
                  </div>
                  <div class="child-editor__ratio">
                    <span>{{ text.qtyRatio }}</span>
                    <el-input-number v-model="child.qty_ratio" :min="1" :step="1" controls-position="right" />
                  </div>
                  <el-button text type="danger" @click="removeChild(child.product_id)">{{ text.remove }}</el-button>
                </div>
              </div>
              <div v-else class="empty-hint empty-hint--block">{{ text.childEmptyHint }}</div>
            </div>
          </el-form>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ text.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ text.save }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" :title="text.detailTitle" width="980px" destroy-on-close>
      <div v-if="currentCombo" class="detail-layout">
        <div class="detail-main">
          <div class="detail-hero">
            <el-image class="detail-hero__image" :src="currentCombo.main_product.image_url || ''" fit="cover">
              <template #error><div class="image-empty">{{ text.noImage }}</div></template>
            </el-image>
            <div class="detail-hero__content">
              <div class="product-cell__topline">
                <el-tag type="success" size="small">{{ text.main }}</el-tag>
                <span class="product-cell__sku">{{ currentCombo.main_product.seller_sku }}</span>
              </div>
              <div class="product-cell__title">{{ currentCombo.main_product.title }}</div>
              <div class="product-cell__meta">
                <span>{{ currentCombo.main_product.marketplace || '-' }}</span>
                <span>{{ text.childCountShort.replace('{count}', String(currentCombo.products.length)) }}</span>
              </div>
            </div>
          </div>

          <div class="summary-grid summary-grid--detail">
            <el-card v-for="card in detailSummaryCards" :key="card.key" shadow="hover" class="summary-card">
              <div class="summary-card__label">{{ card.label }}</div>
              <div class="summary-card__value">{{ card.value }}</div>
              <div class="summary-card__hint">{{ card.hint }}</div>
            </el-card>
          </div>

          <div class="section-card">
            <div class="section-heading">
              <div class="section-heading__title">{{ text.childrenStructure }}</div>
              <div class="section-heading__hint">{{ text.detailChildrenHint }}</div>
            </div>
            <div class="children-list">
              <div v-for="child in currentCombo.products" :key="child.id" class="child-pill">
                <el-image class="child-pill__image" :src="child.image_url || ''" fit="cover">
                  <template #error><div class="image-empty">{{ text.noImageShort }}</div></template>
                </el-image>
                <div class="child-pill__content">
                  <div class="child-pill__sku">{{ child.seller_sku }}</div>
                  <div class="child-pill__title">{{ child.title }}</div>
                </div>
                <div class="child-pill__ratio">x{{ child.qty_ratio }}</div>
              </div>
            </div>
          </div>
        </div>

        <aside class="detail-side">
          <div class="side-card">
            <div class="side-card__title">{{ text.comboOverview }}</div>
            <div class="side-card__subtitle">{{ text.comboOverviewHint }}</div>
            <div class="side-metric-list">
              <div class="side-metric"><span>{{ text.status }}</span><strong>{{ currentCombo.locked ? text.locked : text.editable }}</strong></div>
              <div class="side-metric"><span>{{ text.deleteStatus }}</span><strong>{{ currentCombo.locked ? text.notDeletable : text.deletable }}</strong></div>
              <div class="side-metric"><span>{{ text.childCountLabel }}</span><strong>{{ currentCombo.products.length }}</strong></div>
              <div class="side-metric"><span>{{ text.totalRatioLabel }}</span><strong>{{ detailTotalRatio }}</strong></div>
              <div class="side-metric"><span>{{ text.marketplace }}</span><strong>{{ currentCombo.main_product.marketplace || '-' }}</strong></div>
            </div>
          </div>
          <div class="side-card side-card--muted">
            <div class="side-card__title">{{ text.ruleTitle }}</div>
            <div class="side-card__subtitle">{{ text.ruleHint }}</div>
          </div>
        </aside>
      </div>
    </el-dialog>

    <ProductPickerDialog v-model="mainPickerVisible" :title="text.mainPickerTitle" :multiple="false" :show-inventory-columns="false" :selected="comboForm.main_product_id ? [comboForm.main_product_id] : []" :product-params="{ only_standalone: !isEdit }" :selectable="isMainSelectable" @confirm="handleMainPicked" />
    <ProductPickerDialog v-model="childPickerVisible" :title="text.childPickerTitle" :multiple="true" :show-inventory-columns="false" :selected="selectedChildIds" :product-params="{ only_standalone: !isEdit }" :selectable="isChildSelectable" @confirm="handleChildrenPicked" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createProductCombo, deleteProductCombo, getProductComboDetail, getProductComboList, updateProductCombo } from '../api/combos'
import type { ProductCombo, ProductComboChild, ProductSummary } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import ProductPickerDialog from '../components/ProductPickerDialog.vue'

const comboList = ref<ProductCombo[]>([])
const loading = ref(false)
const saving = ref(false)
const localeStore = useLocaleStore()
const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']
const salesStatusOptions = computed(() => localeStore.isEnglish ? [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ON_SALE', label: 'On Sale' },
  { value: 'REPLENISHING', label: 'Replenishing' },
  { value: 'OFF_SHELF', label: 'Off Shelf' }
] : [
  { value: 'DRAFT', label: '草稿' },
  { value: 'ON_SALE', label: '正常销售' },
  { value: 'REPLENISHING', label: '补货中' },
  { value: 'OFF_SHELF', label: '下架' }
])
const pagination = reactive({ page: 1, page_size: 20, total: 0 })
const searchForm = reactive({ keyword: '', marketplace: '', statuses: [] as string[], locked: '' })
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingComboId = ref(0)
const comboFormRef = ref<FormInstance>()
const mainPickerVisible = ref(false)
const childPickerVisible = ref(false)
const detailVisible = ref(false)
const currentCombo = ref<ProductCombo | null>(null)
const productOptions = ref<ProductSummary[]>([])
const comboForm = reactive({ main_product_id: 0, children: [] as Array<{ product_id: number; qty_ratio: number }> })

const text = computed(() => localeStore.isEnglish ? {
  comboTitle: 'Product Combo', bundleTag: 'Bundle', comboSubtitle: 'Manage the structure between main product and child product ratios.', archiveTitle: 'Combo Archive', currentPageRecords: '{count} combo records on this page', keyword: 'Keyword', keywordPlaceholder: 'Search by main product code or title', marketplace: 'Marketplace', salesStatus: 'Sales Status', search: 'Search', reset: 'Reset', createCombo: 'Create Combo', mainProduct: 'Main Product', childProducts: 'Child Products', childProductsDesc: 'Select standalone products and define quantity ratios.', mainPickerHint: 'Choose one standalone product as the combo owner.', mainPickerActionHint: 'Only non-combo products are selectable.', childPickerHint: 'Choose one or more standalone products as child items.', mainPickerTitle: 'Select Main Product', childPickerTitle: 'Add Child Products', childrenStructure: 'Combo Structure', detailTitle: 'Combo Details', status: 'Status', locked: 'Locked', lockedHint: 'This combo is referenced by business data and cannot be edited.', editable: 'Editable', editableHint: 'This combo can still be maintained.', deleteStatus: 'Delete Status', deletable: 'Deletable', notDeletable: 'Not Deletable', lockedFilter: 'Edit State', lockedAll: 'All', actions: 'Actions', view: 'View', edit: 'Edit', delete: 'Delete', more: 'More', main: 'Main', qtyRatio: 'Qty Ratio', save: 'Save', cancel: 'Cancel', remove: 'Remove', noChildren: 'No child products', childEmptyHint: 'Add child products before saving this combo.', structurePreview: 'Structure Preview', structurePreviewHint: 'Review the final bundle structure before saving.', comboOverview: 'Combo Overview', comboOverviewHint: 'Keep the combo owner and child ratios coherent.', childCount: '{count} child products', childCountShort: '{count} children', totalRatio: 'Total ratio {count}', childCountLabel: 'Child Count', totalRatioLabel: 'Total Ratio', selectMainFirst: 'Select a main product first', noImage: 'No Image', noImageShort: 'N/A', createdSuccess: 'Combo created successfully', updatedSuccess: 'Combo updated successfully', deletedSuccess: 'Combo deleted successfully', warning: 'Warning', confirm: 'Confirm', editorHint: 'Define the combo owner first, then add child products and ratios.', detailChildrenHint: 'Review all child products and quantity ratios under this combo.', ruleTitle: 'Maintenance Rule', ruleHint: 'Combo structure affects purchasing and assembly expansion. Keep it stable once used.'
} : {
  comboTitle: '产品组合', bundleTag: '组合', comboSubtitle: '管理主产品与子产品的结构关系和配比，供采购展开和组装使用。', archiveTitle: '组合档案', currentPageRecords: '当前页组合 {count} 条', keyword: '关键词', keywordPlaceholder: '搜索组合主产品编码或标题', marketplace: '站点', salesStatus: '销售状态', search: '查询', reset: '重置', createCombo: '新增组合', mainProduct: '主产品', childProducts: '子产品', childProductsDesc: '选择非组合产品，并定义每个子产品的配比数量。', mainPickerHint: '从非组合产品中选择 1 个主产品。', mainPickerActionHint: '主产品一经确定，子产品不能重复选中。', childPickerHint: '从非组合产品中选择多个子产品。', mainPickerTitle: '选择主产品', childPickerTitle: '添加子产品', childrenStructure: '组合结构', detailTitle: '组合详情', status: '状态', locked: '已锁定', lockedHint: '组合已进入业务流转，结构不可改。', editable: '可编辑', editableHint: '当前组合仍可维护。', deleteStatus: '删除状态', deletable: '可删除', notDeletable: '不可删除', lockedFilter: '编辑状态', lockedAll: '全部', actions: '操作', view: '查看详情', edit: '编辑', delete: '删除', more: '更多', main: '主', qtyRatio: '配比数量', save: '保存', cancel: '取消', remove: '移除', noChildren: '暂无子产品', childEmptyHint: '请先添加子产品，再保存组合。', structurePreview: '结构预览', structurePreviewHint: '保存前再次确认组合层级和配比。', comboOverview: '组合概览', comboOverviewHint: '组合结构会影响采购展开和组装耗料。', childCount: '子产品 {count} 个', childCountShort: '{count} 个子产品', totalRatio: '总配比 {count}', childCountLabel: '子产品数', totalRatioLabel: '总配比', selectMainFirst: '请先选择主产品', noImage: '暂无图片', noImageShort: '无图', createdSuccess: '组合创建成功', updatedSuccess: '组合更新成功', deletedSuccess: '组合删除成功', warning: '提示', confirm: '确认', editorHint: '先确定主产品，再补齐子产品和配比。组合结构应尽量稳定。', detailChildrenHint: '这里展示该组合下的全部子产品和配比关系。', ruleTitle: '维护规则', ruleHint: '组合主产品负责承接展示，子产品负责结构展开。不要把它当父体档案使用。'
})

const dialogTitle = computed(() => (isEdit.value ? text.value.edit : text.value.createCombo))
const selectedMainProduct = computed(() => getProductById(comboForm.main_product_id))
const totalChildRatio = computed(() => comboForm.children.reduce((sum, item) => sum + (item.qty_ratio || 0), 0))
const detailTotalRatio = computed(() => (currentCombo.value?.products || []).reduce((sum, item) => sum + (item.qty_ratio || 0), 0))

const selectedChildIds = computed({
  get: () => comboForm.children.map((item) => item.product_id),
  set: (ids: number[]) => {
    const uniqueIds = Array.from(new Set(ids)).filter((id) => id !== comboForm.main_product_id)
    comboForm.children = uniqueIds.map((id) => {
      const existing = comboForm.children.find((child) => child.product_id === id)
      return { product_id: id, qty_ratio: existing?.qty_ratio || 1 }
    })
  }
})

const detailSummaryCards = computed(() => {
  const combo = currentCombo.value
  if (!combo) return []
  return [
    { key: 'children', label: text.value.childCountLabel, value: combo.products.length, hint: text.value.childrenStructure },
    { key: 'ratio', label: text.value.totalRatioLabel, value: detailTotalRatio.value, hint: text.value.structurePreview },
    { key: 'status', label: text.value.status, value: combo.locked ? text.value.locked : text.value.editable, hint: combo.locked ? text.value.lockedHint : text.value.editableHint },
    { key: 'marketplace', label: text.value.marketplace, value: combo.main_product.marketplace || '-', hint: combo.main_product.seller_sku || '-' }
  ]
})

const comboFormRules = computed<FormRules>(() => ({ main_product_id: [{ required: true, message: text.value.mainPickerHint, trigger: 'change' }] }))

const syncProductOptions = (items: ProductSummary[]) => {
  const map = new Map<number, ProductSummary>()
  productOptions.value.forEach((item) => map.set(item.id, item))
  items.forEach((item) => map.set(item.id, item))
  productOptions.value = Array.from(map.values())
}

const getProductById = (productId: number) => productOptions.value.find((item) => item.id === productId)

const loadComboList = async () => {
  loading.value = true
  try {
    const res = await getProductComboList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      marketplace: searchForm.marketplace || undefined,
      statuses: searchForm.statuses.length ? searchForm.statuses : undefined,
      locked: searchForm.locked || undefined
    })
    if (res.success) {
      comboList.value = res.data.data
      pagination.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => { pagination.page = 1; await loadComboList() }
const handleReset = async () => { searchForm.keyword = ''; searchForm.marketplace = ''; searchForm.statuses = []; searchForm.locked = ''; pagination.page = 1; await loadComboList() }
const resetForm = () => { comboForm.main_product_id = 0; comboForm.children = [] }
const handleCreate = () => { isEdit.value = false; editingComboId.value = 0; resetForm(); dialogVisible.value = true }

const getStatusLabel = (status?: string) => salesStatusOptions.value.find((item) => item.value === status)?.label || status || '-'

const statusTagType = (status?: string) => {
  const map: Record<string, string> = {
    DRAFT: 'info',
    ON_SALE: 'success',
    REPLENISHING: 'warning',
    OFF_SHELF: 'danger'
  }
  return map[status || ''] || 'info'
}

const handleEdit = async (row: ProductCombo) => {
  if (row.locked) return
  isEdit.value = true
  editingComboId.value = row.combo_id
  const res = await getProductComboDetail(row.combo_id)
  if (res.success) {
    syncProductOptions([res.data.main_product, ...res.data.products])
    comboForm.main_product_id = res.data.main_product.id
    comboForm.children = res.data.products.map((item: ProductComboChild) => ({ product_id: item.id, qty_ratio: item.qty_ratio || 1 }))
    dialogVisible.value = true
  }
}

const handleView = async (row: ProductCombo) => {
  const res = await getProductComboDetail(row.combo_id)
  if (res.success) { currentCombo.value = res.data; detailVisible.value = true }
}

const handleDelete = async (row: ProductCombo) => {
  if (row.locked) {
    ElMessage.warning(row.lock_reason || text.value.lockedHint)
    return
  }
  try {
    await ElMessageBox.confirm(localeStore.isEnglish ? `Are you sure to delete combo "${row.main_product?.seller_sku}"?` : `确认删除组合 "${row.main_product?.seller_sku}"？`, text.value.warning, { confirmButtonText: text.value.confirm, cancelButtonText: text.value.cancel, type: 'warning' })
    await deleteProductCombo(row.combo_id)
    ElMessage.success(text.value.deletedSuccess)
    await loadComboList()
  } catch (error) {
    if (error !== 'cancel') console.error('Delete combo failed:', error)
  }
}

const openMainPicker = () => { mainPickerVisible.value = true }
const openChildPicker = () => { childPickerVisible.value = true }
const handleMainChange = (value: number) => { comboForm.children = comboForm.children.filter((item) => item.product_id !== value) }
const handleMainPicked = (products: ProductSummary[]) => {
  const [selected] = products
  if (!selected) return
  syncProductOptions([selected])
  comboForm.main_product_id = selected.id
  handleMainChange(selected.id)
}
const handleChildrenPicked = (products: ProductSummary[]) => { syncProductOptions(products); selectedChildIds.value = products.map((item) => item.id) }
const removeChild = (productId: number) => { comboForm.children = comboForm.children.filter((item) => item.product_id !== productId) }

const handleSave = async () => {
  if (!comboFormRef.value) return
  try {
    await comboFormRef.value.validate()
    if (!comboForm.children.length) { ElMessage.warning(text.value.childEmptyHint); return }
    saving.value = true
    const payload = { main_product_id: comboForm.main_product_id, children: comboForm.children.map((item) => ({ product_id: item.product_id, qty_ratio: item.qty_ratio || 1 })) }
    if (isEdit.value) {
      await updateProductCombo(editingComboId.value, payload)
      ElMessage.success(text.value.updatedSuccess)
    } else {
      await createProductCombo(payload)
      ElMessage.success(text.value.createdSuccess)
    }
    dialogVisible.value = false
    await loadComboList()
  } finally {
    saving.value = false
  }
}

const isMainSelectable = (product: ProductSummary) => {
  if (selectedChildIds.value.includes(product.id)) return false
  if (!product.combo_id) return true
  return isEdit.value && product.combo_id === editingComboId.value
}
const isChildSelectable = (product: ProductSummary) => {
  if (product.id === comboForm.main_product_id) return false
  if (!product.combo_id) return true
  return isEdit.value && product.combo_id === editingComboId.value
}

onMounted(() => { loadComboList() })
</script>

<style scoped>
@import "../styles/workbench.css";

.product-combo-list { display: flex; flex-direction: column; gap: 16px; }
.page-description, .section-heading__hint, .status-cell__hint, .picker-entry__hint, .empty-hint { color: #667085; font-size: 13px; line-height: 1.5; }
.status-cell__delete { margin-top: 6px; color: #98a2b3; font-size: 12px; }
.summary-card__label { color: #667085; font-size: 13px; }
.summary-card__value { margin-top: 8px; font-size: 26px; font-weight: 700; color: #111827; }
.section-heading__title, .editor-topbar__title { font-size: 16px; font-weight: 700; color: #111827; }
.pagination { margin-top: 18px; display: flex; justify-content: flex-end; }
.product-cell, .selected-card, .detail-hero, .child-editor__product { display: flex; align-items: center; gap: 14px; }
.product-cell__content, .selected-card__content, .detail-hero__content, .child-pill__content { min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.product-cell__topline { display: flex; gap: 8px; align-items: center; }
.product-cell__sku, .child-pill__sku { font-size: 14px; font-weight: 700; color: #1f2937; }
.product-cell__title, .child-pill__title { color: #667085; font-size: 13px; line-height: 1.5; }
.product-cell__meta { display: flex; gap: 12px; flex-wrap: wrap; color: #98a2b3; font-size: 12px; }
.product-cell__image, .selected-card__image, .detail-hero__image, .child-pill__image, .child-editor__image { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; background: #f2f4f7; border: 1px solid #e4e7ec; }
.image-empty { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #98a2b3; font-size: 12px; }
.children-list, .child-editor, .side-metric-list, .preview-list { display: flex; flex-direction: column; gap: 10px; }
.child-pill { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid #e4e7ec; border-radius: 14px; background: #f8fafc; }
.child-pill__ratio { min-width: 58px; text-align: right; font-weight: 700; color: #166534; }
.status-cell { display: flex; flex-direction: column; gap: 8px; }
.action-bar { display: flex; gap: 8px; align-items: center; }
.editor-layout, .detail-layout { grid-template-columns: minmax(0, 1.55fr) 340px; }
.editor-form { display: flex; flex-direction: column; gap: 18px; }
.section-heading { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.section-heading--spread { flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 12px; }
.section-metrics { display: flex; gap: 12px; flex-wrap: wrap; color: #475467; font-size: 12px; }
.picker-entry { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.side-metric { display: flex; justify-content: space-between; gap: 12px; }
.preview-main { margin-top: 14px; padding: 12px; border-radius: 14px; border: 1px solid #e4e7ec; background: #fff; }
.preview-main__sku { font-weight: 700; color: #111827; }
.preview-main__title { margin-top: 4px; color: #667085; font-size: 13px; }
.preview-item { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 12px; background: #fff; border: 1px solid #e4e7ec; }
.child-editor__row { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto auto; gap: 14px; align-items: center; padding: 12px 14px; border: 1px solid #e4e7ec; border-radius: 16px; background: #fff; }
.child-editor__index { width: 32px; height: 32px; border-radius: 50%; background: #ecfdf3; color: #166534; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.child-editor__ratio { display: flex; gap: 10px; align-items: center; white-space: nowrap; color: #475467; }
.empty-hint--block { padding: 12px 0; }
@media (max-width: 900px) { .section-heading--spread { flex-direction: column; align-items: stretch; } .child-pill, .child-editor__row { grid-template-columns: 1fr; } .child-pill__ratio, .child-editor__ratio { text-align: left; justify-content: flex-start; } .action-bar { flex-wrap: wrap; } }
</style>
