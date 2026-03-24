<template>
  <div class="sales-order-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>{{ labels.title }}</span>
          <el-button @click="goBack">{{ labels.back }}</el-button>
        </div>
      </template>

      <div v-if="order" class="detail-layout">
        <div class="detail-main">
          <section class="detail-hero">
            <div class="detail-hero-main">
              <div class="detail-hero-tags">
                <el-tag :type="statusTagType(order.order_status)">{{ statusLabel(order.order_status) }}</el-tag>
                <el-tag type="info">{{ order.marketplace || '-' }}</el-tag>
                <el-tag type="warning">{{ order.sales_channel || '-' }}</el-tag>
              </div>
              <div class="detail-hero-number">{{ order.order_no }}</div>
              <div class="detail-hero-meta">
                <span>{{ labels.currency }}：{{ order.currency }}</span>
                <span>{{ labels.orderAmount }}：{{ formatAmount(order.currency, order.order_amount) }}</span>
                <span>{{ labels.orderDate }}：{{ formatDateTime(order.order_date) }}</span>
              </div>
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
                <div class="summary-value">{{ orderSummary.productCount }}</div>
              </div>
              <div class="summary-tile">
                <div class="summary-label">{{ labels.orderedQty }}</div>
                <div class="summary-value">{{ orderSummary.orderedQty }}</div>
              </div>
              <div class="summary-tile">
                <div class="summary-label">{{ labels.allocatedQty }}</div>
                <div class="summary-value">{{ orderSummary.allocatedQty }}</div>
              </div>
              <div class="summary-tile">
                <div class="summary-label">{{ labels.shippedQty }}</div>
                <div class="summary-value">{{ orderSummary.shippedQty }}</div>
              </div>
              <div class="summary-tile">
                <div class="summary-label">{{ labels.returnedQty }}</div>
                <div class="summary-value">{{ orderSummary.returnedQty }}</div>
              </div>
              <div class="summary-tile">
                <div class="summary-label">{{ labels.orderAmount }}</div>
                <div class="summary-value">{{ formatAmount(order.currency, order.order_amount) }}</div>
              </div>
            </div>
          </section>

          <section class="detail-section-card">
            <div class="detail-section-header">
              <div>
                <div class="detail-section-title">{{ labels.timelineTitle }}</div>
                <div class="detail-section-subtitle">{{ labels.timelineSubtitle }}</div>
              </div>
            </div>
            <div class="timeline-grid">
              <div class="timeline-item">
                <div class="timeline-label">{{ labels.orderDate }}</div>
                <div class="timeline-value">{{ formatDateTime(order.order_date) }}</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-label">{{ labels.confirmedAt }}</div>
                <div class="timeline-value">{{ formatDateTime(order.confirm_at) }}</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-label">{{ labels.allocatedAt }}</div>
                <div class="timeline-value">{{ formatDateTime(order.allocated_at) }}</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-label">{{ labels.shippedAt }}</div>
                <div class="timeline-value">{{ formatDateTime(order.shipped_at) }}</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-label">{{ labels.deliveredAt }}</div>
                <div class="timeline-value">{{ formatDateTime(order.delivered_at) }}</div>
              </div>
              <div class="timeline-item">
                <div class="timeline-label">{{ labels.cancelledAt }}</div>
                <div class="timeline-value">{{ formatDateTime(order.cancelled_at) }}</div>
              </div>
            </div>
          </section>

          <section class="detail-section-card">
            <div class="detail-section-header">
              <div>
                <div class="detail-section-title">{{ labels.itemsTitle }}</div>
                <div class="detail-section-subtitle">{{ labels.itemsSubtitle }}</div>
              </div>
            </div>
            <el-table :data="order.items || []" border>
              <el-table-column :label="labels.product" min-width="300">
                <template #default="{ row }">
                  <div class="product-main">
                    <img
                      v-if="row.product_image_url"
                      :src="row.product_image_url"
                      :alt="row.seller_sku || 'product'"
                      class="product-image"
                    />
                    <div v-else class="product-image product-image--placeholder">无图</div>
                    <div class="product-cell">
                      <div class="product-code">{{ row.seller_sku || row.product_id }}</div>
                      <div class="product-title">{{ row.product_title || '-' }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="labels.quantityInfo" min-width="220">
                <template #default="{ row }">
                  <div class="quantity-block">
                    <div class="quantity-line">
                      <span class="quantity-label">{{ labels.orderedQty }}</span>
                      <span class="quantity-value">{{ row.qty_ordered }}</span>
                    </div>
                    <div class="quantity-line">
                      <span class="quantity-label">{{ labels.allocatedQty }}</span>
                      <span class="quantity-value">{{ row.qty_allocated }}</span>
                    </div>
                    <div class="quantity-line">
                      <span class="quantity-label">{{ labels.shippedQty }}</span>
                      <span class="quantity-value">{{ row.qty_shipped }}</span>
                    </div>
                    <div class="quantity-line">
                      <span class="quantity-label">{{ labels.returnedQty }}</span>
                      <span class="quantity-value">{{ row.qty_returned }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="labels.amountInfo" min-width="180">
                <template #default="{ row }">
                  <div class="quantity-block">
                    <div class="quantity-line">
                      <span class="quantity-label">{{ labels.unitPrice }}</span>
                      <span class="quantity-value">{{ formatAmount(order.currency, row.unit_price) }}</span>
                    </div>
                    <div class="quantity-line">
                      <span class="quantity-label">{{ labels.subtotal }}</span>
                      <span class="quantity-value">{{ formatAmount(order.currency, row.subtotal) }}</span>
                    </div>
                    <div class="quantity-line">
                      <span class="quantity-label">{{ labels.lineNo }}</span>
                      <span class="quantity-value">{{ row.line_no }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </div>

        <aside class="detail-aside">
          <section class="detail-aside-card detail-aside-card--sticky">
            <div class="detail-section-title">{{ labels.documentTitle }}</div>
            <div class="detail-meta-list">
              <div class="detail-meta-item">
                <span class="detail-meta-label">{{ labels.status }}</span>
                <span class="detail-meta-value">
                  <el-tag size="small" :type="statusTagType(order.order_status)">{{ statusLabel(order.order_status) }}</el-tag>
                </span>
              </div>
              <div class="detail-meta-item">
                <span class="detail-meta-label">{{ labels.marketplace }}</span>
                <span class="detail-meta-value">{{ order.marketplace || '-' }}</span>
              </div>
              <div class="detail-meta-item">
                <span class="detail-meta-label">{{ labels.salesChannel }}</span>
                <span class="detail-meta-value">{{ order.sales_channel || '-' }}</span>
              </div>
              <div class="detail-meta-item">
                <span class="detail-meta-label">{{ labels.createdAt }}</span>
                <span class="detail-meta-value">{{ formatDateTime(order.created_at) }}</span>
              </div>
              <div class="detail-meta-item">
                <span class="detail-meta-label">{{ labels.updatedAt }}</span>
                <span class="detail-meta-value">{{ formatDateTime(order.updated_at) }}</span>
              </div>
            </div>
          </section>

          <section class="detail-aside-card">
            <div class="detail-section-title">{{ labels.remark }}</div>
            <div class="remark-block">{{ order.remark || '-' }}</div>
          </section>
        </aside>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSalesOrderDetail } from '../api'
import type { SalesOrder, SalesOrderStatus } from '../types'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const order = ref<SalesOrder | null>(null)

const labels = {
  title: '销售订单详情',
  back: '返回',
  status: '状态',
  marketplace: '站点',
  salesChannel: '渠道',
  currency: '币种',
  orderAmount: '订单金额',
  orderDate: '下单时间',
  confirmedAt: '确认时间',
  allocatedAt: '分配时间',
  shippedAt: '发货时间',
  deliveredAt: '妥投时间',
  cancelledAt: '取消时间',
  createdAt: '创建时间',
  updatedAt: '更新时间',
  remark: '备注',
  overviewTitle: '订单概览',
  overviewSubtitle: '集中查看订单数量状态与金额',
  timelineTitle: '时间节点',
  timelineSubtitle: '查看订单从下单到妥投/取消的关键时间',
  itemsTitle: '订单明细',
  itemsSubtitle: '按产品查看数量流转和金额信息',
  documentTitle: '单据信息',
  productCount: '产品数',
  orderedQty: '下单数',
  allocatedQty: '锁定数',
  shippedQty: '发货数',
  returnedQty: '退货数',
  product: '产品',
  quantityInfo: '数量情况',
  amountInfo: '金额情况',
  unitPrice: '单价',
  subtotal: '小计',
  lineNo: '行号'
}

const statusMap: Record<SalesOrderStatus, { label: string; type: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
  DRAFT: { label: '草稿', type: 'info' },
  CONFIRMED: { label: '已确认', type: 'warning' },
  ALLOCATED: { label: '已分配', type: 'warning' },
  SHIPPED: { label: '已发货', type: 'warning' },
  DELIVERED: { label: '已妥投', type: 'success' },
  CANCELLED: { label: '已取消', type: 'danger' },
  RETURNED: { label: '已退货', type: 'danger' }
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as Record<string, unknown>).message
    if (typeof msg === 'string' && msg) {
      return msg
    }
  }
  return fallback
}

const statusLabel = (status: SalesOrderStatus) => statusMap[status]?.label || status
const statusTagType = (status: SalesOrderStatus) => statusMap[status]?.type || 'info'

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

const formatAmount = (currency: string, amount?: number | string | null) => {
  return `${currency} ${Number(amount || 0).toFixed(2)}`
}

const orderSummary = computed(() => {
  const items = order.value?.items || []
  return {
    productCount: items.length,
    orderedQty: items.reduce((sum, item) => sum + Number(item.qty_ordered || 0), 0),
    allocatedQty: items.reduce((sum, item) => sum + Number(item.qty_allocated || 0), 0),
    shippedQty: items.reduce((sum, item) => sum + Number(item.qty_shipped || 0), 0),
    returnedQty: items.reduce((sum, item) => sum + Number(item.qty_returned || 0), 0)
  }
})

const fetchDetail = async () => {
  const id = Number(route.params.id)
  if (!id) {
    ElMessage.error('无效订单ID')
    return
  }

  loading.value = true
  try {
    const res = await getSalesOrderDetail(id)
    order.value = res.data
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '加载失败'))
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/sales/orders')
}

onMounted(fetchDetail)
</script>

<style scoped>
.sales-order-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
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

.summary-grid,
.timeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.summary-tile,
.timeline-item {
  padding: 14px 16px;
  border-radius: 12px;
  background: #f7f9fc;
}

.summary-label,
.timeline-label {
  color: #909399;
  font-size: 12px;
}

.summary-value {
  margin-top: 8px;
  color: #303133;
  font-size: 22px;
  font-weight: 600;
}

.timeline-value {
  margin-top: 8px;
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.product-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-image {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-light);
  object-fit: cover;
  background: #fff;
  flex-shrink: 0;
}

.product-image--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  background: var(--el-fill-color-light);
}

.product-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-code {
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 1.4;
}

.product-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
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

.detail-meta-label {
  color: #909399;
  font-size: 12px;
}

.detail-meta-value {
  max-width: 170px;
  color: #303133;
  font-size: 13px;
  text-align: right;
}

.remark-block {
  margin-top: 16px;
  color: #606266;
  line-height: 1.7;
  white-space: pre-wrap;
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
