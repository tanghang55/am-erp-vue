<template>
  <div class="product-image-upload">
    <div class="image-list">
      <draggable
        v-model="imageList"
        class="image-grid"
        item-key="url"
        @end="handleDragEnd"
      >
        <template #item="{ element, index }">
          <div class="image-item" :class="{ 'is-primary': index === 0 }">
            <el-image
              :src="element"
              fit="cover"
              class="image-preview"
              :preview-src-list="imageList"
              :initial-index="index"
            />
            <div class="image-overlay">
              <el-icon v-if="index !== 0" class="action-icon" @click="handleSetPrimary(element)">
                <Star />
              </el-icon>
              <el-icon class="action-icon" @click="handleDelete(element, index)">
                <Delete />
              </el-icon>
            </div>
            <div v-if="index === 0" class="primary-badge">
              <el-icon><Star /></el-icon>
              {{ labels.primary }}
            </div>
          </div>
        </template>
      </draggable>

      <el-upload
        v-if="imageList.length < maxImages"
        class="image-uploader"
        :http-request="handleUpload"
        :show-file-list="false"
        :before-upload="beforeUpload"
        accept="image/*"
      >
        <div class="upload-placeholder">
          <el-icon class="upload-icon"><Plus /></el-icon>
          <div class="upload-text">{{ labels.upload }}</div>
          <div class="upload-hint">{{ labels.maxImages.replace('{count}', String(maxImages)) }}</div>
        </div>
      </el-upload>
    </div>

    <div class="image-tips">
      <el-alert type="info" :closable="false">
        <template #title>
          <ul style="margin: 0; padding-left: 20px;">
            <li>{{ labels.tipFormats }}</li>
            <li>{{ labels.tipPrimary }}</li>
            <li>{{ labels.tipMax.replace('{count}', String(maxImages)) }}</li>
          </ul>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus, Star } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { deleteProductImage, setPrimaryProductImage, uploadProductImage } from '../api/images'

interface Props {
  productId: number
  modelValue?: string[]
  maxImages?: number
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', images: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxImages: 10
})

const emit = defineEmits<Emits>()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      primary: 'Primary',
      upload: 'Upload Images',
      maxImages: 'Up to {count} images',
      tipFormats: 'Supports jpg, jpeg, png, gif, webp. Max 5MB per image.',
      tipPrimary: 'The first image is primary. Drag to reorder or click the star to set primary.',
      tipMax: 'Up to {count} images.',
      onlyImage: 'Only image files are allowed.',
      sizeLimit: 'Image size must be under 5MB.',
      uploadSuccess: 'Image uploaded.',
      uploadFail: 'Upload failed.',
      deleteSuccess: 'Image deleted.',
      deleteFail: 'Delete failed.',
      primarySuccess: 'Primary image set.',
      primaryFail: 'Failed to set primary image.'
    }
  }
  return {
    primary: '主图',
    upload: '上传图片',
    maxImages: '最多{count}张',
    tipFormats: '支持jpg、jpeg、png、gif、webp格式，单张图片不超过5MB',
    tipPrimary: '第一张图片为主图，可拖拽调整顺序或点击星标设置主图',
    tipMax: '最多上传{count}张图片',
    onlyImage: '只能上传图片文件!',
    sizeLimit: '图片大小不能超过5MB!',
    uploadSuccess: '图片上传成功',
    uploadFail: '图片上传失败',
    deleteSuccess: '图片删除成功',
    deleteFail: '图片删除失败',
    primarySuccess: '主图设置成功',
    primaryFail: '主图设置失败'
  }
})

const imageList = ref<string[]>([...(props.modelValue || [])])

watch(() => props.modelValue, (newVal) => {
  imageList.value = [...(newVal || [])]
}, { deep: true })

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error(labels.value.onlyImage)
    return false
  }
  if (!isLt5M) {
    ElMessage.error(labels.value.sizeLimit)
    return false
  }
  return true
}

const handleUpload = async (options: any) => {
  const { file } = options

  try {
    const res = await uploadProductImage(props.productId, file)
    const uploadedUrl = res.data?.url
    if (!uploadedUrl) {
      throw new Error(labels.value.uploadFail)
    }
    const nextImages = [...imageList.value, uploadedUrl]
    await setPrimaryProductImage(props.productId, nextImages)
    imageList.value = nextImages
    emit('update:modelValue', imageList.value)
    emit('change', imageList.value)
    ElMessage.success(labels.value.uploadSuccess)
  } catch (error: any) {
    console.error('Upload failed:', error)
    ElMessage.error(error.message || labels.value.uploadFail)
  }
}

const handleDelete = async (imageUrl: string, index: number) => {
  try {
    const nextImages = imageList.value.filter((_, currentIndex) => currentIndex !== index && imageList.value[currentIndex] !== imageUrl)
    await deleteProductImage(props.productId, nextImages)
    imageList.value = nextImages
    emit('update:modelValue', imageList.value)
    emit('change', imageList.value)
    ElMessage.success(labels.value.deleteSuccess)
  } catch (error: any) {
    console.error('Delete failed:', error)
    ElMessage.error(error.message || labels.value.deleteFail)
  }
}

const handleSetPrimary = async (imageUrl: string) => {
  try {
    const nextImages = [imageUrl, ...imageList.value.filter((item) => item !== imageUrl)]
    await setPrimaryProductImage(props.productId, nextImages)
    imageList.value = nextImages
    emit('update:modelValue', imageList.value)
    emit('change', imageList.value)
    ElMessage.success(labels.value.primarySuccess)
  } catch (error: any) {
    console.error('Set primary failed:', error)
    ElMessage.error(error.message || labels.value.primaryFail)
  }
}

const handleDragEnd = async () => {
  if (imageList.value.length > 0) {
    await handleSetPrimary(imageList.value[0])
  }
}
</script>

<style scoped>
.product-image-upload { width: 100%; }
.image-list { margin-bottom: 16px; }
.image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
.image-item { position: relative; width: 100%; aspect-ratio: 1; border: 2px solid #dcdfe6; border-radius: 6px; overflow: hidden; cursor: move; transition: all 0.3s; }
.image-item:hover { border-color: #409eff; }
.image-item.is-primary { border-color: #67c23a; }
.image-preview { width: 100%; height: 100%; }
.image-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(0, 0, 0, 0.45); opacity: 0; transition: opacity 0.2s; }
.image-item:hover .image-overlay { opacity: 1; }
.action-icon { display: inline-flex; padding: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.9); color: #0f172a; cursor: pointer; }
.primary-badge { position: absolute; top: 8px; left: 8px; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 999px; background: #67c23a; color: #fff; font-size: 12px; }
.image-uploader { border: 1px dashed #cbd5e1; border-radius: 8px; min-height: 120px; display: flex; align-items: center; justify-content: center; }
.upload-placeholder { display: grid; justify-items: center; gap: 8px; padding: 24px; color: #64748b; }
.upload-icon { font-size: 20px; }
.upload-text { font-size: 14px; color: #0f172a; }
.upload-hint { font-size: 12px; }
</style>
