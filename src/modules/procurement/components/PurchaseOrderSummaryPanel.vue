<template>
  <aside class="purchase-form-aside">
    <div class="purchase-summary-panel">
      <div class="purchase-summary-header">
        <h3 class="purchase-summary-title">采购摘要</h3>
        <p class="purchase-summary-subtitle">右侧只看关键结果，减少在长表格里来回核对。</p>
      </div>

      <div class="purchase-summary-grid">
        <div class="purchase-summary-tile">
          <div class="purchase-summary-tile-label">产品数</div>
          <div class="purchase-summary-tile-value">{{ itemCount }}</div>
        </div>
        <div class="purchase-summary-tile">
          <div class="purchase-summary-tile-label">总数量</div>
          <div class="purchase-summary-tile-value">{{ totalQty }}</div>
        </div>
        <div class="purchase-summary-tile">
          <div class="purchase-summary-tile-label">币种</div>
          <div class="purchase-summary-tile-value">{{ form.currency || '-' }}</div>
        </div>
        <div class="purchase-summary-tile">
          <div class="purchase-summary-tile-label">总金额</div>
          <div class="purchase-summary-tile-value">{{ totalAmount }}</div>
        </div>
      </div>

      <div class="purchase-summary-block">
        <div class="purchase-summary-block-title">单据信息</div>
        <div class="purchase-summary-line">
          <span class="purchase-summary-line-label">站点</span>
          <span class="purchase-summary-line-value">{{ form.marketplace || '-' }}</span>
        </div>
        <div class="purchase-summary-line">
          <span class="purchase-summary-line-label">备注</span>
          <span class="purchase-summary-line-value purchase-summary-line-value--multiline">
            {{ form.remark || '-' }}
          </span>
        </div>
      </div>

      <div class="purchase-summary-block">
        <div class="purchase-summary-block-title">供应商概览</div>
        <div class="purchase-summary-line">
          <span class="purchase-summary-line-label">已选供应商</span>
          <span class="purchase-summary-line-value">{{ supplierCount }}</span>
        </div>
        <div class="purchase-summary-line">
          <span class="purchase-summary-line-label">待补供应商</span>
          <span class="purchase-summary-line-value">{{ missingSupplierCount }}</span>
        </div>
        <div class="purchase-summary-line">
          <span class="purchase-summary-line-label">组合子项</span>
          <span class="purchase-summary-line-value">{{ comboChildCount }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  form: Record<string, any>
  itemCount: number
  totalQty: number
  totalAmount: string
  supplierCount: number
  missingSupplierCount: number
  comboChildCount: number
}>()
</script>

<style scoped>
.purchase-form-aside {
  position: sticky;
  top: 16px;
}

.purchase-summary-panel {
  padding: 18px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e5e7eb;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
}

.purchase-summary-header {
  margin-bottom: 16px;
}

.purchase-summary-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.purchase-summary-subtitle {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
}

.purchase-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.purchase-summary-tile {
  padding: 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.purchase-summary-tile-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.purchase-summary-tile-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.purchase-summary-block {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #d1d5db;
}

.purchase-summary-block-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.purchase-summary-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
}

.purchase-summary-line-label {
  flex: 0 0 80px;
  font-size: 12px;
  color: #6b7280;
}

.purchase-summary-line-value {
  flex: 1;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.purchase-summary-line-value--multiline {
  line-height: 1.5;
}

@media (max-width: 1200px) {
  .purchase-form-aside {
    position: static;
  }
}

@media (max-width: 768px) {
  .purchase-summary-grid {
    grid-template-columns: 1fr;
  }

  .purchase-summary-line {
    flex-direction: column;
    align-items: flex-start;
  }

  .purchase-summary-line-value {
    text-align: left;
  }
}
</style>
