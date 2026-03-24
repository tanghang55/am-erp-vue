<template>
  <section class="form-section-card">
    <div class="form-section-header">
      <div>
        <h3 class="form-section-title">基础信息</h3>
        <p class="form-section-subtitle">先确定站点、币种和采购备注，右侧会同步汇总。</p>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item :label="labels.marketplace">
          <el-select v-model="form.marketplace" :placeholder="labels.marketplacePlaceholder">
            <el-option v-for="item in marketplaceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="labels.currency">
          <el-select v-model="form.currency" :placeholder="labels.currencyPlaceholder">
            <el-option v-for="item in currencyOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item :label="labels.remark">
      <el-input v-model="form.remark" type="textarea" :rows="2" />
    </el-form-item>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  labels: Record<string, string>
  form: Record<string, any>
  marketplaceOptions: string[]
  currencyOptions: string[]
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
</style>
