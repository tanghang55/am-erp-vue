<template>
  <div class="shipment-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-page-header :content="labels.title" @back="handleBack" />
        </div>
      </template>

      <div v-loading="loading">
        <div v-if="shipment" class="detail-layout">
          <div class="detail-main">
            <section class="detail-hero">
              <div class="detail-hero-main">
                <div class="detail-hero-tags">
                  <el-tag :type="SHIPMENT_STATUS_CONFIG[shipment.status]?.color">
                    {{ SHIPMENT_STATUS_CONFIG[shipment.status]?.icon }}
                    {{ getStatusLabel(shipment.status) }}
                  </el-tag>
                  <el-tag :type="SHIPMENT_RECEIPT_STATUS_CONFIG[shipment.receipt_status]?.color || 'info'">
                    {{ getReceiptStatusLabel(shipment.receipt_status) }}
                  </el-tag>
                </div>
                <div class="detail-hero-number">{{ shipment.shipment_number }}</div>
                <div class="detail-hero-meta">
                  <span>{{ labels.orderNumber }}：{{ shipment.order_number || '-' }}</span>
                  <span>{{ labels.warehouse }}：{{ warehouseDisplay }}</span>
                </div>
              </div>
              <div class="detail-hero-actions">
                <el-button
                  v-if="canReceiveShipment"
                  type="primary"
                  @click="handleScrollToReceive"
                >
                  {{ labels.receiveEntry }}
                </el-button>
              </div>
            </section>

            <section class="detail-section-card">
              <div class="detail-section-header">
                <div>
                  <div class="detail-section-title">{{ labels.overviewTitle }}</div>
                  <div class="detail-section-subtitle">{{ labels.overviewSubtitle }}</div>
                </div>
              </div>
              <div class="summary-grid">
                <div class="summary-tile">
                  <div class="summary-label">{{ labels.productCount }}</div>
                  <div class="summary-value">{{ shipmentSummary.productCount }}</div>
                </div>
                <div class="summary-tile">
                  <div class="summary-label">{{ labels.quantity }}</div>
                  <div class="summary-value">{{ shipmentSummary.plannedQuantity }}</div>
                </div>
                <div class="summary-tile">
                  <div class="summary-label">{{ labels.receivedQuantity }}</div>
                  <div class="summary-value">{{ shipmentSummary.receivedQuantity }}</div>
                </div>
                <div class="summary-tile">
                  <div class="summary-label">{{ labels.remainingQuantity }}</div>
                  <div class="summary-value">{{ shipmentSummary.remainingQuantity }}</div>
                </div>
                <div class="summary-tile">
                  <div class="summary-label">{{ labels.shippingCost }}</div>
                  <div class="summary-value">{{ formatAmount(shipment.currency, shipment.shipping_cost) }}</div>
                </div>
                <div class="summary-tile">
                  <div class="summary-label">{{ labels.receiptProgress }}</div>
                  <div class="summary-value">{{ shipmentSummary.receiptProgress }}</div>
                </div>
              </div>
            </section>

            <section class="detail-section-card">
              <div class="detail-section-header">
                <div>
                  <div class="detail-section-title">{{ labels.logisticsTitle }}</div>
                  <div class="detail-section-subtitle">{{ labels.logisticsSubtitle }}</div>
                </div>
              </div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">{{ labels.warehouse }}</div>
                    <div class="info-value">{{ warehouseDisplay }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ labels.logisticsProvider }}</div>
                    <div class="info-value">{{ logisticsProviderDisplay }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ labels.shippingRate }}</div>
                    <div class="info-value">{{ shippingRateDisplay }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ labels.carrier }}</div>
                    <div class="info-value">{{ shipment.carrier || '-' }}</div>
                  </div>
                  <div class="info-item">
                  <div class="info-label">{{ labels.trackingNumber }}</div>
                  <div class="info-value">{{ shipment.tracking_number || '-' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ labels.shippedAt }}</div>
                  <div class="info-value">{{ formatDateTime(shipment.ship_date) }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ labels.deliveredAt }}</div>
                  <div class="info-value">{{ formatDateTime(shipment.actual_delivery_date) }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ labels.receiptCompletedAt }}</div>
                  <div class="info-value">{{ formatDateTime(shipment.receipt_completed_at) }}</div>
                </div>
              </div>
            </section>

            <section ref="receiveSectionRef" class="detail-section-card">
              <div class="detail-section-header">
                <div>
                  <div class="detail-section-title">{{ labels.itemsTitle }}</div>
                  <div class="detail-section-subtitle">{{ labels.itemsSubtitle }}</div>
                </div>
              </div>
              <el-tabs v-model="activeTab" class="detail-tabs">
                <el-tab-pane :label="labels.productTab" name="items">
                  <el-table :data="receiptRows" border stripe>
                    <el-table-column :label="labels.product" min-width="360">
                      <template #default="{ row }">
                        <div class="product-main">
                          <el-image
                            v-if="row.product?.image_url"
                            :src="row.product.image_url"
                            fit="cover"
                            class="product-image"
                          />
                          <div v-else class="no-image">-</div>
                          <div class="product-cell">
                            <div class="product-head">
                              <div class="product-code">{{ row.product?.seller_sku || row.product_id }}</div>
                              <el-tag
                                v-if="row.product?.marketplace"
                                size="small"
                                type="info"
                                effect="plain"
                                class="product-marketplace"
                              >
                                {{ row.product.marketplace }}
                              </el-tag>
                            </div>
                            <div class="product-title">{{ row.product?.title || '-' }}</div>
                            <div v-if="hasProductIdentity(row.product)" class="product-meta">
                              <span>{{ labels.asin }}：{{ row.product?.asin || '-' }}</span>
                              <span>{{ labels.fnsku }}：{{ row.product?.fnsku || '-' }}</span>
                            </div>
                            <div v-if="hasProductCatalog(row.product)" class="product-meta">
                              <span>{{ labels.brand }}：{{ row.product?.brand_name || '-' }}</span>
                              <span>{{ labels.category }}：{{ row.product?.category_name || '-' }}</span>
                            </div>
                            <div v-if="hasProductSupplier(row.product)" class="product-meta">
                              <span>{{ labels.supplier }}：{{ formatProductSupplier(row.product) }}</span>
                            </div>
                          </div>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="labels.quantityInfo" min-width="220">
                      <template #default="{ row }">
                        <div class="quantity-block">
                          <div class="quantity-line">
                            <span class="quantity-label">{{ labels.quantity }}</span>
                            <span class="quantity-value">{{ row.quantity_planned }}</span>
                          </div>
                          <div class="quantity-line">
                            <span class="quantity-label">{{ labels.receivedQuantity }}</span>
                            <span class="quantity-value">{{ row.quantity_received }}</span>
                          </div>
                          <div class="quantity-line">
                            <span class="quantity-label">{{ labels.remainingQuantity }}</span>
                            <span class="quantity-value">{{ row.quantity_remaining }}</span>
                          </div>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column :label="labels.unitCost" width="150" align="right">
                      <template #default="{ row }">{{ formatAmount(row.currency, row.unit_cost) }}</template>
                    </el-table-column>
                    <el-table-column v-if="canReceiveShipment" :label="labels.receiveAction" width="240" align="center">
                      <template #default="{ row }">
                        <div class="receive-actions">
                          <el-input-number
                            v-model="row.receive_quantity"
                            :min="0"
                            :max="row.quantity_remaining"
                            :precision="0"
                            :step="1"
                            size="small"
                            controls-position="right"
                          />
                          <el-button
                            type="primary"
                            size="small"
                            :loading="receivingItemId === row.shipment_item_id"
                            :disabled="row.quantity_remaining === 0"
                            @click="handleReceiveRow(row)"
                          >
                            {{ labels.receiveButton }}
                          </el-button>
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>

                <el-tab-pane :label="labels.auditLogs" name="logs">
                  <div class="audit-section">
                    <div class="audit-section__header">
                      <div class="audit-section__subtitle">{{ labels.auditLogsHint }}</div>
                      <el-button text @click="loadAuditLogs">{{ labels.refreshLogs }}</el-button>
                    </div>

                    <el-table v-loading="auditLoading" :data="auditLogs" border stripe>
                      <el-table-column :label="labels.logTime" width="180">
                        <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
                      </el-table-column>
                      <el-table-column :label="labels.operator" width="140">
                        <template #default="{ row }">{{ row.username || '-' }}</template>
                      </el-table-column>
                      <el-table-column :label="labels.operation" width="160">
                        <template #default="{ row }">{{ getActionLabel(row.action, row.entity_type) }}</template>
                      </el-table-column>
                      <el-table-column :label="labels.changeDetail" min-width="360">
                        <template #default="{ row }">
                          <div class="audit-change-text">{{ formatAuditChanges(row) || '-' }}</div>
                        </template>
                      </el-table-column>
                    </el-table>

                    <div class="audit-pagination">
                      <el-pagination
                        v-model:current-page="auditPagination.page"
                        v-model:page-size="auditPagination.page_size"
                        :total="auditPagination.total"
                        :page-sizes="[10, 20, 50]"
                        layout="total, sizes, prev, pager, next"
                        @current-change="loadAuditLogs"
                        @size-change="handleAuditSizeChange"
                      />
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </section>
          </div>

          <aside class="detail-aside">
            <section class="detail-aside-card detail-aside-card--sticky">
              <div class="detail-section-title">{{ labels.documentTitle }}</div>
              <div class="detail-meta-list">
                <div class="detail-meta-item">
                  <span class="detail-meta-label">{{ labels.orderNumber }}</span>
                  <span class="detail-meta-value">{{ shipment.order_number || '-' }}</span>
                </div>
                <div class="detail-meta-item">
                  <span class="detail-meta-label">{{ labels.status }}</span>
                  <span class="detail-meta-value">
                    <el-tag size="small" :type="SHIPMENT_STATUS_CONFIG[shipment.status]?.color">
                      {{ getStatusLabel(shipment.status) }}
                    </el-tag>
                  </span>
                </div>
                <div class="detail-meta-item">
                  <span class="detail-meta-label">{{ labels.receiptStatus }}</span>
                  <span class="detail-meta-value">
                    <el-tag size="small" :type="SHIPMENT_RECEIPT_STATUS_CONFIG[shipment.receipt_status]?.color || 'info'">
                      {{ getReceiptStatusLabel(shipment.receipt_status) }}
                    </el-tag>
                  </span>
                </div>
                <div class="detail-meta-item">
                  <span class="detail-meta-label">{{ labels.createdAt }}</span>
                  <span class="detail-meta-value">{{ formatDateTime(shipment.created_at) }}</span>
                </div>
                <div class="detail-meta-item">
                  <span class="detail-meta-label">{{ labels.operator }}</span>
                  <span class="detail-meta-value">{{ shipment.created_by_name || '-' }}</span>
                </div>
              </div>
            </section>

            <section class="detail-aside-card">
              <div class="detail-section-title">{{ labels.timeline }}</div>
              <div class="detail-meta-list">
                <div v-for="node in timelineNodes" :key="node.key" class="detail-meta-item detail-meta-item--timeline">
                  <span class="detail-meta-label">{{ node.label }}</span>
                  <div class="detail-meta-stack">
                    <span class="detail-meta-value">{{ formatDateTime(node.time) }}</span>
                    <span class="detail-meta-sub">{{ labels.operator }}：{{ node.operator || '-' }}</span>
                  </div>
                </div>
              </div>
            </section>

            <section class="detail-aside-card">
              <div class="detail-section-title">{{ labels.remark }}</div>
              <div class="remark-block">{{ shipment.remark || '-' }}</div>
            </section>
          </aside>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getShipmentDetail, receiveShipmentItem } from '../api'
import type { Shipment, ShipmentStatus, ShipmentReceiptStatus } from '../types'
import { SHIPMENT_STATUS_CONFIG, SHIPMENT_RECEIPT_STATUS_CONFIG } from '../types'
import type { ProductSummary } from '@/modules/product/types'
import type { ShipmentPlatformReceiveRow } from '../utils/platformReceive'
import { buildPlatformReceivePayload, buildShipmentPlatformReceiveRows } from '../utils/platformReceive'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { getSystemAuditLogList } from '@/modules/system/api/logs'
import type { AuditLog } from '@/modules/system/types'
import { useAuditLogFormatter } from '@/modules/common/composables/useAuditLogFormatter'

const router = useRouter()
const route = useRoute()
const localeStore = useLocaleStore()
const shipmentId = Number(route.params.id)

const shipment = ref<Shipment | null>(null)
const loading = ref(false)
const receivingItemId = ref<number | null>(null)
const receiptRows = ref<ShipmentPlatformReceiveRow[]>([])
const receiveSectionRef = ref<HTMLElement | null>(null)
const activeTab = ref('items')
const auditLogs = ref<AuditLog[]>([])
const auditLoading = ref(false)
const auditPagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})
const { getActionLabel, formatAuditChanges } = useAuditLogFormatter()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Shipment Detail',
      orderNumber: 'Order Number',
      warehouse: 'Warehouse',
      status: 'Status',
      receiptStatus: 'Receipt Status',
      carrier: 'Carrier',
      trackingNumber: 'Tracking Number',
      logisticsProvider: 'Provider',
      shippingRate: 'Rate',
      asin: 'ASIN',
      fnsku: 'FNSKU',
      brand: 'Brand',
      category: 'Category',
      supplier: 'Supplier',
      shippingCost: 'Shipping Cost',
      shippedAt: 'Shipped At',
      deliveredAt: 'Delivered At',
      receiptCompletedAt: 'Receipt Completed At',
      createdAt: 'Created At',
      remark: 'Remark',
      product: 'Product',
      quantity: 'Quantity',
      receivedQuantity: 'Received Qty',
      remainingQuantity: 'Remaining Qty',
      quantityInfo: 'Quantity',
      unitCost: 'Unit Cost',
      receiveAction: 'Platform Receive',
      receiveButton: 'Receive',
      receiveEntry: 'Platform Receive',
      overviewTitle: 'Shipment Overview',
      overviewSubtitle: 'Review shipment quantity, receipt progress and shipping cost',
      logisticsTitle: 'Logistics & Receipt',
      logisticsSubtitle: 'Track carrier, receiving warehouse and delivery milestones',
      itemsTitle: 'Shipment Items',
      itemsSubtitle: 'Review shipped products and complete platform receive',
      documentTitle: 'Document Info',
      productCount: 'Product Count',
      receiptProgress: 'Receipt Progress',
      timeline: 'Timeline',
      confirmedAt: 'Confirmed At',
      shippedBy: 'Shipped By',
      confirmedBy: 'Confirmed By',
      deliveredBy: 'Delivered By',
      receiptCompletedBy: 'Receipt Completed By',
      productTab: 'Products',
      auditLogs: 'Audit Logs',
      auditLogsHint: 'Track shipment lifecycle actions and real field changes for this shipment.',
      refreshLogs: 'Refresh Logs',
      logTime: 'Time',
      operator: 'Operator',
      operation: 'Operation',
      changeDetail: 'Changes',
      receiveSuccess: 'Platform receive recorded',
      receiveFailed: 'Platform receive failed'
    }
  }
  return {
    title: '发货单详情',
    orderNumber: '订单号',
    warehouse: '仓库',
    status: '状态',
    receiptStatus: '接收状态',
    carrier: '承运商',
    trackingNumber: '物流追踪号',
    logisticsProvider: '物流商',
    shippingRate: '报价/服务',
    asin: 'ASIN',
    fnsku: 'FNSKU',
    brand: '品牌',
    category: '品类',
    supplier: '供应商',
    shippingCost: '运费',
    shippedAt: '发货时间',
    deliveredAt: '送达时间',
    receiptCompletedAt: '接收完成时间',
    createdAt: '创建时间',
    remark: '备注',
    product: '产品',
    quantity: '数量',
    receivedQuantity: '已接收',
    remainingQuantity: '待接收',
    quantityInfo: '数量情况',
    unitCost: '单位成本',
    receiveAction: '平台上架',
    receiveButton: '确认上架',
    receiveEntry: '平台上架',
    overviewTitle: '发货概览',
    overviewSubtitle: '集中查看发货数量、接收进度和运费',
    logisticsTitle: '物流与接收',
    logisticsSubtitle: '查看承运信息、接收仓库和时间节点',
    itemsTitle: '发货明细',
    itemsSubtitle: '按产品查看发货数量并执行平台上架',
    documentTitle: '单据信息',
    productCount: '产品数',
    receiptProgress: '接收进度',
    timeline: '操作节点',
    confirmedAt: '确认时间',
    confirmedBy: '确认人',
    shippedBy: '发货人',
    deliveredBy: '送达人',
    receiptCompletedBy: '接收完成人',
    productTab: '产品',
    auditLogs: '操作日志',
    auditLogsHint: '查看发货单关键动作和真实字段变化，只记录真实变更。',
    refreshLogs: '刷新日志',
    logTime: '操作时间',
    operator: '操作人',
    operation: '操作',
    changeDetail: '变更内容',
    receiveSuccess: '平台上架已记录',
    receiveFailed: '平台上架失败'
  }
})

const canReceiveShipment = computed(() => {
  if (!shipment.value) return false
  return ['SHIPPED', 'DELIVERED'].includes(shipment.value.status) && shipment.value.receipt_status !== 'COMPLETED'
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

const formatDateTime = (dateTime?: string) => {
  if (!dateTime) return '-'
  return dateTime.substring(0, 19).replace('T', ' ')
}

const formatAmount = (currency?: string, amount?: number | string) => {
  return `${currency || '-'} ${amount ?? 0}`
}

const formatProductSupplier = (product?: ProductSummary) => {
  if (!product) return '-'
  const supplierName = product.supplier_name?.trim()
  const supplierCode = product.supplier_code?.trim()
  if (supplierName && supplierCode) return `${supplierName}（${supplierCode}）`
  return supplierName || supplierCode || '-'
}

const hasProductIdentity = (product?: ProductSummary) => {
  return !!(product?.asin || product?.fnsku)
}

const hasProductCatalog = (product?: ProductSummary) => {
  return !!(product?.brand_name || product?.category_name)
}

const hasProductSupplier = (product?: ProductSummary) => {
  return !!(product?.supplier_name || product?.supplier_code)
}

const logisticsProviderDisplay = computed(() => {
  const provider = shipment.value?.logistics_provider as { provider_name?: string; provider_code?: string } | undefined
  if (!provider) return '-'
  if (provider.provider_name && provider.provider_code) return `${provider.provider_name}（${provider.provider_code}）`
  return provider.provider_name || provider.provider_code || '-'
})

const shippingRateDisplay = computed(() => {
  const rate = shipment.value?.shipping_rate as {
    service?: { service_name?: string; service_code?: string }
    transport_mode?: string
    pricing_method?: string
  } | undefined
  if (!rate) return '-'
  const serviceName = rate.service?.service_name
  const serviceCode = rate.service?.service_code
  const serviceDisplay = serviceName && serviceCode ? `${serviceName}（${serviceCode}）` : serviceName || serviceCode || ''
  const mode = rate.transport_mode || ''
  if (serviceDisplay && mode) return `${serviceDisplay} / ${mode}`
  return serviceDisplay || mode || rate.pricing_method || '-'
})

const warehouseDisplay = computed(() => {
  if (!shipment.value?.warehouse) return '-'
  const warehouse = shipment.value.warehouse
  return warehouse.code ? `${warehouse.name}（${warehouse.code}）` : warehouse.name
})

const shipmentSummary = computed(() => {
  const productCount = receiptRows.value.length
  const plannedQuantity = receiptRows.value.reduce((sum, row) => sum + Number(row.quantity_planned || 0), 0)
  const receivedQuantity = receiptRows.value.reduce((sum, row) => sum + Number(row.quantity_received || 0), 0)
  const remainingQuantity = receiptRows.value.reduce((sum, row) => sum + Number(row.quantity_remaining || 0), 0)
  const receiptProgress = plannedQuantity > 0 ? `${receivedQuantity}/${plannedQuantity}` : '0/0'
  return {
    productCount,
    plannedQuantity,
    receivedQuantity,
    remainingQuantity,
    receiptProgress
  }
})

const timelineNodes = computed(() => {
  if (!shipment.value) return []
  return [
    {
      key: 'created',
      label: labels.value.createdAt,
      time: shipment.value.created_at,
      operator: shipment.value.created_by_name
    },
    {
      key: 'confirmed',
      label: labels.value.confirmedAt,
      time: shipment.value.confirmed_at,
      operator: shipment.value.confirmed_by_name
    },
    {
      key: 'shipped',
      label: labels.value.shippedAt,
      time: shipment.value.shipped_at,
      operator: shipment.value.shipped_by_name
    },
    {
      key: 'delivered',
      label: labels.value.deliveredAt,
      time: shipment.value.delivered_at,
      operator: shipment.value.delivered_by_name
    },
    {
      key: 'receiptCompleted',
      label: labels.value.receiptCompletedAt,
      time: shipment.value.receipt_completed_at,
      operator: shipment.value.receipt_completed_by_name
    }
  ]
})

const loadDetail = async () => {
  if (!shipmentId) return
  loading.value = true
  try {
    const res = await getShipmentDetail(shipmentId)
    shipment.value = res.data || null
    receiptRows.value = shipment.value ? buildShipmentPlatformReceiveRows(shipment.value) : []
  } finally {
    loading.value = false
  }
}

const loadAuditLogs = async () => {
  if (!shipmentId) return
  auditLoading.value = true
  try {
    const res = await getSystemAuditLogList({
      page: auditPagination.page,
      page_size: auditPagination.page_size,
      module: 'Shipment',
      entity_type: 'Shipment',
      entity_id: String(shipmentId)
    })
    auditLogs.value = res.data?.data || []
    auditPagination.total = res.data?.total || 0
  } finally {
    auditLoading.value = false
  }
}

const handleAuditSizeChange = () => {
  auditPagination.page = 1
  loadAuditLogs()
}

const handleReceiveRow = async (row: ShipmentPlatformReceiveRow) => {
  if (!shipment.value) return
  receivingItemId.value = row.shipment_item_id
  try {
    const payload = buildPlatformReceivePayload(shipment.value, row)
    await receiveShipmentItem(payload)
    ElMessage.success(labels.value.receiveSuccess)
    await Promise.all([loadDetail(), loadAuditLogs()])
  } catch (error: any) {
    console.error('Platform receive failed:', error)
    ElMessage.error(error?.message || labels.value.receiveFailed)
  } finally {
    receivingItemId.value = null
  }
}

const handleScrollToReceive = () => {
  receiveSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadDetail()
  loadAuditLogs()
})
</script>

<style scoped>
.shipment-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
}

.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-hero,
.detail-section-card,
.detail-aside-card {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 14px;
  background: #fff;
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
  gap: 10px;
}

.detail-hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-hero-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.detail-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #606266;
  font-size: 13px;
}

.detail-hero-actions {
  display: flex;
  align-items: center;
}

.detail-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
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
  word-break: break-word;
}

.product-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.product-image,
.no-image {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  flex-shrink: 0;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.product-code {
  font-weight: 600;
  color: #303133;
}

.product-title {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}

.quantity-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quantity-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.quantity-label {
  color: #909399;
  font-size: 12px;
}

.quantity-value {
  color: #303133;
  font-weight: 600;
}

.receive-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.detail-aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-aside-card--sticky {
  position: sticky;
  top: 20px;
}

.detail-meta-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.detail-meta-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-meta-item--timeline {
  align-items: flex-start;
}

.detail-meta-label {
  color: #909399;
  font-size: 12px;
}

.detail-meta-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.detail-meta-value {
  max-width: 170px;
  color: #303133;
  font-size: 13px;
  text-align: right;
}

.detail-meta-sub {
  max-width: 170px;
  color: #909399;
  font-size: 12px;
  text-align: right;
}

.remark-block {
  margin-top: 16px;
  color: #606266;
  line-height: 1.7;
  white-space: pre-wrap;
}

.detail-tabs {
  margin-top: -8px;
}

.audit-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.audit-section__subtitle {
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
}

.audit-change-text {
  white-space: normal;
  line-height: 1.7;
  color: #303133;
}

.audit-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-aside {
    order: -1;
  }

  .detail-aside-card--sticky {
    position: static;
  }
}
</style>

