<template>
  <div class="picker-field">
    <el-input
      :model-value="displayValue"
      :placeholder="placeholder"
      readonly
      :disabled="disabled"
      @click="openDialog"
    />
    <el-button type="primary" plain :disabled="disabled" @click="openDialog">
      选择
    </el-button>
    <el-button v-if="clearable && modelValue" :disabled="disabled" @click="clearSelection">
      清空
    </el-button>
    <ProductConfigPickerDialog
      v-model="dialogVisible"
      :title="title"
      :config-type="configType"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getProductConfigList } from '../api/configs'
import type { ProductConfigItem, ProductConfigType } from '../types'
import ProductConfigPickerDialog from './ProductConfigPickerDialog.vue'

interface Props {
  modelValue?: number | null
  configType: ProductConfigType
  title: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '',
  clearable: true,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  change: [item: ProductConfigItem | null]
}>()

const dialogVisible = ref(false)
const currentItem = ref<ProductConfigItem | null>(null)

const displayValue = computed(() => {
  if (!currentItem.value) return ''
  return `${currentItem.value.item_name}（${currentItem.value.item_code}）`
})

const loadSelectedItem = async (id?: number | null) => {
  if (!id) {
    currentItem.value = null
    return
  }
  if (currentItem.value?.id === id) return
  const res = await getProductConfigList({
    page: 1,
    page_size: 500,
    config_type: props.configType
  })
  if (res.success) {
    const rows = Array.isArray(res.data?.data) ? res.data.data : []
    currentItem.value = rows.find((item) => item.id === id) || null
  }
}

const openDialog = () => {
  if (props.disabled) return
  dialogVisible.value = true
}

const clearSelection = () => {
  currentItem.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleConfirm = (item: ProductConfigItem) => {
  currentItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

watch(
  () => props.modelValue,
  value => {
    void loadSelectedItem(value)
  },
  { immediate: true }
)
</script>

<style scoped>
.picker-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px;
  width: 100%;
}
</style>
