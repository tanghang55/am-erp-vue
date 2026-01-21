<template>
  <div class="product-image-manager">
    <el-card>
      <template #header>
        <div class="header">
          <div>
            <h3>{{ labels.title }}</h3>
            <div class="meta">SKU ID: {{ skuId }}</div>
          </div>
          <div class="actions">
            <el-tag v-if="dirty" type="warning">{{ labels.dirty }}</el-tag>
            <el-button type="primary" :disabled="!dirty" @click="handleSave">
              {{ labels.save }}
            </el-button>
            <el-button @click="handleBack">{{ labels.back }}</el-button>
          </div>
        </div>
      </template>

      <div class="content">
        <div class="summary">
          <div class="summary-media">
            <el-image
              v-if="skuDetail?.image_url"
              :src="skuDetail.image_url"
              fit="cover"
              class="summary-image"
            />
            <div v-else class="summary-placeholder">{{ labels.noImage }}</div>
          </div>
          <div class="summary-info">
            <div class="summary-row">
              <span class="summary-label">{{ labels.infoSku }}</span>
              <span class="summary-value">{{ skuDetail?.seller_sku || '-' }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">{{ labels.infoTitle }}</span>
              <span class="summary-value summary-title">{{ skuDetail?.title || '-' }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">{{ labels.infoAsin }}</span>
              <span class="summary-value">{{ skuDetail?.asin || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="toolbar">
          <div class="toolbar-left">
            <span class="count">{{ labels.count.replace('{count}', String(imageList.length)) }}</span>
            <span class="hint">{{ labels.dragHint }}</span>
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

        <draggable
          v-model="imageList"
          class="image-grid"
          item-key="url"
          ghost-class="drag-ghost"
          chosen-class="drag-chosen"
          :animation="150"
        >
          <template #item="{ element, index }">
            <div class="image-slot filled" data-testid="image-slot" :class="{ primary: index === 0 }">
              <div class="slot-index">{{ index + 1 }}</div>
              <el-image :src="element.url" fit="cover" class="image-preview" />
              <span v-if="index === 0" class="badge">{{ labels.primary }}</span>
              <el-button text type="danger" class="delete" @click="removeImage(index)">
                {{ labels.remove }}
              </el-button>
            </div>
          </template>
          <template #footer>
            <div
              v-for="slot in emptySlotIndexes"
              :key="`empty-${slot}`"
              class="image-slot empty"
              data-testid="image-slot"
            >
              <div class="slot-index">{{ slot }}</div>
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
import { getSkuDetail, getSkuImageList, saveSkuImageOrder } from '../api'
import { uploadImage } from '@/modules/common/api/upload'
import { useI18nStore } from '@/modules/common/stores/i18nStore'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import type { Sku } from '../types'

const route = useRoute()
const router = useRouter()
const skuId = Number(route.params.id)
const i18nStore = useI18nStore()
const localeStore = useLocaleStore()

const t = (key: string) => i18nStore.t(key, localeStore.locale)

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
  warning: t('product.images.warning')
}))

const imageList = ref<{ url: string }[]>([])
const originalUrls = ref<string[]>([])
const skuDetail = ref<Sku | null>(null)
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

const loadImages = async () => {
  const res = await getSkuImageList(skuId)
  const urls = res.data || []
  imageList.value = urls.map((url) => ({ url }))
  originalUrls.value = [...urls]
}

const loadSkuDetail = async () => {
  const res = await getSkuDetail(skuId)
  skuDetail.value = res.data || null
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
  const res = await saveSkuImageOrder(skuId, urls)
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
  void loadSkuDetail()
})
</script>

<style scoped>
.product-image-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header h3 {
  margin: 0;
}

.meta {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content {
  display: grid;
  gap: 16px;
}

.summary {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.summary-media {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-image {
  width: 100%;
  height: 100%;
}

.summary-placeholder {
  font-size: 12px;
  color: #909399;
}

.summary-info {
  display: grid;
  gap: 10px;
  align-content: center;
}

.summary-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px;
  align-items: center;
}

.summary-label {
  font-size: 12px;
  color: #909399;
}

.summary-value {
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}

.summary-title {
  font-weight: 600;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count {
  font-size: 13px;
  color: #606266;
}

.hint {
  font-size: 12px;
  color: #909399;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(100px, 1fr));
  gap: 12px;
}

.image-slot {
  position: relative;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
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
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.2);
}

.image-slot.empty {
  border-style: dashed;
  background: #fafafa;
}

.image-preview {
  width: 100%;
  height: 100%;
}

.badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #409eff;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.slot-index {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 12px;
  color: #909399;
}

.delete {
  position: absolute;
  right: 6px;
  bottom: 6px;
}

.slot-upload {
  width: 100%;
  height: 100%;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.empty-plus {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eef5ff;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.empty-text {
  font-size: 14px;
  color: #606266;
}

.drag-ghost {
  opacity: 0.5;
}

.drag-chosen {
  border-color: #409eff;
}

@media (max-width: 1200px) {
  .image-grid {
    grid-template-columns: repeat(4, minmax(100px, 1fr));
  }
}

@media (max-width: 900px) {
  .image-grid {
    grid-template-columns: repeat(3, minmax(100px, 1fr));
  }
}

@media (max-width: 700px) {
  .image-grid {
    grid-template-columns: repeat(2, minmax(100px, 1fr));
  }
}
</style>
