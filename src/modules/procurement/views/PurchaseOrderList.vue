<template>
  <div class="purchase-order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">{{ labels.title }}</span>
          <div class="header-actions">
            <el-button type="success" plain @click="handleOpenReplenishment">
              {{ labels.replenishment }}
            </el-button>
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
        <el-form :model="searchForm" class="search-form" @submit.prevent="handleSearch">
          <div class="search-form__row">
            <el-form-item class="search-form__keyword">
              <el-input
                v-model="searchForm.keyword"
                :placeholder="labels.keywordPlaceholder"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item class="search-form__supplier">
              <supplier-selector
                v-model="searchForm.supplier_id"
                :placeholder="labels.supplierPlaceholder"
                clearable
              />
            </el-form-item>
            <el-form-item class="search-form__status">
              <el-select
                v-model="searchForm.status"
                :placeholder="labels.allStatus"
                clearable
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
            <el-form-item class="search-form__actions">
              <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
              <el-button @click="handleReset">{{ labels.reset }}</el-button>
            </el-form-item>
          </div>
          <div class="search-form__row search-form__row--secondary">
            <el-form-item class="search-form__marketplace">
              <el-select
                v-model="searchForm.marketplace"
                :placeholder="labels.marketplacePlaceholder"
                clearable
              >
                <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </div>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column type="expand" width="52">
          <template #default="{ row }">
            <div class="po-items-panel">
              <el-table
                v-if="row.items?.length"
                :data="row.items"
                border
                stripe
                size="small"
                class="po-items-table"
                table-layout="auto"
              >
                <el-table-column type="index" width="56" align="center" label="#" />
                <el-table-column :label="labels.productInfo" width="250">
                  <template #default="{ row: item }">
                    <div class="po-product-cell">
                      <div class="po-product-image-wrap">
                        <el-image
                          v-if="item.product?.image_url"
                          :src="item.product.image_url"
                          fit="cover"
                          class="po-product-image"
                        />
                        <div v-else class="po-product-image-fallback">{{ labels.noImage }}</div>
                      </div>
                      <div class="po-product-info">
                        <div class="po-product-sku">{{ item.product?.seller_sku || item.product_id }}</div>
                        <div class="po-product-title">{{ item.product?.title || '-' }}</div>
                        <div class="po-product-rules">
                          <el-tag size="small" :type="item.product?.is_inspection_required === 0 ? 'info' : 'warning'">
                            {{ item.product?.is_inspection_required === 0 ? labels.noInspection : labels.needInspection }}
                          </el-tag>
                          <el-tag size="small" :type="item.product?.is_packing_required === 0 ? 'success' : 'primary'">
                            {{ item.product?.is_packing_required === 0 ? labels.skipPacking : labels.needPacking }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="labels.orderedQty" width="90" align="center">
                  <template #default="{ row: item }">{{ item.qty_ordered }}</template>
                </el-table-column>
                <el-table-column :label="labels.receivedQtyShort" width="90" align="center">
                  <template #default="{ row: item }">{{ item.qty_received }}</template>
                </el-table-column>
                <el-table-column :label="labels.pendingQty" width="90" align="center">
                  <template #default="{ row: item }">{{ item.qty_ordered - item.qty_received }}</template>
                </el-table-column>
                <el-table-column :label="labels.unitCost" width="120" align="right">
                  <template #default="{ row: item }">{{ row.currency }} {{ item.unit_cost }}</template>
                </el-table-column>
                <el-table-column :label="labels.subtotal" width="120" align="right">
                  <template #default="{ row: item }">
                    {{ row.currency }} {{ item.subtotal }}
                  </template>
                </el-table-column>
              </el-table>
              <span v-else class="po-items-empty">{{ labels.noProducts }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.poNumber" min-width="280">
          <template #default="{ row }">
            <div class="po-main">
              <div class="po-main-number">{{ row.po_number }}</div>
              <div class="po-main-meta">
                <span>{{ row.currency }} {{ row.total_amount }}</span>
                <span>{{ labels.productCount }} {{ row.items?.length || 0 }}</span>
                <span>{{ labels.totalOrdered }} {{ getTotalOrderedQty(row) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.productList" min-width="300">
          <template #default="{ row }">
            <div class="po-products">
              <div
                v-for="item in getVisibleProductItems(row)"
                :key="item.id"
                class="po-products__item"
              >
                <div class="po-products__sku">
                  {{ item.product?.seller_sku || item.product_id }}
                  <span class="po-products__qty">x{{ item.qty_ordered }}</span>
                </div>
                <div class="po-products__title">{{ item.product?.title || '-' }}</div>
                <div class="po-products__rules">
                  <el-tag size="small" :type="item.product?.is_inspection_required === 0 ? 'info' : 'warning'">
                    {{ item.product?.is_inspection_required === 0 ? labels.noInspection : labels.needInspection }}
                  </el-tag>
                  <el-tag size="small" :type="item.product?.is_packing_required === 0 ? 'success' : 'primary'">
                    {{ item.product?.is_packing_required === 0 ? labels.skipPacking : labels.needPacking }}
                  </el-tag>
                </div>
              </div>
              <div v-if="getHiddenProductCount(row) > 0" class="po-products__more">
                {{ labels.moreProductsPrefix }} {{ getHiddenProductCount(row) }} {{ labels.moreProductsSuffix }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.status" width="120">
          <template #default="{ row }">
            <el-tag :type="PURCHASE_ORDER_STATUS_CONFIG[row.status]?.color">
              {{ PURCHASE_ORDER_STATUS_CONFIG[row.status]?.icon }}
              {{ getOrderStatusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="labels.supplier" min-width="220">
          <template #default="{ row }">
            <div class="supplier-block">
              <div class="supplier-name">{{ row.supplier?.name || '-' }}</div>
              <div class="supplier-meta">{{ row.marketplace || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.timeline" min-width="260">
          <template #default="{ row }">
            <div class="timeline-block">
              <div>{{ labels.createdAt }}: {{ formatDateTime(row.created_at) }}</div>
              <div v-if="row.ordered_at">{{ labels.orderedAt }}: {{ formatDateTime(row.ordered_at) }} / {{ row.ordered_by_name || '-' }}</div>
              <div v-if="row.shipped_at">{{ labels.shippedAt }}: {{ formatDateTime(row.shipped_at) }} / {{ row.shipped_by_name || '-' }}</div>
              <div v-if="row.received_at">{{ labels.receivedAt }}: {{ formatDateTime(row.received_at) }} / {{ row.received_by_name || '-' }}</div>
              <div v-if="row.inspected_at">{{ labels.inspectedAt }}: {{ formatDateTime(row.inspected_at) }} / {{ row.inspected_by_name || '-' }}</div>
              <div v-if="row.closed_at">{{ labels.completedAt }}: {{ formatDateTime(row.closed_at) }} / {{ row.completed_by_name || row.force_completed_by_name || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="labels.remark" min-width="150" show-overflow-tooltip />
        <el-table-column :label="labels.actions" width="430" fixed="right">
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
              v-if="['SHIPPED', 'RECEIVED'].includes(row.status) && getPendingInspectionTotal(row) > 0"
              size="small"
              type="primary"
              plain
              @click="handleInspect(row)"
            >
              {{ labels.inspect }}
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
              v-if="row.status === 'RECEIVED' && getPendingInspectionTotal(row) === 0 && !hasReceiptException(row)"
              size="small"
              type="info"
              @click="handleClose(row)"
            >
              {{ labels.close }}
            </el-button>
            <el-button
              v-if="['SHIPPED', 'RECEIVED'].includes(row.status) && getPendingInspectionTotal(row) === 0 && hasReceiptException(row)"
              size="small"
              type="danger"
              plain
              @click="handleOpenForceComplete(row)"
            >
              {{ labels.forceComplete }}
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

    <!-- 标记发货对话框 -->
    <el-dialog v-model="shipDialogVisible" :title="labels.shipTitle" width="400px">
      <el-form :model="shipForm" label-width="120px">
        <el-form-item :label="labels.shipWarehouse" required>
          <warehouse-selector
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

    <!-- 到货验收对话框 -->
    <el-dialog v-model="receiveDialogVisible" :title="labels.receiveTitle" width="600px">
      <el-form :model="receiveForm" label-width="120px">
        <el-form-item :label="labels.receiveWarehouse" required>
          <warehouse-selector
            v-model="receiveForm.warehouse_id"
            :placeholder="labels.receiveWarehousePlaceholder"
            :clearable="!hasLockedReceiveWarehouse"
            :disabled="hasLockedReceiveWarehouse"
            style="width: 100%"
          />
          <div v-if="hasLockedReceiveWarehouse" class="form-tip">{{ labels.reuseShipWarehouse }}</div>
        </el-form-item>
        <el-divider>{{ labels.receiveQty }}</el-divider>
        <div v-if="currentPO">
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
              {{ labels.orderedQty }}: {{ item.qty_ordered }} / {{ labels.receivedQtyShort }}: {{ item.qty_received }} /
              {{ labels.pendingQty }}: {{ getRemainingQty(item) }}
            </div>
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

    <el-dialog v-model="inspectDialogVisible" :title="labels.inspectTitle" width="640px">
      <el-form label-width="120px">
        <el-alert :title="labels.inspectHint" type="info" :closable="false" show-icon />
        <el-divider>{{ labels.inspectQty }}</el-divider>
        <div v-if="currentPO">
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
                :placeholder="labels.inspectFailQty"
                style="width: 100%"
              />
            </div>
            <div class="form-tip">
              {{ labels.qtyPendingInspection }}: {{ getPendingInspectionQty(item) }}
            </div>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="inspectDialogVisible = false">{{ labels.cancel }}</el-button>
        <el-button type="primary" @click="handleConfirmInspect" :loading="submitting">
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
import {
  getPurchaseOrderList,
  getPurchaseOrderDetail,
  submitPurchaseOrder,
  markPurchaseOrderShipped,
  receivePurchaseOrder,
  inspectPurchaseOrder,
  deletePurchaseOrder,
  closePurchaseOrder,
  forceCompletePurchaseOrder
} from '../api'
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../types'
import { PURCHASE_ORDER_STATUS_CONFIG } from '../types'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import SupplierSelector from '@/modules/supplier/components/SupplierSelector.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const router = useRouter()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Purchase Orders',
      create: 'New PO',
      replenishment: 'Replenishment Plans',
      export: 'Export Excel',
      status: 'Status',
      allStatus: 'All Status',
      keyword: 'Keyword',
      keywordPlaceholder: 'PO number/remark',
      supplierPlaceholder: 'Select supplier',
      marketplacePlaceholder: 'Select marketplace',
      search: 'Search',
      reset: 'Reset',
      poNumber: 'PO Number',
      supplier: 'Supplier',
      productSummary: 'Product Summary',
      productList: 'Products',
      productInfo: 'Product',
        productTitle: 'Title',
        receivedQtyShort: 'Received',
        pendingQty: 'Pending',
        needInspection: 'QC Required',
        noInspection: 'No QC',
        needPacking: 'Packing Required',
        skipPacking: 'Skip Packing',
        totalOrdered: 'Ordered',
      totalOrderedShort: 'Ordered',
      totalReceivedShort: 'Received',
      summary: 'Summary',
      product: 'Product',
      unitCost: 'Unit Cost',
      subtotal: 'Subtotal',
      noProducts: 'No products',
      moreProductsPrefix: 'And',
      moreProductsSuffix: 'more',
      noImage: 'No image',
      marketplace: 'Marketplace',
      totalAmount: 'Total',
      productCount: 'Product Count',
      timeline: 'Timeline',
      completedAt: 'Completed',
      pendingInspectionStatus: 'Pending QC',
      partialReceiveStatus: 'Receiving',
      readyToCompleteStatus: 'Ready to Complete',
      pendingForceCompleteStatus: 'Pending Exception Completion',
      forceCompletedStatus: 'Force Completed',
      orderedAt: 'Ordered',
      inspectedAt: 'Inspected',
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
      inspect: 'Inspect',
      close: 'Complete',
      forceComplete: 'Force Complete',
      delete: 'Delete',
      shipTitle: 'Mark Shipped',
      shipWarehouse: 'Destination Warehouse',
      shipWarehousePlaceholder: 'Select destination warehouse',
      confirmShip: 'Confirm Ship',
      receiveTitle: 'Receive',
      receiveWarehouse: 'Warehouse',
      receiveWarehousePlaceholder: 'Select warehouse',
      receiveQty: 'Received Qty',
      inspectTitle: 'Quality Inspection',
      inspectQty: 'Inspection Qty',
      inspectPass: 'Pass Qty',
      inspectFailQty: 'Fail Qty',
      qtyPendingInspection: 'Pending QC',
      confirmInspect: 'Confirm Inspection',
      inspectHint: 'Inspection is separated from warehouse receiving. Only current pending inspection qty of this purchase order will be consumed.',
      reuseShipWarehouse: 'Reuse the destination warehouse selected at shipment.',
      forceCompleteTitle: 'Force Complete Purchase Order',
      forceCompleteHint: 'Use this only for shortage or QC loss closure. Pending inspection must already be cleared.',
      forceCompleteReason: 'Exception Reason',
      confirmForceComplete: 'Confirm Force Complete',
      orderedQty: 'Ordered Qty',
      cancel: 'Cancel',
      confirmReceive: 'Confirm Receive',
      closeConfirm: 'Complete this purchase order?',
      submitConfirm: 'Submit this purchase order? It cannot be edited after submission.',
      markShippedConfirm: 'Confirm the purchase order is shipped?',
      deleteConfirm: 'Delete this purchase order?',
      confirmTitle: 'Confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      submitted: 'Purchase order submitted',
      shipSuccess: 'Marked as shipped',
      receiveSuccess: 'Received successfully. Inventory updated.',
      inspectSuccess: 'Inspection completed.',
      closeSuccess: 'Completed successfully.',
      forceCompleteSuccess: 'Force completed successfully.',
      deleteSuccess: 'Deleted',
      selectWarehouse: 'Please select warehouse',
      loadFail: 'Failed to load purchase orders',
      submitFail: 'Submit failed',
      markShippedFail: 'Operation failed',
      receiveFail: 'Receive failed',
      inspectFail: 'Inspection failed',
      closeFail: 'Complete failed',
      deleteFail: 'Delete failed',
      exportTodo: 'Export is not implemented yet'
    }
  }
  return {
    title: '采购订单',
    create: '新建采购单',
    replenishment: '采购计划',
    export: '导出Excel',
    status: '状态',
    allStatus: '全部状态',
    keyword: '关键词',
    keywordPlaceholder: 'PO号/备注',
    supplierPlaceholder: '选择供应商',
    marketplacePlaceholder: '选择站点',
    search: '搜索',
    reset: '重置',
    poNumber: '采购单号',
    supplier: '供应商',
    productSummary: '产品概览',
    productList: '产品列表',
    productInfo: '产品',
    productTitle: '标题',
      receivedQtyShort: '已收',
      pendingQty: '未收',
      needInspection: '需质检',
      noInspection: '免检',
      needPacking: '需打包',
      skipPacking: '免打包直通',
      totalOrdered: '订购',
    totalOrderedShort: '订购',
    totalReceivedShort: '已收',
    summary: '汇总',
    product: '产品',
    unitCost: '单价',
    subtotal: '小计',
    noProducts: '暂无产品',
    moreProductsPrefix: '等',
    moreProductsSuffix: '个产品',
    noImage: '无图',
    marketplace: '站点',
    totalAmount: '总金额',
    productCount: '产品数量',
    timeline: '时间节点',
    completedAt: '完成',
    pendingInspectionStatus: '待质检',
    partialReceiveStatus: '收货中',
    readyToCompleteStatus: '待完成',
    pendingForceCompleteStatus: '待异常完成',
    forceCompletedStatus: '异常完成',
    orderedAt: '下单',
    inspectedAt: '质检',
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
    inspect: '采购质检',
    close: '完成',
    forceComplete: '强制完成采购',
    delete: '删除',
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
    inspectFailQty: '不合格数量',
    qtyPendingInspection: '待检数量',
    confirmInspect: '确认质检',
    inspectHint: '质检和到货验收分开处理，只会消化当前这张采购单的待检数量。',
    reuseShipWarehouse: '沿用标记发货时选择的目标仓库，无需再次选择。',
    forceCompleteTitle: '强制完成采购单',
    forceCompleteHint: '只用于少收或质检损失结案。待检数量必须先清零。',
    forceCompleteReason: '异常原因',
    confirmForceComplete: '确认强制完成',
    orderedQty: '订购数量',
    cancel: '取消',
    confirmReceive: '确认验收并入库',
    closeConfirm: '确认完成该采购单？',
    submitConfirm: '确认提交该采购单？提交后将无法编辑',
    markShippedConfirm: '确认该采购单已发货？',
    deleteConfirm: '确认删除该采购单？',
    confirmTitle: '提示',
    confirmText: '确定',
    cancelText: '取消',
    submitted: '采购单已提交',
    shipSuccess: '发货成功',
    receiveSuccess: '验收完成，库存已自动入库',
    inspectSuccess: '质检完成',
    closeSuccess: '完成成功',
    forceCompleteSuccess: '强制完成成功',
    deleteSuccess: '删除成功',
    selectWarehouse: '请选择仓库',
    loadFail: '加载采购单列表失败',
    submitFail: '提交失败',
    markShippedFail: '操作失败',
    receiveFail: '验收失败',
    inspectFail: '质检失败',
    closeFail: '完成失败',
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

const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']

// 列表数据
const list = ref<PurchaseOrder[]>([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  status: '' as PurchaseOrderStatus | '',
  keyword: '',
  supplier_id: null as number | null,
  marketplace: ''
})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

// 导出状态
const exporting = ref(false)

// 标记发货对话框
const shipDialogVisible = ref(false)
const shipForm = reactive<{
  warehouse_id: number | null
}>({
  warehouse_id: null
})

// 到货验收对话框
const receiveDialogVisible = ref(false)
const inspectDialogVisible = ref(false)
const forceCompleteDialogVisible = ref(false)
const forceCompleteReason = ref('')
const currentPO = ref<PurchaseOrder | null>(null)
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
const hasLockedReceiveWarehouse = computed(() => Boolean(currentPO.value?.warehouse_id))
const receivableItems = computed(() => (currentPO.value?.items || []).filter(item => getRemainingQty(item) > 0))
const inspectableItems = computed(() => (currentPO.value?.items || []).filter(item => getPendingInspectionQty(item) > 0))

// 格式化日期
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

const getPendingInspectionTotal = (order?: PurchaseOrder | null) => {
  if (!order) return 0
  if (typeof order.qty_pending_inspection_total === 'number') {
    return Math.max(order.qty_pending_inspection_total, 0)
  }
  return (order.items || []).reduce((sum, item) => sum + Math.max(item.qty_pending_inspection || 0, 0), 0)
}

const getReceivedTotal = (order?: PurchaseOrder | null) => {
  if (!order) return 0
  return (order.items || []).reduce((sum, item) => sum + Math.max(item.qty_received || 0, 0), 0)
}

const getOrderedTotal = (order?: PurchaseOrder | null) => {
  if (!order) return 0
  return (order.items || []).reduce((sum, item) => sum + Math.max(item.qty_ordered || 0, 0), 0)
}

const getInspectionFailTotal = (order?: PurchaseOrder | null) => {
  if (!order) return 0
  return (order.items || []).reduce((sum, item) => sum + Math.max(item.qty_inspection_fail || 0, 0), 0)
}

const hasReceiptException = (order?: PurchaseOrder | null) => {
  if (!order) return false
  return getReceivedTotal(order) < getOrderedTotal(order) || getInspectionFailTotal(order) > 0
}

const getVisibleProductItems = (order: PurchaseOrder) => {
  return (order.items || []).slice(0, 2)
}

const getHiddenProductCount = (order: PurchaseOrder) => {
  return Math.max((order.items?.length || 0) - getVisibleProductItems(order).length, 0)
}

const getOrderStatusLabel = (order: PurchaseOrder) => {
  if (order.status === 'CLOSED') {
    return order.is_force_completed === 1 ? labels.value.forceCompletedStatus : getStatusLabel(order.status)
  }
  if (order.status === 'SHIPPED') {
    if (getPendingInspectionTotal(order) > 0) {
      return labels.value.pendingInspectionStatus
    }
    if (getReceivedTotal(order) > 0) {
      return labels.value.partialReceiveStatus
    }
  }
  if (order.status === 'RECEIVED') {
    if (hasReceiptException(order)) {
      return labels.value.pendingForceCompleteStatus
    }
    return getPendingInspectionTotal(order) > 0 ? labels.value.pendingInspectionStatus : labels.value.readyToCompleteStatus
  }
  return getStatusLabel(order.status)
}

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const res = await getPurchaseOrderList({
      page: pagination.page,
      page_size: pagination.page_size,
      status: searchForm.status || undefined,
      keyword: searchForm.keyword || undefined,
      supplier_id: searchForm.supplier_id || undefined,
      marketplace: searchForm.marketplace || undefined
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
    keyword: '',
    supplier_id: null,
    marketplace: ''
  })
  handleSearch()
}

// 新建
const handleCreate = () => {
  router.push('/procurement/purchase-orders/create')
}

const handleOpenReplenishment = () => {
  router.push('/procurement/replenishment/plans')
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
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Submit failed:', error)
      ElMessage.error(getErrorMessage(error, labels.value.submitFail))
    }
  }
}

const loadCurrentDetail = async (id: number) => {
  const res = await getPurchaseOrderDetail(id)
  currentPO.value = res.data || null
  return currentPO.value
}

// 标记发货
const handleMarkShipped = (row: PurchaseOrder) => {
  currentPO.value = row
  shipForm.warehouse_id = null
  shipDialogVisible.value = true
}

// 确认发货
const handleConfirmShip = async () => {
  if (!shipForm.warehouse_id) {
    ElMessage.error(labels.value.selectWarehouse)
    return
  }

  if (!currentPO.value) return

  submitting.value = true
  try {
    await markPurchaseOrderShipped(currentPO.value.id, {
      warehouse_id: shipForm.warehouse_id
    })
    ElMessage.success(labels.value.shipSuccess)
    shipDialogVisible.value = false
    loadList()
  } catch (error: unknown) {
    console.error('Mark shipped failed:', error)
    ElMessage.error(getErrorMessage(error, labels.value.markShippedFail))
  } finally {
    submitting.value = false
  }
}

// 到货验收
const handleReceive = (row: PurchaseOrder) => {
  currentPO.value = row
  receiveForm.warehouse_id = row.warehouse_id || null
  receiveForm.received_qties = {}
  receivableItems.value.forEach(item => {
    receiveForm.received_qties[item.id] = getRemainingQty(item)
  })
  receiveDialogVisible.value = true
}

const handleInspect = async (row: PurchaseOrder) => {
  try {
    const detail = await loadCurrentDetail(row.id)
    if (!detail) return
    inspectForm.pass_qties = {}
    inspectForm.fail_qties = {}
    inspectableItems.value.forEach(item => {
      inspectForm.pass_qties[item.id] = getPendingInspectionQty(item)
      inspectForm.fail_qties[item.id] = 0
    })
    if (!inspectableItems.value.length) {
      ElMessage.warning(labels.value.qtyPendingInspection)
      return
    }
    inspectDialogVisible.value = true
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, labels.value.loadFail))
  }
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
  } catch (error: unknown) {
    console.error('Receive failed:', error)
    ElMessage.error(getErrorMessage(error, labels.value.receiveFail))
  } finally {
    submitting.value = false
  }
}

const handleConfirmInspect = async () => {
  if (!currentPO.value) return

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
    await inspectPurchaseOrder(currentPO.value.id, {
      pass_qties: inspectForm.pass_qties,
      fail_qties: inspectForm.fail_qties
    })
    ElMessage.success(labels.value.inspectSuccess)
    inspectDialogVisible.value = false
    await loadList()
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, labels.value.inspectFail))
  } finally {
    submitting.value = false
  }
}

const handleClose = async (row: PurchaseOrder) => {
  try {
    await ElMessageBox.confirm(labels.value.closeConfirm, labels.value.confirmTitle, {
      confirmButtonText: labels.value.confirmText,
      cancelButtonText: labels.value.cancelText,
      type: 'warning'
    })

    await closePurchaseOrder(row.id)
    ElMessage.success(labels.value.closeSuccess)
    loadList()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Close failed:', error)
      ElMessage.error(getErrorMessage(error, labels.value.closeFail))
    }
  }
}

const handleOpenForceComplete = (row: PurchaseOrder) => {
  currentPO.value = row
  forceCompleteReason.value = ''
  forceCompleteDialogVisible.value = true
}

const handleConfirmForceComplete = async () => {
  if (!currentPO.value) return
  if (!forceCompleteReason.value.trim()) {
    ElMessage.error(labels.value.forceCompleteReason)
    return
  }

  submitting.value = true
  try {
    await forceCompletePurchaseOrder(currentPO.value.id, {
      reason: forceCompleteReason.value.trim()
    })
    ElMessage.success(labels.value.forceCompleteSuccess)
    forceCompleteDialogVisible.value = false
    await loadList()
  } catch (error: unknown) {
    console.error('Force complete failed:', error)
    ElMessage.error(getErrorMessage(error, labels.value.closeFail))
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
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
      ElMessage.error(getErrorMessage(error, labels.value.deleteFail))
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

const getTotalOrderedQty = (row: PurchaseOrder) => {
  if (!row.items?.length) return 0
  return row.items.reduce((sum, item) => sum + item.qty_ordered, 0)
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

onMounted(() => {
  loadList()
})
</script>

<style scoped src="../styles/purchase-order-list.css"></style>
