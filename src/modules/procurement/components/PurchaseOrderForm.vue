<template>
  <div class="purchase-order-form">
    <el-form ref="formRef" :model="form" label-width="120px">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item :label="labels.marketplace">
            <el-select v-model="form.marketplace" :placeholder="labels.marketplacePlaceholder">
              <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item :label="labels.currency">
            <el-select v-model="form.currency" :placeholder="labels.currencyPlaceholder">
              <el-option v-for="item in currencyOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item :label="labels.remark">
        <el-input v-model="form.remark" type="textarea" :rows="2" />
      </el-form-item>

      <div class="items-header">
        <span class="items-title">{{ labels.itemsTitle }}</span>
        <el-button size="small" type="primary" @click="openSkuPicker">
          {{ labels.selectSku }}
        </el-button>
      </div>

      <el-table :data="displayItems" border stripe>
        <el-table-column :label="labels.sku" min-width="300">
          <template #default="{ row }">
            <div class="sku-cell" :class="{ 'is-child': row.combo_role === 'child' }">
              <div class="sku-main">
                <img
                  v-if="row.sku?.image_url"
                  :src="row.sku.image_url"
                  :alt="row.sku?.seller_sku || 'sku'"
                  class="sku-image"
                />
                <div class="sku-info">
                  <div class="sku-code">
                    <span v-if="row.combo_role === 'child'" class="combo-prefix">|-</span>
                    {{ row.sku?.seller_sku || row.sku_id }}
                  </div>
                  <div class="sku-title">{{ row.sku?.title || '-' }}</div>
                </div>
              </div>
              <el-tag
                v-if="row.combo"
                :type="row.combo_role === 'main' ? 'warning' : 'info'"
                size="small"
              >
                {{
                  row.combo_role === 'child'
                    ? labels.comboChild
                    : labels.comboMain
                }}{{ row.combo.main_sku || row.combo.combo_id }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.itemSupplier" min-width="260">
          <template #default="{ row }">
            <div class="supplier-info">
              <div v-if="getSelectedQuote(row)" class="supplier-summary">
                <div class="supplier-name">
                  {{
                    getSelectedQuote(row)?.supplier_name ||
                    getSelectedQuote(row)?.supplier_code ||
                    row.supplier_id ||
                    '-'
                  }}
                </div>
                <div class="supplier-meta">
                  <span>
                    {{ labels.quotePrice }}
                    {{ formatQuotePrice(getSelectedQuote(row)?.price, getSelectedQuote(row)?.currency) }}
                  </span>
                  <span>
                    {{ labels.quoteMoq }}
                    {{ getSelectedQuote(row)?.qty_moq ?? '-' }}
                  </span>
                  <span>
                    {{ labels.quoteLeadTime }}
                    {{ getSelectedQuote(row)?.lead_time_days ?? '-' }} {{ labels.days }}
                  </span>
                </div>
              </div>
              <div v-else class="supplier-empty">
                {{ getQuoteState(row).loading ? labels.quoteLoading : labels.quoteEmpty }}
              </div>
              <el-button
                size="small"
                type="primary"
                link
                :loading="getQuoteState(row).loading"
                :disabled="props.mode === 'edit' || isSwitchDisabled(row)"
                @click="openQuoteDialog(row)"
              >
                {{ labels.switchSupplier }}
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.qty" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.qty_ordered" :min="1" :step="1" />
          </template>
        </el-table-column>
        <el-table-column :label="labels.unitCost" width="160">
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.unit_cost) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.subtotal" width="160" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.qty_ordered * row.unit_cost) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.actions" width="120" align="center">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="removeRow(row)">
              {{ labels.remove }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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
    </el-form>

    <SkuPickerDialog v-model="skuDialogVisible" @confirm="handleSkuPicked" />

    <el-dialog v-model="quoteDialogVisible" :title="labels.switchSupplier" width="560px">
      <div v-if="quoteDialogRow" class="quote-dialog">
        <div class="quote-dialog-header">
          {{ quoteDialogRow.sku?.seller_sku || quoteDialogRow.sku_id }}
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
import { createPurchaseOrder, updatePurchaseOrder, getPurchaseOrderDetail } from '../api'
import { getProductQuoteList } from '@/modules/supplier/api'
import { getProductComboDetail } from '@/modules/product/api'
import type { ProductQuoteRow, ProductSupplierQuote } from '@/modules/supplier/types'
import type { Sku } from '@/modules/product/types'
import type { PurchaseOrder, CreatePurchaseOrderParams } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import SkuPickerDialog from '@/modules/procurement/components/SkuPickerDialog.vue'
import { expandComboSkus, mergeDraftItems, sortItemsByCombo } from '@/modules/procurement/utils/skuSelection'
import type { DraftItem } from '@/modules/procurement/utils/skuSelection'
import { buildCreatePayloads } from '@/modules/procurement/utils/purchaseOrderGrouping'
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
      selectSku: 'Select SKU',
      sku: 'SKU',
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
      itemInvalid: 'Please complete SKU and quantity',
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
    selectSku: '选择SKU',
    sku: 'SKU',
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
    itemInvalid: '请完善SKU与数量',
    itemSupplierMissing: '请为每条明细选择供应商',
    comboMissing: '组合缺少子项，不能直接采购',
    comboNotFound: '组合信息不存在'
  }
})

const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']
const currencyOptions = ['USD', 'CNY', 'EUR', 'GBP', 'JPY']

const skuDialogVisible = ref(false)
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

const displayItems = computed(() => sortItemsByCombo(form.items))

type QuoteState = {
  quotes: ProductSupplierQuote[]
  loading: boolean
  loaded: boolean
  defaultSupplierId?: number
}

const quoteStates = reactive<Record<string, QuoteState>>({})
const quoteCache = new Map<number, ProductQuoteRow | null>()

const getQuoteKey = (row: FormItem) => {
  if (!row.sku_id) return ''
  if (row.combo?.combo_id) {
    return `combo:${row.combo.combo_id}:sku:${row.sku_id}:role:${row.combo_role || 'item'}`
  }
  return `sku:${row.sku_id}`
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

const openSkuPicker = () => {
  skuDialogVisible.value = true
}

const removeRow = (row: FormItem) => {
  const index = form.items.indexOf(row)
  if (index >= 0) {
    form.items.splice(index, 1)
  }
}

const handleSkuPicked = async (skus: Sku[]) => {
  const { items, errors } = await expandComboSkus(skus, async (comboId: number) => {
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
    loadQuotesForItems(form.items)
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

const loadQuotesForItems = (items: FormItem[]) => {
  items.forEach(item => {
    void loadQuotesForRow(item)
  })
}

const loadQuotesForRow = async (row: FormItem) => {
  if (!row.sku_id) return
  const state = getQuoteState(row)
  if (state.loaded || state.loading) return
  state.loading = true
  try {
  let quoteRow: ProductQuoteRow | null | undefined
  if (quoteCache.has(row.sku_id)) {
    quoteRow = quoteCache.get(row.sku_id) || null
  }
  if (quoteRow === undefined) {
    const sku = row.sku
    if (!sku?.seller_sku) {
      state.quotes = []
      state.loaded = true
      return
      }
      const res = await getProductQuoteList({
        page: 1,
        page_size: 50,
        keyword: sku.seller_sku,
        marketplace: sku.marketplace
      })
    quoteRow = res.data?.data?.find(item => item.product_id === row.sku_id) || null
    quoteCache.set(row.sku_id, quoteRow)
  }
    state.quotes = quoteRow?.quotes || []
    state.defaultSupplierId = quoteRow?.default_supplier_id
    state.loaded = true
    applyQuoteSelection(row, state)
  } finally {
    state.loading = false
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
    if (!item.sku_id || item.qty_ordered <= 0) {
      ElMessage.error(labels.value.itemInvalid)
      return false
    }
  }
  if (form.items.some(item => !item.supplier_id)) {
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
    .filter(item => item.sku_id)
    .map(item => ({
      sku_id: item.sku_id as number,
      qty_ordered: item.qty_ordered,
      unit_cost: item.unit_cost || 0
    }))
})

const handleSubmit = async () => {
  if (!validateForm()) return
  submitting.value = true
  try {
    if (props.mode === 'edit' && props.orderId) {
      const payload = buildPayload()
      const res = await updatePurchaseOrder(props.orderId, payload)
      if (res.data) {
        emit('saved', res.data)
      }
    } else {
      const { payloads, missing } = buildCreatePayloads(
        {
          marketplace: form.marketplace || undefined,
          currency: form.currency || undefined,
          remark: form.remark || undefined
        },
        form.items
      )
      if (missing.length > 0) {
        ElMessage.error(labels.value.itemSupplierMissing)
        return
      }
      if (payloads.length === 0) {
        ElMessage.error(labels.value.itemsRequired)
        return
      }
      const results = await Promise.all(payloads.map(payload => createPurchaseOrder(payload)))
      const orders = results.map(res => res.data).filter(Boolean) as PurchaseOrder[]
      if (orders.length > 0) {
        emit('saved', orders.length === 1 ? orders[0] : orders)
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
    sku_id: item.sku_id,
    qty_ordered: item.qty_ordered,
    unit_cost: Number(item.unit_cost || 0),
    sku: item.sku || null,
    combo: null,
    supplier_id: order.supplier_id || null
  }))
  loadQuotesForItems(form.items)
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

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0 12px;
}

.items-title {
  font-weight: 600;
}

.sku-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sku-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sku-image {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f7fa;
}

.sku-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sku-cell.is-child {
  padding-left: 14px;
  border-left: 2px solid #ebeef5;
}

.sku-code {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.combo-prefix {
  color: #909399;
  font-size: 12px;
}

.sku-title {
  color: #909399;
  font-size: 12px;
}

.supplier-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.supplier-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.supplier-name {
  font-weight: 600;
}

.supplier-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #606266;
  font-size: 12px;
}

.supplier-empty {
  color: #909399;
  font-size: 12px;
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
  margin-top: 18px;
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
</style>
