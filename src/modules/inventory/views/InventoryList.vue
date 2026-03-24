<template>
  <div class="inventory-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">{{ labels.title }}</span>
          <div class="header-actions">
            <el-button @click="handleExport" :loading="exporting">
              <el-icon><Download /></el-icon>
              {{ labels.export }}
            </el-button>
          </div>
        </div>
      </template>

      <div class="search-toolbar">
        <div class="search-toolbar__intro">
          <div class="search-toolbar__title">{{ labels.searchTitle }}</div>
          <div class="search-toolbar__meta">{{ labels.searchDescription }}</div>
        </div>
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item class="search-form__keyword">
            <el-input
              v-model="searchForm.keyword"
              :placeholder="labels.keywordPlaceholder"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <warehouse-selector
              v-model="searchForm.warehouse_id"
              :placeholder="labels.allWarehouses"
              style="width: 180px"
            />
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="searchForm.low_stock">{{ labels.lowStock }}</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="searchForm.zero_stock">{{ labels.zeroStock }}</el-checkbox>
          </el-form-item>
          <el-form-item class="search-form__actions">
            <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
            <el-button @click="handleReset">{{ labels.reset }}</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table :data="list" v-loading="loading" border stripe row-key="id" size="small">
        <el-table-column :label="labels.productInfo" min-width="180">
          <template #default="{ row }">
            <div v-if="row.product">
              <div style="font-weight: bold">{{ row.product.seller_sku }}</div>
              <div style="font-size: 12px; color: #606266">{{ row.product.title }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.warehouse" width="180">
          <template #default="{ row }">
            <div v-if="row.warehouse">
              <div style="font-weight: bold">{{ row.warehouse.name || '-' }}</div>
              <div v-if="row.warehouse.code" style="font-size: 12px; color: #909399">{{ row.warehouse.code }}</div>
            </div>
          </template>
        </el-table-column>
        <!-- 库存状态列 -->
        <el-table-column :label="localeStore.isEnglish ? 'Purchasing' : '采购在途'" width="75" align="center">
          <template #default="{ row }">
            <span :class="['stock-cell', { 'has-value': row.purchasing_in_transit > 0 }]">
              {{ row.purchasing_in_transit || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="localeStore.isEnglish ? 'Pending QC' : '待检'" width="65" align="center">
          <template #default="{ row }">
            <span :class="['stock-cell', { 'has-value': row.pending_inspection > 0 }]">
              {{ row.pending_inspection || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="localeStore.isEnglish ? 'Raw' : '原料'" width="65" align="center">
          <template #default="{ row }">
            <span :class="['stock-cell', { 'has-value': row.raw_material > 0 }]">
              {{ row.raw_material || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="localeStore.isEnglish ? 'Pending' : '待出'" width="65" align="center">
          <template #default="{ row }">
            <span :class="['stock-cell', { 'has-value': row.pending_shipment > 0 }]">
              {{ row.pending_shipment || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="localeStore.isEnglish ? 'Logistics' : '物流在途'" width="75" align="center">
          <template #default="{ row }">
            <span :class="['stock-cell', { 'has-value': row.logistics_in_transit > 0 }]">
              {{ row.logistics_in_transit || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="localeStore.isEnglish ? 'Sellable' : '可售'" width="65" align="center">
          <template #default="{ row }">
            <span :class="['stock-cell', 'sellable', { 'has-value': row.sellable > 0 }]">
              {{ row.sellable || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="localeStore.isEnglish ? 'Returned' : '退货'" width="65" align="center">
          <template #default="{ row }">
            <span :class="['stock-cell', 'returned', { 'has-value': row.returned > 0 }]">
              {{ row.returned || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="localeStore.isEnglish ? 'Damaged' : '损坏'" width="65" align="center">
          <template #default="{ row }">
            <span :class="['stock-cell', 'damaged', { 'has-value': row.damaged_quantity > 0 }]">
              {{ row.damaged_quantity || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" :label="labels.total" width="70" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.total_quantity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.actions" width="210" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="handleView(row)">{{ labels.view }}</el-button>
            <el-button size="small" link type="primary" @click="handleViewProductBalances(row)">
              {{ labels.crossWarehouse }}
            </el-button>
            <el-button size="small" link type="primary" @click="handleViewLots(row)">{{ labels.lots }}</el-button>
            <el-button size="small" link type="primary" @click="handleViewMovements(row)">{{ labels.movements }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSearch"
        @current-change="handleSearch"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" :title="labels.detailTitle" width="920px">
      <div v-if="currentBalance" class="detail-layout">
        <div class="detail-main">
          <section class="detail-section-card">
            <div class="detail-section-header">
              <div>
                <div class="detail-section-title">{{ labels.product }}</div>
                <div class="detail-section-subtitle">{{ labels.detailSubtitle }}</div>
              </div>
            </div>
            <div class="detail-hero">
              <div class="detail-hero-main">
                <div class="detail-hero-code">{{ currentBalance.product?.seller_sku || currentBalance.product_id }}</div>
                <div class="detail-hero-title">{{ currentBalance.product?.title || '-' }}</div>
                <div class="detail-hero-meta">
                  <span>ASIN: {{ currentBalance.product?.asin || '-' }}</span>
                  <span>{{ labels.warehouse }}：{{ currentWarehouseDisplay }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="detail-section-card">
            <div class="detail-section-header">
              <div>
                <div class="detail-section-title">{{ labels.stockStatusTitle }}</div>
                <div class="detail-section-subtitle">{{ labels.stockStatusSubtitle }}</div>
              </div>
            </div>
            <div class="summary-grid">
              <div v-for="item in detailStatusCards" :key="item.key" class="summary-tile">
                <div class="summary-label">{{ item.label }}</div>
                <div class="summary-value" :class="item.value > 0 ? item.className : ''">{{ item.value }}</div>
              </div>
            </div>
          </section>

          <section class="detail-section-card">
            <div class="detail-section-header">
              <div>
                <div class="detail-section-title">{{ labels.summaryTitle }}</div>
                <div class="detail-section-subtitle">{{ labels.summarySubtitle }}</div>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">{{ labels.availableQty }}</div>
                <div class="info-value"><stock-level-indicator :quantity="currentBalance.available_quantity" /></div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ labels.reservedQty }}</div>
                <div class="info-value">{{ currentBalance.reserved_quantity || 0 }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ labels.totalQty }}</div>
                <div class="info-value">{{ currentBalance.total_quantity || 0 }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">{{ labels.lastMovementAt }}</div>
                <div class="info-value">{{ currentBalance.last_movement_at || '-' }}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </el-dialog>

    <!-- 产品跨仓库库存对话框 -->
    <el-dialog v-model="productBalancesVisible" :title="labels.productBalancesTitle" width="800px">
      <div v-if="currentProductBalances.length > 0">
        <el-table :data="currentProductBalances" border>
          <el-table-column :label="labels.warehouse" min-width="200">
            <template #default="{ row }">
              <div>
                <div style="font-weight: bold">{{ row.warehouse_name || '-' }}</div>
                <div v-if="row.warehouse_code" style="font-size: 12px; color: #909399">{{ row.warehouse_code }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="labels.available" width="140" align="center">
            <template #default="{ row }">
              <stock-level-indicator :quantity="row.available_quantity" />
            </template>
          </el-table-column>
          <el-table-column prop="reserved_quantity" :label="labels.reserved" width="80" align="center" />
          <el-table-column prop="damaged_quantity" :label="labels.damaged" width="80" align="center" />
          <el-table-column prop="total_quantity" :label="labels.total" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="info">{{ row.total_quantity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="last_movement_at" :label="labels.lastMovement" width="160" />
        </el-table>

        <div class="summary-grid summary-grid--dialog">
          <div class="summary-tile">
            <div class="summary-label">{{ labels.totalAvailable }}</div>
            <div class="summary-value summary-value--positive">{{ totalAvailable }}</div>
          </div>
          <div class="summary-tile">
            <div class="summary-label">{{ labels.totalReserved }}</div>
            <div class="summary-value summary-value--warning">{{ totalReserved }}</div>
          </div>
          <div class="summary-tile">
            <div class="summary-label">{{ labels.totalDamaged }}</div>
            <div class="summary-value summary-value--danger">{{ totalDamaged }}</div>
          </div>
          <div class="summary-tile">
            <div class="summary-label">{{ labels.totalStock }}</div>
            <div class="summary-value summary-value--primary">{{ totalQuantity }}</div>
          </div>
        </div>
      </div>
      <el-empty v-else :description="labels.emptyProductBalances" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getBalanceList, getProductBalances } from '../api'
import type { InventoryBalance } from '../types'
import WarehouseSelector from '../components/WarehouseSelector.vue'
import StockLevelIndicator from '../components/StockLevelIndicator.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const router = useRouter()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Inventory Balances',
      export: 'Export Excel',
      searchTitle: 'Search Inventory',
      searchDescription: 'Search by product code, ASIN, title, warehouse, and stock conditions.',
      warehouse: 'Warehouse',
      allWarehouses: 'All Warehouses',
      product: 'Product',
      productInfo: 'Product Info',
      keywordPlaceholder: 'Product Code / ASIN / Title',
      lowStock: 'Low Stock',
      zeroStock: 'Zero Stock',
      search: 'Search',
      reset: 'Reset',
      availableQty: 'Available',
      reserved: 'Reserved',
      damaged: 'Damaged',
      total: 'Total',
      lastMovement: 'Last Movement',
      actions: 'Actions',
      view: 'View',
      crossWarehouse: 'Cross-Warehouse',
      lots: 'Lots',
      movements: 'Movements',
      detailTitle: 'Inventory Balance Details',
      detailSubtitle: 'Review stock status, warehouse summary and latest movement',
      reservedQty: 'Reserved Quantity',
      damagedQty: 'Damaged Quantity',
      totalQty: 'Total Quantity',
      lastMovementAt: 'Last Movement',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      stockStatusTitle: 'Stock Status',
      stockStatusSubtitle: 'Track each inventory pool under the current warehouse',
      summaryTitle: 'Summary',
      summarySubtitle: 'Review available, reserved and total stock at a glance',
      productBalancesTitle: 'Product Balances by Warehouse',
      available: 'Available',
      totalAvailable: 'Total Available',
      totalReserved: 'Total Reserved',
      totalDamaged: 'Total Damaged',
      totalStock: 'Total Stock',
      emptyProductBalances: 'No inventory in any warehouse for this product.'
    }
  }
  return {
    title: '库存余额',
    export: '导出Excel',
    searchTitle: '搜索库存',
    searchDescription: '按产品编码、ASIN、标题、仓库和库存条件快速定位库存。',
    warehouse: '仓库',
    allWarehouses: '全部仓库',
    product: '产品',
    productInfo: '产品信息',
    keywordPlaceholder: '产品编码 / ASIN / 标题',
    lowStock: '低库存',
    zeroStock: '零库存',
    search: '搜索',
    reset: '重置',
    availableQty: '可用数量',
    reserved: '预留',
    damaged: '损坏',
    total: '总计',
    lastMovement: '最后变动',
    actions: '操作',
    view: '查看',
    crossWarehouse: '跨仓库',
    lots: '批次',
    movements: '流水',
    detailTitle: '库存余额详情',
    detailSubtitle: '集中查看当前仓库下的库存状态与汇总',
    reservedQty: '预留数量',
    damagedQty: '损坏数量',
    totalQty: '总计数量',
    lastMovementAt: '最后变动时间',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    stockStatusTitle: '库存状态',
    stockStatusSubtitle: '查看当前仓库下各库存池的数量分布',
    summaryTitle: '汇总信息',
    summarySubtitle: '集中查看可用、预留和总库存',
    productBalancesTitle: '产品跨仓库库存分布',
    available: '可用',
    totalAvailable: '总可用',
    totalReserved: '总预留',
    totalDamaged: '总损坏',
    totalStock: '总库存',
      emptyProductBalances: '该产品在所有仓库都没有库存'
  }
})

// 列表数据
const list = ref<InventoryBalance[]>([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  warehouse_id: null as number | null,
  keyword: '',
  low_stock: false,
  zero_stock: false
})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 详情对话框
const detailVisible = ref(false)
const currentBalance = ref<InventoryBalance | null>(null)

// 产品跨仓库库存对话框
const productBalancesVisible = ref(false)
const currentProductBalances = ref<any[]>([])

// 导出状态
const exporting = ref(false)

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const res = await getBalanceList({
      page: pagination.page,
      page_size: pagination.page_size,
      warehouse_id: searchForm.warehouse_id || undefined,
      keyword: searchForm.keyword || undefined,
      low_stock: searchForm.low_stock || undefined,
      zero_stock: searchForm.zero_stock || undefined
    })

    if (res.data) {
      list.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('Failed to load inventory list:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadList()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    warehouse_id: null,
    keyword: '',
    low_stock: false,
    zero_stock: false
  })
  handleSearch()
}

// 查看详情
const handleView = (row: InventoryBalance) => {
  currentBalance.value = row
  detailVisible.value = true
}

// 查看产品跨仓库库存
const handleViewProductBalances = async (row: InventoryBalance) => {
  try {
    const res = await getProductBalances(row.product_id)
    if (res.data) {
      // Convert InventoryBalance to expected format
      currentProductBalances.value = res.data.data.map(balance => ({
        warehouse_code: balance.warehouse?.code || '',
        warehouse_name: balance.warehouse?.name || '',
        available_quantity: balance.available_quantity,
        reserved_quantity: balance.reserved_quantity,
        damaged_quantity: balance.damaged_quantity,
        total_quantity: balance.total_quantity,
        last_movement_at: balance.last_movement_at
      }))
      productBalancesVisible.value = true
    }
  } catch (error) {
    console.error('Failed to load product balances:', error)
    ElMessage.error(localeStore.isEnglish ? 'Failed to load product balances' : '加载产品库存失败')
  }
}

// 查看流水（跳转到流水页面）
const handleViewMovements = (row: InventoryBalance) => {
  // 跳转到流水页面，传递 product_id 和 warehouse_id 作为筛选条件
  router.push({
    name: 'inventory-movements',
    query: {
      product_id: row.product_id,
      warehouse_id: row.warehouse_id
    }
  })
}

const handleViewLots = (row: InventoryBalance) => {
  router.push({
    name: 'inventory-lots',
    query: {
      product_id: row.product_id,
      warehouse_id: row.warehouse_id
    }
  })
}

// 导出Excel
const handleExport = () => {
  exporting.value = true
  // TODO: 实现导出功能
  setTimeout(() => {
    exporting.value = false
    ElMessage.success(localeStore.isEnglish ? 'Export is not implemented yet' : '导出功能待实现')
  }, 1000)
}

// 产品跨仓库汇总
const totalAvailable = computed(() => {
  return currentProductBalances.value.reduce((sum, item) => sum + item.available_quantity, 0)
})

const totalReserved = computed(() => {
  return currentProductBalances.value.reduce((sum, item) => sum + item.reserved_quantity, 0)
})

const totalDamaged = computed(() => {
  return currentProductBalances.value.reduce((sum, item) => sum + item.damaged_quantity, 0)
})

const totalQuantity = computed(() => {
  return currentProductBalances.value.reduce((sum, item) => sum + item.total_quantity, 0)
})

const currentWarehouseDisplay = computed(() => {
  if (!currentBalance.value?.warehouse) return '-'
  const warehouse = currentBalance.value.warehouse
  return warehouse.code ? `${warehouse.name || '-'}（${warehouse.code}）` : (warehouse.name || '-')
})

const detailStatusCards = computed(() => {
  if (!currentBalance.value) return []
  return [
    {
      key: 'purchasing',
      label: localeStore.isEnglish ? 'Purchasing In Transit' : '采购在途',
      value: currentBalance.value.purchasing_in_transit || 0,
      className: 'summary-value--primary'
    },
    {
      key: 'inspection',
      label: localeStore.isEnglish ? 'Pending Inspection' : '待检库存',
      value: currentBalance.value.pending_inspection || 0,
      className: 'summary-value--warning'
    },
    {
      key: 'raw',
      label: localeStore.isEnglish ? 'Raw Material' : '原料库存',
      value: currentBalance.value.raw_material || 0,
      className: 'summary-value--positive'
    },
    {
      key: 'pending',
      label: localeStore.isEnglish ? 'Pending Shipment' : '待出库存',
      value: currentBalance.value.pending_shipment || 0,
      className: ''
    },
    {
      key: 'logistics',
      label: localeStore.isEnglish ? 'Logistics In Transit' : '物流在途',
      value: currentBalance.value.logistics_in_transit || 0,
      className: 'summary-value--primary'
    },
    {
      key: 'sellable',
      label: localeStore.isEnglish ? 'Sellable' : '可售库存',
      value: currentBalance.value.sellable || 0,
      className: 'summary-value--positive'
    },
    {
      key: 'returned',
      label: localeStore.isEnglish ? 'Returned' : '退货库存',
      value: currentBalance.value.returned || 0,
      className: 'summary-value--warning'
    },
    {
      key: 'damaged',
      label: localeStore.isEnglish ? 'Damaged' : '损坏库存',
      value: currentBalance.value.damaged_quantity || 0,
      className: 'summary-value--danger'
    }
  ]
})

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.inventory-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 18px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 20px;
}

.search-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 18px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #fafafa;
}

.search-toolbar__intro {
  min-width: 220px;
}

.search-toolbar__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.search-toolbar__meta {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.search-form__keyword :deep(.el-input) {
  width: 260px;
}

.search-form__actions {
  margin-left: auto;
}

.detail-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section-card {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 14px;
  background: #fff;
}

.detail-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.detail-section-subtitle {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.detail-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.detail-hero-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-hero-code {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.detail-hero-title {
  color: #606266;
  font-size: 14px;
}

.detail-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #909399;
  font-size: 13px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.summary-grid--dialog {
  margin-top: 20px;
}

.summary-tile {
  padding: 14px 16px;
  border-radius: 12px;
  background: #f7f9fc;
}

.summary-label {
  color: #909399;
  font-size: 12px;
}

.summary-value {
  margin-top: 8px;
  color: #303133;
  font-size: 22px;
  font-weight: 600;
}

.summary-value--primary {
  color: #409eff;
}

.summary-value--positive {
  color: #67c23a;
}

.summary-value--warning {
  color: #e6a23c;
}

.summary-value--danger {
  color: #f56c6c;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.info-item {
  padding: 14px 16px;
  border-radius: 12px;
  background: #fafafa;
}

.info-label {
  color: #909399;
  font-size: 12px;
}

.info-value {
  margin-top: 8px;
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

/* 库存数量单元格样式 */
.stock-cell {
  color: #c0c4cc;
  font-weight: 500;
}

.stock-cell.has-value {
  color: #303133;
  font-weight: 600;
}

.stock-cell.sellable.has-value {
  color: #67c23a;
}

.stock-cell.returned.has-value {
  color: #e6a23c;
}

.stock-cell.damaged.has-value {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .search-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-form__actions {
    margin-left: 0;
  }

  .search-form__keyword {
    width: 100%;
  }

  .search-form__keyword :deep(.el-input) {
    width: 100%;
  }
}
</style>
