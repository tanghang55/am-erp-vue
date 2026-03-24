<template>
  <div class="supplier-quote-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>供应商报价</h3>
          <el-button type="primary" @click="handleSearch">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="产品编码 / ASIN / 标题" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="站点">
          <el-select v-model="searchForm.marketplace" placeholder="全部" clearable style="width: 160px">
            <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="quoteRows" v-loading="loading" border stripe>
        <el-table-column label="产品" min-width="320">
          <template #default="{ row }">
            <div class="product-cell">
              <img
                v-if="row.image_url"
                :src="getFullImageUrl(row.image_url)"
                class="product-image"
                alt="product"
              />
              <div v-else class="product-image-placeholder">无图</div>
              <div class="product-meta">
                <div class="product-line product-sku">{{ row.seller_sku }}</div>
                <div class="product-line">
                  <span class="product-label">ASIN</span>
                  <span class="product-value">{{ row.asin || '-' }}</span>
                </div>
                <div class="product-line">
                  <span class="product-label">站点</span>
                  <span class="product-value">{{ row.marketplace || '-' }}</span>
                </div>
                <div class="product-line">
                  <span class="product-label">标题</span>
                  <span class="product-value product-title">{{ row.title || '-' }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报价列表" min-width="560">
          <template #default="{ row }">
            <div class="quote-list-header">
              <span class="quote-count">{{ row.quotes?.length || 0 }} 条报价</span>
              <el-button size="small" type="primary" @click="openCreate(row)">新增报价</el-button>
            </div>
            <div v-if="row.quotes && row.quotes.length" class="quote-list">
              <div v-for="quote in row.quotes" :key="quote.id" class="quote-card">
                <div class="quote-header">
                  <div class="quote-supplier">
                    <span class="quote-name">{{ quote.supplier_name || '-' }}</span>
                    <span v-if="quote.supplier_code" class="quote-code">({{ quote.supplier_code }})</span>
                  </div>
                  <div class="quote-tags">
                    <el-tag v-if="isDefault(row, quote)" type="success" size="small">默认</el-tag>
                    <el-tag size="small">{{ quote.status || 'ACTIVE' }}</el-tag>
                  </div>
                </div>
                <div class="quote-body">
                  <div class="quote-line">
                    <span class="quote-label">报价</span>
                    <span class="quote-value">{{ formatPrice(quote.price, quote.currency) }}</span>
                  </div>
                  <div class="quote-line">
                    <span class="quote-label">MOQ</span>
                    <span class="quote-value">{{ quote.qty_moq }}</span>
                  </div>
                  <div class="quote-line">
                    <span class="quote-label">交期</span>
                    <span class="quote-value">{{ quote.lead_time_days }} 天</span>
                  </div>
                  <div v-if="quote.remark" class="quote-line">
                    <span class="quote-label">备注</span>
                    <span class="quote-value">{{ quote.remark }}</span>
                  </div>
                </div>
                <div class="quote-actions">
                  <el-button link type="primary" @click="openEdit(row, quote)">编辑</el-button>
                  <el-button link type="danger" @click="handleDelete(row, quote)">删除</el-button>
                  <el-button
                    v-if="!isDefault(row, quote)"
                    link
                    type="success"
                    @click="handleSetDefault(row, quote)"
                  >
                    设为默认
                  </el-button>
                </div>
              </div>
            </div>
            <div v-else class="quote-empty">暂无报价</div>
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
        <el-form-item label="产品">
          <div v-if="activeProduct" class="dialog-product-card">
            <img
              v-if="activeProduct.image_url"
              :src="getFullImageUrl(activeProduct.image_url)"
              class="dialog-product-image"
              alt="product"
            />
            <div v-else class="dialog-product-image placeholder">无图</div>
            <div class="dialog-product-meta">
              <div class="dialog-product-sku">{{ activeProduct.seller_sku }}</div>
              <div class="dialog-product-line">ASIN：{{ activeProduct.asin || '-' }}</div>
              <div class="dialog-product-line">站点：{{ activeProduct.marketplace || '-' }}</div>
              <div class="dialog-product-line">{{ activeProduct.title || '-' }}</div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="供应商" prop="supplier_id">
          <SupplierSelector
            v-model="quoteForm.supplier_id"
            class="supplier-selector"
            type="PRODUCT"
            title="选择供应商"
            placeholder="请选择供应商"
          />
        </el-form-item>
        <el-form-item label="报价" prop="price">
          <el-input-number v-model="quoteForm.price" :min="0" :precision="4" style="width: 100%" />
        </el-form-item>
        <el-form-item label="币种" prop="currency">
          <el-input v-model="quoteForm.currency" />
        </el-form-item>
        <el-form-item label="MOQ" prop="qty_moq">
          <el-input-number v-model="quoteForm.qty_moq" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="交期(天)" prop="lead_time_days">
          <el-input-number v-model="quoteForm.lead_time_days" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="quoteForm.status" placeholder="ACTIVE" style="width: 100%">
            <el-option label="启用" value="ACTIVE" />
            <el-option label="停用" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="quoteForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onActivated, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { getProductQuoteList, createQuote, updateQuote, deleteQuote, setDefaultSupplier } from '../api'
import type { ProductQuoteRow, ProductSupplierQuote, QuoteUpsertParams } from '../types'
import SupplierSelector from '@/modules/supplier/components/SupplierSelector.vue'

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
const activeProduct = ref<ProductQuoteRow | null>(null)

const quoteForm = reactive({
  product_id: 0,
  supplier_id: null as number | null,
  price: 0,
  currency: 'USD',
  qty_moq: 1,
  lead_time_days: 0,
  status: 'ACTIVE',
  remark: ''
})

const quoteFormRules: FormRules = {
  product_id: [{ required: true, message: '请选择产品', trigger: 'change' }],
  supplier_id: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  price: [{ required: true, message: '请输入报价', trigger: 'blur' }],
  currency: [{ required: true, message: '请输入币种', trigger: 'blur' }]
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
  dialogTitle.value = '新增供应商报价'
  activeProduct.value = row
  Object.assign(quoteForm, {
    product_id: row.product_id,
    supplier_id: null,
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
  dialogTitle.value = '编辑供应商报价'
  activeProduct.value = row
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
      supplier_id: quoteForm.supplier_id!,
      price: quoteForm.price,
      currency: quoteForm.currency,
      qty_moq: quoteForm.qty_moq,
      lead_time_days: quoteForm.lead_time_days,
      status: quoteForm.status,
      remark: quoteForm.remark || undefined
    }
    if (isEdit.value) {
      await updateQuote(payload)
      ElMessage.success('报价更新成功')
    } else {
      await createQuote(payload)
      ElMessage.success('报价创建成功')
    }
    dialogVisible.value = false
    activeProduct.value = null
    loadQuoteList()
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: ProductQuoteRow, quote: ProductSupplierQuote) => {
  try {
    await ElMessageBox.confirm('确认删除这条报价吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteQuote(row.product_id, quote.supplier_id)
    ElMessage.success('报价删除成功')
    loadQuoteList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete quote failed:', error)
    }
  }
}

const handleSetDefault = async (row: ProductQuoteRow, quote: ProductSupplierQuote) => {
  try {
    await ElMessageBox.confirm('确认将该供应商设为默认报价吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await setDefaultSupplier(row.product_id, quote.supplier_id)
    ElMessage.success('默认供应商已更新')
    loadQuoteList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Set default supplier failed:', error)
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

onActivated(() => {
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

.dialog-product-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
}

.dialog-product-image {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #dbe1ea;
  flex-shrink: 0;
}

.dialog-product-image.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 12px;
  background: #fff;
}

.dialog-product-meta {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.dialog-product-sku {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.dialog-product-line {
  color: #475569;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-all;
}

.supplier-selector {
  width: 100%;
}
</style>
