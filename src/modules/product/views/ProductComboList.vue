<template>
  <div class="combo-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ text.comboTitle }}</h3>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            {{ text.createCombo }}
          </el-button>
        </div>
      </template>

      <el-table :data="comboList" v-loading="loading" border stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="combo-children">
              <div class="combo-children-title">{{ text.children }}</div>
              <div v-if="row.products && row.products.length">
                <div v-for="child in row.products" :key="child.id" class="combo-child-item">
                  <el-tag size="small" type="info">{{ child.seller_sku }}</el-tag>
                  <span class="combo-child-title">{{ child.title }}</span>
                </div>
              </div>
              <div v-else class="combo-empty">{{ text.noChildren }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="combo_id" :label="text.comboId" width="100" />
        <el-table-column :label="text.mainSku" min-width="220">
          <template #default="{ row }">
            <div class="combo-main">
              <el-tag type="success" size="small">{{ text.main }}</el-tag>
              <div class="combo-main-text">
                <div class="combo-main-sku">{{ row.main_product?.seller_sku }}</div>
                <div class="combo-main-title">{{ row.main_product?.title }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.children" width="120">
          <template #default="{ row }">
            {{ row.products?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column :label="text.actions" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ text.view }}</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">{{ text.edit }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">{{ text.delete }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadComboList"
          @current-change="loadComboList"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px">
      <el-form ref="comboFormRef" :model="comboForm" :rules="comboFormRules" label-width="140px">
        <el-form-item :label="text.mainProduct" prop="main_product_id">
          <el-select
            v-model="comboForm.main_product_id"
            filterable
            remote
            reserve-keyword
            :placeholder="text.searchSku"
            :remote-method="searchSkuOptions"
            :loading="skuLoading"
            @change="handleMainChange"
          >
            <el-option
              v-for="item in skuOptions"
              :key="item.id"
              :label="formatSkuOption(item)"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="text.childProducts">
          <el-select
            v-model="comboForm.product_ids"
            multiple
            filterable
            remote
            reserve-keyword
            :placeholder="text.searchSku"
            :remote-method="searchSkuOptions"
            :loading="skuLoading"
          >
            <el-option
              v-for="item in skuOptions"
              :key="item.id"
              :label="formatSkuOption(item)"
              :value="item.id"
              :disabled="item.id === comboForm.main_product_id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ text.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ text.save }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" :title="text.detailTitle" width="640px">
      <div v-if="currentCombo" class="combo-detail">
        <div class="combo-detail-main">
          <el-tag type="success" size="small">{{ text.main }}</el-tag>
          <span class="combo-detail-sku">{{ currentCombo.main_product.seller_sku }}</span>
          <span class="combo-detail-title">{{ currentCombo.main_product.title }}</span>
        </div>
        <div class="combo-detail-children">
          <div class="combo-children-title">{{ text.children }}</div>
          <div v-if="currentCombo.products.length">
            <div v-for="child in currentCombo.products" :key="child.id" class="combo-child-item">
              <el-tag size="small" type="info">{{ child.seller_sku }}</el-tag>
              <span class="combo-child-title">{{ child.title }}</span>
            </div>
          </div>
          <div v-else class="combo-empty">{{ text.noChildren }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getProductComboList, getProductComboDetail, createProductCombo, updateProductCombo, deleteProductCombo, getSkuList } from '../api'
import type { ProductCombo, Sku } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const comboList = ref<ProductCombo[]>([])
const loading = ref(false)
const saving = ref(false)

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const comboFormRef = ref<FormInstance>()

const comboForm = reactive({
  main_product_id: 0,
  product_ids: [] as number[]
})

const detailVisible = ref(false)
const currentCombo = ref<ProductCombo | null>(null)

const skuOptions = ref<Sku[]>([])
const skuLoading = ref(false)
const localeStore = useLocaleStore()
const text = computed(() => {
  if (localeStore.isEnglish) {
    return {
      comboTitle: 'Product Combo',
      createCombo: 'Create Combo',
      children: 'Children',
      noChildren: 'No child products',
      comboId: 'Combo ID',
      mainSku: 'Main SKU',
      main: 'Main',
      actions: 'Actions',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      mainProduct: 'Main Product',
      childProducts: 'Child Products',
      searchSku: 'Search SKU',
      cancel: 'Cancel',
      save: 'Save',
      detailTitle: 'Combo Details',
      required: 'Required',
      warning: 'Warning',
      confirm: 'Confirm',
      createdSuccess: 'Combo created successfully',
      updatedSuccess: 'Combo updated successfully',
      deletedSuccess: 'Combo deleted successfully'
    }
  }

  return {
    comboTitle: '产品组合',
    createCombo: '新增组合',
    children: '子产品',
    noChildren: '暂无子产品',
    comboId: '组合ID',
    mainSku: '主SKU',
    main: '主',
    actions: '操作',
    view: '查看',
    edit: '编辑',
    delete: '删除',
    mainProduct: '主产品',
    childProducts: '子产品',
    searchSku: '搜索SKU',
    cancel: '取消',
    save: '保存',
    detailTitle: '组合详情',
    required: '必填',
    warning: '提示',
    confirm: '确认',
    createdSuccess: '组合创建成功',
    updatedSuccess: '组合更新成功',
    deletedSuccess: '组合删除成功'
  }
})

const comboFormRules = computed<FormRules>(() => ({
  main_product_id: [{ required: true, message: text.value.required, trigger: 'change' }]
}))

const formatSkuOption = (sku: Sku) => `${sku.seller_sku} | ${sku.title}`

const searchSkuOptions = async (query: string) => {
  if (!query) return
  skuLoading.value = true
  try {
    const res = await getSkuList({ page: 1, page_size: 20, keyword: query })
    if (res.success) {
      skuOptions.value = res.data.data
    }
  } finally {
    skuLoading.value = false
  }
}

const handleMainChange = (value: number) => {
  comboForm.product_ids = comboForm.product_ids.filter((id) => id !== value)
}

const loadComboList = async () => {
  loading.value = true
  try {
    const res = await getProductComboList(pagination.page, pagination.page_size)
    if (res.success) {
      comboList.value = res.data.data
      pagination.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = text.value.createCombo
  comboForm.main_product_id = 0
  comboForm.product_ids = []
  dialogVisible.value = true
}

const handleEdit = async (row: ProductCombo) => {
  isEdit.value = true
  dialogTitle.value = text.value.edit
  const res = await getProductComboDetail(row.combo_id)
  if (res.success) {
    comboForm.main_product_id = res.data.main_product.id
    comboForm.product_ids = res.data.products.map((p) => p.id)
    dialogVisible.value = true
  }
}

const handleView = async (row: ProductCombo) => {
  const res = await getProductComboDetail(row.combo_id)
  if (res.success) {
    currentCombo.value = res.data
    detailVisible.value = true
  }
}

const handleSave = async () => {
  if (!comboFormRef.value) return

  await comboFormRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        main_product_id: comboForm.main_product_id,
        product_ids: comboForm.product_ids
      }
      if (isEdit.value) {
        await updateProductCombo(comboForm.main_product_id, payload)
        ElMessage.success(text.value.updatedSuccess)
      } else {
        await createProductCombo(payload)
        ElMessage.success(text.value.createdSuccess)
      }
      dialogVisible.value = false
      loadComboList()
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = async (row: ProductCombo) => {
  try {
    await ElMessageBox.confirm(
      localeStore.isEnglish
        ? `Are you sure to delete combo "${row.main_product?.seller_sku}"?`
        : `确认删除组合 "${row.main_product?.seller_sku}"？`,
      text.value.warning,
      {
        confirmButtonText: text.value.confirm,
        cancelButtonText: text.value.cancel,
        type: 'warning'
      }
    )
    await deleteProductCombo(row.combo_id)
    ElMessage.success(text.value.deletedSuccess)
    loadComboList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

onMounted(() => {
  loadComboList()
})
</script>

<style scoped>
.combo-list-container {
  width: 100%;
  max-width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.combo-main {
  display: flex;
  gap: 10px;
  align-items: center;
}

.combo-main-text {
  display: flex;
  flex-direction: column;
}

.combo-main-sku {
  font-weight: 600;
}

.combo-main-title {
  font-size: 12px;
  color: #909399;
}

.combo-children {
  padding: 8px 4px;
}

.combo-children-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.combo-child-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.combo-child-title {
  color: #606266;
}

.combo-empty {
  color: #909399;
  font-size: 12px;
}

.combo-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.combo-detail-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.combo-detail-sku {
  font-weight: 600;
}

.combo-detail-title {
  color: #606266;
}
</style>
