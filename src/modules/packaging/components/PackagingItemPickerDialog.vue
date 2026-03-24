<template>
  <el-dialog v-model="visible" :title="title" width="960px" destroy-on-close>
    <div class="picker-toolbar">
      <el-form :model="filters" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="包材编码 / 名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" value="ACTIVE" />
            <el-option v-if="allowInactive" label="停用" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="list" v-loading="loading" border height="420" @row-dblclick="handleRowDoubleClick">
      <el-table-column width="54" align="center">
        <template #default="{ row }">
          <el-radio :model-value="selectedId === row.id" :label="true" @change="() => handleRowSelect(row)">
            <span />
          </el-radio>
        </template>
      </el-table-column>
      <el-table-column label="包材" min-width="260">
        <template #default="{ row }">
          <div class="item-cell">
            <div class="item-name">{{ row.item_name }}</div>
            <div class="item-code">{{ row.item_code }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="120">
        <template #default="{ row }">
          {{ getPackagingCategoryLabel(row.category) }}
        </template>
      </el-table-column>
      <el-table-column label="库存" width="120" align="right">
        <template #default="{ row }">
          {{ Number(row.quantity_on_hand || 0).toFixed(2) }} {{ row.unit || '' }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
            {{ getPackagingStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="picker-footer">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadList"
        @current-change="loadList"
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!selectedItem" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { getPackagingItemList } from '@/modules/packaging/api'
import type { PackagingItem, PackagingItemQueryParams } from '@/modules/packaging/types'
import { getPackagingCategoryLabel, getPackagingStatusLabel } from '@/modules/packaging/types'
import { parsePaginatedResponse } from '@/utils/api'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  allowInactive?: boolean
}>(), {
  title: '选择包材',
  allowInactive: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [item: PackagingItem]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const loading = ref(false)
const list = ref<PackagingItem[]>([])
const selectedItem = ref<PackagingItem | null>(null)
const selectedId = computed(() => selectedItem.value?.id || 0)

const filters = reactive<PackagingItemQueryParams>({
  keyword: '',
  status: undefined
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const loadList = async () => {
  loading.value = true
  try {
    const response = await getPackagingItemList({
      ...filters,
      status: filters.status || (props.allowInactive ? undefined : 'ACTIVE'),
      page: pagination.page,
      page_size: pagination.page_size
    })
    const { items, total } = parsePaginatedResponse(response)
    list.value = items
    pagination.total = total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  void loadList()
}

const handleReset = () => {
  filters.keyword = ''
  filters.status = undefined
  pagination.page = 1
  void loadList()
}

const handleRowSelect = (row: PackagingItem) => {
  selectedItem.value = row
}

const handleRowDoubleClick = (row: PackagingItem) => {
  selectedItem.value = row
  handleConfirm()
}

const handleConfirm = () => {
  if (!selectedItem.value) return
  emit('confirm', selectedItem.value)
  visible.value = false
}

watch(
  () => visible.value,
  (open) => {
    if (!open) return
    selectedItem.value = null
    pagination.page = 1
    void loadList()
  }
)
</script>

<style scoped>
.picker-toolbar {
  margin-bottom: 16px;
}

.picker-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.item-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  color: #111827;
  font-weight: 600;
}

.item-code {
  color: #6b7280;
  font-size: 12px;
}
</style>
