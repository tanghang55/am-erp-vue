<template>
  <div class="shipment-create">
    <el-card class="shipment-page-card">
      <template #header>
        <div class="card-header">
          <el-page-header :content="labels.title" @back="handleBack" />
        </div>
      </template>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="140px"
        class="shipment-form"
      >
        <div class="shipment-form-layout">
          <div class="shipment-form-main">
            <div class="shipment-editor-layout">
              <aside class="shipment-step-nav">
                <button
                  v-for="(section, index) in shipmentSections"
                  :key="section.key"
                  type="button"
                  class="shipment-step-nav__item"
                  :class="{ 'shipment-step-nav__item--active': activeSection === section.key }"
                  @click="handleSelectSection(section.key)"
                >
                  <span class="shipment-step-nav__index">{{ index + 1 }}</span>
                  <span class="shipment-step-nav__content">
                    <span class="shipment-step-nav__title">{{ section.title }}</span>
                    <span class="shipment-step-nav__subtitle">{{ section.subtitle }}</span>
                  </span>
                </button>
              </aside>

              <div class="shipment-editor-content">
                <section v-show="activeSection === 'basic'" class="section-card">
                  <div class="section-header">
                    <div>
                      <h3 class="section-title">{{ labels.basicInfo }}</h3>
                      <p class="section-subtitle">先明确发货来源、单据编号和销售渠道。</p>
                    </div>
                  </div>

                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item :label="labels.orderNumber">
                        <el-input
                          v-model="form.order_number"
                          :placeholder="labels.orderNumberPlaceholder"
                          :disabled="!canEditBasics"
                          clearable
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item :label="labels.salesChannel">
                        <el-select
                          v-model="form.sales_channel"
                          :placeholder="labels.salesChannelPlaceholder"
                          :disabled="!canEditBasics"
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
                          :disabled="!canEditBasics"
                          style="width: 100%"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </section>

                <ShipmentDestinationSection
                  v-show="activeSection === 'destination'"
                  :form="form"
                  :labels="labels"
                  :destination-warehouse-helper-message="destinationWarehouseHelperMessage"
                  :destination-warehouse-helper-tone="destinationWarehouseHelperTone"
                  :disabled="!canEditShippingFields"
                  @destination-warehouse-change="handleDestinationWarehouseChange"
                  @destination-type-change="handleDestinationTypeChange"
                />

                <ShipmentShippingSection
                  v-show="activeSection === 'shipping'"
                  :form="form"
                  :labels="labels"
                  :available-rates="availableRates"
                  :loading-rates="loadingRates"
                  :shipping-rate="shippingRate"
                  :rate-helper-message="rateHelperMessage"
                  :rate-helper-tone="rateHelperTone"
                  :transport-mode-config="TRANSPORT_MODE_CONFIG"
                  :pricing-method-config="PRICING_METHOD_CONFIG"
                  :format-rate-label="formatRateLabel"
                  :disabled="!canEditShippingFields"
                  @rate-change="handleRateChange"
                  @expected-ship-date-change="handleExpectedShipDateChange"
                />

                <ShipmentPackageSection
                  v-show="activeSection === 'package'"
                  :labels="labels"
                  :form="form"
                  :package-summary="packageSummary"
                  :package-specs="packageSpecs"
                  :product-packaging-consumption="productPackagingConsumption"
                  :box-packaging-consumption="boxPackagingConsumption"
                  :product-packaging-total-cost="productPackagingTotalCost"
                  :box-packaging-total-cost="boxPackagingTotalCost"
                  :total-packaging-cost="totalPackagingCost"
                  :get-full-image-url="getFullImageUrl"
                  :calculate-item-quantity="calculateItemQuantity"
                  :disabled="!canEditPackage"
                  @add-item="handleAddItem"
                  @package-spec-change="handlePackageSpecChange"
                  @box-quantity-change="handleBoxQuantityChange"
                  @remove-item="handleRemoveItem"
                />

                <section v-show="activeSection === 'remark'" class="section-card">
                  <div class="section-header">
                    <div>
                      <h3 class="section-title">{{ labels.remarkSection }}</h3>
                      <p class="section-subtitle">外部备注和内部备注分开填写，避免混淆。</p>
                    </div>
                  </div>

                  <el-row>
                    <el-col :span="24">
                      <el-form-item :label="labels.remark">
                        <el-input
                          v-model="form.remark"
                          type="textarea"
                          :rows="3"
                          :disabled="!canEditShippingFields"
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
                          :disabled="!canEditShippingFields"
                          :placeholder="labels.internalNotesPlaceholder"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </section>

                <div class="shipment-editor-actions">
                  <div class="shipment-editor-actions__left">
                    <el-button :disabled="isFirstSection" @click="handlePrevSection">
                      {{ labels.previousStep }}
                    </el-button>
                    <el-button v-if="!isLastSection" type="primary" plain @click="handleNextSection">
                      {{ labels.nextStep }}
                    </el-button>
                  </div>
                  <div class="shipment-editor-actions__right">
                    <el-button @click="handleBack">{{ labels.cancel }}</el-button>
                    <el-button type="primary" :loading="submitting" @click="handleSubmit">
                      {{ labels.submit }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ShipmentSummaryPanel
            :form="form"
            :total-quantity="totalQuantity"
            :package-summary="packageSummary"
            :total-packaging-cost="totalPackagingCost"
            :destination-warehouse-summary="destinationWarehouseSummary"
            :destination-type-label="destinationTypeLabel"
            :shipping-rate="shippingRate"
            :transport-mode-config="TRANSPORT_MODE_CONFIG"
            :pricing-method-config="PRICING_METHOD_CONFIG"
          />
        </div>
      </el-form>
    </el-card>

    <!-- 产品选择弹窗 -->
    <ProductPickerDialog
      v-model="productPickerVisible"
      :warehouse-id="form.warehouse_id"
      :product-params="selectableProductParams"
      @confirm="handleProductsConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { createShipment, getShipmentDetail, getPackageSpecList, getPackageSpecPackagingItems, updateShipment } from '../api'
import { getProductPackagingItems } from '@/modules/product/api'
import type { CreateShipmentItemParams, PackageSpec, DestinationType, Shipment, ShipmentStatus } from '../types'
import type { ShippingRate, TransportMode } from '@/modules/logistics/types'
import { TRANSPORT_MODE_CONFIG, PRICING_METHOD_CONFIG } from '@/modules/logistics/types'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import ProductPickerDialog from '@/modules/product/components/ProductPickerDialog.vue'
import ShipmentDestinationSection from '../components/ShipmentDestinationSection.vue'
import ShipmentShippingSection from '../components/ShipmentShippingSection.vue'
import ShipmentPackageSection from '../components/ShipmentPackageSection.vue'
import ShipmentSummaryPanel from '../components/ShipmentSummaryPanel.vue'
import { useShipmentRateSelection } from '../composables/useShipmentRateSelection'
import type { ProductSummary } from '@/modules/product/types'
import type { Warehouse } from '@/modules/inventory/types'

const router = useRouter()
const route = useRoute()
const selectableProductParams = {
  statuses: ['ON_SALE', 'REPLENISHING'] as const
}
type ShipmentSectionKey = 'basic' | 'destination' | 'shipping' | 'package' | 'remark'

const shipmentId = computed(() => Number(route.params.id || 0))
const isEditMode = computed(() => route.name === 'shipping-shipments-edit' && shipmentId.value > 0)
const editingStatus = ref<ShipmentStatus | null>(null)
const loadingDetail = ref(false)
const canEditBasics = computed(() => !isEditMode.value || editingStatus.value === 'DRAFT')
const canEditPackage = computed(() => !isEditMode.value || editingStatus.value === 'DRAFT')
const canEditShippingFields = computed(() => !isEditMode.value || editingStatus.value === 'DRAFT' || editingStatus.value === 'CONFIRMED')

const labels = computed(() => {
  return {
    title: isEditMode.value ? '编辑发货单' : '新建发货单',
    basicInfo: '基础信息',
    orderNumber: '订单号',
    orderNumberPlaceholder: '输入订单号（可选）',
    salesChannel: '销售渠道',
    salesChannelPlaceholder: '选择销售渠道',
    warehouse: '发货仓库',
    warehousePlaceholder: '选择发货仓库',

    destinationInfo: '收货方信息',
    destinationWarehouse: '目的地仓库',
    destinationWarehousePlaceholder: '选择目的地仓库（可选）',
    destinationWarehouseHint: '选择后将自动填充收货方信息',
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
    logisticsProvider: '物流供应商',
    logisticsProviderPlaceholder: '选择物流供应商',
    transportMode: '运输方式',
    transportModePlaceholder: '选择运输方式',
    logisticsService: '物流服务',
    logisticsServicePlaceholder: '选择服务类型（如：慢船、快船等）',
    shippingRateInfo: '运费报价信息',
    baseRate: '基础费率',
    fuelSurcharge: '燃油附加费',
    minCharge: '最低收费',
    transitDays: '预计时效',
    days: '天',
    validDate: '有效期',
    longTerm: '长期有效',
    carrier: '承运商',
    carrierPlaceholder: '输入承运商名称',
    trackingNumber: '追踪单号',
    trackingNumberPlaceholder: '输入追踪单号',
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

    submit: isEditMode.value ? '保存发货单' : '创建发货单',
    cancel: '取消',
    previousStep: '上一步',
    nextStep: '下一步',

    warehouseRequired: '请选择发货仓库',
    destinationTypeRequired: '请选择收货方类型',
    destinationNameRequired: '请输入收货方名称',
    destinationAddressRequired: '请输入收货地址',
    itemsRequired: '请至少添加一个产品',
    productRequired: '请选择产品',
    selectWarehouseFirst: '请先选择发货仓库',
    pendingShipment: '待出库存',
    pendingShipmentExceeded: '发货数量不能超过待出库存',
    success: isEditMode.value ? '发货单保存成功' : '发货单创建成功',
    failed: isEditMode.value ? '发货单保存失败' : '创建发货单失败'
  }
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const productPickerVisible = ref(false)
const packageSpecs = ref<PackageSpec[]>([])
const activeSection = ref<ShipmentSectionKey>('basic')

// 包材配置缓存（key: productId 或 packageSpecId, value: 包材配置列表）
const productPackagingConfigs = ref<Record<number, any[]>>({})
const packageSpecPackagingConfigs = ref<Record<number, any[]>>({})

interface ShipmentItemForm extends CreateShipmentItemParams {
  product?: ProductSummary
  pending_shipment?: number  // 待出库存
  _packageSpec?: PackageSpec // 装箱规格对象（用于计算）
}

const form = reactive({
  order_number: '',
  sales_channel: '',
  warehouse_id: null as number | null,

  destination_warehouse_id: null as number | null,
  destination_type: 'PLATFORM_WAREHOUSE' as DestinationType,
  destination_name: '',
  destination_code: '',
  destination_contact: '',
  destination_phone: '',
  destination_address: '',

  logistics_provider_id: null as number | null,
  transport_mode: null as TransportMode | null,
  logistics_service_id: null as number | null,  // 物流服务ID
  shipping_rate_id: null as number | null,
  carrier: '',
  tracking_number: '',
  expected_ship_date: '',
  expected_delivery_date: '',

  remark: '',
  internal_notes: '',

  items: [] as ShipmentItemForm[]
})

const resetFormState = () => {
  Object.assign(form, {
    order_number: '',
    sales_channel: '',
    warehouse_id: null,
    destination_warehouse_id: null,
    destination_type: 'PLATFORM_WAREHOUSE' as DestinationType,
    destination_name: '',
    destination_code: '',
    destination_contact: '',
    destination_phone: '',
    destination_address: '',
    logistics_provider_id: null,
    transport_mode: null,
    logistics_service_id: null,
    shipping_rate_id: null,
    carrier: '',
    tracking_number: '',
    expected_ship_date: '',
    expected_delivery_date: '',
    remark: '',
    internal_notes: '',
    items: [] as ShipmentItemForm[]
  })
  editingStatus.value = null
  destinationWarehouseSummary.value = ''
  destinationWarehouseAutoFilled.value = false
}

const shipmentSections = computed(() => [
  {
    key: 'basic' as const,
    title: labels.value.basicInfo,
    subtitle: '来源与仓库'
  },
  {
    key: 'destination' as const,
    title: labels.value.destinationInfo,
    subtitle: '收货信息'
  },
  {
    key: 'shipping' as const,
    title: labels.value.shippingInfo,
    subtitle: '物流与报价'
  },
  {
    key: 'package' as const,
    title: labels.value.packageInfo,
    subtitle: '产品与装箱'
  },
  {
    key: 'remark' as const,
    title: labels.value.remarkSection,
    subtitle: '备注说明'
  }
])

const currentSectionIndex = computed(() => shipmentSections.value.findIndex(section => section.key === activeSection.value))
const isFirstSection = computed(() => currentSectionIndex.value <= 0)
const isLastSection = computed(() => currentSectionIndex.value === shipmentSections.value.length - 1)

const {
  shippingRate,
  availableRates,
  loadingRates,
  destinationWarehouseSummary,
  destinationWarehouseAutoFilled,
  destinationTypeLabel,
  destinationWarehouseHelperMessage,
  destinationWarehouseHelperTone,
  rateHelperMessage,
  rateHelperTone,
  loadAvailableRates,
  handleRateChange,
  formatRateLabel,
  handleDestinationWarehouseChange,
  handleDestinationTypeChange
} = useShipmentRateSelection(form, labels)

const handleSelectSection = (section: ShipmentSectionKey) => {
  activeSection.value = section
}

const handlePrevSection = () => {
  if (isFirstSection.value) return
  activeSection.value = shipmentSections.value[currentSectionIndex.value - 1].key
}

const handleNextSection = () => {
  if (isLastSection.value) return
  activeSection.value = shipmentSections.value[currentSectionIndex.value + 1].key
}

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
  return form.items.reduce((sum, item) => sum + calculateItemQuantity(item), 0)
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

// 产品包材消耗计算（打包时）
const productPackagingConsumption = computed(() => {
  const consumptionMap = new Map<number, any>()

  for (const item of form.items) {
    const quantity = calculateItemQuantity(item)
    if (!item.product?.id || !quantity) continue

    const productId = item.product.id

    // 获取该产品的包材配置
    const packagingConfigs = productPackagingConfigs.value[productId] || []

    for (const config of packagingConfigs) {
      const packagingItemId = config.packaging_item_id
      const quantityPerUnit = config.quantity_per_unit || 0
      const totalQty = quantity * quantityPerUnit

      if (consumptionMap.has(packagingItemId)) {
        const existing = consumptionMap.get(packagingItemId)
        existing.total_quantity += totalQty
      } else {
        consumptionMap.set(packagingItemId, {
          packaging_item_id: packagingItemId,
          item_name: config.packaging_item?.item_name || '-',
          item_code: config.packaging_item?.item_code || '-',
          specification: config.packaging_item?.specification,
          unit: config.packaging_item?.unit || '-',
          unit_cost: config.packaging_item?.unit_cost || 0,
          currency: config.packaging_item?.currency || 'CNY',
          total_quantity: totalQty
        })
      }
    }
  }

  return Array.from(consumptionMap.values())
})

// 装箱包材消耗计算（发货时）
const boxPackagingConsumption = computed(() => {
  const consumptionMap = new Map<number, any>()

  for (const item of form.items) {
    if (!item.package_spec_id || !item.box_quantity) continue

    const packageSpecId = item.package_spec_id
    const boxQty = item.box_quantity

    // 获取该装箱规格的包材配置
    const packagingConfigs = packageSpecPackagingConfigs.value[packageSpecId] || []

    for (const config of packagingConfigs) {
      const packagingItemId = config.packaging_item_id
      const quantityPerBox = config.quantity_per_box || 0
      const totalQty = boxQty * quantityPerBox

      if (consumptionMap.has(packagingItemId)) {
        const existing = consumptionMap.get(packagingItemId)
        existing.total_quantity += totalQty
      } else {
        consumptionMap.set(packagingItemId, {
          packaging_item_id: packagingItemId,
          item_name: config.packaging_item?.item_name || '-',
          item_code: config.packaging_item?.item_code || '-',
          specification: config.packaging_item?.specification,
          unit: config.packaging_item?.unit || '-',
          unit_cost: config.packaging_item?.unit_cost || 0,
          currency: config.packaging_item?.currency || 'CNY',
          total_quantity: totalQty
        })
      }
    }
  }

  return Array.from(consumptionMap.values())
})

// 产品包材总成本
const productPackagingTotalCost = computed(() => {
  return productPackagingConsumption.value.reduce((sum, item) => {
    return sum + item.total_quantity * item.unit_cost
  }, 0)
})

// 装箱包材总成本
const boxPackagingTotalCost = computed(() => {
  return boxPackagingConsumption.value.reduce((sum, item) => {
    return sum + item.total_quantity * item.unit_cost
  }, 0)
})

// 包材总成本
const totalPackagingCost = computed(() => {
  return productPackagingTotalCost.value + boxPackagingTotalCost.value
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

    // 加载该装箱规格的包材配置
    loadPackageSpecPackagingConfig(row.package_spec_id)
  } else {
    row._packageSpec = undefined
  }
  syncItemQuantity(row)
}

const handleBoxQuantityChange = (row: ShipmentItemForm) => {
  syncItemQuantity(row)
}

const syncItemQuantity = (row: ShipmentItemForm) => {
  row.quantity_planned = calculateItemQuantity(row)
}

// 计算单项发货数量 = 箱数 × 每箱数量
const calculateItemQuantity = (row: ShipmentItemForm): number => {
  if (!row.package_spec_id || !row.box_quantity) return 0
  // 直接从 packageSpecs 查找，避免响应式问题
  const spec = packageSpecs.value.find(s => s.id === row.package_spec_id)
  if (!spec) return 0
  return row.box_quantity * (spec.quantity_per_box || 1)
}

const handleAddItem = () => {
  if (!form.warehouse_id) {
    ElMessage.warning(labels.value.selectWarehouseFirst)
    activeSection.value = 'basic'
    return
  }
  productPickerVisible.value = true
}

const handleProductsConfirm = (products: Array<ProductSummary & { _inventory?: { pending_shipment?: number } }>) => {
  for (const product of products) {
    // Check if product already exists
    const exists = form.items.some(item => item.product_id === product.id)
    if (!exists) {
      const newItem: ShipmentItemForm = {
        product_id: product.id,
        quantity_planned: 0, // 将由 箱数 × 每箱数量 自动计算
        package_spec_id: undefined,
        box_quantity: 1, // 默认1箱
        remark: '',
        product,
        pending_shipment: product._inventory?.pending_shipment
      }
      syncItemQuantity(newItem)
      form.items.push(newItem)

      // 加载该产品的包材配置
      if (product.id) {
        loadProductPackagingConfig(product.id)
      }
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

// 加载产品的包材配置
const loadProductPackagingConfig = async (productId: number) => {
  // 如果已经加载过，跳过
  if (productPackagingConfigs.value[productId]) {
    return
  }

  try {
    const res = await getProductPackagingItems(productId)
    productPackagingConfigs.value[productId] = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Failed to load product packaging config:', error)
    productPackagingConfigs.value[productId] = []
  }
}

// 加载装箱规格的包材配置
const loadPackageSpecPackagingConfig = async (packageSpecId: number) => {
  // 如果已经加载过，跳过
  if (packageSpecPackagingConfigs.value[packageSpecId]) {
    return
  }

  try {
    const res = await getPackageSpecPackagingItems(packageSpecId)
    packageSpecPackagingConfigs.value[packageSpecId] = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Failed to load package spec packaging config:', error)
    packageSpecPackagingConfigs.value[packageSpecId] = []
  }
}

const hydrateShipmentForm = async (shipment: Shipment) => {
  resetFormState()
  editingStatus.value = shipment.status

  if (!canEditShippingFields.value) {
    ElMessage.error('当前状态不允许编辑发货单')
    router.replace(`/shipping/shipments/${shipment.id}`)
    return
  }

  form.order_number = shipment.order_number || ''
  form.sales_channel = shipment.sales_channel || ''
  form.warehouse_id = shipment.warehouse_id
  form.destination_warehouse_id = shipment.destination_warehouse_id || null
  form.destination_type = shipment.destination_type || 'PLATFORM_WAREHOUSE'
  form.destination_name = shipment.destination_name || ''
  form.destination_code = shipment.destination_code || ''
  form.destination_contact = shipment.destination_contact || ''
  form.destination_phone = shipment.destination_phone || ''
  form.destination_address = shipment.destination_address || ''
  form.logistics_provider_id = shipment.logistics_provider_id || null
  form.transport_mode = (shipment.transport_mode as TransportMode | undefined) || null
  form.shipping_rate_id = shipment.shipping_rate_id || null
  form.carrier = shipment.carrier || ''
  form.tracking_number = shipment.tracking_number || ''
  form.expected_delivery_date = shipment.expected_delivery_date || ''
  form.remark = shipment.remark || ''
  form.internal_notes = shipment.internal_notes || ''
  form.items = (shipment.items || []).map((item) => ({
    product_id: item.product_id,
    quantity_planned: item.quantity_planned,
    package_spec_id: item.package_spec_id,
    box_quantity: item.box_quantity || 1,
    remark: item.remark,
    product: item.product,
    pending_shipment: undefined
  }))

  if (shipment.destination_warehouse) {
    const destinationWarehouse = shipment.destination_warehouse as Warehouse
    destinationWarehouseSummary.value = destinationWarehouse.warehouse_code
      ? `${destinationWarehouse.name}（${destinationWarehouse.warehouse_code}）`
      : destinationWarehouse.name
  }

  const selectedRateID = form.shipping_rate_id
  await Promise.all(
    form.items.flatMap((item) => {
      const tasks: Array<Promise<void>> = []
      if (item.product_id) {
        tasks.push(loadProductPackagingConfig(item.product_id))
      }
      if (item.package_spec_id) {
        item._packageSpec = packageSpecs.value.find(spec => spec.id === item.package_spec_id)
        tasks.push(loadPackageSpecPackagingConfig(item.package_spec_id))
      }
      return tasks
    })
  )

  if (form.warehouse_id && form.destination_warehouse_id) {
    await loadAvailableRates()
    if (selectedRateID) {
      form.shipping_rate_id = selectedRateID
      handleRateChange(selectedRateID)
    }
  }
}

const loadShipmentForEdit = async () => {
  if (!isEditMode.value || !shipmentId.value) {
    return
  }
  loadingDetail.value = true
  try {
    const res = await getShipmentDetail(shipmentId.value)
    if (!res.data) {
      ElMessage.error('发货单不存在')
      router.replace('/shipping/shipments')
      return
    }
    await hydrateShipmentForm(res.data)
  } catch (error: any) {
    console.error('Load shipment detail failed:', error)
    ElMessage.error(error.message || '加载发货单失败')
    router.replace('/shipping/shipments')
  } finally {
    loadingDetail.value = false
  }
}

const validateItems = (): boolean => {
  if (!canEditPackage.value) {
    return true
  }
  if (form.items.length === 0) {
    ElMessage.error(labels.value.itemsRequired)
    return false
  }

  for (let i = 0; i < form.items.length; i++) {
    const item = form.items[i]
    if (!item.product_id || item.product_id === 0) {
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
    if (typeof item.pending_shipment === 'number' && qty > item.pending_shipment) {
      ElMessage.error(`第 ${i + 1} 行: ${labels.value.pendingShipmentExceeded}（${item.pending_shipment}）`)
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  if (!formRef.value || loadingDetail.value) return

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
    const payload = {
      order_number: form.order_number || undefined,
      sales_channel: form.sales_channel || undefined,
      warehouse_id: form.warehouse_id || undefined,

      destination_warehouse_id: form.destination_warehouse_id || undefined,
      destination_type: form.destination_type,
      destination_name: form.destination_name,
      destination_code: form.destination_code || undefined,
      destination_contact: form.destination_contact || undefined,
      destination_phone: form.destination_phone || undefined,
      destination_address: form.destination_address,

      logistics_provider_id: form.logistics_provider_id || undefined,
      shipping_rate_id: form.shipping_rate_id || undefined,
      transport_mode: form.transport_mode || undefined,
      carrier: form.carrier || undefined,
      tracking_number: form.tracking_number || undefined,
      expected_ship_date: form.expected_ship_date || undefined,
      expected_delivery_date: form.expected_delivery_date || undefined,

      // 使用自动计算的包装汇总
      box_count: packageSummary.value.boxCount,
      total_weight: packageSummary.value.totalWeight,
      total_volume: packageSummary.value.totalVolume,

      remark: form.remark || undefined,
      internal_notes: form.internal_notes || undefined,

      items: form.items.map(item => ({
        product_id: item.product_id,
        quantity_planned: calculateItemQuantity(item), // 自动计算：箱数 × 每箱数量
        package_spec_id: item.package_spec_id,
        box_quantity: item.box_quantity || 0,
        remark: item.remark
      }))
    }

    const res = isEditMode.value
      ? await updateShipment(shipmentId.value, {
          ...payload,
          items: canEditPackage.value ? payload.items : undefined
        })
      : await createShipment({
          ...payload,
          warehouse_id: form.warehouse_id!
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
    if (oldVal !== null && newVal !== oldVal) {
      if (form.items.length > 0) {
        form.items = []
        ElMessage.info('仓库已变更，已清空产品列表')
      }
      // 仓库变化时重新加载报价
      loadAvailableRates()
    }
  }
)

// 页面加载时获取装箱规格列表
onMounted(async () => {
  await loadPackageSpecs()
  await loadShipmentForEdit()
})
</script>

<style scoped>
.shipment-create {
  padding: 20px;
}

.shipment-page-card {
  border-radius: 14px;
}

.card-header {
  display: flex;
  align-items: center;
}

.shipment-form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
}

.shipment-form-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.shipment-editor-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.shipment-step-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: sticky;
  top: 20px;
}

.shipment-step-nav__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.shipment-step-nav__item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.shipment-step-nav__item--active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.08);
}

.shipment-step-nav__index {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #374151;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.shipment-step-nav__item--active .shipment-step-nav__index {
  background: #2563eb;
  color: #fff;
}

.shipment-step-nav__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.shipment-step-nav__title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.shipment-step-nav__subtitle {
  font-size: 12px;
  color: #6b7280;
}

.shipment-editor-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%);
  padding: 20px 20px 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.section-header--nested {
  margin-top: 18px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 700;
  color: #1f2937;
}

.section-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.form-actions {
  margin-top: 24px;
}

.shipment-editor-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.shipment-editor-actions__left,
.shipment-editor-actions__right {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 1200px) {
  .shipment-form-layout {
    grid-template-columns: 1fr;
  }

  .shipment-editor-layout {
    grid-template-columns: 1fr;
  }

  .shipment-step-nav {
    position: static;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
}

@media (max-width: 768px) {
  .shipment-create {
    padding: 12px;
  }

  .shipment-editor-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .shipment-editor-actions__left,
  .shipment-editor-actions__right {
    justify-content: space-between;
  }
}
</style>
