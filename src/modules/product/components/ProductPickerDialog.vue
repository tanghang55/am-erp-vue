<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="1000px">
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

    <el-alert
      v-if="!loading && props.showInventoryColumns && props.warehouseId"
      :title="labels.inventoryFilterHint"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />

    <el-table
      ref="tableRef"
      :data="listWithInventory"
      border
      stripe
      v-loading="loading"
      @selection-change="handleSelectionChange"
      row-key="id"
    >
      <el-table-column
        v-if="props.multiple"
        type="selection"
        width="55"
        :reserve-selection="true"
        :selectable="isRowSelectable"
      />
      <el-table-column v-else :label="labels.select" width="80" align="center">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            :disabled="!isRowSelectable(row)"
            @click="handleSingleSelect(row)"
          >
            {{ labels.select }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column :label="labels.image" width="80">
        <template #default="{ row }">
          <el-image
            v-if="row.image_url"
            :src="getFullImageUrl(row.image_url)"
            :preview-src-list="[getFullImageUrl(row.image_url)]"
            fit="cover"
            style="width: 50px; height: 50px; border-radius: 4px"
          />
          <span v-else class="no-image">-</span>
        </template>
      </el-table-column>
      <el-table-column :label="labels.productInfo" min-width="240">
        <template #default="{ row }">
          <div class="product-info">
            <div class="product-sku">{{ row.seller_sku }}</div>
            <div class="product-title">{{ row.title || '-' }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="marketplace" :label="labels.marketplace" width="90" align="center" />
      <el-table-column :label="labels.salesStatus" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="props.showInventoryColumns" :label="labels.pendingShipment" width="100" align="center">
        <template #default="{ row }">
          <span :class="{ 'qty-warning': row._inventory?.pending_shipment === 0 }">
            {{ row._inventory?.pending_shipment ?? '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column v-if="props.showInventoryColumns" :label="labels.reservedQty" width="100" align="center">
        <template #default="{ row }">
          {{ row._inventory?.reserved_quantity ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column v-if="props.showInventoryColumns" :label="labels.totalQty" width="100" align="center">
        <template #default="{ row }">
          {{ row._inventory?.total_quantity ?? '-' }}
        </template>
      </el-table-column>

      <template #empty>
        <div class="empty-state">
          {{ props.warehouseId ? labels.noInventoryProducts : '' }}
        </div>
      </template>
    </el-table>

    <div class="dialog-footer">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSearch"
        @current-change="handlePageChange"
      />
      <div class="footer-actions">
        <span class="selected-count">{{ labels.selected }}: {{ selected.length }}</span>
        <el-button @click="handleCancel">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirm">
          {{ labels.confirm }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { ElTable } from 'element-plus'
import { getProductList } from '@/modules/product/api/products'
import { getBalanceList } from '@/modules/inventory/api'
import type { ProductSummary, ProductListParams } from '@/modules/product/types'
import type { InventoryBalance } from '@/modules/inventory/types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

interface ProductWithInventory extends ProductSummary {
  _inventory?: InventoryBalance
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  selected?: number[]
  warehouseId?: number | null
  title?: string
  multiple?: boolean
  showInventoryColumns?: boolean
  productParams?: Partial<ProductListParams>
  selectable?: (product: ProductWithInventory) => boolean
}>(), {
  selected: () => [],
  warehouseId: null,
  title: '',
  multiple: true,
  showInventoryColumns: true,
  productParams: () => ({})
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', products: ProductWithInventory[]): void
}>()

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Select Products',
      select: 'Select',
      keyword: 'Keyword',
      keywordPlaceholder: 'Search Product Code/Title',
      marketplace: 'Marketplace',
      salesStatus: 'Status',
      search: 'Search',
      reset: 'Reset',
      image: 'Image',
      productInfo: 'Product Info',
      pendingShipment: 'Pending Ship',
      reservedQty: 'Reserved',
      totalQty: 'Total',
      cancel: 'Cancel',
      confirm: 'Confirm',
      selected: 'Selected',
      selectWarning: 'Please select at least one product',
      noInventoryProducts: 'No products with pending shipment inventory found',
      inventoryFilterHint: 'Only showing products with pending shipment inventory (excluding combo children)'
    }
  }
  return {
    title: '选择产品',
    select: '选择',
      keyword: '关键词',
      keywordPlaceholder: '搜索产品编号/标题',
      marketplace: '站点',
      salesStatus: '销售状态',
      search: '搜索',
    reset: '重置',
    image: '图片',
    productInfo: '产品信息',
    pendingShipment: '待出库存',
    reservedQty: '预留库存',
    totalQty: '总库存',
    cancel: '取消',
    confirm: '确认选择',
    selected: '已选',
    selectWarning: '请选择至少一个产品',
    noInventoryProducts: '没有找到有待出库存的产品',
    inventoryFilterHint: '仅显示有待出库存的产品（已排除组合子产品）'
  }
})

const dialogTitle = computed(() => props.title || labels.value.title)

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

const tableRef = ref<InstanceType<typeof ElTable>>()
const list = ref<ProductSummary[]>([])
const inventoryMap = ref<Map<number, InventoryBalance>>(new Map())
const selected = ref<ProductWithInventory[]>([])
const loading = ref(false)
const submitting = ref(false)

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const listWithInventory = computed<ProductWithInventory[]>(() => {
  return list.value.map(product => ({
    ...product,
    _inventory: inventoryMap.value.get(product.id)
  }))
})

const getFullImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url}`
}

const getStatusLabel = (status: string) => {
  return statusOptions.value.find((item) => item.value === status)?.label || status || '-'
}

const statusTagType = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: 'info',
    ON_SALE: 'success',
    REPLENISHING: 'warning',
    OFF_SHELF: 'danger'
  }
  return map[status] || 'info'
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getProductList({
      ...props.productParams,
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      marketplace: searchForm.marketplace || undefined,
      statuses: searchForm.statuses.length ? searchForm.statuses : undefined,
      warehouse_id: props.warehouseId || undefined
    })
    if (res.data) {
      list.value = res.data.data
      pagination.total = res.data.total

      // Load inventory data for display
      if (props.showInventoryColumns && props.warehouseId) {
        await loadInventoryData()
      }
      await restoreSelection()
    }
  } finally {
    loading.value = false
  }
}

const loadInventoryData = async () => {
  if (!props.warehouseId || list.value.length === 0) return

  try {
    const res = await getBalanceList({
      warehouse_id: props.warehouseId,
      page: 1,
      page_size: 1000  // Get all inventory for this warehouse
    })

    if (res.data?.data) {
      const map = new Map<number, InventoryBalance>()
      for (const balance of res.data.data) {
        map.set(balance.product_id, balance)
      }
      inventoryMap.value = map
    }
  } catch (error) {
    console.error('Failed to load inventory data:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadList()
}

const handlePageChange = () => {
  loadList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.marketplace = ''
  searchForm.statuses = Array.isArray(props.productParams.statuses) ? [...props.productParams.statuses] : []
  handleSearch()
}

const handleSelectionChange = (rows: ProductWithInventory[]) => {
  selected.value = rows
}

const isRowSelectable = (row: ProductWithInventory) => {
  if (props.selectable) {
    return props.selectable(row)
  }
  return true
}

const handleSingleSelect = (row: ProductWithInventory) => {
  if (!isRowSelectable(row)) {
    return
  }
  selected.value = [row]
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

const restoreSelection = async () => {
  if (!props.selected?.length) {
    return
  }
  const rows = listWithInventory.value.filter(item => props.selected?.includes(item.id))
  selected.value = props.multiple ? rows : rows.slice(0, 1)
  if (props.multiple && tableRef.value) {
    await nextTick()
    tableRef.value.clearSelection()
    rows.forEach(row => tableRef.value?.toggleRowSelection(row, true))
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
      inventoryMap.value = new Map()
      tableRef.value?.clearSelection()
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
  align-items: center;
  gap: 12px;
}

.selected-count {
  color: #409eff;
  font-weight: 500;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-sku {
  font-weight: 600;
  color: #303133;
}

.product-title {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.no-image {
  color: #909399;
  font-size: 12px;
}

.qty-warning {
  color: #f56c6c;
  font-weight: 600;
}

.empty-state {
  padding: 20px;
  color: #909399;
}
</style>
