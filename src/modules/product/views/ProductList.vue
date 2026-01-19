<template>
  <div class="product-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>{{ text.skuManagement }}</h3>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            {{ text.createSku }}
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item :label="text.keyword">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="text.keywordPlaceholder"
            clearable
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item :label="text.combo">
          <el-select v-model="searchForm.combo" :placeholder="text.all" clearable>
            <el-option :label="text.all" value="" />
            <el-option :label="text.mainOnly" value="main" />
            <el-option :label="text.comboOnly" value="combo" />
          </el-select>
        </el-form-item>
        <el-form-item :label="text.marketplace">
          <el-select v-model="searchForm.marketplace" :placeholder="text.all" clearable>
            <el-option label="US" value="US" />
            <el-option label="CA" value="CA" />
            <el-option label="AU" value="AU" />
            <el-option label="UK" value="UK" />
          </el-select>
        </el-form-item>
        <el-form-item :label="text.status">
          <el-select v-model="searchForm.status" :placeholder="text.all" clearable>
            <el-option :label="text.statusActive" value="ACTIVE" />
            <el-option :label="text.statusInactive" value="INACTIVE" />
            <el-option :label="text.statusDiscontinued" value="DISCONTINUED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ text.search }}</el-button>
          <el-button @click="handleReset">{{ text.reset }}</el-button>
        </el-form-item>
      </el-form>

      <!-- SKU列表 -->
      <el-table
        ref="skuTableRef"
        :data="displaySkuList"
        v-loading="loading"
        border
        stripe
        :row-class-name="getRowClassName"
        row-key="id"
      >
        <el-table-column type="expand" width="40">
          <template #default="{ row }">
            <div v-if="getComboChildren(row).length" class="combo-children">
              <div class="combo-children-title">
                {{ text.children }}
                <span class="combo-children-count">({{ getComboChildren(row).length }})</span>
              </div>
              <el-table :data="getComboChildren(row)" size="small" border>
                <el-table-column :label="text.image" width="100">
                  <template #default="{ row: child }">
                    <el-image
                      v-if="child.image_url"
                      :src="getFullImageUrl(child.image_url)"
                      :preview-src-list="[getFullImageUrl(child.image_url)]"
                      fit="cover"
                      style="width: 50px; height: 50px; border-radius: 4px"
                    />
                    <span v-else class="no-image">{{ text.noImage }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="text.productInfo" min-width="260">
                  <template #default="{ row: child }">
                    <div class="group-cell">
                      <div class="group-line">
                        <span class="group-value group-title">{{ child.seller_sku }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.asin }}</span>
                        <span class="group-value">{{ child.asin || '-' }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.title }}</span>
                        <span class="group-value group-muted group-ellipsis">{{ child.title || '-' }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.supplierInfo" width="180">
                  <template #default="{ row: child }">
                    <div class="group-cell">
                      <div class="group-line">
                        <span class="group-label">{{ text.supplier }}</span>
                        <span class="group-value">{{ child.supplier?.name || '-' }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">ID</span>
                        <span class="group-value">{{ child.supplier_id || '-' }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.inventoryInfo" width="190">
                  <template #default="{ row: child }">
                    <div class="group-cell">
                      <div class="group-line">
                        <span class="group-label">{{ text.available }}</span>
                        <span class="group-value">{{ getInventoryValue(child, 'available') }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.reserved }}</span>
                        <span class="group-value">{{ getInventoryValue(child, 'reserved') }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.inbound }}</span>
                        <span class="group-value">{{ getInventoryValue(child, 'inbound') }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.priceInfo" width="180">
                  <template #default="{ row: child }">
                    <div class="group-cell">
                      <div class="group-line">
                        <span class="group-label">{{ text.unitCost }}</span>
                        <span class="group-value">{{ formatMoney(child.unit_cost) }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.weight }}</span>
                        <span class="group-value">{{ child.weight || '-' }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.dimensions }}</span>
                        <span class="group-value">{{ child.dimensions || '-' }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.statusInfo" width="150">
                  <template #default="{ row: child }">
                    <div class="group-cell">
                      <div class="group-line">
                        <el-tag :type="getStatusType(child.status)">
                          {{ child.status }}
                        </el-tag>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.marketplace }}</span>
                        <span class="group-value">{{ child.marketplace }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.createdInfo" width="180">
                  <template #default="{ row: child }">
                    <div class="group-cell">
                      <div class="group-line">
                        <span class="group-label">{{ text.createdAt }}</span>
                        <span class="group-value">{{ formatDateTime(child.created_at) }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.createdBy }}</span>
                        <span class="group-value">{{ getCreatedByDisplay(child) }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.actions" width="200" fixed="right">
                  <template #default="{ row: child }">
                    <el-button size="small" @click="handleView(child)">{{ text.view }}</el-button>
                    <el-button size="small" type="primary" @click="handleEdit(child)">{{ text.edit }}</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(child)">{{ text.delete }}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="combo-empty">{{ text.noChildren }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="text.image" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.image_url"
              :src="getFullImageUrl(row.image_url)"
              :preview-src-list="[getFullImageUrl(row.image_url)]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px"
            />
            <span v-else class="no-image">{{ text.noImage }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="text.productInfo" min-width="280">
          <template #default="{ row }">
            <div class="group-cell">
              <div class="group-line">
                <div class="sku-combo-cell">
                  <el-tag
                    v-if="row._comboRole === 'main'"
                    type="success"
                    size="small"
                    :class="{ 'combo-tag-button': getComboChildren(row).length }"
                    @click.stop="toggleComboRow(row)"
                  >
                    {{ text.comboTag }}
                  </el-tag>
                  <span class="group-value group-title">
                    {{ row.seller_sku }}
                  </span>
                  <span v-if="getComboChildren(row).length" class="combo-count">
                    {{ getComboChildren(row).length }}
                  </span>
                </div>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.asin }}</span>
                <span class="group-value">{{ row.asin || '-' }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.title }}</span>
                <span class="group-value group-muted group-ellipsis">{{ row.title || '-' }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.fnsku }}</span>
                <span class="group-value">{{ row.fnsku || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.supplierInfo" width="180">
          <template #default="{ row }">
            <div class="group-cell">
              <div class="group-line">
                <span class="group-label">{{ text.supplier }}</span>
                <span class="group-value">{{ row.supplier?.name || '-' }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">ID</span>
                <span class="group-value">{{ row.supplier_id || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.inventoryInfo" width="190">
          <template #default="{ row }">
            <div class="group-cell">
              <div class="group-line">
                <span class="group-label">{{ text.available }}</span>
                <span class="group-value">{{ getInventoryValue(row, 'available') }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.reserved }}</span>
                <span class="group-value">{{ getInventoryValue(row, 'reserved') }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.inbound }}</span>
                <span class="group-value">{{ getInventoryValue(row, 'inbound') }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.priceInfo" width="180">
          <template #default="{ row }">
            <div class="group-cell">
              <div class="group-line">
                <span class="group-label">{{ text.unitCost }}</span>
                <span class="group-value">{{ formatMoney(row.unit_cost) }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.weight }}</span>
                <span class="group-value">{{ row.weight || '-' }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.dimensions }}</span>
                <span class="group-value">{{ row.dimensions || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.statusInfo" width="150">
          <template #default="{ row }">
            <div class="group-cell">
              <div class="group-line">
                <el-tag :type="getStatusType(row.status)">
                  {{ row.status }}
                </el-tag>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.marketplace }}</span>
                <span class="group-value">{{ row.marketplace }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.createdInfo" width="180">
          <template #default="{ row }">
            <div class="group-cell">
              <div class="group-line">
                <span class="group-label">{{ text.createdAt }}</span>
                <span class="group-value">{{ formatDateTime(row.created_at) }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.createdBy }}</span>
                <span class="group-value">{{ getCreatedByDisplay(row) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.actions" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ text.view }}</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">{{ text.edit }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">{{ text.delete }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form :model="skuForm" :rules="skuFormRules" ref="skuFormRef" label-width="140px">
        <el-form-item :label="text.productImage">
          <ImageUpload v-model="skuForm.image_url" sub-dir="products" />
        </el-form-item>
        <el-form-item :label="text.sellerSku" prop="seller_sku">
          <el-input v-model="skuForm.seller_sku" :disabled="isEdit" />
        </el-form-item>
        <el-form-item :label="text.asin" prop="asin">
          <el-input v-model="skuForm.asin" />
        </el-form-item>
        <el-form-item :label="text.title" prop="title">
          <el-input v-model="skuForm.title" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item :label="text.marketplace" prop="marketplace">
          <el-select v-model="skuForm.marketplace" :disabled="isEdit">
            <el-option label="US" value="US" />
            <el-option label="CA" value="CA" />
            <el-option label="AU" value="AU" />
            <el-option label="UK" value="UK" />
          </el-select>
        </el-form-item>
        <el-form-item :label="text.unitCostUsd">
          <el-input-number v-model="skuForm.unit_cost" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item :label="text.fnsku">
          <el-input v-model="skuForm.fnsku" />
        </el-form-item>
        <el-form-item :label="text.remark">
          <el-input v-model="skuForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ text.cancel }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ text.save }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" :title="text.skuDetails" width="1200px" top="4vh" class="sku-detail-dialog">
      <div v-if="currentSku" class="sku-detail-grid">
        <div class="sku-detail-media">
          <el-image
            v-if="currentSku.image_url"
            :src="getFullImageUrl(currentSku.image_url)"
            :preview-src-list="[getFullImageUrl(currentSku.image_url)]"
            fit="contain"
            class="sku-detail-image"
          />
          <div v-else class="sku-detail-placeholder">{{ text.noImage }}</div>
          <div class="sku-detail-tags">
            <el-tag :type="getStatusType(currentSku.status)" size="large">{{ currentSku.status }}</el-tag>
            <el-tag type="info" size="large">{{ currentSku.marketplace }}</el-tag>
          </div>
        </div>
        <div class="sku-detail-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item :label="text.id">{{ currentSku.id }}</el-descriptions-item>
            <el-descriptions-item :label="text.sellerSku">{{ currentSku.seller_sku }}</el-descriptions-item>
            <el-descriptions-item :label="text.asin">{{ currentSku.asin }}</el-descriptions-item>
            <el-descriptions-item :label="text.fnsku">{{ currentSku.fnsku || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="text.title" :span="2">{{ currentSku.title }}</el-descriptions-item>
            <el-descriptions-item :label="text.unitCost">${{ currentSku.unit_cost || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="text.supplier">{{ currentSku.supplier?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="text.createdAt">{{ currentSku.created_at }}</el-descriptions-item>
            <el-descriptions-item :label="text.updatedAt">{{ currentSku.updated_at || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="text.remark" :span="2">{{ currentSku.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <el-divider content-position="left">{{ text.auditLogs }}</el-divider>
      <el-table :data="auditLogs" v-loading="auditLoading" border stripe>
        <el-table-column prop="created_at" :label="text.time" width="180" />
        <el-table-column prop="action" :label="text.action" width="140" />
        <el-table-column :label="text.changes" min-width="360">
          <template #default="{ row }">
            <div class="audit-summary">
              {{ formatAuditSummary(row) }}
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="audit-pagination">
        <el-pagination
          v-model:current-page="auditPagination.page"
          v-model:page-size="auditPagination.page_size"
          :page-sizes="[5, 10, 20]"
          :total="auditPagination.total"
          small
          layout="total, sizes, prev, pager, next"
          @size-change="handleAuditPageChange"
          @current-change="handleAuditPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSkuList, createSku, updateSku, deleteSku, getSkuAuditLogs } from '../api'
import type { Sku } from '../types'
import type { AuditLog } from '@/modules/identity/types'
import ImageUpload from '@/modules/common/components/ImageUpload.vue'
import { useAuditLogFormatter } from '@/modules/common/composables/useAuditLogFormatter'
import { useI18n } from '@/modules/common/composables/useI18n'

type ComboRole = 'main' | 'child' | 'orphan' | null
type DisplaySku = Sku & { _comboRole?: ComboRole }

// 列表数据
const skuList = ref<Sku[]>([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  marketplace: '',
  status: '',
  combo: ''
})

// 分页
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const saving = ref(false)
const skuFormRef = ref<FormInstance>()

const skuForm = reactive({
  image_url: '',
  seller_sku: '',
  asin: '',
  title: '',
  marketplace: 'US',
  unit_cost: undefined as number | undefined,
  fnsku: '',
  remark: ''
})


// 详情
const detailVisible = ref(false)
const currentSku = ref<Sku | null>(null)
const auditLogs = ref<AuditLog[]>([])
const auditLoading = ref(false)
const auditPagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})
const { formatAuditSummary } = useAuditLogFormatter()
const { t } = useI18n()
const text = computed(() => ({
  skuManagement: t('product.list.skuManagement'),
  createSku: t('product.list.createSku'),
  keyword: t('product.list.keyword'),
  keywordPlaceholder: t('product.list.keywordPlaceholder'),
  combo: t('product.list.combo'),
  all: t('product.list.all'),
  mainOnly: t('product.list.mainOnly'),
  comboOnly: t('product.list.comboOnly'),
  marketplace: t('product.list.marketplace'),
  status: t('product.list.status'),
  statusActive: t('product.list.statusActive'),
  statusInactive: t('product.list.statusInactive'),
  statusDiscontinued: t('product.list.statusDiscontinued'),
  search: t('global.search'),
  reset: t('global.reset'),
  id: t('product.list.id'),
  image: t('product.list.image'),
  noImage: t('product.list.noImage'),
  sellerSku: t('product.list.sellerSku'),
  asin: t('product.list.asin'),
  title: t('product.list.title'),
  supplier: t('product.list.supplier'),
  unitCost: t('product.list.unitCost'),
  actions: t('global.actions'),
  view: t('global.view'),
  edit: t('global.edit'),
  delete: t('global.delete'),
  productImage: t('product.list.productImage'),
  unitCostUsd: t('product.list.unitCostUsd'),
  fnsku: t('product.list.fnsku'),
  remark: t('product.list.remark'),
  cancel: t('global.cancel'),
  save: t('global.save'),
  skuDetails: t('product.list.skuDetails'),
  createdAt: t('product.list.createdAt'),
  updatedAt: t('product.list.updatedAt'),
  auditLogs: t('product.list.auditLogs'),
  time: t('product.list.time'),
  action: t('product.list.action'),
  changes: t('product.list.changes'),
  children: t('product.list.children'),
  noChildren: t('product.list.noChildren'),
  productInfo: t('product.list.productInfo'),
  supplierInfo: t('product.list.supplierInfo'),
  inventoryInfo: t('product.list.inventoryInfo'),
  priceInfo: t('product.list.priceInfo'),
  statusInfo: t('product.list.statusInfo'),
  createdInfo: t('product.list.createdInfo'),
  available: t('product.list.available'),
  reserved: t('product.list.reserved'),
  inbound: t('product.list.inbound'),
  weight: t('product.list.weight'),
  dimensions: t('product.list.dimensions'),
  createdBy: t('product.list.createdBy'),
  required: t('global.required'),
  warning: t('global.warning'),
  confirm: t('global.confirm'),
  comboTag: t('product.list.comboTag'),
  deleteConfirm: t('product.list.deleteConfirm'),
  createdSuccess: t('product.list.createdSuccess'),
  updatedSuccess: t('product.list.updatedSuccess'),
  deletedSuccess: t('product.list.deletedSuccess')
}))

const skuFormRules = computed<FormRules>(() => ({
  seller_sku: [{ required: true, message: text.value.required, trigger: 'blur' }],
  asin: [{ required: true, message: text.value.required, trigger: 'blur' }],
  title: [{ required: true, message: text.value.required, trigger: 'blur' }],
  marketplace: [{ required: true, message: text.value.required, trigger: 'change' }]
}))

// 加载SKU列表
const loadSkuList = async () => {
  loading.value = true
  try {
    const res = await getSkuList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      marketplace: searchForm.marketplace || undefined,
      status: searchForm.status || undefined
    })

    if (res.success) {
      const items = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []
      skuList.value = items
      pagination.total = res.data?.total ?? res.total ?? 0
    }
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadSkuList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.marketplace = ''
  searchForm.status = ''
  searchForm.combo = ''
  handleSearch()
}

// Build full image URL
const getFullImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url}`
}

// 创建
const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = text.value.createSku
  Object.assign(skuForm, {
    image_url: '',
    seller_sku: '',
    asin: '',
    title: '',
    marketplace: 'US',
    unit_cost: undefined,
    fnsku: '',
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: Sku) => {
  isEdit.value = true
  dialogTitle.value = text.value.edit
  Object.assign(skuForm, {
    id: row.id,
    image_url: row.image_url || '',
    seller_sku: row.seller_sku,
    asin: row.asin,
    title: row.title,
    marketplace: row.marketplace,
    unit_cost: row.unit_cost ? parseFloat(row.unit_cost) : undefined,
    fnsku: row.fnsku,
    remark: row.remark
  })
  dialogVisible.value = true
}

// 查看
const handleView = (row: Sku) => {
  currentSku.value = row
  detailVisible.value = true
  auditPagination.page = 1
  loadAuditLogs(row.id)
}

// 保存
const handleSave = async () => {
  if (!skuFormRef.value) return

  await skuFormRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        if (isEdit.value) {
          await updateSku((skuForm as any).id, skuForm)
          ElMessage.success(text.value.updatedSuccess)
        } else {
          await createSku(skuForm)
          ElMessage.success(text.value.createdSuccess)
        }
        dialogVisible.value = false
        loadSkuList()
      } finally {
        saving.value = false
      }
    }
  })
}

// 删除
const handleDelete = async (row: Sku) => {
  try {
    await ElMessageBox.confirm(
      text.value.deleteConfirm.replace('{sku}', row.seller_sku),
      text.value.warning,
      {
        confirmButtonText: text.value.confirm,
        cancelButtonText: text.value.cancel,
        type: 'warning'
      }
    )

    await deleteSku(row.id)
    ElMessage.success(text.value.deletedSuccess)
    loadSkuList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

// 状态类型
const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    DISCONTINUED: 'danger'
  }
  return types[status] || 'info'
}

const formatMoney = (value?: string) => {
  if (!value) return '-'
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return value
  return `$${parsed.toFixed(2)}`
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const getInventoryValue = (row: Sku, key: 'available' | 'reserved' | 'inbound') => {
  const source = row as unknown as Record<string, any>
  const candidates = {
    available: ['inventory_available', 'stock_available', 'available_qty', 'available'],
    reserved: ['inventory_reserved', 'stock_reserved', 'reserved_qty', 'reserved'],
    inbound: ['inventory_inbound', 'stock_inbound', 'inbound_qty', 'inbound']
  }[key]

  for (const field of candidates) {
    if (source[field] !== undefined && source[field] !== null && source[field] !== '') {
      return source[field]
    }
  }
  return '-'
}

const getCreatedByDisplay = (row: Sku) => {
  const source = row as unknown as Record<string, any>
  return (
    source.created_by_name ||
    source.creator_name ||
    source.creator ||
    source.created_by ||
    source.created_by_id ||
    '-'
  )
}

const loadAuditLogs = async (skuId: number) => {
  auditLoading.value = true
  try {
    const res = await getSkuAuditLogs(skuId, auditPagination.page, auditPagination.page_size)
    if (res.success) {
      auditLogs.value = res.data.data
      auditPagination.total = res.data.total
    }
  } finally {
    auditLoading.value = false
  }
}

const handleAuditPageChange = () => {
  if (!currentSku.value) return
  loadAuditLogs(currentSku.value.id)
}

const comboChildrenMap = computed(() => {
  const map = new Map<number, Sku[]>()
  for (const sku of skuList.value) {
    if (!sku.combo_id) continue
    const comboId = Number(sku.combo_id)
    if (sku.is_combo_main === 1 || sku.id === comboId) {
      continue
    }
    const list = map.get(comboId) || []
    list.push(sku)
    map.set(comboId, list)
  }
  return map
})

const getComboChildren = (row: DisplaySku) => {
  if (!row.combo_id) return []
  return comboChildrenMap.value.get(Number(row.combo_id)) || []
}

const displaySkuList = computed<DisplaySku[]>(() => {
  const result: DisplaySku[] = []

  for (const sku of skuList.value) {
    if (!sku.combo_id) {
      result.push({ ...sku, _comboRole: null })
      continue
    }
    if (sku.is_combo_main === 1 || sku.id === Number(sku.combo_id)) {
      result.push({ ...sku, _comboRole: 'main' })
    }
  }

  if (searchForm.combo === 'main') {
    return result.filter((item) => item._comboRole === 'main')
  }
  if (searchForm.combo === 'combo') {
    return result.filter((item) => item._comboRole === 'main')
  }
  return result
})

const getRowClassName = ({ row }: { row: DisplaySku }) => {
  const hasChildren = getComboChildren(row).length > 0
  if (row._comboRole === 'main') {
    return hasChildren ? 'combo-main-row' : 'combo-main-row combo-no-expand'
  }
  return hasChildren ? '' : 'combo-no-expand'
}

const skuTableRef = ref()
const toggleComboRow = (row: DisplaySku) => {
  if (!getComboChildren(row).length) return
  skuTableRef.value?.toggleRowExpansion(row)
}

onMounted(() => {
  loadSkuList()
})
</script>

<style scoped>
.product-list-container {
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

.sku-combo-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.combo-count {
  font-size: 12px;
  color: #16a34a;
  border: 1px dashed #86efac;
  padding: 0 6px;
  border-radius: 10px;
  line-height: 18px;
}

.combo-indent {
  color: #9ca3af;
  margin-left: 4px;
}

.combo-sku-text {
  font-weight: 600;
}

.group-cell {
  display: grid;
  gap: 4px;
}

.group-line {
  display: flex;
  gap: 6px;
  align-items: baseline;
  line-height: 1.2;
}

.group-label {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.group-value {
  font-size: 13px;
  color: #0f172a;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
}

.group-muted {
  color: #475569;
}

.group-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

:deep(.combo-main-row) {
  background: #f0fdf4;
}

:deep(.combo-no-expand .el-table__expand-icon) {
  visibility: hidden;
}

.no-image {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.combo-children {
  padding: 10px 8px 12px 16px;
  border-left: 2px solid #bbf7d0;
  background: #f8fffb;
}

.combo-children-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.combo-children-count {
  margin-left: 6px;
  font-weight: 500;
  color: #16a34a;
}

.combo-child-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.combo-child-title {
  color: #606266;
}

.combo-empty {
  color: #909399;
  font-size: 12px;
}

.combo-tag-button {
  cursor: pointer;
  border-style: dashed;
}

:deep(.sku-detail-dialog) {
  max-width: 92vw;
}

.sku-detail-grid {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.sku-detail-media {
  display: grid;
  gap: 12px;
}

.sku-detail-image {
  width: 100%;
  height: 320px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.sku-detail-placeholder {
  height: 320px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px dashed #d1d5db;
  color: #6b7280;
  background: #f9fafb;
}

.sku-detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sku-detail-info {
  display: grid;
  gap: 12px;
}

.sku-detail-tip {
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  border: 1px solid #e2e8f0;
}

.audit-pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.audit-summary {
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
}

@media (max-width: 900px) {
  .sku-detail-grid {
    grid-template-columns: 1fr;
  }
}

</style>
