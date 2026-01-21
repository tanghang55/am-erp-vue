<template>
  <div class="supplier-quote-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Supplier Quotes</h3>
          <el-button type="primary" @click="handleSearch">Refresh</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="Keyword">
          <el-input v-model="searchForm.keyword" placeholder="SKU/ASIN/Title" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="Marketplace">
          <el-select v-model="searchForm.marketplace" placeholder="All" clearable style="width: 160px">
            <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">Search</el-button>
          <el-button @click="handleReset">Reset</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="quoteRows" v-loading="loading" border stripe>
        <el-table-column label="Product" min-width="320">
          <template #default="{ row }">
            <div class="product-cell">
              <img
                v-if="row.image_url"
                :src="getFullImageUrl(row.image_url)"
                class="product-image"
                alt="product"
              />
              <div v-else class="product-image-placeholder">No Image</div>
              <div class="product-meta">
                <div class="product-line product-sku">{{ row.seller_sku }}</div>
                <div class="product-line">
                  <span class="product-label">ASIN</span>
                  <span class="product-value">{{ row.asin || '-' }}</span>
                </div>
                <div class="product-line">
                  <span class="product-label">Market</span>
                  <span class="product-value">{{ row.marketplace || '-' }}</span>
                </div>
                <div class="product-line">
                  <span class="product-label">Title</span>
                  <span class="product-value product-title">{{ row.title || '-' }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Supplier Quotes" min-width="560">
          <template #default="{ row }">
            <div class="quote-list-header">
              <span class="quote-count">{{ row.quotes?.length || 0 }} quotes</span>
              <el-button size="small" type="primary" @click="openCreate(row)">Add Quote</el-button>
            </div>
            <div v-if="row.quotes && row.quotes.length" class="quote-list">
              <div v-for="quote in row.quotes" :key="quote.id" class="quote-card">
                <div class="quote-header">
                  <div class="quote-supplier">
                    <span class="quote-name">{{ quote.supplier_name || '-' }}</span>
                    <span v-if="quote.supplier_code" class="quote-code">({{ quote.supplier_code }})</span>
                  </div>
                  <div class="quote-tags">
                    <el-tag v-if="isDefault(row, quote)" type="success" size="small">Default</el-tag>
                    <el-tag size="small">{{ quote.status || 'ACTIVE' }}</el-tag>
                  </div>
                </div>
                <div class="quote-body">
                  <div class="quote-line">
                    <span class="quote-label">Price</span>
                    <span class="quote-value">{{ formatPrice(quote.price, quote.currency) }}</span>
                  </div>
                  <div class="quote-line">
                    <span class="quote-label">MOQ</span>
                    <span class="quote-value">{{ quote.qty_moq }}</span>
                  </div>
                  <div class="quote-line">
                    <span class="quote-label">Lead Time</span>
                    <span class="quote-value">{{ quote.lead_time_days }} days</span>
                  </div>
                  <div v-if="quote.remark" class="quote-line">
                    <span class="quote-label">Remark</span>
                    <span class="quote-value">{{ quote.remark }}</span>
                  </div>
                </div>
                <div class="quote-actions">
                  <el-button link type="primary" @click="openEdit(row, quote)">Edit</el-button>
                  <el-button link type="danger" @click="handleDelete(row, quote)">Delete</el-button>
                  <el-button
                    v-if="!isDefault(row, quote)"
                    link
                    type="success"
                    @click="handleSetDefault(row, quote)"
                  >
                    Set Default
                  </el-button>
                </div>
              </div>
            </div>
            <div v-else class="quote-empty">No quotes</div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px">
      <el-form :model="quoteForm" :rules="quoteFormRules" ref="quoteFormRef" label-width="140px">
        <el-form-item label="Product ID" prop="product_id">
          <el-input v-model.number="quoteForm.product_id" disabled />
        </el-form-item>
        <el-form-item label="Supplier ID" prop="supplier_id">
          <el-input v-model.number="quoteForm.supplier_id" />
        </el-form-item>
        <el-form-item label="Price" prop="price">
          <el-input-number v-model="quoteForm.price" :min="0" :precision="4" />
        </el-form-item>
        <el-form-item label="Currency" prop="currency">
          <el-input v-model="quoteForm.currency" />
        </el-form-item>
        <el-form-item label="MOQ" prop="qty_moq">
          <el-input-number v-model="quoteForm.qty_moq" :min="1" />
        </el-form-item>
        <el-form-item label="Lead Time (days)" prop="lead_time_days">
          <el-input-number v-model="quoteForm.lead_time_days" :min="0" />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="quoteForm.status" placeholder="ACTIVE">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="Remark">
          <el-input v-model="quoteForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getProductQuoteList, createQuote, updateQuote, deleteQuote, setDefaultSupplier } from '../api'
import type { ProductQuoteRow, ProductSupplierQuote, QuoteUpsertParams } from '../types'

const quoteRows = ref<ProductQuoteRow[]>([])
const loading = ref(false)

const searchForm = reactive({
  keyword: '',
  marketplace: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const saving = ref(false)
const quoteFormRef = ref<FormInstance>()

const quoteForm = reactive({
  product_id: 0,
  supplier_id: 0,
  price: 0,
  currency: 'USD',
  qty_moq: 1,
  lead_time_days: 0,
  status: 'ACTIVE',
  remark: ''
})

const quoteFormRules: FormRules = {
  product_id: [{ required: true, message: 'Required', trigger: 'blur' }],
  supplier_id: [{ required: true, message: 'Required', trigger: 'blur' }],
  price: [{ required: true, message: 'Required', trigger: 'blur' }],
  currency: [{ required: true, message: 'Required', trigger: 'blur' }]
}

const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']

const loadQuoteList = async () => {
  loading.value = true
  try {
    const res = await getProductQuoteList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      marketplace: searchForm.marketplace || undefined
    })
    if (res.success) {
      quoteRows.value = res.data.data
      pagination.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadQuoteList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.marketplace = ''
  handleSearch()
}

const openCreate = (row: ProductQuoteRow) => {
  isEdit.value = false
  dialogTitle.value = 'Add Quote'
  Object.assign(quoteForm, {
    product_id: row.product_id,
    supplier_id: 0,
    price: 0,
    currency: 'USD',
    qty_moq: 1,
    lead_time_days: 0,
    status: 'ACTIVE',
    remark: ''
  })
  dialogVisible.value = true
}

const openEdit = (row: ProductQuoteRow, quote: ProductSupplierQuote) => {
  isEdit.value = true
  dialogTitle.value = 'Edit Quote'
  Object.assign(quoteForm, {
    product_id: row.product_id,
    supplier_id: quote.supplier_id,
    price: Number(quote.price) || 0,
    currency: quote.currency,
    qty_moq: quote.qty_moq,
    lead_time_days: quote.lead_time_days,
    status: quote.status,
    remark: quote.remark || ''
  })
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!quoteFormRef.value) return
  const valid = await quoteFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const payload: QuoteUpsertParams = {
      product_id: quoteForm.product_id,
      supplier_id: quoteForm.supplier_id,
      price: quoteForm.price,
      currency: quoteForm.currency,
      qty_moq: quoteForm.qty_moq,
      lead_time_days: quoteForm.lead_time_days,
      status: quoteForm.status,
      remark: quoteForm.remark || undefined
    }
    if (isEdit.value) {
      await updateQuote(payload)
      ElMessage.success('Quote updated successfully')
    } else {
      await createQuote(payload)
      ElMessage.success('Quote created successfully')
    }
    dialogVisible.value = false
    loadQuoteList()
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: ProductQuoteRow, quote: ProductSupplierQuote) => {
  try {
    await ElMessageBox.confirm('Are you sure to delete this quote?', 'Warning', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    await deleteQuote(row.product_id, quote.supplier_id)
    ElMessage.success('Quote deleted successfully')
    loadQuoteList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

const handleSetDefault = async (row: ProductQuoteRow, quote: ProductSupplierQuote) => {
  try {
    await ElMessageBox.confirm('Set this supplier as default?', 'Warning', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    await setDefaultSupplier(row.product_id, quote.supplier_id)
    ElMessage.success('Default supplier updated')
    loadQuoteList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Update failed:', error)
    }
  }
}

const isDefault = (row: ProductQuoteRow, quote: ProductSupplierQuote) =>
  row.default_supplier_id === quote.supplier_id

const formatPrice = (price: number | string, currency: string) => {
  if (price === undefined || price === null) return '-'
  return `${price} ${currency || ''}`.trim()
}

const getFullImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url}`
}

onMounted(() => {
  loadQuoteList()
})
</script>

<style scoped>
.supplier-quote-container {
  width: 100%;
  max-width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.product-cell {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.product-image {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.product-image-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  border: 1px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #9ca3af;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-line {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: #374151;
}

.product-sku {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}

.product-label {
  color: #6b7280;
  min-width: 48px;
}

.product-title {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quote-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.quote-count {
  font-size: 13px;
  color: #6b7280;
}

.quote-list {
  display: grid;
  gap: 10px;
}

.quote-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  background: #f9fafb;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.quote-supplier {
  font-weight: 600;
  color: #111827;
}

.quote-code {
  margin-left: 6px;
  color: #6b7280;
  font-size: 12px;
}

.quote-tags {
  display: flex;
  gap: 6px;
}

.quote-body {
  display: grid;
  gap: 4px;
}

.quote-line {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #374151;
}

.quote-label {
  color: #6b7280;
  min-width: 70px;
}

.quote-actions {
  margin-top: 6px;
  display: flex;
  gap: 8px;
}

.quote-empty {
  padding: 12px 0;
  color: #9ca3af;
  font-size: 13px;
}
</style>
