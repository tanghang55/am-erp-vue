<template>
  <div class="replenishment-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>采购策略</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleCreateStrategy">新建策略</el-button>
            <el-button @click="handleReload">刷新</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="configForm" class="config-form">
        <el-form-item label="启用定时">
          <el-switch v-model="configForm.is_enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="间隔(分钟)">
          <el-input-number v-model="configForm.interval_minutes" :min="1" :max="10080" />
        </el-form-item>
        <el-form-item>
          <el-button type="success" :loading="savingConfig" @click="handleSaveConfig">保存配置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <el-table :data="strategies" v-loading="loadingStrategies" border stripe>
        <el-table-column label="策略" min-width="180">
          <template #default="{ row }">
            <div class="entity-cell">
              <div class="entity-cell__primary">{{ row.name || '-' }}</div>
              <div class="entity-cell__secondary">
                优先级 {{ row.priority || 0 }}<template v-if="row.marketplace"> · {{ row.marketplace }}</template>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="命中条件" min-width="240">
          <template #default="{ row }">
            <div class="condition-list">
              <div v-for="item in getStrategyConditionLines(row)" :key="item" class="condition-list__item">
                {{ item }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="覆盖规则" min-width="220">
          <template #default="{ row }">
            <div class="rule-list">
              <div class="rule-list__item">窗口 {{ row.demand_window_days }} 天</div>
              <div class="rule-list__item">采购周期 {{ row.procurement_cycle_days }} 天</div>
              <div class="rule-list__item">打包 {{ row.pack_days }} 天 · 物流 {{ row.logistics_days }} 天</div>
              <div class="rule-list__item">安全 {{ row.safety_days }} 天</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="采购规则" min-width="180">
          <template #default="{ row }">
            <div class="rule-list">
              <div class="rule-list__item">MOQ {{ row.moq }}</div>
              <div class="rule-list__item">采购倍数 {{ row.order_multiple }}</div>
              <div class="rule-list__item">零销量保底 {{ row.zero_sales_purchase_qty }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_enabled"
              :active-value="1"
              :inactive-value="0"
              :loading="switchLoadingMap[row.id] === true"
              @change="(value) => handleToggleStrategy(row, Number(value))"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditStrategy(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="strategyDialogVisible" :title="strategyDialogTitle" width="900px" destroy-on-close>
      <el-form :model="strategyForm" label-width="96px" class="dialog-form">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="策略名" required>
              <el-input v-model="strategyForm.name" placeholder="例如：A类产品快补策略" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级">
              <el-input-number v-model="strategyForm.priority" :min="1" :max="1000000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="启用">
              <el-switch v-model="strategyForm.is_enabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="产品">
              <el-select
                v-model="strategyForm.product_id"
                filterable
                clearable
                remote
                reserve-keyword
                :remote-method="searchProducts"
                :loading="loadingProductOptions"
                placeholder="可按产品编码/标题搜索"
                style="width: 100%"
                @focus="searchProducts('')"
              >
                <el-option
                  v-for="item in productOptions"
                  :key="item.id"
                  :label="`${item.seller_sku} / ${item.title}`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="仓库">
              <WarehouseSelector
                v-model="strategyForm.warehouse_id"
                placeholder="选择仓库"
                :only-active="true"
                :clearable="true"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="供应商">
              <SupplierSelector
                v-model="strategyForm.supplier_id"
                type="PRODUCT"
                placeholder="选择供应商"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="站点">
              <el-select v-model="strategyForm.marketplace" clearable placeholder="选择站点" style="width: 100%">
                <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="窗口">
              <el-input-number v-model="strategyForm.demand_window_days" :min="1" :max="365" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="采购周期">
              <el-input-number
                v-model="strategyForm.procurement_cycle_days"
                :min="0"
                :max="365"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="打包天数">
              <el-input-number v-model="strategyForm.pack_days" :min="0" :max="365" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="物流天数">
              <el-input-number v-model="strategyForm.logistics_days" :min="0" :max="365" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="安全天数">
              <el-input-number v-model="strategyForm.safety_days" :min="0" :max="365" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="MOQ">
              <el-input-number v-model="strategyForm.moq" :min="1" :max="1000000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="倍数">
              <el-input-number v-model="strategyForm.order_multiple" :min="1" :max="1000000" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="零销量保底">
              <el-input-number
                v-model="strategyForm.zero_sales_purchase_qty"
                :min="0"
                :max="1000000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="扩展条件JSON">
          <el-input
            v-model="strategyForm.condition_json"
            placeholder='例如: {"category":"A","brand":"XX"}'
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="strategyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingStrategy" @click="handleSaveStrategy">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getReplenishmentConfig,
  listReplenishmentStrategies,
  updateReplenishmentConfig,
  upsertReplenishmentStrategy
} from '@/modules/procurement/api'
import type { ReplenishmentConfig, ReplenishmentStrategy } from '@/modules/procurement/types'
import { getProductList } from '@/modules/product/api'
import type { ProductSummary } from '@/modules/product/types'
import SupplierSelector from '@/modules/supplier/components/SupplierSelector.vue'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'

const loadingStrategies = ref(false)
const savingConfig = ref(false)
const savingStrategy = ref(false)
const loadingProductOptions = ref(false)
const strategyDialogVisible = ref(false)
const switchLoadingMap = reactive<Record<number, boolean>>({})

const configForm = reactive<ReplenishmentConfig>({
  id: 0,
  is_enabled: 1,
  interval_minutes: 1440,
  demand_window_days: 30,
  default_lead_time_days: 15,
  default_safety_days: 7,
  default_moq: 1,
  default_order_multiple: 1
})

const strategyForm = reactive({
  id: 0,
  name: '',
  priority: 100,
  is_enabled: 1,
  product_id: undefined as number | undefined,
  warehouse_id: undefined as number | undefined,
  supplier_id: undefined as number | undefined,
  marketplace: undefined as string | undefined,
  condition_json: '',
  demand_window_days: 30,
  procurement_cycle_days: 15,
  pack_days: 3,
  logistics_days: 7,
  safety_days: 7,
  zero_sales_purchase_qty: 0,
  moq: 1,
  order_multiple: 1
})

const strategies = ref<ReplenishmentStrategy[]>([])
const productOptions = ref<ProductSummary[]>([])

const marketplaceOptions = ['US', 'CA', 'AU', 'UK', 'DE', 'JP']

const strategyDialogTitle = computed(() => (strategyForm.id ? '编辑策略' : '新建策略'))

const fetchConfig = async () => {
  const res = await getReplenishmentConfig()
  Object.assign(configForm, res.data)
}

const fetchStrategies = async () => {
  loadingStrategies.value = true
  try {
    const res = await listReplenishmentStrategies({ page: 1, page_size: 200 })
    strategies.value = res.data.data || []
  } finally {
    loadingStrategies.value = false
  }
}

const searchProducts = async (keyword: string) => {
  loadingProductOptions.value = true
  try {
    const res = await getProductList({
      page: 1,
      page_size: 30,
      keyword: keyword || undefined
    })
    productOptions.value = res.data.data || []
  } finally {
    loadingProductOptions.value = false
  }
}

const handleSaveConfig = async () => {
  savingConfig.value = true
  try {
    await updateReplenishmentConfig({
      is_enabled: configForm.is_enabled,
      interval_minutes: configForm.interval_minutes
    })
    ElMessage.success('配置已保存')
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '保存配置失败'))
  } finally {
    savingConfig.value = false
  }
}

const handleCreateStrategy = () => {
  resetStrategyForm()
  strategyDialogVisible.value = true
}

const handleSaveStrategy = async () => {
  if (!strategyForm.name.trim()) {
    ElMessage.warning('请填写策略名')
    return
  }

  savingStrategy.value = true
  try {
    await upsertReplenishmentStrategy({
      id: strategyForm.id || undefined,
      name: strategyForm.name.trim(),
      priority: strategyForm.priority,
      is_enabled: strategyForm.is_enabled,
      product_id: strategyForm.product_id,
      warehouse_id: strategyForm.warehouse_id,
      supplier_id: strategyForm.supplier_id,
      marketplace: strategyForm.marketplace || undefined,
      condition_json: strategyForm.condition_json || undefined,
      demand_window_days: strategyForm.demand_window_days,
      procurement_cycle_days: strategyForm.procurement_cycle_days,
      pack_days: strategyForm.pack_days,
      logistics_days: strategyForm.logistics_days,
      safety_days: strategyForm.safety_days,
      zero_sales_purchase_qty: strategyForm.zero_sales_purchase_qty,
      moq: strategyForm.moq,
      order_multiple: strategyForm.order_multiple
    })
    ElMessage.success('策略已保存')
    strategyDialogVisible.value = false
    await fetchStrategies()
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '保存策略失败'))
  } finally {
    savingStrategy.value = false
  }
}

const handleToggleStrategy = async (row: ReplenishmentStrategy, nextEnabled: number) => {
  // `el-switch` updates `v-model` before emitting `change`, so `row.is_enabled`
  // is already the new value here. Infer previous value from binary toggle.
  const previousEnabled = nextEnabled === 1 ? 0 : 1
  switchLoadingMap[row.id] = true

  try {
    await upsertReplenishmentStrategy({
      id: row.id,
      name: row.name || `Strategy-${row.id}`,
      priority: row.priority || 100,
      is_enabled: nextEnabled,
      product_id: row.product_id,
      warehouse_id: row.warehouse_id,
      supplier_id: row.supplier_id,
      marketplace: row.marketplace || undefined,
      condition_json: row.condition_json || undefined,
      demand_window_days: row.demand_window_days || 30,
      procurement_cycle_days: row.procurement_cycle_days || 15,
      pack_days: row.pack_days || 0,
      logistics_days: row.logistics_days || 0,
      safety_days: row.safety_days || 7,
      zero_sales_purchase_qty: row.zero_sales_purchase_qty || 0,
      moq: row.moq || 1,
      order_multiple: row.order_multiple || 1,
      remark: row.remark
    })
    ElMessage.success(nextEnabled === 1 ? '策略已开启' : '策略已关闭')
    await fetchStrategies()
  } catch (error: unknown) {
    row.is_enabled = previousEnabled
    ElMessage.error(getErrorMessage(error, '更新策略状态失败'))
  } finally {
    switchLoadingMap[row.id] = false
  }
}

const handleEditStrategy = (row: ReplenishmentStrategy) => {
  strategyForm.id = row.id
  strategyForm.name = row.name || ''
  strategyForm.priority = row.priority || 100
  strategyForm.is_enabled = row.is_enabled ?? 1
  strategyForm.product_id = row.product_id
  strategyForm.warehouse_id = row.warehouse_id
  strategyForm.supplier_id = row.supplier_id
  strategyForm.marketplace = row.marketplace
  strategyForm.condition_json = row.condition_json || ''
  strategyForm.demand_window_days = row.demand_window_days || 30
  strategyForm.procurement_cycle_days = row.procurement_cycle_days || 15
  strategyForm.pack_days = row.pack_days || 3
  strategyForm.logistics_days = row.logistics_days || 7
  strategyForm.safety_days = row.safety_days || 7
  strategyForm.zero_sales_purchase_qty = row.zero_sales_purchase_qty || 0
  strategyForm.moq = row.moq || 1
  strategyForm.order_multiple = row.order_multiple || 1
  strategyDialogVisible.value = true
}

const resetStrategyForm = () => {
  strategyForm.id = 0
  strategyForm.name = ''
  strategyForm.priority = 100
  strategyForm.is_enabled = 1
  strategyForm.product_id = undefined
  strategyForm.warehouse_id = undefined
  strategyForm.supplier_id = undefined
  strategyForm.marketplace = undefined
  strategyForm.condition_json = ''
  strategyForm.demand_window_days = 30
  strategyForm.procurement_cycle_days = 15
  strategyForm.pack_days = 3
  strategyForm.logistics_days = 7
  strategyForm.safety_days = 7
  strategyForm.zero_sales_purchase_qty = 0
  strategyForm.moq = 1
  strategyForm.order_multiple = 1
}

const getStrategyConditionLines = (row: ReplenishmentStrategy) => {
  const parts: string[] = []
  if (row.seller_sku || row.product_title) {
    parts.push(`${row.seller_sku || '-'}${row.product_title ? ` · ${row.product_title}` : ''}`)
  }
  if (row.warehouse_name || row.warehouse_code) {
    parts.push(`仓库 ${formatWarehouse(row.warehouse_name, row.warehouse_code)}`)
  }
  if (row.supplier_name || row.supplier_code) {
    parts.push(`供应商 ${formatSupplier(row.supplier_name, row.supplier_code)}`)
  }
  if (row.marketplace) {
    parts.push(`站点 ${row.marketplace}`)
  }
  if (!parts.length) return ['全局']
  return parts
}

const formatWarehouse = (name?: string, code?: string) => {
  if (name && code) return `${name} (${code})`
  return name || code || ''
}

const formatSupplier = (name?: string | null, code?: string | null) => {
  if (name && code) return `${name} (${code})`
  return name || code || ''
}

const handleReload = async () => {
  await Promise.all([fetchConfig(), fetchStrategies()])
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }
  return fallback
}

onMounted(async () => {
  await searchProducts('')
  await handleReload()
})
</script>

<style scoped>
.replenishment-page {
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.config-form {
  margin-bottom: 8px;
}

.dialog-form :deep(.el-input-number) {
  width: 100%;
}

.entity-cell__primary {
  color: #303133;
  font-weight: 600;
}

.entity-cell__secondary,
.condition-list__item,
.rule-list__item {
  margin-top: 4px;
  color: #606266;
  font-size: 12px;
  line-height: 1.45;
}
</style>
