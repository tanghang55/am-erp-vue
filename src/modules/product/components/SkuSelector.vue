<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="handleChange"
    :placeholder="placeholder"
    filterable
    remote
    :remote-method="handleSearch"
    :loading="loading"
    clearable
    style="width: 100%"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="`${item.seller_sku} - ${item.title}`"
      :value="item.id"
    >
      <div style="display: flex; flex-direction: column">
        <span style="font-weight: 600">{{ item.seller_sku }}</span>
        <span style="font-size: 12px; color: #909399">{{ item.title }}</span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getSkuList } from '../api'
import type { Sku } from '../types'

interface Props {
  modelValue?: number | null
  placeholder?: string
}

interface Emits {
  (e: 'update:modelValue', value: number | null): void
  (e: 'change', value: number | null): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '请选择SKU'
})

const emit = defineEmits<Emits>()

const options = ref<Sku[]>([])
const loading = ref(false)

const handleSearch = async (query: string) => {
  if (query === '') {
    loadOptions()
    return
  }

  loading.value = true
  try {
    const res = await getSkuList({
      page: 1,
      page_size: 20,
      keyword: query,
      exclude_combo_child: true
    })

    if (res.data) {
      options.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to search SKU:', error)
  } finally {
    loading.value = false
  }
}

const loadOptions = async () => {
  loading.value = true
  try {
    const res = await getSkuList({
      page: 1,
      page_size: 20,
      exclude_combo_child: true
    })

    if (res.data) {
      options.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to load SKU options:', error)
  } finally {
    loading.value = false
  }
}

const handleChange = (value: number | null) => {
  emit('update:modelValue', value)
  emit('change', value)
}

onMounted(() => {
  loadOptions()
})
</script>
