import { computed, ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getShippingRates } from '@/modules/logistics/api'
import { TRANSPORT_MODE_CONFIG } from '@/modules/logistics/types'
import type { ShippingRate } from '@/modules/logistics/types'
import type { Warehouse } from '@/modules/inventory/types'
import type { DestinationType } from '../types'

interface ShipmentRateFormModel {
  warehouse_id: number | null
  destination_warehouse_id: number | null
  destination_type: DestinationType
  destination_name: string
  destination_contact: string
  destination_phone: string
  destination_address: string
  logistics_provider_id: number | null
  transport_mode: string | null
  logistics_service_id: number | null
  shipping_rate_id: number | null
  expected_ship_date: string
  expected_delivery_date: string
}

export function useShipmentRateSelection(
  form: ShipmentRateFormModel,
  labels: Ref<Record<string, string>>
) {
  const shippingRate = ref<ShippingRate | null>(null)
  const availableRates = ref<ShippingRate[]>([])
  const loadingRates = ref(false)
  const destinationWarehouseSummary = ref('')
  const destinationWarehouseAutoFilled = ref(false)

  const destinationTypeLabel = computed(() => {
    const labelsMap: Record<DestinationType, string> = {
      PLATFORM_WAREHOUSE: '平台仓库',
      CUSTOMER: '客户',
      OWN_WAREHOUSE: '自有仓库',
      SUPPLIER: '供应商',
      OTHER: '其他'
    }
    return labelsMap[form.destination_type] || '-'
  })

  const destinationWarehouseHelperMessage = computed(() => {
    if (destinationWarehouseAutoFilled.value && form.destination_warehouse_id) {
      return '已自动填充收货方信息'
    }
    return labels.value.destinationWarehouseHint
  })

  const destinationWarehouseHelperTone = computed(() => {
    return destinationWarehouseAutoFilled.value && form.destination_warehouse_id ? 'success' : 'muted'
  })

  const rateHelperMessage = computed(() => {
    if (!form.warehouse_id || !form.destination_warehouse_id) {
      return '请先选择起点仓库和目的地仓库'
    }
    if (loadingRates.value) {
      return '正在加载可用报价'
    }
    if (form.shipping_rate_id) {
      return '已自动填充物流信息'
    }
    if (availableRates.value.length === 0) {
      return '暂无可用报价，请联系管理员添加'
    }
    return `当前可选 ${availableRates.value.length} 条报价`
  })

  const rateHelperTone = computed(() => {
    if (!form.warehouse_id || !form.destination_warehouse_id) {
      return 'danger'
    }
    if (loadingRates.value) {
      return 'muted'
    }
    if (form.shipping_rate_id) {
      return 'success'
    }
    if (availableRates.value.length === 0) {
      return 'warning'
    }
    return 'muted'
  })

  const loadAvailableRates = async () => {
    availableRates.value = []
    shippingRate.value = null
    form.shipping_rate_id = null
    form.logistics_provider_id = null
    form.transport_mode = null
    form.logistics_service_id = null

    if (!form.warehouse_id || !form.destination_warehouse_id) {
      return
    }

    loadingRates.value = true
    try {
      const res = await getShippingRates({
        origin_warehouse_id: form.warehouse_id,
        destination_warehouse_id: form.destination_warehouse_id,
        status: 'ACTIVE',
        page: 1,
        page_size: 100
      })

      availableRates.value = res.data?.data || (Array.isArray(res.data) ? res.data : [])
      if (availableRates.value.length === 0) {
        ElMessage.warning('暂无可用的运费报价，请联系管理员添加')
      }
    } catch (error: any) {
      console.error('加载运费报价失败:', error)
      if (!error._handled) {
        ElMessage.error('加载运费报价失败')
      }
    } finally {
      loadingRates.value = false
    }
  }

  const handleRateChange = (rateId: number | null) => {
    if (!rateId) {
      shippingRate.value = null
      form.logistics_provider_id = null
      form.transport_mode = null
      form.logistics_service_id = null
      return
    }

    const rate = availableRates.value.find((item) => item.id === rateId)
    if (!rate) return

    shippingRate.value = rate
    form.logistics_provider_id = rate.provider_id
    form.transport_mode = rate.transport_mode
    form.logistics_service_id = rate.service_id || null

    if (rate.transit_days && form.expected_ship_date) {
      const shipDate = new Date(form.expected_ship_date)
      shipDate.setDate(shipDate.getDate() + rate.transit_days)
      form.expected_delivery_date = shipDate.toISOString().split('T')[0]
    }

    ElMessage.success('已自动填充物流信息')
  }

  const formatRateLabel = (rate: ShippingRate) => {
    const parts: string[] = []
    if (rate.provider?.provider_name) {
      parts.push(rate.provider.provider_name)
    }
    if (rate.transport_mode) {
      parts.push(TRANSPORT_MODE_CONFIG[rate.transport_mode]?.label)
    }
    if (rate.service?.service_name) {
      parts.push(rate.service.service_name)
    }
    parts.push(`${rate.base_rate} ${rate.currency}`)
    return parts.join(' - ')
  }

  const handleDestinationWarehouseChange = async (warehouse: Warehouse | null) => {
    if (!warehouse) {
      availableRates.value = []
      shippingRate.value = null
      destinationWarehouseSummary.value = ''
      destinationWarehouseAutoFilled.value = false
      return
    }

    destinationWarehouseSummary.value = warehouse.warehouse_code
      ? `${warehouse.name}（${warehouse.warehouse_code}）`
      : warehouse.name
    destinationWarehouseAutoFilled.value = true
    form.destination_type = 'OWN_WAREHOUSE'
    form.destination_name = warehouse.name
    form.destination_contact = warehouse.contact_person || ''
    form.destination_phone = warehouse.contact_phone || ''
    form.destination_address = warehouse.address || ''

    ElMessage.success(`已自动填充 ${warehouse.name} 的收货方信息`)
    await loadAvailableRates()
  }

  const handleDestinationTypeChange = () => {
    if (form.destination_type !== 'OWN_WAREHOUSE') {
      destinationWarehouseSummary.value = ''
      destinationWarehouseAutoFilled.value = false
    }
  }

  return {
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
  }
}
