<template>
  <div class="purchase-order-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-page-header :content="labels.title" @back="handleBack" />
          <div class="header-actions">
            <el-button v-if="canEdit" size="small" @click="handleEdit">{{ labels.edit }}</el-button>
            <el-button v-if="canSubmit" size="small" type="primary" @click="handleSubmit">
              {{ labels.submit }}
            </el-button>
            <el-button v-if="canShip" size="small" type="warning" @click="handleShip">
              {{ labels.markShipped }}
            </el-button>
            <el-button v-if="canReceive" size="small" type="success" @click="handleReceive">
              {{ labels.receive }}
            </el-button>
            <el-button v-if="canClose" size="small" type="danger" @click="handleClose">
              {{ labels.close }}
            </el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <div v-if="order" class="summary-block">
          <div class="summary-title">
            <el-tag :type="PURCHASE_ORDER_STATUS_CONFIG[order.status]?.color">
              {{ getStatusLabel(order.status) }}
            </el-tag>
            <span class="summary-number">{{ order.po_number }}</span>
          </div>
          <el-descriptions :column="3" border>
            <el-descriptions-item :label="labels.supplier">
              {{ order.supplier?.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.marketplace">
              {{ order.marketplace || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.currency">
              {{ order.currency }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.orderedAt">
              {{ formatDate(order.ordered_at) }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.shippedAt">
              {{ formatDate(order.shipped_at) }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.receivedAt">
              {{ formatDate(order.received_at) }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.remark" :span="3">
              {{ order.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-table :data="order?.items || []" border stripe style="margin-top: 20px">
          <el-table-column :label="labels.sku" min-width="220">
            <template #default="{ row }">
              <div class="sku-cell">
                <div class="sku-code">{{ row.sku?.seller_sku || row.sku_id }}</div>
                <div class="sku-title">{{ row.sku?.title || '-' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="labels.qtyOrdered" width="120" align="center">
            <template #default="{ row }">{{ row.qty_ordered }}</template>
          </el-table-column>
          <el-table-column :label="labels.qtyReceived" width="120" align="center">
            <template #default="{ row }">{{ row.qty_received }}</template>
          </el-table-column>
          <el-table-column :label="labels.unitCost" width="140" align="right">
            <template #default="{ row }">{{ order?.currency }} {{ row.unit_cost }}</template>
          </el-table-column>
          <el-table-column :label="labels.subtotal" width="160" align="right">
            <template #default="{ row }">{{ order?.currency }} {{ row.subtotal }}</template>
          </el-table-column>
        </el-table>

        <div class="total-footer">
          <span>{{ labels.total }}</span>
          <span class="amount-text">{{ order?.currency }} {{ order?.total_amount }}</span>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="shipDialogVisible" :title="labels.shipTitle" width="400px">
      <el-form :model="shipForm" label-width="120px">
        <el-form-item :label="labels.shipWarehouse" required>
          <WarehouseSelector
            v-model="shipForm.warehouse_id"
            :placeholder="labels.shipWarehousePlaceholder"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirmShip">
          {{ labels.confirmShip }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="receiveDialogVisible" :title="labels.receiveTitle" width="600px">
      <el-form :model="receiveForm" label-width="120px">
        <el-form-item :label="labels.receiveWarehouse" required>
          <WarehouseSelector
            v-model="receiveForm.warehouse_id"
            :placeholder="labels.receiveWarehousePlaceholder"
            style="width: 100%"
          />
        </el-form-item>
        <el-divider>{{ labels.receiveQty }}</el-divider>
        <div v-if="order">
          <el-form-item
            v-for="item in order.items"
            :key="item.id"
            :label="item.sku?.seller_sku || String(item.sku_id)"
          >
            <el-input-number
              v-model="receiveForm.received_qties[item.id]"
              :min="0"
              :max="item.qty_ordered"
              :placeholder="`${labels.qtyOrdered}: ${item.qty_ordered}`"
              style="width: 100%"
            />
            <div class="form-tip">{{ labels.qtyOrdered }}: {{ item.qty_ordered }}</div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="receiveDialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirmReceive">
          {{ labels.confirmReceive }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPurchaseOrderDetail,
  submitPurchaseOrder,
  markPurchaseOrderShipped,
  receivePurchaseOrder,
  closePurchaseOrder
} from '../api'
import type { PurchaseOrder, PurchaseOrderStatus } from '../types'
import { PURCHASE_ORDER_STATUS_CONFIG } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'

const router = useRouter()
const route = useRoute()
const localeStore = useLocaleStore()
const orderId = Number(route.params.id)

const order = ref<PurchaseOrder | null>(null)
const loading = ref(false)

const shipDialogVisible = ref(false)
const shipForm = reactive<{
  warehouse_id: number | null
}>({
  warehouse_id: null
})

const receiveDialogVisible = ref(false)
const receiveForm = reactive<{
  warehouse_id: number | null
  received_qties: Record<number, number>
}>({
  warehouse_id: null,
  received_qties: {}
})
const submitting = ref(false)

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Purchase Order Detail',
      supplier: 'Supplier',
      marketplace: 'Marketplace',
      currency: 'Currency',
      orderedAt: 'Ordered',
      shippedAt: 'Shipped',
      receivedAt: 'Received',
      remark: 'Remark',
      sku: 'SKU',
      qtyOrdered: 'Qty Ordered',
      qtyReceived: 'Qty Received',
      unitCost: 'Unit Cost',
      subtotal: 'Subtotal',
      total: 'Total',
      edit: 'Edit',
      submit: 'Submit',
      markShipped: 'Mark Shipped',
      receive: 'Receive',
      close: 'Close',
      shipTitle: 'Mark Shipped',
      shipWarehouse: 'Destination Warehouse',
      shipWarehousePlaceholder: 'Select destination warehouse',
      confirmShip: 'Confirm Ship',
      selectWarehouse: 'Please select warehouse',
      receiveTitle: 'Receive',
      receiveWarehouse: 'Warehouse',
      receiveWarehousePlaceholder: 'Select warehouse',
      receiveQty: 'Received Qty',
      cancel: 'Cancel',
      confirmReceive: 'Confirm Receive',
      submitConfirm: 'Submit this purchase order? It cannot be edited after submission.',
      markShippedConfirm: 'Confirm the purchase order is shipped?',
      closeConfirm: 'Close this purchase order?',
      shipSuccess: 'Shipped successfully.',
      receiveSuccess: 'Received successfully.',
      actionSuccess: 'Operation succeeded',
      actionFailed: 'Operation failed',
      selectWarehouse: 'Please select warehouse'
    }
  }
  return {
    title: '采购单详情',
    supplier: '供应商',
    marketplace: '站点',
    currency: '币种',
    orderedAt: '下单时间',
    shippedAt: '发货时间',
    receivedAt: '到货时间',
    remark: '备注',
    sku: 'SKU',
    qtyOrdered: '订购数量',
    qtyReceived: '已收数量',
    unitCost: '单价',
    subtotal: '小计',
    total: '合计',
    edit: '编辑',
    submit: '提交',
    markShipped: '标记发货',
    receive: '到货验收',
    close: '关闭',
    shipTitle: '标记发货',
    shipWarehouse: '目标仓库',
    shipWarehousePlaceholder: '选择目标仓库',
    confirmShip: '确认发货',
    receiveTitle: '到货验收',
    receiveWarehouse: '入库仓库',
    receiveWarehousePlaceholder: '选择入库仓库',
    receiveQty: '到货数量',
    cancel: '取消',
    confirmReceive: '确认验收并入库',
    submitConfirm: '确认提交该采购单？提交后将无法编辑',
    markShippedConfirm: '确认该采购单已发货？',
    closeConfirm: '确认关闭该采购单？',
    shipSuccess: '发货成功',
    receiveSuccess: '验收完成',
    actionSuccess: '操作成功',
    actionFailed: '操作失败',
    selectWarehouse: '请选择仓库'
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

const getStatusLabel = (status: PurchaseOrderStatus) => {
  return (statusLabels.value as Record<string, string>)[status] || status
}

const canEdit = computed(() => order.value?.status === 'DRAFT')
const canSubmit = computed(() => order.value?.status === 'DRAFT')
const canShip = computed(() => order.value?.status === 'ORDERED')
const canReceive = computed(() => order.value?.status === 'SHIPPED')
const canClose = computed(() => order.value?.status && order.value.status !== 'CLOSED')

const formatDate = (dateTime?: string) => {
  if (!dateTime) return '-'
  return dateTime.substring(0, 10)
}

const loadDetail = async () => {
  if (!orderId) return
  loading.value = true
  try {
    const res = await getPurchaseOrderDetail(orderId)
    order.value = res.data || null
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.back()
}

const handleEdit = () => {
  router.push(`/procurement/purchase-orders/${orderId}/edit`)
}

const handleSubmit = async () => {
  try {
    await ElMessageBox.confirm(labels.value.submitConfirm, labels.value.title, {
      type: 'warning'
    })
    await submitPurchaseOrder(orderId)
    ElMessage.success(labels.value.actionSuccess)
    loadDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || labels.value.actionFailed)
    }
  }
}

const handleShip = () => {
  shipForm.warehouse_id = null
  shipDialogVisible.value = true
}

const handleConfirmShip = async () => {
  if (!shipForm.warehouse_id) {
    ElMessage.error(labels.value.selectWarehouse)
    return
  }
  submitting.value = true
  try {
    await markPurchaseOrderShipped(orderId, {
      warehouse_id: shipForm.warehouse_id
    })
    ElMessage.success(labels.value.shipSuccess)
    shipDialogVisible.value = false
    loadDetail()
  } catch (error: any) {
    ElMessage.error(error.message || labels.value.actionFailed)
  } finally {
    submitting.value = false
  }
}

const handleReceive = () => {
  if (!order.value) return
  receiveForm.warehouse_id = null
  receiveForm.received_qties = {}
  order.value.items?.forEach(item => {
    receiveForm.received_qties[item.id] = item.qty_ordered
  })
  receiveDialogVisible.value = true
}

const handleConfirmReceive = async () => {
  if (!receiveForm.warehouse_id) {
    ElMessage.error(labels.value.selectWarehouse)
    return
  }
  submitting.value = true
  try {
    await receivePurchaseOrder(orderId, {
      warehouse_id: receiveForm.warehouse_id,
      received_qties: receiveForm.received_qties
    })
    ElMessage.success(labels.value.receiveSuccess)
    receiveDialogVisible.value = false
    loadDetail()
  } catch (error: any) {
    ElMessage.error(error.message || labels.value.actionFailed)
  } finally {
    submitting.value = false
  }
}

const handleClose = async () => {
  try {
    await ElMessageBox.confirm(labels.value.closeConfirm, labels.value.title, {
      type: 'warning'
    })
    await closePurchaseOrder(orderId)
    ElMessage.success(labels.value.actionSuccess)
    loadDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || labels.value.actionFailed)
    }
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.purchase-order-page {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-block {
  margin-bottom: 16px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.summary-number {
  font-weight: 600;
}

.sku-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sku-code {
  font-weight: 600;
}

.sku-title {
  color: #909399;
  font-size: 12px;
}

.total-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  font-size: 14px;
}

.amount-text {
  font-weight: 600;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
