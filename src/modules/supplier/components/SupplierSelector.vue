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
      {{ labels.choose }}
    </el-button>
    <el-button v-if="clearable && modelValue" :disabled="disabled" @click="clearSelection">
      {{ labels.clear }}
    </el-button>
    <SupplierPickerDialog
      v-model="dialogVisible"
      :title="title"
      :type="type"
      :only-active="onlyActive"
      :allow-inactive="allowInactive"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getSupplierDetail } from '@/modules/supplier/api'
import type { Supplier, SupplierType } from '@/modules/supplier/types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import SupplierPickerDialog from './SupplierPickerDialog.vue'

const props = withDefaults(defineProps<{
  modelValue?: number | null
  placeholder?: string
  title?: string
  clearable?: boolean
  disabled?: boolean
  type?: SupplierType | string
  onlyActive?: boolean
  allowInactive?: boolean
}>(), {
  modelValue: null,
  placeholder: '',
  title: '',
  clearable: true,
  disabled: false,
  type: '',
  onlyActive: true,
  allowInactive: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [supplier: Supplier | null]
}>()

const localeStore = useLocaleStore()
const dialogVisible = ref(false)
const selectedSupplier = ref<Supplier | null>(null)

const labels = computed(() => ({
  choose: localeStore.isEnglish ? 'Choose' : '选择',
  clear: localeStore.isEnglish ? 'Clear' : '清空'
}))

const resolvedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  return localeStore.isEnglish ? 'Select supplier' : '请选择供应商'
})

const displayValue = computed(() => {
  if (!selectedSupplier.value) return ''
  const code = selectedSupplier.value.supplier_code ? `[${selectedSupplier.value.supplier_code}] ` : ''
  return `${code}${selectedSupplier.value.name}`
})

const loadSelectedSupplier = async (id: number | null | undefined) => {
  if (!id) {
    selectedSupplier.value = null
    return
  }
  if (selectedSupplier.value?.id === id) {
    return
  }
  const res = await getSupplierDetail(id)
  if (res.success) {
    selectedSupplier.value = res.data
  }
}

const openDialog = () => {
  if (props.disabled) return
  dialogVisible.value = true
}

const clearSelection = () => {
  selectedSupplier.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleConfirm = (supplier: Supplier) => {
  selectedSupplier.value = supplier
  emit('update:modelValue', supplier.id)
  emit('change', supplier)
}

watch(
  () => props.modelValue,
  (value) => {
    void loadSelectedSupplier(value)
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
