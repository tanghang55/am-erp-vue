<template>
  <div class="product-config-page">
    <div class="page-header">
      <div class="page-header__content">
        <div class="page-header__title-row">
          <h2 class="page-title">产品配置</h2>
          <el-tag type="info" effect="plain" size="small">主档</el-tag>
        </div>
        <p class="page-description">品牌、尺寸单位、重量单位走平级主档；销售状态维护固定状态集的名称、排序和启停；品类独立成三级树，支持手动维护一级、二级、三级节点。</p>
      </div>
      <div class="page-header__actions">
        <el-button v-if="activeSection === 'CATEGORY'" type="primary" @click="handleCreateRootCategory">
          <el-icon><Plus /></el-icon>
          新增一级品类
        </el-button>
        <el-button v-else-if="activeSection !== 'SALES_STATUS'" type="primary" @click="handleCreateConfig">
          <el-icon><Plus /></el-icon>
          新增配置
        </el-button>
      </div>
    </div>

    <el-card class="workspace-card">
      <div class="workspace-shell">
        <aside class="section-nav">
          <div class="section-nav__title">配置导航</div>
          <button
            v-for="section in sections"
            :key="section.value"
            type="button"
            class="section-nav__item"
            :class="{ 'section-nav__item--active': activeSection === section.value }"
            @click="activeSection = section.value"
          >
            <span class="section-nav__name">{{ section.label }}</span>
            <span class="section-nav__meta">
              {{ section.value === 'CATEGORY' ? `${categoryCount} 个节点` : `${configCountMap[section.value] || 0} 条` }}
            </span>
          </button>
        </aside>
        <div class="workspace-content">
          <div class="workspace-toolbar">
            <div class="workspace-toolbar__intro">
              <div class="workspace-toolbar__title">配置工作台</div>
              <div class="workspace-toolbar__meta">{{ activeSection === 'CATEGORY' ? `当前共有 ${categoryCount} 个品类节点` : `当前类型共 ${filteredConfigCount} 条配置` }}</div>
            </div>
            <el-form :inline="true" class="search-form">
              <el-form-item v-if="activeSection !== 'CATEGORY'" label="关键词">
                <el-input v-model="keyword" clearable placeholder="编码 / 名称" style="width: 240px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="reloadCurrent">刷新</el-button>
              </el-form-item>
            </el-form>
          </div>

          <ProductCategoryWorkspace
            v-if="activeSection === 'CATEGORY'"
            :category-tree="categoryTree"
            :loading="categoryLoading"
            :format-date-time="formatDateTime"
            @create-child="handleCreateCategory"
            @edit="handleEditCategory"
            @view="handleViewCategory"
            @delete="handleDeleteCategory"
          />

          <ProductConfigItemsWorkspace
            v-else
            :items="displayConfigItems"
            :loading="configLoading"
            :format-date-time="formatDateTime"
            @view="handleViewConfig"
            @edit="handleEditConfig"
            @delete="handleDeleteConfig"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="configDialogVisible" :title="configDialogTitle" width="900px" class="product-config-dialog">
      <div class="editor-main">
          <div class="form-section">
            <div class="section-heading">
              <div class="section-heading__title">配置表单</div>
              <div class="section-heading__hint">{{ activeSection === 'SALES_STATUS' ? '销售状态使用固定状态集，只维护名称、排序和启停；不支持新增、删除、修改编码。' : '品牌、尺寸单位、重量单位继续用平级主档，不在产品页手输自由文本。' }}</div>
            </div>
            <el-form ref="configFormRef" :model="configForm" :rules="configFormRules" label-position="top" class="config-form">
              <div class="form-grid">
                <el-form-item label="配置类型" prop="config_type">
                  <el-select v-model="configForm.config_type" :disabled="configIsEdit" style="width: 100%">
                    <el-option v-for="section in flatSections" :key="section.value" :label="section.label" :value="section.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                  <el-select v-model="configForm.status" style="width: 100%">
                    <el-option label="启用" value="ACTIVE" />
                    <el-option label="停用" value="INACTIVE" />
                  </el-select>
                </el-form-item>
                <el-form-item label="编码" prop="item_code">
                  <el-input v-model="configForm.item_code" :disabled="configForm.config_type === 'SALES_STATUS'" />
                </el-form-item>
                <el-form-item label="名称" prop="item_name">
                  <el-input v-model="configForm.item_name" />
                </el-form-item>
                <el-form-item label="排序" prop="sort">
                  <el-input-number v-model="configForm.sort" :min="0" style="width: 100%" />
                </el-form-item>
                <el-form-item label="备注" class="span-full">
                  <el-input v-model="configForm.remark" type="textarea" :rows="3" />
                </el-form-item>
              </div>
            </el-form>
          </div>
      </div>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveConfig">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryDialogVisible" :title="categoryDialogTitle" width="920px" class="product-config-dialog">
      <div class="editor-main">
          <div class="form-section">
            <div class="section-heading">
              <div class="section-heading__title">品类表单</div>
              <div class="section-heading__hint">品类最多三级；可手动维护一级、二级、三级节点。</div>
            </div>
            <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryFormRules" label-position="top" class="config-form">
              <div class="form-grid">
                <el-form-item label="上级品类">
                  <el-input :model-value="categoryParentLabel" disabled />
                </el-form-item>
                <el-form-item label="层级">
                  <el-input :model-value="String(categoryForm.level || '-')" disabled />
                </el-form-item>
                <el-form-item label="编码" prop="category_code">
                  <el-input v-model="categoryForm.category_code" />
                </el-form-item>
                <el-form-item label="名称" prop="category_name">
                  <el-input v-model="categoryForm.category_name" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                  <el-select v-model="categoryForm.status" style="width: 100%">
                    <el-option label="启用" value="ACTIVE" />
                    <el-option label="停用" value="INACTIVE" />
                  </el-select>
                </el-form-item>
                <el-form-item label="排序" prop="sort">
                  <el-input-number v-model="categoryForm.sort" :min="0" style="width: 100%" />
                </el-form-item>
                <el-form-item label="备注" class="span-full">
                  <el-input v-model="categoryForm.remark" type="textarea" :rows="3" />
                </el-form-item>
              </div>
            </el-form>
          </div>
      </div>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveCategory">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" :title="detailTitle" width="720px" class="product-config-dialog">
      <div v-if="detailMode === 'config' && currentConfigItem" class="detail-layout">
        <div class="detail-main">
          <div class="detail-section-card">
            <div class="section-heading">
              <div class="section-heading__title">{{ currentConfigItem.item_name }}</div>
              <div class="section-heading__hint">编码 {{ currentConfigItem.item_code }} · {{ getSectionLabel(currentConfigItem.config_type) }}</div>
            </div>
            <div class="detail-grid">
              <div class="side-metric"><div class="side-metric__label">状态</div><div class="side-metric__value">{{ currentConfigItem.status === 'ACTIVE' ? '启用' : '停用' }}</div></div>
              <div class="side-metric"><div class="side-metric__label">排序</div><div class="side-metric__value">{{ currentConfigItem.sort }}</div></div>
              <div class="side-metric"><div class="side-metric__label">引用产品</div><div class="side-metric__value">{{ currentConfigItem.reference_count || 0 }}</div></div>
              <div class="side-metric"><div class="side-metric__label">删除状态</div><div class="side-metric__value">{{ currentConfigItem.deletable === false ? currentConfigItem.delete_block_reason || '不可删除' : '可删除' }}</div></div>
              <div class="side-metric"><div class="side-metric__label">创建时间</div><div class="side-metric__value">{{ formatDateTime(currentConfigItem.gmt_create) }}</div></div>
              <div class="side-metric"><div class="side-metric__label">更新时间</div><div class="side-metric__value">{{ formatDateTime(currentConfigItem.gmt_modified) }}</div></div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="detailMode === 'category' && currentCategoryItem" class="detail-layout">
        <div class="detail-main">
          <div class="detail-section-card">
            <div class="section-heading">
              <div class="section-heading__title">{{ currentCategoryItem.category_name }}</div>
              <div class="section-heading__hint">编码 {{ currentCategoryItem.category_code }} · L{{ currentCategoryItem.level }}</div>
            </div>
            <div class="detail-grid">
              <div class="side-metric"><div class="side-metric__label">上级品类</div><div class="side-metric__value">{{ getCategoryParentName(currentCategoryItem) }}</div></div>
              <div class="side-metric"><div class="side-metric__label">状态</div><div class="side-metric__value">{{ currentCategoryItem.status === 'ACTIVE' ? '启用' : '停用' }}</div></div>
              <div class="side-metric"><div class="side-metric__label">排序</div><div class="side-metric__value">{{ currentCategoryItem.sort }}</div></div>
              <div class="side-metric"><div class="side-metric__label">引用产品</div><div class="side-metric__value">{{ currentCategoryItem.reference_count || 0 }}</div></div>
              <div class="side-metric"><div class="side-metric__label">删除状态</div><div class="side-metric__value">{{ currentCategoryItem.deletable === false ? currentCategoryItem.delete_block_reason || '不可删除' : '可删除' }}</div></div>
              <div class="side-metric"><div class="side-metric__label">更新时间</div><div class="side-metric__value">{{ formatDateTime(currentCategoryItem.gmt_modified) }}</div></div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { buildCodeValidator } from '@/modules/common/utils/code'
import {
  getProductConfigList,
  createProductConfig,
  updateProductConfig,
  deleteProductConfig,
  getProductCategoryTree,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory
} from '../api/configs'
import type { ProductConfigItem, ProductConfigType, ProductCategory, SaveProductConfigParams, SaveProductCategoryParams } from '../types'
import ProductCategoryWorkspace from '../components/ProductCategoryWorkspace.vue'
import ProductConfigItemsWorkspace from '../components/ProductConfigItemsWorkspace.vue'

const sections = [
  { value: 'BRAND', label: '品牌' },
  { value: 'SALES_STATUS', label: '销售状态' },
  { value: 'CATEGORY', label: '品类' },
  { value: 'DIMENSION_UNIT', label: '尺寸单位' },
  { value: 'WEIGHT_UNIT', label: '重量单位' }
] as const
const flatSections = sections.filter((item) => item.value !== 'CATEGORY') as Array<{ value: ProductConfigType; label: string }>

type SectionValue = typeof sections[number]['value']

const activeSection = ref<SectionValue>('BRAND')
const keyword = ref('')
const configLoading = ref(false)
const categoryLoading = ref(false)
const saving = ref(false)

const configItems = ref<ProductConfigItem[]>([])
const categoryTree = ref<ProductCategory[]>([])
const categoryMap = computed(() => {
  const map = new Map<number, ProductCategory>()
  const walk = (nodes: ProductCategory[]) => {
    nodes.forEach((node) => {
      map.set(node.id, node)
      if (node.children?.length) walk(node.children)
    })
  }
  walk(categoryTree.value)
  return map
})

const configDialogVisible = ref(false)
const configDialogTitle = ref('新增配置')
const configIsEdit = ref(false)
const configFormRef = ref<FormInstance>()
const configForm = reactive<SaveProductConfigParams & { id?: number }>({
  config_type: 'BRAND',
  item_code: '',
  item_name: '',
  status: 'ACTIVE',
  sort: 0,
  remark: ''
})

const categoryDialogVisible = ref(false)
const categoryDialogTitle = ref('新增品类')
const categoryIsEdit = ref(false)
const categoryFormRef = ref<FormInstance>()
const categoryParent = ref<ProductCategory | null>(null)
const categoryForm = reactive<SaveProductCategoryParams & { id?: number; level?: number }>({
  parent_id: undefined,
  category_code: '',
  category_name: '',
  status: 'ACTIVE',
  sort: 0,
  remark: '',
  level: undefined
})

const detailVisible = ref(false)
const detailMode = ref<'config' | 'category'>('config')
const detailTitle = ref('详情')
const currentConfigItem = ref<ProductConfigItem | null>(null)
const currentCategoryItem = ref<ProductCategory | null>(null)

const validateCode = buildCodeValidator('编码只允许字母、数字、中划线、下划线')

const configFormRules = computed<FormRules>(() => ({
  config_type: [{ required: true, message: '请选择配置类型', trigger: 'change' }],
  item_code: [
    { required: true, message: '请输入编码', trigger: 'blur' },
    { validator: validateCode, trigger: 'blur' }
  ],
  item_name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}))

const categoryFormRules = computed<FormRules>(() => ({
  category_code: [
    { required: true, message: '请输入品类编码', trigger: 'blur' },
    { validator: validateCode, trigger: 'blur' }
  ],
  category_name: [{ required: true, message: '请输入品类名称', trigger: 'blur' }]
}))

const displayConfigItems = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()
  return configItems.value.filter((item) => {
    if (item.config_type !== activeSection.value) return false
    if (!normalizedKeyword) return true
    return item.item_code.toLowerCase().includes(normalizedKeyword) || item.item_name.toLowerCase().includes(normalizedKeyword)
  })
})

const filteredConfigCount = computed(() => displayConfigItems.value.length)
const configCountMap = computed<Record<string, number>>(() => configItems.value.reduce((acc, item) => {
  acc[item.config_type] = (acc[item.config_type] || 0) + 1
  return acc
}, {} as Record<string, number>))
const categoryCount = computed(() => categoryMap.value.size)
const categoryParentLabel = computed(() => {
  if (!categoryParent.value) return '一级品类'
  return `${categoryParent.value.category_name}（L${categoryParent.value.level}）`
})

const getSectionLabel = (value: SectionValue | ProductConfigType) => sections.find((item) => item.value === value)?.label || value
const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const getCategoryParentName = (row: ProductCategory) => {
  if (!row.parent_id) return '一级品类'
  return categoryMap.value.get(row.parent_id)?.category_name || '-'
}

const resetConfigForm = () => {
  Object.assign(configForm, {
    id: undefined,
    config_type: activeSection.value === 'CATEGORY' ? 'BRAND' : (activeSection.value as ProductConfigType),
    item_code: '',
    item_name: '',
    status: 'ACTIVE',
    sort: 0,
    remark: ''
  })
}

const resetCategoryForm = () => {
  Object.assign(categoryForm, {
    id: undefined,
    parent_id: categoryParent.value?.id,
    category_code: '',
    category_name: '',
    status: 'ACTIVE',
    sort: 0,
    remark: '',
    level: categoryParent.value ? categoryParent.value.level + 1 : 2
  })
}

const loadConfigItems = async () => {
  configLoading.value = true
  try {
    const res = await getProductConfigList({ page: 1, page_size: 500 })
    if (res.success) {
      configItems.value = Array.isArray(res.data?.data) ? res.data.data : []
    }
  } finally {
    configLoading.value = false
  }
}

const loadCategoryTree = async () => {
  categoryLoading.value = true
  try {
    const res = await getProductCategoryTree()
    if (res.success) {
      categoryTree.value = Array.isArray(res.data) ? res.data : []
    }
  } finally {
    categoryLoading.value = false
  }
}

const reloadCurrent = () => {
  if (activeSection.value === 'CATEGORY') {
    loadCategoryTree()
    return
  }
  loadConfigItems()
}

const handleCreateConfig = () => {
  configIsEdit.value = false
  configDialogTitle.value = '新增配置'
  resetConfigForm()
  configDialogVisible.value = true
}

const handleEditConfig = (row: ProductConfigItem) => {
  configIsEdit.value = true
  configDialogTitle.value = '编辑配置'
  Object.assign(configForm, { ...row })
  configDialogVisible.value = true
}

const handleViewConfig = (row: ProductConfigItem) => {
  detailMode.value = 'config'
  detailTitle.value = '配置详情'
  currentConfigItem.value = row
  detailVisible.value = true
}

const handleDeleteConfig = async (row: ProductConfigItem) => {
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || '当前配置不可删除')
    return
  }
  await ElMessageBox.confirm(`确认删除配置【${row.item_name}】吗？`, '提示', { type: 'warning' })
  await deleteProductConfig(row.id)
  ElMessage.success('删除成功')
  loadConfigItems()
}

const handleSaveConfig = async () => {
  if (!configFormRef.value) return
  await configFormRef.value.validate()
  saving.value = true
  try {
    const payload: SaveProductConfigParams = {
      config_type: configForm.config_type,
      item_code: configForm.item_code,
      item_name: configForm.item_name,
      status: configForm.status,
      sort: configForm.sort,
      remark: configForm.remark
    }
    if (configIsEdit.value && configForm.id) {
      await updateProductConfig(configForm.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createProductConfig(payload)
      ElMessage.success('创建成功')
    }
    configDialogVisible.value = false
    loadConfigItems()
  } finally {
    saving.value = false
  }
}

const handleCreateCategory = (parent: ProductCategory) => {
  categoryIsEdit.value = false
  categoryDialogTitle.value = parent.level === 1 ? '新增二级品类' : '新增三级品类'
  categoryParent.value = parent
  resetCategoryForm()
  categoryDialogVisible.value = true
}

const handleCreateRootCategory = () => {
  categoryIsEdit.value = false
  categoryDialogTitle.value = '新增一级品类'
  categoryParent.value = null
  resetCategoryForm()
  categoryDialogVisible.value = true
}

const handleEditCategory = (row: ProductCategory) => {
  categoryIsEdit.value = true
  categoryDialogTitle.value = '编辑品类'
  categoryParent.value = row.parent_id ? categoryMap.value.get(row.parent_id) || null : null
  Object.assign(categoryForm, { ...row })
  categoryDialogVisible.value = true
}

const handleViewCategory = (row: ProductCategory) => {
  detailMode.value = 'category'
  detailTitle.value = '品类详情'
  currentCategoryItem.value = row
  detailVisible.value = true
}

const handleDeleteCategory = async (row: ProductCategory) => {
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || '当前品类不可删除')
    return
  }
  await ElMessageBox.confirm(`确认删除品类【${row.category_name}】吗？`, '提示', { type: 'warning' })
  await deleteProductCategory(row.id)
  ElMessage.success('删除成功')
  loadCategoryTree()
}

const handleSaveCategory = async () => {
  if (!categoryFormRef.value) return
  await categoryFormRef.value.validate()
  saving.value = true
  try {
    const payload: SaveProductCategoryParams = {
      parent_id: categoryForm.parent_id,
      category_code: categoryForm.category_code,
      category_name: categoryForm.category_name,
      status: categoryForm.status,
      sort: categoryForm.sort,
      remark: categoryForm.remark
    }
    if (categoryIsEdit.value && categoryForm.id) {
      await updateProductCategory(categoryForm.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createProductCategory(payload)
      ElMessage.success('创建成功')
    }
    categoryDialogVisible.value = false
    loadCategoryTree()
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfigItems()
  loadCategoryTree()
})
</script>

<style scoped>
@import '../styles/workbench.css';

.product-config-page { display: grid; gap: 16px; }
.workspace-shell { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 16px; }
.workspace-content { display: grid; gap: 16px; min-width: 0; }
.section-nav {
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #f8fafc;
}
.section-nav__title {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
}
.section-nav__item {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.section-nav__item--active {
  border-color: #0f766e;
  box-shadow: 0 0 0 1px rgba(15, 118, 110, 0.08);
}
.section-nav__name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.section-nav__meta {
  font-size: 12px;
  color: #64748b;
}
.search-form { display: flex; flex-wrap: wrap; justify-content: flex-end; }
.remark-text { color: #475569; line-height: 1.6; }
.editor-layout, .detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 16px; }
.editor-main, .detail-main, .editor-side { display: grid; gap: 16px; }
.form-section, .detail-section-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06); }
.section-heading { display: grid; gap: 4px; margin-bottom: 16px; }
.section-heading__title { font-size: 15px; font-weight: 700; color: #0f172a; }
.section-heading__hint, .side-card__hint { font-size: 12px; color: #64748b; line-height: 1.6; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 20px; }
.span-full { grid-column: 1 / -1; }
.side-card { border-radius: 16px; }
.side-metric-list { display: grid; gap: 12px; }
.side-metric { display: grid; gap: 4px; }
.side-metric__label { font-size: 12px; color: #94a3b8; }
.side-metric__value { font-size: 13px; color: #0f172a; line-height: 1.5; }
.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 900px) {
  .workspace-shell { grid-template-columns: 1fr; }
  .editor-layout, .detail-layout { grid-template-columns: 1fr; }
  .form-grid, .detail-grid { grid-template-columns: 1fr; }
}
</style>
