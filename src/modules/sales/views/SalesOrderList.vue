<template>
  <div class="sales-order-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>销售订单</span>
          <el-button type="primary" plain @click="openImportDialog">导入订单</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable style="width: 160px">
            <el-option label="DRAFT" value="DRAFT" />
            <el-option label="CONFIRMED" value="CONFIRMED" />
            <el-option label="ALLOCATED" value="ALLOCATED" />
            <el-option label="SHIPPED" value="SHIPPED" />
            <el-option label="DELIVERED" value="DELIVERED" />
            <el-option label="CANCELLED" value="CANCELLED" />
            <el-option label="RETURNED" value="RETURNED" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="order_status" label="状态" width="120" />
        <el-table-column prop="marketplace" label="站点" width="90" />
        <el-table-column prop="currency" label="币种" width="80" />
        <el-table-column prop="order_amount" label="金额" width="120" />
        <el-table-column label="产品" min-width="300">
          <template #default="{ row }">
            <div v-if="row.items?.length" class="order-product-stack">
              <div v-for="item in row.items.slice(0, 2)" :key="item.id" class="order-product-row">
                <img
                  v-if="item.product_image_url"
                  :src="item.product_image_url"
                  :alt="item.seller_sku || 'sku'"
                  class="order-product-row__image"
                />
                <div v-else class="order-product-row__image order-product-row__image--placeholder">无图</div>
                <div class="order-product-row__content">
                  <div class="order-product-row__sku">{{ item.seller_sku || item.product_id }}</div>
                  <div class="order-product-row__title">{{ item.product_title || '-' }}</div>
                </div>
              </div>
              <div v-if="row.items.length > 2" class="order-product-row__more">
                另 {{ row.items.length - 2 }} 个产品
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="order_date" label="下单时间" width="180" />
        <el-table-column label="操作" width="520" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row.id)">详情</el-button>
            <el-button
              v-if="row.order_status === 'DRAFT'"
              size="small"
              type="success"
              @click="confirmOrder(row.id)"
            >
              确认
            </el-button>
            <el-button
              v-if="row.order_status === 'CONFIRMED' || row.order_status === 'ALLOCATED'"
              size="small"
              type="warning"
              @click="openAllocateDialog(row.id)"
            >
              分配
            </el-button>
            <el-button
              v-if="row.order_status === 'ALLOCATED' || row.order_status === 'SHIPPED'"
              size="small"
              type="primary"
              @click="openShipDialog(row.id)"
            >
              发货
            </el-button>
            <el-button
              v-if="row.order_status === 'SHIPPED'"
              size="small"
              type="success"
              @click="deliverOrder(row.id)"
            >
              妥投
            </el-button>
            <el-button
              v-if="row.order_status === 'DELIVERED' || row.order_status === 'RETURNED'"
              size="small"
              type="warning"
              @click="openReturnDialog(row.id)"
            >
              退货
            </el-button>
            <el-button
              v-if="row.order_status === 'DRAFT' || row.order_status === 'CONFIRMED' || row.order_status === 'ALLOCATED'"
              size="small"
              type="danger"
              @click="cancelOrder(row.id)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </el-card>

    <el-dialog v-model="importDialogVisible" title="导入订单 CSV" width="860px">
      <div class="import-header">
        <el-link href="/templates/sales-orders-import-sample.csv" target="_blank" type="primary">
          下载示例 CSV
        </el-link>
      </div>

      <el-upload
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        accept=".csv,text/csv"
        :on-change="handleImportFileChange"
        :on-remove="handleImportFileRemove"
      >
        <el-button>选择 CSV 文件</el-button>
      </el-upload>

      <el-alert
        v-if="importSummary"
        style="margin-top: 12px"
        :type="importSummary.error_rows > 0 ? 'warning' : 'success'"
        :closable="false"
        :title="`批次 ${importSummary.batch_no} 导入完成`"
        :description="`总行数 ${importSummary.total_rows}，成功 ${importSummary.success_rows}，失败 ${importSummary.error_rows}`"
      />

      <el-table v-if="importErrors.length > 0" :data="importErrors" style="margin-top: 12px" border max-height="320">
        <el-table-column prop="row_no" label="行号" width="90" />
        <el-table-column prop="error_code" label="错误码" width="140" />
        <el-table-column prop="error_message" label="错误信息" min-width="220" />
        <el-table-column prop="raw_row" label="原始行" min-width="320" />
      </el-table>

      <template #footer>
        <el-button @click="importDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="importLoading" :disabled="!importFile" @click="submitImport">
          开始导入
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="allocateDialogVisible" title="库存分配" width="920px">
      <el-alert
        v-if="operationOrder"
        :closable="false"
        type="info"
        :title="`订单号：${operationOrder.order_no}`"
        :description="`当前状态：${operationOrder.order_status}`"
        style="margin-bottom: 12px"
      />
      <el-form label-width="90px">
        <el-form-item label="仓库">
          <WarehouseSelector
            v-model="allocateWarehouseId"
            placeholder="选择仓库"
            clearable
            :only-active="true"
            style="width: 280px"
          />
        </el-form-item>
      </el-form>
      <el-table :data="allocateLines" border max-height="360">
        <el-table-column prop="line_no" label="行号" width="80" />
        <el-table-column label="产品" min-width="260">
          <template #default="{ row }">
            <div class="dialog-product-cell">
              <div class="dialog-product-cell__sku">{{ row.seller_sku || row.product_id }}</div>
              <div class="dialog-product-cell__title">{{ row.product_title || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="qty_ordered" label="下单数" width="100" />
        <el-table-column prop="qty_allocated" label="当前已分配" width="120" />
        <el-table-column label="目标分配数" width="220">
          <template #default="{ row }">
            <el-input-number v-model="row.target_allocated" :min="0" :max="row.qty_ordered" :step="1" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="allocateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="allocateSubmitting" @click="submitAllocate">提交分配</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="shipDialogVisible" title="发货" width="920px">
      <el-alert
        v-if="operationOrder"
        :closable="false"
        type="info"
        :title="`订单号：${operationOrder.order_no}`"
        :description="`当前状态：${operationOrder.order_status}`"
        style="margin-bottom: 12px"
      />
      <el-form label-width="90px">
        <el-form-item label="仓库">
          <WarehouseSelector
            v-model="shipWarehouseId"
            placeholder="选择仓库"
            clearable
            :only-active="true"
            style="width: 280px"
          />
        </el-form-item>
      </el-form>
      <el-table :data="shipLines" border max-height="360">
        <el-table-column prop="line_no" label="行号" width="80" />
        <el-table-column label="产品" min-width="260">
          <template #default="{ row }">
            <div class="dialog-product-cell">
              <div class="dialog-product-cell__sku">{{ row.seller_sku || row.product_id }}</div>
              <div class="dialog-product-cell__title">{{ row.product_title || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="qty_allocated" label="已分配" width="100" />
        <el-table-column prop="qty_shipped" label="已发货" width="100" />
        <el-table-column prop="max_shippable" label="可发货" width="100" />
        <el-table-column label="本次发货" width="220">
          <template #default="{ row }">
            <el-input-number v-model="row.qty_to_ship" :min="0" :max="row.max_shippable" :step="1" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipSubmitting" @click="submitShip">提交发货</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="returnDialogVisible" title="退货入库" width="920px">
      <el-alert
        v-if="operationOrder"
        :closable="false"
        type="info"
        :title="`订单号：${operationOrder.order_no}`"
        :description="`当前状态：${operationOrder.order_status}`"
        style="margin-bottom: 12px"
      />
      <el-form label-width="90px">
        <el-form-item label="仓库">
          <WarehouseSelector
            v-model="returnWarehouseId"
            placeholder="选择仓库"
            clearable
            :only-active="true"
            style="width: 280px"
          />
        </el-form-item>
      </el-form>
      <el-table :data="returnLines" border max-height="360">
        <el-table-column prop="line_no" label="行号" width="80" />
        <el-table-column label="产品" min-width="260">
          <template #default="{ row }">
            <div class="dialog-product-cell">
              <div class="dialog-product-cell__sku">{{ row.seller_sku || row.product_id }}</div>
              <div class="dialog-product-cell__title">{{ row.product_title || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="qty_shipped" label="已发货" width="100" />
        <el-table-column prop="qty_returned" label="已退货" width="100" />
        <el-table-column prop="max_returnable" label="可退货" width="100" />
        <el-table-column label="本次退货" width="220">
          <template #default="{ row }">
            <el-input-number v-model="row.qty_to_return" :min="0" :max="row.max_returnable" :step="1" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="returnSubmitting" @click="submitReturn">提交退货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { UploadFile } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  allocateSalesOrder,
  cancelSalesOrder,
  confirmSalesOrder,
  deliverSalesOrder,
  getSalesOrderDetail,
  getSalesOrderList,
  getSalesOrderImportErrors,
  importSalesOrders,
  returnSalesOrder,
  shipSalesOrder
} from '../api'
import type {
  SalesOrder,
  SalesOrderImportBatch,
  SalesOrderImportRowError,
  SalesOrderItem,
  SalesOrderStatus
} from '../types'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'

type AllocateDraftLine = {
  item_id: number
  line_no: number
  product_id: number
  seller_sku?: string
  product_title?: string
  qty_ordered: number
  qty_allocated: number
  target_allocated: number
}

type ShipDraftLine = {
  item_id: number
  line_no: number
  product_id: number
  seller_sku?: string
  product_title?: string
  qty_allocated: number
  qty_shipped: number
  max_shippable: number
  qty_to_ship: number
}

type ReturnDraftLine = {
  item_id: number
  line_no: number
  product_id: number
  seller_sku?: string
  product_title?: string
  qty_shipped: number
  qty_returned: number
  max_returnable: number
  qty_to_return: number
}

const router = useRouter()
const loading = ref(false)
const list = ref<SalesOrder[]>([])
const importDialogVisible = ref(false)
const importLoading = ref(false)
const importFile = ref<File | null>(null)
const importSummary = ref<SalesOrderImportBatch | null>(null)
const importErrors = ref<SalesOrderImportRowError[]>([])
const operationOrder = ref<SalesOrder | null>(null)
const allocateDialogVisible = ref(false)
const shipDialogVisible = ref(false)
const returnDialogVisible = ref(false)
const allocateWarehouseId = ref<number | undefined>(undefined)
const shipWarehouseId = ref<number | undefined>(undefined)
const returnWarehouseId = ref<number | undefined>(undefined)
const allocateSubmitting = ref(false)
const shipSubmitting = ref(false)
const returnSubmitting = ref(false)
const allocateLines = ref<AllocateDraftLine[]>([])
const shipLines = ref<ShipDraftLine[]>([])
const returnLines = ref<ReturnDraftLine[]>([])

const searchForm = reactive({
  status: '' as SalesOrderStatus | '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

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

const isHandledError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  '_handled' in error &&
  Boolean((error as Record<string, unknown>)._handled)

const getShippableQty = (item: SalesOrderItem) => Math.max(item.qty_allocated - item.qty_shipped, 0)

const getReturnableQty = (item: SalesOrderItem) => Math.max(item.qty_shipped - item.qty_returned, 0)

const loadOrderForOperation = async (orderID: number) => {
  const detailRes = await getSalesOrderDetail(orderID)
  const detail = detailRes.data
  if (!detail) {
    throw new Error('订单详情不存在')
  }
  operationOrder.value = detail
  return detail
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getSalesOrderList({
      status: searchForm.status || undefined,
      keyword: searchForm.keyword || undefined,
      page: pagination.page,
      page_size: pagination.page_size
    })
    list.value = res.data.data
    pagination.total = res.data.total
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '加载失败'))
  } finally {
    loading.value = false
  }
}

const reset = () => {
  searchForm.status = ''
  searchForm.keyword = ''
  pagination.page = 1
  fetchList()
}

const viewDetail = (id: number) => {
  router.push(`/sales/orders/${id}`)
}

const openImportDialog = () => {
  importDialogVisible.value = true
  importFile.value = null
  importSummary.value = null
  importErrors.value = []
}

const handleImportFileChange = (file: UploadFile) => {
  importFile.value = (file.raw as File) || null
}

const handleImportFileRemove = () => {
  importFile.value = null
}

const submitImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择 CSV 文件')
    return
  }

  importLoading.value = true
  try {
    const res = await importSalesOrders(importFile.value)
    const summary = res.data
    importSummary.value = summary
    importErrors.value = []

    if (summary && summary.error_rows > 0) {
      const errorRes = await getSalesOrderImportErrors(summary.id)
      importErrors.value = errorRes.data
    }

    await fetchList()
    ElMessage.success('导入完成，列表已刷新')
  } catch (error: unknown) {
    if (!isHandledError(error)) {
      ElMessage.error(getErrorMessage(error, '导入失败'))
    }
  } finally {
    importLoading.value = false
  }
}

const confirmOrder = async (id: number) => {
  try {
    await confirmSalesOrder(id)
    ElMessage.success('订单已确认')
    fetchList()
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '确认失败'))
  }
}

const cancelOrder = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认取消该订单？', '提示', { type: 'warning' })
    await cancelSalesOrder(id)
    ElMessage.success('订单已取消')
    fetchList()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error, '取消失败'))
    }
  }
}

const openAllocateDialog = async (orderID: number) => {
  try {
    const detail = await loadOrderForOperation(orderID)
    allocateWarehouseId.value = undefined
    allocateLines.value = (detail.items || []).map((item) => ({
      item_id: item.id,
      line_no: item.line_no,
      product_id: item.product_id,
      seller_sku: item.seller_sku,
      product_title: item.product_title,
      qty_ordered: item.qty_ordered,
      qty_allocated: item.qty_allocated,
      target_allocated: item.qty_allocated
    }))
    allocateDialogVisible.value = true
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '加载订单详情失败'))
  }
}

const submitAllocate = async () => {
  if (!operationOrder.value) return
  if (!allocateWarehouseId.value || allocateWarehouseId.value <= 0) {
    ElMessage.warning('请选择仓库')
    return
  }

  const changedLines = allocateLines.value
    .filter((line) => line.target_allocated !== line.qty_allocated)
    .map((line) => ({
      item_id: line.item_id,
      qty_allocated: line.target_allocated
    }))

  if (changedLines.length === 0) {
    ElMessage.warning('请至少调整一行分配数量')
    return
  }

  allocateSubmitting.value = true
  try {
    await allocateSalesOrder(operationOrder.value.id, {
      warehouse_id: allocateWarehouseId.value,
      lines: changedLines
    })
    ElMessage.success('分配成功')
    allocateDialogVisible.value = false
    await fetchList()
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '分配失败'))
  } finally {
    allocateSubmitting.value = false
  }
}

const openShipDialog = async (orderID: number) => {
  try {
    const detail = await loadOrderForOperation(orderID)
    shipWarehouseId.value = undefined
    shipLines.value = (detail.items || []).map((item) => {
      const maxShippable = getShippableQty(item)
      return {
        item_id: item.id,
        line_no: item.line_no,
        product_id: item.product_id,
        seller_sku: item.seller_sku,
        product_title: item.product_title,
        qty_allocated: item.qty_allocated,
        qty_shipped: item.qty_shipped,
        max_shippable: maxShippable,
        qty_to_ship: maxShippable
      }
    })
    shipDialogVisible.value = true
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '加载订单详情失败'))
  }
}

const submitShip = async () => {
  if (!operationOrder.value) return
  if (!shipWarehouseId.value || shipWarehouseId.value <= 0) {
    ElMessage.warning('请选择仓库')
    return
  }

  const lines = shipLines.value
    .filter((line) => line.qty_to_ship > 0)
    .map((line) => ({
      item_id: line.item_id,
      qty_shipped: line.qty_to_ship
    }))

  if (lines.length === 0) {
    ElMessage.warning('请至少填写一行发货数量')
    return
  }

  shipSubmitting.value = true
  try {
    await shipSalesOrder(operationOrder.value.id, {
      warehouse_id: shipWarehouseId.value,
      lines
    })
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    await fetchList()
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '发货失败'))
  } finally {
    shipSubmitting.value = false
  }
}

const deliverOrder = async (orderID: number) => {
  try {
    await ElMessageBox.confirm('确认将订单标记为妥投？', '提示', { type: 'warning' })
    await deliverSalesOrder(orderID)
    ElMessage.success('订单已妥投')
    await fetchList()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorMessage(error, '妥投失败'))
    }
  }
}

const openReturnDialog = async (orderID: number) => {
  try {
    const detail = await loadOrderForOperation(orderID)
    returnWarehouseId.value = undefined
    returnLines.value = (detail.items || []).map((item) => ({
      item_id: item.id,
      line_no: item.line_no,
      product_id: item.product_id,
      seller_sku: item.seller_sku,
      product_title: item.product_title,
      qty_shipped: item.qty_shipped,
      qty_returned: item.qty_returned,
      max_returnable: getReturnableQty(item),
      qty_to_return: 0
    }))
    returnDialogVisible.value = true
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '加载订单详情失败'))
  }
}

const submitReturn = async () => {
  if (!operationOrder.value) return
  if (!returnWarehouseId.value || returnWarehouseId.value <= 0) {
    ElMessage.warning('请选择仓库')
    return
  }

  const lines = returnLines.value
    .filter((line) => line.qty_to_return > 0)
    .map((line) => ({
      item_id: line.item_id,
      qty_returned: line.qty_to_return
    }))

  if (lines.length === 0) {
    ElMessage.warning('请至少填写一行退货数量')
    return
  }

  returnSubmitting.value = true
  try {
    await returnSalesOrder(operationOrder.value.id, {
      warehouse_id: returnWarehouseId.value,
      lines
    })
    ElMessage.success('退货成功')
    returnDialogVisible.value = false
    await fetchList()
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '退货失败'))
  } finally {
    returnSubmitting.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.sales-order-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.import-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.order-product-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-product-row,
.dialog-product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.order-product-row__image {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  object-fit: cover;
  background: #fff;
  flex-shrink: 0;
}

.order-product-row__image--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  background: var(--el-fill-color-light);
}

.order-product-row__content {
  min-width: 0;
}

.order-product-row__sku,
.dialog-product-cell__sku {
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 1.4;
}

.order-product-row__title,
.dialog-product-cell__title,
.order-product-row__more {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

</style>
