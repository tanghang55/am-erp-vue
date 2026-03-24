<template>
  <el-dialog v-model="visible" :title="title" width="980px" destroy-on-close>
    <div class="picker-toolbar">
      <el-form :model="filters" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="组合编号 / 产品编码 / 标题"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="销售状态">
          <el-select v-model="filters.statuses" multiple collapse-tags collapse-tags-tooltip clearable style="width: 220px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="list" v-loading="loading" border height="420" highlight-current-row @row-dblclick="handleRowDoubleClick">
      <el-table-column width="70" align="center">
        <template #default="{ row }">
          <el-radio :model-value="selectedCombo?.combo_id === row.combo_id" :label="true" @change="() => handleRowSelect(row)">
            <span />
          </el-radio>
        </template>
      </el-table-column>
      <el-table-column label="组合产品" min-width="360">
        <template #default="{ row }">
          <div class="combo-main-cell">
            <el-image class="combo-main-cell__image" :src="row.main_product?.image_url || ''" fit="cover">
              <template #error>
                <div class="combo-main-cell__image-empty">无图</div>
              </template>
            </el-image>
            <div class="combo-main-cell__content">
              <div class="combo-main-cell__sku">{{ row.main_product?.seller_sku || '-' }}</div>
              <div class="combo-main-cell__title">{{ row.main_product?.title || '-' }}</div>
              <div class="combo-main-cell__meta">组合号 {{ row.combo_id }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="子产品数" width="100" align="center">
        <template #default="{ row }">{{ row.products?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="销售状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.main_product?.status)" size="small">
            {{ getStatusLabel(row.main_product?.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="结构摘要" min-width="260">
        <template #default="{ row }">
          <div class="structure-summary">
            <span v-for="child in (row.products || []).slice(0, 3)" :key="child.id" class="structure-pill">
              {{ child.seller_sku }} ×{{ child.qty_ratio }}
            </span>
            <span v-if="(row.products || []).length > 3" class="structure-pill structure-pill--muted">
              +{{ (row.products || []).length - 3 }} 个子产品
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.locked ? 'danger' : 'success'">
            {{ row.locked ? '已锁定' : '可维护' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div class="picker-footer">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadList"
        @current-change="loadList"
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!selectedCombo" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { getProductComboList } from '@/modules/product/api'
import type { ProductCombo } from '@/modules/product/types'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  statuses?: import('@/modules/product/types').ProductSalesStatus[]
}>(), {
  title: '选择组合产品',
  statuses: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [combo: ProductCombo]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const filters = reactive({
  keyword: '',
  statuses: [] as string[]
})

const pagination = reactive({
  page: 1,
  page_size: 10,
  total: 0
})

const loading = ref(false)
const list = ref<ProductCombo[]>([])
const selectedCombo = ref<ProductCombo | null>(null)
const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'ON_SALE', label: '正常销售' },
  { value: 'REPLENISHING', label: '补货中' },
  { value: 'OFF_SHELF', label: '下架' }
]

const getStatusLabel = (status?: string) => statusOptions.find((item) => item.value === status)?.label || status || '-'

const statusTagType = (status?: string) => {
  const map: Record<string, string> = {
    DRAFT: 'info',
    ON_SALE: 'success',
    REPLENISHING: 'warning',
    OFF_SHELF: 'danger'
  }
  return map[status || ''] || 'info'
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await getProductComboList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: filters.keyword || undefined,
      statuses: filters.statuses.length ? filters.statuses : undefined
    })
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
  void loadList()
}

const handleReset = () => {
  filters.keyword = ''
  filters.statuses = [...props.statuses]
  pagination.page = 1
  void loadList()
}

const handleRowSelect = (row: ProductCombo) => {
  selectedCombo.value = row
}

const handleRowDoubleClick = (row: ProductCombo) => {
  selectedCombo.value = row
  handleConfirm()
}

const handleConfirm = () => {
  if (!selectedCombo.value) return
  emit('confirm', selectedCombo.value)
  visible.value = false
}

watch(
  () => visible.value,
  (open) => {
    if (!open) return
    filters.keyword = ''
    filters.statuses = [...props.statuses]
    selectedCombo.value = null
    pagination.page = 1
    void loadList()
  }
)
</script>

<style scoped>
.picker-toolbar {
  margin-bottom: 16px;
}

.combo-main-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.combo-main-cell__image {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.combo-main-cell__image-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 12px;
}

.combo-main-cell__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.combo-main-cell__sku {
  color: #111827;
  font-weight: 600;
}

.combo-main-cell__title,
.combo-main-cell__meta {
  color: #6b7280;
  font-size: 13px;
}

.structure-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.structure-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
}

.structure-pill--muted {
  color: #6b7280;
}

.picker-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
