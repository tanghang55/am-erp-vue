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
              <el-icon class="action-icon" @click="handleSetPrimary(element)" v-if="index !== 0">
                <Star />
              </el-icon>
              <el-icon class="action-icon" @click="handleDelete(element, index)">
                <Delete />
              </el-icon>
            </div>
            <div class="primary-badge" v-if="index === 0">
              <el-icon><Star /></el-icon>
              {{ labels.primary }}
            </div>
          </div>
        </template>
      </draggable>

      <!-- 上传按钮 -->
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete, Star } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { uploadSkuImage, deleteSkuImage, setPrimarySkuImage } from '../api'
import type { Sku } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

interface Props {
  skuId: number
  modelValue?: string[]
  maxImages?: number
}

interface Emits {
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', sku: Sku): void
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

// 图片列表
const imageList = ref<string[]>([...(props.modelValue || [])])

// 同步props变化
watch(() => props.modelValue, (newVal) => {
  imageList.value = [...(newVal || [])]
}, { deep: true })

// 上传前验证
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

// 自定义上传
const handleUpload = async (options: any) => {
  const { file } = options

  try {
    const res = await uploadSkuImage(props.skuId, file)
    if (res.data) {
      imageList.value = res.data.images || []
      emit('update:modelValue', imageList.value)
      emit('change', res.data)
      ElMessage.success(labels.value.uploadSuccess)
    }
  } catch (error: any) {
    console.error('Upload failed:', error)
    ElMessage.error(error.message || labels.value.uploadFail)
  }
}

// 删除图片
const handleDelete = async (imageUrl: string, index: number) => {
  try {
    const res = await deleteSkuImage(props.skuId, imageUrl)
    if (res.data) {
      imageList.value = res.data.images || []
      emit('update:modelValue', imageList.value)
      emit('change', res.data)
      ElMessage.success(labels.value.deleteSuccess)
    }
  } catch (error: any) {
    console.error('Delete failed:', error)
    ElMessage.error(error.message || labels.value.deleteFail)
  }
}

// 设置主图
const handleSetPrimary = async (imageUrl: string) => {
  try {
    const res = await setPrimarySkuImage(props.skuId, imageUrl)
    if (res.data) {
      imageList.value = res.data.images || []
      emit('update:modelValue', imageList.value)
      emit('change', res.data)
      ElMessage.success(labels.value.primarySuccess)
    }
  } catch (error: any) {
    console.error('Set primary failed:', error)
    ElMessage.error(error.message || labels.value.primaryFail)
  }
}

// 拖拽结束
const handleDragEnd = async () => {
  // 拖拽后第一张图片即为主图
  if (imageList.value.length > 0) {
    await handleSetPrimary(imageList.value[0])
  }
}
</script>

<style scoped>
.product-image-upload {
  width: 100%;
}

.image-list {
  margin-bottom: 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  cursor: move;
  transition: all 0.3s;
}

.image-item.is-primary {
  border-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

.image-item:hover {
  border-color: #409eff;
}

.image-preview {
  width: 100%;
  height: 100%;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.action-icon {
  font-size: 20px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-icon:hover {
  transform: scale(1.2);
}

.primary-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #409eff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.image-uploader {
  width: 100%;
  aspect-ratio: 1;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-placeholder:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.upload-icon {
  font-size: 32px;
  color: #8c939d;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.image-tips {
  margin-top: 16px;
}
</style>
