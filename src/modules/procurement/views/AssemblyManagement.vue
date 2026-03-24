<template>
  <div class="assembly-management">
    <div class="page-header">
      <div>
        <h2>{{ labels.pageTitle }}</h2>
        <p>{{ labels.pageSubtitle }}</p>
      </div>
    </div>

    <el-card class="workspace-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="title">{{ labels.packingOperation }}</div>
            <div class="subtitle">{{ labels.packingOperationHint }}</div>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <div class="operation-grid">
          <div class="operation-main">
            <div class="form-grid">
              <el-form-item :label="labels.product" prop="product_id">
                <ProductSelector
                  v-model="form.product_id"
                  :placeholder="labels.selectProduct"
                  :product-params="selectableProductParams"
                  :clearable="false"
                  style="width: 100%"
                  @change="handleProductChange"
                />
              </el-form-item>

              <el-form-item :label="labels.warehouse" prop="warehouse_id">
                <WarehouseSelector
                  v-model="form.warehouse_id"
                  :placeholder="labels.selectWarehouse"
                  :clearable="false"
                  style="width: 100%"
                  @change="handleWarehouseChange"
                />
              </el-form-item>

              <el-form-item :label="labels.packingQuantity" prop="quantity">
                <el-input-number
                  v-model="form.quantity"
                  :min="0"
                  :max="currentRawMaterialStock"
                  :placeholder="labels.packingQuantity"
                  style="width: 100%"
                  @change="handleQuantityChange"
                />
                <div class="form-tip">{{ labels.rawMaterialStock }}: {{ currentRawMaterialStock }}</div>
              </el-form-item>

              <el-form-item :label="labels.remark">
                <el-input
                  v-model="form.remark"
                  :placeholder="labels.remarkPlaceholder"
                  clearable
                />
              </el-form-item>
            </div>

            <div v-if="selectedProduct" class="combo-preview-card">
              <div class="combo-preview-card__header">
                <div>
                  <div class="combo-preview-card__sku">{{ selectedProduct.seller_sku }}</div>
                  <div class="combo-preview-card__title">{{ selectedProduct.title }}</div>
                </div>
                <el-tag type="info">{{ labels.rawMaterialStock }} {{ currentRawMaterialStock }}</el-tag>
              </div>
              <div class="combo-preview-card__meta">
                <span>{{ labels.packagingItems }} {{ packagingMaterials.length }}</span>
                <span>{{ labels.requiredQty }} {{ totalRequiredMaterials }}</span>
              </div>
            </div>
          </div>

          <div class="operation-side">
            <div class="side-panel">
              <div class="section-heading section-heading--compact">
                <div class="title">{{ labels.packingSummary }}</div>
                <div class="subtitle">{{ labels.packingSummaryHint }}</div>
              </div>

              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-item__label">{{ labels.product }}</span>
                  <span class="detail-item__value">{{ selectedProduct?.seller_sku || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-item__label">{{ labels.warehouse }}</span>
                  <span class="detail-item__value">{{ selectedWarehouseLabel }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-item__label">{{ labels.rawMaterialStock }}</span>
                  <span class="detail-item__value">{{ currentRawMaterialStock }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-item__label">{{ labels.packingQuantity }}</span>
                  <span class="detail-item__value">{{ form.quantity }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-item__label">{{ labels.packagingItems }}</span>
                  <span class="detail-item__value">{{ packagingMaterials.length }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-item__label">{{ labels.requiredQty }}</span>
                  <span class="detail-item__value">{{ totalRequiredMaterials }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-item__label">{{ labels.stockStatus }}</span>
                  <span class="detail-item__value">
                    <el-tag :type="summaryStatus.type">
                      {{ summaryStatus.label }}
                    </el-tag>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedProduct" class="section-block">
          <div class="section-heading">
            <div class="title">{{ labels.materialDetail }}</div>
            <div class="subtitle">{{ labels.materialDetailHint }}</div>
          </div>

          <el-alert
            v-if="!packagingMaterials.length"
            :title="labels.packagingNotConfigured"
            type="warning"
            :closable="false"
            show-icon
            class="section-alert"
          />

          <el-table v-else :data="packagingMaterials" border>
            <el-table-column :label="labels.materialInfo" min-width="260">
              <template #default="{ row }">
                <div class="product-cell">
                  <div class="product-cell__code">{{ row.item_code }}</div>
                  <div class="product-cell__title">{{ row.item_name }}</div>
                  <div v-if="row.specification" class="muted-line">{{ row.specification }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="labels.materialUsage" min-width="180">
              <template #default="{ row }">
                <div class="metric-stack">
                  <div>{{ labels.ratioLabel }} {{ row.quantity_per_unit }} {{ row.unit }}</div>
                  <div>{{ labels.requiredQty }} {{ row.required_qty }} {{ row.unit }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="labels.stockCheck" min-width="180">
              <template #default="{ row }">
                <div class="metric-stack">
                  <div>{{ labels.onHandQty }} {{ row.quantity_on_hand }} {{ row.unit }}</div>
                  <el-tag :type="row.stock_status === 'sufficient' ? 'success' : 'danger'">
                    {{ row.stock_status === 'sufficient' ? labels.sufficient : labels.insufficient }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="form-actions">
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            <el-icon><Tools /></el-icon>
            {{ labels.startPacking }}
          </el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card class="workspace-card records-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="title">{{ labels.packingRecords }}</div>
            <div class="subtitle">{{ labels.packingRecordsHint }}</div>
          </div>
          <el-button type="primary" :icon="Refresh" @click="loadRecords" circle />
        </div>
      </template>

      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item :label="labels.product">
          <ProductSelector
            v-model="queryParams.product_id"
            :placeholder="labels.all"
            :product-params="selectableProductParams"
            clearable
            style="width: 320px"
          />
        </el-form-item>

        <el-form-item :label="labels.dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="labels.to"
            :start-placeholder="labels.startDate"
            :end-placeholder="labels.endDate"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ labels.search }}</el-button>
          <el-button @click="handleQueryReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="recordList" border stripe>
        <el-table-column :label="labels.operatedAt" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.operated_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="labels.product" min-width="260">
          <template #default="{ row }">
            <div v-if="row.product" class="product-cell">
              <div class="product-cell__code">{{ row.product.seller_sku }}</div>
              <div class="product-cell__title">{{ row.product.title }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.warehouse" min-width="180">
          <template #default="{ row }">
            <div v-if="row.warehouse" class="metric-stack">
              <div>{{ row.warehouse.name }}</div>
              <div class="muted-line">{{ row.warehouse.code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.quantity" width="120" align="right">
          <template #default="{ row }">
            <span class="quantity-positive">+{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="labels.remark" min-width="180" show-overflow-tooltip />
        <el-table-column :label="labels.operator" width="140">
          <template #default="{ row }">
            {{ row.operator?.username || '-' }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadRecords"
          @current-change="loadRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Tools, Refresh } from '@element-plus/icons-vue'
import type { ProductSummary, ProductListParams } from '@/modules/product/types'
import type { ProductPackagingItem } from '@/modules/product/types'
import { getProductPackagingItems } from '@/modules/product/api/packaging'
import ProductSelector from '@/modules/product/components/ProductSelector.vue'
import {
  getBalanceList,
  getWarehouseDetail,
  getMovementList,
  recordAssemblyComplete
} from '@/modules/inventory/api'
import type { InventoryMovement, Warehouse } from '@/modules/inventory/types'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { formatDateTime } from '@/utils/dateFormat'

const localeStore = useLocaleStore()

type StockStatus = 'sufficient' | 'insufficient'

interface PackingMaterialDetail {
  packaging_item_id: number
  item_code: string
  item_name: string
  specification?: string
  unit: string
  quantity_per_unit: number
  required_qty: number
  quantity_on_hand: number
  stock_status: StockStatus
}

const labels = computed(() => {
  const lang = localeStore.currentLang
  return lang === 'en'
    ? {
        packingOperation: 'Packing Operation',
        packingOperationHint: 'Select product, warehouse, and quantity before starting packing.',
        packingSummary: 'Packing Summary',
        packingSummaryHint: 'Review raw material stock, packaging usage, and readiness before confirming.',
        packingRecords: 'Packing Records',
        packingRecordsHint: 'Review recent packing completion records and operators.',
        pageTitle: 'Packing Management',
        pageSubtitle: 'Pack products using configured packaging materials and move stock into pending shipment.',
        product: 'Product',
        selectProduct: 'Select product',
        warehouse: 'Warehouse',
        selectWarehouse: 'Select warehouse',
        packingQuantity: 'Packing Quantity',
        remark: 'Remark',
        remarkPlaceholder: 'Optional remark',
        materialDetail: 'Packaging Materials',
        materialDetailHint: 'Configured packaging materials will be consumed during packing.',
        materialInfo: 'Material Info',
        materialUsage: 'Usage',
        stockCheck: 'Stock Check',
        ratioLabel: 'Per Unit',
        requiredQty: 'Required Qty',
        rawMaterialStock: 'Raw Material Stock',
        onHandQty: 'On Hand',
        stockStatus: 'Status',
        sufficient: 'Sufficient',
        insufficient: 'Insufficient',
        readyToPack: 'Ready',
        pendingCheck: 'Pending Check',
        packagingNotConfigured: 'No packaging materials configured for this product.',
        startPacking: 'Start Packing',
        reset: 'Reset',
        packagingItems: 'materials',
        all: 'All',
        dateRange: 'Date Range',
        to: 'to',
        startDate: 'Start Date',
        endDate: 'End Date',
        search: 'Search',
        operatedAt: 'Operated At',
        quantity: 'Quantity',
        operator: 'Operator',
        packingSuccess: 'Packing completed successfully',
        confirmPacking: 'Confirm Packing',
        confirmPackingMessage: 'Pack {quantity} units of {sku}? This will consume packaging materials and move stock into pending shipment.',
        cancel: 'Cancel',
        rawMaterialInsufficient: 'Raw material stock is insufficient',
        packagingMaterialInsufficient: 'Packaging material stock is insufficient',
        quantityRequired: 'Please enter packing quantity',
        quantityExceeds: 'Packing quantity cannot exceed raw material stock',
        missingWarehouse: 'Select warehouse first',
        productLoadFail: 'Failed to load packing context',
        recordsLoadFail: 'Failed to load packing records'
      }
    : {
        packingOperation: '打包操作',
        packingOperationHint: '先选择产品、仓库和数量，再发起打包。',
        packingSummary: '打包核对',
        packingSummaryHint: '在提交前集中核对原料库存、耗材消耗和可执行状态。',
        packingRecords: '打包记录',
        packingRecordsHint: '查看最近的打包完成记录和操作人。',
        pageTitle: '打包管理',
        pageSubtitle: '按产品包材配置完成打包，并把原料库存转入待出库存。',
        product: '产品',
        selectProduct: '选择产品',
        warehouse: '仓库',
        selectWarehouse: '选择仓库',
        packingQuantity: '打包数量',
        remark: '备注',
        remarkPlaceholder: '可选备注信息',
        materialDetail: '耗材明细',
        materialDetailHint: '本次打包将按产品包材配置自动扣减耗材。',
        materialInfo: '耗材信息',
        materialUsage: '耗材用量',
        stockCheck: '库存检查',
        ratioLabel: '单件用量',
        requiredQty: '需要数量',
        rawMaterialStock: '原料库存',
        onHandQty: '现有库存',
        stockStatus: '库存状态',
        sufficient: '充足',
        insufficient: '不足',
        readyToPack: '可打包',
        pendingCheck: '待核对',
        packagingNotConfigured: '当前产品未配置包材清单，不能打包。',
        startPacking: '开始打包',
        reset: '重置',
        packagingItems: '种耗材',
        all: '全部',
        dateRange: '日期范围',
        to: '至',
        startDate: '开始日期',
        endDate: '结束日期',
        search: '查询',
        operatedAt: '操作时间',
        quantity: '数量',
        operator: '操作人',
        packingSuccess: '打包完成',
        confirmPacking: '确认打包',
        confirmPackingMessage: '确定要打包 {quantity} 个 {sku} 吗？这将消耗包材并把原料库存转入待出库存。',
        cancel: '取消',
        rawMaterialInsufficient: '原料库存不足',
        packagingMaterialInsufficient: '耗材库存不足',
        quantityRequired: '请输入打包数量',
        quantityExceeds: '打包数量不能超过原料库存',
        missingWarehouse: '请先选择仓库',
        productLoadFail: '加载打包数据失败',
        recordsLoadFail: '加载打包记录失败'
      }
})

const formRef = ref<FormInstance>()
const activeProductStatuses = ['ON_SALE', 'REPLENISHING'] as const
const selectableProductParams = computed<Partial<ProductListParams>>(() => ({
  statuses: [...activeProductStatuses],
  packing_required: 1,
  only_with_packaging: true
}))

const form = reactive({
  product_id: undefined as number | undefined,
  warehouse_id: undefined as number | undefined,
  quantity: 0,
  remark: ''
})

const selectedProduct = ref<ProductSummary>()
const selectedWarehouse = ref<Warehouse | null>(null)
const currentRawMaterialStock = ref(0)
const packagingConfig = ref<ProductPackagingItem[]>([])
const packagingMaterials = ref<PackingMaterialDetail[]>([])
const submitting = ref(false)

const loading = ref(false)
const recordList = ref<InventoryMovement[]>([])
const total = ref(0)
const dateRange = ref<[string, string]>()

const queryParams = reactive({
  page: 1,
  page_size: 10,
  movement_type: 'ASSEMBLY_COMPLETE',
  product_id: undefined as number | undefined,
  date_from: undefined as string | undefined,
  date_to: undefined as string | undefined
})

const rules = computed<FormRules>(() => ({
  product_id: [{ required: true, message: labels.value.selectProduct, trigger: 'change' }],
  warehouse_id: [{ required: true, message: labels.value.selectWarehouse, trigger: 'change' }],
  quantity: [{ validator: validatePackingQuantity, trigger: ['change', 'blur'] }]
}))

const totalRequiredMaterials = computed(() =>
  packagingMaterials.value.reduce((sum, item) => sum + item.required_qty, 0)
)

const hasSufficientMaterials = computed(() =>
  packagingMaterials.value.every((item) => item.stock_status === 'sufficient')
)

const canSubmit = computed(() => {
  if (!form.product_id || !form.warehouse_id) {
    return false
  }
  if (form.quantity <= 0 || form.quantity > currentRawMaterialStock.value) {
    return false
  }
  if (!packagingMaterials.value.length) {
    return false
  }
  return hasSufficientMaterials.value
})

const summaryStatus = computed(() => {
  if (!form.product_id || !form.warehouse_id) {
    return { type: 'info' as const, label: labels.value.pendingCheck }
  }
  if (!packagingMaterials.value.length) {
    return { type: 'warning' as const, label: labels.value.packagingNotConfigured }
  }
  if (currentRawMaterialStock.value <= 0 || form.quantity <= 0) {
    return { type: 'warning' as const, label: labels.value.pendingCheck }
  }
  if (form.quantity > currentRawMaterialStock.value) {
    return { type: 'danger' as const, label: labels.value.rawMaterialInsufficient }
  }
  if (!hasSufficientMaterials.value) {
    return { type: 'danger' as const, label: labels.value.packagingMaterialInsufficient }
  }
  return { type: 'success' as const, label: labels.value.readyToPack }
})

const selectedWarehouseLabel = computed(() => {
  if (selectedWarehouse.value?.name && selectedWarehouse.value?.code) {
    return `${selectedWarehouse.value.name} (${selectedWarehouse.value.code})`
  }
  if (form.warehouse_id) {
    return String(form.warehouse_id)
  }
  return '-'
})

function validatePackingQuantity(_: unknown, value: number, callback: (error?: Error) => void) {
  if (!value || value <= 0) {
    callback(new Error(labels.value.quantityRequired))
    return
  }
  if (value > currentRawMaterialStock.value) {
    callback(new Error(labels.value.quantityExceeds))
    return
  }
  callback()
}

function buildPackingMaterials() {
  packagingMaterials.value = packagingConfig.value.map((item) => {
    const packagingItem = item.packaging_item
    const quantityPerUnit = Number(item.quantity_per_unit || 0)
    const quantityOnHand = Number(packagingItem?.quantity_on_hand || 0)
    const requiredQty = form.quantity > 0 ? quantityPerUnit * form.quantity : 0
    return {
      packaging_item_id: item.packaging_item_id,
      item_code: packagingItem?.item_code || String(item.packaging_item_id),
      item_name: packagingItem?.item_name || '-',
      specification: packagingItem?.specification,
      unit: packagingItem?.unit || 'PCS',
      quantity_per_unit: quantityPerUnit,
      required_qty: requiredQty,
      quantity_on_hand: quantityOnHand,
      stock_status: quantityOnHand >= requiredQty ? 'sufficient' : 'insufficient'
    }
  })
}

async function loadPackingContext(resetQuantity: boolean) {
  if (!form.product_id) {
    packagingConfig.value = []
    packagingMaterials.value = []
    currentRawMaterialStock.value = 0
    if (resetQuantity) {
      form.quantity = 0
    }
    return
  }

  try {
    const requests: [ReturnType<typeof getProductPackagingItems>, Promise<any>] = [
      getProductPackagingItems(form.product_id),
      form.warehouse_id
        ? getBalanceList({
            product_id: form.product_id,
            warehouse_id: form.warehouse_id,
            page: 1,
            page_size: 1
          })
        : Promise.resolve({ success: true, data: { data: [] } })
    ]

    const [packagingRes, balanceRes] = await Promise.all(requests)

    packagingConfig.value = packagingRes.success && Array.isArray(packagingRes.data) ? packagingRes.data : []
    currentRawMaterialStock.value = balanceRes.success
      ? Number(balanceRes.data?.data?.[0]?.raw_material || 0)
      : 0

    if (resetQuantity || form.quantity > currentRawMaterialStock.value) {
      form.quantity = currentRawMaterialStock.value
    }

    buildPackingMaterials()
  } catch (error) {
    console.error('Failed to load packing context:', error)
    packagingConfig.value = []
    packagingMaterials.value = []
    currentRawMaterialStock.value = 0
    if (resetQuantity) {
      form.quantity = 0
    }
    ElMessage.error(labels.value.productLoadFail)
  }
}

function handleProductChange(product: ProductSummary | null) {
  selectedProduct.value = product || undefined
  void loadPackingContext(true)
}

function handleWarehouseChange(warehouse: Warehouse | null) {
  selectedWarehouse.value = warehouse
  void loadPackingContext(true)
}

function handleQuantityChange() {
  buildPackingMaterials()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      await ElMessageBox.confirm(
        labels.value.confirmPackingMessage
          .replace('{quantity}', String(form.quantity))
          .replace('{sku}', selectedProduct.value?.seller_sku || ''),
        labels.value.confirmPacking,
        {
          confirmButtonText: labels.value.startPacking,
          cancelButtonText: labels.value.cancel,
          type: 'warning'
        }
      )

      submitting.value = true
      await recordAssemblyComplete({
        product_id: selectedProduct.value!.id,
        warehouse_id: form.warehouse_id!,
        quantity: form.quantity,
        remark: form.remark || undefined
      })

      ElMessage.success(labels.value.packingSuccess)
      handleReset()
      void loadRecords()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('Packing failed:', error)
        ElMessage.error(error.message || labels.value.pendingCheck)
      }
    } finally {
      submitting.value = false
    }
  })
}

function handleReset() {
  formRef.value?.resetFields()
  selectedProduct.value = undefined
  selectedWarehouse.value = null
  currentRawMaterialStock.value = 0
  packagingConfig.value = []
  packagingMaterials.value = []
  form.quantity = 0
}

async function loadRecords() {
  loading.value = true
  try {
    const res = await getMovementList(queryParams)
    if (res.success && res.data) {
      recordList.value = res.data.data
      total.value = res.data.total
    }
  } catch (error) {
    console.error('Failed to load packing records:', error)
    ElMessage.error(labels.value.recordsLoadFail)
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  if (dateRange.value) {
    queryParams.date_from = dateRange.value[0]
    queryParams.date_to = dateRange.value[1]
  } else {
    queryParams.date_from = undefined
    queryParams.date_to = undefined
  }
  queryParams.page = 1
  void loadRecords()
}

function handleQueryReset() {
  queryParams.product_id = undefined
  dateRange.value = undefined
  queryParams.date_from = undefined
  queryParams.date_to = undefined
  queryParams.page = 1
  void loadRecords()
}

watch(
  () => form.warehouse_id,
  async (warehouseID) => {
    if (!warehouseID) {
      selectedWarehouse.value = null
      return
    }
    if (selectedWarehouse.value?.id === warehouseID) {
      return
    }
    const res = await getWarehouseDetail(warehouseID)
    if (res.success) {
      selectedWarehouse.value = res.data
    }
  }
)

onMounted(() => {
  void loadRecords()
})
</script>

<style scoped>
.assembly-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.page-header p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.workspace-card {
  border-radius: 14px;
  margin-bottom: 20px;
}

.operation-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
}

.filter-form {
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 20px;
}

.operation-main,
.operation-side {
  min-width: 0;
}

.side-panel {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
}

.combo-preview-card {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
}

.combo-preview-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.combo-preview-card__sku {
  color: #111827;
  font-weight: 700;
}

.combo-preview-card__title {
  margin-top: 6px;
  color: #4b5563;
}

.combo-preview-card__meta {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  color: #6b7280;
  font-size: 13px;
}

.section-block {
  margin-bottom: 20px;
}

.section-alert {
  margin-bottom: 16px;
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.section-heading--compact {
  margin-bottom: 8px;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-cell__code {
  color: #111827;
  font-weight: 600;
}

.product-cell__title,
.muted-line {
  color: #6b7280;
  font-size: 12px;
}

.metric-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.form-tip {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-item:last-child {
  border-bottom: 0;
}

.detail-item__label {
  color: #6b7280;
  font-size: 13px;
}

.detail-item__value {
  color: #111827;
  font-weight: 600;
  text-align: right;
}

.quantity-positive {
  color: #2563eb;
  font-weight: 700;
}

.records-card {
  border-radius: 14px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1280px) {
  .operation-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .assembly-management {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
