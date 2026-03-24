<template>
  <div class="rate-list">
    <el-card>
      <!-- 搜索表单 -->
      <el-form :model="searchForm" inline>
        <el-form-item label="物流供应商">
          <ProviderSelector
            v-model="searchForm.provider_id"
            placeholder="全部"
            clearable
            :allow-inactive="false"
          />
        </el-form-item>
        <el-form-item label="起点仓库">
          <WarehouseSelector
            v-model="searchForm.origin_warehouse_id"
            placeholder="全部"
            clearable
            :only-active="true"
          />
        </el-form-item>
        <el-form-item label="目的地仓库">
          <WarehouseSelector
            v-model="searchForm.destination_warehouse_id"
            placeholder="全部"
            clearable
            :only-active="true"
          />
        </el-form-item>
        <el-form-item label="运输方式">
          <el-select v-model="searchForm.transport_mode" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="(config, key) in TRANSPORT_MODE_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="(config, key) in RATE_STATUS_CONFIG"
              :key="key"
              :label="config.label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleCreate">新增报价</el-button>
        </el-form-item>
      </el-form>

      <!-- 列表表格 -->
      <el-table :data="list" v-loading="loading" border>
        <el-table-column label="报价名称" min-width="200">
          <template #default="{ row }">
            <div style="font-weight: 600; color: #303133; margin-bottom: 4px">
              {{ row.service?.service_name || row.service_name || '标准服务' }}
            </div>
            <div style="font-size: 12px; color: #909399">
              {{ row.provider?.provider_name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="路线" min-width="200">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px">
              <span>{{ formatWarehouse(row.origin_warehouse) }}</span>
              <span style="color: #409eff">→</span>
              <span>{{ formatWarehouse(row.destination_warehouse) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="transport_mode" label="运输方式" width="100">
          <template #default="{ row }">
            {{ TRANSPORT_MODE_CONFIG[row.transport_mode]?.icon }}
            {{ TRANSPORT_MODE_CONFIG[row.transport_mode]?.label }}
          </template>
        </el-table-column>
        <el-table-column prop="pricing_method" label="计费方式" width="100">
          <template #default="{ row }">
            {{ PRICING_METHOD_CONFIG[row.pricing_method]?.label }}
          </template>
        </el-table-column>
        <el-table-column label="费率" width="120">
          <template #default="{ row }">
            {{ row.base_rate }} {{ row.currency }}
          </template>
        </el-table-column>
        <el-table-column prop="transit_days" label="时效(天)" width="90" />
        <el-table-column label="最小起送量(kg)" width="130" align="center">
          <template #default="{ row }">
            <span v-if="row.min_weight">
              {{ row.min_weight }}kg起
            </span>
            <span v-else style="color: #909399">无限制</span>
          </template>
        </el-table-column>
        <el-table-column prop="effective_date" label="生效日期" width="110" />
        <el-table-column prop="expiry_date" label="失效日期" width="110">
          <template #default="{ row }">
            {{ row.expiry_date || '长期有效' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <div class="status-block">
              <el-tag :type="RATE_STATUS_CONFIG[row.status]?.color">
                {{ RATE_STATUS_CONFIG[row.status]?.label }}
              </el-tag>
              <el-tag v-if="row.deletable === false" type="warning" effect="plain" size="small">不可删除</el-tag>
              <div v-if="row.reference_count" class="status-block__remark">{{ row.reference_count }} 处引用</div>
              <div v-else-if="row.deletable === false" class="status-block__remark">{{ row.delete_block_reason || '已被业务数据引用' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-tooltip :disabled="row.deletable !== false" :content="row.delete_block_reason || '已被业务数据引用，不可删除'">
              <div class="inline-action">
                <el-button link type="danger" :disabled="row.deletable === false" @click="handleDelete(row)">删除</el-button>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物流供应商" prop="provider_id">
              <ProviderSelector
                v-model="formData.provider_id"
                placeholder="请选择"
                :allow-inactive="false"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运输方式" prop="transport_mode">
              <el-select
                v-model="formData.transport_mode"
                placeholder="请选择"
                style="width: 100%"
                @change="handleTransportModeChange"
              >
                <el-option
                  v-for="(config, key) in TRANSPORT_MODE_CONFIG"
                  :key="key"
                  :label="config.icon + ' ' + config.label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物流服务">
              <el-select
                v-model="formData.service_id"
                placeholder="请先选择运输方式"
                clearable
                filterable
                style="width: 100%"
                :disabled="!formData.transport_mode"
              >
                <el-option
                  v-for="service in serviceOptions"
                  :key="service.id"
                  :label="service.service_name"
                  :value="service.id"
                >
                  <span>{{ service.service_name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 12px">
                    {{ service.destination_region || '全球' }}
                  </span>
                </el-option>
              </el-select>
              <div style="font-size: 12px; color: #909399; margin-top: 4px">
                用于区分同路线的不同服务方案（如：慢船、快船、美森快船）
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时效(天)">
              <el-input-number
                v-model="formData.transit_days"
                :min="0"
                :controls="false"
                placeholder="预计运输天数"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起点仓库" prop="origin_warehouse_id">
              <WarehouseSelector
                v-model="formData.origin_warehouse_id"
                placeholder="请选择起点仓库"
                :only-active="true"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的地仓库" prop="destination_warehouse_id">
              <WarehouseSelector
                v-model="formData.destination_warehouse_id"
                placeholder="请选择目的地仓库"
                :only-active="true"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计费方式" prop="pricing_method">
              <el-select v-model="formData.pricing_method" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="(config, key) in PRICING_METHOD_CONFIG"
                  :key="key"
                  :label="config.label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="基础费率" prop="base_rate">
              <el-input-number
                v-model="formData.base_rate"
                :min="0"
                :precision="4"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="币种">
              <el-input v-model="formData.currency" placeholder="USD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="其他费用">
              <el-input-number
                v-model="formData.other_fee"
                :min="0"
                :precision="2"
                placeholder="0.00"
                :controls="false"
                style="width: 100%"
              />
              <div style="font-size: 12px; color: #909399; margin-top: 4px">
                其他附加费用（数字）
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最小起送量(kg)">
              <el-input-number
                v-model="formData.min_weight"
                :min="0"
                :precision="2"
                placeholder="如：50"
                :controls="false"
                style="width: 100%"
              />
              <div style="font-size: 12px; color: #909399; margin-top: 4px">
                低于此重量无法使用此报价，不填则无限制
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option
                  v-for="(config, key) in RATE_STATUS_CONFIG"
                  :key="key"
                  :label="config.label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效日期" prop="effective_date">
              <el-date-picker
                v-model="formData.effective_date"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效日期">
              <el-date-picker
                v-model="formData.expiry_date"
                type="date"
                placeholder="长期有效"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  getShippingRates,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
  getServicesByTransportMode
} from '../api'
import type {
  ShippingRate,
  RateListParams,
  CreateRateParams,
  LogisticsService,
  TransportMode
} from '../types'
import {
  TRANSPORT_MODE_CONFIG,
  PRICING_METHOD_CONFIG,
  RATE_STATUS_CONFIG
} from '../types'
import { parsePaginatedResponse } from '@/utils/api'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import ProviderSelector from '@/modules/logistics/components/ProviderSelector.vue'

const formatWarehouse = (warehouse?: { name?: string; code?: string } | null) => {
  if (!warehouse) return '-'
  if (warehouse.name && warehouse.code) return `${warehouse.name} (${warehouse.code})`
  return warehouse.name || warehouse.code || '-'
}

// 搜索表单
const searchForm = reactive<RateListParams>({
  provider_id: undefined,
  origin_warehouse_id: undefined,
  destination_warehouse_id: undefined,
  transport_mode: undefined,
  status: undefined
})

// 列表数据
const list = ref<ShippingRate[]>([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// 选项数据
const serviceOptions = ref<LogisticsService[]>([])

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogTitle = computed(() => dialogMode.value === 'create' ? '新增报价' : '编辑报价')
const formRef = ref<FormInstance>()
const submitting = ref(false)

// 表单数据
const defaultFormData: CreateRateParams = {
  provider_id: 0,
  origin_warehouse_id: 0,
  destination_warehouse_id: 0,
  transport_mode: 'AIR',
  service_id: undefined,
  service_name: '',  // 保留以兼容
  pricing_method: 'PER_KG',
  base_rate: 0,
  currency: 'USD',
  other_fee: 0,
  min_weight: undefined,
  transit_days: undefined,
  effective_date: '',
  expiry_date: undefined,
  remark: '',
  status: 'ACTIVE'
}

const formData = reactive<CreateRateParams & { id?: number }>({ ...defaultFormData })

// 表单验证规则
const formRules: FormRules = {
  provider_id: [
    { required: true, message: '请选择物流供应商', trigger: 'change' }
  ],
  origin_warehouse_id: [
    { required: true, message: '请选择起点仓库', trigger: 'change' }
  ],
  destination_warehouse_id: [
    { required: true, message: '请选择目的地仓库', trigger: 'change' }
  ],
  transport_mode: [
    { required: true, message: '请选择运输方式', trigger: 'change' }
  ],
  pricing_method: [
    { required: true, message: '请选择计费方式', trigger: 'change' }
  ],
  base_rate: [
    { required: true, message: '请输入基础费率', trigger: 'blur' }
  ],
  effective_date: [
    { required: true, message: '请选择生效日期', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 加载选项数据
const loadOptions = async () => {
  try {
    // 物流供应商/仓库都已改成选择器，这里只保留服务相关加载。
  } catch (error: any) {
    if (!error._handled) {
      ElMessage.error(error.message || '加载选项数据失败')
    }
  }
}

// 加载服务选项（根据运输方式）
const loadServiceOptions = async (transportMode: TransportMode) => {
  if (!transportMode) {
    serviceOptions.value = []
    return
  }
  try {
    const response = await getServicesByTransportMode(transportMode)
    serviceOptions.value = response.data || []
  } catch (error: any) {
    if (!error._handled) {
      console.error('加载服务选项失败:', error)
      serviceOptions.value = []
    }
  }
}

// 运输方式变更处理
const handleTransportModeChange = () => {
  // 清空服务选择
  formData.service_id = undefined
  // 加载新的服务选项
  if (formData.transport_mode) {
    loadServiceOptions(formData.transport_mode)
  } else {
    serviceOptions.value = []
  }
}

// 加载列表
const loadList = async () => {
  loading.value = true
  try {
    const response = await getShippingRates({
      ...searchForm,
      page: pagination.page,
      page_size: pagination.page_size
    })
    const { items, total } = parsePaginatedResponse(response)
    list.value = items
    pagination.total = total
  } catch (error: any) {
    if (!error._handled) {
      ElMessage.error(error.message || '加载列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  pagination.page = 1
  loadList()
}

// 重置
const handleReset = () => {
  searchForm.provider_id = undefined
  searchForm.origin_warehouse_id = undefined
  searchForm.destination_warehouse_id = undefined
  searchForm.transport_mode = undefined
  searchForm.status = undefined
  pagination.page = 1
  loadList()
}

// 新增
const handleCreate = () => {
  dialogMode.value = 'create'
  Object.assign(formData, defaultFormData)
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row: ShippingRate) => {
  dialogMode.value = 'edit'
  Object.assign(formData, {
    id: row.id,
    provider_id: row.provider_id,
    origin_warehouse_id: row.origin_warehouse_id,
    destination_warehouse_id: row.destination_warehouse_id,
    transport_mode: row.transport_mode,
    service_id: row.service_id,
    service_name: row.service_name || '',
    pricing_method: row.pricing_method,
    base_rate: row.base_rate,
    currency: row.currency || 'USD',
    other_fee: row.other_fee || 0,
    min_weight: row.min_weight,
    transit_days: row.transit_days,
    effective_date: row.effective_date,
    expiry_date: row.expiry_date,
    remark: row.remark || '',
    status: row.status
  })
  // 加载对应运输方式的服务选项
  if (row.transport_mode) {
    await loadServiceOptions(row.transport_mode)
  }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row: ShippingRate) => {
  if (row.deletable === false) {
    ElMessage.warning(row.delete_block_reason || '已被发货单引用，不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定要删除此报价吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteShippingRate(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (error: any) {
    if (error !== 'cancel' && !error._handled) {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    submitting.value = true

    if (dialogMode.value === 'create') {
      await createShippingRate(formData)
      ElMessage.success('创建成功')
    } else {
      await updateShippingRate(formData.id!, formData)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadList()
  } catch (error: any) {
    if (!error._handled) {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 初始化
onMounted(() => {
  loadOptions()
  loadList()
})
</script>

<style scoped>
.rate-list {
  padding: 20px;
}

.status-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-block__remark {
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
