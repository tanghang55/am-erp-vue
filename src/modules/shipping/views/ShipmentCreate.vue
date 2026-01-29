<template>
  <div class="shipment-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-page-header :content="labels.title" @back="handleBack" />
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <!-- 基础信息 -->
        <el-divider content-position="left">{{ labels.basicInfo }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.orderNumber">
              <el-input
                v-model="form.order_number"
                :placeholder="labels.orderNumberPlaceholder"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.salesChannel">
              <el-select
                v-model="form.sales_channel"
                :placeholder="labels.salesChannelPlaceholder"
                clearable
                style="width: 100%"
              >
                <el-option label="Amazon" value="Amazon" />
                <el-option label="eBay" value="eBay" />
                <el-option label="Shopify" value="Shopify" />
                <el-option label="独立站" value="Independent" />
                <el-option label="线下" value="Offline" />
                <el-option label="其他" value="Other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.warehouse" prop="warehouse_id">
              <warehouse-selector
                v-model="form.warehouse_id"
                :placeholder="labels.warehousePlaceholder"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 收货方信息 -->
        <el-divider content-position="left">{{ labels.destinationInfo }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item :label="labels.destinationWarehouse">
              <warehouse-selector
                v-model="form.destination_warehouse_id"
                :placeholder="labels.destinationWarehousePlaceholder"
                style="width: 100%"
                @change="handleDestinationWarehouseChange"
              />
              <div style="font-size: 12px; color: #67c23a; margin-top: 4px" v-if="form.destination_warehouse_id">
                ✓ 已自动填充收货方信息
              </div>
              <div style="font-size: 12px; color: #909399; margin-top: 4px" v-else>
                {{ labels.destinationWarehouseHint }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.destinationType" prop="destination_type">
              <el-select
                v-model="form.destination_type"
                :placeholder="labels.destinationTypePlaceholder"
                style="width: 100%"
                @change="handleDestinationTypeChange"
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
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.destinationCode">
              <el-input
                v-model="form.destination_code"
                :placeholder="labels.destinationCodePlaceholder"
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
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.destinationPhone">
              <el-input
                v-model="form.destination_phone"
                :placeholder="labels.destinationPhonePlaceholder"
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
                :placeholder="labels.destinationAddressPlaceholder"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 物流信息 -->
        <el-divider content-position="left">{{ labels.shippingInfo }}</el-divider>

        <!-- 运费报价选择 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="运费报价" prop="shipping_rate_id">
              <el-select
                v-model="form.shipping_rate_id"
                placeholder="请选择运费报价（自动带出供应商、服务等信息）"
                clearable
                filterable
                loading-text="加载报价中..."
                :loading="loadingRates"
                style="width: 100%"
                @change="handleRateChange"
              >
                <el-option
                  v-for="rate in availableRates"
                  :key="rate.id"
                  :label="formatRateLabel(rate)"
                  :value="rate.id"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <div>
                      <span style="font-weight: 500">{{ rate.provider?.provider_name }}</span>
                      <span style="margin-left: 8px; color: #909399; font-size: 12px">
                        {{ TRANSPORT_MODE_CONFIG[rate.transport_mode]?.icon }}
                        {{ TRANSPORT_MODE_CONFIG[rate.transport_mode]?.label }}
                      </span>
                      <span v-if="rate.service?.service_name" style="margin-left: 8px; color: #409eff; font-size: 12px">
                        {{ rate.service.service_name }}
                      </span>
                    </div>
                    <div style="color: #67c23a; font-weight: 500">
                      {{ rate.base_rate }} {{ rate.currency }}/{{ PRICING_METHOD_CONFIG[rate.pricing_method]?.label }}
                      <span v-if="rate.transit_days" style="margin-left: 8px; color: #909399; font-size: 12px">
                        {{ rate.transit_days }}天
                      </span>
                    </div>
                  </div>
                </el-option>
              </el-select>
              <div v-if="!form.warehouse_id || !form.destination_warehouse_id" style="font-size: 12px; color: #f56c6c; margin-top: 4px">
                ⚠ 请先选择起点仓库和目的地仓库
              </div>
              <div v-else-if="availableRates.length === 0 && !loadingRates" style="font-size: 12px; color: #e6a23c; margin-top: 4px">
                ⚠ 暂无可用报价，请联系管理员添加
              </div>
              <div v-else-if="form.shipping_rate_id" style="font-size: 12px; color: #67c23a; margin-top: 4px">
                ✓ 已自动填充物流信息
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 运费报价详细信息卡片 -->
        <el-row v-if="shippingRate" :gutter="20">
          <el-col :span="24">
            <div class="rate-card">
              <div class="rate-card-header">
                <div class="rate-card-title">
                  <i class="el-icon-box" style="color: #67c23a; margin-right: 8px"></i>
                  <span>运费报价详情</span>
                </div>
                <el-tag type="success" size="small">已选中</el-tag>
              </div>

              <div class="rate-card-body">
                <!-- 供应商和服务信息 -->
                <div class="rate-section">
                  <div class="rate-section-title">基本信息</div>
                  <el-row :gutter="16">
                    <el-col :span="8">
                      <div class="rate-field">
                        <div class="rate-field-label">承运商</div>
                        <div class="rate-field-value">{{ shippingRate.provider?.provider_name || '-' }}</div>
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div class="rate-field">
                        <div class="rate-field-label">运输方式</div>
                        <div class="rate-field-value">
                          {{ TRANSPORT_MODE_CONFIG[shippingRate.transport_mode]?.icon }}
                          {{ TRANSPORT_MODE_CONFIG[shippingRate.transport_mode]?.label }}
                        </div>
                      </div>
                    </el-col>
                    <el-col :span="8" v-if="shippingRate.service?.service_name">
                      <div class="rate-field">
                        <div class="rate-field-label">服务类型</div>
                        <div class="rate-field-value">{{ shippingRate.service.service_name }}</div>
                      </div>
                    </el-col>
                  </el-row>
                </div>

                <!-- 价格信息 -->
                <div class="rate-section">
                  <div class="rate-section-title">价格信息</div>
                  <el-row :gutter="16">
                    <el-col :span="8">
                      <div class="rate-field rate-field-primary">
                        <div class="rate-field-label">基础运费</div>
                        <div class="rate-field-value rate-price">
                          {{ shippingRate.base_rate }} {{ shippingRate.currency }}
                          <span class="rate-unit">/ {{ PRICING_METHOD_CONFIG[shippingRate.pricing_method]?.label }}</span>
                        </div>
                      </div>
                    </el-col>
                    <el-col :span="8" v-if="shippingRate.other_fee && shippingRate.other_fee > 0">
                      <div class="rate-field">
                        <div class="rate-field-label">其他费用</div>
                        <div class="rate-field-value">{{ shippingRate.other_fee }} {{ shippingRate.currency }}</div>
                      </div>
                    </el-col>
                    <el-col :span="8" v-if="shippingRate.min_weight">
                      <div class="rate-field">
                        <div class="rate-field-label">最小起送量</div>
                        <div class="rate-field-value">{{ shippingRate.min_weight }} kg</div>
                      </div>
                    </el-col>
                  </el-row>
                </div>

                <!-- 时效和有效期 -->
                <div class="rate-section">
                  <div class="rate-section-title">时效信息</div>
                  <el-row :gutter="16">
                    <el-col :span="8" v-if="shippingRate.transit_days">
                      <div class="rate-field">
                        <div class="rate-field-label">运输时效</div>
                        <div class="rate-field-value">
                          {{ shippingRate.transit_days }} 天
                          <span v-if="form.expected_delivery_date" class="rate-hint">
                            (预计 {{ form.expected_delivery_date }} 到达)
                          </span>
                        </div>
                      </div>
                    </el-col>
                    <el-col :span="16">
                      <div class="rate-field">
                        <div class="rate-field-label">报价有效期</div>
                        <div class="rate-field-value">
                          {{ shippingRate.effective_date }} ~ {{ shippingRate.expiry_date || '长期有效' }}
                        </div>
                      </div>
                    </el-col>
                  </el-row>
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
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.trackingNumber">
              <el-input
                v-model="form.tracking_number"
                :placeholder="labels.trackingNumberPlaceholder"
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
                style="width: 100%"
                value-format="YYYY-MM-DD"
                @change="handleExpectedShipDateChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="labels.expectedDeliveryDate">
              <el-date-picker
                v-model="form.expected_delivery_date"
                type="date"
                :placeholder="labels.expectedDeliveryDatePlaceholder"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
              <div style="font-size: 12px; color: #67c23a; margin-top: 4px" v-if="form.expected_delivery_date && shippingRate?.transit_days">
                ✓ 基于运输时效自动计算
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 包装信息 (自动计算) -->
        <el-divider content-position="left">{{ labels.packageInfo }}</el-divider>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="labels.boxCount">
              <div class="summary-value">{{ packageSummary.boxCount }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="labels.totalWeight">
              <div class="summary-value">{{ packageSummary.totalWeight.toFixed(2) }} <span class="unit">kg</span></div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item :label="labels.totalVolume">
              <div class="summary-value">{{ packageSummary.totalVolume.toFixed(4) }} <span class="unit">m³</span></div>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="package-hint">* 包装信息根据产品明细中的装箱信息自动计算</div>

        <!-- 发货明细 -->
        <el-divider content-position="left">{{ labels.items }}</el-divider>

        <div class="items-section">
          <el-button
            type="primary"
            size="small"
            @click="handleAddItem"
            style="margin-bottom: 16px"
          >
            <el-icon><Plus /></el-icon>
            {{ labels.addProduct }}
          </el-button>

          <el-table :data="form.items" border stripe>
            <el-table-column type="index" label="#" width="60" />

            <el-table-column :label="labels.productImage" width="80">
              <template #default="{ row }">
                <el-image
                  v-if="row.product?.image_url"
                  :src="getFullImageUrl(row.product.image_url)"
                  :preview-src-list="[getFullImageUrl(row.product.image_url)]"
                  fit="cover"
                  style="width: 50px; height: 50px; border-radius: 4px"
                />
                <span v-else class="no-image">-</span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.productCode" width="150">
              <template #default="{ row }">
                <span class="product-code">{{ row.product?.seller_sku || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.productName" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="product-title">{{ row.product?.title || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.pendingShipment" width="110" align="center">
              <template #default="{ row }">
                <span :class="{ 'qty-warning': row.pending_shipment === 0 }">
                  {{ row.pending_shipment ?? '-' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.packageSpec" min-width="250">
              <template #default="{ row }">
                <el-select
                  v-model="row.package_spec_id"
                  placeholder="选择装箱规格"
                  clearable
                  style="width: 100%"
                  @change="handlePackageSpecChange(row)"
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
              </template>
            </el-table-column>

            <el-table-column :label="labels.boxQuantity" width="100">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.box_quantity"
                  :min="1"
                  :precision="0"
                  :controls="false"
                  style="width: 100%"
                />
              </template>
            </el-table-column>

            <el-table-column :label="labels.quantityPlanned" width="110" align="center">
              <template #default="{ row }">
                <span class="calculated-qty">{{ calculateItemQuantity(row) }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="labels.itemRemark" min-width="150">
              <template #default="{ row }">
                <el-input
                  v-model="row.remark"
                  :placeholder="labels.itemRemarkPlaceholder"
                  size="small"
                />
              </template>
            </el-table-column>

            <el-table-column :label="labels.actions" width="100" fixed="right">
              <template #default="{ $index }">
                <el-button
                  size="small"
                  type="danger"
                  @click="handleRemoveItem($index)"
                >
                  {{ labels.remove }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="items-summary">
            <span>{{ labels.totalItems }}: {{ form.items.length }}</span>
            <span style="margin-left: 20px">{{ labels.totalQuantity }}: {{ totalQuantity }}</span>
          </div>
        </div>

        <!-- 包材消耗预估 -->
        <el-divider content-position="left">包材消耗预估</el-divider>

        <!-- 产品包材消耗（打包时） -->
        <div class="packaging-consumption-section">
          <div class="consumption-title">
            <span>产品包材消耗</span>
            <el-tag size="small" type="info">打包时消耗</el-tag>
          </div>

          <el-table
            :data="productPackagingConsumption"
            border
            size="small"
            v-if="productPackagingConsumption.length > 0"
          >
            <el-table-column label="包材名称" min-width="150">
              <template #default="{ row }">
                {{ row.item_name }}
              </template>
            </el-table-column>
            <el-table-column label="规格" width="120">
              <template #default="{ row }">
                {{ row.specification || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="单位" width="80" align="center">
              <template #default="{ row }">
                {{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column label="消耗数量" width="120" align="right">
              <template #default="{ row }">
                <span class="consumption-qty">{{ row.total_quantity.toFixed(3) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="100" align="right">
              <template #default="{ row }">
                {{ row.unit_cost.toFixed(2) }} {{ row.currency }}
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="consumption-cost">{{ (row.total_quantity * row.unit_cost).toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-else
            description="暂无产品包材消耗"
            :image-size="60"
          />
        </div>

        <!-- 装箱包材消耗（发货时） -->
        <div class="packaging-consumption-section" style="margin-top: 20px">
          <div class="consumption-title">
            <span>装箱包材消耗</span>
            <el-tag size="small" type="warning">发货时消耗</el-tag>
          </div>

          <el-table
            :data="boxPackagingConsumption"
            border
            size="small"
            v-if="boxPackagingConsumption.length > 0"
          >
            <el-table-column label="包材名称" min-width="150">
              <template #default="{ row }">
                {{ row.item_name }}
              </template>
            </el-table-column>
            <el-table-column label="规格" width="120">
              <template #default="{ row }">
                {{ row.specification || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="单位" width="80" align="center">
              <template #default="{ row }">
                {{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column label="消耗数量" width="120" align="right">
              <template #default="{ row }">
                <span class="consumption-qty">{{ row.total_quantity.toFixed(3) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" width="100" align="right">
              <template #default="{ row }">
                {{ row.unit_cost.toFixed(2) }} {{ row.currency }}
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="consumption-cost">{{ (row.total_quantity * row.unit_cost).toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-else
            description="暂无装箱包材消耗"
            :image-size="60"
          />
        </div>

        <!-- 包材消耗汇总 -->
        <div
          v-if="productPackagingConsumption.length > 0 || boxPackagingConsumption.length > 0"
          class="packaging-total"
        >
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

        <!-- 备注 -->
        <el-divider content-position="left">{{ labels.remarkSection }}</el-divider>

        <el-row>
          <el-col :span="24">
            <el-form-item :label="labels.remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="3"
                :placeholder="labels.remarkPlaceholder"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item :label="labels.internalNotes">
              <el-input
                v-model="form.internal_notes"
                type="textarea"
                :rows="2"
                :placeholder="labels.internalNotesPlaceholder"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 提交按钮 -->
        <el-form-item style="margin-top: 24px">
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ labels.submit }}
          </el-button>
          <el-button @click="handleBack">{{ labels.cancel }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 产品选择弹窗 -->
    <ProductPickerDialog
      v-model="productPickerVisible"
      :warehouse-id="form.warehouse_id"
      @confirm="handleProductsConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createShipment, getPackageSpecList, getPackageSpecPackagingItems } from '../api'
import { getProductPackagingItems } from '@/modules/product/api'
import type { CreateShipmentItemParams, PackageSpec, DestinationType } from '../types'
import { getShippingRates } from '@/modules/logistics/api'
import type { ShippingRate } from '@/modules/logistics/types'
import { PROVIDER_TYPE_CONFIG, TRANSPORT_MODE_CONFIG, PRICING_METHOD_CONFIG } from '@/modules/logistics/types'
import WarehouseSelector from '@/modules/inventory/components/WarehouseSelector.vue'
import ProductPickerDialog from '@/modules/product/components/ProductPickerDialog.vue'
import type { Sku } from '@/modules/product/types'
import type { Warehouse } from '@/modules/inventory/types'
import { getWarehouseDetail } from '@/modules/inventory/api'

const router = useRouter()

const labels = computed(() => {
  return {
    title: '新建发货单',
    basicInfo: '基础信息',
    orderNumber: '订单号',
    orderNumberPlaceholder: '输入订单号（可选）',
    salesChannel: '销售渠道',
    salesChannelPlaceholder: '选择销售渠道',
    warehouse: '发货仓库',
    warehousePlaceholder: '选择发货仓库',

    destinationInfo: '收货方信息',
    destinationWarehouse: '目的地仓库',
    destinationWarehousePlaceholder: '选择目的地仓库（可选）',
    destinationWarehouseHint: '选择后将自动填充收货方信息',
    destinationType: '收货方类型',
    destinationTypePlaceholder: '选择收货方类型',
    destinationName: '收货方名称',
    destinationNamePlaceholder: '输入收货方名称',
    destinationCode: '收货方代码',
    destinationCodePlaceholder: '如FBA仓库代码 PHX3, ONT8等',
    destinationCodeHint: 'FBA仓库代码、客户编号等',
    destinationContact: '收货联系人',
    destinationContactPlaceholder: '输入联系人姓名',
    destinationPhone: '收货电话',
    destinationPhonePlaceholder: '输入联系电话',
    destinationAddress: '收货地址',
    destinationAddressPlaceholder: '输入完整收货地址',

    shippingInfo: '物流信息',
    logisticsProvider: '物流供应商',
    logisticsProviderPlaceholder: '选择物流供应商',
    transportMode: '运输方式',
    transportModePlaceholder: '选择运输方式',
    logisticsService: '物流服务',
    logisticsServicePlaceholder: '选择服务类型（如：慢船、快船等）',
    shippingRateInfo: '运费报价信息',
    baseRate: '基础费率',
    fuelSurcharge: '燃油附加费',
    minCharge: '最低收费',
    transitDays: '预计时效',
    days: '天',
    validDate: '有效期',
    longTerm: '长期有效',
    carrier: '承运商',
    carrierPlaceholder: '输入承运商名称',
    trackingNumber: '追踪单号',
    trackingNumberPlaceholder: '输入追踪单号',
    expectedShipDate: '预计发货日期',
    expectedShipDatePlaceholder: '选择预计发货日期',
    expectedDeliveryDate: '预计到达日期',
    expectedDeliveryDatePlaceholder: '选择预计到达日期',

    packageInfo: '包装信息',
    boxCount: '箱数',
    totalWeight: '总重量',
    totalVolume: '总体积',

    items: '发货明细',
    addProduct: '添加产品',
    productImage: '图片',
    productCode: '产品编号',
    productName: '产品名称',
    packageSpec: '装箱规格',
    boxQuantity: '箱数',
    quantityPlanned: '发货数量',
    itemRemark: '备注',
    itemRemarkPlaceholder: '商品备注',
    actions: '操作',
    remove: '移除',
    totalItems: '总商品数',
    totalQuantity: '总数量',

    remarkSection: '备注信息',
    remark: '备注',
    remarkPlaceholder: '输入备注信息',
    internalNotes: '内部备注',
    internalNotesPlaceholder: '输入内部备注（仅内部可见）',

    submit: '创建发货单',
    cancel: '取消',

    warehouseRequired: '请选择发货仓库',
    destinationTypeRequired: '请选择收货方类型',
    destinationNameRequired: '请输入收货方名称',
    destinationAddressRequired: '请输入收货地址',
    itemsRequired: '请至少添加一个产品',
    productRequired: '请选择产品',
    selectWarehouseFirst: '请先选择发货仓库',
    pendingShipment: '待出库存',
    success: '发货单创建成功',
    failed: '创建发货单失败'
  }
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const productPickerVisible = ref(false)
const packageSpecs = ref<PackageSpec[]>([])
const shippingRate = ref<ShippingRate | null>(null)
const availableRates = ref<ShippingRate[]>([])
const loadingRates = ref(false)

// 包材配置缓存（key: productId 或 packageSpecId, value: 包材配置列表）
const productPackagingConfigs = ref<Record<number, any[]>>({})
const packageSpecPackagingConfigs = ref<Record<number, any[]>>({})

interface ShipmentItemForm extends CreateShipmentItemParams {
  product?: Sku
  pending_shipment?: number  // 待出库存
  _packageSpec?: PackageSpec // 装箱规格对象（用于计算）
}

const form = reactive({
  order_number: '',
  sales_channel: '',
  warehouse_id: null as number | null,

  destination_warehouse_id: null as number | null,
  destination_type: 'PLATFORM_WAREHOUSE' as DestinationType,
  destination_name: '',
  destination_code: '',
  destination_contact: '',
  destination_phone: '',
  destination_address: '',

  logistics_provider_id: null as number | null,
  transport_mode: null as TransportMode | null,
  logistics_service_id: null as number | null,  // 物流服务ID
  shipping_rate_id: null as number | null,
  carrier: '',
  tracking_number: '',
  expected_ship_date: '',
  expected_delivery_date: '',

  remark: '',
  internal_notes: '',

  items: [] as ShipmentItemForm[]
})

const rules: FormRules = {
  warehouse_id: [
    { required: true, message: labels.value.warehouseRequired, trigger: 'change' }
  ],
  destination_type: [
    { required: true, message: labels.value.destinationTypeRequired, trigger: 'change' }
  ],
  destination_name: [
    { required: true, message: labels.value.destinationNameRequired, trigger: 'blur' }
  ],
  destination_address: [
    { required: true, message: labels.value.destinationAddressRequired, trigger: 'blur' }
  ]
}

const totalQuantity = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.quantity_planned || 0), 0)
})

// 包装信息汇总（根据产品明细自动计算）
const packageSummary = computed(() => {
  let boxCount = 0
  let totalWeight = 0
  let totalVolume = 0

  for (const item of form.items) {
    const qty = item.box_quantity || 0
    boxCount += qty

    if (item.package_spec_id && qty > 0) {
      // 直接从 packageSpecs 查找
      const spec = packageSpecs.value.find(s => s.id === item.package_spec_id)
      if (spec) {
        totalWeight += spec.weight * qty
        // 体积：cm³ → m³
        const volumePerBox = (spec.length * spec.width * spec.height) / 1000000
        totalVolume += volumePerBox * qty
      }
    }
  }

  return { boxCount, totalWeight, totalVolume }
})

// 产品包材消耗计算（打包时）
const productPackagingConsumption = computed(() => {
  const consumptionMap = new Map<number, any>()

  for (const item of form.items) {
    if (!item.product?.id || !item.quantity_planned) continue

    const productId = item.product.id
    const quantity = item.quantity_planned

    // 获取该产品的包材配置
    const packagingConfigs = productPackagingConfigs.value[productId] || []

    for (const config of packagingConfigs) {
      const packagingItemId = config.packaging_item_id
      const quantityPerUnit = config.quantity_per_unit || 0
      const totalQty = quantity * quantityPerUnit

      if (consumptionMap.has(packagingItemId)) {
        const existing = consumptionMap.get(packagingItemId)
        existing.total_quantity += totalQty
      } else {
        consumptionMap.set(packagingItemId, {
          packaging_item_id: packagingItemId,
          item_name: config.packaging_item?.item_name || '-',
          item_code: config.packaging_item?.item_code || '-',
          specification: config.packaging_item?.specification,
          unit: config.packaging_item?.unit || '-',
          unit_cost: config.packaging_item?.unit_cost || 0,
          currency: config.packaging_item?.currency || 'CNY',
          total_quantity: totalQty
        })
      }
    }
  }

  return Array.from(consumptionMap.values())
})

// 装箱包材消耗计算（发货时）
const boxPackagingConsumption = computed(() => {
  const consumptionMap = new Map<number, any>()

  for (const item of form.items) {
    if (!item.package_spec_id || !item.box_quantity) continue

    const packageSpecId = item.package_spec_id
    const boxQty = item.box_quantity

    // 获取该装箱规格的包材配置
    const packagingConfigs = packageSpecPackagingConfigs.value[packageSpecId] || []

    for (const config of packagingConfigs) {
      const packagingItemId = config.packaging_item_id
      const quantityPerBox = config.quantity_per_box || 0
      const totalQty = boxQty * quantityPerBox

      if (consumptionMap.has(packagingItemId)) {
        const existing = consumptionMap.get(packagingItemId)
        existing.total_quantity += totalQty
      } else {
        consumptionMap.set(packagingItemId, {
          packaging_item_id: packagingItemId,
          item_name: config.packaging_item?.item_name || '-',
          item_code: config.packaging_item?.item_code || '-',
          specification: config.packaging_item?.specification,
          unit: config.packaging_item?.unit || '-',
          unit_cost: config.packaging_item?.unit_cost || 0,
          currency: config.packaging_item?.currency || 'CNY',
          total_quantity: totalQty
        })
      }
    }
  }

  return Array.from(consumptionMap.values())
})

// 产品包材总成本
const productPackagingTotalCost = computed(() => {
  return productPackagingConsumption.value.reduce((sum, item) => {
    return sum + item.total_quantity * item.unit_cost
  }, 0)
})

// 装箱包材总成本
const boxPackagingTotalCost = computed(() => {
  return boxPackagingConsumption.value.reduce((sum, item) => {
    return sum + item.total_quantity * item.unit_cost
  }, 0)
})

// 包材总成本
const totalPackagingCost = computed(() => {
  return productPackagingTotalCost.value + boxPackagingTotalCost.value
})

// 加载装箱规格列表
const loadPackageSpecs = async () => {
  try {
    const res = await getPackageSpecList({ status: 'ACTIVE', page_size: 100 })
    if (res.success) {
      const items = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []
      packageSpecs.value = items
    }
  } catch (error) {
    console.error('Load package specs failed:', error)
  }
}

// 装箱规格变更处理
const handlePackageSpecChange = (row: ShipmentItemForm) => {
  if (row.package_spec_id) {
    row._packageSpec = packageSpecs.value.find(s => s.id === row.package_spec_id)

    // 加载该装箱规格的包材配置
    loadPackageSpecPackagingConfig(row.package_spec_id)
  } else {
    row._packageSpec = undefined
  }
}

// 计算单项发货数量 = 箱数 × 每箱数量
const calculateItemQuantity = (row: ShipmentItemForm): number => {
  if (!row.package_spec_id || !row.box_quantity) return 0
  // 直接从 packageSpecs 查找，避免响应式问题
  const spec = packageSpecs.value.find(s => s.id === row.package_spec_id)
  if (!spec) return 0
  return row.box_quantity * (spec.quantity_per_box || 1)
}

// 加载可用报价列表
const loadAvailableRates = async () => {
  // 清空之前的数据
  availableRates.value = []
  shippingRate.value = null
  form.shipping_rate_id = null
  form.logistics_provider_id = null
  form.transport_mode = null
  form.logistics_service_id = null

  // 检查必要条件：起点仓库和目的地仓库都必须选择
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

    // 解析响应数据 - 分页格式: res.data.data, 数组格式: res.data
    availableRates.value = res.data?.data || (Array.isArray(res.data) ? res.data : [])

    console.log('加载到的可用报价:', availableRates.value)

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

// 报价选择变更处理
const handleRateChange = (rateId: number | null) => {
  if (!rateId) {
    shippingRate.value = null
    form.logistics_provider_id = null
    form.transport_mode = null
    form.logistics_service_id = null
    return
  }

  // 找到选中的报价
  const rate = availableRates.value.find(r => r.id === rateId)
  if (!rate) {
    return
  }

  // 设置报价信息
  shippingRate.value = rate

  // 自动填充相关字段
  form.logistics_provider_id = rate.provider_id
  form.transport_mode = rate.transport_mode
  form.logistics_service_id = rate.service_id || null

  // 自动填充预计到达日期（基于时效）
  if (rate.transit_days && form.expected_ship_date) {
    const shipDate = new Date(form.expected_ship_date)
    shipDate.setDate(shipDate.getDate() + rate.transit_days)
    form.expected_delivery_date = shipDate.toISOString().split('T')[0]
  }

  ElMessage.success('已自动填充物流信息')
}

// 格式化报价标签
const formatRateLabel = (rate: ShippingRate) => {
  const parts = []
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

// 目的地仓库变更处理
const handleDestinationWarehouseChange = async (warehouse: Warehouse | null) => {
  if (!warehouse) {
    availableRates.value = []
    shippingRate.value = null
    return
  }

  // 直接使用传入的仓库对象填充收货方信息（无需再次调用API）
  form.destination_type = 'OWN_WAREHOUSE'
  form.destination_name = warehouse.name
  form.destination_contact = warehouse.contact_person || ''
  form.destination_phone = warehouse.contact_phone || ''
  form.destination_address = warehouse.address || ''

  ElMessage.success(`已自动填充 ${warehouse.name} 的收货方信息`)

  // 加载可用报价
  await loadAvailableRates()
}

const handleDestinationTypeChange = () => {
  // 可以根据收货方类型设置默认值或提示
  console.log('Destination type changed:', form.destination_type)
}

const handleAddItem = () => {
  if (!form.warehouse_id) {
    ElMessage.warning(labels.value.selectWarehouseFirst)
    return
  }
  productPickerVisible.value = true
}

const handleProductsConfirm = (products: Array<Sku & { _inventory?: { pending_shipment?: number } }>) => {
  for (const product of products) {
    // Check if product already exists
    const exists = form.items.some(item => item.sku_id === product.id)
    if (!exists) {
      form.items.push({
        sku_id: product.id,
        quantity_planned: 0, // 将由 箱数 × 每箱数量 自动计算
        package_spec_id: undefined,
        box_quantity: 1, // 默认1箱
        remark: '',
        product,
        pending_shipment: product._inventory?.pending_shipment
      })

      // 加载该产品的包材配置
      if (product.id) {
        loadProductPackagingConfig(product.id)
      }
    }
  }
}

const getFullImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${url}`
}

const handleRemoveItem = (index: number) => {
  form.items.splice(index, 1)
}

// 加载产品的包材配置
const loadProductPackagingConfig = async (productId: number) => {
  // 如果已经加载过，跳过
  if (productPackagingConfigs.value[productId]) {
    return
  }

  try {
    const res = await getProductPackagingItems(productId)
    productPackagingConfigs.value[productId] = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Failed to load product packaging config:', error)
    productPackagingConfigs.value[productId] = []
  }
}

// 加载装箱规格的包材配置
const loadPackageSpecPackagingConfig = async (packageSpecId: number) => {
  // 如果已经加载过，跳过
  if (packageSpecPackagingConfigs.value[packageSpecId]) {
    return
  }

  try {
    const res = await getPackageSpecPackagingItems(packageSpecId)
    packageSpecPackagingConfigs.value[packageSpecId] = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Failed to load package spec packaging config:', error)
    packageSpecPackagingConfigs.value[packageSpecId] = []
  }
}

const validateItems = (): boolean => {
  if (form.items.length === 0) {
    ElMessage.error(labels.value.itemsRequired)
    return false
  }

  for (let i = 0; i < form.items.length; i++) {
    const item = form.items[i]
    if (!item.sku_id || item.sku_id === 0) {
      ElMessage.error(`第 ${i + 1} 行: ${labels.value.productRequired}`)
      return false
    }
    if (!item.package_spec_id) {
      ElMessage.error(`第 ${i + 1} 行: 请选择装箱规格`)
      return false
    }
    if (!item.box_quantity || item.box_quantity <= 0) {
      ElMessage.error(`第 ${i + 1} 行: 箱数必须大于0`)
      return false
    }
    // 验证计算后的发货数量
    const qty = calculateItemQuantity(item)
    if (qty <= 0) {
      ElMessage.error(`第 ${i + 1} 行: 发货数量必须大于0`)
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  if (!validateItems()) {
    return
  }

  submitting.value = true
  try {
    const res = await createShipment({
      order_number: form.order_number || undefined,
      sales_channel: form.sales_channel || undefined,
      warehouse_id: form.warehouse_id!,

      destination_warehouse_id: form.destination_warehouse_id || undefined,
      destination_type: form.destination_type,
      destination_name: form.destination_name,
      destination_code: form.destination_code || undefined,
      destination_contact: form.destination_contact || undefined,
      destination_phone: form.destination_phone || undefined,
      destination_address: form.destination_address,

      logistics_provider_id: form.logistics_provider_id || undefined,
      shipping_rate_id: form.shipping_rate_id || undefined,
      transport_mode: form.transport_mode || undefined,
      carrier: form.carrier || undefined,
      tracking_number: form.tracking_number || undefined,
      expected_ship_date: form.expected_ship_date || undefined,
      expected_delivery_date: form.expected_delivery_date || undefined,

      // 使用自动计算的包装汇总
      box_count: packageSummary.value.boxCount,
      total_weight: packageSummary.value.totalWeight,
      total_volume: packageSummary.value.totalVolume,

      remark: form.remark || undefined,
      internal_notes: form.internal_notes || undefined,

      items: form.items.map(item => ({
        sku_id: item.sku_id,
        quantity_planned: calculateItemQuantity(item), // 自动计算：箱数 × 每箱数量
        package_spec_id: item.package_spec_id,
        box_quantity: item.box_quantity || 0,
        remark: item.remark
      }))
    })

    if (res.success && res.data) {
      ElMessage.success(labels.value.success)
      router.push(`/shipping/shipments/${res.data.id}`)
    } else {
      ElMessage.error(labels.value.failed)
    }
  } catch (error: any) {
    console.error('Create shipment failed:', error)
    ElMessage.error(error.message || labels.value.failed)
  } finally {
    submitting.value = false
  }
}

const handleBack = () => {
  router.back()
}

// Clear items when warehouse changes (inventory data becomes invalid)
watch(
  () => form.warehouse_id,
  (newVal, oldVal) => {
    if (oldVal !== null && newVal !== oldVal) {
      if (form.items.length > 0) {
        form.items = []
        ElMessage.info('仓库已变更，已清空产品列表')
      }
      // 仓库变化时重新加载报价
      loadAvailableRates()
    }
  }
)

// 页面加载时获取装箱规格列表
onMounted(() => {
  loadPackageSpecs()
})
</script>

<style scoped>
.shipment-create {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
}

.items-section {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
}

.items-summary {
  margin-top: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  font-weight: 500;
}

.field-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

:deep(.el-divider__text) {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.no-image {
  color: #909399;
  font-size: 12px;
}

.product-code {
  font-weight: 600;
  color: #303133;
}

.product-title {
  color: #606266;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.qty-warning {
  color: #f56c6c;
  font-weight: 600;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.summary-value .unit {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

.package-hint {
  font-size: 12px;
  color: #909399;
  margin-top: -8px;
  margin-bottom: 16px;
}

:deep(.spec-size) {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

:deep(.spec-info) {
  font-size: 12px;
  color: #67c23a;
  margin-left: 8px;
  font-weight: 500;
}

.calculated-qty {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

/* 运费报价卡片样式 */
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

.rate-card-body {
  padding: 20px;
}

.rate-section {
  margin-bottom: 20px;
}

.rate-section:last-child {
  margin-bottom: 0;
}

.rate-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.rate-field {
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  height: 100%;
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
</style>
