<template>
  <aside class="shipment-form-aside">
    <div class="summary-panel">
      <div class="summary-panel-header">
        <h3 class="summary-panel-title">发货摘要</h3>
        <p class="summary-panel-subtitle">关键结果集中看，减少来回滚动。</p>
      </div>

      <div class="summary-grid">
        <div class="summary-tile">
          <div class="summary-tile-label">产品数</div>
          <div class="summary-tile-value">{{ form.items.length }}</div>
        </div>
        <div class="summary-tile">
          <div class="summary-tile-label">计划数量</div>
          <div class="summary-tile-value">{{ totalQuantity }}</div>
        </div>
        <div class="summary-tile">
          <div class="summary-tile-label">箱数</div>
          <div class="summary-tile-value">{{ packageSummary.boxCount }}</div>
        </div>
        <div class="summary-tile">
          <div class="summary-tile-label">总重量</div>
          <div class="summary-tile-value">
            {{ packageSummary.totalWeight.toFixed(2) }}<span class="unit">kg</span>
          </div>
        </div>
        <div class="summary-tile">
          <div class="summary-tile-label">总体积</div>
          <div class="summary-tile-value">
            {{ packageSummary.totalVolume.toFixed(4) }}<span class="unit">m³</span>
          </div>
        </div>
        <div class="summary-tile">
          <div class="summary-tile-label">包材成本</div>
          <div class="summary-tile-value">
            {{ totalPackagingCost.toFixed(2) }}<span class="unit">CNY</span>
          </div>
        </div>
      </div>

      <div class="summary-block-panel">
        <div class="summary-block-title">目的地信息</div>
        <div class="summary-line">
          <span class="summary-line-label">收货方</span>
          <span class="summary-line-value">{{ form.destination_name || '-' }}</span>
        </div>
        <div class="summary-line">
          <span class="summary-line-label">目的地仓库</span>
          <span class="summary-line-value">{{ destinationWarehouseSummary || '-' }}</span>
        </div>
        <div class="summary-line">
          <span class="summary-line-label">目的地代码</span>
          <span class="summary-line-value">{{ form.destination_code || '-' }}</span>
        </div>
        <div class="summary-line">
          <span class="summary-line-label">收货类型</span>
          <span class="summary-line-value">{{ destinationTypeLabel }}</span>
        </div>
        <div class="summary-line">
          <span class="summary-line-label">收货地址</span>
          <span class="summary-line-value summary-line-value--multiline">
            {{ form.destination_address || '-' }}
          </span>
        </div>
      </div>

      <div class="summary-block-panel">
        <div class="summary-block-title">物流信息</div>
        <div class="summary-line">
          <span class="summary-line-label">报价</span>
          <span class="summary-line-value">{{ shippingRate?.provider?.provider_name || '未选择' }}</span>
        </div>
        <div v-if="shippingRate" class="summary-line">
          <span class="summary-line-label">运输方式</span>
          <span class="summary-line-value">
            {{ transportModeConfig[shippingRate.transport_mode]?.label || '-' }}
          </span>
        </div>
        <div v-if="shippingRate" class="summary-line">
          <span class="summary-line-label">费率</span>
          <span class="summary-line-value">
            {{ shippingRate.base_rate }} {{ shippingRate.currency }}/{{ pricingMethodConfig[shippingRate.pricing_method]?.label }}
          </span>
        </div>
        <div class="summary-line">
          <span class="summary-line-label">承运商</span>
          <span class="summary-line-value">{{ form.carrier || '-' }}</span>
        </div>
        <div class="summary-line">
          <span class="summary-line-label">预计发货</span>
          <span class="summary-line-value">{{ form.expected_ship_date || '-' }}</span>
        </div>
        <div class="summary-line">
          <span class="summary-line-label">预计到达</span>
          <span class="summary-line-value">{{ form.expected_delivery_date || '-' }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  form: Record<string, any>
  totalQuantity: number
  packageSummary: { boxCount: number; totalWeight: number; totalVolume: number }
  totalPackagingCost: number
  destinationWarehouseSummary: string
  destinationTypeLabel: string
  shippingRate: any | null
  transportModeConfig: Record<string, any>
  pricingMethodConfig: Record<string, any>
}>()
</script>

<style scoped>
.shipment-form-aside {
  position: sticky;
  top: 24px;
}

.summary-panel {
  border: 1px solid #dbe3ef;
  border-radius: 18px;
  padding: 20px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.summary-panel-header {
  margin-bottom: 18px;
}

.summary-panel-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
  font-weight: 700;
  color: #1f2937;
}

.summary-panel-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.summary-tile {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.summary-tile-label {
  font-size: 12px;
  color: #6b7280;
}

.summary-tile-value {
  margin-top: 6px;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  color: #111827;
}

.unit {
  margin-left: 4px;
  font-size: 11px;
  color: #6b7280;
}

.summary-block-panel {
  margin-top: 16px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.summary-block-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.summary-line {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.summary-line:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.summary-line-label {
  font-size: 12px;
  color: #6b7280;
}

.summary-line-value {
  font-size: 13px;
  line-height: 1.6;
  color: #111827;
  text-align: right;
}

.summary-line-value--multiline {
  text-align: left;
  word-break: break-word;
}
</style>
