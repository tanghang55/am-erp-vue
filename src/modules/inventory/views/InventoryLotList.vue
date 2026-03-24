<template>
  <div class="inventory-lot-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">{{ labels.title }}</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item :label="labels.warehouse">
          <warehouse-selector
            v-model="searchForm.warehouse_id"
            :placeholder="labels.allWarehouses"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item :label="labels.product">
          <ProductSelector
            v-model="searchForm.product_id"
            :placeholder="labels.productPlaceholder"
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item :label="labels.status">
          <el-select v-model="searchForm.status" clearable :placeholder="labels.all" style="width: 140px">
            <el-option :label="labels.open" value="OPEN" />
            <el-option :label="labels.closed" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item :label="labels.keyword">
          <el-input
            v-model="searchForm.keyword"
            :placeholder="labels.keywordPlaceholder"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">{{ labels.search }}</el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" border stripe size="small">
        <el-table-column prop="lot_no" :label="labels.lotNo" width="220" show-overflow-tooltip />
        <el-table-column :label="labels.productInfo" min-width="200">
          <template #default="{ row }">
            <div v-if="row.product">
              <div style="font-weight: bold">{{ row.product.seller_sku }}</div>
              <div style="font-size: 12px; color: #606266">{{ row.product.title }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.warehouse" width="180">
          <template #default="{ row }">
            <div v-if="row.warehouse">
              <div style="font-weight: bold">{{ row.warehouse.name || '-' }}</div>
              <div v-if="row.warehouse.code" style="font-size: 12px; color: #909399">{{ row.warehouse.code }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="labels.source" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div>{{ row.source_type || '-' }}</div>
            <div style="font-size: 12px; color: #909399">{{ row.source_number || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="received_at" :label="labels.receivedAt" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.received_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="qty_in" :label="labels.qtyIn" width="90" align="center" />
        <el-table-column prop="qty_available" :label="labels.available" width="90" align="center" />
        <el-table-column prop="qty_reserved" :label="labels.reserved" width="90" align="center" />
        <el-table-column prop="qty_consumed" :label="labels.consumed" width="90" align="center" />
        <el-table-column :label="labels.status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'OPEN' ? 'success' : 'info'">
              {{ row.status === 'OPEN' ? labels.open : labels.closed }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSearch"
        @current-change="handleSearch"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getInventoryLotList } from '../api'
import type { InventoryLot, InventoryLotListParams } from '../types'
import WarehouseSelector from '../components/WarehouseSelector.vue'
import ProductSelector from '@/modules/product/components/ProductSelector.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const localeStore = useLocaleStore()
const route = useRoute()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Inventory Lots',
      warehouse: 'Warehouse',
      allWarehouses: 'All Warehouses',
      product: 'Product',
      productPlaceholder: 'Select product',
      status: 'Status',
      keyword: 'Keyword',
      keywordPlaceholder: 'Lot No / Source No / Product Code / Title',
      all: 'All',
      open: 'Open',
      closed: 'Closed',
      search: 'Search',
      reset: 'Reset',
      lotNo: 'Lot No',
      productInfo: 'Product Info',
      source: 'Source',
      receivedAt: 'Received At',
      qtyIn: 'In',
      available: 'Available',
      reserved: 'Reserved',
      consumed: 'Consumed'
    }
  }
  return {
    title: '库存批次',
    warehouse: '仓库',
    allWarehouses: '全部仓库',
    product: '产品',
    productPlaceholder: '选择产品',
    status: '状态',
    keyword: '关键词',
    keywordPlaceholder: '批次号 / 来源单号 / 产品编码 / 标题',
    all: '全部',
    open: '开放',
    closed: '已关闭',
    search: '搜索',
    reset: '重置',
    lotNo: '批次号',
    productInfo: '产品信息',
    source: '来源',
    receivedAt: '入库时间',
    qtyIn: '入库',
    available: '可用',
    reserved: '锁定',
    consumed: '消耗'
  }
})

const loading = ref(false)
const list = ref<InventoryLot[]>([])

const searchForm = reactive<InventoryLotListParams>({
  product_id: undefined,
  warehouse_id: undefined,
  status: undefined,
  keyword: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const loadList = async () => {
  loading.value = true
  try {
    const normalizedProductID = searchForm.product_id ? Number(searchForm.product_id) : undefined
    const res = await getInventoryLotList({
      page: pagination.page,
      page_size: pagination.page_size,
      product_id: normalizedProductID && normalizedProductID > 0 ? normalizedProductID : undefined,
      warehouse_id: searchForm.warehouse_id,
      status: searchForm.status,
      keyword: searchForm.keyword || undefined
    })
    list.value = res.data.data || []
    pagination.total = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadList()
}

const handleReset = () => {
  searchForm.warehouse_id = undefined
  searchForm.product_id = undefined
  searchForm.status = undefined
  searchForm.keyword = ''
  handleSearch()
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

onMounted(() => {
  const queryProductID = Number(route.query.product_id)
  if (!Number.isNaN(queryProductID) && queryProductID > 0) {
    searchForm.product_id = queryProductID
  }
  const queryWarehouseID = Number(route.query.warehouse_id)
  if (!Number.isNaN(queryWarehouseID) && queryWarehouseID > 0) {
    searchForm.warehouse_id = queryWarehouseID
  }
  loadList()
})
</script>

<style scoped>
.inventory-lot-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.search-form {
  margin-bottom: 16px;
}
</style>
