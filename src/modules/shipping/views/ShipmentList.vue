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
          <el-form-item>
            <warehouse-selector
              v-model="searchForm.warehouse_id"
              :placeholder="labels.allWarehouses"
              clearable
              style="width: 180px"
            />
          </el-form-item>
          <el-form-item class="search-form__actions">
            <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
            <el-button @click="handleReset">{{ labels.reset }}</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column :label="labels.shipmentNumber" min-width="280">
          <template #default="{ row }">
            <div class="shipment-main">
              <div class="shipment-number">{{ row.shipment_number }}</div>
              <div class="shipment-meta">
                <span>{{ labels.orderNumber }} {{ row.order_number || '-' }}</span>
                <span>{{ labels.productCount }} {{ row.items?.length || 0 }}</span>
                <span v-if="row.warehouse">
                  {{ row.warehouse.name || '-' }}<template v-if="row.warehouse.code"> ({{ row.warehouse.code }})</template>
                </span>
              </div>
              <div class="shipment-stock-note">{{ labels.inventoryFlowHint }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.status" width="120">
          <template #default="{ row }">
            <el-tag :type="SHIPMENT_STATUS_CONFIG[row.status]?.color">
              {{ SHIPMENT_STATUS_CONFIG[row.status]?.icon }}
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.receiptStatus" width="120">
          <template #default="{ row }">
            <el-tag :type="SHIPMENT_RECEIPT_STATUS_CONFIG[row.receipt_status]?.color || 'info'">
              {{ getReceiptStatusLabel(row.receipt_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.productInfo" min-width="320">
          <template #default="{ row }">
            <div v-if="getShipmentProducts(row).length > 0" class="product-preview-list">
              <div
                v-for="item in getShipmentProducts(row)"
                :key="item.id"
                class="product-preview-item"
              >
                <div class="product-preview-head">
                  <span class="product-preview-code">{{ item.product?.seller_sku || item.product_id }}</span>
                  <span v-if="item.product?.marketplace" class="product-preview-marketplace">{{ item.product.marketplace }}</span>
                </div>
                <div class="product-preview-title">{{ item.product?.title || '-' }}</div>
                <div v-if="hasProductIdentity(item.product)" class="product-preview-meta">
                  <span v-if="item.product?.asin">{{ labels.asin }}: {{ item.product.asin }}</span>
                  <span v-if="item.product?.fnsku">{{ labels.fnsku }}: {{ item.product.fnsku }}</span>
                </div>
                <div v-if="hasProductSupplier(item.product)" class="product-preview-meta">
                  <span>{{ labels.supplier }}: {{ formatProductSupplier(item.product) }}</span>
                </div>
              </div>
              <div v-if="getHiddenProductCount(row) > 0" class="product-preview-more">
                {{ labels.moreProducts.replace('{count}', String(getHiddenProductCount(row))) }}
              </div>
            </div>
            <div v-else class="product-preview-empty">-</div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.logistics" min-width="240">
          <template #default="{ row }">
            <div class="logistics-block">
              <div v-if="formatLogisticsProvider(row)" class="logistics-line">
                {{ labels.logisticsProvider }}: {{ formatLogisticsProvider(row) }}
              </div>
              <div v-if="formatShippingRate(row)" class="logistics-line">
                {{ labels.shippingRate }}: {{ formatShippingRate(row) }}
              </div>
              <div v-if="row.carrier" class="logistics-line">{{ labels.carrier }}: {{ row.carrier }}</div>
              <div v-if="row.tracking_number" class="logistics-line">{{ labels.trackingNumber }}: {{ row.tracking_number }}</div>
              <div
                v-if="!formatLogisticsProvider(row) && !formatShippingRate(row) && !row.carrier && !row.tracking_number"
                class="logistics-empty"
              >
                -
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.timeline" min-width="210">
          <template #default="{ row }">
            <div class="timeline-block">
              <div v-if="row.ship_date">{{ labels.shippedAt }}: {{ formatDate(row.ship_date) }}</div>
              <div v-if="row.actual_delivery_date">{{ labels.deliveredAt }}: {{ formatDate(row.actual_delivery_date) }}</div>
              <div v-if="!row.ship_date && !row.actual_delivery_date">-</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="labels.remark" min-width="150" show-overflow-tooltip />
        <el-table-column :label="labels.actions" width="430" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ labels.view }}</el-button>
            <el-button
              v-if="canPlatformReceive(row)"
              size="small"
              type="primary"
              plain
              @click="handlePlatformReceive(row)"
            >
              {{ labels.platformReceive }}
            </el-button>
            <el-button
              v-if="canEditShipment(row)"
              size="small"
              type="primary"
              @click="handleEdit(row)"
            >
              {{ labels.edit }}
            </el-button>
            <el-button
              v-if="row.status === 'DRAFT'"
              size="small"
              type="primary"
              @click="handleConfirm(row)"
            >
              {{ labels.confirm }}
            </el-button>
            <el-button
              v-if="row.status === 'CONFIRMED'"
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
              v-if="['DRAFT', 'CONFIRMED'].includes(row.status)"
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
  confirmShipment,
  markShipped,
  markDelivered,
  cancelShipment
} from '../api'
import type { Shipment, ShipmentStatus, ShipmentReceiptStatus } from '../types'
import { SHIPMENT_STATUS_CONFIG, SHIPMENT_RECEIPT_STATUS_CONFIG } from '../types'
import type { MarkShippedParams } from '../api'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import type { ProductSummary } from '@/modules/product/types'

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
      receiptStatus: 'Receipt',
      warehouse: 'Warehouse',
      allWarehouses: 'All Warehouses',
      keyword: 'Keyword',
      keywordPlaceholder: 'Shipment/Order/Tracking',
      search: 'Search',
      reset: 'Reset',
      searchTitle: 'Search Shipments',
      searchDescription: 'Search by shipment number, order number, tracking number, status, and warehouse.',
      shipmentNumber: 'Shipment No.',
      orderNumber: 'Order No.',
      productInfo: 'Products',
      asin: 'ASIN',
      fnsku: 'FNSKU',
      supplier: 'Supplier',
      logisticsProvider: 'Provider',
      shippingRate: 'Rate',
      moreProducts: 'and {count} more products',
      logistics: 'Logistics',
      carrier: 'Carrier',
      trackingNumber: 'Tracking',
      carrierPlaceholder: 'Enter carrier name',
      trackingPlaceholder: 'Enter tracking number',
      shippingCost: 'Shipping Cost',
      inventoryFlowHint: 'Shipment consumes pending shipment stock only. Confirm locks it, ship moves it to in transit.',
      productCount: 'Product Count',
      timeline: 'Timeline',
      shippedAt: 'Shipped',
      deliveredAt: 'Delivered',
      remark: 'Remark',
      createdAt: 'Created At',
      actions: 'Actions',
      view: 'View',
      edit: 'Edit',
      confirm: 'Confirm',
      markShipped: 'Mark Shipped',
      markDelivered: 'Mark Delivered',
      platformReceive: 'Platform Receive',
      cancel: 'Cancel',
      confirmShipmentConfirm: 'Confirm this shipment? Inventory will be locked.',
      confirmTitle: 'Confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      markShippedConfirm: 'Confirm shipment is shipped?',
      markDeliveredConfirm: 'Confirm shipment is delivered?',
      cancelConfirm: 'Cancel this shipment? Locked inventory will be released automatically.',
      confirmed: 'Shipment confirmed',
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
    receiptStatus: '接收状态',
    warehouse: '仓库',
    allWarehouses: '全部仓库',
    keyword: '关键词',
    keywordPlaceholder: '发货单号/订单号/追踪号',
    search: '搜索',
    reset: '重置',
      searchTitle: '搜索发货单',
      searchDescription: '按发货单号、订单号、追踪号、状态和仓库快速定位发货单。',
      shipmentNumber: '发货单号',
    orderNumber: '订单号',
    productInfo: '产品信息',
    asin: 'ASIN',
    fnsku: 'FNSKU',
    supplier: '供应商',
    logisticsProvider: '物流商',
    shippingRate: '报价/服务',
    moreProducts: '等 {count} 个产品',
    logistics: '物流信息',
    carrier: '承运商',
    trackingNumber: '追踪号',
    carrierPlaceholder: '输入承运商名称',
    trackingPlaceholder: '输入物流追踪号',
    shippingCost: '运费',
    inventoryFlowHint: '发货只消耗待出库存。确认时锁定待出，标记发货后转为在途。',
    productCount: '产品数量',
    timeline: '时间节点',
    shippedAt: '发货',
    deliveredAt: '签收',
    remark: '备注',
    createdAt: '创建时间',
    actions: '操作',
    view: '查看',
    edit: '编辑',
    confirm: '确认',
    markShipped: '标记发货',
    markDelivered: '标记签收',
    platformReceive: '平台上架',
    cancel: '取消',
    confirmShipmentConfirm: '确认该发货单？库存将被锁定。',
    confirmTitle: '提示',
    confirmText: '确定',
    cancelText: '取消',
    markShippedConfirm: '确认该发货单已发货？',
    markDeliveredConfirm: '确认该发货单已签收？',
    cancelConfirm: '确认取消该发货单？已锁定库存会自动解除',
    confirmed: '发货单已确认',
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
      DRAFT: 'Draft',
      CONFIRMED: 'Confirmed',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled'
    }
  }
  return {
    DRAFT: '草稿',
    CONFIRMED: '已确认',
    SHIPPED: '已发货',
    DELIVERED: '已送达',
    CANCELLED: '已取消'
  }
})

const getStatusLabel = (status: ShipmentStatus) => {
  return (statusLabels.value as Record<string, string>)[status] || status
}

const receiptStatusLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      PENDING: 'Pending',
      PARTIAL: 'Partial',
      COMPLETED: 'Completed'
    }
  }
  return {
    PENDING: '待接收',
    PARTIAL: '部分接收',
    COMPLETED: '已接收'
  }
})

const getReceiptStatusLabel = (status: ShipmentReceiptStatus) => {
  return (receiptStatusLabels.value as Record<string, string>)[status] || status
}

const getShipmentProducts = (shipment: Shipment) => shipment.items?.slice(0, 2) || []

const getHiddenProductCount = (shipment: Shipment) => {
  const total = shipment.items?.length || 0
  return total > 2 ? total - 2 : 0
}

const hasProductIdentity = (product?: ProductSummary) => {
  return Boolean(product?.asin || product?.fnsku)
}

const hasProductSupplier = (product?: ProductSummary) => {
  return Boolean(product?.supplier_name || product?.supplier_code)
}

const formatProductSupplier = (product?: ProductSummary) => {
  if (!product) return '-'
  if (product.supplier_name && product.supplier_code) {
    return `${product.supplier_name} (${product.supplier_code})`
  }
  return product.supplier_name || product.supplier_code || '-'
}

const formatLogisticsProvider = (shipment: Shipment) => {
  const provider = shipment.logistics_provider as { provider_name?: string; provider_code?: string } | undefined
  if (!provider) return ''
  if (provider.provider_name && provider.provider_code) {
    return `${provider.provider_name} (${provider.provider_code})`
  }
  return provider.provider_name || provider.provider_code || ''
}

const formatShippingRate = (shipment: Shipment) => {
  const rate = shipment.shipping_rate as {
    service?: { service_name?: string; service_code?: string }
    service_name?: string
    pricing_method?: string
    transport_mode?: string
  } | undefined
  if (!rate) return ''
  const serviceName = rate.service?.service_name || rate.service_name
  const serviceCode = rate.service?.service_code
  const serviceDisplay = serviceName && serviceCode ? `${serviceName} (${serviceCode})` : (serviceName || serviceCode || '')
  if (serviceDisplay && rate.transport_mode) {
    return `${serviceDisplay} / ${rate.transport_mode}`
  }
  return serviceDisplay || rate.transport_mode || rate.pricing_method || ''
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

// 新建
const handleCreate = () => {
  router.push('/shipping/shipments/create')
}

// 查看详情
const handleView = (row: Shipment) => {
  router.push(`/shipping/shipments/${row.id}`)
}

const canPlatformReceive = (row: Shipment) => {
  return ['SHIPPED', 'DELIVERED'].includes(row.status) && row.receipt_status !== 'COMPLETED'
}

const handlePlatformReceive = (row: Shipment) => {
  router.push(`/shipping/shipments/${row.id}`)
}

const canEditShipment = (row: Shipment) => {
  return ['DRAFT', 'CONFIRMED'].includes(row.status)
}

// 编辑
const handleEdit = (row: Shipment) => {
  router.push(`/shipping/shipments/${row.id}/edit`)
}

// 确认发货单 (DRAFT → CONFIRMED)
const handleConfirm = async (row: Shipment) => {
  try {
    await ElMessageBox.confirm(labels.value.confirmShipmentConfirm, labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'info'
    })

    await confirmShipment(row.id)
    ElMessage.success(labels.value.confirmed)
    loadList()
  } catch (error: any) {
    if (error !== 'cancel' && !error._handled) {
      console.error('Confirm failed:', error)
      ElMessage.error(error.message || labels.value.actionFail)
    }
  }
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
    if (!error._handled) {
      console.error('Mark shipped failed:', error)
      ElMessage.error(error.message || labels.value.actionFail)
    }
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
    if (error !== 'cancel' && !error._handled) {
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
    if (error !== 'cancel' && !error._handled) {
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
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0;
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

.shipment-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shipment-stock-note {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

.shipment-number {
  font-weight: 700;
  color: #111827;
}

.shipment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #6b7280;
}

.product-preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-preview-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-preview-code {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.product-preview-marketplace {
  padding: 0 6px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 11px;
  line-height: 20px;
}

.product-preview-title {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.product-preview-meta,
.product-preview-more {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.6;
}

.product-preview-empty {
  color: #9ca3af;
  font-size: 12px;
}

.logistics-block,
.timeline-block {
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.logistics-line {
  color: #4b5563;
}

.logistics-empty {
  color: #9ca3af;
}

@media (max-width: 960px) {
  .search-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-form__actions {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .search-form__keyword {
    width: 100%;
  }

  .search-form__keyword :deep(.el-input) {
    width: 100%;
  }
}
</style>
