<template>
  <div class="movement-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">{{ labels.title }}</span>
          <el-button @click="handleBack">
            <el-icon><Back /></el-icon>
            {{ labels.back }}
          </el-button>
        </div>
      </template>

      <!-- 步骤1: 选择流水类型 -->
      <div v-if="!selectedType" class="type-selection">
        <h3 style="margin-bottom: 20px">{{ labels.selectType }}</h3>
        <el-row :gutter="20">
          <el-col
            v-for="(config, type) in MOVEMENT_TYPE_CONFIG"
            :key="type"
            :span="6"
          >
            <el-card
              shadow="hover"
              class="type-card"
              :class="{ 'type-card-transfer': type === 'TRANSFER_OUT' || type === 'TRANSFER_IN' }"
              @click="handleSelectType(type as MovementType)"
            >
              <div class="type-icon">{{ config.icon }}</div>
              <div class="type-label">{{ getMovementTypeLabel(type as MovementType) }}</div>
              <div class="type-description">{{ getTypeDescription(type as MovementType) }}</div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 步骤2: 填写流水信息 -->
      <div v-else>
        <!-- 当前选择的类型 -->
        <el-alert
          :title="`${labels.currentType}: ${MOVEMENT_TYPE_CONFIG[selectedType]?.icon} ${getMovementTypeLabel(selectedType)}`"
          :type="MOVEMENT_TYPE_CONFIG[selectedType]?.color"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #default>
            <span>{{ getTypeDescription(selectedType) }}</span>
            <el-button
              link
              type="primary"
              @click="handleChangeType"
              style="margin-left: 10px"
            >
              {{ labels.changeType }}
            </el-button>
          </template>
        </el-alert>

        <!-- 调拨类型表单 -->
        <el-form
          v-if="isTransferType"
          ref="transferFormRef"
          :model="transferForm"
          :rules="transferRules"
          label-width="120px"
        >
          <el-form-item :label="labels.sku" prop="sku_id">
            <el-input-number
              v-model="transferForm.sku_id"
              :min="1"
              :placeholder="labels.skuPlaceholder"
              style="width: 100%"
            />
            <div class="form-tip">{{ labels.skuTip }}</div>
          </el-form-item>
          <el-form-item :label="labels.fromWarehouse" prop="from_warehouse_id">
            <warehouse-selector
              v-model="transferForm.from_warehouse_id"
              :placeholder="labels.selectWarehouse"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="labels.toWarehouse" prop="to_warehouse_id">
            <warehouse-selector
              v-model="transferForm.to_warehouse_id"
              :placeholder="labels.selectWarehouse"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="labels.transferQty" prop="quantity">
            <el-input-number
              v-model="transferForm.quantity"
              :min="1"
              :max="999999"
              :placeholder="labels.transferQty"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="labels.unitCost">
            <el-input-number
              v-model="transferForm.unit_cost"
              :min="0"
              :precision="2"
              :placeholder="labels.unitCostPlaceholder"
              style="width: 100%"
            />
            <div class="form-tip">{{ labels.totalCost }}: {{ calculateTotalCost(transferForm.quantity, transferForm.unit_cost) }}</div>
          </el-form-item>
          <el-form-item :label="labels.referenceType">
            <el-input
              v-model="transferForm.reference_type"
              :placeholder="labels.referenceTypePlaceholder"
              clearable
            />
          </el-form-item>
          <el-form-item :label="labels.referenceNumber">
            <el-input
              v-model="transferForm.reference_number"
              :placeholder="labels.referenceNumberPlaceholder"
              clearable
            />
          </el-form-item>
          <el-form-item :label="labels.remark">
            <el-input
              v-model="transferForm.remark"
              type="textarea"
              :rows="3"
              :placeholder="labels.remarkPlaceholder"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="handleSubmitTransfer"
              :loading="submitting"
              size="large"
            >
              {{ labels.submitTransfer }}
            </el-button>
            <el-button @click="handleChangeType" size="large">{{ labels.cancel }}</el-button>
          </el-form-item>
        </el-form>

        <!-- 普通流水表单 -->
        <el-form
          v-else
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
        >
          <el-form-item :label="labels.sku" prop="sku_id">
            <el-input-number
              v-model="form.sku_id"
              :min="1"
              :placeholder="labels.skuPlaceholder"
              style="width: 100%"
            />
            <div class="form-tip">{{ labels.skuTip }}</div>
          </el-form-item>
          <el-form-item :label="labels.warehouse" prop="warehouse_id">
            <warehouse-selector
              v-model="form.warehouse_id"
              :placeholder="labels.selectWarehouse"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="labels.quantity" prop="quantity">
            <el-input-number
              v-model="form.quantity"
              :min="getQuantityMin()"
              :max="999999"
              :placeholder="getQuantityPlaceholder()"
              style="width: 100%"
            />
            <div class="form-tip">{{ getQuantityTip() }}</div>
          </el-form-item>
          <el-form-item :label="labels.unitCost">
            <el-input-number
              v-model="form.unit_cost"
              :min="0"
              :precision="2"
              :placeholder="labels.unitCostPlaceholder"
              style="width: 100%"
            />
            <div class="form-tip">{{ labels.totalCost }}: {{ calculateTotalCost(form.quantity, form.unit_cost) }}</div>
          </el-form-item>
          <el-form-item :label="labels.referenceType">
            <el-input
              v-model="form.reference_type"
              :placeholder="getReferenceTypePlaceholder()"
              clearable
            />
          </el-form-item>
          <el-form-item :label="labels.referenceNumber">
            <el-input
              v-model="form.reference_number"
              :placeholder="labels.referenceNumberPlaceholderPo"
              clearable
            />
          </el-form-item>
          <el-form-item :label="labels.referenceId">
            <el-input-number
              v-model="form.reference_id"
              :min="1"
              :placeholder="labels.referenceIdPlaceholder"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="labels.operatedAt">
            <el-date-picker
              v-model="form.operated_at"
              type="datetime"
              :placeholder="labels.operatedAtPlaceholder"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
            <div class="form-tip">{{ labels.operatedAtTip }}</div>
          </el-form-item>
          <el-form-item :label="labels.remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              :placeholder="labels.remarkPlaceholder"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="handleSubmit"
              :loading="submitting"
              size="large"
            >
              {{ labels.submit }}
            </el-button>
            <el-button @click="handleChangeType" size="large">{{ labels.cancel }}</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import {
  recordPurchaseReceipt,
  recordSalesShipment,
  recordStockTake,
  recordManualAdjustment,
  recordDamageWriteOff,
  recordReturnReceipt,
  recordTransfer
} from '../api'
import type { MovementType, CreateMovementParams, CreateTransferParams } from '../types'
import { MOVEMENT_TYPE_CONFIG } from '../types'
import WarehouseSelector from '../components/WarehouseSelector.vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const router = useRouter()
const localeStore = useLocaleStore()

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Create Inventory Movement',
      back: 'Back',
      selectType: 'Select movement type:',
      currentType: 'Current type',
      changeType: 'Change',
      sku: 'SKU',
      skuPlaceholder: 'Enter SKU ID',
      skuTip: 'No SKU selector available. Enter SKU ID.',
      fromWarehouse: 'From Warehouse',
      toWarehouse: 'To Warehouse',
      warehouse: 'Warehouse',
      selectWarehouse: 'Select warehouse',
      quantity: 'Quantity',
      transferQty: 'Transfer quantity',
      quantityPlaceholder: 'Enter quantity',
      quantityOutPlaceholder: 'Enter quantity (negative for outbound)',
      quantityAdjustPlaceholder: 'Enter quantity (+increase, -decrease)',
      quantityInPlaceholder: 'Enter quantity (positive for inbound)',
      unitCost: 'Unit Cost',
      unitCostPlaceholder: 'Optional, for costing',
      totalCost: 'Total cost',
      referenceType: 'Reference Type',
      referenceTypePlaceholder: 'e.g. Transfer Order',
      referenceNumber: 'Reference Number',
      referenceNumberPlaceholder: 'e.g. TO-20260113-001',
      referenceNumberPlaceholderPo: 'e.g. PO-20260113-001',
      referenceId: 'Reference ID',
      referenceIdPlaceholder: 'Optional',
      operatedAt: 'Operated At',
      operatedAtPlaceholder: 'Select time',
      operatedAtTip: 'Defaults to current time',
      remark: 'Remark',
      remarkPlaceholder: 'Enter remark',
      submitTransfer: 'Submit Transfer',
      submit: 'Submit',
      cancel: 'Cancel',
      inboundMustPositive: 'Inbound quantity must be positive',
      outboundMustNegative: 'Outbound quantity must be negative (e.g. -10)',
      unsupportedType: 'Unsupported movement type',
      createSuccess: 'Movement created',
      createFail: 'Create movement failed',
      transferSameWarehouse: 'From and to warehouses cannot be the same',
      transferCreateSuccess: 'Transfer created',
      transferCreateFail: 'Create transfer failed',
      quantityTipInbound: 'Inbound quantity must be positive',
      quantityTipOutbound: 'Outbound quantity must be negative (e.g. -10)',
      quantityTipAdjust: 'Positive increases, negative decreases'
    }
  }
  return {
    title: '创建库存流水',
    back: '返回列表',
    selectType: '请选择流水类型:',
    currentType: '当前流水类型',
    changeType: '更换类型',
    sku: 'SKU',
    skuPlaceholder: '请输入SKU ID',
    skuTip: '暂无SKU选择器,请输入SKU ID',
    fromWarehouse: '源仓库',
    toWarehouse: '目标仓库',
    warehouse: '仓库',
    selectWarehouse: '选择仓库',
    quantity: '数量',
    transferQty: '调拨数量',
    quantityPlaceholder: '请输入数量',
    quantityOutPlaceholder: '请输入数量(负数表示出库)',
    quantityAdjustPlaceholder: '请输入数量(正数增加,负数减少)',
    quantityInPlaceholder: '请输入数量(正数表示入库)',
    unitCost: '单价',
    unitCostPlaceholder: '可选,用于成本核算',
    totalCost: '总成本',
    referenceType: '关联单据类型',
    referenceTypePlaceholder: '如: 调拨单',
    referenceNumber: '关联单据号',
    referenceNumberPlaceholder: '如: TO-20260113-001',
    referenceNumberPlaceholderPo: '如: PO-20260113-001',
    referenceId: '关联单据ID',
    referenceIdPlaceholder: '可选',
    operatedAt: '操作时间',
    operatedAtPlaceholder: '选择操作时间',
    operatedAtTip: '默认为当前时间',
    remark: '备注',
    remarkPlaceholder: '请输入备注信息',
    submitTransfer: '提交调拨流水',
    submit: '提交流水',
    cancel: '取消',
    inboundMustPositive: '入库数量必须为正数',
    outboundMustNegative: '出库数量必须为负数(如: -10)',
    unsupportedType: '不支持的流水类型',
    createSuccess: '流水创建成功',
    createFail: '创建流水失败',
    transferSameWarehouse: '源仓库和目标仓库不能相同',
    transferCreateSuccess: '调拨流水创建成功',
    transferCreateFail: '创建调拨流水失败',
    quantityTipInbound: '入库数量必须为正数',
    quantityTipOutbound: '出库数量必须为负数(如: -10)',
    quantityTipAdjust: '正数表示增加库存,负数表示减少库存'
  }
})

const movementTypeLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      PURCHASE_RECEIPT: 'Purchase Receipt',
      SALES_SHIPMENT: 'Sales Shipment',
      STOCK_TAKE_ADJUSTMENT: 'Stock Take Adjustment',
      MANUAL_ADJUSTMENT: 'Manual Adjustment',
      DAMAGE_WRITE_OFF: 'Damage Write-off',
      RETURN_RECEIPT: 'Return Receipt',
      TRANSFER_OUT: 'Transfer Out',
      TRANSFER_IN: 'Transfer In',
      PURCHASE_SHIP: 'Purchase Ship',
      WAREHOUSE_RECEIVE: 'Warehouse Receive',
      INSPECTION_PASS: 'Inspection Pass',
      INSPECTION_FAIL: 'Inspection Fail',
      ASSEMBLY_COMPLETE: 'Assembly Complete',
      LOGISTICS_SHIP: 'Logistics Ship',
      PLATFORM_RECEIVE: 'Platform Receive',
      RETURN_INSPECT: 'Return Inspect'
    }
  }
  return {
    PURCHASE_RECEIPT: '采购入库',
    SALES_SHIPMENT: '销售出库',
    STOCK_TAKE_ADJUSTMENT: '盘点调整',
    MANUAL_ADJUSTMENT: '手工调整',
    DAMAGE_WRITE_OFF: '损坏报损',
    RETURN_RECEIPT: '退货入库',
    TRANSFER_OUT: '调拨出库',
    TRANSFER_IN: '调拨入库',
    PURCHASE_SHIP: '供应商发货',
    WAREHOUSE_RECEIVE: '到仓收货',
    INSPECTION_PASS: '质检通过',
    INSPECTION_FAIL: '质检不合格',
    ASSEMBLY_COMPLETE: '组装完成',
    LOGISTICS_SHIP: '物流发货',
    PLATFORM_RECEIVE: '平台上架',
    RETURN_INSPECT: '退货质检'
  }
})

// 当前选择的类型
const selectedType = ref<MovementType | null>(null)

// 是否为调拨类型
const isTransferType = computed(() => {
  return selectedType.value === 'TRANSFER_OUT' || selectedType.value === 'TRANSFER_IN'
})

const getMovementTypeLabel = (type: MovementType) => {
  return (movementTypeLabels.value as Record<string, string>)[type] || type
}

// 普通流水表单
const formRef = ref<FormInstance>()
const form = reactive<CreateMovementParams>({
  sku_id: 0,
  warehouse_id: 0,
  quantity: 0,
  reference_type: '',
  reference_id: undefined,
  reference_number: '',
  unit_cost: undefined,
  remark: '',
  operator_id: undefined,
  operated_at: ''
})

// 调拨流水表单
const transferFormRef = ref<FormInstance>()
const transferForm = reactive<CreateTransferParams>({
  sku_id: 0,
  from_warehouse_id: 0,
  to_warehouse_id: 0,
  quantity: 0,
  unit_cost: undefined,
  remark: '',
  operator_id: undefined,
  reference_type: '',
  reference_number: ''
})

// 提交状态
const submitting = ref(false)

// 表单验证规则
const rules = computed<FormRules>(() => ({
  sku_id: [{ required: true, message: labels.value.skuPlaceholder, trigger: 'blur' }],
  warehouse_id: [{ required: true, message: labels.value.selectWarehouse, trigger: 'change' }],
  quantity: [
    { required: true, message: labels.value.quantityPlaceholder, trigger: 'blur' },
    {
      type: 'number',
      message: localeStore.isEnglish ? 'Quantity must be a number' : '数量必须为数字',
      trigger: 'blur'
    }
  ]
}))

const transferRules = computed<FormRules>(() => ({
  sku_id: [{ required: true, message: labels.value.skuPlaceholder, trigger: 'blur' }],
  from_warehouse_id: [{ required: true, message: labels.value.fromWarehouse, trigger: 'change' }],
  to_warehouse_id: [{ required: true, message: labels.value.toWarehouse, trigger: 'change' }],
  quantity: [
    { required: true, message: labels.value.transferQty, trigger: 'blur' },
    {
      type: 'number',
      min: 1,
      message: localeStore.isEnglish ? 'Transfer quantity must be > 0' : '调拨数量必须大于0',
      trigger: 'blur'
    }
  ]
}))

// 获取类型描述
const getTypeDescription = (type: MovementType) => {
  if (localeStore.isEnglish) {
    const descriptions: Record<string, string> = {
      PURCHASE_RECEIPT: 'Inbound from supplier, increases stock',
      SALES_SHIPMENT: 'Outbound to customer, decreases stock',
      STOCK_TAKE_ADJUSTMENT: 'Stock take adjustment, +/- stock',
      MANUAL_ADJUSTMENT: 'Manual adjustment to fix errors',
      DAMAGE_WRITE_OFF: 'Write off damaged items',
      RETURN_RECEIPT: 'Customer return, increases stock',
      TRANSFER_OUT: 'Transfer out from source warehouse',
      TRANSFER_IN: 'Transfer in to target warehouse',
      PURCHASE_SHIP: 'Supplier shipped, add to in-transit',
      WAREHOUSE_RECEIVE: 'Arrived at warehouse, pending inspection',
      INSPECTION_PASS: 'Inspection passed, to raw material',
      INSPECTION_FAIL: 'Inspection failed, to damaged',
      ASSEMBLY_COMPLETE: 'Assembly done, pending shipment',
      LOGISTICS_SHIP: 'Shipped via logistics',
      PLATFORM_RECEIVE: 'Listed on platform, sellable',
      RETURN_INSPECT: 'Inspect returned items'
    }
    return descriptions[type] || ''
  }
  const descriptions: Record<string, string> = {
    PURCHASE_RECEIPT: '从供应商采购入库,增加库存',
    SALES_SHIPMENT: '销售出库给客户,减少库存',
    STOCK_TAKE_ADJUSTMENT: '盘点后调整库存,可增可减',
    MANUAL_ADJUSTMENT: '手工调整库存,修正错误',
    DAMAGE_WRITE_OFF: '损坏产品报损,减少库存',
    RETURN_RECEIPT: '客户退货入库,增加库存',
    TRANSFER_OUT: '从源仓库调拨出库',
    TRANSFER_IN: '调拨入目标仓库',
    PURCHASE_SHIP: '供应商发货,增加采购在途',
    WAREHOUSE_RECEIVE: '货物到仓,转入待检库存',
    INSPECTION_PASS: '质检通过,转入原料库存',
    INSPECTION_FAIL: '质检不合格,转入损坏库存',
    ASSEMBLY_COMPLETE: '组装完成,转入待出库存',
    LOGISTICS_SHIP: '物流发货,转入物流在途',
    PLATFORM_RECEIVE: '平台上架,转入可售库存',
    RETURN_INSPECT: '退货质检,分流至待检或损坏'
  }
  return descriptions[type] || ''
}

// 获取数量最小值
const getQuantityMin = () => {
  if (!selectedType.value) return 0
  // 出库类型数量为负数
  if (['SALES_SHIPMENT', 'DAMAGE_WRITE_OFF'].includes(selectedType.value)) {
    return -999999
  }
  // 调整类型可以为负数
  if (['STOCK_TAKE_ADJUSTMENT', 'MANUAL_ADJUSTMENT'].includes(selectedType.value)) {
    return -999999
  }
  // 入库类型数量为正数
  return 1
}

// 获取数量占位符
const getQuantityPlaceholder = () => {
  if (!selectedType.value) return labels.value.quantityPlaceholder
  if (['SALES_SHIPMENT', 'DAMAGE_WRITE_OFF'].includes(selectedType.value)) {
    return labels.value.quantityOutPlaceholder
  }
  if (['STOCK_TAKE_ADJUSTMENT', 'MANUAL_ADJUSTMENT'].includes(selectedType.value)) {
    return labels.value.quantityAdjustPlaceholder
  }
  return labels.value.quantityInPlaceholder
}

// 获取数量提示
const getQuantityTip = () => {
  if (!selectedType.value) return ''
  if (['PURCHASE_RECEIPT', 'RETURN_RECEIPT'].includes(selectedType.value)) {
    return labels.value.quantityTipInbound
  }
  if (['SALES_SHIPMENT', 'DAMAGE_WRITE_OFF'].includes(selectedType.value)) {
    return labels.value.quantityTipOutbound
  }
  if (['STOCK_TAKE_ADJUSTMENT', 'MANUAL_ADJUSTMENT'].includes(selectedType.value)) {
    return labels.value.quantityTipAdjust
  }
  return ''
}

// 获取关联单据类型占位符
const getReferenceTypePlaceholder = () => {
  if (!selectedType.value) return labels.value.referenceIdPlaceholder
  const placeholders: Record<MovementType, string> = {
    PURCHASE_RECEIPT: localeStore.isEnglish ? 'e.g. Purchase Order' : '如: 采购单',
    SALES_SHIPMENT: localeStore.isEnglish ? 'e.g. Sales Order' : '如: 销售订单',
    STOCK_TAKE_ADJUSTMENT: localeStore.isEnglish ? 'e.g. Stock Take' : '如: 盘点单',
    MANUAL_ADJUSTMENT: localeStore.isEnglish ? 'e.g. Adjustment' : '如: 调整单',
    DAMAGE_WRITE_OFF: localeStore.isEnglish ? 'e.g. Damage Order' : '如: 报损单',
    RETURN_RECEIPT: localeStore.isEnglish ? 'e.g. Return Order' : '如: 退货单',
    TRANSFER_OUT: localeStore.isEnglish ? 'e.g. Transfer Order' : '如: 调拨单',
    TRANSFER_IN: localeStore.isEnglish ? 'e.g. Transfer Order' : '如: 调拨单'
  }
  return placeholders[selectedType.value] || labels.value.referenceIdPlaceholder
}

// 计算总成本
const calculateTotalCost = (quantity: number | undefined, unitCost: number | undefined) => {
  if (!quantity || !unitCost) return '¥0.00'
  const total = Math.abs(quantity) * unitCost
  return `¥${total.toFixed(2)}`
}

// 选择流水类型
const handleSelectType = (type: MovementType) => {
  // 调拨类型特殊处理
  if (type === 'TRANSFER_OUT' || type === 'TRANSFER_IN') {
    selectedType.value = 'TRANSFER_OUT' // 统一使用调拨功能
  } else {
    selectedType.value = type
  }
}

// 更换类型
const handleChangeType = () => {
  selectedType.value = null
  // 重置表单
  Object.assign(form, {
    sku_id: 0,
    warehouse_id: 0,
    quantity: 0,
    reference_type: '',
    reference_id: undefined,
    reference_number: '',
    unit_cost: undefined,
    remark: '',
    operator_id: undefined,
    operated_at: ''
  })
  Object.assign(transferForm, {
    sku_id: 0,
    from_warehouse_id: 0,
    to_warehouse_id: 0,
    quantity: 0,
    unit_cost: undefined,
    remark: '',
    operator_id: undefined,
    reference_type: '',
    reference_number: ''
  })
}

// 提交普通流水
const handleSubmit = async () => {
  if (!formRef.value || !selectedType.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    // 验证数量的正负
    if (['PURCHASE_RECEIPT', 'RETURN_RECEIPT'].includes(selectedType.value!)) {
      if (form.quantity <= 0) {
        ElMessage.error(labels.value.inboundMustPositive)
        return
      }
    } else if (['SALES_SHIPMENT', 'DAMAGE_WRITE_OFF'].includes(selectedType.value!)) {
      if (form.quantity >= 0) {
        ElMessage.error(labels.value.outboundMustNegative)
        return
      }
    }

    submitting.value = true
    try {
      const apiMap = {
        PURCHASE_RECEIPT: recordPurchaseReceipt,
        SALES_SHIPMENT: recordSalesShipment,
        STOCK_TAKE_ADJUSTMENT: recordStockTake,
        MANUAL_ADJUSTMENT: recordManualAdjustment,
        DAMAGE_WRITE_OFF: recordDamageWriteOff,
        RETURN_RECEIPT: recordReturnReceipt
      }

      const apiFunc = apiMap[selectedType.value as keyof typeof apiMap]
      if (!apiFunc) {
        ElMessage.error(labels.value.unsupportedType)
        return
      }

      await apiFunc(form)
      ElMessage.success(labels.value.createSuccess)
      router.push('/inventory/movements')
    } catch (error: any) {
      console.error('Failed to create movement:', error)
      ElMessage.error(error.response?.data?.message || labels.value.createFail)
    } finally {
      submitting.value = false
    }
  })
}

// 提交调拨流水
const handleSubmitTransfer = async () => {
  if (!transferFormRef.value) return

  await transferFormRef.value.validate(async (valid) => {
    if (!valid) return

    // 验证源仓库和目标仓库不能相同
    if (transferForm.from_warehouse_id === transferForm.to_warehouse_id) {
      ElMessage.error(labels.value.transferSameWarehouse)
      return
    }

    submitting.value = true
    try {
      await recordTransfer(transferForm)
      ElMessage.success(labels.value.transferCreateSuccess)
      router.push('/inventory/movements')
    } catch (error: any) {
      console.error('Failed to create transfer:', error)
      ElMessage.error(error.response?.data?.message || labels.value.transferCreateFail)
    } finally {
      submitting.value = false
    }
  })
}

// 返回列表
const handleBack = () => {
  router.push('/inventory/movements')
}
</script>

<style scoped>
.movement-create {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 18px;
  font-weight: bold;
}

.type-selection {
  padding: 20px;
}

.type-card {
  cursor: pointer;
  text-align: center;
  padding: 20px;
  transition: all 0.3s;
}

.type-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.type-card-transfer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.type-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.type-label {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.type-description {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.type-card-transfer .type-description {
  color: rgba(255, 255, 255, 0.8);
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
