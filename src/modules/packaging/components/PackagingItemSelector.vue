<template>
  <div class="picker-field">
    <el-input
      :model-value="displayValue"
      :placeholder="resolvedPlaceholder"
      readonly
      :disabled="disabled"
      @click="openDialog"
    />
    <el-button type="primary" plain :disabled="disabled" @click="openDialog">选择</el-button>
    <el-button v-if="clearable && modelValue" :disabled="disabled" @click="clearSelection">清空</el-button>
    <PackagingItemPickerDialog
      v-model="dialogVisible"
      :title="title"
      :allow-inactive="allowInactive"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getPackagingItemById } from '@/modules/packaging/api'
import type { PackagingItem } from '@/modules/packaging/types'
import PackagingItemPickerDialog from './PackagingItemPickerDialog.vue'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  placeholder?: string
  title?: string
  clearable?: boolean
  disabled?: boolean
  allowInactive?: boolean
}>(), {
  modelValue: null,
  placeholder: '',
  title: '选择包材',
  clearable: true,
  disabled: false,
  allowInactive: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [item: PackagingItem | null]
}>()

const dialogVisible = ref(false)
const selectedItem = ref<PackagingItem | null>(null)

const resolvedPlaceholder = computed(() => props.placeholder || '请选择包材')

const displayValue = computed(() => {
  if (!selectedItem.value) return ''
  const name = selectedItem.value.item_name || ''
  const code = selectedItem.value.item_code || ''
  return name && code ? `${name} (${code})` : name || code
})

const loadSelectedItem = async (id: number | null | undefined) => {
  if (!id) {
    selectedItem.value = null
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  const res = await getPackagingItemById(id)
  if (res.success) {
    selectedItem.value = res.data
  }
}

const openDialog = () => {
  if (props.disabled) return
  dialogVisible.value = true
}

const clearSelection = () => {
  selectedItem.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleConfirm = (item: PackagingItem) => {
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

watch(
  () => props.modelValue,
  (value) => {
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
