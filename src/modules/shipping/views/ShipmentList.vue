<template>
  <div class="shipment-list">
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
        <el-form-item :label="labels.status">
          <el-select
            v-model="searchForm.status"
            :placeholder="labels.allStatus"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="(config, status) in SHIPMENT_STATUS_CONFIG"
              :key="status"
              :label="getStatusLabel(status as ShipmentStatus)"
              :value="status"
            >
              <span>{{ config.icon }} {{ getStatusLabel(status as ShipmentStatus) }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.warehouse">
          <warehouse-selector
            v-model="searchForm.warehouse_id"
            :placeholder="labels.allWarehouses"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item :label="labels.keyword">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="labels.keywordPlaceholder"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
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
          v-for="(config, status) in SHIPMENT_STATUS_CONFIG"
          :key="status"
          :type="config.color"
          :effect="searchForm.status === status ? 'dark' : 'plain'"
          style="cursor: pointer; margin-right: 8px; margin-bottom: 8px"
          @click="handleQuickFilter(status)"
        >
          {{ config.icon }} {{ getStatusLabel(status as ShipmentStatus) }}
        </el-tag>
        <el-tag
          v-if="searchForm.status"
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
        <el-table-column prop="shipment_number" :label="labels.shipmentNumber" width="180" />
        <el-table-column :label="labels.status" width="120">
          <template #default="{ row }">
            <el-tag :type="SHIPMENT_STATUS_CONFIG[row.status]?.color">
              {{ SHIPMENT_STATUS_CONFIG[row.status]?.icon }}
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_number" :label="labels.orderNumber" width="150" show-overflow-tooltip />
        <el-table-column :label="labels.warehouse" width="150">
          <template #default="{ row }">
            <span v-if="row.warehouse">{{ row.warehouse.name }}</span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.logistics" width="200">
          <template #default="{ row }">
            <div style="font-size: 12px">
              <div v-if="row.carrier">{{ labels.carrier }}: {{ row.carrier }}</div>
              <div v-if="row.tracking_number">{{ labels.trackingNumber }}: {{ row.tracking_number }}</div>
              <div v-if="!row.carrier && !row.tracking_number" style="color: #909399">-</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.skuCount" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.items?.length || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.timeline" width="180">
          <template #default="{ row }">
            <div style="font-size: 12px">
              <div v-if="row.shipped_at">{{ labels.shippedAt }}: {{ formatDate(row.shipped_at) }}</div>
              <div v-if="row.delivered_at">{{ labels.deliveredAt }}: {{ formatDate(row.delivered_at) }}</div>
              <div v-if="!row.shipped_at && !row.delivered_at" style="color: #909399">-</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="labels.remark" min-width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" :label="labels.createdAt" width="160" />
        <el-table-column :label="labels.actions" width="300" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ labels.view }}</el-button>
            <el-button
              v-if="row.status === 'PENDING'"
              size="small"
              type="primary"
              @click="handleEdit(row)"
            >
              {{ labels.edit }}
            </el-button>
            <el-button
              v-if="row.status === 'PENDING' || row.status === 'PROCESSING'"
              size="small"
              type="success"
              @click="handleMarkShipped(row)"
            >
              {{ labels.markShipped }}
            </el-button>
            <el-button
              v-if="row.status === 'SHIPPED'"
              size="small"
              type="success"
              @click="handleMarkDelivered(row)"
            >
              {{ labels.markDelivered }}
            </el-button>
            <el-button
              v-if="['PENDING', 'PROCESSING', 'SHIPPED'].includes(row.status)"
              size="small"
              type="danger"
              @click="handleCancel(row)"
            >
              {{ labels.cancel }}
            </el-button>
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

    <!-- 标记发货对话框 -->
    <el-dialog v-model="shipDialogVisible" :title="labels.markShipped" width="500px">
      <el-form :model="shipForm" label-width="120px">
        <el-form-item :label="labels.carrier">
          <el-input v-model="shipForm.carrier" :placeholder="labels.carrierPlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.trackingNumber">
          <el-input v-model="shipForm.tracking_number" :placeholder="labels.trackingPlaceholder" />
        </el-form-item>
        <el-form-item :label="labels.shippingCost">
          <el-input-number
            v-model="shipForm.shipping_cost"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">{{ labels.cancelText }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirmShip">
          {{ labels.confirmText }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
import {
  getShipmentList,
  markShipped,
  markDelivered,
  cancelShipment
} from '../api'
import type { Shipment, ShipmentStatus } from '../types'
import { SHIPMENT_STATUS_CONFIG } from '../types'
import type { MarkShippedParams } from '../api'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const router = useRouter()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Shipments',
      create: 'New Shipment',
      export: 'Export Excel',
      status: 'Status',
      allStatus: 'All Status',
      warehouse: 'Warehouse',
      allWarehouses: 'All Warehouses',
      keyword: 'Keyword',
      keywordPlaceholder: 'Shipment/Order/Tracking',
      search: 'Search',
      reset: 'Reset',
      clearFilter: 'Clear Filter',
      shipmentNumber: 'Shipment No.',
      orderNumber: 'Order No.',
      logistics: 'Logistics',
      carrier: 'Carrier',
      trackingNumber: 'Tracking',
      carrierPlaceholder: 'Enter carrier name',
      trackingPlaceholder: 'Enter tracking number',
      shippingCost: 'Shipping Cost',
      skuCount: 'SKU Count',
      timeline: 'Timeline',
      shippedAt: 'Shipped',
      deliveredAt: 'Delivered',
      remark: 'Remark',
      createdAt: 'Created At',
      actions: 'Actions',
      view: 'View',
      edit: 'Edit',
      markShipped: 'Mark Shipped',
      markDelivered: 'Mark Delivered',
      cancel: 'Cancel',
      confirmTitle: 'Confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      markShippedConfirm: 'Confirm shipment is shipped?',
      markDeliveredConfirm: 'Confirm shipment is delivered?',
      cancelConfirm: 'Cancel this shipment? Inventory must be restored manually.',
      markedShipped: 'Marked as shipped',
      markedDelivered: 'Marked as delivered',
      cancelled: 'Shipment cancelled',
      loadFail: 'Failed to load shipments',
      actionFail: 'Operation failed',
      cancelFail: 'Cancel failed',
      exportTodo: 'Export is not implemented yet'
    }
  }
  return {
    title: '发货单管理',
    create: '新建发货单',
    export: '导出Excel',
    status: '状态',
    allStatus: '全部状态',
    warehouse: '仓库',
    allWarehouses: '全部仓库',
    keyword: '关键词',
    keywordPlaceholder: '发货单号/订单号/追踪号',
    search: '搜索',
    reset: '重置',
    clearFilter: '清除筛选',
    shipmentNumber: '发货单号',
    orderNumber: '订单号',
    logistics: '物流信息',
    carrier: '承运商',
    trackingNumber: '追踪号',
    carrierPlaceholder: '输入承运商名称',
    trackingPlaceholder: '输入物流追踪号',
    shippingCost: '运费',
    skuCount: 'SKU数量',
    timeline: '时间节点',
    shippedAt: '发货',
    deliveredAt: '签收',
    remark: '备注',
    createdAt: '创建时间',
    actions: '操作',
    view: '查看',
    edit: '编辑',
    markShipped: '标记发货',
    markDelivered: '标记签收',
    cancel: '取消',
    confirmTitle: '提示',
    confirmText: '确定',
    cancelText: '取消',
    markShippedConfirm: '确认该发货单已发货？',
    markDeliveredConfirm: '确认该发货单已签收？',
    cancelConfirm: '确认取消该发货单？注意：取消后需要手动恢复库存',
    markedShipped: '已标记为发货',
    markedDelivered: '已标记为签收',
    cancelled: '发货单已取消',
    loadFail: '加载发货单列表失败',
    actionFail: '操作失败',
    cancelFail: '取消失败',
    exportTodo: '导出功能待实现'
  }
})

const statusLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      PENDING: 'Pending',
      PROCESSING: 'Processing',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled'
    }
  }
  return {
    PENDING: '待处理',
    PROCESSING: '处理中',
    SHIPPED: '已发货',
    DELIVERED: '已签收',
    CANCELLED: '已取消'
  }
})

const getStatusLabel = (status: ShipmentStatus) => {
  return (statusLabels.value as Record<string, string>)[status] || status
}

// 列表数据
const list = ref<Shipment[]>([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  status: '' as ShipmentStatus | '',
  warehouse_id: null as number | null,
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 导出状态
const exporting = ref(false)

// 标记发货对话框
const shipDialogVisible = ref(false)
const currentShipment = ref<Shipment | null>(null)
const shipForm = reactive({
  carrier: '',
  tracking_number: '',
  shipping_cost: 0
})
const submitting = ref(false)

// 格式化日期
const formatDate = (dateTime: string) => {
  if (!dateTime) return '-'
  return dateTime.substring(0, 10)
}

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const res = await getShipmentList({
      page: pagination.page,
      page_size: pagination.page_size,
      status: searchForm.status || undefined,
      warehouse_id: searchForm.warehouse_id || undefined,
      keyword: searchForm.keyword || undefined
    })

    if (res.data) {
      list.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('Failed to load shipments:', error)
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
    status: '',
    warehouse_id: null,
    keyword: ''
  })
  handleSearch()
}

// 快速筛选
const handleQuickFilter = (status: ShipmentStatus) => {
  searchForm.status = status
  handleSearch()
}

// 清除筛选
const handleClearFilter = () => {
  searchForm.status = ''
  handleSearch()
}

// 新建
const handleCreate = () => {
  router.push('/shipping/shipments/create')
}

// 查看详情
const handleView = (row: Shipment) => {
  router.push(`/shipping/shipments/${row.id}`)
}

// 编辑
const handleEdit = (row: Shipment) => {
  router.push(`/shipping/shipments/${row.id}/edit`)
}

// 标记发货
const handleMarkShipped = (row: Shipment) => {
  currentShipment.value = row
  shipForm.carrier = row.carrier || ''
  shipForm.tracking_number = row.tracking_number || ''
  shipForm.shipping_cost = row.shipping_cost || 0
  shipDialogVisible.value = true
}

// 确认标记发货
const handleConfirmShip = async () => {
  if (!currentShipment.value) return

  submitting.value = true
  try {
    const params: MarkShippedParams = {}
    if (shipForm.carrier) params.carrier = shipForm.carrier
    if (shipForm.tracking_number) params.tracking_number = shipForm.tracking_number
    if (shipForm.shipping_cost) params.shipping_cost = shipForm.shipping_cost

    await markShipped(currentShipment.value.id, params)
    ElMessage.success(labels.value.markedShipped)
    shipDialogVisible.value = false
    loadList()
  } catch (error: any) {
    console.error('Mark shipped failed:', error)
    ElMessage.error(error.message || labels.value.actionFail)
  } finally {
    submitting.value = false
  }
}

// 标记签收
const handleMarkDelivered = async (row: Shipment) => {
  try {
    await ElMessageBox.confirm(labels.value.markDeliveredConfirm, labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'success'
    })

    await markDelivered(row.id)
    ElMessage.success(labels.value.markedDelivered)
    loadList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Mark delivered failed:', error)
      ElMessage.error(error.message || labels.value.actionFail)
    }
  }
}

// 取消发货单
const handleCancel = async (row: Shipment) => {
  try {
    await ElMessageBox.confirm(labels.value.cancelConfirm, labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'warning'
    })

    await cancelShipment(row.id)
    ElMessage.success(labels.value.cancelled)
    loadList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Cancel failed:', error)
      ElMessage.error(error.message || labels.value.cancelFail)
    }
  }
}

// 导出Excel
const handleExport = () => {
  exporting.value = true
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
.shipment-list {
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
