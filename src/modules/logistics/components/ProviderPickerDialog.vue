<template>
  <el-dialog v-model="visible" :title="title" width="960px" destroy-on-close>
    <div class="picker-toolbar">
      <el-form :model="filters" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="供应商编号 / 名称"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.provider_type" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="(config, key) in PROVIDER_TYPE_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
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
      <el-table-column prop="provider_code" label="编号" width="150" />
      <el-table-column prop="provider_name" label="供应商名称" min-width="220" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          {{ PROVIDER_TYPE_CONFIG[row.provider_type]?.label || row.provider_type }}
        </template>
      </el-table-column>
      <el-table-column prop="contact_person" label="联系人" width="120" />
      <el-table-column prop="contact_phone" label="联系电话" width="140" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
            {{ row.status === 'ACTIVE' ? '启用' : '停用' }}
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
      <el-button type="primary" :disabled="!selectedProvider" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { getProviders } from '@/modules/logistics/api'
import type { LogisticsProvider, ProviderListParams } from '@/modules/logistics/types'
import { PROVIDER_TYPE_CONFIG } from '@/modules/logistics/types'
import { parsePaginatedResponse } from '@/utils/api'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  allowInactive?: boolean
}>(), {
  title: '选择物流供应商',
  allowInactive: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [provider: LogisticsProvider]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const loading = ref(false)
const list = ref<LogisticsProvider[]>([])
const selectedProvider = ref<LogisticsProvider | null>(null)
const selectedId = computed(() => selectedProvider.value?.id || 0)

const filters = reactive<ProviderListParams>({
  keyword: '',
  provider_type: undefined,
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
    const response = await getProviders({
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
  filters.provider_type = undefined
  filters.status = undefined
  pagination.page = 1
  void loadList()
}

const handleRowSelect = (row: LogisticsProvider) => {
  selectedProvider.value = row
}

const handleRowDoubleClick = (row: LogisticsProvider) => {
  selectedProvider.value = row
  handleConfirm()
}

const handleConfirm = () => {
  if (!selectedProvider.value) return
  emit('confirm', selectedProvider.value)
  visible.value = false
}

watch(
  () => visible.value,
  (open) => {
    if (!open) return
    selectedProvider.value = null
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
</style>
