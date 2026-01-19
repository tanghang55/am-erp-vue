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

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item :label="labels.warehouse">
          <warehouse-selector
            v-model="searchForm.warehouse_id"
            :placeholder="labels.allWarehouses"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item :label="labels.sku">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="labels.keywordPlaceholder"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="searchForm.low_stock">{{ labels.lowStock }}</el-checkbox>
          <el-checkbox v-model="searchForm.zero_stock">{{ labels.zeroStock }}</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column :label="labels.skuInfo" min-width="200">
          <template #default="{ row }">
            <div v-if="row.sku">
              <div style="font-weight: bold">{{ row.sku.seller_sku }}</div>
              <div style="font-size: 12px; color: #909399">ASIN: {{ row.sku.asin }}</div>
              <div style="font-size: 12px; color: #606266">{{ row.sku.title }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.warehouse" width="150">
          <template #default="{ row }">
            <div v-if="row.warehouse">
              <div style="font-weight: bold">{{ row.warehouse.code }}</div>
              <div style="font-size: 12px; color: #909399">{{ row.warehouse.name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.availableQty" width="140" align="center">
          <template #default="{ row }">
            <stock-level-indicator :quantity="row.available_quantity" />
          </template>
        </el-table-column>
        <el-table-column prop="reserved_quantity" :label="labels.reserved" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.reserved_quantity > 0" type="warning" size="small">
              {{ row.reserved_quantity }}
            </el-tag>
            <span v-else style="color: #909399">0</span>
          </template>
        </el-table-column>
        <el-table-column prop="damaged_quantity" :label="labels.damaged" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.damaged_quantity > 0" type="danger" size="small">
              {{ row.damaged_quantity }}
            </el-tag>
            <span v-else style="color: #909399">0</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_quantity" :label="labels.total" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.total_quantity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_movement_at" :label="labels.lastMovement" width="160">
          <template #default="{ row }">
            {{ row.last_movement_at || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="labels.actions" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ labels.view }}</el-button>
            <el-button size="small" type="primary" @click="handleViewSkuBalances(row)">
              {{ labels.crossWarehouse }}
            </el-button>
            <el-button size="small" @click="handleViewMovements(row)">{{ labels.movements }}</el-button>
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
    <el-dialog v-model="detailVisible" :title="labels.detailTitle" width="600px">
      <el-descriptions :column="2" border v-if="currentBalance">
        <el-descriptions-item :label="labels.sku" :span="2">
          <div v-if="currentBalance.sku">
            <div style="font-weight: bold">{{ currentBalance.sku.seller_sku }}</div>
            <div style="font-size: 12px; color: #909399">
              ASIN: {{ currentBalance.sku.asin }}
            </div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.warehouse" :span="2">
          <div v-if="currentBalance.warehouse">
            {{ currentBalance.warehouse.code }} - {{ currentBalance.warehouse.name }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.availableQty">
          <stock-level-indicator :quantity="currentBalance.available_quantity" />
        </el-descriptions-item>
        <el-descriptions-item :label="labels.reservedQty">
          <el-tag v-if="currentBalance.reserved_quantity > 0" type="warning">
            {{ currentBalance.reserved_quantity }}
          </el-tag>
          <span v-else>0</span>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.damagedQty">
          <el-tag v-if="currentBalance.damaged_quantity > 0" type="danger">
            {{ currentBalance.damaged_quantity }}
          </el-tag>
          <span v-else>0</span>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.totalQty">
          <el-tag type="info" size="large">{{ currentBalance.total_quantity }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.lastMovementAt" :span="2">
          {{ currentBalance.last_movement_at || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.createdAt" :span="2">
          {{ currentBalance.created_at }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.updatedAt" :span="2">
          {{ currentBalance.updated_at }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- SKU跨仓库库存对话框 -->
    <el-dialog v-model="skuBalancesVisible" :title="labels.skuBalancesTitle" width="800px">
      <div v-if="currentSkuBalances.length > 0">
        <el-table :data="currentSkuBalances" border>
          <el-table-column :label="labels.warehouse" min-width="200">
            <template #default="{ row }">
              <div>
                <div style="font-weight: bold">{{ row.warehouse_code }}</div>
                <div style="font-size: 12px; color: #909399">{{ row.warehouse_name }}</div>
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

        <!-- 汇总 -->
        <div style="margin-top: 20px; padding: 15px; background: #f5f7fa; border-radius: 4px">
          <el-row :gutter="20">
            <el-col :span="6">
              <div style="text-align: center">
                <div style="font-size: 12px; color: #909399">{{ labels.totalAvailable }}</div>
                <div style="font-size: 24px; font-weight: bold; color: #67C23A">
                  {{ totalAvailable }}
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div style="text-align: center">
                <div style="font-size: 12px; color: #909399">{{ labels.totalReserved }}</div>
                <div style="font-size: 24px; font-weight: bold; color: #E6A23C">
                  {{ totalReserved }}
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div style="text-align: center">
                <div style="font-size: 12px; color: #909399">{{ labels.totalDamaged }}</div>
                <div style="font-size: 24px; font-weight: bold; color: #F56C6C">
                  {{ totalDamaged }}
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div style="text-align: center">
                <div style="font-size: 12px; color: #909399">{{ labels.totalStock }}</div>
                <div style="font-size: 24px; font-weight: bold; color: #409EFF">
                  {{ totalQuantity }}
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <el-empty v-else :description="labels.emptySkuBalances" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getBalanceList, getSkuBalances } from '../api'
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
      warehouse: 'Warehouse',
      allWarehouses: 'All Warehouses',
      sku: 'SKU',
      skuInfo: 'SKU Info',
      keywordPlaceholder: 'SKU/ASIN/Title',
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
      movements: 'Movements',
      detailTitle: 'Inventory Balance Details',
      reservedQty: 'Reserved Quantity',
      damagedQty: 'Damaged Quantity',
      totalQty: 'Total Quantity',
      lastMovementAt: 'Last Movement',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      skuBalancesTitle: 'SKU Balances by Warehouse',
      available: 'Available',
      totalAvailable: 'Total Available',
      totalReserved: 'Total Reserved',
      totalDamaged: 'Total Damaged',
      totalStock: 'Total Stock',
      emptySkuBalances: 'No inventory in any warehouse for this SKU.'
    }
  }
  return {
    title: '库存余额',
    export: '导出Excel',
    warehouse: '仓库',
    allWarehouses: '全部仓库',
    sku: 'SKU',
    skuInfo: 'SKU信息',
    keywordPlaceholder: 'SKU/ASIN/标题',
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
    movements: '流水',
    detailTitle: '库存余额详情',
    reservedQty: '预留数量',
    damagedQty: '损坏数量',
    totalQty: '总计数量',
    lastMovementAt: '最后变动时间',
    createdAt: '创建时间',
    updatedAt: '更新时间',
    skuBalancesTitle: 'SKU跨仓库库存分布',
    available: '可用',
    totalAvailable: '总可用',
    totalReserved: '总预留',
    totalDamaged: '总损坏',
    totalStock: '总库存',
    emptySkuBalances: '该SKU在所有仓库都没有库存'
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

// SKU跨仓库库存对话框
const skuBalancesVisible = ref(false)
const currentSkuBalances = ref<any[]>([])

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

// 查看SKU跨仓库库存
const handleViewSkuBalances = async (row: InventoryBalance) => {
  try {
    const res = await getSkuBalances(row.sku_id)
    if (res.data) {
      currentSkuBalances.value = res.data
      skuBalancesVisible.value = true
    }
  } catch (error) {
    console.error('Failed to load SKU balances:', error)
    ElMessage.error(localeStore.isEnglish ? 'Failed to load SKU balances' : '加载SKU库存失败')
  }
}

// 查看流水（跳转到流水页面）
const handleViewMovements = (row: InventoryBalance) => {
  // 跳转到流水页面，传递sku_id和warehouse_id作为筛选条件
  router.push({
    name: 'inventory-movements',
    query: {
      sku_id: row.sku_id,
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

// SKU跨仓库汇总
const totalAvailable = computed(() => {
  return currentSkuBalances.value.reduce((sum, item) => sum + item.available_quantity, 0)
})

const totalReserved = computed(() => {
  return currentSkuBalances.value.reduce((sum, item) => sum + item.reserved_quantity, 0)
})

const totalDamaged = computed(() => {
  return currentSkuBalances.value.reduce((sum, item) => sum + item.damaged_quantity, 0)
})

const totalQuantity = computed(() => {
  return currentSkuBalances.value.reduce((sum, item) => sum + item.total_quantity, 0)
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
  margin-bottom: 20px;
}
</style>
