<template>
  <div class="purchase-order-form">
    <el-form ref="formRef" :model="form" label-width="120px">
      <div class="purchase-form-layout">
        <div class="purchase-form-main">
          <PurchaseOrderBasicSection
            :labels="labels"
            :form="form"
            :marketplace-options="marketplaceOptions"
            :currency-options="currencyOptions"
          />

          <PurchaseOrderItemsSection
            :labels="labels"
            :mode="props.mode"
            :form="form"
            :display-items="displayItems"
            :total-qty="totalQty"
            :get-selected-quote="getSelectedQuote"
            :get-quote-state="getQuoteState"
            :is-switch-disabled="isSwitchDisabled"
            :format-quote-price="formatQuotePrice"
            :format-amount="formatAmount"
            @open-product-picker="openProductPicker"
            @open-quote-dialog="openQuoteDialog"
            @remove-row="removeRow"
          />

          <div class="form-footer">
            <div class="total-section">
              <span>{{ labels.total }}</span>
              <span class="amount-text">{{ form.currency }} {{ totalAmount }}</span>
            </div>
            <div class="action-buttons">
              <el-button @click="emit('cancel')">{{ labels.cancel }}</el-button>
              <el-button type="primary" :loading="submitting" @click="handleSubmit">
                {{ submitLabel }}
              </el-button>
            </div>
          </div>
        </div>

        <PurchaseOrderSummaryPanel
          :form="form"
          :item-count="form.items.length"
          :total-qty="totalQty"
          :total-amount="totalAmount"
          :supplier-count="supplierCount"
          :missing-supplier-count="missingSupplierCount"
          :combo-child-count="comboChildCount"
        />
      </div>
    </el-form>

    <ProductPickerDialog v-model="productDialogVisible" :product-params="selectableProductParams" @confirm="handleProductPicked" />

    <el-dialog v-model="quoteDialogVisible" :title="labels.switchSupplier" width="560px">
      <div v-if="quoteDialogRow" class="quote-dialog">
        <div class="quote-dialog-header">
          {{ quoteDialogRow.product?.seller_sku || quoteDialogRow.product_id }}
        </div>
        <div v-if="quoteDialogState.loading" class="quote-empty">
          {{ labels.quoteLoading }}
        </div>
        <div v-else>
          <div v-if="quoteDialogState.quotes.length" class="quote-list">
            <div
              v-for="quote in quoteDialogState.quotes"
              :key="quote.id"
              class="quote-card"
              :class="{ 'is-selected': quote.supplier_id === quoteDialogRow.supplier_id }"
              @click="selectQuote(quoteDialogRow, quote)"
            >
              <div class="quote-card-header">
                {{ quote.supplier_name || quote.supplier_code || quote.supplier_id }}
              </div>
              <div class="quote-card-body">
                <span>{{ labels.quotePrice }} {{ formatQuotePrice(quote.price, quote.currency) }}</span>
                <span>{{ labels.quoteMoq }} {{ quote.qty_moq }}</span>
                <span>{{ labels.quoteLeadTime }} {{ quote.lead_time_days }} {{ labels.days }}</span>
              </div>
            </div>
          </div>
          <div v-else class="quote-empty">
            {{ labels.quoteEmpty }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createPurchaseOrderBatch, updatePurchaseOrder, getPurchaseOrderDetail } from '../api'
import { getProductQuoteList } from '@/modules/supplier/api'
import { getProductComboDetail } from '@/modules/product/api'
import type { ProductQuoteRow, ProductSupplierQuote } from '@/modules/supplier/types'
import type { ProductSummary } from '@/modules/product/types'
import type { PurchaseOrder, CreatePurchaseOrderParams } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import ProductPickerDialog from '@/modules/procurement/components/ProductPickerDialog.vue'
import PurchaseOrderBasicSection from '@/modules/procurement/components/PurchaseOrderBasicSection.vue'
import PurchaseOrderItemsSection from '@/modules/procurement/components/PurchaseOrderItemsSection.vue'
import PurchaseOrderSummaryPanel from '@/modules/procurement/components/PurchaseOrderSummaryPanel.vue'
import {
  expandComboProducts,
  mergeDraftItems,
  sortItemsByCombo
} from '@/modules/procurement/utils/productSelection'
import type { DraftItem } from '@/modules/procurement/utils/productSelection'
import { selectQuoteSupplier, applyQuoteToDraftItem } from '@/modules/procurement/utils/quoteSelection'

type FormItem = DraftItem

const props = defineProps<{
  mode: 'create' | 'edit'
  orderId?: number
}>()

const emit = defineEmits<{
  (e: 'saved', order: PurchaseOrder | PurchaseOrder[]): void
  (e: 'cancel'): void
}>()

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      marketplace: 'Marketplace',
      marketplacePlaceholder: 'Select marketplace',
      currency: 'Currency',
      currencyPlaceholder: 'Select currency',
      remark: 'Remark',
      itemsTitle: 'Items',
      selectProduct: 'Select product',
      product: 'Product',
      itemSupplier: 'Supplier',
      itemSupplierPlaceholder: 'Select supplier',
      switchSupplier: 'Switch Supplier',
      quoteEmpty: 'No quotes',
      quoteLoading: 'Loading quotes...',
      quotePrice: 'Price',
      quoteMoq: 'MOQ',
      quoteLeadTime: 'Lead Time',
      days: 'days',
      comboFrom: 'Combo: ',
      comboMain: 'Combo Main: ',
      comboChild: 'Combo Item: ',
      qty: 'Qty',
      unitCost: 'Unit Cost',
      subtotal: 'Subtotal',
      actions: 'Actions',
      remove: 'Remove',
      total: 'Total',
      cancel: 'Cancel',
      save: 'Save',
      create: 'Create',
      itemsRequired: 'Please add at least one item',
      itemInvalid: 'Please complete product and quantity',
      itemUnitCostInvalid: 'Please provide a quote greater than 0 for each item',
      itemSupplierMissing: 'Please select supplier for each item',
      comboMissing: 'Combo items are missing.',
      comboNotFound: 'Combo not found.'
    }
  }
  return {
    marketplace: '站点',
    marketplacePlaceholder: '选择站点',
    currency: '币种',
    currencyPlaceholder: '选择币种',
    remark: '备注',
    itemsTitle: '采购明细',
    selectProduct: '选择产品',
    product: '产品',
    itemSupplier: '供应商',
    itemSupplierPlaceholder: '选择供应商',
    switchSupplier: '切换供应商',
    quoteEmpty: '暂无报价',
    quoteLoading: '加载报价中',
    quotePrice: '报价',
    quoteMoq: 'MOQ',
    quoteLeadTime: '交期',
    days: '天',
    comboFrom: '组合来源：',
    comboMain: '组合主：',
    comboChild: '组合子：',
    qty: '数量',
    unitCost: '单价',
    subtotal: '小计',
    actions: '操作',
    remove: '移除',
    total: '合计',
    cancel: '取消',
    save: '保存',
    create: '创建',
    itemsRequired: '请至少添加一条明细',
    itemInvalid: '请完善产品与数量',
    itemUnitCostInvalid: '请为每条明细提供大于 0 的报价',
    itemSupplierMissing: '请为每条明细选择供应商',
    comboMissing: '组合缺少子项，不能直接采购',
    comboNotFound: '组合信息不存在'
  }
})

const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']
const currencyOptions = ['USD', 'CNY', 'EUR', 'GBP', 'JPY']
const selectableProductParams = {
  statuses: ['ON_SALE', 'REPLENISHING'] as const
}

const productDialogVisible = ref(false)
const quoteDialogVisible = ref(false)
const quoteDialogRow = ref<FormItem | null>(null)

const formRef = ref()
const form = reactive({
  supplier_id: null as number | null,
  marketplace: '',
  currency: 'USD',
  remark: '',
  items: [] as FormItem[]
})

const submitting = ref(false)

const submitLabel = computed(() => (props.mode === 'edit' ? labels.value.save : labels.value.create))

const totalAmount = computed(() => {
  const total = form.items.reduce((sum, item) => sum + item.qty_ordered * item.unit_cost, 0)
  return formatAmount(total)
})

const totalQty = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.qty_ordered || 0), 0)
})

const supplierCount = computed(() => {
  return new Set(form.items.map(item => item.supplier_id).filter(Boolean)).size
})

const missingSupplierCount = computed(() => {
  return form.items.filter(item => !item.supplier_id).length
})

const comboChildCount = computed(() => {
  return form.items.filter(item => item.combo_role === 'child').length
})

const displayItems = computed(() => sortItemsByCombo(form.items))

type QuoteState = {
  quotes: ProductSupplierQuote[]
  loading: boolean
  loaded: boolean
  defaultSupplierId?: number
}

const quoteStates = reactive<Record<string, QuoteState>>({})
const quoteCache = new Map<number, ProductQuoteRow | null>()

const uniqueQuoteRows = (items: FormItem[]) => {
  const seen = new Set<number>()
  return items.filter(item => {
    if (!item.product_id || seen.has(item.product_id)) {
      return false
    }
    seen.add(item.product_id)
    return true
  })
}

const getQuoteKey = (row: FormItem) => {
  if (!row.product_id) return ''
  if (row.combo?.combo_id) {
    return `combo:${row.combo.combo_id}:product:${row.product_id}:role:${row.combo_role || 'item'}`
  }
  return `product:${row.product_id}`
}

const getQuoteState = (row: FormItem): QuoteState => {
  const key = getQuoteKey(row)
  if (!key) {
    return {
      quotes: [],
      loading: false,
      loaded: false
    }
  }
  if (!quoteStates[key]) {
    quoteStates[key] = {
      quotes: [],
      loading: false,
      loaded: false
    }
  }
  return quoteStates[key]
}

const getSelectedQuote = (row: FormItem) => {
  const state = getQuoteState(row)
  return state.quotes.find(item => item.supplier_id === row.supplier_id) || null
}

const isSwitchDisabled = (row: FormItem) => {
  const state = getQuoteState(row)
  return state.loaded && state.quotes.length === 0
}

const quoteDialogState = computed(() => {
  if (!quoteDialogRow.value) {
    return {
      quotes: [] as ProductSupplierQuote[],
      loading: false
    }
  }
  const state = getQuoteState(quoteDialogRow.value)
  return {
    quotes: state.quotes,
    loading: state.loading
  }
})

const openProductPicker = () => {
  productDialogVisible.value = true
}

const removeRow = (row: FormItem) => {
  const index = form.items.indexOf(row)
  if (index >= 0) {
    form.items.splice(index, 1)
  }
}

const handleProductPicked = async (products: ProductSummary[]) => {
  const { items, errors } = await expandComboProducts(products, async (comboId: number) => {
    const res = await getProductComboDetail(comboId)
    return res.data || null
  })

  if (errors.includes('combo_not_found')) {
    ElMessage.error(labels.value.comboNotFound)
  }
  if (errors.includes('combo_missing')) {
    ElMessage.error(labels.value.comboMissing)
  }

  if (items.length > 0) {
    form.items = mergeDraftItems(form.items, items)
    applyDefaultSupplier()
    void loadQuotesForItems(form.items)
  }
}

const applyDefaultSupplier = () => {
  if (!form.supplier_id) return
  for (const item of form.items) {
    if (!item.supplier_id) {
      item.supplier_id = form.supplier_id
    }
  }
}

const applyCachedQuoteState = (row: FormItem) => {
  if (!row.product_id) return
  const state = getQuoteState(row)
  const quoteRow = quoteCache.get(row.product_id) || null
  state.quotes = quoteRow?.quotes || []
  state.defaultSupplierId = quoteRow?.default_supplier_id
  state.loaded = true
  applyQuoteSelection(row, state)
}

const fetchQuoteRows = async (productIDs: number[]) => {
  const ids = [...new Set(productIDs.filter(Boolean))].filter(id => !quoteCache.has(id))
  if (ids.length === 0) return

  const res = await getProductQuoteList({
    page: 1,
    page_size: Math.max(ids.length, 20),
    product_ids: ids
  })

  const rows = Array.isArray(res.data?.data) ? res.data.data : []
  const rowMap = new Map(rows.map(item => [item.product_id, item]))
  ids.forEach(id => {
    quoteCache.set(id, rowMap.get(id) || null)
  })
}

const loadQuotesForItems = async (items: FormItem[]) => {
  const rows = uniqueQuoteRows(items)
  const targets = rows.filter(row => {
    const state = getQuoteState(row)
    return !state.loaded && !state.loading
  })
  if (targets.length === 0) return

  targets.forEach(row => {
    getQuoteState(row).loading = true
  })

  try {
    await fetchQuoteRows(targets.map(row => row.product_id as number))
    targets.forEach(applyCachedQuoteState)
  } finally {
    targets.forEach(row => {
      getQuoteState(row).loading = false
    })
  }
}

const loadQuotesForRow = async (row: FormItem) => {
  if (!row.product_id) return
  const state = getQuoteState(row)
  if (state.loading) return
  if (!quoteCache.has(row.product_id)) {
    state.loading = true
    try {
      await fetchQuoteRows([row.product_id])
      applyCachedQuoteState(row)
    } finally {
      state.loading = false
    }
    return
  }
  if (!state.loaded) {
    applyCachedQuoteState(row)
  }
}

const applyQuoteSelection = (row: FormItem, state: QuoteState) => {
  const selection = selectQuoteSupplier(state.quotes, state.defaultSupplierId, row.supplier_id)
  if (selection.quote) {
    applyQuoteToDraftItem(row, selection.quote)
  }
}

const openQuoteDialog = async (row: FormItem) => {
  await loadQuotesForRow(row)
  quoteDialogRow.value = row
  quoteDialogVisible.value = true
}

const selectQuote = (row: FormItem, quote: ProductSupplierQuote) => {
  applyQuoteToDraftItem(row, quote)
  quoteDialogVisible.value = false
}

const validateForm = () => {
  if (form.items.length === 0) {
    ElMessage.error(labels.value.itemsRequired)
    return false
  }
  for (const item of form.items) {
    if (!item.product_id || item.qty_ordered <= 0) {
      ElMessage.error(labels.value.itemInvalid)
      return false
    }
  }
  if (form.items.some(item => item.combo_role !== 'main' && item.unit_cost <= 0)) {
    ElMessage.error(labels.value.itemUnitCostInvalid)
    return false
  }
  if (form.items.some(item => item.combo_role !== 'main' && !item.supplier_id)) {
    ElMessage.error(labels.value.itemSupplierMissing)
    return false
  }
  return true
}

const buildPayload = (): CreatePurchaseOrderParams => ({
  supplier_id: form.supplier_id || undefined,
  marketplace: form.marketplace || undefined,
  currency: form.currency || undefined,
  remark: form.remark || undefined,
  items: form.items
    .filter(item => item.product_id)
    .map(item => ({
      product_id: item.product_id as number,
      qty_ordered: item.qty_ordered,
      unit_cost: item.unit_cost || 0
    }))
})

const handleSubmit = async () => {
  // 防止重复提交
  if (submitting.value) return
  if (!validateForm()) return

  submitting.value = true
  try {
    if (props.mode === 'edit' && props.orderId) {
      const payload = buildPayload()
      const res = await updatePurchaseOrder(props.orderId, payload)
      if (res.success && res.data) {
        ElMessage.success('保存成功')
        emit('saved', res.data)
      } else {
        ElMessage.error(res.message || '保存失败')
      }
    } else {
      const payload = buildPayload()
      if (payload.items.length === 0) {
        ElMessage.error(labels.value.itemsRequired)
        return
      }
      const res = await createPurchaseOrderBatch({ orders: [payload] })
      const orders = Array.isArray(res.data) ? res.data : []
      if (res.success && orders.length > 0) {
        ElMessage.success(`成功创建 ${orders.length} 个采购单`)
        emit('saved', orders.length === 1 ? orders[0] : orders)
      } else {
        ElMessage.error(res.message || '创建失败：未返回订单数据')
      }
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '请求失败')
  } finally {
    submitting.value = false
  }
}

const loadOrder = async () => {
  if (props.mode !== 'edit' || !props.orderId) return
  const res = await getPurchaseOrderDetail(props.orderId)
  const order = res.data as PurchaseOrder | undefined
  if (!order) return
  form.supplier_id = order.supplier_id || null
  form.marketplace = order.marketplace || ''
  form.currency = order.currency || 'USD'
  form.remark = order.remark || ''
  form.items = (order.items || []).map(item => ({
    product_id: item.product_id,
    qty_ordered: item.qty_ordered,
    unit_cost: Number(item.unit_cost || 0),
    product: item.product || null,
    combo: null,
    supplier_id: order.supplier_id || null
  }))
  await loadQuotesForItems(form.items)
}

const formatAmount = (value: number) => {
  return Number.isFinite(value) ? value.toFixed(4) : '0.0000'
}

const formatQuotePrice = (price?: number | string, currency?: string) => {
  const value = Number(price ?? 0)
  const formatted = Number.isFinite(value) ? value.toFixed(4) : '-'
  return currency ? `${currency} ${formatted}` : formatted
}

onMounted(() => {
  if (props.mode === 'edit') {
    loadOrder()
  }
})

watch(
  () => form.supplier_id,
  value => {
    if (value) {
      applyDefaultSupplier()
    }
  }
)
</script>

<style scoped>
.purchase-order-form {
  padding: 12px 8px 4px;
}

.purchase-form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
  align-items: start;
}

.purchase-form-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.quote-list {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quote-dialog-header {
  font-weight: 600;
  margin-bottom: 8px;
}

.quote-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.quote-card:hover {
  border-color: #c6e2ff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.12);
}

.quote-card.is-selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.quote-card-header {
  font-weight: 600;
}

.quote-card-body {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #606266;
  font-size: 12px;
}

.quote-empty {
  color: #909399;
  font-size: 12px;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.total-section {
  font-size: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.amount-text {
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

@media (max-width: 1200px) {
  .purchase-form-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .form-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
