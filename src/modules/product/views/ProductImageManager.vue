<template>
  <div class="product-image-manager">
    <div class="page-header">
      <div class="page-header__content">
        <div class="page-header__title-row">
          <div class="page-title">{{ labels.title }}</div>
          <el-tag type="info" effect="plain" size="small">{{ labels.workbenchTag }}</el-tag>
        </div>
        <div class="page-meta">
          {{ productDetail?.seller_sku || '-' }}<template v-if="productDetail?.asin"> / {{ productDetail.asin }}</template>
        </div>
      </div>
      <div class="page-actions">
        <el-tag v-if="dirty" type="warning">{{ labels.dirty }}</el-tag>
        <el-button type="primary" :disabled="!dirty" @click="handleSave">
          {{ dirty ? labels.saveChanges : labels.save }}
        </el-button>
        <el-button @click="handleBack">{{ labels.back }}</el-button>
      </div>
    </div>

    <el-card shadow="never" class="workspace-card">
      <div class="layout">
        <div class="layout-main">
          <section class="section-card product-card">
            <div class="product-card__media">
              <el-image
                v-if="productDetail?.image_url"
                :src="productDetail.image_url"
                fit="cover"
                class="product-card__image"
              />
              <div v-else class="product-card__placeholder">{{ labels.noImage }}</div>
            </div>
            <div class="product-card__content">
              <div class="product-card__title">{{ productDetail?.title || '-' }}</div>
              <div class="product-card__meta-grid">
                <div class="meta-item">
                  <span class="meta-item__label">{{ labels.infoSku }}</span>
                  <span class="meta-item__value">{{ productDetail?.seller_sku || '-' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-item__label">{{ labels.infoAsin }}</span>
                  <span class="meta-item__value">{{ productDetail?.asin || '-' }}</span>
                </div>
                <div class="meta-item meta-item--full">
                  <span class="meta-item__label">{{ labels.infoTitle }}</span>
                  <span class="meta-item__value">{{ productDetail?.title || '-' }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="section-card">
            <div class="section-head">
              <div>
                <div class="section-title">{{ labels.boardTitle }}</div>
                <div class="section-subtitle">{{ labels.boardSubtitle }}</div>
              </div>
              <div class="section-head__actions">
                <div v-if="batchUploading || pendingUploadCount" class="upload-status">
                  {{ uploadStatusText }}
                </div>
                <el-upload
                  ref="batchUploadRef"
                  class="batch-upload"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handleBatchChange"
                  :on-exceed="handleBatchExceed"
                  :limit="maxSlots - imageList.length"
                  accept="image/*"
                  multiple
                >
                  <el-button type="primary">{{ labels.batchUpload }}</el-button>
                </el-upload>
              </div>
            </div>

            <div class="summary-grid summary-grid--compact">
              <div
                v-for="metric in summaryMetrics"
                :key="metric.label"
                class="summary-card summary-card--compact"
                data-testid="summary-metric"
              >
                <div class="summary-card__label">{{ metric.label }}</div>
                <div class="summary-card__value">{{ metric.value }}</div>
                <div class="summary-card__hint">{{ metric.hint }}</div>
              </div>
            </div>

            <div v-if="dirty" class="change-banner">
              <div class="change-banner__title">{{ labels.pendingChangesTitle }}</div>
              <div class="change-banner__content">
                <span>{{ labels.addedCount.replace('{count}', String(addedCount)) }}</span>
                <span>{{ labels.removedCount.replace('{count}', String(removedCount)) }}</span>
                <span>{{ primaryChanged ? labels.primaryChanged : labels.primaryUnchanged }}</span>
              </div>
            </div>

            <draggable
              v-model="imageList"
              class="image-grid"
              item-key="url"
              ghost-class="drag-ghost"
              chosen-class="drag-chosen"
              :animation="150"
            >
              <template #item="{ element, index }">
                <div class="image-slot image-slot--filled" data-testid="image-slot" :class="{ primary: index === 0 }">
                  <div class="image-slot__top">
                    <span class="slot-index">{{ index + 1 }}</span>
                    <span v-if="index === 0" class="badge">{{ labels.primary }}</span>
                  </div>
                  <el-image :src="element.url" fit="cover" class="image-preview" />
                  <div class="image-slot__actions">
                    <el-button text type="danger" class="delete" @click="removeImage(index)">
                      {{ labels.remove }}
                    </el-button>
                  </div>
                </div>
              </template>
              <template #footer>
                <div
                  v-for="slot in emptySlotIndexes"
                  :key="`empty-${slot}`"
                  class="image-slot image-slot--empty"
                  data-testid="image-slot"
                >
                  <div class="image-slot__top">
                    <span class="slot-index">{{ slot }}</span>
                  </div>
                  <el-upload
                    class="slot-upload"
                    :show-file-list="false"
                    :http-request="handleUpload"
                    :before-upload="beforeUpload"
                    accept="image/*"
                  >
                    <div class="empty-content">
                      <div class="empty-plus">+</div>
                      <div class="empty-text">{{ labels.singleUpload }}</div>
                    </div>
                  </el-upload>
                </div>
              </template>
            </draggable>
          </section>
        </div>

        <aside class="layout-aside">
          <section class="section-card aside-card">
            <div class="section-title">{{ labels.primaryPanelTitle }}</div>
            <div class="section-subtitle">{{ labels.primaryPanelSubtitle }}</div>
            <div class="primary-preview">
              <el-image
                v-if="primaryImageUrl"
                :src="primaryImageUrl"
                fit="cover"
                class="primary-preview__image"
              />
              <div v-else class="primary-preview__placeholder">{{ labels.noImage }}</div>
            </div>
            <div class="primary-preview__meta">
              <div class="aside-row">
                <span class="aside-row__label">{{ labels.metricPrimary }}</span>
                <span class="aside-row__value">{{ primaryStatusText }}</span>
              </div>
              <div class="aside-row">
                <span class="aside-row__label">{{ labels.count }}</span>
                <span class="aside-row__value">{{ labels.count.replace('{count}', String(imageList.length)) }}</span>
              </div>
            </div>
          </section>

          <section class="section-card aside-card">
            <div class="section-title">{{ labels.ruleTitle }}</div>
            <div class="rule-list">
              <div class="rule-item">{{ labels.dragHint }}</div>
              <div class="rule-item">{{ labels.limit }}</div>
              <div class="rule-item">{{ labels.ruleFill }}</div>
            </div>
          </section>
        </aside>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import draggable from 'vuedraggable'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadInstance } from 'element-plus'
import { getProductDetail } from '../api/products'
import { getProductImageList, saveProductImageOrder } from '../api/images'
import { uploadImage } from '@/modules/common/api/upload'
import { useI18nStore } from '@/modules/common/stores/i18nStore'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import type { ProductSummary } from '../types'

const route = useRoute()
const router = useRouter()
const productId = Number(route.params.id)
const i18nStore = useI18nStore()
const localeStore = useLocaleStore()

const t = (key: string) => i18nStore.t(key, localeStore.locale)
const tf = (key: string, zh: string, en: string) => {
  const value = t(key)
  return value === key ? (localeStore.isEnglish ? en : zh) : value
}

const labels = computed(() => ({
  title: t('product.images.title'),
  save: t('product.images.save'),
  back: t('product.images.back'),
  upload: t('product.images.upload'),
  limit: t('product.images.limit'),
  infoSku: t('product.list.sellerSku'),
  infoTitle: t('product.list.title'),
  infoAsin: t('product.list.asin'),
  noImage: t('product.list.noImage'),
  primary: t('product.images.primary'),
  remove: t('product.images.remove'),
  dirty: t('product.images.dirty'),
  batchUpload: t('product.images.batchUpload'),
  singleUpload: t('product.images.singleUpload'),
  dragHint: t('product.images.dragHint'),
  count: t('product.images.count'),
  leaveConfirm: t('product.images.leaveConfirm'),
  warning: t('product.images.warning'),
  boardTitle: tf('product.images.boardTitle', '图片编排', 'Image Board'),
  boardSubtitle: tf('product.images.boardSubtitle', '拖拽排序，首图会作为产品主图展示。', 'Drag to reorder. The first image is used as the primary image.'),
  metricTotal: tf('product.images.metricTotal', '已上传', 'Uploaded'),
  metricRemaining: tf('product.images.metricRemaining', '剩余槽位', 'Remaining Slots'),
  metricPrimary: tf('product.images.metricPrimary', '当前主图', 'Primary Image'),
  metricTotalHint: tf('product.images.metricTotalHint', '当前已占用图片位', 'Current occupied image slots'),
  metricRemainingHint: tf('product.images.metricRemainingHint', '还可以继续上传', 'Available upload capacity'),
  metricPrimaryHint: tf('product.images.metricPrimaryHint', '首图会同步到产品主图', 'The first image syncs as the product primary'),
  primaryReady: tf('product.images.primaryReady', '已设置', 'Configured'),
  primaryEmpty: tf('product.images.primaryEmpty', '未设置', 'Not Set'),
  primaryPanelTitle: tf('product.images.primaryPanelTitle', '主图预览', 'Primary Preview'),
  primaryPanelSubtitle: tf('product.images.primaryPanelSubtitle', '右侧用于快速核对首图和图片状态。', 'Use this panel to verify the primary image and image status.'),
  ruleTitle: tf('product.images.ruleTitle', '上传规则', 'Upload Rules'),
  ruleFill: tf('product.images.ruleFill', '建议优先补齐前排图片槽位，避免主图顺序混乱。', 'Fill the front slots first to keep the primary order clear.'),
  metricChanges: tf('product.images.metricChanges', '待保存变更', 'Pending Changes'),
  metricChangesHint: tf('product.images.metricChangesHint', '图片增删或顺序变化后需要保存。', 'Save after images are added, removed, or reordered.'),
  pendingChangesTitle: tf('product.images.pendingChangesTitle', '待保存变更', 'Pending Changes'),
  addedCount: tf('product.images.addedCount', '新增 {count} 张', 'Added {count}'),
  removedCount: tf('product.images.removedCount', '移除 {count} 张', 'Removed {count}'),
  primaryChanged: tf('product.images.primaryChanged', '主图顺序已变化', 'Primary image changed'),
  primaryUnchanged: tf('product.images.primaryUnchanged', '主图未变化', 'Primary image unchanged'),
  uploadProcessing: tf('product.images.uploadProcessing', '批量上传处理中', 'Uploading'),
  uploadQueued: tf('product.images.uploadQueued', '待处理 {count} 张', 'Queued {count}'),
  saveChanges: tf('product.images.saveChanges', '保存变更', 'Save Changes'),
  workbenchTag: tf('product.images.workbenchTag', '工作台', 'Workbench')
}))

const imageList = ref<{ url: string }[]>([])
const originalUrls = ref<string[]>([])
const productDetail = ref<ProductSummary | null>(null)
const maxSlots = 10
const batchUploadRef = ref<UploadInstance>()
const batchQueue = ref<UploadFile[]>([])
const batchUploading = ref(false)
const batchProcessed = new Set<number>()

const emptySlotIndexes = computed(() => {
  const remaining = maxSlots - imageList.value.length
  return Array.from({ length: Math.max(remaining, 0) }, (_, idx) => imageList.value.length + idx + 1)
})

const dirty = computed(() => {
  const current = imageList.value.map((item) => item.url)
  return JSON.stringify(current) !== JSON.stringify(originalUrls.value)
})
const pendingUploadCount = computed(() => batchQueue.value.length)
const addedCount = computed(() => imageList.value.filter((item) => !originalUrls.value.includes(item.url)).length)
const removedCount = computed(() => originalUrls.value.filter((url) => !imageList.value.some((item) => item.url === url)).length)
const primaryChanged = computed(() => (originalUrls.value[0] || '') !== (imageList.value[0]?.url || ''))

const primaryImageUrl = computed(() => imageList.value[0]?.url || '')
const primaryStatusText = computed(() => (primaryImageUrl.value ? labels.value.primaryReady : labels.value.primaryEmpty))
const uploadStatusText = computed(() => {
  if (batchUploading.value) {
    return `${labels.value.uploadProcessing} · ${labels.value.uploadQueued.replace('{count}', String(pendingUploadCount.value))}`
  }
  if (pendingUploadCount.value > 0) {
    return labels.value.uploadQueued.replace('{count}', String(pendingUploadCount.value))
  }
  return ''
})
const summaryMetrics = computed(() => [
  {
    label: labels.value.metricTotal,
    value: String(imageList.value.length),
    hint: labels.value.metricTotalHint
  },
  {
    label: labels.value.metricRemaining,
    value: String(maxSlots - imageList.value.length),
    hint: labels.value.metricRemainingHint
  },
  {
    label: labels.value.metricPrimary,
    value: primaryStatusText.value,
    hint: labels.value.metricPrimaryHint
  },
  {
    label: labels.value.metricChanges,
    value: dirty.value ? String(addedCount.value + removedCount.value + (primaryChanged.value ? 1 : 0)) : '0',
    hint: labels.value.metricChangesHint
  }
])

const loadImages = async () => {
  const res = await getProductImageList(productId)
  const urls = res.data || []
  imageList.value = urls.map((url) => ({ url }))
  originalUrls.value = [...urls]
}

const loadProductDetail = async () => {
  const res = await getProductDetail(productId)
  productDetail.value = res.data || null
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 <= 10
  if (!isImage) {
    ElMessage.error(labels.value.limit)
    return false
  }
  if (!isLt10M) {
    ElMessage.error(labels.value.limit)
    return false
  }
  if (imageList.value.length >= maxSlots) {
    ElMessage.error(labels.value.count.replace('{count}', String(maxSlots)))
    return false
  }
  return true
}

const handleBatchExceed = () => {
  ElMessage.error(labels.value.count.replace('{count}', String(maxSlots)))
}

const processBatchQueue = async () => {
  if (batchUploading.value) return
  batchUploading.value = true
  try {
    while (batchQueue.value.length > 0) {
      if (imageList.value.length >= maxSlots) {
        ElMessage.error(labels.value.count.replace('{count}', String(maxSlots)))
        batchQueue.value = []
        break
      }
      const next = batchQueue.value.shift()
      const raw = next?.raw
      if (!raw) continue
      if (!beforeUpload(raw)) continue
      const res = await uploadImage(raw, 'products')
      if (res.data?.url) {
        imageList.value.push({ url: res.data.url })
      }
    }
  } finally {
    batchUploading.value = false
    batchUploadRef.value?.clearFiles()
    batchProcessed.clear()
  }
}

const handleBatchChange = (file: UploadFile) => {
  if (!file.raw) return
  if (batchProcessed.has(file.uid)) return
  batchProcessed.add(file.uid)
  batchQueue.value.push(file)
  void processBatchQueue()
}

const handleUpload = async (options: any) => {
  const { file } = options
  try {
    const res = await uploadImage(file, 'products')
    if (res.data?.url) {
      imageList.value.push({ url: res.data.url })
      options?.onSuccess?.(res.data, file)
    } else {
      options?.onError?.(new Error('Upload failed'))
    }
  } catch (error) {
    options?.onError?.(error)
  }
}

const removeImage = (index: number) => {
  imageList.value.splice(index, 1)
}

const handleSave = async () => {
  const urls = imageList.value.map((item) => item.url)
  const res = await saveProductImageOrder(productId, urls)
  const saved = res.data || []
  imageList.value = saved.map((url) => ({ url }))
  originalUrls.value = [...saved]
  ElMessage.success(localeStore.isEnglish ? 'Saved' : '保存成功')
}

const handleBack = () => {
  router.push({ name: 'product-skus' })
}

onBeforeRouteLeave(async () => {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm(labels.value.leaveConfirm, labels.value.warning, {
      type: 'warning'
    })
    return true
  } catch {
    return false
  }
})

onMounted(() => {
  void loadImages()
  void loadProductDetail()
})
</script>

<style scoped>
@import "../styles/workbench.css";

.product-image-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: start;
}

.layout-main,
.layout-aside {
  display: grid;
  gap: 16px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-head__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.section-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

.product-card {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 16px;
}

.product-card__media {
  width: 120px;
  height: 120px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-card__image {
  width: 100%;
  height: 100%;
}

.product-card__placeholder {
  font-size: 12px;
  color: #909399;
}

.product-card__content {
  display: grid;
  gap: 12px;
  align-content: center;
}

.product-card__title {
  font-size: 18px;
  line-height: 1.5;
  font-weight: 600;
  color: #303133;
}

.product-card__meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  display: grid;
  gap: 4px;
}

.meta-item--full {
  grid-column: 1 / -1;
}

.meta-item__label {
  font-size: 12px;
  color: #909399;
}

.meta-item__value {
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #ebeef5;
}

.summary-card__label {
  font-size: 12px;
  color: #909399;
}

.summary-card__value {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.summary-card__hint {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

.change-banner {
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid #f3d19e;
  border-radius: 10px;
  background: #fff8eb;
}

.change-banner__title {
  font-size: 13px;
  font-weight: 600;
  color: #b45309;
}

.change-banner__content {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #92400e;
}

.upload-status {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(100px, 1fr));
  gap: 12px;
}

.image-slot {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  aspect-ratio: 1 / 1;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-slot.primary {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.image-slot--empty {
  border-style: dashed;
  background: #fafafa;
}

.image-slot__top {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
}

.image-slot__actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 2;
}

.image-preview {
  width: 100%;
  height: 100%;
}

.badge {
  background: #409eff;
  color: #fff;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.slot-index {
  font-size: 12px;
  color: #606266;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  padding: 2px 8px;
}

.delete {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
}

.slot-upload {
  width: 100%;
  height: 100%;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-plus {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #eef5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.empty-text {
  font-size: 13px;
  color: #606266;
}

.aside-card {
  display: grid;
  gap: 12px;
}

.primary-preview {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary-preview__image {
  width: 100%;
  height: 100%;
}

.primary-preview__placeholder {
  font-size: 12px;
  color: #909399;
}

.primary-preview__meta {
  display: grid;
  gap: 10px;
}

.aside-row {
  display: grid;
  gap: 4px;
}

.aside-row__label {
  font-size: 12px;
  color: #909399;
}

.aside-row__value {
  font-size: 14px;
  color: #303133;
}

.rule-list {
  display: grid;
  gap: 10px;
}

.rule-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #ebeef5;
  font-size: 13px;
  line-height: 1.7;
  color: #606266;
}

.drag-ghost {
  opacity: 0.5;
}

.drag-chosen {
  border-color: #409eff;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .image-grid {
    grid-template-columns: repeat(4, minmax(100px, 1fr));
  }
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .image-grid {
    grid-template-columns: repeat(3, minmax(100px, 1fr));
  }
}

@media (max-width: 700px) {
  .section-head,
  .product-card {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .page-actions {
    justify-content: flex-start;
  }

  .product-card {
    display: grid;
  }

  .product-card__meta-grid {
    grid-template-columns: 1fr;
  }

  .image-grid {
    grid-template-columns: repeat(2, minmax(100px, 1fr));
  }
}
</style>
