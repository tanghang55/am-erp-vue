<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="900px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="picker-dialog">
      <div class="picker-dialog__toolbar">
        <el-form :inline="true">
          <el-form-item label="关键词">
            <el-input v-model="keyword" clearable placeholder="编码 / 名称" style="width: 260px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadItems">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="items"
        v-loading="loading"
        border
        stripe
        highlight-current-row
        @current-change="handleCurrentChange"
      >
        <el-table-column label="配置项" min-width="260">
          <template #default="{ row }">
            <div class="group-cell">
              <div class="group-line">
                <span class="group-value group-title">{{ row.item_name }}</span>
              </div>
              <div class="group-line">
                <span class="group-label">编码</span>
                <span class="group-value">{{ row.item_code }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small">
              {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" width="100" prop="sort" />
        <el-table-column label="备注" min-width="220">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :disabled="!currentItem" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getProductConfigList } from '../api/configs'
import type { ProductConfigItem, ProductConfigType } from '../types'

interface Props {
  modelValue: boolean
  title: string
  configType: ProductConfigType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [item: ProductConfigItem]
}>()

const loading = ref(false)
const keyword = ref('')
const items = ref<ProductConfigItem[]>([])
const currentItem = ref<ProductConfigItem | null>(null)

const loadItems = async () => {
  loading.value = true
  try {
    const res = await getProductConfigList({
      page: 1,
      page_size: 200,
      config_type: props.configType,
      keyword: keyword.value || undefined
    })
    if (res.success) {
      items.value = Array.isArray(res.data?.data) ? res.data.data : []
    }
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  keyword.value = ''
  loadItems()
}

const handleCurrentChange = (row?: ProductConfigItem) => {
  currentItem.value = row || null
}

const handleConfirm = () => {
  if (!currentItem.value) return
  emit('confirm', currentItem.value)
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  visible => {
    if (!visible) return
    currentItem.value = null
    void loadItems()
  }
)
</script>

<style scoped>
.picker-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.picker-dialog__toolbar {
  display: flex;
  justify-content: space-between;
}

.group-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-line {
  display: flex;
  gap: 8px;
  align-items: center;
}

.group-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.group-value {
  color: var(--el-text-color-regular);
}

.group-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
