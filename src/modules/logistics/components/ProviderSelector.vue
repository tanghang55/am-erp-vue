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
    <ProviderPickerDialog
      v-model="dialogVisible"
      :title="title"
      :allow-inactive="allowInactive"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getProvider } from '@/modules/logistics/api'
import type { LogisticsProvider } from '@/modules/logistics/types'
import ProviderPickerDialog from './ProviderPickerDialog.vue'

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
  title: '选择物流供应商',
  clearable: true,
  disabled: false,
  allowInactive: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [provider: LogisticsProvider | null]
}>()

const dialogVisible = ref(false)
const selectedProvider = ref<LogisticsProvider | null>(null)

const resolvedPlaceholder = computed(() => props.placeholder || '请选择物流供应商')

const displayValue = computed(() => {
  if (!selectedProvider.value) return ''
  const code = selectedProvider.value.provider_code ? `[${selectedProvider.value.provider_code}] ` : ''
  return `${code}${selectedProvider.value.provider_name}`
})

const loadSelectedProvider = async (id: number | null | undefined) => {
  if (!id) {
    selectedProvider.value = null
    return
  }
  if (selectedProvider.value?.id === id) {
    return
  }
  const res = await getProvider(id)
  if (res.success) {
    selectedProvider.value = res.data
  }
}

const openDialog = () => {
  if (props.disabled) return
  dialogVisible.value = true
}

const clearSelection = () => {
  selectedProvider.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleConfirm = (provider: LogisticsProvider) => {
  selectedProvider.value = provider
  emit('update:modelValue', provider.id)
  emit('change', provider)
}

watch(
  () => props.modelValue,
  (value) => {
    void loadSelectedProvider(value)
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
