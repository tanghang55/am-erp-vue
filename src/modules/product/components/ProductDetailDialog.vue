<template>
  <el-dialog :model-value="modelValue" :title="text.productDetails" width="1320px" top="2vh" class="product-detail-dialog" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="currentProduct" class="detail-layout">
      <div class="detail-main">
        <div class="detail-hero">
          <div class="detail-hero__media">
            <el-image
              v-if="currentProduct.image_url"
              :src="getFullImageUrl(currentProduct.image_url)"
              :preview-src-list="[getFullImageUrl(currentProduct.image_url)]"
              fit="contain"
              class="product-detail-image"
            />
            <div v-else class="product-detail-placeholder">{{ text.noImage }}</div>
          </div>
          <div class="detail-hero__content">
            <div class="detail-hero__title">{{ currentProduct.title || currentProduct.seller_sku }}</div>
            <div class="detail-hero__meta">
              <span>{{ currentProduct.seller_sku }}</span>
              <span>{{ currentProduct.asin || '-' }}</span>
              <span>{{ currentProduct.fnsku || '-' }}</span>
            </div>
            <div class="product-detail-tags">
              <el-tag :type="getStatusType(currentProduct.status)" size="large">{{ getStatusLabel(currentProduct.status) }}</el-tag>
              <el-tag type="info" size="large">{{ currentProduct.marketplace }}</el-tag>
              <el-tag :type="currentProduct.deletable === false ? 'warning' : 'success'" effect="plain" size="large">
                {{ currentProduct.deletable === false ? (currentProduct.delete_block_reason || '不可删除') : '可删除' }}
              </el-tag>
            </div>

            <div class="detail-hero__facts">
              <div class="detail-fact">
                <span class="detail-fact__label">{{ text.brand }}</span>
                <span class="detail-fact__value">{{ currentProduct.brand_name || '-' }}</span>
              </div>
              <div class="detail-fact">
                <span class="detail-fact__label">{{ text.category }}</span>
                <span class="detail-fact__value">{{ getCategoryPath(currentProduct.category_id) }}</span>
              </div>
              <div class="detail-fact">
                <span class="detail-fact__label">{{ text.supplier }}</span>
                <span class="detail-fact__value">
                  {{ currentProduct.supplier_name || '-' }}
                  <template v-if="currentProduct.supplier_code">（{{ currentProduct.supplier_code }}）</template>
                </span>
              </div>
              <div class="detail-fact">
                <span class="detail-fact__label">{{ text.dimensionUnit }}</span>
                <span class="detail-fact__value">{{ currentProduct.dimension_unit_name || '-' }}</span>
              </div>
              <div class="detail-fact">
                <span class="detail-fact__label">{{ text.weight }}</span>
                <span class="detail-fact__value">
                  {{ formatOptional(currentProduct.weight) }}
                  <template v-if="currentProduct.weight_unit_name"> {{ currentProduct.weight_unit_name }}</template>
                </span>
              </div>
              <div class="detail-fact">
                <span class="detail-fact__label">{{ text.dimensions }}</span>
                <span class="detail-fact__value">{{ formatDimensionSummary(currentProduct) }}</span>
              </div>
              <div class="detail-fact detail-fact--full">
                <span class="detail-fact__label">{{ text.remark }}</span>
                <span class="detail-fact__value">{{ currentProduct.remark || '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section-card">
          <div class="detail-tab-nav" role="tablist" aria-label="产品详情内容切换">
            <button type="button" class="detail-tab-nav__item" :class="{ 'detail-tab-nav__item--active': activeTab === 'images' }" @click="activeTab = 'images'">
              {{ text.productImages || '产品图片' }}
            </button>
            <button type="button" class="detail-tab-nav__item" :class="{ 'detail-tab-nav__item--active': activeTab === 'packaging' }" @click="activeTab = 'packaging'">
              {{ text.packagingConfig }}
            </button>
            <button type="button" class="detail-tab-nav__item" :class="{ 'detail-tab-nav__item--active': activeTab === 'audit' }" @click="activeTab = 'audit'">
              {{ text.auditLogs }}
            </button>
            <button type="button" class="detail-tab-nav__item" :class="{ 'detail-tab-nav__item--active': activeTab === 'inventory' }" @click="activeTab = 'inventory'">
              {{ text.inventoryInfo }}
            </button>
          </div>

          <div v-if="activeTab === 'images'" class="detail-tab-panel">
            <div class="section-heading">
              <div class="section-heading__title">{{ text.productImages || '产品图片' }}</div>
              <div class="section-heading__hint">{{ text.productImagesHint || '显示主图和已上传的产品图片。' }}</div>
            </div>
            <div v-if="detailImageUrls.length" class="detail-scroll-panel">
              <div class="detail-gallery">
                <div
                  v-for="(url, index) in detailImageUrls"
                  :key="`${url}-${index}`"
                  class="detail-gallery__item"
                >
                  <el-image
                    :src="url"
                    :preview-src-list="detailImageUrls"
                    :initial-index="index"
                    fit="cover"
                    class="detail-gallery__image"
                  />
                </div>
              </div>
            </div>
            <el-empty v-else :description="text.noImage" />
          </div>

          <div v-else-if="activeTab === 'packaging'" class="detail-tab-panel detail-tab-panel--paged">
            <div class="section-heading">
              <div class="section-heading__title">{{ text.packagingConfig }}</div>
              <div class="section-heading__hint">{{ text.packagingConfigHint }}</div>
            </div>
            <div v-if="packagingItems.length" class="detail-table-panel detail-table-panel--packaging">
              <div class="detail-table-scroll">
                <el-table :data="pagedPackagingItems" border stripe>
                  <el-table-column :label="text.packagingName" min-width="220">
                    <template #default="{ row }">
                      <div class="group-cell">
                        <div class="group-line">
                          <span class="group-value">{{ row.packaging_item?.item_name || '-' }}</span>
                        </div>
                        <div class="group-line">
                          <span class="group-label">{{ text.code }}</span>
                          <span class="group-value group-muted">{{ row.packaging_item?.item_code || '-' }}</span>
                        </div>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column :label="text.specification" min-width="180">
                    <template #default="{ row }">
                      {{ row.packaging_item?.specification || '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column :label="text.consumptionQuantity" width="120">
                    <template #default="{ row }">
                      {{ row.quantity_per_unit }}
                    </template>
                  </el-table-column>
                  <el-table-column :label="text.unit" width="100">
                    <template #default="{ row }">
                      {{ row.packaging_item?.unit || '-' }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
            <div v-if="packagingItems.length > packagingPagination.page_size" class="audit-pagination">
              <el-pagination
                v-model:current-page="packagingPagination.page"
                :page-size="packagingPagination.page_size"
                :total="packagingItems.length"
                small
                layout="total, prev, pager, next"
              />
            </div>
            <el-empty v-else :description="text.noPackagingConfigured" />
          </div>

          <div v-else-if="activeTab === 'audit'" class="detail-tab-panel detail-tab-panel--audit">
            <div class="section-heading">
              <div class="section-heading__title">{{ text.auditLogs }}</div>
              <div class="section-heading__hint">{{ text.auditLogsHint }}</div>
            </div>
            <div class="detail-table-panel detail-table-panel--audit" v-loading="auditLoading">
              <div v-if="auditLogs.length" class="detail-table-scroll">
                <el-table :data="auditLogs" border stripe>
                  <el-table-column :label="text.time" width="180">
                    <template #default="{ row }">
                      {{ formatDateTime(row.created_at || row.gmt_create) }}
                    </template>
                  </el-table-column>
                  <el-table-column :label="text.operator" width="120">
                    <template #default="{ row }">
                      {{ row.username || row.user_id || text.systemOperator }}
                    </template>
                  </el-table-column>
                  <el-table-column :label="text.action" width="160">
                    <template #default="{ row }">
                      {{ getActionLabel(row.action) }}
                    </template>
                  </el-table-column>
                  <el-table-column :label="text.changes" min-width="360">
                    <template #default="{ row }">
                      <div class="audit-change-list">
                        <template v-if="getAuditChangeRows(row.changes).length">
                          <div
                            v-for="change in getAuditChangeRows(row.changes)"
                            :key="`${row.id}-${change.key}`"
                            class="audit-change-item"
                          >
                            <div class="audit-change-item__field">{{ change.key }}</div>
                            <div class="audit-change-item__values">
                              <span class="audit-change-item__before">{{ change.before }}</span>
                              <span class="audit-change-item__arrow">→</span>
                              <span class="audit-change-item__after">{{ change.after }}</span>
                            </div>
                          </div>
                        </template>
                        <div v-else class="audit-summary">{{ formatAuditChanges(row) || text.noChanges }}</div>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <el-empty v-else-if="!auditLoading" :description="text.noChanges" />
            </div>
            <div class="audit-pagination">
              <el-pagination
                v-model:current-page="auditPagination.page"
                v-model:page-size="auditPagination.page_size"
                :page-sizes="[5, 10, 20]"
                :total="auditPagination.total"
                small
                layout="total, sizes, prev, pager, next"
                @size-change="emit('audit-page-change')"
                @current-change="emit('audit-page-change')"
              />
            </div>
          </div>

          <div v-else class="detail-tab-panel">
            <div class="section-heading">
              <div class="section-heading__title">{{ text.inventoryInfo }}</div>
              <div class="section-heading__hint">库存放在详情底部独立查看，不干扰产品主档信息。</div>
            </div>
            <div class="inventory-metric-grid">
              <div class="inventory-metric-card">
                <div class="inventory-metric-card__label">{{ text.available }}</div>
                <div class="inventory-metric-card__value">{{ currentProduct.inventory_available ?? '-' }}</div>
              </div>
              <div class="inventory-metric-card">
                <div class="inventory-metric-card__label">{{ text.reserved }}</div>
                <div class="inventory-metric-card__value">{{ currentProduct.inventory_reserved ?? '-' }}</div>
              </div>
              <div class="inventory-metric-card">
                <div class="inventory-metric-card__label">{{ text.inbound }}</div>
                <div class="inventory-metric-card__value">{{ currentProduct.inventory_inbound ?? '-' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="detail-side">
        <div class="side-card">
          <div class="side-card__title">{{ text.productTimeline }}</div>
          <div class="side-card__subtitle">{{ text.productTimelineHint }}</div>
          <div class="side-metric-list">
            <div class="side-metric">
              <span class="side-metric__label">{{ text.createdAt }}</span>
              <span class="side-metric__value">{{ formatDateTime(currentProduct.gmt_create) }}</span>
            </div>
            <div class="side-metric">
              <span class="side-metric__label">{{ text.updatedAt }}</span>
              <span class="side-metric__value">{{ formatDateTime(currentProduct.gmt_modified) }}</span>
            </div>
            <div class="side-metric">
              <span class="side-metric__label">{{ text.image }}</span>
              <span class="side-metric__value">{{ currentProduct.image_url ? text.imageUploaded : text.imagePending }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  currentProduct: any
  text: Record<string, string>
  auditLogs: any[]
  auditLoading: boolean
  auditPagination: { page: number; page_size: number; total: number }
  packagingItems: any[]
  getFullImageUrl: (url: string) => string
  getStatusType: (status: string) => any
  getStatusLabel: (status: string) => string
  formatDateTime: (value?: string) => string
  formatOptional: (value?: string | number | null) => string
  formatDimensionSummary: (product: any) => string
  getCategoryPath: (id?: number) => string
  getActionLabel: (action?: string | null) => string
  formatAuditChanges: (row: any) => string
  formatAuditFieldValue: (key: string, value: unknown) => string
  getFieldLabel: (key: string) => string
  getChangePairs: (changes?: string | null) => Array<{ key: string; before: unknown; after: unknown }>
  getChangeRows: (changes?: string | null) => Array<{ key: string; before: string; after: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'audit-page-change': []
}>()

const activeTab = ref<'images' | 'inventory' | 'packaging' | 'audit'>('images')
const packagingPagination = reactive({
  page: 1,
  page_size: 10
})

const detailImageUrls = computed(() => {
  if (!props.currentProduct) {
    return []
  }
  const rawImages = Array.isArray(props.currentProduct.images) ? props.currentProduct.images : []
  const candidates = [
    props.currentProduct.image_url,
    ...rawImages
  ]
  const urls = candidates
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => props.getFullImageUrl(item))

  return Array.from(new Set(urls))
})

const pagedPackagingItems = computed(() => {
  const start = (packagingPagination.page - 1) * packagingPagination.page_size
  return props.packagingItems.slice(start, start + packagingPagination.page_size)
})

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      activeTab.value = 'images'
      packagingPagination.page = 1
    }
  }
)

watch(
  () => props.packagingItems.length,
  () => {
    const maxPage = Math.max(1, Math.ceil(props.packagingItems.length / packagingPagination.page_size))
    if (packagingPagination.page > maxPage) {
      packagingPagination.page = maxPage
    }
  }
)

const getAuditChangeRows = (changes?: string | null) => {
  const pairs = props.getChangePairs(changes)
  if (pairs.length === 0) {
    return props.getChangeRows(changes)
  }
  const getDisplayFieldLabel = (key: string) => {
    const localLabels: Record<string, string> = {
      seller_sku: '产品编码',
      asin: 'ASIN',
      fnsku: 'FNSKU',
      title: '标题',
      marketplace: '站点',
      supplier_id: '默认供应商',
      parent_id: '产品归组',
      combo_id: '组合关系',
      is_combo_main: '组合角色',
      brand_id: '品牌',
      category_id: '品类',
      dimension_unit_id: '尺寸单位',
      weight_unit_id: '重量单位',
      status: '销售状态',
      unit_cost: '默认供应商报价',
      weight: '重量',
      length: '长度',
      width: '宽度',
      height: '高度',
      image_url: '产品图片',
      remark: '备注'
    }
    return localLabels[key] || props.getFieldLabel(key)
  }
  const keys = new Set(pairs.map((pair) => pair.key))
  const shouldSkipDerivedField = (key: string) => {
    const derivedMap: Record<string, string> = {
      supplier_name: 'supplier_id',
      brand_name: 'brand_id',
      category_name: 'category_id',
      dimension_unit_name: 'dimension_unit_id',
      weight_unit_name: 'weight_unit_id',
      sales_status_name: 'status'
    }
    const baseField = derivedMap[key]
    return !!baseField && keys.has(baseField)
  }
  const shouldSkipField = (key: string) => {
    return ['updated_at', 'created_at', 'updated_by', 'created_by', 'id', 'reference_count', 'deletable', 'delete_block_reason', 'updated_by_name', 'inventory_available', 'inventory_reserved', 'inventory_inbound'].includes(key)
  }
  const formatProductDetailAuditValue = (key: string, value: unknown) => {
    if (key === 'combo_id') {
      return value === null || value === undefined || value === '' ? '未关联组合' : '已关联组合'
    }
    if (key === 'parent_id') {
      return value === null || value === undefined || value === '' ? '未挂载归组' : '已挂载归组'
    }
    if (key === 'is_combo_main') {
      return Number(value) === 1 || value === true || value === 'true' ? '主产品' : '非主产品'
    }
    if (key === 'unit_cost') {
      if (value === null || value === undefined || value === '') {
        return '空'
      }
      const amount = Number(value)
      if (Number.isNaN(amount)) {
        return props.formatAuditFieldValue(key, value)
      }
      return amount.toFixed(2)
    }
    return props.formatAuditFieldValue(key, value)
  }
  return pairs
    .filter((pair) => !shouldSkipField(pair.key))
    .filter((pair) => !shouldSkipDerivedField(pair.key))
    .map((pair) => ({
      key: getDisplayFieldLabel(pair.key),
      before: formatProductDetailAuditValue(pair.key, pair.before),
      after: formatProductDetailAuditValue(pair.key, pair.after)
    }))
}
</script>
