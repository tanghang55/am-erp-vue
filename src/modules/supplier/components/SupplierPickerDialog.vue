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
          <el-option :label="labels.statusDisabled" value="DISABLED" />
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
      <el-table-column prop="supplier_code" :label="labels.code" width="150" />
      <el-table-column prop="name" :label="labels.name" min-width="220" />
      <el-table-column :label="labels.type" min-width="180">
        <template #default="{ row }">
          <div class="tag-list">
            <el-tag v-for="item in row.types || []" :key="item" size="small" type="info">
              {{ item }}
            </el-tag>
            <span v-if="!(row.types || []).length">-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="labels.status" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'warning'">
            {{ row.status === 'ACTIVE' ? labels.statusActive : labels.statusDisabled }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" :label="labels.remark" min-width="200" show-overflow-tooltip />
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
import { getSupplierList } from '@/modules/supplier/api'
import type { Supplier, SupplierListParams, SupplierType } from '@/modules/supplier/types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  type?: SupplierType | string
  onlyActive?: boolean
  allowInactive?: boolean
}>(), {
  title: '',
  type: '',
  onlyActive: true,
  allowInactive: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', supplier: Supplier): void
}>()

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Select Supplier',
      keyword: 'Keyword',
      keywordPlaceholder: 'Search code or name',
      status: 'Status',
      statusActive: 'Active',
      statusDisabled: 'Disabled',
      search: 'Search',
      reset: 'Reset',
      select: 'Select',
      code: 'Code',
      name: 'Name',
      type: 'Type',
      remark: 'Remark',
      cancel: 'Cancel',
      selectDisabled: 'Disabled supplier cannot be selected'
    }
  }
  return {
    title: '选择供应商',
    keyword: '关键词',
    keywordPlaceholder: '搜索供应商编码或名称',
    status: '状态',
    statusActive: '启用',
    statusDisabled: '停用',
    search: '搜索',
    reset: '重置',
    select: '选择',
    code: '编码',
    name: '名称',
    type: '类型',
    remark: '备注',
    cancel: '取消',
    selectDisabled: '停用供应商不可选择'
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

const list = ref<Supplier[]>([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

const isSelectable = (row: Supplier) => props.allowInactive || row.status === 'ACTIVE'

const loadList = async () => {
  loading.value = true
  try {
    const params: SupplierListParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      status: props.onlyActive ? 'ACTIVE' : searchForm.status || undefined,
      type: props.type || undefined
    }
    const res = await getSupplierList(params)
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

const handleSelect = (row: Supplier) => {
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

.tag-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>
