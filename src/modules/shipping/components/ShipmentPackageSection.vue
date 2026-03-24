<template>
  <section class="section-card">
    <div class="section-header">
      <div>
        <h3 class="section-title">{{ labels.packageInfo }}</h3>
        <p class="section-subtitle">包装汇总和发货明细放在一起看，避免反复比对。</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item :label="labels.boxCount">
          <div class="summary-value">{{ packageSummary.boxCount }}</div>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="labels.totalWeight">
          <div class="summary-value">
            {{ packageSummary.totalWeight.toFixed(2) }} <span class="unit">kg</span>
          </div>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="labels.totalVolume">
          <div class="summary-value">
            {{ packageSummary.totalVolume.toFixed(4) }} <span class="unit">m³</span>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
    <div class="package-hint">* 包装信息根据产品明细中的装箱信息自动计算</div>

    <div class="section-header section-header--nested">
      <div>
        <h3 class="section-title">{{ labels.items }}</h3>
        <p class="section-subtitle">发货明细是核心区域，先选产品，再确认装箱规格和箱数。</p>
      </div>
    </div>
    <div class="package-hint package-hint--stock">* 发货只消耗待出库存，不会直接扣减原料库存</div>

    <div class="items-section">
      <el-button type="primary" size="small" class="add-product-button" :disabled="disabled" @click="emit('add-item')">
        <el-icon><Plus /></el-icon>
        {{ labels.addProduct }}
      </el-button>

      <el-table :data="form.items" border stripe>
        <el-table-column type="index" label="#" width="60" />
        <el-table-column label="产品" min-width="280">
          <template #default="{ row }">
            <div class="item-product-cell">
              <el-image
                v-if="row.product?.image_url"
                :src="getFullImageUrl(row.product.image_url)"
                :preview-src-list="[getFullImageUrl(row.product.image_url)]"
                fit="cover"
                class="item-product-image"
              />
              <div v-else class="item-product-image item-product-image--empty">-</div>
              <div class="item-product-meta">
                <div class="product-code">{{ row.product?.seller_sku || '-' }}</div>
                <div class="product-title">{{ row.product?.title || '-' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="labels.pendingShipment" width="110" align="center">
          <template #default="{ row }">
            <span :class="{ 'qty-warning': row.pending_shipment === 0 }">
              {{ row.pending_shipment ?? '-' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="装箱与数量" min-width="320">
          <template #default="{ row }">
            <div class="packing-editor">
              <el-select
                v-model="row.package_spec_id"
                placeholder="选择装箱规格"
                clearable
                :disabled="disabled"
                class="packing-editor-spec"
                @change="emit('package-spec-change', row)"
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

              <div class="packing-editor-meta">
                <div class="packing-editor-field">
                  <span class="packing-editor-label">{{ labels.boxQuantity }}</span>
                  <el-input-number
                    v-model="row.box_quantity"
                    :min="1"
                    :precision="0"
                    :controls="false"
                    :disabled="disabled"
                    class="packing-editor-input"
                    @change="emit('box-quantity-change', row)"
                  />
                </div>
                <div class="packing-editor-result">
                  <span class="packing-editor-label">{{ labels.quantityPlanned }}</span>
                  <span class="packing-editor-value">{{ calculateItemQuantity(row) }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="labels.itemRemark" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.remark" :placeholder="labels.itemRemarkPlaceholder" size="small" :disabled="disabled" />
          </template>
        </el-table-column>

        <el-table-column :label="labels.actions" width="100" fixed="right">
          <template #default="{ $index }">
            <el-button size="small" type="danger" :disabled="disabled" @click="emit('remove-item', $index)">
              {{ labels.remove }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </section>

  <section class="section-card">
    <div class="section-header">
      <div>
        <h3 class="section-title">包材消耗预估</h3>
        <p class="section-subtitle">区分产品包材和装箱包材，便于核对发货前消耗成本。</p>
      </div>
    </div>

    <div class="packaging-consumption-section">
      <div class="consumption-title">
        <span>产品包材消耗</span>
        <el-tag size="small" type="info">打包时消耗</el-tag>
      </div>

      <el-table v-if="productPackagingConsumption.length > 0" :data="productPackagingConsumption" border size="small">
        <el-table-column label="包材名称" min-width="150">
          <template #default="{ row }">{{ row.item_name }}</template>
        </el-table-column>
        <el-table-column label="规格" width="120">
          <template #default="{ row }">{{ row.specification || '-' }}</template>
        </el-table-column>
        <el-table-column label="单位" width="80" align="center">
          <template #default="{ row }">{{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="消耗数量" width="120" align="right">
          <template #default="{ row }">
            <span class="consumption-qty">{{ row.total_quantity.toFixed(3) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="100" align="right">
          <template #default="{ row }">{{ row.unit_cost.toFixed(2) }} {{ row.currency }}</template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="consumption-cost">{{ (row.total_quantity * row.unit_cost).toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无产品包材消耗" :image-size="60" />
    </div>

    <div class="packaging-consumption-section packaging-consumption-section--spaced">
      <div class="consumption-title">
        <span>装箱包材消耗</span>
        <el-tag size="small" type="warning">发货时消耗</el-tag>
      </div>

      <el-table v-if="boxPackagingConsumption.length > 0" :data="boxPackagingConsumption" border size="small">
        <el-table-column label="包材名称" min-width="150">
          <template #default="{ row }">{{ row.item_name }}</template>
        </el-table-column>
        <el-table-column label="规格" width="120">
          <template #default="{ row }">{{ row.specification || '-' }}</template>
        </el-table-column>
        <el-table-column label="单位" width="80" align="center">
          <template #default="{ row }">{{ row.unit }}</template>
        </el-table-column>
        <el-table-column label="消耗数量" width="120" align="right">
          <template #default="{ row }">
            <span class="consumption-qty">{{ row.total_quantity.toFixed(3) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="100" align="right">
          <template #default="{ row }">{{ row.unit_cost.toFixed(2) }} {{ row.currency }}</template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="consumption-cost">{{ (row.total_quantity * row.unit_cost).toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无装箱包材消耗" :image-size="60" />
    </div>

    <div v-if="productPackagingConsumption.length > 0 || boxPackagingConsumption.length > 0" class="packaging-total">
      <div class="total-row">
        <span class="total-label">产品包材总成本:</span>
        <span class="total-value">{{ productPackagingTotalCost.toFixed(2) }} CNY</span>
      </div>
      <div class="total-row">
        <span class="total-label">装箱包材总成本:</span>
        <span class="total-value">{{ boxPackagingTotalCost.toFixed(2) }} CNY</span>
      </div>
      <div class="total-row total-grand">
        <span class="total-label">包材总成本:</span>
        <span class="total-value">{{ totalPackagingCost.toFixed(2) }} CNY</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'

defineProps<{
  labels: Record<string, string>
  form: Record<string, any>
  packageSummary: { boxCount: number; totalWeight: number; totalVolume: number }
  packageSpecs: Array<Record<string, any>>
  productPackagingConsumption: Array<Record<string, any>>
  boxPackagingConsumption: Array<Record<string, any>>
  productPackagingTotalCost: number
  boxPackagingTotalCost: number
  totalPackagingCost: number
  getFullImageUrl: (url: string) => string
  calculateItemQuantity: (row: any) => number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'add-item': []
  'package-spec-change': [row: any]
  'box-quantity-change': [row: any]
  'remove-item': [index: number]
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

.section-header--nested {
  margin-top: 28px;
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

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.summary-value .unit {
  font-size: 12px;
  color: #6b7280;
  margin-left: 4px;
}

.package-hint {
  margin: -6px 0 18px;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
}

.items-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.add-product-button {
  align-self: flex-start;
}

.item-product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-product-image {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  background: #f3f4f6;
  object-fit: cover;
  flex-shrink: 0;
}

.item-product-image--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.item-product-meta {
  min-width: 0;
}

.product-code {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.product-title {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
}

.qty-warning {
  color: #dc2626;
  font-weight: 600;
}

.packing-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.packing-editor-spec {
  width: 100%;
}

.spec-info {
  color: #6b7280;
  margin-left: 6px;
}

.packing-editor-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.packing-editor-field,
.packing-editor-result {
  display: flex;
  align-items: center;
  gap: 10px;
}

.packing-editor-label {
  font-size: 12px;
  color: #6b7280;
}

.packing-editor-input {
  width: 88px;
}

.packing-editor-value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.packaging-consumption-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.packaging-consumption-section--spaced {
  margin-top: 28px;
}

.consumption-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.consumption-qty {
  font-weight: 600;
  color: #111827;
}

.consumption-cost {
  font-weight: 700;
  color: #16a34a;
}

.packaging-total {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed #d1d5db;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 14px;
}

.total-label {
  color: #6b7280;
}

.total-value {
  font-weight: 700;
  color: #111827;
}

.total-grand .total-label,
.total-grand .total-value {
  color: #dc2626;
}
</style>
