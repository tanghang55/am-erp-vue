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
    <ComboPickerDialog
      v-model="dialogVisible"
      :title="title"
      :statuses="statuses"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { getProductComboDetail } from '@/modules/product/api'
import type { ProductCombo } from '@/modules/product/types'
import ComboPickerDialog from './ComboPickerDialog.vue'

interface Props {
  modelValue?: number | null
  placeholder?: string
  title?: string
  clearable?: boolean
  disabled?: boolean
  statuses?: import('@/modules/product/types').ProductSalesStatus[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '',
  title: '',
  clearable: true,
  disabled: false,
  statuses: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [combo: ProductCombo | null]
}>()

const localeStore = useLocaleStore()
const dialogVisible = ref(false)
const selectedCombo = ref<ProductCombo | null>(null)

const resolvedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  return localeStore.isEnglish ? 'Select combo product' : '请选择组合产品'
})

const actionLabels = computed(() => ({
  choose: localeStore.isEnglish ? 'Choose' : '选择',
  clear: localeStore.isEnglish ? 'Clear' : '清空'
}))

const displayValue = computed(() => {
  if (!selectedCombo.value) return ''
  const sellerSku = selectedCombo.value.main_product?.seller_sku || String(selectedCombo.value.combo_id)
  const title = selectedCombo.value.main_product?.title || '-'
  return `[${sellerSku}] ${title}`
})

const loadSelectedCombo = async (id: number | null | undefined) => {
  if (!id) {
    selectedCombo.value = null
    return
  }
  if (selectedCombo.value?.combo_id === id) {
    return
  }
  const res = await getProductComboDetail(id)
  if (res.success) {
    selectedCombo.value = res.data
  }
}

const openDialog = () => {
  if (props.disabled) return
  dialogVisible.value = true
}

const clearSelection = () => {
  selectedCombo.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleConfirm = (combo: ProductCombo) => {
  selectedCombo.value = combo
  emit('update:modelValue', combo.combo_id)
  emit('change', combo)
}

watch(
  () => props.modelValue,
  value => {
    void loadSelectedCombo(value)
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
