<template>
  <el-dialog :model-value="modelValue" :title="dialogTitle" width="1360px" top="2vh" class="product-dialog" @update:model-value="emit('update:modelValue', $event)">
    <div class="editor-main">
      <div>
        <div class="editor-topbar__title">{{ dialogTitle }}</div>
        <div class="editor-topbar__hint">{{ text.productEditorDescription }}</div>
      </div>

      <div class="editor-workbench">
        <aside class="editor-sidebar">
          <button
            v-for="section in editorSections"
            :key="section.key"
            type="button"
            class="editor-nav__item"
            :class="{ 'editor-nav__item--active': activeSection === section.key }"
            @click="activeSection = section.key"
          >
            <span class="editor-nav__label">{{ section.label }}</span>
            <span class="editor-nav__hint">{{ section.hint }}</span>
          </button>
        </aside>

        <section class="form-section">
          <div class="section-heading">
            <div class="section-heading__title">{{ currentSectionMeta.label }}</div>
            <div class="section-heading__hint">{{ currentSectionMeta.hint }}</div>
          </div>

          <el-form
            v-if="activeSection !== 'packaging'"
            ref="formRef"
            :model="productForm"
            :rules="productFormRules"
            label-position="top"
            label-width="auto"
            class="product-form"
          >
            <div v-show="activeSection === 'identity'" class="form-grid">
              <el-form-item :label="text.productImage" class="span-full">
                <ImageUpload v-model="productForm.image_url" sub-dir="products" />
              </el-form-item>
              <el-form-item :label="text.sellerSku" prop="seller_sku">
                <el-input v-model="productForm.seller_sku" :disabled="isEdit" />
              </el-form-item>
              <el-form-item :label="text.asin" prop="asin">
                <el-input v-model="productForm.asin" />
              </el-form-item>
              <el-form-item :label="text.title" prop="title" class="span-full">
                <el-input v-model="productForm.title" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item :label="text.marketplace" prop="marketplace">
                <el-select v-model="productForm.marketplace" :disabled="isEdit" style="width: 100%">
                  <el-option label="US" value="US" />
                  <el-option label="CA" value="CA" />
                  <el-option label="AU" value="AU" />
                  <el-option label="UK" value="UK" />
                </el-select>
              </el-form-item>
              <el-form-item :label="text.fnsku">
                <el-input v-model="productForm.fnsku" />
              </el-form-item>
            </div>

            <div v-show="activeSection === 'sourcing'" class="form-grid">
              <el-form-item :label="text.supplier" prop="supplier_id">
                <SupplierSelector
                  v-model="productForm.supplier_id"
                  type="PRODUCT"
                  :clearable="false"
                  @change="handleSupplierChange"
                />
              </el-form-item>
              <el-form-item :label="text.defaultSupplierQuote">
                <el-input-number v-model="productForm.unit_cost" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </div>

            <div v-show="activeSection === 'attributes'" class="form-grid">
              <el-form-item :label="text.brand">
                <ProductConfigSelector
                  v-model="productForm.brand_id"
                  config-type="BRAND"
                  title="选择品牌"
                  placeholder="请选择品牌"
                />
              </el-form-item>
              <el-form-item :label="text.category">
                <el-cascader
                  v-model="productForm.category_id"
                  :options="categoryOptions"
                  :props="categoryCascaderProps"
                  clearable
                  filterable
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item :label="text.salesStatus" prop="status">
                <el-select v-model="productForm.status" style="width: 100%">
                  <el-option
                    v-for="item in salesStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item :label="text.inspectionRule" class="span-full">
                <el-segmented
                  v-model="productForm.is_inspection_required"
                  :options="[
                    { label: text.inspectionRequired, value: 1 },
                    { label: text.inspectionNotRequired, value: 0 }
                  ]"
                />
                <div class="form-tip">{{ text.inspectionRuleHint }}</div>
              </el-form-item>
              <el-form-item :label="text.packingRule" class="span-full">
                <el-segmented
                  v-model="productForm.is_packing_required"
                  :options="[
                    { label: text.packingRequired, value: 1 },
                    { label: text.packingNotRequired, value: 0 }
                  ]"
                />
                <div class="form-tip">{{ text.packingRuleHint }}</div>
              </el-form-item>
            </div>

            <div v-show="activeSection === 'dimension'" class="form-grid">
              <el-form-item :label="text.weight">
                <el-input-number v-model="productForm.weight" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item :label="text.weightUnit">
                <ProductConfigSelector
                  v-model="productForm.weight_unit_id"
                  config-type="WEIGHT_UNIT"
                  title="选择重量单位"
                  placeholder="请选择重量单位"
                />
              </el-form-item>
              <el-form-item :label="text.length">
                <el-input-number v-model="productForm.length" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item :label="text.width">
                <el-input-number v-model="productForm.width" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item :label="text.height">
                <el-input-number v-model="productForm.height" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
              <el-form-item :label="text.dimensionUnit">
                <ProductConfigSelector
                  v-model="productForm.dimension_unit_id"
                  config-type="DIMENSION_UNIT"
                  title="选择尺寸单位"
                  placeholder="请选择尺寸单位"
                />
              </el-form-item>
              <div class="side-metric">
                <span class="side-metric__label">{{ text.dimensionPreview }}</span>
                <span class="side-metric__value">{{ formatDimensionSummary(productForm) }}</span>
              </div>
            </div>

            <div v-show="activeSection === 'remark'" class="form-grid">
              <el-form-item :label="text.remark" class="span-full">
                <el-input v-model="productForm.remark" type="textarea" :rows="4" />
              </el-form-item>
            </div>
          </el-form>

          <div v-show="activeSection === 'packaging'">
            <div class="section-heading section-heading--space-between">
              <div>
                <div class="section-heading__title">{{ text.packagingConfig }}</div>
                <div class="section-heading__hint">{{ text.packagingConfigHint }}</div>
              </div>
              <div class="packaging-header-actions">
                <span class="packaging-count">{{ packagingItems.length }} {{ text.packagingItemsCount }}</span>
                <el-button type="primary" :icon="Plus" size="small" @click="emit('add-packaging-item')">
                  {{ text.addPackagingItem }}
                </el-button>
              </div>
            </div>

            <div v-if="packagingItems.length > 0" class="packaging-editor-list">
              <article
                v-for="(row, index) in packagingItems"
                :key="index"
                class="packaging-editor-card"
              >
                <div class="packaging-editor-card__header">
                  <div class="packaging-editor-card__index">#{{ index + 1 }}</div>
                  <el-button type="danger" link size="small" @click="emit('remove-packaging-item', index)">
                    {{ text.delete }}
                  </el-button>
                </div>

                <div class="packaging-editor-grid">
                  <div class="packaging-editor-field packaging-editor-field--wide">
                    <label class="packaging-editor-field__label">{{ text.packagingName }}</label>
                    <el-select
                      v-model="row.packaging_item_id"
                      :placeholder="text.selectPackaging"
                      filterable
                      size="small"
                      style="width: 100%"
                      @change="emit('packaging-item-select', row)"
                    >
                      <el-option
                        v-for="item in availablePackagingItems"
                        :key="item.id"
                        :label="`${item.item_name} (${item.item_code})`"
                        :value="item.id"
                      >
                        <div class="packaging-option">
                          <span>{{ item.item_name }}</span>
                          <span class="packaging-option__meta">{{ item.specification || '-' }}</span>
                        </div>
                      </el-option>
                    </el-select>
                  </div>

                  <div class="packaging-editor-field">
                    <label class="packaging-editor-field__label">{{ text.unit }}</label>
                    <div class="packaging-editor-field__value">{{ row._packagingDetail?.unit || '-' }}</div>
                  </div>

                  <div class="packaging-editor-field">
                    <label class="packaging-editor-field__label">{{ text.consumptionQuantity }}</label>
                    <el-input-number
                      v-model="row.quantity_per_unit"
                      :min="0"
                      :precision="3"
                      :placeholder="text.quantityPlaceholder"
                      size="small"
                      style="width: 100%"
                    />
                  </div>
                </div>
              </article>
            </div>
            <el-empty v-else :description="text.noPackagingConfigured" />
          </div>
        </section>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="requestSave">{{ text.save }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import ImageUpload from '@/modules/common/components/ImageUpload.vue'
import SupplierSelector from '@/modules/supplier/components/SupplierSelector.vue'
import ProductConfigSelector from './ProductConfigSelector.vue'

const props = defineProps<{
  modelValue: boolean
  dialogTitle: string
  saving: boolean
  isEdit: boolean
  productForm: any
  productFormRules: any
  text: Record<string, string>
  packagingItems: any[]
  availablePackagingItems: any[]
  configOptionsByType: Record<string, any[]>
  salesStatusOptions: Array<{ value: string; label: string }>
  categoryOptions: any[]
  getConfigItemName: (type: any, id?: number) => string
  getCategoryName: (id?: number) => string
  getCategoryPath: (id?: number) => string
  getStatusLabel: (status?: string) => string
  formatDimensionSummary: (product: any) => string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: []
  'supplier-change': [supplierId: number | null]
  'add-packaging-item': []
  'remove-packaging-item': [index: number]
  'packaging-item-select': [row: any]
}>()

const formRef = ref<FormInstance>()
const activeSection = ref('identity')
const editorSections = [
  { key: 'identity', label: '产品标识', hint: '站点、编码、标题和基础图片。' },
  { key: 'sourcing', label: '采购供应商', hint: '默认供应商和基础参考成本。' },
  { key: 'attributes', label: '产品属性', hint: '品牌、品类和销售状态。' },
  { key: 'dimension', label: '尺寸重量', hint: '长度宽度高度和重量单位。' },
  { key: 'remark', label: '备注', hint: '仅记录产品补充说明。' },
  { key: 'packaging', label: '包材配置', hint: '维护真实会用到的包材映射。' }
]
const currentSectionMeta = computed(() => editorSections.find((item) => item.key === activeSection.value) ?? editorSections[0])
const categoryCascaderProps = {
  value: 'id',
  label: 'category_name',
  children: 'children',
  emitPath: false,
  checkStrictly: true
}

const requestSave = async () => {
  if (!formRef.value) {
    emit('save')
    return
  }
  try {
    await formRef.value.validate()
    emit('save')
  } catch {
    // 表单校验失败时不继续保存
  }
}

const handleSupplierChange = (supplier: { id: number } | null) => {
  emit('supplier-change', supplier?.id ?? null)
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      activeSection.value = 'identity'
    }
  }
)
</script>
