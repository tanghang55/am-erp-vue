<template>
  <div class="shipment-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-page-header :content="labels.title" @back="handleBack" />
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <!-- 基础信息 -->
        <el-divider content-position="left">{{ labels.basicInfo }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.orderNumber">
              <el-input
                v-model="form.order_number"
                :placeholder="labels.orderNumberPlaceholder"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.salesChannel">
              <el-select
                v-model="form.sales_channel"
                :placeholder="labels.salesChannelPlaceholder"
                clearable
                style="width: 100%"
              >
                <el-option label="Amazon" value="Amazon" />
                <el-option label="eBay" value="eBay" />
                <el-option label="Shopify" value="Shopify" />
                <el-option label="独立站" value="Independent" />
                <el-option label="线下" value="Offline" />
                <el-option label="其他" value="Other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.warehouse" prop="warehouse_id">
              <warehouse-selector
                v-model="form.warehouse_id"
                :placeholder="labels.warehousePlaceholder"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 收货方信息 -->
        <el-divider content-position="left">{{ labels.destinationInfo }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.destinationType" prop="destination_type">
              <el-select
                v-model="form.destination_type"
                :placeholder="labels.destinationTypePlaceholder"
                style="width: 100%"
                @change="handleDestinationTypeChange"
              >
                <el-option label="平台仓库 (Amazon FBA等)" value="PLATFORM_WAREHOUSE" />
                <el-option label="客户" value="CUSTOMER" />
                <el-option label="自有仓库" value="OWN_WAREHOUSE" />
                <el-option label="供应商" value="SUPPLIER" />
                <el-option label="其他" value="OTHER" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.destinationName" prop="destination_name">
              <el-input
                v-model="form.destination_name"
                :placeholder="labels.destinationNamePlaceholder"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.destinationCode">
              <el-input
                v-model="form.destination_code"
                :placeholder="labels.destinationCodePlaceholder"
                clearable
              />
              <span class="field-hint">{{ labels.destinationCodeHint }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.destinationContact">
              <el-input
                v-model="form.destination_contact"
                :placeholder="labels.destinationContactPlaceholder"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.destinationPhone">
              <el-input
                v-model="form.destination_phone"
                :placeholder="labels.destinationPhonePlaceholder"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item :label="labels.destinationAddress" prop="destination_address">
              <el-input
                v-model="form.destination_address"
                type="textarea"
                :rows="2"
                :placeholder="labels.destinationAddressPlaceholder"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 物流信息 -->
        <el-divider content-position="left">{{ labels.shippingInfo }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.carrier">
              <el-select
                v-model="form.carrier"
                :placeholder="labels.carrierPlaceholder"
                clearable
                filterable
                allow-create
                style="width: 100%"
              >
                <el-option label="FedEx" value="FedEx" />
                <el-option label="UPS" value="UPS" />
                <el-option label="DHL" value="DHL" />
                <el-option label="顺丰" value="SF Express" />
                <el-option label="中通" value="ZTO" />
                <el-option label="圆通" value="YTO" />
                <el-option label="韵达" value="Yunda" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.shippingMethod">
              <el-select
                v-model="form.shipping_method"
                :placeholder="labels.shippingMethodPlaceholder"
                clearable
                style="width: 100%"
              >
                <el-option label="快递" value="Express" />
                <el-option label="空运" value="Air" />
                <el-option label="海运" value="Sea" />
                <el-option label="陆运" value="Land" />
                <el-option label="铁路" value="Railway" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.expectedShipDate">
              <el-date-picker
                v-model="form.expected_ship_date"
                type="date"
                :placeholder="labels.expectedShipDatePlaceholder"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.expectedDeliveryDate">
              <el-date-picker
                v-model="form.expected_delivery_date"
                type="date"
                :placeholder="labels.expectedDeliveryDatePlaceholder"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 包装信息 (自动计算) -->
        <el-divider content-position="left">{{ labels.packageInfo }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="labels.boxCount">
              <div class="summary-value">{{ packageSummary.boxCount }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="labels.totalWeight">
              <div class="summary-value">{{ packageSummary.totalWeight.toFixed(2) }} <span class="unit">kg</span></div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="labels.totalVolume">
              <div class="summary-value">{{ packageSummary.totalVolume.toFixed(4) }} <span class="unit">m³</span></div>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="package-hint">* 包装信息根据产品明细中的装箱信息自动计算</div>

        <!-- 发货明细 -->
        <el-divider content-position="left">{{ labels.items }}</el-divider>

        <div class="items-section">
          <el-button
            type="primary"
            size="small"
            @click="handleAddItem"
            style="margin-bottom: 16px"
          >
            <el-icon><Plus /></el-icon>
            {{ labels.addProduct }}
          </el-button>

          <el-table :data="form.items" border stripe>
            <el-table-column type="index" label="#" width="60" />

            <el-table-column :label="labels.productImage" width="80">
              <template #default="{ row }">
                <el-image
                  v-if="row.product?.image_url"
                  :src="getFullImageUrl(row.product.image_url)"
                  :preview-src-list="[getFullImageUrl(row.product.image_url)]"
                  fit="cover"
                  style="width: 50px; height: 50px; border-radius: 4px"
                />
                <span v-else class="no-image">-</span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.productCode" width="160">
              <template #default="{ row }">
                <span class="product-code">{{ row.product?.seller_sku || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.productName" min-width="200">
              <template #default="{ row }">
                <span class="product-title">{{ row.product?.title || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.pendingShipment" width="100" align="center">
              <template #default="{ row }">
                <span :class="{ 'qty-warning': row.pending_shipment === 0 }">
                  {{ row.pending_shipment ?? '-' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.packageSpec" width="200">
              <template #default="{ row }">
                <el-select
                  v-model="row.package_spec_id"
                  placeholder="选择装箱规格"
                  clearable
                  style="width: 100%"
                  @change="handlePackageSpecChange(row)"
                >
                  <el-option
                    v-for="spec in packageSpecs"
                    :key="spec.id"
                    :label="`${spec.name} (${spec.quantity_per_box}个/箱)`"
                    :value="spec.id"
                  >
                    <span>{{ spec.name }}</span>
                    <span class="spec-info"> {{ spec.quantity_per_box }}个/箱</span>
                  </el-option>
                </el-select>
              </template>
            </el-table-column>

            <el-table-column :label="labels.boxQuantity" width="110">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.box_quantity"
                  :min="1"
                  :precision="0"
                  style="width: 100%"
                />
              </template>
            </el-table-column>

            <el-table-column :label="labels.quantityPlanned" width="100" align="center">
              <template #default="{ row }">
                <span class="calculated-qty">{{ calculateItemQuantity(row) }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.itemRemark" width="150">
              <template #default="{ row }">
                <el-input
                  v-model="row.remark"
                  :placeholder="labels.itemRemarkPlaceholder"
                  size="small"
                />
              </template>
            </el-table-column>

            <el-table-column :label="labels.actions" width="100" fixed="right">
              <template #default="{ $index }">
                <el-button
                  size="small"
                  type="danger"
                  @click="handleRemoveItem($index)"
                >
                  {{ labels.remove }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="items-summary">
            <span>{{ labels.totalItems }}: {{ form.items.length }}</span>
            <span style="margin-left: 20px">{{ labels.totalQuantity }}: {{ totalQuantity }}</span>
          </div>
        </div>

        <!-- 备注 -->
        <el-divider content-position="left">{{ labels.remarkSection }}</el-divider>

        <el-row>
          <el-col :span="24">
            <el-form-item :label="labels.remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="3"
                :placeholder="labels.remarkPlaceholder"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item :label="labels.internalNotes">
              <el-input
                v-model="form.internal_notes"
                type="textarea"
                :rows="2"
                :placeholder="labels.internalNotesPlaceholder"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 提交按钮 -->
        <el-form-item style="margin-top: 24px">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ labels.submit }}
          </el-button>
          <el-button @click="handleBack">{{ labels.cancel }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 产品选择弹窗 -->
    <ProductPickerDialog
      v-model="productPickerVisible"
      :warehouse-id="form.warehouse_id"
      @confirm="handleProductsConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createShipment, getPackageSpecList } from '../api'
import type { CreateShipmentItemParams, PackageSpec, DestinationType } from '../types'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import ProductPickerDialog from '@/modules/product/components/ProductPickerDialog.vue'
import type { Sku } from '@/modules/product/types'

const router = useRouter()

const labels = computed(() => {
  return {
    title: '新建发货单',
    basicInfo: '基础信息',
    orderNumber: '订单号',
    orderNumberPlaceholder: '输入订单号（可选）',
    salesChannel: '销售渠道',
    salesChannelPlaceholder: '选择销售渠道',
    warehouse: '发货仓库',
    warehousePlaceholder: '选择发货仓库',

    destinationInfo: '收货方信息',
    destinationType: '收货方类型',
    destinationTypePlaceholder: '选择收货方类型',
    destinationName: '收货方名称',
    destinationNamePlaceholder: '输入收货方名称',
    destinationCode: '收货方代码',
    destinationCodePlaceholder: '如FBA仓库代码 PHX3, ONT8等',
    destinationCodeHint: 'FBA仓库代码、客户编号等',
    destinationContact: '收货联系人',
    destinationContactPlaceholder: '输入联系人姓名',
    destinationPhone: '收货电话',
    destinationPhonePlaceholder: '输入联系电话',
    destinationAddress: '收货地址',
    destinationAddressPlaceholder: '输入完整收货地址',

    shippingInfo: '物流信息',
    carrier: '承运商',
    carrierPlaceholder: '选择或输入承运商',
    shippingMethod: '运输方式',
    shippingMethodPlaceholder: '选择运输方式',
    expectedShipDate: '预计发货日期',
    expectedShipDatePlaceholder: '选择预计发货日期',
    expectedDeliveryDate: '预计到达日期',
    expectedDeliveryDatePlaceholder: '选择预计到达日期',

    packageInfo: '包装信息',
    boxCount: '箱数',
    totalWeight: '总重量',
    totalVolume: '总体积',

    items: '发货明细',
    addProduct: '添加产品',
    productImage: '图片',
    productCode: '产品编号',
    productName: '产品名称',
    packageSpec: '装箱规格',
    boxQuantity: '箱数',
    quantityPlanned: '发货数量',
    itemRemark: '备注',
    itemRemarkPlaceholder: '商品备注',
    actions: '操作',
    remove: '移除',
    totalItems: '总商品数',
    totalQuantity: '总数量',

    remarkSection: '备注信息',
    remark: '备注',
    remarkPlaceholder: '输入备注信息',
    internalNotes: '内部备注',
    internalNotesPlaceholder: '输入内部备注（仅内部可见）',

    submit: '创建发货单',
    cancel: '取消',

    warehouseRequired: '请选择发货仓库',
    destinationTypeRequired: '请选择收货方类型',
    destinationNameRequired: '请输入收货方名称',
    destinationAddressRequired: '请输入收货地址',
    itemsRequired: '请至少添加一个产品',
    productRequired: '请选择产品',
    selectWarehouseFirst: '请先选择发货仓库',
    pendingShipment: '待出库存',
    success: '发货单创建成功',
    failed: '创建发货单失败'
  }
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const productPickerVisible = ref(false)
const packageSpecs = ref<PackageSpec[]>([])

interface ShipmentItemForm extends CreateShipmentItemParams {
  product?: Sku
  pending_shipment?: number  // 待出库存
  _packageSpec?: PackageSpec // 装箱规格对象（用于计算）
}

const form = reactive({
  order_number: '',
  sales_channel: '',
  warehouse_id: null as number | null,

  destination_type: 'PLATFORM_WAREHOUSE' as DestinationType,
  destination_name: '',
  destination_code: '',
  destination_contact: '',
  destination_phone: '',
  destination_address: '',

  carrier: '',
  shipping_method: '',
  expected_ship_date: '',
  expected_delivery_date: '',

  remark: '',
  internal_notes: '',

  items: [] as ShipmentItemForm[]
})

const rules: FormRules = {
  warehouse_id: [
    { required: true, message: labels.value.warehouseRequired, trigger: 'change' }
  ],
  destination_type: [
    { required: true, message: labels.value.destinationTypeRequired, trigger: 'change' }
  ],
  destination_name: [
    { required: true, message: labels.value.destinationNameRequired, trigger: 'blur' }
  ],
  destination_address: [
    { required: true, message: labels.value.destinationAddressRequired, trigger: 'blur' }
  ]
}

const totalQuantity = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.quantity_planned || 0), 0)
})

// 包装信息汇总（根据产品明细自动计算）
const packageSummary = computed(() => {
  let boxCount = 0
  let totalWeight = 0
  let totalVolume = 0

  for (const item of form.items) {
    const qty = item.box_quantity || 0
    boxCount += qty

    if (item.package_spec_id && qty > 0) {
      // 直接从 packageSpecs 查找
      const spec = packageSpecs.value.find(s => s.id === item.package_spec_id)
      if (spec) {
        totalWeight += spec.weight * qty
        // 体积：cm³ → m³
        const volumePerBox = (spec.length * spec.width * spec.height) / 1000000
        totalVolume += volumePerBox * qty
      }
    }
  }

  return { boxCount, totalWeight, totalVolume }
})

// 加载装箱规格列表
const loadPackageSpecs = async () => {
  try {
    const res = await getPackageSpecList({ status: 'ACTIVE', page_size: 100 })
    if (res.success) {
      const items = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []
      packageSpecs.value = items
    }
  } catch (error) {
    console.error('Load package specs failed:', error)
  }
}

// 装箱规格变更处理
const handlePackageSpecChange = (row: ShipmentItemForm) => {
  if (row.package_spec_id) {
    row._packageSpec = packageSpecs.value.find(s => s.id === row.package_spec_id)
  } else {
    row._packageSpec = undefined
  }
}

// 计算单项发货数量 = 箱数 × 每箱数量
const calculateItemQuantity = (row: ShipmentItemForm): number => {
  if (!row.package_spec_id || !row.box_quantity) return 0
  // 直接从 packageSpecs 查找，避免响应式问题
  const spec = packageSpecs.value.find(s => s.id === row.package_spec_id)
  if (!spec) return 0
  return row.box_quantity * (spec.quantity_per_box || 1)
}

const handleDestinationTypeChange = () => {
  // 可以根据收货方类型设置默认值或提示
  console.log('Destination type changed:', form.destination_type)
}

const handleAddItem = () => {
  if (!form.warehouse_id) {
    ElMessage.warning(labels.value.selectWarehouseFirst)
    return
  }
  productPickerVisible.value = true
}

const handleProductsConfirm = (products: Array<Sku & { _inventory?: { pending_shipment?: number } }>) => {
  for (const product of products) {
    // Check if product already exists
    const exists = form.items.some(item => item.sku_id === product.id)
    if (!exists) {
      form.items.push({
        sku_id: product.id,
        quantity_planned: 0, // 将由 箱数 × 每箱数量 自动计算
        package_spec_id: undefined,
        box_quantity: 1, // 默认1箱
        remark: '',
        product,
        pending_shipment: product._inventory?.pending_shipment
      })
    }
  }
}

const getFullImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url}`
}

const handleRemoveItem = (index: number) => {
  form.items.splice(index, 1)
}

const validateItems = (): boolean => {
  if (form.items.length === 0) {
    ElMessage.error(labels.value.itemsRequired)
    return false
  }

  for (let i = 0; i < form.items.length; i++) {
    const item = form.items[i]
    if (!item.sku_id || item.sku_id === 0) {
      ElMessage.error(`第 ${i + 1} 行: ${labels.value.productRequired}`)
      return false
    }
    if (!item.package_spec_id) {
      ElMessage.error(`第 ${i + 1} 行: 请选择装箱规格`)
      return false
    }
    if (!item.box_quantity || item.box_quantity <= 0) {
      ElMessage.error(`第 ${i + 1} 行: 箱数必须大于0`)
      return false
    }
    // 验证计算后的发货数量
    const qty = calculateItemQuantity(item)
    if (qty <= 0) {
      ElMessage.error(`第 ${i + 1} 行: 发货数量必须大于0`)
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  if (!validateItems()) {
    return
  }

  submitting.value = true
  try {
    const res = await createShipment({
      order_number: form.order_number || undefined,
      sales_channel: form.sales_channel || undefined,
      warehouse_id: form.warehouse_id!,

      destination_type: form.destination_type,
      destination_name: form.destination_name,
      destination_code: form.destination_code || undefined,
      destination_contact: form.destination_contact || undefined,
      destination_phone: form.destination_phone || undefined,
      destination_address: form.destination_address,

      carrier: form.carrier || undefined,
      shipping_method: form.shipping_method || undefined,
      expected_ship_date: form.expected_ship_date || undefined,
      expected_delivery_date: form.expected_delivery_date || undefined,

      // 使用自动计算的包装汇总
      box_count: packageSummary.value.boxCount,
      total_weight: packageSummary.value.totalWeight,
      total_volume: packageSummary.value.totalVolume,

      remark: form.remark || undefined,
      internal_notes: form.internal_notes || undefined,

      items: form.items.map(item => ({
        sku_id: item.sku_id,
        quantity_planned: calculateItemQuantity(item), // 自动计算：箱数 × 每箱数量
        package_spec_id: item.package_spec_id,
        box_quantity: item.box_quantity || 0,
        remark: item.remark
      }))
    })

    if (res.success && res.data) {
      ElMessage.success(labels.value.success)
      router.push(`/shipping/shipments/${res.data.id}`)
    } else {
      ElMessage.error(labels.value.failed)
    }
  } catch (error: any) {
    console.error('Create shipment failed:', error)
    ElMessage.error(error.message || labels.value.failed)
  } finally {
    submitting.value = false
  }
}

const handleBack = () => {
  router.back()
}

// Clear items when warehouse changes (inventory data becomes invalid)
watch(
  () => form.warehouse_id,
  (newVal, oldVal) => {
    if (oldVal !== null && newVal !== oldVal && form.items.length > 0) {
      form.items = []
      ElMessage.info('仓库已变更，已清空产品列表')
    }
  }
)

// 页面加载时获取装箱规格列表
onMounted(() => {
  loadPackageSpecs()
})
</script>

<style scoped>
.shipment-create {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
}

.items-section {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
}

.items-summary {
  margin-top: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  font-weight: 500;
}

.field-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

:deep(.el-divider__text) {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.no-image {
  color: #909399;
  font-size: 12px;
}

.product-code {
  font-weight: 600;
  color: #303133;
}

.product-title {
  color: #606266;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.qty-warning {
  color: #f56c6c;
  font-weight: 600;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.summary-value .unit {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

.package-hint {
  font-size: 12px;
  color: #909399;
  margin-top: -8px;
  margin-bottom: 16px;
}

:deep(.spec-size) {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

:deep(.spec-info) {
  font-size: 12px;
  color: #67c23a;
  margin-left: 8px;
  font-weight: 500;
}

.calculated-qty {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}
</style>
