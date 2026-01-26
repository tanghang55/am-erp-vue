<template>
  <div class="movement-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">{{ labels.title }}</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreate">
              <el-icon><Plus /></el-icon>
              {{ labels.create }}
            </el-button>
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
        <el-form-item :label="labels.movementType">
          <el-select
            v-model="searchForm.movement_type"
            :placeholder="labels.allTypes"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="(config, type) in MOVEMENT_TYPE_CONFIG"
              :key="type"
              :label="getMovementTypeLabel(type as MovementType)"
              :value="type"
            >
              <span>{{ config.icon }} {{ getMovementTypeLabel(type as MovementType) }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="labels.to"
            :start-placeholder="labels.startDate"
            :end-placeholder="labels.endDate"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 快速筛选标签 -->
      <div class="quick-filters">
        <el-tag
          v-for="(config, type) in MOVEMENT_TYPE_CONFIG"
          :key="type"
          :type="config.color"
          :effect="searchForm.movement_type === type ? 'dark' : 'plain'"
          style="cursor: pointer; margin-right: 8px; margin-bottom: 8px"
          @click="handleQuickFilter(type as MovementType)"
        >
          {{ config.icon }} {{ getMovementTypeLabel(type as MovementType) }}
        </el-tag>
        <el-tag
          v-if="searchForm.movement_type"
          type="info"
          style="cursor: pointer"
          @click="handleClearFilter"
        >
          {{ labels.clearFilter }}
        </el-tag>
      </div>

      <!-- 数据表格 -->
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column :label="labels.movementType" width="140">
          <template #default="{ row }">
            <el-tag
              :type="MOVEMENT_TYPE_CONFIG[row.movement_type]?.color"
              size="small"
            >
              {{ MOVEMENT_TYPE_CONFIG[row.movement_type]?.icon }}
              {{ getMovementTypeLabel(row.movement_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.skuInfo" min-width="200">
          <template #default="{ row }">
            <div v-if="row.sku">
              <div style="font-weight: bold">{{ row.sku.seller_sku }}</div>
              <div style="font-size: 12px; color: #909399">ASIN: {{ row.sku.asin }}</div>
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
        <el-table-column :label="labels.quantity" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.quantity > 0 ? 'success' : 'danger'"
              size="large"
            >
              {{ row.quantity > 0 ? '+' : '' }}{{ row.quantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.stockChange" width="180">
          <template #default="{ row }">
            <div style="font-size: 12px">
              <div>{{ labels.available }}: {{ row.before_available ?? '-' }} → {{ row.after_available ?? '-' }}</div>
              <div v-if="row.before_reserved > 0 || row.after_reserved > 0">
                {{ labels.reserved }}: {{ row.before_reserved ?? '-' }} → {{ row.after_reserved ?? '-' }}
              </div>
              <div v-if="row.before_damaged > 0 || row.after_damaged > 0">
                {{ labels.damaged }}: {{ row.before_damaged ?? '-' }} → {{ row.after_damaged ?? '-' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.cost" width="120" align="right">
          <template #default="{ row }">
            <div v-if="row.unit_cost">
              <div style="font-size: 12px; color: #909399">{{ labels.unitCost }}: ¥{{ row.unit_cost }}</div>
              <div style="font-weight: bold">{{ labels.totalCost }}: ¥{{ row.total_cost }}</div>
            </div>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.reference" width="150">
          <template #default="{ row }">
            <div v-if="row.reference_number" style="font-size: 12px">
              <div style="color: #909399">{{ row.reference_type || labels.referenceLabel }}</div>
              <div style="font-weight: bold">{{ row.reference_number }}</div>
            </div>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.operatorInfo" width="160">
          <template #default="{ row }">
            <div style="font-size: 12px">
              <div v-if="row.operator">
                {{ row.operator.real_name || row.operator.username }}
              </div>
              <div style="color: #909399">{{ formatDateTime(row.operated_at) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="labels.remark" min-width="150" show-overflow-tooltip />
        <el-table-column :label="labels.actions" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ labels.viewDetail }}</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" :title="labels.detailTitle" width="800px">
      <el-descriptions :column="2" border v-if="currentMovement">
        <el-descriptions-item :label="labels.movementId">
          {{ currentMovement.id }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.traceId">
          <el-tag v-if="currentMovement.trace_id" type="info" size="small">
            {{ currentMovement.trace_id }}
          </el-tag>
          <span v-else style="color: #909399">-</span>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.movementType" :span="2">
          <el-tag :type="MOVEMENT_TYPE_CONFIG[currentMovement.movement_type]?.color">
            {{ MOVEMENT_TYPE_CONFIG[currentMovement.movement_type]?.icon }}
            {{ getMovementTypeLabel(currentMovement.movement_type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.skuInfo" :span="2">
          <div v-if="currentMovement.sku">
            <div style="font-weight: bold">{{ currentMovement.sku.seller_sku }}</div>
            <div style="font-size: 12px; color: #909399">
              ASIN: {{ currentMovement.sku.asin }}
            </div>
            <div style="font-size: 12px; color: #606266">
              {{ currentMovement.sku.title }}
            </div>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.warehouse" :span="2">
          <div v-if="currentMovement.warehouse">
            {{ currentMovement.warehouse.code }} - {{ currentMovement.warehouse.name }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.quantityChange">
          <el-tag
            :type="currentMovement.quantity > 0 ? 'success' : 'danger'"
            size="large"
          >
            {{ currentMovement.quantity > 0 ? '+' : '' }}{{ currentMovement.quantity }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.unitCost">
          {{ currentMovement.unit_cost ? '¥' + currentMovement.unit_cost : '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.totalCost" :span="2">
          {{ currentMovement.total_cost ? '¥' + currentMovement.total_cost : '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.availableChange" :span="2">
          <el-tag type="info">{{ currentMovement.before_available ?? '-' }}</el-tag>
          <el-icon style="margin: 0 8px"><Right /></el-icon>
          <el-tag type="success">{{ currentMovement.after_available ?? '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.reservedChange" :span="2">
          <el-tag type="info">{{ currentMovement.before_reserved ?? '-' }}</el-tag>
          <el-icon style="margin: 0 8px"><Right /></el-icon>
          <el-tag type="warning">{{ currentMovement.after_reserved ?? '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.damagedChange" :span="2">
          <el-tag type="info">{{ currentMovement.before_damaged ?? '-' }}</el-tag>
          <el-icon style="margin: 0 8px"><Right /></el-icon>
          <el-tag type="danger">{{ currentMovement.after_damaged ?? '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.referenceType">
          {{ currentMovement.reference_type || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.referenceNumber">
          {{ currentMovement.reference_number || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.referenceId">
          {{ currentMovement.reference_id || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.operator">
          <span v-if="currentMovement.operator">
            {{ currentMovement.operator.real_name || currentMovement.operator.username }}
          </span>
          <span v-else style="color: #909399">-</span>
        </el-descriptions-item>
        <el-descriptions-item :label="labels.operatedAt" :span="2">
          {{ currentMovement.operated_at }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.createdAt" :span="2">
          {{ currentMovement.created_at }}
        </el-descriptions-item>
        <el-descriptions-item :label="labels.remark" :span="2">
          {{ currentMovement.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Download, Right } from '@element-plus/icons-vue'
import { getMovementList } from '../api'
import type { InventoryMovement, MovementType } from '../types'
import { MOVEMENT_TYPE_CONFIG } from '../types'
import WarehouseSelector from '../components/WarehouseSelector.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const router = useRouter()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Inventory Movements',
      create: 'Create Movement',
      export: 'Export Excel',
      warehouse: 'Warehouse',
      allWarehouses: 'All Warehouses',
      sku: 'SKU',
      keywordPlaceholder: 'SKU/ASIN',
      movementType: 'Movement Type',
      allTypes: 'All Types',
      dateRange: 'Date Range',
      to: 'to',
      startDate: 'Start Date',
      endDate: 'End Date',
      search: 'Search',
      reset: 'Reset',
      clearFilter: 'Clear Filter',
      skuInfo: 'SKU Info',
      quantity: 'Quantity',
      stockChange: 'Stock Change',
      available: 'Available',
      reserved: 'Reserved',
      damaged: 'Damaged',
      cost: 'Cost',
      unitCost: 'Unit Cost',
      totalCost: 'Total Cost',
      reference: 'Reference',
      referenceLabel: 'Document',
      operatorInfo: 'Operator',
      remark: 'Remark',
      actions: 'Actions',
      viewDetail: 'Details',
      detailTitle: 'Movement Details',
      movementId: 'Movement ID',
      traceId: 'Trace ID',
      quantityChange: 'Quantity Change',
      availableChange: 'Available Change',
      reservedChange: 'Reserved Change',
      damagedChange: 'Damaged Change',
      referenceType: 'Reference Type',
      referenceNumber: 'Reference Number',
      referenceId: 'Reference ID',
      operator: 'Operator',
      operatedAt: 'Operated At',
      createdAt: 'Created At',
      loadFail: 'Failed to load movement list',
      exportTodo: 'Export is not implemented yet'
    }
  }
  return {
    title: '库存流水',
    create: '创建流水',
    export: '导出Excel',
    warehouse: '仓库',
    allWarehouses: '全部仓库',
    sku: 'SKU',
    keywordPlaceholder: 'SKU/ASIN',
    movementType: '流水类型',
    allTypes: '全部类型',
    dateRange: '日期范围',
    to: '至',
    startDate: '开始日期',
    endDate: '结束日期',
    search: '搜索',
    reset: '重置',
    clearFilter: '清除筛选',
    skuInfo: 'SKU信息',
    quantity: '数量',
    stockChange: '库存变化',
    available: '可用',
    reserved: '预留',
    damaged: '损坏',
    cost: '成本',
    unitCost: '单价',
    totalCost: '总计',
    reference: '关联单据',
    referenceLabel: '单据',
    operatorInfo: '操作信息',
    remark: '备注',
    actions: '操作',
    viewDetail: '查看详情',
    detailTitle: '流水详情',
    movementId: '流水ID',
    traceId: '追踪ID',
    quantityChange: '数量变化',
    availableChange: '可用数量变化',
    reservedChange: '预留数量变化',
    damagedChange: '损坏数量变化',
    referenceType: '关联单据类型',
    referenceNumber: '关联单据号',
    referenceId: '关联单据ID',
    operator: '操作人',
    operatedAt: '操作时间',
    createdAt: '创建时间',
    loadFail: '加载流水列表失败',
    exportTodo: '导出功能待实现'
  }
})

const movementTypeLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      PURCHASE_RECEIPT: 'Purchase Receipt',
      SALES_SHIPMENT: 'Sales Shipment',
      STOCK_TAKE_ADJUSTMENT: 'Stock Take Adjustment',
      MANUAL_ADJUSTMENT: 'Manual Adjustment',
      DAMAGE_WRITE_OFF: 'Damage Write-off',
      RETURN_RECEIPT: 'Return Receipt',
      TRANSFER_OUT: 'Transfer Out',
      TRANSFER_IN: 'Transfer In',
      PURCHASE_SHIP: 'Purchase Ship',
      WAREHOUSE_RECEIVE: 'Warehouse Receive',
      INSPECTION_PASS: 'Inspection Pass',
      INSPECTION_FAIL: 'Inspection Fail',
      ASSEMBLY_COMPLETE: 'Assembly Complete',
      LOGISTICS_SHIP: 'Logistics Ship',
      PLATFORM_RECEIVE: 'Platform Receive',
      RETURN_INSPECT: 'Return Inspect'
    }
  }
  return {
    PURCHASE_RECEIPT: '采购入库',
    SALES_SHIPMENT: '销售出库',
    STOCK_TAKE_ADJUSTMENT: '盘点调整',
    MANUAL_ADJUSTMENT: '手工调整',
    DAMAGE_WRITE_OFF: '损坏报损',
    RETURN_RECEIPT: '退货入库',
    TRANSFER_OUT: '调拨出库',
    TRANSFER_IN: '调拨入库',
    PURCHASE_SHIP: '供应商发货',
    WAREHOUSE_RECEIVE: '到仓收货',
    INSPECTION_PASS: '质检通过',
    INSPECTION_FAIL: '质检不合格',
    ASSEMBLY_COMPLETE: '组装完成',
    LOGISTICS_SHIP: '物流发货',
    PLATFORM_RECEIVE: '平台上架',
    RETURN_INSPECT: '退货质检'
  }
})

const getMovementTypeLabel = (type: MovementType) => {
  return (movementTypeLabels.value as Record<string, string>)[type] || type
}

// 列表数据
const list = ref<InventoryMovement[]>([])
const loading = ref(false)

// 从URL获取初始筛选参数
const route = router.currentRoute.value
const initialWarehouseId = route.query.warehouse_id
  ? Number(route.query.warehouse_id)
  : null
const initialSkuId = route.query.sku_id ? Number(route.query.sku_id) : null

// 搜索表单
const searchForm = reactive({
  warehouse_id: initialWarehouseId,
  keyword: '',
  movement_type: '' as MovementType | '',
  sku_id: initialSkuId
})

// 日期范围
const dateRange = ref<[string, string] | null>(null)

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 详情对话框
const detailVisible = ref(false)
const currentMovement = ref<InventoryMovement | null>(null)

// 导出状态
const exporting = ref(false)

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  return dateTime.replace('T', ' ').substring(0, 16)
}

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const res = await getMovementList({
      page: pagination.page,
      page_size: pagination.page_size,
      warehouse_id: searchForm.warehouse_id || undefined,
      sku_id: searchForm.sku_id || undefined,
      movement_type: searchForm.movement_type || undefined,
      date_from: dateRange.value?.[0],
      date_to: dateRange.value?.[1]
    })

    if (res.data) {
      list.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('Failed to load movement list:', error)
    ElMessage.error(labels.value.loadFail)
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
    movement_type: '',
    sku_id: null
  })
  dateRange.value = null
  handleSearch()
}

// 快速筛选
const handleQuickFilter = (type: MovementType) => {
  searchForm.movement_type = type
  handleSearch()
}

// 清除筛选
const handleClearFilter = () => {
  searchForm.movement_type = ''
  handleSearch()
}

// 查看详情
const handleView = (row: InventoryMovement) => {
  currentMovement.value = row
  detailVisible.value = true
}

// 创建流水
const handleCreate = () => {
  router.push('/inventory/movements/create')
}

// 导出Excel
const handleExport = () => {
  exporting.value = true
  // TODO: 实现导出功能
  setTimeout(() => {
    exporting.value = false
    ElMessage.success(labels.value.exportTodo)
  }, 1000)
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.movement-list {
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

.quick-filters {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
