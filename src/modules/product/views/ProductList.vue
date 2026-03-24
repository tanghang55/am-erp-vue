<template>
  <div class="product-list-container">
    <div class="page-header">
      <div class="page-header__content">
        <div class="page-header__title-row">
          <h2 class="page-title">{{ text.productManagement }}</h2>
          <el-tag type="info" effect="plain" size="small">{{ text.masterDataTag }}</el-tag>
        </div>
        <p class="page-description">{{ text.productManagementDescription }}</p>
      </div>
      <div class="page-header__actions">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          {{ text.createProduct }}
        </el-button>
      </div>
    </div>

    <el-card class="workspace-card">
      <div class="workspace-toolbar workspace-toolbar--stacked">
        <div class="workspace-toolbar__intro">
          <div class="workspace-toolbar__title">{{ text.productArchive }}</div>
          <div class="workspace-toolbar__meta">
            {{ text.currentPageRecords.replace('{count}', String(displayProductList.length)) }}
          </div>
        </div>

        <el-form :model="searchForm" class="search-form search-form--stacked">
          <div class="search-form__row search-form__row--primary">
            <el-form-item class="search-form__item search-form__item--keyword">
              <el-input
                v-model="searchForm.keyword"
                :placeholder="text.keywordPlaceholder"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item class="search-form__item search-form__item--supplier">
              <SupplierSelector
                v-model="searchForm.supplier_id"
                :placeholder="text.supplier"
                :only-active="false"
                :allow-inactive="true"
              />
            </el-form-item>
            <div class="search-form__actions">
              <el-button type="primary" @click="handleSearch">{{ text.search }}</el-button>
              <el-button @click="handleReset">{{ text.reset }}</el-button>
            </div>
          </div>

          <div class="search-form__row search-form__row--secondary">
            <el-form-item class="search-form__item search-form__item--compact">
              <el-select v-model="searchForm.combo" :placeholder="text.combo" clearable>
                <el-option :label="text.all" value="" />
                <el-option :label="text.mainOnly" value="main" />
                <el-option :label="text.comboOnly" value="combo" />
              </el-select>
            </el-form-item>
            <el-form-item class="search-form__item search-form__item--compact">
              <el-select v-model="searchForm.marketplace" :placeholder="text.marketplace" clearable>
                <el-option label="US" value="US" />
                <el-option label="CA" value="CA" />
                <el-option label="AU" value="AU" />
                <el-option label="UK" value="UK" />
              </el-select>
            </el-form-item>
            <el-form-item class="search-form__item search-form__item--compact">
              <el-select v-model="searchForm.brand_id" :placeholder="text.brand" clearable filterable>
                <el-option
                  v-for="item in configOptionsByType.BRAND"
                  :key="item.id"
                  :label="item.item_name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item class="search-form__item search-form__item--category">
              <el-cascader
                v-model="searchForm.category_id"
                :options="categoryTree"
                :props="categoryCascaderProps"
                :placeholder="text.category"
                clearable
                filterable
              />
            </el-form-item>
            <el-form-item class="search-form__item search-form__item--compact">
              <el-select v-model="searchForm.status" :placeholder="text.status" clearable>
                <el-option
                  v-for="item in salesStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </el-form>
      </div>

      <el-table
        ref="productTableRef"
        :data="displayProductList"
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
                <el-table-column :label="text.productInfo" min-width="280">
                  <template #default="{ row: child }">
                    <div class="product-primary-cell product-primary-cell--child">
                      <div class="product-primary-cell__media">
                        <el-image
                          v-if="child.image_url"
                          :src="getFullImageUrl(child.image_url)"
                          :preview-src-list="[getFullImageUrl(child.image_url)]"
                          fit="cover"
                          class="table-product-image table-product-image--child"
                        />
                        <span v-else class="no-image">{{ text.noImage }}</span>
                      </div>
                        <div class="group-cell">
                          <div class="group-line">
                            <span class="group-value group-title">{{ child.seller_sku }}</span>
                            <span class="group-value group-muted">({{ child.marketplace || '-' }})</span>
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
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.productAttributes" width="220">
                  <template #default="{ row: child }">
                    <div class="attribute-cell">
                      <div class="attribute-inline">
                        <div class="attribute-inline__item">
                          <span class="attribute-inline__label">{{ text.brand }}</span>
                          <span class="attribute-inline__value">{{ child.brand_name || '-' }}</span>
                        </div>
                        <div class="attribute-inline__item">
                          <span class="attribute-inline__label">{{ text.category }}</span>
                          <span class="attribute-inline__value">{{ getCategoryName(child.category_id) }}</span>
                        </div>
                      </div>
                      <div
                        v-if="getCategoryPath(child.category_id) !== getCategoryName(child.category_id)"
                        class="attribute-secondary"
                      >
                        <span class="attribute-secondary__label">{{ text.categoryPath }}</span>
                        <span class="attribute-secondary__value">{{ getCategoryPath(child.category_id) }}</span>
                      </div>
                      <div class="attribute-secondary">
                        <span class="attribute-secondary__label">{{ text.sizeWeight }}</span>
                        <span class="attribute-secondary__value">{{ formatSizeWeight(child) }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.supplierInfo" width="150">
                  <template #default="{ row: child }">
                    <div class="group-cell">
                      <div class="group-line">
                        <span class="group-value group-title group-ellipsis">{{ child.supplier_name || '-' }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.code }}</span>
                        <span class="group-value group-muted">{{ child.supplier_code || '-' }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.inventoryInfo" width="168">
                  <template #default="{ row: child }">
                    <div class="metric-cluster">
                      <div class="metric-pill">
                        <span class="metric-pill__label">{{ text.available }}</span>
                        <span class="metric-pill__value">{{ child.inventory_available ?? '-' }}</span>
                      </div>
                      <div class="metric-pill">
                        <span class="metric-pill__label">{{ text.reserved }}</span>
                        <span class="metric-pill__value">{{ child.inventory_reserved ?? '-' }}</span>
                      </div>
                      <div class="metric-pill">
                        <span class="metric-pill__label">{{ text.inbound }}</span>
                        <span class="metric-pill__value">{{ child.inventory_inbound ?? '-' }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.priceInfo" width="172">
                  <template #default="{ row: child }">
                    <div class="price-cluster">
                      <div class="price-main">
                        <span class="price-main__label">{{ text.unitCost }}</span>
                        <span class="price-main__value">{{ formatMoney(child.unit_cost) }}</span>
                      </div>
                      <div class="price-status">
                        <el-tag :type="getStatusType(child.status)" size="small">
                          {{ getStatusLabel(child.status) }}
                        </el-tag>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.timeInfo" width="210">
                  <template #default="{ row: child }">
                    <div class="group-cell">
                      <div class="group-line">
                        <span class="group-label">{{ text.updatedAt }}</span>
                        <span class="group-value">{{ formatDateTime(child.gmt_modified) }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.updatedBy }}</span>
                        <span class="group-value group-muted">{{ child.updated_by_name || '-' }}</span>
                      </div>
                      <div class="group-line">
                        <span class="group-label">{{ text.createdAt }}</span>
                        <span class="group-value group-muted">{{ formatDateTime(child.gmt_create) }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="text.actions" width="190" fixed="right">
                  <template #default="{ row: child }">
                    <el-button size="small" @click="handleView(child)">{{ text.view }}</el-button>
                    <el-button size="small" type="primary" @click="handleEdit(child)">{{ text.edit }}</el-button>
                    <el-dropdown @command="(command) => handleRowCommand(command, child)">
                      <el-button size="small">
                        {{ text.more }}
                        <el-icon class="el-icon--right"><MoreFilled /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="images">{{ text.image }}</el-dropdown-item>
                          <el-dropdown-item command="delete" divided>
                            <el-tooltip
                              v-if="child.deletable === false && child.delete_block_reason"
                              :content="child.delete_block_reason"
                              placement="left"
                            >
                              <span class="action-disabled-label">{{ text.delete }}</span>
                            </el-tooltip>
                            <span v-else>{{ text.delete }}</span>
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="combo-empty">{{ text.noChildren }}</div>
          </template>
        </el-table-column>
        <el-table-column :label="text.productInfo" min-width="300">
          <template #default="{ row }">
            <div class="product-primary-cell">
              <div class="product-primary-cell__media">
                <el-image
                  v-if="row.image_url"
                  :src="getFullImageUrl(row.image_url)"
                  :preview-src-list="[getFullImageUrl(row.image_url)]"
                  fit="cover"
                  class="table-product-image"
                />
                <span v-else class="no-image">{{ text.noImage }}</span>
              </div>
              <div class="group-cell">
                <div class="group-line">
                  <div class="product-combo-cell">
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
                    <span class="group-value group-muted">({{ row.marketplace || '-' }})</span>
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
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.productAttributes" width="220">
          <template #default="{ row }">
            <div class="attribute-cell">
              <div class="attribute-inline">
                <div class="attribute-inline__item">
                  <span class="attribute-inline__label">{{ text.brand }}</span>
                  <span class="attribute-inline__value">{{ row.brand_name || '-' }}</span>
                </div>
                <div class="attribute-inline__item">
                  <span class="attribute-inline__label">{{ text.category }}</span>
                  <span class="attribute-inline__value">{{ getCategoryName(row.category_id) }}</span>
                </div>
              </div>
              <div
                v-if="getCategoryPath(row.category_id) !== getCategoryName(row.category_id)"
                class="attribute-secondary"
              >
                <span class="attribute-secondary__label">{{ text.categoryPath }}</span>
                <span class="attribute-secondary__value">{{ getCategoryPath(row.category_id) }}</span>
              </div>
              <div class="attribute-secondary">
                <span class="attribute-secondary__label">{{ text.sizeWeight }}</span>
                <span class="attribute-secondary__value">{{ formatSizeWeight(row) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.supplierInfo" width="150">
          <template #default="{ row }">
            <div class="group-cell">
              <div class="group-line">
                <span class="group-value group-title group-ellipsis">{{ row.supplier_name || '-' }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.code }}</span>
                <span class="group-value group-muted">{{ row.supplier_code || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.inventoryInfo" width="168">
          <template #default="{ row }">
            <div class="metric-cluster">
              <div class="metric-pill">
                <span class="metric-pill__label">{{ text.available }}</span>
                <span class="metric-pill__value">{{ row.inventory_available ?? '-' }}</span>
              </div>
              <div class="metric-pill">
                <span class="metric-pill__label">{{ text.reserved }}</span>
                <span class="metric-pill__value">{{ row.inventory_reserved ?? '-' }}</span>
              </div>
              <div class="metric-pill">
                <span class="metric-pill__label">{{ text.inbound }}</span>
                <span class="metric-pill__value">{{ row.inventory_inbound ?? '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.priceInfo" width="172">
          <template #default="{ row }">
            <div class="price-cluster">
              <div class="price-main">
                <span class="price-main__label">{{ text.unitCost }}</span>
                <span class="price-main__value">{{ formatMoney(row.unit_cost) }}</span>
              </div>
              <div class="price-status">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.timeInfo" width="210">
          <template #default="{ row }">
            <div class="group-cell">
              <div class="group-line">
                <span class="group-label">{{ text.updatedAt }}</span>
                <span class="group-value">{{ formatDateTime(row.gmt_modified) }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.updatedBy }}</span>
                <span class="group-value group-muted">{{ row.updated_by_name || '-' }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">{{ text.createdAt }}</span>
                <span class="group-value group-muted">{{ formatDateTime(row.gmt_create) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="text.actions" width="190" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">{{ text.view }}</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">{{ text.edit }}</el-button>
            <el-dropdown @command="(command) => handleRowCommand(command, row)">
              <el-button size="small">
                {{ text.more }}
                <el-icon class="el-icon--right"><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="images">{{ text.image }}</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <el-tooltip
                      v-if="row.deletable === false && row.delete_block_reason"
                      :content="row.delete_block_reason"
                      placement="left"
                    >
                      <span class="action-disabled-label">{{ text.delete }}</span>
                    </el-tooltip>
                    <span v-else>{{ text.delete }}</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <ProductEditorDialog
      v-model="dialogVisible"
      :dialog-title="dialogTitle"
      :saving="saving"
      :is-edit="isEdit"
      :product-form="productForm"
      :product-form-rules="productFormRules"
      :text="text"
      :packaging-items="packagingItems"
      :available-packaging-items="availablePackagingItems"
      :config-options-by-type="configOptionsByType"
      :sales-status-options="salesStatusOptions"
      :category-options="categoryTree"
      :get-config-item-name="getConfigItemName"
      :get-category-name="getCategoryName"
      :get-category-path="getCategoryPath"
      :get-status-label="getStatusLabel"
      :format-dimension-summary="formatDimensionSummary"
      @save="handleSave"
      @supplier-change="handleProductSupplierChange"
      @add-packaging-item="handleAddPackagingItem"
      @remove-packaging-item="handleRemovePackagingItem"
      @packaging-item-select="handlePackagingItemSelect"
    />

    <ProductDetailDialog
      v-model="detailVisible"
      :current-product="currentProduct"
      :text="text"
      :audit-logs="auditLogs"
      :audit-loading="auditLoading"
      :audit-pagination="auditPagination"
      :packaging-items="packagingItems"
      :get-full-image-url="getFullImageUrl"
      :get-status-type="getStatusType"
      :get-status-label="getStatusLabel"
      :format-date-time="formatDateTime"
      :format-optional="formatOptional"
      :format-dimension-summary="formatDimensionSummary"
      :get-category-path="getCategoryPath"
      :get-action-label="getActionLabel"
      :format-audit-changes="formatAuditChanges"
      :format-audit-field-value="formatProductAuditChangeValue"
      :get-field-label="getFieldLabel"
      :get-change-pairs="getChangePairs"
      :get-change-rows="getChangeRows"
      @audit-page-change="handleAuditPageChange(currentProduct?.id)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormRules } from 'element-plus'
import { Plus, MoreFilled } from '@element-plus/icons-vue'
import { createProduct, deleteProduct, getProductList, updateProduct } from '../api/products'
import { getProductImageList } from '../api/images'
import type { ProductSummary, ProductConfigType, CreateProductParams } from '../types'
import ProductEditorDialog from '../components/ProductEditorDialog.vue'
import ProductDetailDialog from '../components/ProductDetailDialog.vue'
import SupplierSelector from '@/modules/supplier/components/SupplierSelector.vue'
import { getProductSupplierQuote } from '@/modules/supplier/api/quotes'
import { useAuditLogFormatter } from '@/modules/common/composables/useAuditLogFormatter'
import { useI18n } from '@/modules/common/composables/useI18n'
import { useProductAuditLogs } from '../composables/useProductAuditLogs'
import { useProductCatalogMeta } from '../composables/useProductCatalogMeta'
import { useProductPackaging } from '../composables/useProductPackaging'
import {
  formatOptionalValue,
  formatProductDateTime,
  formatProductMoney,
  getProductStatusTagType
} from '../utils/display'

type ComboRole = 'main' | 'child' | 'orphan' | null
type DisplayProduct = ProductSummary & { _comboRole?: ComboRole }

const productList = ref<ProductSummary[]>([])
const loading = ref(false)

const searchForm = reactive({
  keyword: '',
  marketplace: '',
  supplier_id: undefined as number | undefined,
  brand_id: undefined as number | undefined,
  category_id: undefined as number | undefined,
  status: '',
  combo: ''
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

type ProductFormModel = CreateProductParams & { id?: number }

const productForm = reactive<ProductFormModel>({
  image_url: '',
  seller_sku: '',
  asin: '',
  title: '',
  marketplace: 'US',
  status: 'DRAFT',
  parent_id: undefined,
  combo_id: undefined,
  is_combo_main: 0,
  supplier_id: undefined,
  brand_id: undefined,
  category_id: undefined,
  dimension_unit_id: undefined,
  weight_unit_id: undefined,
  is_inspection_required: 1,
  is_packing_required: 1,
  unit_cost: undefined as number | undefined,
  fnsku: '',
  weight: undefined as number | undefined,
  length: undefined as number | undefined,
  width: undefined as number | undefined,
  height: undefined as number | undefined,
  remark: ''
})

const detailVisible = ref(false)
const currentProduct = ref<ProductSummary | null>(null)

const {
  packagingItems,
  availablePackagingItems,
  resetPackagingItems,
  loadAvailablePackagingItems,
  loadProductPackagingItems,
  handleAddPackagingItem,
  handleRemovePackagingItem,
  handlePackagingItemSelect,
  savePackagingItems
} = useProductPackaging()
const { auditLogs, auditLoading, auditPagination, loadAuditLogs, handleAuditPageChange } = useProductAuditLogs()
const {
  productConfigItems,
  categoryTree,
  configOptionsByType,
  salesStatusOptions,
  getConfigItemName,
  getSalesStatusLabel,
  getCategoryName,
  getCategoryPath,
  formatDimensionSummary,
  formatProductAuditFieldValue,
  loadProductConfigs,
  loadProductCategories
} = useProductCatalogMeta(currentProduct)
const { getActionLabel, formatAuditChanges, formatAuditFieldValue, getFieldLabel, getChangePairs, getChangeRows } = useAuditLogFormatter()
const router = useRouter()
const { t } = useI18n()
const text = computed(() => ({
  productManagement: '产品管理',
  productManagementDescription: '维护产品档案、组合关系、包材配置和默认供应商报价，列表负责定位，弹窗负责维护。',
  masterDataTag: '主档',
  productArchive: '产品档案',
  currentPageRecords: '当前页共 {count} 条产品记录',
  createProduct: '新增产品',
  keyword: t('product.list.keyword'),
  keywordPlaceholder: t('product.list.keywordPlaceholder'),
  combo: t('product.list.combo'),
  all: t('product.list.all'),
  mainOnly: t('product.list.mainOnly'),
  comboOnly: t('product.list.comboOnly'),
  marketplace: t('product.list.marketplace'),
  status: t('product.list.status'),
  salesStatus: '销售状态',
  statusDraft: '草稿',
  statusOnSale: '正常销售',
  statusReplenishing: '补货中',
  statusOffShelf: '下架',
  search: t('global.search'),
  reset: t('global.reset'),
  id: t('product.list.id'),
  image: t('product.list.image'),
  noImage: t('product.list.noImage'),
  sellerSku: t('product.list.sellerSku'),
  asin: t('product.list.asin'),
  title: t('product.list.title'),
  supplier: t('product.list.supplier'),
  unitCost: '默认供应商报价',
  actions: t('global.actions'),
  view: t('global.view'),
  edit: t('global.edit'),
  delete: t('global.delete'),
  productImage: t('product.list.productImage'),
  defaultSupplierQuote: '默认供应商报价',
  fnsku: t('product.list.fnsku'),
  brand: '品牌',
  category: '品类',
  categoryPath: '完整路径',
  productAttributes: '主档属性',
  dimensionUnit: '尺寸单位',
  weightUnit: '重量单位',
  length: '长度',
  width: '宽度',
  height: '高度',
  remark: t('product.list.remark'),
  basicInfo: '基础信息',
  basicInfoHint: '先确认产品身份，再维护站点、编码和销售状态。',
  sourcingInfo: '采购与供应商',
  sourcingInfoHint: '默认供应商决定默认报价来源；这里维护的是默认供应商当前使用的报价。',
  productAttribute: '产品属性',
  productAttributeHint: '品牌、品类、销售状态统一来自产品配置主档；不要在产品页手输字典值。',
  sizeWeight: '尺寸与重量',
  sizeWeightHint: '尺寸是产品事实，单位来自产品配置；不要再写一段不可计算的规格文本。',
  inspectionRule: '质检规则',
  inspectionRuleHint: '采购收货是否自动质检通过由产品固定决定，不在采购单逐行临时决定。',
  inspectionRequired: '需要质检',
  inspectionNotRequired: '免检直通',
  packingRule: '打包规则',
  packingRuleHint: '需要打包的产品必须进入打包流程；免打包产品会在收货或质检通过后自动转入待出库存。',
  packingRequired: '需要打包',
  packingNotRequired: '免打包直通',
  packagingConfig: '包材配置',
  packagingConfigHint: '用于打包消耗和采购建议的包材映射，只维护真实会用到的包材。',
  addPackagingItem: '添加包材',
  packagingName: '包材名称',
  unit: '单位',
  consumptionQuantity: '消耗量',
  quantityPlaceholder: '数量',
  remarkPlaceholder: '备注',
  selectPackaging: '选择包材',
  noPackagingConfigured: '暂未配置包材',
  productOverview: '产品概览',
  productOverviewHint: '右侧只做核对，不替代左侧录入。',
  supplierSelected: '已选择',
  supplierPending: '待选择',
  configPending: '待维护',
  imageStatus: '图片状态',
  imageUploaded: '已上传',
  imagePending: '待上传',
  packagingItemsCount: '包材项数',
  dimensionPreview: '尺寸预览',
  editingScope: '编辑范围',
  editingScopeHint: '新增和编辑都只维护产品资料与包材映射，不在这里处理库存和业务单据。',
  productEditorDescription: '左侧录入产品资料，右侧实时核对主档完整度。',
  cancel: t('global.cancel'),
  save: t('global.save'),
  productDetails: '产品详情',
  basicArchive: '基础档案',
  basicArchiveHint: '聚焦产品身份、主档属性、尺寸重量和供应商，不把内部 ID 放到主信息。',
  productImages: '产品图片',
  productImagesHint: '显示主图和已上传的产品图片。',
  auditLogsHint: '查看产品资料和配置变更记录，用于追溯谁改了什么。',
  productTimeline: '归档信息',
  productTimelineHint: '用于核对创建、更新、图片和供应商状态。',
  createdAt: t('product.list.createdAt'),
  updatedAt: t('product.list.updatedAt'),
  updatedBy: '最近修改人',
  auditLogs: t('product.list.auditLogs'),
  time: t('product.list.time'),
  action: t('product.list.action'),
  changes: t('product.list.changes'),
  operator: '操作人',
  systemOperator: '系统',
  noChanges: '无字段变更',
  code: '编码',
  specification: '规格',
  children: t('product.list.children'),
  noChildren: t('product.list.noChildren'),
  productInfo: t('product.list.productInfo'),
  supplierInfo: t('product.list.supplierInfo'),
  inventoryInfo: t('product.list.inventoryInfo'),
  priceInfo: t('product.list.priceInfo'),
  statusInfo: t('product.list.statusInfo'),
  specInfo: '规格信息',
  timeInfo: '时间',
  archiveInfo: '归档信息',
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
  notDeletable: '不可删除',
  deleteConfirm: t('product.list.deleteConfirm'),
  createdSuccess: t('product.list.createdSuccess'),
  updatedSuccess: t('product.list.updatedSuccess'),
  deletedSuccess: t('product.list.deletedSuccess')
}))

const categoryCascaderProps = {
  value: 'id',
  label: 'category_name',
  emitPath: false,
  checkStrictly: true
}

const productFormRules = computed<FormRules>(() => ({
  seller_sku: [{ required: true, message: text.value.required, trigger: 'blur' }],
  asin: [{ required: true, message: text.value.required, trigger: 'blur' }],
  title: [{ required: true, message: text.value.required, trigger: 'blur' }],
  marketplace: [{ required: true, message: text.value.required, trigger: 'change' }],
  supplier_id: [{ required: true, message: text.value.required, trigger: 'change' }],
  status: [{ required: true, message: text.value.required, trigger: 'change' }]
}))

// 加载产品列表
const loadProductList = async () => {
  loading.value = true
  try {
    const res = await getProductList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      marketplace: searchForm.marketplace || undefined,
      supplier_id: searchForm.supplier_id || undefined,
      brand_id: searchForm.brand_id || undefined,
      category_id: searchForm.category_id || undefined,
      status: searchForm.status || undefined
    })

    if (res.success) {
      const items = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []
      productList.value = items
      pagination.total = res.data?.total ?? res.total ?? 0
    }
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadProductList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.marketplace = ''
  searchForm.supplier_id = undefined
  searchForm.brand_id = undefined
  searchForm.category_id = undefined
  searchForm.status = ''
  searchForm.combo = ''
  handleSearch()
}

const handleProductSupplierChange = async (supplierId: number | null) => {
  if (!supplierId) {
    productForm.unit_cost = undefined
    return
  }

  if (!productForm.id) {
    if (productForm.unit_cost === undefined || productForm.unit_cost === null) {
      productForm.unit_cost = 0
    }
    return
  }

  try {
    const res = await getProductSupplierQuote(productForm.id, supplierId)
    productForm.unit_cost = res.success && res.data ? Number(res.data.price || 0) : 0
  } catch {
    productForm.unit_cost = 0
  }
}

const formatSizeWeight = (row: ProductSummary) => {
  const parts: string[] = []
  if (row.weight !== undefined && row.weight !== null && row.weight !== '') {
    parts.push(`${row.weight}${row.weight_unit_name ? ` ${row.weight_unit_name}` : ''}`)
  }
  const sizeText = formatDimensionSummary(row)
  if (sizeText && sizeText !== '-') {
    parts.push(sizeText)
  }
  return parts.length ? parts.join(' / ') : '-'
}

// Build full image URL
const getFullImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url}`
}

// 创建
const handleCreate = async () => {
  isEdit.value = false
  dialogTitle.value = text.value.createProduct
  Object.assign(productForm, {
    image_url: '',
    seller_sku: '',
    asin: '',
    title: '',
    marketplace: 'US',
    status: 'DRAFT',
    parent_id: undefined,
    combo_id: undefined,
    is_combo_main: 0,
    supplier_id: undefined,
    brand_id: undefined,
    category_id: undefined,
    dimension_unit_id: undefined,
    weight_unit_id: undefined,
    is_inspection_required: 1,
    is_packing_required: 1,
    unit_cost: undefined,
    fnsku: '',
    weight: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    remark: ''
  })
  resetPackagingItems()
  await loadAvailablePackagingItems()
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row: ProductSummary) => {
  isEdit.value = true
  dialogTitle.value = text.value.edit
  const unitCostValue =
    row.unit_cost === 0 || row.unit_cost === '0'
      ? 0
      : row.unit_cost !== undefined && row.unit_cost !== null && row.unit_cost !== ''
        ? Number(row.unit_cost)
        : undefined
  Object.assign(productForm, {
    id: row.id,
    image_url: row.image_url || '',
    seller_sku: row.seller_sku,
    asin: row.asin,
    title: row.title,
    marketplace: row.marketplace,
    status: row.status,
    parent_id: row.parent_id,
    combo_id: row.combo_id,
    is_combo_main: row.is_combo_main === 1 ? 1 : 0,
    supplier_id: row.supplier_id,
    brand_id: row.brand_id,
    category_id: row.category_id,
    dimension_unit_id: row.dimension_unit_id,
    weight_unit_id: row.weight_unit_id,
    is_inspection_required: row.is_inspection_required === 0 ? 0 : 1,
    is_packing_required: row.is_packing_required === 0 ? 0 : 1,
    unit_cost: unitCostValue,
    fnsku: row.fnsku,
    weight: row.weight !== undefined && row.weight !== null && row.weight !== '' ? Number(row.weight) : undefined,
    length: row.length !== undefined && row.length !== null && row.length !== '' ? Number(row.length) : undefined,
    width: row.width !== undefined && row.width !== null && row.width !== '' ? Number(row.width) : undefined,
    height: row.height !== undefined && row.height !== null && row.height !== '' ? Number(row.height) : undefined,
    remark: row.remark
  })

  // 加载可用包材列表
  await loadAvailablePackagingItems()

  // 加载产品的包材配置
  await loadProductPackagingItems(row.id)

  dialogVisible.value = true
}

// 查看
const loadProductDetailImages = async (productId: number) => {
  try {
    const response = await getProductImageList(productId)
    return Array.isArray(response.data) ? response.data : []
  } catch {
    return []
  }
}

const handleView = async (row: ProductSummary) => {
  currentProduct.value = {
    ...row,
    images: []
  }
  const [images] = await Promise.all([
    loadProductDetailImages(row.id),
    loadProductPackagingItems(row.id)
  ])
  currentProduct.value = {
    ...currentProduct.value,
    images
  }
  detailVisible.value = true
  auditPagination.page = 1
  loadAuditLogs(row.id)
}

// 图片管理
const handleImages = (row: ProductSummary) => {
  router.push({ name: 'product-images', params: { id: row.id } })
}

const handleRowCommand = async (command: string, row: ProductSummary) => {
  if (command === 'images') {
    handleImages(row)
    return
  }
  if (command === 'delete') {
    await handleDelete(row)
  }
}

// 保存
const handleSave = async () => {
  saving.value = true
  try {
    const payload: CreateProductParams = {
      seller_sku: productForm.seller_sku,
      asin: productForm.asin,
      title: productForm.title,
      marketplace: productForm.marketplace,
      status: productForm.status,
      parent_id: productForm.parent_id,
      combo_id: productForm.combo_id,
      is_combo_main: productForm.is_combo_main,
      supplier_id: productForm.supplier_id,
      brand_id: productForm.brand_id,
      category_id: productForm.category_id,
      dimension_unit_id: productForm.dimension_unit_id,
      weight_unit_id: productForm.weight_unit_id,
      is_inspection_required: productForm.is_inspection_required,
      is_packing_required: productForm.is_packing_required,
      unit_cost: productForm.unit_cost,
      fnsku: productForm.fnsku || undefined,
      weight: productForm.weight,
      length: productForm.length,
      width: productForm.width,
      height: productForm.height,
      image_url: productForm.image_url,
      remark: productForm.remark || undefined
    }
    if (isEdit.value) {
      await updateProduct(productForm.id!, payload)
      await savePackagingItems(productForm.id!)
      ElMessage.success(text.value.updatedSuccess)
    } else {
      const res = await createProduct(payload)
      if (res?.data?.id) {
        await savePackagingItems(res.data.id)
      }
      ElMessage.success(text.value.createdSuccess)
    }
    dialogVisible.value = false
    loadProductList()
  } catch (error: any) {
    if (!error?._handled) {
      ElMessage.error(error?.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

// 删除
const handleDelete = async (row: ProductSummary) => {
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || text.value.notDeletable)
    return
  }
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

    await deleteProduct(row.id)
    ElMessage.success(text.value.deletedSuccess)
    loadProductList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete failed:', error)
    }
  }
}

// 状态类型
const getStatusType = getProductStatusTagType
const getStatusLabel = (status: string) => getSalesStatusLabel(status)

const formatProductAuditChangeValue = (key: string, value: unknown) => {
  const mapped = formatProductAuditFieldValue(key, value)
  if (mapped !== String(value ?? '')) {
    return mapped
  }
  return formatAuditFieldValue(key, value)
}
const formatMoney = formatProductMoney
const formatDateTime = formatProductDateTime
const formatOptional = formatOptionalValue

const comboChildrenMap = computed(() => {
  const map = new Map<number, ProductSummary[]>()
  for (const product of productList.value) {
    if (!product.combo_id) continue
    const comboId = Number(product.combo_id)
    if (product.is_combo_main === 1 || product.id === comboId) {
      continue
    }
    const list = map.get(comboId) || []
    list.push(product)
    map.set(comboId, list)
  }
  return map
})

const getComboChildren = (row: DisplayProduct) => {
  if (!row.combo_id) return []
  return comboChildrenMap.value.get(Number(row.combo_id)) || []
}

const displayProductList = computed<DisplayProduct[]>(() => {
  const result: DisplayProduct[] = []

  for (const product of productList.value) {
    if (!product.combo_id) {
      result.push({ ...product, _comboRole: null })
      continue
    }
    if (product.is_combo_main === 1 || product.id === Number(product.combo_id)) {
      result.push({ ...product, _comboRole: 'main' })
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

const getRowClassName = ({ row }: { row: DisplayProduct }) => {
  const hasChildren = getComboChildren(row).length > 0
  if (row._comboRole === 'main') {
    return hasChildren ? 'combo-main-row' : 'combo-main-row combo-no-expand'
  }
  return hasChildren ? '' : 'combo-no-expand'
}

const productTableRef = ref()
const toggleComboRow = (row: DisplayProduct) => {
  if (!getComboChildren(row).length) return
  productTableRef.value?.toggleRowExpansion(row)
}

onMounted(() => {
  loadProductConfigs()
  loadProductCategories()
  loadProductList()
})
</script>

<style src="../styles/product-list.css"></style>

