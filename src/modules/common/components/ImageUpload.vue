<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { uploadImage } from '../api/upload'
import { Plus, Delete } from '@element-plus/icons-vue'

interface Props {
  modelValue?: string
  subDir?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  subDir: 'products',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const imageUrl = ref(props.modelValue)
const uploading = ref(false)

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    imageUrl.value = newValue
  }
)

// Build full image URL
const getFullImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url}`
}

// Handle image upload
const handleUpload = async (file: File) => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('Only JPG, PNG, GIF, WEBP images are allowed')
    return false
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('Image size must be less than 5MB')
    return false
  }

  uploading.value = true
  const loading = ElLoading.service({
    lock: true,
    text: 'Uploading image...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    const response = await uploadImage(file, props.subDir)
    const uploadedUrl = response.data?.url
    if (!uploadedUrl) {
      throw new Error('Failed to upload image')
    }
    imageUrl.value = uploadedUrl
    emit('update:modelValue', uploadedUrl)
    ElMessage.success('Image uploaded successfully')
    return true
  } catch (error: any) {
    ElMessage.error(error.message || 'Failed to upload image')
    return false
  } finally {
    uploading.value = false
    loading.close()
  }
}

// Handle before upload
const beforeUpload = (file: File) => {
  return handleUpload(file)
}

// Handle image remove
const handleRemove = () => {
  imageUrl.value = ''
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="image-upload">
    <el-upload
      class="image-uploader"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :disabled="disabled || uploading"
      accept="image/jpeg,image/png,image/gif,image/webp"
    >
      <div v-if="imageUrl" class="image-preview">
        <img :src="getFullImageUrl(imageUrl)" alt="Preview" />
        <div class="image-overlay">
          <el-button
            v-if="!disabled"
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click.stop="handleRemove"
          />
        </div>
      </div>
      <div v-else class="upload-placeholder">
        <el-icon :class="{ 'is-loading': uploading }">
          <Plus />
        </el-icon>
        <div class="upload-text">Upload Image</div>
      </div>
    </el-upload>
    <div class="upload-hint">Support JPG, PNG, GIF, WEBP (max 5MB)</div>
  </div>
</template>

<style scoped>
.image-upload {
  display: inline-block;
}

.image-uploader {
  width: 178px;
  height: 178px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.image-uploader:hover {
  border-color: var(--el-color-primary);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
}

.upload-placeholder .el-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.upload-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
