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
    <ProductPickerDialog
      v-model="dialogVisible"
      :title="title"
      :multiple="false"
      :show-inventory-columns="false"
      :product-params="productParams"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { getProductDetail } from '../api/products'
import type { ProductSummary, ProductListParams } from '../types'
import ProductPickerDialog from './ProductPickerDialog.vue'

interface Props {
  modelValue?: number | null
  placeholder?: string
  title?: string
  clearable?: boolean
  disabled?: boolean
  productParams?: Partial<ProductListParams>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '',
  title: '',
  clearable: true,
  disabled: false,
  productParams: () => ({})
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [product: ProductSummary | null]
}>()

const localeStore = useLocaleStore()
const dialogVisible = ref(false)
const selectedProduct = ref<ProductSummary | null>(null)

const resolvedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  return localeStore.isEnglish ? 'Select product' : '请选择产品'
})

const actionLabels = computed(() => ({
  choose: localeStore.isEnglish ? 'Choose' : '选择',
  clear: localeStore.isEnglish ? 'Clear' : '清空'
}))

const displayValue = computed(() => {
  if (!selectedProduct.value) return ''
  const sellerSku = selectedProduct.value.seller_sku || String(selectedProduct.value.id)
  return `[${sellerSku}] ${selectedProduct.value.title || '-'}`
})

const loadSelectedProduct = async (id: number | null | undefined) => {
  if (!id) {
    selectedProduct.value = null
    return
  }
  if (selectedProduct.value?.id === id) {
    return
  }
  const res = await getProductDetail(id)
  if (res.success) {
    selectedProduct.value = res.data
  }
}

const openDialog = () => {
  if (props.disabled) return
  dialogVisible.value = true
}

const clearSelection = () => {
  selectedProduct.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleConfirm = (products: ProductSummary[]) => {
  const product = products[0]
  if (!product) return
  selectedProduct.value = product
  emit('update:modelValue', product.id)
  emit('change', product)
}

watch(
  () => props.modelValue,
  value => {
    void loadSelectedProduct(value)
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
