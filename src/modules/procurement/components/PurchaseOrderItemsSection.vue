<template>
  <section class="form-section-card">
    <div class="form-section-header form-section-header--actions">
      <div>
        <h3 class="form-section-title">{{ labels.itemsTitle }}</h3>
        <p class="form-section-subtitle">采购明细是核心区域，先选产品，再确认供应商、数量和金额。</p>
      </div>
      <div class="items-toolbar">
        <div class="items-toolbar-stat">
          <span class="items-toolbar-label">产品数</span>
          <span class="items-toolbar-value">{{ form.items.length }}</span>
        </div>
        <div class="items-toolbar-stat">
          <span class="items-toolbar-label">总数量</span>
          <span class="items-toolbar-value">{{ totalQty }}</span>
        </div>
        <el-button size="small" type="primary" @click="emit('open-product-picker')">
          {{ labels.selectProduct }}
        </el-button>
      </div>
    </div>

    <el-table :data="displayItems" border stripe>
      <el-table-column :label="labels.product" min-width="300">
        <template #default="{ row }">
          <div class="product-cell" :class="{ 'is-child': row.combo_role === 'child' }">
            <div class="product-main">
              <img
                v-if="row.product?.image_url"
                :src="row.product.image_url"
                :alt="row.product?.seller_sku || 'product'"
                class="product-image"
              />
              <div class="product-info">
                <div class="product-code">
                  <span v-if="row.combo_role === 'child'" class="combo-prefix">|-</span>
                  {{ row.product?.seller_sku || row.product_id }}
                </div>
                <div class="product-title">{{ row.product?.title || '-' }}</div>
              </div>
            </div>
            <el-tag v-if="row.combo" :type="row.combo_role === 'main' ? 'warning' : 'info'" size="small">
              {{ row.combo_role === 'child' ? labels.comboChild : labels.comboMain }}{{ row.combo.main_product_code || row.combo.combo_id }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="labels.itemSupplier" min-width="260">
        <template #default="{ row }">
          <div class="supplier-info">
            <div v-if="getSelectedQuote(row)" class="supplier-summary">
              <div class="supplier-name">
                {{
                  getSelectedQuote(row)?.supplier_name ||
                  getSelectedQuote(row)?.supplier_code ||
                  row.supplier_id ||
                  '-'
                }}
              </div>
              <div class="supplier-meta">
                <span>
                  {{ labels.quotePrice }}
                  {{ formatQuotePrice(getSelectedQuote(row)?.price, getSelectedQuote(row)?.currency) }}
                </span>
                <span>
                  {{ labels.quoteMoq }}
                  {{ getSelectedQuote(row)?.qty_moq ?? '-' }}
                </span>
                <span>
                  {{ labels.quoteLeadTime }}
                  {{ getSelectedQuote(row)?.lead_time_days ?? '-' }} {{ labels.days }}
                </span>
              </div>
            </div>
            <div v-else class="supplier-empty">
              {{ getQuoteState(row).loading ? labels.quoteLoading : labels.quoteEmpty }}
            </div>
            <el-button
              size="small"
              type="primary"
              link
              :loading="getQuoteState(row).loading"
              :disabled="mode === 'edit' || isSwitchDisabled(row)"
              @click="emit('open-quote-dialog', row)"
            >
              {{ labels.switchSupplier }}
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="labels.qty" width="140">
        <template #default="{ row }">
          <el-input-number v-model="row.qty_ordered" :min="1" :step="1" />
        </template>
      </el-table-column>
      <el-table-column :label="labels.unitCost" width="160">
        <template #default="{ row }">
          <span class="amount-text">{{ formatAmount(row.unit_cost) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="labels.subtotal" width="160" align="right">
        <template #default="{ row }">
          <span class="amount-text">{{ formatAmount(row.qty_ordered * row.unit_cost) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="labels.actions" width="120" align="center">
        <template #default="{ row }">
          <el-button type="danger" size="small" @click="emit('remove-row', row)">
            {{ labels.remove }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  labels: Record<string, string>
  mode: 'create' | 'edit'
  form: Record<string, any>
  displayItems: Array<Record<string, any>>
  totalQty: number
  getSelectedQuote: (row: any) => any
  getQuoteState: (row: any) => { loading: boolean }
  isSwitchDisabled: (row: any) => boolean
  formatQuotePrice: (price?: number | string, currency?: string) => string
  formatAmount: (value: number) => string
}>()

const emit = defineEmits<{
  'open-product-picker': []
  'open-quote-dialog': [row: any]
  'remove-row': [row: any]
}>()
</script>

<style scoped>
.form-section-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%);
  padding: 18px 18px 10px;
}

.form-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.form-section-header--actions {
  align-items: center;
}

.form-section-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 700;
  color: #1f2937;
}

.form-section-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
}

.items-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.items-toolbar-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 64px;
}

.items-toolbar-label {
  font-size: 12px;
  color: #6b7280;
}

.items-toolbar-value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.product-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-image {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f7fa;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-cell.is-child {
  padding-left: 14px;
  border-left: 2px solid #ebeef5;
}

.product-code {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.combo-prefix {
  color: #909399;
  font-size: 12px;
}

.product-title {
  color: #909399;
  font-size: 12px;
}

.supplier-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.supplier-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.supplier-name {
  font-weight: 600;
}

.supplier-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #606266;
  font-size: 12px;
}

.supplier-empty {
  color: #909399;
  font-size: 12px;
}

.amount-text {
  font-weight: 600;
}

@media (max-width: 768px) {
  .form-section-header,
  .form-section-header--actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .items-toolbar {
    width: 100%;
  }

  .items-toolbar-stat {
    align-items: flex-start;
  }
}
</style>
