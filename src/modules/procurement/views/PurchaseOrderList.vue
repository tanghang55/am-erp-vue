<template>
  <div class="purchase-order-list">
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
              v-for="(config, status) in PURCHASE_ORDER_STATUS_CONFIG"
              :key="status"
              :label="getStatusLabel(status)"
              :value="status"
            >
              <span>{{ config.icon }} {{ getStatusLabel(status) }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.keyword">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="labels.keywordPlaceholder"
            clearable
            style="width: 200px"
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
          v-for="(config, status) in PURCHASE_ORDER_STATUS_CONFIG"
          :key="status"
          :type="config.color"
          :effect="searchForm.status === status ? 'dark' : 'plain'"
          style="cursor: pointer; margin-right: 8px; margin-bottom: 8px"
          @click="handleQuickFilter(status)"
        >
          {{ config.icon }} {{ config.label }}
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
        <el-table-column prop="po_number" :label="labels.poNumber" width="180" />
        <el-table-column :label="labels.status" width="120">
          <template #default="{ row }">
            <el-tag :type="PURCHASE_ORDER_STATUS_CONFIG[row.status]?.color">
              {{ PURCHASE_ORDER_STATUS_CONFIG[row.status]?.icon }}
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.supplier" width="200">
          <template #default="{ row }">
            <span v-if="row.supplier">{{ row.supplier.name }}</span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="marketplace" :label="labels.marketplace" width="80" align="center" />
        <el-table-column :label="labels.totalAmount" width="140" align="right">
          <template #default="{ row }">
            <span style="font-weight: bold">{{ row.currency }} {{ row.total_amount }}</span>
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
              <div v-if="row.ordered_at">{{ labels.orderedAt }}: {{ formatDate(row.ordered_at) }}</div>
              <div v-if="row.shipped_at">{{ labels.shippedAt }}: {{ formatDate(row.shipped_at) }}</div>
              <div v-if="row.received_at">{{ labels.receivedAt }}: {{ formatDate(row.received_at) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="labels.remark" min-width="150" show-overflow-tooltip />
        <el-table-column prop="created_at" :label="labels.createdAt" width="160" />
        <el-table-column :label="labels.actions" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ labels.view }}</el-button>
            <el-button
              v-if="row.status === 'DRAFT'"
              size="small"
              type="primary"
              @click="handleEdit(row)"
            >
              {{ labels.edit }}
            </el-button>
            <el-button
              v-if="row.status === 'DRAFT'"
              size="small"
              type="success"
              @click="handleSubmit(row)"
            >
              {{ labels.submit }}
            </el-button>
            <el-button
              v-if="row.status === 'ORDERED'"
              size="small"
              type="warning"
              @click="handleMarkShipped(row)"
            >
              {{ labels.markShipped }}
            </el-button>
            <el-button
              v-if="row.status === 'SHIPPED'"
              size="small"
              type="success"
              @click="handleReceive(row)"
            >
              {{ labels.receive }}
            </el-button>
            <el-button
              v-if="row.status === 'DRAFT'"
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              {{ labels.delete }}
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

    <!-- 到货验收对话框 -->
    <el-dialog v-model="receiveDialogVisible" :title="labels.receiveTitle" width="600px">
      <el-form :model="receiveForm" label-width="120px">
        <el-form-item :label="labels.receiveWarehouse" required>
          <warehouse-selector
            v-model="receiveForm.warehouse_id"
            :placeholder="labels.receiveWarehousePlaceholder"
            style="width: 100%"
          />
        </el-form-item>
        <el-divider>{{ labels.receiveQty }}</el-divider>
        <div v-if="currentPO">
          <el-form-item
            v-for="item in currentPO.items"
            :key="item.id"
            :label="item.sku?.seller_sku"
          >
            <el-input-number
              v-model="receiveForm.received_qties[item.id]"
              :min="0"
              :max="item.qty_ordered"
              :placeholder="`${labels.orderedQty}: ${item.qty_ordered}`"
              style="width: 100%"
            />
            <div class="form-tip">{{ labels.orderedQty }}: {{ item.qty_ordered }}</div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="receiveDialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button
          type="primary"
          @click="handleConfirmReceive"
          :loading="submitting"
        >
          {{ labels.confirmReceive }}
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
  getPurchaseOrderList,
  submitPurchaseOrder,
  markPurchaseOrderShipped,
  receivePurchaseOrder,
  deletePurchaseOrder
} from '../api'
import type { PurchaseOrder, PurchaseOrderStatus } from '../types'
import { PURCHASE_ORDER_STATUS_CONFIG } from '../types'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const router = useRouter()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Purchase Orders',
      create: 'New PO',
      export: 'Export Excel',
      status: 'Status',
      allStatus: 'All Status',
      keyword: 'Keyword',
      keywordPlaceholder: 'PO number/remark',
      search: 'Search',
      reset: 'Reset',
      clearFilter: 'Clear Filter',
      poNumber: 'PO Number',
      supplier: 'Supplier',
      marketplace: 'Marketplace',
      totalAmount: 'Total',
      skuCount: 'SKU Count',
      timeline: 'Timeline',
      orderedAt: 'Ordered',
      shippedAt: 'Shipped',
      receivedAt: 'Received',
      remark: 'Remark',
      createdAt: 'Created At',
      actions: 'Actions',
      view: 'View',
      edit: 'Edit',
      submit: 'Submit',
      markShipped: 'Mark Shipped',
      receive: 'Receive',
      delete: 'Delete',
      receiveTitle: 'Receive',
      receiveWarehouse: 'Warehouse',
      receiveWarehousePlaceholder: 'Select warehouse',
      receiveQty: 'Received Qty',
      orderedQty: 'Ordered Qty',
      cancel: 'Cancel',
      confirmReceive: 'Confirm Receive',
      submitConfirm: 'Submit this purchase order? It cannot be edited after submission.',
      markShippedConfirm: 'Confirm the purchase order is shipped?',
      deleteConfirm: 'Delete this purchase order?',
      confirmTitle: 'Confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      submitted: 'Purchase order submitted',
      markedShipped: 'Marked as shipped',
      receiveSuccess: 'Received successfully. Inventory updated.',
      deleteSuccess: 'Deleted',
      selectWarehouse: 'Please select warehouse',
      loadFail: 'Failed to load purchase orders',
      submitFail: 'Submit failed',
      markShippedFail: 'Operation failed',
      receiveFail: 'Receive failed',
      deleteFail: 'Delete failed',
      exportTodo: 'Export is not implemented yet'
    }
  }
  return {
    title: '采购订单',
    create: '新建采购单',
    export: '导出Excel',
    status: '状态',
    allStatus: '全部状态',
    keyword: '关键词',
    keywordPlaceholder: 'PO号/备注',
    search: '搜索',
    reset: '重置',
    clearFilter: '清除筛选',
    poNumber: '采购单号',
    supplier: '供应商',
    marketplace: '站点',
    totalAmount: '总金额',
    skuCount: 'SKU数量',
    timeline: '时间节点',
    orderedAt: '下单',
    shippedAt: '发货',
    receivedAt: '收货',
    remark: '备注',
    createdAt: '创建时间',
    actions: '操作',
    view: '查看',
    edit: '编辑',
    submit: '提交',
    markShipped: '标记发货',
    receive: '到货验收',
    delete: '删除',
    receiveTitle: '到货验收',
    receiveWarehouse: '入库仓库',
    receiveWarehousePlaceholder: '选择入库仓库',
    receiveQty: '到货数量',
    orderedQty: '订购数量',
    cancel: '取消',
    confirmReceive: '确认验收并入库',
    submitConfirm: '确认提交该采购单？提交后将无法编辑',
    markShippedConfirm: '确认该采购单已发货？',
    deleteConfirm: '确认删除该采购单？',
    confirmTitle: '提示',
    confirmText: '确定',
    cancelText: '取消',
    submitted: '采购单已提交',
    markedShipped: '已标记为发货',
    receiveSuccess: '验收完成，库存已自动入库',
    deleteSuccess: '删除成功',
    selectWarehouse: '请选择入库仓库',
    loadFail: '加载采购单列表失败',
    submitFail: '提交失败',
    markShippedFail: '操作失败',
    receiveFail: '验收失败',
    deleteFail: '删除失败',
    exportTodo: '导出功能待实现'
  }
})

const statusLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      DRAFT: 'Draft',
      ORDERED: 'Ordered',
      SHIPPED: 'Shipped',
      RECEIVED: 'Received',
      CLOSED: 'Closed'
    }
  }
  return {
    DRAFT: '草稿',
    ORDERED: '已下单',
    SHIPPED: '已发货',
    RECEIVED: '已收货',
    CLOSED: '已关闭'
  }
})

// 列表数据
const list = ref<PurchaseOrder[]>([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  status: '' as PurchaseOrderStatus | '',
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

// 到货验收对话框
const receiveDialogVisible = ref(false)
const currentPO = ref<PurchaseOrder | null>(null)
const receiveForm = reactive<{
  warehouse_id: number | null
  received_qties: Record<number, number>
}>({
  warehouse_id: null,
  received_qties: {}
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
    const res = await getPurchaseOrderList({
      page: pagination.page,
      page_size: pagination.page_size,
      status: searchForm.status || undefined,
      keyword: searchForm.keyword || undefined
    })

    if (res.data) {
      list.value = res.data.data
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('Failed to load purchase orders:', error)
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
    keyword: ''
  })
  handleSearch()
}

// 快速筛选
const handleQuickFilter = (status: PurchaseOrderStatus) => {
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
  router.push('/procurement/purchase-orders/create')
}

// 查看详情
const handleView = (row: PurchaseOrder) => {
  router.push(`/procurement/purchase-orders/${row.id}`)
}

// 编辑
const handleEdit = (row: PurchaseOrder) => {
  router.push(`/procurement/purchase-orders/${row.id}/edit`)
}

// 提交采购单
const handleSubmit = async (row: PurchaseOrder) => {
  try {
    await ElMessageBox.confirm(labels.value.submitConfirm, labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'warning'
    })

    await submitPurchaseOrder(row.id)
    ElMessage.success(labels.value.submitted)
    loadList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Submit failed:', error)
      ElMessage.error(error.message || labels.value.submitFail)
    }
  }
}

// 标记发货
const handleMarkShipped = async (row: PurchaseOrder) => {
  try {
    await ElMessageBox.confirm(labels.value.markShippedConfirm, labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'warning'
    })

    await markPurchaseOrderShipped(row.id)
    ElMessage.success(labels.value.markedShipped)
    loadList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Mark shipped failed:', error)
      ElMessage.error(error.message || labels.value.markShippedFail)
    }
  }
}

// 到货验收
const handleReceive = (row: PurchaseOrder) => {
  currentPO.value = row
  receiveForm.warehouse_id = null
  receiveForm.received_qties = {}
  // 初始化到货数量为订购数量
  row.items?.forEach(item => {
    receiveForm.received_qties[item.id] = item.qty_ordered
  })
  receiveDialogVisible.value = true
}

// 确认验收
const handleConfirmReceive = async () => {
  if (!receiveForm.warehouse_id) {
    ElMessage.error(labels.value.selectWarehouse)
    return
  }

  if (!currentPO.value) return

  submitting.value = true
  try {
    await receivePurchaseOrder(currentPO.value.id, {
      warehouse_id: receiveForm.warehouse_id,
      received_qties: receiveForm.received_qties
    })

    ElMessage.success(labels.value.receiveSuccess)
    receiveDialogVisible.value = false
    loadList()
  } catch (error: any) {
    console.error('Receive failed:', error)
    ElMessage.error(error.message || labels.value.receiveFail)
  } finally {
    submitting.value = false
  }
}

// 删除
const handleDelete = async (row: PurchaseOrder) => {
  try {
    await ElMessageBox.confirm(labels.value.deleteConfirm, labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'warning'
    })

    await deletePurchaseOrder(row.id)
    ElMessage.success(labels.value.deleteSuccess)
    loadList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
      ElMessage.error(error.message || labels.value.deleteFail)
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

const getStatusLabel = (status: PurchaseOrderStatus) => {
  return (statusLabels.value as Record<string, string>)[status] || status
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.purchase-order-list {
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
