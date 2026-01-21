<template>
  <el-dialog v-model="visible" :title="labels.title" width="900px">
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item :label="labels.keyword">
        <el-input
          v-model="searchForm.keyword"
          :placeholder="labels.keywordPlaceholder"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item :label="labels.marketplace">
        <el-select v-model="searchForm.marketplace" clearable style="width: 140px">
          <el-option
            v-for="item in marketplaceOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
        <el-button @click="handleReset">{{ labels.reset }}</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="displayList"
      border
      stripe
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="seller_sku" :label="labels.sku" min-width="160" />
      <el-table-column :label="labels.titleCol" min-width="260">
        <template #default="{ row }">
          <div class="sku-title">{{ row.title || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="marketplace" :label="labels.marketplace" width="100" align="center" />
      <el-table-column :label="labels.combo" width="120" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.is_combo_main === 1" type="warning" size="small">
            {{ labels.comboMain }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="dialog-footer">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSearch"
        @current-change="handleSearch"
      />
      <div class="footer-actions">
        <el-button @click="handleCancel">{{ labels.cancel }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleConfirm">
          {{ labels.confirm }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getSkuList } from '@/modules/product/api'
import type { Sku } from '@/modules/product/types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { filterSelectableSkus } from '@/modules/procurement/utils/skuSelection'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', skus: Sku[]): void
}>()

const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Select SKU',
      keyword: 'Keyword',
      keywordPlaceholder: 'Search SKU/Title',
      marketplace: 'Marketplace',
      search: 'Search',
      reset: 'Reset',
      sku: 'SKU',
      titleCol: 'Title',
      combo: 'Combo',
      comboMain: 'Combo Main',
      cancel: 'Cancel',
      confirm: 'Confirm',
      selectWarning: 'Please select SKU'
    }
  }
  return {
    title: '选择SKU',
    keyword: '关键词',
    keywordPlaceholder: '搜索SKU/标题',
    marketplace: '站点',
    search: '搜索',
    reset: '重置',
    sku: 'SKU',
    titleCol: '标题',
    combo: '组合',
    comboMain: '组合主',
    cancel: '取消',
    confirm: '确认选择',
    selectWarning: '请选择SKU'
  }
})

const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const searchForm = reactive({
  keyword: '',
  marketplace: ''
})

const list = ref<Sku[]>([])
const selected = ref<Sku[]>([])
const loading = ref(false)
const submitting = ref(false)
const displayList = computed(() => filterSelectableSkus(list.value))

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const loadList = async () => {
  loading.value = true
  try {
    const res = await getSkuList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: searchForm.keyword || undefined,
      marketplace: searchForm.marketplace || undefined
    })
    if (res.data) {
      list.value = res.data.data
      pagination.total = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.marketplace = ''
  handleSearch()
}

const handleSelectionChange = (rows: Sku[]) => {
  selected.value = rows
}

const handleCancel = () => {
  visible.value = false
}

const handleConfirm = async () => {
  if (selected.value.length === 0) {
    ElMessage.warning(labels.value.selectWarning)
    return
  }
  submitting.value = true
  try {
    emit('confirm', selected.value)
    visible.value = false
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.modelValue,
  value => {
    if (value) {
      selected.value = []
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
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.sku-title {
  color: #606266;
}
</style>
