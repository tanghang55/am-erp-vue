<template>
  <div class="assembly-management">
    <!-- 打包操作区域 -->
    <el-card class="assembly-form-card" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span class="title">🔧 {{ labels.assemblyOperation }}</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.comboProduct" prop="combo_id">
              <el-select
                v-model="form.combo_id"
                :placeholder="labels.selectComboProduct"
                style="width: 100%"
                filterable
                @change="handleComboChange"
              >
                <el-option
                  v-for="combo in comboList"
                  :key="combo.combo_id"
                  :label="`${combo.main_product.seller_sku} - ${combo.main_product.title}`"
                  :value="combo.combo_id"
                >
                  <div style="display: flex; justify-content: space-between">
                    <span>{{ combo.main_product.seller_sku }}</span>
                    <span style="color: #8492a6; font-size: 13px">
                      {{ combo.products.length }} {{ labels.components }}
                    </span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="labels.warehouse" prop="warehouse_id">
              <warehouse-selector
                v-model="form.warehouse_id"
                :placeholder="labels.selectWarehouse"
                style="width: 100%"
                @change="handleWarehouseChange"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.assemblyQuantity" prop="quantity">
              <el-input-number
                v-model="form.quantity"
                :min="1"
                :max="999999"
                :placeholder="labels.assemblyQuantity"
                style="width: 100%"
                @change="calculateRequiredMaterials"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item :label="labels.remark">
              <el-input
                v-model="form.remark"
                :placeholder="labels.remarkPlaceholder"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- BOM 明细和库存检查 -->
        <el-form-item v-if="selectedCombo" :label="labels.bomDetail">
          <el-table :data="bomDetails" border style="width: 100%">
            <el-table-column prop="seller_sku" :label="labels.componentSKU" width="150" />
            <el-table-column prop="title" :label="labels.productTitle" min-width="200" />
            <el-table-column :label="labels.requiredQty" width="120" align="right">
              <template #default="{ row }">
                <span style="font-weight: bold">{{ row.required_qty }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="labels.rawMaterialStock" width="150" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.stock_status === 'sufficient' ? '#67C23A' : '#F56C6C' }">
                  {{ row.raw_material_stock }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="labels.stockStatus" width="120">
              <template #default="{ row }">
                <el-tag :type="row.stock_status === 'sufficient' ? 'success' : 'danger'">
                  {{ row.stock_status === 'sufficient' ? labels.sufficient : labels.insufficient }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            <el-icon><Tools /></el-icon>
            {{ labels.startAssembly }}
          </el-button>
          <el-button @click="handleReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 打包记录列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">📋 {{ labels.assemblyRecords }}</span>
          <el-button type="primary" :icon="Refresh" @click="loadRecords" circle />
        </div>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item :label="labels.comboProduct">
          <el-select
            v-model="queryParams.combo_id"
            :placeholder="labels.all"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="combo in comboList"
              :key="combo.combo_id"
              :label="combo.main_product.seller_sku"
              :value="combo.combo_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="labels.dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="labels.to"
            :start-placeholder="labels.startDate"
            :end-placeholder="labels.endDate"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">{{ labels.search }}</el-button>
          <el-button @click="handleQueryReset">{{ labels.reset }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 记录列表 -->
      <el-table v-loading="loading" :data="recordList" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column :label="labels.operatedAt" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.operated_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="labels.comboProduct" min-width="200">
          <template #default="{ row }">
            <div v-if="row.sku">
              <div>[{{ row.sku.seller_sku }}]</div>
              <div style="color: #909399; font-size: 12px">{{ row.sku.title }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.warehouse" width="150">
          <template #default="{ row }">
            <div v-if="row.warehouse">
              {{ row.warehouse.name }} ({{ row.warehouse.code }})
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="labels.quantity" width="120" align="right">
          <template #default="{ row }">
            <span style="font-weight: bold; color: #409eff">+{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" :label="labels.remark" min-width="150" show-overflow-tooltip />
        <el-table-column :label="labels.operator" width="120">
          <template #default="{ row }">
            {{ row.operator?.username || '-' }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadRecords"
          @current-change="loadRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Tools, Refresh } from '@element-plus/icons-vue'
import { getProductComboList, type ProductCombo } from '@/modules/product/api'
import {
  getBalanceList,
  getMovementList,
  recordAssemblyComplete
} from '@/modules/inventory/api'
import type { InventoryBalance, InventoryMovement } from '@/modules/inventory/types'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import { formatDateTime } from '@/utils/dateFormat'

const localeStore = useLocaleStore()

// 国际化标签
const labels = computed(() => {
  const lang = localeStore.currentLang
  return lang === 'en'
    ? {
        assemblyOperation: 'Assembly Operation',
        assemblyRecords: 'Assembly Records',
        comboProduct: 'Combo Product',
        selectComboProduct: 'Select combo product',
        warehouse: 'Warehouse',
        selectWarehouse: 'Select warehouse',
        assemblyQuantity: 'Assembly Quantity',
        remark: 'Remark',
        remarkPlaceholder: 'Optional remark',
        bomDetail: 'BOM Details',
        componentSKU: 'Component SKU',
        productTitle: 'Product Title',
        requiredQty: 'Required Qty',
        rawMaterialStock: 'Raw Material Stock',
        stockStatus: 'Stock Status',
        sufficient: 'Sufficient',
        insufficient: 'Insufficient',
        startAssembly: 'Start Assembly',
        reset: 'Reset',
        components: 'components',
        all: 'All',
        dateRange: 'Date Range',
        to: 'to',
        startDate: 'Start Date',
        endDate: 'End Date',
        search: 'Search',
        operatedAt: 'Operated At',
        quantity: 'Quantity',
        operator: 'Operator',
        assemblySuccess: 'Assembly completed successfully',
        confirmAssembly: 'Confirm Assembly',
        confirmAssemblyMessage:
          'Are you sure to assemble {quantity} units of {sku}? This will consume raw materials.',
        cancel: 'Cancel'
      }
    : {
        assemblyOperation: '打包操作',
        assemblyRecords: '打包记录',
        comboProduct: '组合产品',
        selectComboProduct: '选择组合产品',
        warehouse: '仓库',
        selectWarehouse: '选择仓库',
        assemblyQuantity: '打包数量',
        remark: '备注',
        remarkPlaceholder: '可选备注信息',
        bomDetail: 'BOM明细',
        componentSKU: '子产品SKU',
        productTitle: '产品标题',
        requiredQty: '需要数量',
        rawMaterialStock: '原料库存',
        stockStatus: '库存状态',
        sufficient: '充足',
        insufficient: '不足',
        startAssembly: '开始打包',
        reset: '重置',
        components: '个组件',
        all: '全部',
        dateRange: '日期范围',
        to: '至',
        startDate: '开始日期',
        endDate: '结束日期',
        search: '查询',
        operatedAt: '操作时间',
        quantity: '数量',
        operator: '操作人',
        assemblySuccess: '打包成功',
        confirmAssembly: '确认打包',
        confirmAssemblyMessage: '确定要打包 {quantity} 个 {sku} 吗？这将消耗原料库存。',
        cancel: '取消'
      }
})

// 表单数据
const formRef = ref<FormInstance>()
const form = reactive({
  combo_id: undefined as number | undefined,
  warehouse_id: undefined as number | undefined,
  quantity: 1,
  remark: ''
})

const rules: FormRules = {
  combo_id: [{ required: true, message: 'Please select combo product', trigger: 'change' }],
  warehouse_id: [{ required: true, message: 'Please select warehouse', trigger: 'change' }],
  quantity: [{ required: true, message: 'Please enter quantity', trigger: 'blur' }]
}

// 组合产品列表
const comboList = ref<ProductCombo[]>([])
const selectedCombo = ref<ProductCombo>()

// BOM明细和库存信息
interface BomDetail {
  product_id: number
  seller_sku: string
  title: string
  qty_ratio: number
  required_qty: number
  raw_material_stock: number
  stock_status: 'sufficient' | 'insufficient'
}

const bomDetails = ref<BomDetail[]>([])
const submitting = ref(false)

// 打包记录
const loading = ref(false)
const recordList = ref<InventoryMovement[]>([])
const total = ref(0)
const dateRange = ref<[string, string]>()

const queryParams = reactive({
  page: 1,
  page_size: 20,
  movement_type: 'ASSEMBLY_COMPLETE',
  combo_id: undefined as number | undefined,
  date_from: undefined as string | undefined,
  date_to: undefined as string | undefined
})

// 计算是否可以提交
const canSubmit = computed(() => {
  if (!form.combo_id || !form.warehouse_id || !form.quantity) {
    return false
  }
  // 检查所有原料库存是否充足
  return bomDetails.value.every((item) => item.stock_status === 'sufficient')
})

// 加载组合产品列表
async function loadComboList() {
  try {
    const res = await getProductComboList(1, 1000)
    if (res.success && res.data) {
      comboList.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to load combo list:', error)
  }
}

// 选择组合产品
function handleComboChange(comboId: number) {
  selectedCombo.value = comboList.value.find((c) => c.combo_id === comboId)
  bomDetails.value = []
  if (form.warehouse_id) {
    calculateRequiredMaterials()
  }
}

// 选择仓库
function handleWarehouseChange() {
  if (form.combo_id) {
    calculateRequiredMaterials()
  }
}

// 计算所需原料和检查库存
async function calculateRequiredMaterials() {
  if (!selectedCombo.value || !form.warehouse_id || !form.quantity) {
    bomDetails.value = []
    return
  }

  try {
    // 获取子产品的库存信息
    const details: BomDetail[] = []
    for (const product of selectedCombo.value.products) {
      // 查询该子产品在指定仓库的库存
      const res = await getBalanceList({
        sku_id: product.id,
        warehouse_id: form.warehouse_id
      })

      let rawMaterialStock = 0
      if (res.success && res.data && res.data.data.length > 0) {
        rawMaterialStock = res.data.data[0].raw_material || 0
      }

      // TODO: qty_ratio 需要从后端 ProductCombo 接口返回，这里暂时默认为1
      const qtyRatio = 1
      const requiredQty = form.quantity * qtyRatio

      details.push({
        product_id: product.id,
        seller_sku: product.seller_sku,
        title: product.title,
        qty_ratio: qtyRatio,
        required_qty: requiredQty,
        raw_material_stock: rawMaterialStock,
        stock_status: rawMaterialStock >= requiredQty ? 'sufficient' : 'insufficient'
      })
    }
    bomDetails.value = details
  } catch (error) {
    console.error('Failed to calculate materials:', error)
    ElMessage.error('Failed to check inventory')
  }
}

// 提交打包
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      await ElMessageBox.confirm(
        labels.value.confirmAssemblyMessage
          .replace('{quantity}', String(form.quantity))
          .replace('{sku}', selectedCombo.value?.main_product.seller_sku || ''),
        labels.value.confirmAssembly,
        {
          confirmButtonText: labels.value.startAssembly,
          cancelButtonText: labels.value.cancel,
          type: 'warning'
        }
      )

      submitting.value = true
      await recordAssemblyComplete({
        sku_id: selectedCombo.value!.main_product.id,
        warehouse_id: form.warehouse_id!,
        quantity: form.quantity,
        remark: form.remark || undefined
      })

      ElMessage.success(labels.value.assemblySuccess)
      handleReset()
      loadRecords()
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('Assembly failed:', error)
        ElMessage.error(error.message || 'Assembly failed')
      }
    } finally {
      submitting.value = false
    }
  })
}

// 重置表单
function handleReset() {
  formRef.value?.resetFields()
  selectedCombo.value = undefined
  bomDetails.value = []
}

// 加载打包记录
async function loadRecords() {
  loading.value = true
  try {
    const res = await getMovementList(queryParams)
    if (res.success && res.data) {
      recordList.value = res.data.data
      total.value = res.data.total
    }
  } catch (error) {
    console.error('Failed to load records:', error)
  } finally {
    loading.value = false
  }
}

// 查询
function handleQuery() {
  if (dateRange.value) {
    queryParams.date_from = dateRange.value[0]
    queryParams.date_to = dateRange.value[1]
  } else {
    queryParams.date_from = undefined
    queryParams.date_to = undefined
  }
  queryParams.page = 1
  loadRecords()
}

// 重置查询
function handleQueryReset() {
  queryParams.combo_id = undefined
  dateRange.value = undefined
  queryParams.date_from = undefined
  queryParams.date_to = undefined
  queryParams.page = 1
  loadRecords()
}

onMounted(() => {
  loadComboList()
  loadRecords()
})
</script>

<style scoped>
.assembly-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 16px;
  font-weight: bold;
}

.filter-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
