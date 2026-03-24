<template>
  <section class="section-card">
    <div class="section-header">
      <div>
        <h3 class="section-title">{{ labels.destinationInfo }}</h3>
        <p class="section-subtitle">目的地仓库、收货方身份和联系信息在这里一次补齐。</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="labels.destinationWarehouse">
        <WarehouseSelector
            v-model="form.destination_warehouse_id"
            :placeholder="labels.destinationWarehousePlaceholder"
            :disabled="disabled"
            style="width: 100%"
            @change="emit('destination-warehouse-change', $event)"
          />
          <div
            v-if="destinationWarehouseHelperMessage"
            :class="['field-status', `field-status--${destinationWarehouseHelperTone}`]"
          >
            {{ destinationWarehouseHelperMessage }}
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="labels.destinationType" prop="destination_type">
          <el-select
            v-model="form.destination_type"
            :placeholder="labels.destinationTypePlaceholder"
            :disabled="disabled"
            style="width: 100%"
            @change="emit('destination-type-change')"
          >
            <el-option label="平台仓库 (Amazon FBA等)" value="PLATFORM_WAREHOUSE" />
            <el-option label="客户" value="CUSTOMER" />
            <el-option label="自有仓库" value="OWN_WAREHOUSE" />
            <el-option label="供应商" value="SUPPLIER" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="labels.destinationName" prop="destination_name">
          <el-input
            v-model="form.destination_name"
            :placeholder="labels.destinationNamePlaceholder"
            :disabled="disabled"
            clearable
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="labels.destinationCode">
          <el-input
            v-model="form.destination_code"
            :placeholder="labels.destinationCodePlaceholder"
            :disabled="disabled"
            clearable
          />
          <span class="field-hint">{{ labels.destinationCodeHint }}</span>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="labels.destinationContact">
          <el-input
            v-model="form.destination_contact"
            :placeholder="labels.destinationContactPlaceholder"
            :disabled="disabled"
            clearable
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="labels.destinationPhone">
          <el-input
            v-model="form.destination_phone"
            :placeholder="labels.destinationPhonePlaceholder"
            :disabled="disabled"
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
            :disabled="disabled"
            :placeholder="labels.destinationAddressPlaceholder"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'

defineProps<{
  form: Record<string, any>
  labels: Record<string, string>
  destinationWarehouseHelperMessage: string
  destinationWarehouseHelperTone: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'destination-warehouse-change': [value: any]
  'destination-type-change': []
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

.field-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
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
</style>
