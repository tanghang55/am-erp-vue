<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="980px">
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item :label="labels.keyword">
        <el-input
          v-model="searchForm.keyword"
          :placeholder="labels.keywordPlaceholder"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item v-if="!props.onlyActive" :label="labels.status">
        <el-select v-model="searchForm.status" clearable style="width: 140px">
          <el-option :label="labels.statusActive" value="ACTIVE" />
          <el-option :label="labels.statusInactive" value="INACTIVE" />
          <el-option :label="labels.statusClosed" value="CLOSED" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
        <el-button @click="handleReset">{{ labels.reset }}</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="list"
      border
      stripe
      v-loading="loading"
      highlight-current-row
      row-key="id"
      @row-dblclick="handleSelect"
    >
      <el-table-column :label="labels.select" width="90" align="center">
        <template #default="{ row }">
          <el-button link type="primary" :disabled="!isSelectable(row)" @click="handleSelect(row)">
            {{ labels.select }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="code" :label="labels.code" width="140" />
      <el-table-column prop="name" :label="labels.name" min-width="220" />
      <el-table-column prop="type" :label="labels.type" width="140" />
      <el-table-column prop="country" :label="labels.country" width="120" />
      <el-table-column :label="labels.status" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="address" :label="labels.address" min-width="220" show-overflow-tooltip />
    </el-table>

    <div class="dialog-footer">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSearch"
        @current-change="handlePageChange"
      />
      <div class="footer-actions">
        <el-button @click="visible = false">{{ labels.cancel }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getWarehouseList } from '@/modules/inventory/api'
import type { Warehouse, WarehouseListParams } from '@/modules/inventory/types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  onlyActive?: boolean
  allowInactive?: boolean
}>(), {
  title: '',
  onlyActive: true,
  allowInactive: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', warehouse: Warehouse): void
}>()

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Select Warehouse',
      keyword: 'Keyword',
      keywordPlaceholder: 'Search warehouse code or name',
      status: 'Status',
      statusActive: 'Active',
      statusInactive: 'Inactive',
      statusClosed: 'Closed',
      search: 'Search',
      reset: 'Reset',
      select: 'Select',
      code: 'Code',
      name: 'Name',
      type: 'Type',
      country: 'Country',
      address: 'Address',
      cancel: 'Cancel',
      selectDisabled: 'Inactive warehouse cannot be selected'
    }
  }
  return {
    title: '选择仓库',
    keyword: '关键词',
    keywordPlaceholder: '搜索仓库编码或名称',
    status: '状态',
    statusActive: '启用',
    statusInactive: '停用',
    statusClosed: '关闭',
    search: '搜索',
    reset: '重置',
    select: '选择',
    code: '编码',
    name: '名称',
    type: '类型',
    country: '国家',
    address: '地址',
    cancel: '取消',
    selectDisabled: '非启用仓库不可选择'
  }
})

const dialogTitle = computed(() => props.title || labels.value.title)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const searchForm = reactive({
  keyword: '',
  status: props.onlyActive ? 'ACTIVE' : ''
})

const list = ref<Warehouse[]>([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

const statusTagType = (status: Warehouse['status']) => {
  if (status === 'ACTIVE') return 'success'
  if (status === 'INACTIVE') return 'warning'
  return 'info'
}

const statusLabel = (status: Warehouse['status']) => {
  if (status === 'ACTIVE') return labels.value.statusActive
  if (status === 'INACTIVE') return labels.value.statusInactive
  return labels.value.statusClosed
}

const isSelectable = (row: Warehouse) => props.allowInactive || row.status === 'ACTIVE'

const loadList = async () => {
  loading.value = true
  try {
    const params: WarehouseListParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      status: props.onlyActive ? 'ACTIVE' : searchForm.status || undefined
    }
    const res = await getWarehouseList(params)
    if (res.success) {
      list.value = res.data?.data || []
      pagination.total = res.data?.total || 0
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadList()
}

const handlePageChange = () => {
  loadList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = props.onlyActive ? 'ACTIVE' : ''
  handleSearch()
}

const handleSelect = (row: Warehouse) => {
  if (!isSelectable(row)) {
    ElMessage.warning(labels.value.selectDisabled)
    return
  }
  emit('confirm', row)
  visible.value = false
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      loadList()
    }
  }
)
</script>

<style scoped>
.search-form {
  margin-bottom: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.footer-actions {
  display: flex;
  gap: 8px;
}
</style>
