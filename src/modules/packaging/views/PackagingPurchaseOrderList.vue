<template>
  <div class="packaging-purchase-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>包材采购单</span>
          <div class="header-actions">
            <el-button plain @click="handleOpenPlanPage">查看采购计划</el-button>
            <el-button :loading="loadingOrders" @click="loadOrders">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="orders" v-loading="loadingOrders" border stripe>
        <el-table-column label="采购单" min-width="280">
          <template #default="{ row }">
            <div class="order-main">
              <div class="order-number">{{ row.po_number }}</div>
              <div class="order-meta">
                <span>金额 {{ formatAmount(row.total_amount, row.currency) }}</span>
                <span>明细 {{ row.items?.length ?? 0 }} 项</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="orderStatusTagType(row.status)">
              {{ orderStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" min-width="220">
          <template #default="{ row }">
            <div class="time-block">
              <div class="time-line">
                <span class="time-label">下单</span>
                <span class="time-value">{{ row.ordered_at || '-' }}</span>
              </div>
              <div class="time-line">
                <span class="time-label">收货</span>
                <span class="time-value">{{ row.received_at || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">
            <span class="remark-text">{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewOrder(row)">详情</el-button>
            <el-button
              size="small"
              type="primary"
              :disabled="row.status !== 'DRAFT'"
              @click="handleSubmitOrder(row)"
            >
              下单
            </el-button>
            <el-button
              size="small"
              type="success"
              :disabled="row.status !== 'ORDERED'"
              @click="handleReceiveOrder(row)"
            >
              入库
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="orderDetailVisible" title="包材采购单详情" width="920px">
      <div v-if="currentOrderDetail">
        <div class="detail-summary">
          <div class="detail-summary-main">
            <div class="detail-order-number">{{ currentOrderDetail.po_number }}</div>
            <div class="detail-order-meta">
              <span>状态：{{ orderStatusLabel(currentOrderDetail.status) }}</span>
              <span>币种：{{ currentOrderDetail.currency }}</span>
              <span>总金额：{{ formatAmount(currentOrderDetail.total_amount, currentOrderDetail.currency) }}</span>
            </div>
          </div>
          <div class="detail-summary-side">
            <div class="detail-summary-line">
              <span class="detail-summary-label">下单时间</span>
              <span class="detail-summary-value">{{ currentOrderDetail.ordered_at || '-' }}</span>
            </div>
            <div class="detail-summary-line">
              <span class="detail-summary-label">收货时间</span>
              <span class="detail-summary-value">{{ currentOrderDetail.received_at || '-' }}</span>
            </div>
          </div>
        </div>
        <el-table :data="currentOrderDetail.items || []" border stripe>
          <el-table-column label="包材" min-width="240">
            <template #default="{ row }">
              <div class="item-main">
                <div class="item-code">{{ row.packaging_item_code || '-' }}</div>
                <div class="item-name">{{ row.packaging_item_name || '-' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="qty_ordered" label="下单数" width="90" />
          <el-table-column prop="qty_received" label="已收数" width="90" />
          <el-table-column label="单价" width="130">
            <template #default="{ row }">
              {{ formatAmount(row.unit_cost, row.currency) }}
            </template>
          </el-table-column>
          <el-table-column label="小计" width="130">
            <template #default="{ row }">
              {{ formatAmount(row.subtotal, row.currency) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import type { PackagingPurchaseOrder } from '../types'
import {
  getPackagingPurchaseOrderDetail,
  getPackagingPurchaseOrderList,
  receivePackagingPurchaseOrder,
  submitPackagingPurchaseOrder
} from '../api'

const router = useRouter()
const loadingOrders = ref(false)
const orderDetailVisible = ref(false)
const orders = ref<PackagingPurchaseOrder[]>([])
const currentOrderDetail = ref<PackagingPurchaseOrder | null>(null)

const draftCount = computed(() => orders.value.filter(item => item.status === 'DRAFT').length)
const orderedCount = computed(() => orders.value.filter(item => item.status === 'ORDERED').length)
const receivedCount = computed(() => orders.value.filter(item => item.status === 'RECEIVED').length)

const loadOrders = async () => {
  loadingOrders.value = true
  try {
    const res = await getPackagingPurchaseOrderList({
      page: 1,
      page_size: 200
    })
    orders.value = res.data.data
  } finally {
    loadingOrders.value = false
  }
}

const handleOpenPlanPage = () => {
  router.push('/packaging/procurement-plans')
}

const handleSubmitOrder = async (row: PackagingPurchaseOrder) => {
  try {
    await submitPackagingPurchaseOrder(row.id)
    ElMessage.success('下单成功')
    await loadOrders()
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '下单失败'))
  }
}

const handleReceiveOrder = async (row: PackagingPurchaseOrder) => {
  try {
    await ElMessageBox.confirm(`确认将采购单 ${row.po_number} 执行入库？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await receivePackagingPurchaseOrder(row.id)
    ElMessage.success('入库成功，已回写包材库存')
    await loadOrders()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error, '入库失败'))
    }
  }
}

const handleViewOrder = async (row: PackagingPurchaseOrder) => {
  try {
    const res = await getPackagingPurchaseOrderDetail(row.id)
    currentOrderDetail.value = res.data
    orderDetailVisible.value = true
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '加载详情失败'))
  }
}

const orderStatusTagType = (status: PackagingPurchaseOrder['status']) => {
  if (status === 'DRAFT') return 'info'
  if (status === 'ORDERED') return 'primary'
  if (status === 'RECEIVED') return 'success'
  return ''
}

const orderStatusLabel = (status: PackagingPurchaseOrder['status']) => {
  if (status === 'DRAFT') return '草稿'
  if (status === 'ORDERED') return '已下单'
  if (status === 'RECEIVED') return '已收货'
  if (status === 'CLOSED') return '已关闭'
  return status
}

const formatAmount = (amount?: number, currency?: string) => {
  const value = Number(amount || 0)
  const formatted = Number.isFinite(value) ? value.toFixed(2) : '0.00'
  return currency ? `${currency} ${formatted}` : formatted
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  return fallback
}

onMounted(async () => {
  await loadOrders()
})
</script>

<style scoped>
.packaging-purchase-page {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-tile {
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e5e7eb;
}

.summary-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.summary-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.order-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-number {
  font-weight: 700;
  color: #111827;
}

.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #6b7280;
}

.time-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.time-label {
  font-size: 12px;
  color: #6b7280;
}

.time-value {
  font-size: 12px;
  color: #111827;
}

.remark-text {
  color: #4b5563;
}

.detail-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 16px;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e5e7eb;
}

.detail-order-number {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.detail-order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #4b5563;
}

.detail-summary-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-summary-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.detail-summary-label {
  font-size: 12px;
  color: #6b7280;
}

.detail-summary-value {
  font-size: 12px;
  color: #111827;
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-code {
  font-weight: 600;
  color: #111827;
}

.item-name {
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
