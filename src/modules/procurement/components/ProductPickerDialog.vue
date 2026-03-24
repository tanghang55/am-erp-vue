<template>
  <el-dialog v-model="visible" :title="labels.title" width="900px">
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item :label="labels.keyword">
        <el-input
          v-model="searchForm.keyword"
          :placeholder="labels.keywordPlaceholder"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item :label="labels.marketplace">
        <el-select v-model="searchForm.marketplace" clearable style="width: 140px">
          <el-option
            v-for="item in marketplaceOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item :label="labels.salesStatus">
        <el-select v-model="searchForm.statuses" multiple collapse-tags collapse-tags-tooltip clearable style="width: 220px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
        <el-button @click="handleReset">{{ labels.reset }}</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="displayList"
      border
      stripe
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="seller_sku" :label="labels.product" min-width="160" />
      <el-table-column :label="labels.titleCol" min-width="260">
        <template #default="{ row }">
          <div class="product-title">{{ row.title || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="marketplace" :label="labels.marketplace" width="100" align="center" />
      <el-table-column :label="labels.salesStatus" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="labels.combo" width="120" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.is_combo_main === 1" type="warning" size="small">
            {{ labels.comboMain }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="dialog-footer">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSearch"
        @current-change="handleSearch"
      />
      <div class="footer-actions">
        <el-button @click="handleCancel">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirm">
          {{ labels.confirm }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getProductList } from '@/modules/product/api'
import type { ProductSummary } from '@/modules/product/types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { filterSelectableProducts } from '@/modules/procurement/utils/productSelection'

const props = withDefaults(defineProps<{
  modelValue: boolean
  productParams?: Partial<import('@/modules/product/types').ProductListParams>
}>(), {
  productParams: () => ({})
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', products: ProductSummary[]): void
}>()

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Select product',
      keyword: 'Keyword',
      keywordPlaceholder: 'Search product/title',
      marketplace: 'Marketplace',
      salesStatus: 'Status',
      search: 'Search',
      reset: 'Reset',
      product: 'Product',
      titleCol: 'Title',
      combo: 'Combo',
      comboMain: 'Combo Main',
      cancel: 'Cancel',
      confirm: 'Confirm',
      selectWarning: 'Please select product'
    }
  }
  return {
    title: '选择产品',
    keyword: '关键词',
      keywordPlaceholder: '搜索产品/标题',
      marketplace: '站点',
      salesStatus: '销售状态',
      search: '搜索',
    reset: '重置',
    product: '产品',
    titleCol: '标题',
    combo: '组合',
    comboMain: '组合主',
    cancel: '取消',
    confirm: '确认选择',
    selectWarning: '请选择产品'
  }
})

const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']
const statusOptions = computed(() => {
  if (localeStore.isEnglish) {
    return [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'ON_SALE', label: 'On Sale' },
      { value: 'REPLENISHING', label: 'Replenishing' },
      { value: 'OFF_SHELF', label: 'Off Shelf' }
    ]
  }
  return [
    { value: 'DRAFT', label: '草稿' },
    { value: 'ON_SALE', label: '正常销售' },
    { value: 'REPLENISHING', label: '补货中' },
    { value: 'OFF_SHELF', label: '下架' }
  ]
})

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const searchForm = reactive({
  keyword: '',
  marketplace: '',
  statuses: [] as string[]
})

const list = ref<ProductSummary[]>([])
const selected = ref<ProductSummary[]>([])
const loading = ref(false)
const submitting = ref(false)
const displayList = computed(() => filterSelectableProducts(list.value))

const getStatusLabel = (status: string) => statusOptions.value.find((item) => item.value === status)?.label || status || '-'

const statusTagType = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'info',
    ON_SALE: 'success',
    REPLENISHING: 'warning',
    OFF_SHELF: 'danger'
  }
  return map[status] || 'info'
}

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const loadList = async () => {
  loading.value = true
  try {
    const res = await getProductList({
      ...props.productParams,
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      marketplace: searchForm.marketplace || undefined,
      statuses: searchForm.statuses.length ? searchForm.statuses : undefined
    })
    if (res.data) {
      list.value = res.data.data
      pagination.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.marketplace = ''
  searchForm.statuses = Array.isArray(props.productParams.statuses) ? [...props.productParams.statuses] : []
  handleSearch()
}

const handleSelectionChange = (rows: ProductSummary[]) => {
  selected.value = rows
}

const handleCancel = () => {
  visible.value = false
}

const handleConfirm = async () => {
  if (selected.value.length === 0) {
    ElMessage.warning(labels.value.selectWarning)
    return
  }
  submitting.value = true
  try {
    emit('confirm', selected.value)
    visible.value = false
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  value => {
    if (value) {
      searchForm.keyword = ''
      searchForm.marketplace = ''
      searchForm.statuses = Array.isArray(props.productParams.statuses) ? [...props.productParams.statuses] : []
      selected.value = []
      loadList()
    }
  }
)
</script>

<style scoped>
.search-form {
  margin-bottom: 12px;
}

.dialog-footer {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.product-title {
  color: #606266;
}
</style>
