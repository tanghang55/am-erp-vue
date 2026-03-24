<template>
  <section class="section-card">
    <div class="section-header">
      <div>
        <h3 class="section-title">{{ labels.shippingInfo }}</h3>
        <p class="section-subtitle">先选报价，再补承运信息和预计时效。</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-form-item label="运费报价" prop="shipping_rate_id">
          <el-select
            v-model="form.shipping_rate_id"
            placeholder="请选择运费报价（自动带出供应商、服务等信息）"
            clearable
            filterable
            :disabled="disabled"
            loading-text="加载报价中..."
            :loading="loadingRates"
            style="width: 100%"
            @change="emit('rate-change', $event)"
          >
            <el-option
              v-for="rate in availableRates"
              :key="rate.id"
              :label="formatRateLabel(rate)"
              :value="rate.id"
            >
              <div class="rate-option">
                <div class="rate-option-main">
                  <span class="rate-option-provider">{{ rate.provider?.provider_name }}</span>
                  <span class="rate-option-meta">
                    {{ transportModeConfig[rate.transport_mode]?.icon }}
                    {{ transportModeConfig[rate.transport_mode]?.label }}
                  </span>
                  <span v-if="rate.service?.service_name" class="rate-option-service">
                    {{ rate.service.service_name }}
                  </span>
                </div>
                <div class="rate-option-price">
                  {{ rate.base_rate }} {{ rate.currency }}/{{ pricingMethodConfig[rate.pricing_method]?.label }}
                  <span v-if="rate.transit_days" class="rate-option-days">
                    {{ rate.transit_days }}天
                  </span>
                </div>
              </div>
            </el-option>
          </el-select>
          <div
            v-if="rateHelperMessage"
            :class="['field-status', `field-status--${rateHelperTone}`]"
          >
            {{ rateHelperMessage }}
          </div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row v-if="shippingRate" :gutter="20">
      <el-col :span="24">
        <div class="rate-card">
          <div class="rate-card-header">
            <div class="rate-card-title">
              <i class="el-icon-box rate-card-icon"></i>
              <span>运费报价详情</span>
            </div>
            <el-tag type="success" size="small">已选中</el-tag>
          </div>

          <div class="rate-card-body">
            <div class="rate-grid">
              <div class="rate-field">
                <div class="rate-field-label">承运商</div>
                <div class="rate-field-value">{{ shippingRate.provider?.provider_name || '-' }}</div>
              </div>
              <div class="rate-field">
                <div class="rate-field-label">运输方式</div>
                <div class="rate-field-value">
                  {{ transportModeConfig[shippingRate.transport_mode]?.icon }}
                  {{ transportModeConfig[shippingRate.transport_mode]?.label }}
                </div>
              </div>
              <div class="rate-field" v-if="shippingRate.service?.service_name">
                <div class="rate-field-label">服务类型</div>
                <div class="rate-field-value">{{ shippingRate.service.service_name }}</div>
              </div>
              <div class="rate-field rate-field-primary">
                <div class="rate-field-label">基础运费</div>
                <div class="rate-field-value rate-price">
                  {{ shippingRate.base_rate }} {{ shippingRate.currency }}
                  <span class="rate-unit">/ {{ pricingMethodConfig[shippingRate.pricing_method]?.label }}</span>
                </div>
              </div>
              <div class="rate-field" v-if="shippingRate.other_fee && shippingRate.other_fee > 0">
                <div class="rate-field-label">其他费用</div>
                <div class="rate-field-value">{{ shippingRate.other_fee }} {{ shippingRate.currency }}</div>
              </div>
              <div class="rate-field" v-if="shippingRate.min_weight">
                <div class="rate-field-label">最小起送量</div>
                <div class="rate-field-value">{{ shippingRate.min_weight }} kg</div>
              </div>
              <div class="rate-field" v-if="shippingRate.transit_days">
                <div class="rate-field-label">运输时效</div>
                <div class="rate-field-value">
                  {{ shippingRate.transit_days }} 天
                  <span v-if="form.expected_delivery_date" class="rate-hint">
                    预计 {{ form.expected_delivery_date }} 到达
                  </span>
                </div>
              </div>
              <div class="rate-field rate-field-span-2">
                <div class="rate-field-label">报价有效期</div>
                <div class="rate-field-value">
                  {{ shippingRate.effective_date }} ~ {{ shippingRate.expiry_date || '长期有效' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="labels.carrier">
          <el-input
            v-model="form.carrier"
            :placeholder="labels.carrierPlaceholder"
            :disabled="disabled"
            clearable
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="labels.trackingNumber">
          <el-input
            v-model="form.tracking_number"
            :placeholder="labels.trackingNumberPlaceholder"
            :disabled="disabled"
            clearable
          />
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
            :disabled="disabled"
            style="width: 100%"
            value-format="YYYY-MM-DD"
            @change="emit('expected-ship-date-change')"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="labels.expectedDeliveryDate">
          <el-date-picker
            v-model="form.expected_delivery_date"
            type="date"
            :placeholder="labels.expectedDeliveryDatePlaceholder"
            :disabled="disabled"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
          <div
            v-if="form.expected_delivery_date && shippingRate?.transit_days"
            class="field-status field-status--success"
          >
            已基于运输时效自动计算
          </div>
        </el-form-item>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  form: Record<string, any>
  labels: Record<string, string>
  availableRates: any[]
  loadingRates: boolean
  shippingRate: any | null
  rateHelperMessage: string
  rateHelperTone: string
  transportModeConfig: Record<string, any>
  pricingMethodConfig: Record<string, any>
  formatRateLabel: (rate: any) => string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'rate-change': [value: number | null]
  'expected-ship-date-change': []
}>()
</script>

<style scoped>
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

.field-status {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
}

.field-status--success {
  color: #16a34a;
}

.field-status--warning {
  color: #d97706;
}

.field-status--danger {
  color: #dc2626;
}

.field-status--muted {
  color: #6b7280;
}

.rate-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #f9fafb;
  overflow: hidden;
}

.rate-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.rate-card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.rate-card-icon {
  margin-right: 8px;
  color: #67c23a;
}

.rate-card-body {
  padding: 20px;
}

.rate-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.rate-option-main {
  min-width: 0;
}

.rate-option-provider {
  font-weight: 600;
}

.rate-option-meta,
.rate-option-service,
.rate-option-days {
  margin-left: 8px;
  font-size: 12px;
}

.rate-option-meta,
.rate-option-days {
  color: #909399;
}

.rate-option-service {
  color: #409eff;
}

.rate-option-price {
  color: #67c23a;
  font-weight: 600;
  white-space: nowrap;
}

.rate-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.rate-field {
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  height: 100%;
}

.rate-field-span-2 {
  grid-column: span 2;
}

.rate-field-primary {
  border-color: #67c23a;
  background: #f0f9ff;
}

.rate-field-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.rate-field-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.rate-price {
  font-size: 18px;
  color: #67c23a;
}

.rate-unit {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
  margin-left: 4px;
}

.rate-hint {
  font-size: 12px;
  font-weight: normal;
  color: #67c23a;
  margin-left: 8px;
}

@media (max-width: 768px) {
  .rate-grid {
    grid-template-columns: 1fr;
  }

  .rate-field-span-2 {
    grid-column: span 1;
  }

  .rate-option {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
