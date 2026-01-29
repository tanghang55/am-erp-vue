<template>
  <div class="shipment-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-page-header :content="labels.title" @back="handleBack" />
        </div>
      </template>

      <div v-loading="loading">
        <div v-if="shipment" class="summary-block">
          <div class="summary-title">
            <el-tag :type="SHIPMENT_STATUS_CONFIG[shipment.status]?.color">
              {{ SHIPMENT_STATUS_CONFIG[shipment.status]?.icon }}
              {{ getStatusLabel(shipment.status) }}
            </el-tag>
            <span class="summary-number">{{ shipment.shipment_number }}</span>
          </div>
          <el-descriptions :column="3" border>
            <el-descriptions-item :label="labels.orderNumber">
              {{ shipment.order_number || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.warehouse">
              {{ shipment.warehouse?.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.status">
              <el-tag :type="SHIPMENT_STATUS_CONFIG[shipment.status]?.color">
                {{ getStatusLabel(shipment.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="labels.carrier">
              {{ shipment.carrier || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.trackingNumber">
              {{ shipment.tracking_number || '-' }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.shippingCost">
              {{ shipment.currency }} {{ shipment.shipping_cost || 0 }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.shippedAt">
              {{ formatDateTime(shipment.ship_date) }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.deliveredAt">
              {{ formatDateTime(shipment.actual_delivery_date) }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.createdAt">
              {{ formatDateTime(shipment.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item :label="labels.remark" :span="3">
              {{ shipment.remark || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-table :data="shipment?.items || []" border stripe style="margin-top: 20px">
          <el-table-column label="" width="70">
            <template #default="{ row }">
              <el-image
                v-if="row.sku?.image_url"
                :src="row.sku.image_url"
                fit="cover"
                style="width: 50px; height: 50px"
              />
              <div v-else class="no-image">-</div>
            </template>
          </el-table-column>
          <el-table-column :label="labels.sku" min-width="220">
            <template #default="{ row }">
              <div class="sku-cell">
                <div class="sku-code">{{ row.sku?.seller_sku || row.sku_id }}</div>
                <div class="sku-title">{{ row.sku?.title || '-' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="labels.quantity" width="120" align="center">
            <template #default="{ row }">{{ row.quantity_planned }}</template>
          </el-table-column>
          <el-table-column :label="labels.unitCost" width="140" align="right">
            <template #default="{ row }">{{ row.currency }} {{ row.unit_cost }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getShipmentDetail } from '../api'
import type { Shipment, ShipmentStatus } from '../types'
import { SHIPMENT_STATUS_CONFIG } from '../types'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const router = useRouter()
const route = useRoute()
const localeStore = useLocaleStore()
const shipmentId = Number(route.params.id)

const shipment = ref<Shipment | null>(null)
const loading = ref(false)

const labels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      title: 'Shipment Detail',
      orderNumber: 'Order Number',
      warehouse: 'Warehouse',
      status: 'Status',
      carrier: 'Carrier',
      trackingNumber: 'Tracking Number',
      shippingCost: 'Shipping Cost',
      shippedAt: 'Shipped At',
      deliveredAt: 'Delivered At',
      createdAt: 'Created At',
      remark: 'Remark',
      sku: 'SKU',
      quantity: 'Quantity',
      unitCost: 'Unit Cost'
    }
  }
  return {
    title: '发货单详情',
    orderNumber: '订单号',
    warehouse: '仓库',
    status: '状态',
    carrier: '承运商',
    trackingNumber: '物流追踪号',
    shippingCost: '运费',
    shippedAt: '发货时间',
    deliveredAt: '送达时间',
    createdAt: '创建时间',
    remark: '备注',
    sku: 'SKU',
    quantity: '数量',
    unitCost: '单位成本'
  }
})

const statusLabels = computed(() => {
  if (localeStore.isEnglish) {
    return {
      DRAFT: 'Draft',
      CONFIRMED: 'Confirmed',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled'
    }
  }
  return {
    DRAFT: '草稿',
    CONFIRMED: '已确认',
    SHIPPED: '已发货',
    DELIVERED: '已送达',
    CANCELLED: '已取消'
  }
})

const getStatusLabel = (status: ShipmentStatus) => {
  return (statusLabels.value as Record<string, string>)[status] || status
}

const formatDateTime = (dateTime?: string) => {
  if (!dateTime) return '-'
  return dateTime.substring(0, 19).replace('T', ' ')
}

const loadDetail = async () => {
  if (!shipmentId) return
  loading.value = true
  try {
    const res = await getShipmentDetail(shipmentId)
    shipment.value = res.data || null
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.shipment-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
}

.summary-block {
  margin-bottom: 16px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.summary-number {
  font-weight: 600;
}

.sku-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sku-code {
  font-weight: 600;
}

.sku-title {
  color: #909399;
  font-size: 12px;
}

.no-image {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}
</style>
