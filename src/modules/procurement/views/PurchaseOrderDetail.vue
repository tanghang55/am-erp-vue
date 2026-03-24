<template>
  <div class="purchase-order-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-page-header :content="labels.title" @back="handleBack" />
          <div class="header-actions">
            <el-button v-if="canClose" size="small" type="info" @click="handleClose">
              {{ labels.close }}
            </el-button>
            <el-button v-if="canForceComplete" size="small" type="danger" plain @click="handleOpenForceComplete">
              {{ labels.forceComplete }}
            </el-button>
            <el-button v-if="canInspect" size="small" type="primary" plain @click="handleInspect">
              {{ labels.inspect }}
            </el-button>
            <el-button v-if="canShip" size="small" type="warning" @click="handleShip">
              {{ labels.markShipped }}
            </el-button>
            <el-button v-if="canReceive" size="small" type="success" @click="handleReceive">
              {{ labels.receive }}
            </el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <div v-if="order" class="summary-block">
          <div class="summary-title">
            <el-tag :type="PURCHASE_ORDER_STATUS_CONFIG[order.status]?.color">
              {{ getOrderStatusLabel(order) }}
            </el-tag>
            <span class="summary-number">{{ order.po_number }}</span>
          </div>
          <div class="summary-meta">
            <div class="summary-meta__item">
              <div class="summary-meta__label">{{ labels.supplier }}</div>
              <div class="summary-meta__value">{{ order.supplier?.name || '-' }}</div>
            </div>
            <div class="summary-meta__item">
              <div class="summary-meta__label">{{ labels.marketplace }}</div>
              <div class="summary-meta__value">{{ order.marketplace || '-' }}</div>
            </div>
            <div class="summary-meta__item">
              <div class="summary-meta__label">{{ labels.currency }}</div>
              <div class="summary-meta__value">{{ order.currency }}</div>
            </div>
            <div class="summary-meta__item">
              <div class="summary-meta__label">{{ labels.totalAmount }}</div>
              <div class="summary-meta__value">{{ order.currency }} {{ order.total_amount }}</div>
            </div>
          </div>

          <div class="timeline-panel">
            <div class="timeline-panel__title">{{ labels.timeline }}</div>
            <div class="timeline-grid">
              <div v-for="node in timelineNodes" :key="node.key" class="timeline-node">
                <div class="timeline-node__title">{{ node.label }}</div>
                <div class="timeline-node__time">{{ formatDateTime(node.time) }}</div>
                <div class="timeline-node__operator">
                  {{ labels.operator }}：{{ node.operator || '-' }}
                </div>
              </div>
            </div>
          </div>

          <div class="summary-note-list">
            <div class="summary-note">
              <div class="summary-note__label">{{ labels.remark }}</div>
              <div class="summary-note__value">{{ order.remark || '-' }}</div>
            </div>
            <div v-if="order.is_force_completed === 1" class="summary-note">
              <div class="summary-note__label">{{ labels.forceCompleteReason }}</div>
              <div class="summary-note__value">{{ order.force_complete_reason || '-' }}</div>
            </div>
          </div>
        </div>

        <el-tabs v-model="activeTab" class="detail-tabs">
          <el-tab-pane :label="labels.productTab" name="items">
            <el-table :data="order?.items || []" border stripe>
              <el-table-column :label="labels.product" min-width="220">
                <template #default="{ row }">
                  <div class="product-cell">
                    <div class="product-code">{{ row.product?.seller_sku || row.product_id }}</div>
                    <div class="product-title">{{ row.product?.title || '-' }}</div>
                    <div class="product-rules">
                      <el-tag size="small" :type="row.product?.is_inspection_required === 0 ? 'info' : 'warning'">
                        {{ row.product?.is_inspection_required === 0 ? labels.noInspection : labels.needInspection }}
                      </el-tag>
                      <el-tag size="small" :type="row.product?.is_packing_required === 0 ? 'success' : 'primary'">
                        {{ row.product?.is_packing_required === 0 ? labels.skipPacking : labels.needPacking }}
                      </el-tag>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="labels.qtyOrdered" width="120" align="center">
                <template #default="{ row }">{{ row.qty_ordered }}</template>
              </el-table-column>
              <el-table-column :label="labels.qtyReceived" width="120" align="center">
                <template #default="{ row }">{{ row.qty_received }}</template>
              </el-table-column>
              <el-table-column :label="labels.qtyPendingInspection" width="120" align="center">
                <template #default="{ row }">{{ row.qty_pending_inspection || 0 }}</template>
              </el-table-column>
              <el-table-column :label="labels.qtyInspectionPass" width="120" align="center">
                <template #default="{ row }">{{ row.qty_inspection_pass || 0 }}</template>
              </el-table-column>
              <el-table-column :label="labels.qtyInspectionFail" width="120" align="center">
                <template #default="{ row }">{{ row.qty_inspection_fail || 0 }}</template>
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
          </el-tab-pane>

          <el-tab-pane :label="labels.auditLogs" name="logs">
            <div class="audit-section">
              <div class="audit-section__header">
                <div class="audit-section__subtitle">{{ labels.auditLogsHint }}</div>
                <el-button text @click="loadAuditLogs">{{ labels.refreshLogs }}</el-button>
              </div>

              <el-table v-loading="auditLoading" :data="auditLogs" border stripe>
                <el-table-column :label="labels.logTime" width="180">
                  <template #default="{ row }">
                    {{ formatDateTime(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column :label="labels.operator" width="140">
                  <template #default="{ row }">
                    {{ row.username || '-' }}
                  </template>
                </el-table-column>
                <el-table-column :label="labels.operation" width="160">
                  <template #default="{ row }">
                    {{ getActionLabel(row.action, row.entity_type) }}
                  </template>
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
            :clearable="!hasLockedReceiveWarehouse"
            :disabled="hasLockedReceiveWarehouse"
            style="width: 100%"
          />
          <div v-if="hasLockedReceiveWarehouse" class="form-tip">{{ labels.reuseShipWarehouse }}</div>
        </el-form-item>
        <el-divider>{{ labels.receiveQty }}</el-divider>
        <div v-if="order">
          <el-form-item
            v-for="item in receivableItems"
            :key="item.id"
            :label="item.product?.seller_sku || String(item.product_id)"
          >
            <el-input-number
              v-model="receiveForm.received_qties[item.id]"
              :min="0"
              :max="getRemainingQty(item)"
              :placeholder="`${labels.pendingQty}: ${getRemainingQty(item)}`"
              style="width: 100%"
            />
            <div class="form-tip">
              {{ labels.qtyOrdered }}: {{ item.qty_ordered }} / {{ labels.qtyReceived }}: {{ item.qty_received }} /
              {{ labels.pendingQty }}: {{ getRemainingQty(item) }}
            </div>
            <div class="form-tip">
              {{ item.product?.is_inspection_required === 0 ? labels.noInspection : labels.needInspection }} /
              {{ item.product?.is_packing_required === 0 ? labels.skipPacking : labels.needPacking }}
            </div>
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

    <el-dialog v-model="inspectDialogVisible" :title="labels.inspectTitle" width="640px">
      <el-form label-width="120px">
        <el-alert :title="labels.inspectHint" type="info" :closable="false" show-icon />
        <el-divider>{{ labels.inspectQty }}</el-divider>
        <div v-if="order">
          <el-form-item
            v-for="item in inspectableItems"
            :key="item.id"
            :label="item.product?.seller_sku || String(item.product_id)"
          >
            <div class="inspect-item-grid">
              <el-input-number
                v-model="inspectForm.pass_qties[item.id]"
                :min="0"
                :max="getPendingInspectionQty(item)"
                :placeholder="labels.inspectPass"
                style="width: 100%"
              />
              <el-input-number
                v-model="inspectForm.fail_qties[item.id]"
                :min="0"
                :max="getPendingInspectionQty(item)"
                :placeholder="labels.inspectFail"
                style="width: 100%"
              />
              </div>
              <div class="form-tip">
                {{ labels.qtyPendingInspection }}: {{ getPendingInspectionQty(item) }}
              </div>
              <div class="form-tip">
                {{ item.product?.is_inspection_required === 0 ? labels.noInspection : labels.needInspection }} /
                {{ item.product?.is_packing_required === 0 ? labels.skipPacking : labels.needPacking }}
              </div>
            </el-form-item>
          </div>
        </el-form>
      <template #footer>
        <el-button @click="inspectDialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirmInspect">
          {{ labels.confirmInspect }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="forceCompleteDialogVisible" :title="labels.forceCompleteTitle" width="520px">
      <el-form label-width="120px">
        <el-alert :title="labels.forceCompleteHint" type="warning" :closable="false" show-icon />
        <el-form-item :label="labels.forceCompleteReason" required>
          <el-input v-model="forceCompleteReason" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forceCompleteDialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="danger" :loading="submitting" @click="handleConfirmForceComplete">
          {{ labels.confirmForceComplete }}
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
  markPurchaseOrderShipped,
  receivePurchaseOrder,
  inspectPurchaseOrder,
  closePurchaseOrder,
  forceCompletePurchaseOrder
} from '../api'
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../types'
import { PURCHASE_ORDER_STATUS_CONFIG } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { getSystemAuditLogList } from '@/modules/system/api/logs'
import type { AuditLog } from '@/modules/system/types'
import { useAuditLogFormatter } from '@/modules/common/composables/useAuditLogFormatter'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'

const router = useRouter()
const route = useRoute()
const localeStore = useLocaleStore()
const orderId = Number(route.params.id)

const order = ref<PurchaseOrder | null>(null)
const loading = ref(false)
const activeTab = ref('items')
const auditLogs = ref<AuditLog[]>([])
const auditLoading = ref(false)
const auditPagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})
const { getActionLabel, formatAuditChanges } = useAuditLogFormatter()

const shipDialogVisible = ref(false)
const shipForm = reactive<{
  warehouse_id: number | null
}>({
  warehouse_id: null
})

const receiveDialogVisible = ref(false)
const inspectDialogVisible = ref(false)
const forceCompleteDialogVisible = ref(false)
const forceCompleteReason = ref('')
const receiveForm = reactive<{
  warehouse_id: number | null
  received_qties: Record<number, number>
}>({
  warehouse_id: null,
  received_qties: {}
})
const inspectForm = reactive<{
  pass_qties: Record<number, number>
  fail_qties: Record<number, number>
}>({
  pass_qties: {},
  fail_qties: {}
})
const submitting = ref(false)

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Purchase Order Detail',
      supplier: 'Supplier',
      marketplace: 'Marketplace',
      currency: 'Currency',
      totalAmount: 'Total Amount',
      timeline: 'Timeline',
      createdAt: 'Created',
      orderedAt: 'Ordered',
      orderedBy: 'Ordered By',
      shippedAt: 'Shipped',
      shippedBy: 'Shipped By',
      receivedAt: 'Received',
      receivedBy: 'Received By',
      inspectedAt: 'Inspected',
      inspectedBy: 'Inspected By',
      completedAt: 'Completed',
      completedBy: 'Completed By',
      pendingInspectionStatus: 'Pending QC',
      partialReceiveStatus: 'Receiving',
      readyToCompleteStatus: 'Ready to Complete',
      pendingForceCompleteStatus: 'Pending Exception Completion',
      forceCompletedStatus: 'Force Completed',
      remark: 'Remark',
      product: 'Product',
      qtyOrdered: 'Qty Ordered',
        qtyReceived: 'Qty Received',
        qtyPendingInspection: 'Pending QC',
        qtyInspectionPass: 'QC Pass',
        qtyInspectionFail: 'QC Loss',
        needInspection: 'QC Required',
        noInspection: 'No QC',
        needPacking: 'Packing Required',
        skipPacking: 'Skip Packing',
        unitCost: 'Unit Cost',
      subtotal: 'Subtotal',
      total: 'Total',
      productTab: 'Products',
      auditLogs: 'Audit Logs',
      auditLogsHint: 'Track key procurement actions and field changes for this purchase order.',
      refreshLogs: 'Refresh Logs',
      logTime: 'Time',
      operator: 'Operator',
      operation: 'Operation',
      changeDetail: 'Changes',
      markShipped: 'Mark Shipped',
      receive: 'Receive',
      inspect: 'Inspect',
      close: 'Complete',
      forceComplete: 'Force Complete',
      shipTitle: 'Mark Shipped',
      shipWarehouse: 'Destination Warehouse',
      shipWarehousePlaceholder: 'Select destination warehouse',
      confirmShip: 'Confirm Ship',
      selectWarehouse: 'Please select warehouse',
      receiveTitle: 'Receive',
      receiveWarehouse: 'Warehouse',
      receiveWarehousePlaceholder: 'Select warehouse',
      receiveQty: 'Received Qty',
      inspectTitle: 'Quality Inspection',
      inspectQty: 'Inspection Qty',
      inspectPass: 'Pass Qty',
      inspectFail: 'Fail Qty',
      confirmInspect: 'Confirm Inspection',
      inspectHint: 'Inspection is separated from warehouse receiving. Only current pending inspection qty will be consumed.',
      pendingQty: 'Pending Qty',
      reuseShipWarehouse: 'Reuse the destination warehouse selected at shipment.',
      cancel: 'Cancel',
      confirmReceive: 'Confirm Receive',
      confirmClose: 'Confirm Complete',
      closeConfirm: 'Complete this purchase order?',
      forceCompleteTitle: 'Force Complete Purchase Order',
      forceCompleteHint: 'Use this only for shortage or QC loss closure. Pending inspection must already be cleared.',
      forceCompleteReason: 'Exception Reason',
      confirmForceComplete: 'Confirm Force Complete',
      markShippedConfirm: 'Confirm the purchase order is shipped?',
      shipSuccess: 'Shipped successfully.',
      receiveSuccess: 'Received successfully.',
      inspectSuccess: 'Inspection completed.',
      closeSuccess: 'Completed successfully.',
      forceCompleteSuccess: 'Force completed successfully.',
      actionSuccess: 'Operation succeeded',
      actionFailed: 'Operation failed'
    }
  }
  return {
    title: '采购单详情',
    supplier: '供应商',
    marketplace: '站点',
    currency: '币种',
    totalAmount: '总金额',
    timeline: '时间节点',
    createdAt: '创建时间',
    orderedAt: '下单时间',
    orderedBy: '下单人',
    shippedAt: '发货时间',
    shippedBy: '发货人',
    receivedAt: '到货时间',
    receivedBy: '收货人',
    inspectedAt: '质检时间',
    inspectedBy: '质检人',
    completedAt: '完成时间',
    completedBy: '完成人',
    pendingInspectionStatus: '待质检',
    partialReceiveStatus: '收货中',
    readyToCompleteStatus: '待完成',
    pendingForceCompleteStatus: '待异常完成',
    forceCompletedStatus: '异常完成',
    remark: '备注',
    product: '产品',
    qtyOrdered: '订购数量',
    qtyReceived: '已收数量',
      qtyPendingInspection: '待检数量',
      qtyInspectionPass: '质检通过',
      qtyInspectionFail: '质检损失',
      needInspection: '需质检',
      noInspection: '免检',
      needPacking: '需打包',
      skipPacking: '免打包直通',
      unitCost: '单价',
    subtotal: '小计',
    total: '合计',
    productTab: '产品',
    auditLogs: '操作日志',
    auditLogsHint: '查看这张采购单的关键操作和字段变化，只记录真实变更。',
    refreshLogs: '刷新日志',
    logTime: '操作时间',
    operator: '操作人',
    operation: '操作',
    changeDetail: '变更内容',
    markShipped: '标记发货',
    receive: '到货验收',
    inspect: '采购质检',
    close: '完成采购单',
    forceComplete: '强制完成采购',
    shipTitle: '标记发货',
    shipWarehouse: '目标仓库',
    shipWarehousePlaceholder: '选择目标仓库',
    confirmShip: '确认发货',
    receiveTitle: '到货验收',
    receiveWarehouse: '入库仓库',
    receiveWarehousePlaceholder: '选择入库仓库',
    receiveQty: '到货数量',
    inspectTitle: '采购质检',
    inspectQty: '质检数量',
    inspectPass: '通过数量',
    inspectFail: '不合格数量',
    confirmInspect: '确认质检',
    inspectHint: '质检和到货验收分开处理，只会消化当前这张采购单的待检数量。',
    pendingQty: '待收数量',
    reuseShipWarehouse: '沿用标记发货时选择的目标仓库，无需再次选择。',
    cancel: '取消',
    confirmReceive: '确认验收并入库',
    confirmClose: '确认完成',
    closeConfirm: '确认完成该采购单？',
    forceCompleteTitle: '强制完成采购单',
    forceCompleteHint: '只用于少收或质检损失结案。待检数量必须先清零。',
    forceCompleteReason: '异常原因',
    confirmForceComplete: '确认强制完成',
    markShippedConfirm: '确认该采购单已发货？',
    shipSuccess: '发货成功',
    receiveSuccess: '验收完成',
    inspectSuccess: '质检完成',
    closeSuccess: '完成成功',
    forceCompleteSuccess: '强制完成成功',
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
      CLOSED: 'Completed'
    }
  }
  return {
    DRAFT: '草稿',
    ORDERED: '已下单',
    SHIPPED: '已发货',
    RECEIVED: '已收货',
    CLOSED: '已完成'
  }
})

const getStatusLabel = (status: PurchaseOrderStatus) => {
  return (statusLabels.value as Record<string, string>)[status] || status
}

const canShip = computed(() => order.value?.status === 'ORDERED')
const canReceive = computed(() => order.value?.status === 'SHIPPED')
const hasReceiptException = (value?: PurchaseOrder | null) => {
  if (!value) return false
  const ordered = (value.items || []).reduce((sum, item) => sum + (item.qty_ordered || 0), 0)
  const received = (value.items || []).reduce((sum, item) => sum + (item.qty_received || 0), 0)
  const inspectionFail = (value.items || []).reduce((sum, item) => sum + (item.qty_inspection_fail || 0), 0)
  return received < ordered || inspectionFail > 0
}
const getPendingInspectionTotal = (value?: PurchaseOrder | null) => {
  if (!value) return 0
  if (typeof value.qty_pending_inspection_total === 'number') {
    return Math.max(value.qty_pending_inspection_total, 0)
  }
  return (value.items || []).reduce((sum, item) => sum + Math.max(item.qty_pending_inspection || 0, 0), 0)
}

const canClose = computed(() => order.value?.status === 'RECEIVED' && getPendingInspectionTotal(order.value) === 0 && !hasReceiptException(order.value))
const canForceComplete = computed(() => ['SHIPPED', 'RECEIVED'].includes(order.value?.status || '') && getPendingInspectionTotal(order.value) === 0 && hasReceiptException(order.value))
const canInspect = computed(() => ['SHIPPED', 'RECEIVED'].includes(order.value?.status || '') && getPendingInspectionTotal(order.value) > 0)
const hasLockedReceiveWarehouse = computed(() => Boolean(order.value?.warehouse_id))
const receivableItems = computed(() => (order.value?.items || []).filter(item => getRemainingQty(item) > 0))
const inspectableItems = computed(() => (order.value?.items || []).filter(item => getPendingInspectionQty(item) > 0))
const timelineNodes = computed(() => {
  if (!order.value) return []
  return [
    {
      key: 'created',
      label: labels.value.createdAt,
      time: order.value.created_at,
      operator: order.value.created_by_name
    },
    {
      key: 'ordered',
      label: labels.value.orderedAt,
      time: order.value.ordered_at,
      operator: order.value.ordered_by_name
    },
    {
      key: 'shipped',
      label: labels.value.shippedAt,
      time: order.value.shipped_at,
      operator: order.value.shipped_by_name
    },
    {
      key: 'received',
      label: labels.value.receivedAt,
      time: order.value.received_at,
      operator: order.value.received_by_name
    },
    {
      key: 'inspected',
      label: labels.value.inspectedAt,
      time: order.value.inspected_at,
      operator: order.value.inspected_by_name
    },
    {
      key: 'completed',
      label: order.value.is_force_completed === 1 ? labels.value.forceComplete : labels.value.completedAt,
      time: order.value.closed_at,
      operator: order.value.completed_by_name || order.value.force_completed_by_name
    }
  ]
})

const formatDateTime = (dateTime?: string) => {
  if (!dateTime) return '-'
  return dateTime.replace('T', ' ').substring(0, 19)
}

const getRemainingQty = (item: PurchaseOrderItem) => {
  return Math.max((item?.qty_ordered || 0) - (item?.qty_received || 0), 0)
}

const getPendingInspectionQty = (item: PurchaseOrderItem) => {
  return Math.max(item?.qty_pending_inspection || 0, 0)
}

const getOrderStatusLabel = (value?: PurchaseOrder | null) => {
  if (!value) return '-'
  if (value.status === 'CLOSED') {
    return value.is_force_completed === 1 ? labels.value.forceCompletedStatus : getStatusLabel(value.status)
  }
  if (value.status === 'SHIPPED') {
    if (getPendingInspectionTotal(value) > 0) {
      return labels.value.pendingInspectionStatus
    }
    const ordered = (value.items || []).reduce((sum, item) => sum + (item.qty_ordered || 0), 0)
    const received = (value.items || []).reduce((sum, item) => sum + (item.qty_received || 0), 0)
    if (received > 0 && received < ordered) {
      return labels.value.partialReceiveStatus
    }
  }
  if (value.status === 'RECEIVED' && hasReceiptException(value)) {
    return labels.value.pendingForceCompleteStatus
  }
  if (value.status === 'RECEIVED') {
    return getPendingInspectionTotal(value) > 0 ? labels.value.pendingInspectionStatus : labels.value.readyToCompleteStatus
  }
  return getStatusLabel(value.status)
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

const loadAuditLogs = async () => {
  if (!orderId) return
  auditLoading.value = true
  try {
    const res = await getSystemAuditLogList({
      page: auditPagination.page,
      page_size: auditPagination.page_size,
      module: 'Procurement',
      entity_type: 'PurchaseOrder',
      entity_id: String(orderId)
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

const handleBack = () => {
  router.back()
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
    await Promise.all([loadDetail(), loadAuditLogs()])
  } catch (error: any) {
    ElMessage.error(error.message || labels.value.actionFailed)
  } finally {
    submitting.value = false
  }
}

const handleReceive = () => {
  if (!order.value) return
  receiveForm.warehouse_id = order.value.warehouse_id || null
  receiveForm.received_qties = {}
  receivableItems.value.forEach(item => {
    receiveForm.received_qties[item.id] = getRemainingQty(item)
  })
  receiveDialogVisible.value = true
}

const handleInspect = () => {
  if (!order.value) return
  inspectForm.pass_qties = {}
  inspectForm.fail_qties = {}
  inspectableItems.value.forEach(item => {
    inspectForm.pass_qties[item.id] = getPendingInspectionQty(item)
    inspectForm.fail_qties[item.id] = 0
  })
  inspectDialogVisible.value = true
}

const handleClose = async () => {
  try {
    await ElMessageBox.confirm(labels.value.closeConfirm, labels.value.title, {
      confirmButtonText: labels.value.confirmClose,
      cancelButtonText: labels.value.cancel,
      type: 'warning'
    })
    submitting.value = true
    await closePurchaseOrder(orderId)
    ElMessage.success(labels.value.closeSuccess)
    await Promise.all([loadDetail(), loadAuditLogs()])
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || labels.value.actionFailed)
    }
  } finally {
    submitting.value = false
  }
}

const handleOpenForceComplete = () => {
  forceCompleteReason.value = ''
  forceCompleteDialogVisible.value = true
}

const handleConfirmForceComplete = async () => {
  if (!forceCompleteReason.value.trim()) {
    ElMessage.error(labels.value.forceCompleteReason)
    return
  }
  submitting.value = true
  try {
    await forceCompletePurchaseOrder(orderId, { reason: forceCompleteReason.value.trim() })
    ElMessage.success(labels.value.forceCompleteSuccess)
    forceCompleteDialogVisible.value = false
    await Promise.all([loadDetail(), loadAuditLogs()])
  } catch (error: any) {
    ElMessage.error(error.message || labels.value.actionFailed)
  } finally {
    submitting.value = false
  }
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
    await Promise.all([loadDetail(), loadAuditLogs()])
  } catch (error: any) {
    ElMessage.error(error.message || labels.value.actionFailed)
  } finally {
    submitting.value = false
  }
}

const handleConfirmInspect = async () => {
  const hasQty = inspectableItems.value.some(item => {
    const passQty = inspectForm.pass_qties[item.id] || 0
    const failQty = inspectForm.fail_qties[item.id] || 0
    return passQty > 0 || failQty > 0
  })
  if (!hasQty) {
    ElMessage.error(labels.value.inspectQty)
    return
  }
  for (const item of inspectableItems.value) {
    const pendingQty = getPendingInspectionQty(item)
    const passQty = inspectForm.pass_qties[item.id] || 0
    const failQty = inspectForm.fail_qties[item.id] || 0
    if (passQty + failQty > pendingQty) {
      ElMessage.error(`${item.product?.seller_sku || item.product_id} ${labels.value.qtyPendingInspection}: ${pendingQty}`)
      return
    }
  }
  submitting.value = true
  try {
    await inspectPurchaseOrder(orderId, {
      pass_qties: inspectForm.pass_qties,
      fail_qties: inspectForm.fail_qties
    })
    ElMessage.success(labels.value.inspectSuccess)
    inspectDialogVisible.value = false
    await Promise.all([loadDetail(), loadAuditLogs()])
  } catch (error: any) {
    ElMessage.error(error.message || labels.value.actionFailed)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDetail()
  loadAuditLogs()
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

.summary-meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-meta__item,
.timeline-node,
.summary-note {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
}

.summary-meta__item {
  padding: 14px 16px;
}

.summary-meta__label,
.summary-note__label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.summary-meta__value,
.summary-note__value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  line-height: 1.6;
}

.timeline-panel {
  margin-bottom: 16px;
}

.timeline-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.timeline-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.timeline-node {
  padding: 14px 16px;
}

.timeline-node__title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.timeline-node__time {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.timeline-node__operator {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.summary-note-list {
  display: grid;
  gap: 12px;
}

.summary-note {
  padding: 14px 16px;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-code {
  font-weight: 600;
}

.product-title {
  color: #909399;
  font-size: 12px;
}

.product-rules {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.inspect-item-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
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

.audit-section {
  margin-top: 24px;
}

.audit-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.audit-section__title {
  font-size: 16px;
  font-weight: 600;
}

.audit-section__subtitle {
  margin-top: 4px;
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

@media (max-width: 1200px) {
  .summary-meta,
  .timeline-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .summary-meta,
  .timeline-grid {
    grid-template-columns: 1fr;
  }
}
</style>
