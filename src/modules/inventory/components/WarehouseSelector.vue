<template>
  <el-select
    :model-value="modelValue"
    @update:model-value="handleChange"
    :placeholder="resolvedPlaceholder"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    filterable
    style="width: 100%"
  >
    <el-option
      v-for="warehouse in warehouses"
      :key="warehouse.id"
      :label="`[${warehouse.code}] ${warehouse.name}`"
      :value="warehouse.id"
      :disabled="warehouse.status !== 'ACTIVE' && !allowInactive"
    >
      <div style="display: flex; justify-content: space-between; align-items: center">
        <span>{{ warehouse.code }} - {{ warehouse.name }}</span>
        <el-tag
          v-if="warehouse.status !== 'ACTIVE'"
          size="small"
          type="warning"
        >
          {{ statusLabels[warehouse.status] || warehouse.status }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getActiveWarehouses, getWarehouseList } from '../api'
import type { Warehouse } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

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

const warehouses = ref<Warehouse[]>([])
const loading = ref(false)
const localeStore = useLocaleStore()

const resolvedPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  return localeStore.isEnglish ? 'Select warehouse' : '请选择仓库'
})

const statusLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      ACTIVE: 'Active',
      INACTIVE: 'Inactive',
      CLOSED: 'Closed'
    }
  }
  return {
    ACTIVE: '启用',
    INACTIVE: '停用',
    CLOSED: '关闭'
  }
})

// 加载仓库列表
const loadWarehouses = async () => {
  loading.value = true
  try {
    if (props.onlyActive) {
      // 只加载激活状态的仓库
      const res = await getActiveWarehouses()
      if (res.data) {
        warehouses.value = res.data
      }
    } else {
      // 加载所有仓库
      const res = await getWarehouseList({
        page: 1,
        page_size: 1000  // 获取所有仓库
      })
      if (res.data) {
        warehouses.value = res.data.data
      }
    }
  } catch (error) {
    console.error('Failed to load warehouses:', error)
  } finally {
    loading.value = false
  }
}

// 处理选择变化
const handleChange = (value: number | null) => {
  emit('update:modelValue', value)

  // 找到对应的仓库对象并触发 change 事件
  const warehouse = warehouses.value.find(w => w.id === value) || null
  emit('change', warehouse)
}

onMounted(() => {
  loadWarehouses()
})

// 暴露方法供父组件调用
defineExpose({
  refresh: loadWarehouses
})
</script>
