<template>
  <div class="picker-field">
    <el-input
      :model-value="displayValue"
      :placeholder="resolvedPlaceholder"
      readonly
      :disabled="disabled"
      @click="openDialog"
    />
    <el-button type="primary" plain :disabled="disabled" @click="openDialog">
      {{ actionLabels.choose }}
    </el-button>
    <el-button v-if="clearable && modelValue" :disabled="disabled" @click="clearSelection">
      {{ actionLabels.clear }}
    </el-button>
    <WarehousePickerDialog
      v-model="dialogVisible"
      :only-active="onlyActive"
      :allow-inactive="allowInactive"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getWarehouseDetail } from '../api'
import type { Warehouse } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import WarehousePickerDialog from './WarehousePickerDialog.vue'

interface Props {
  modelValue?: number | null
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  allowInactive?: boolean  // 是否允许选择非激活状态的仓库
  onlyActive?: boolean     // 是否只显示激活状态的仓库
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '',
  clearable: true,
  disabled: false,
  allowInactive: false,
  onlyActive: true
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [warehouse: Warehouse | null]
}>()

const localeStore = useLocaleStore()
const dialogVisible = ref(false)
const selectedWarehouse = ref<Warehouse | null>(null)

const resolvedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  return localeStore.isEnglish ? 'Select warehouse' : '请选择仓库'
})

const actionLabels = computed(() => ({
  choose: localeStore.isEnglish ? 'Choose' : '选择',
  clear: localeStore.isEnglish ? 'Clear' : '清空'
}))

const displayValue = computed(() => {
  if (!selectedWarehouse.value) return ''
  if (selectedWarehouse.value.name && selectedWarehouse.value.code) {
    return `${selectedWarehouse.value.name} (${selectedWarehouse.value.code})`
  }
  return selectedWarehouse.value.name || selectedWarehouse.value.code || ''
})

const loadSelectedWarehouse = async (id: number | null | undefined) => {
  if (!id) {
    selectedWarehouse.value = null
    return
  }
  if (selectedWarehouse.value?.id === id) {
    return
  }
  const res = await getWarehouseDetail(id)
  if (res.success) {
    selectedWarehouse.value = res.data
  }
}

const openDialog = () => {
  if (props.disabled) return
  dialogVisible.value = true
}

const clearSelection = () => {
  selectedWarehouse.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleConfirm = (warehouse: Warehouse) => {
  selectedWarehouse.value = warehouse
  emit('update:modelValue', warehouse.id)
  emit('change', warehouse)
}

watch(
  () => props.modelValue,
  (value) => {
    void loadSelectedWarehouse(value)
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
