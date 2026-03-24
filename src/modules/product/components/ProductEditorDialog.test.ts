import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ProductEditorDialog from '@/modules/product/components/ProductEditorDialog.vue'

const Stub = defineComponent({
  template: '<div><slot /></div>'
})

describe('ProductEditorDialog', () => {
  it('renders sales status field in product attributes section', async () => {
    const wrapper = shallowMount(ProductEditorDialog, {
      props: {
        modelValue: true,
        dialogTitle: '新增产品',
        saving: false,
        isEdit: false,
        activeTab: 'basic',
        dialogTabs: [{ key: 'basic', label: '基础信息', icon: {} }],
        text: {
          productEditorDescription: 'desc',
          basicInfo: '基础信息',
          basicInfoHint: 'hint',
          productImage: '产品图片',
          sellerSku: '产品编码',
          asin: 'ASIN',
          title: '标题',
          marketplace: '站点',
          fnsku: 'FNSKU',
          sourcingInfo: '采购与供应商',
          sourcingInfoHint: 'hint',
          supplier: '供应商',
          unitCostUsd: '基础成本',
          supplierSelected: '已选择',
          supplierPending: '待选择',
          unitCost: '成本',
          productAttribute: '产品属性',
          productAttributeHint: 'hint',
          brand: '品牌',
          category: '品类',
          salesStatus: '销售状态',
          statusDraft: '草稿',
          statusOnSale: '正常销售',
          statusReplenishing: '补货中',
          statusOffShelf: '下架',
          sizeWeight: '尺寸与重量',
          sizeWeightHint: 'hint',
          weight: '重量',
          weightUnit: '重量单位',
          length: '长度',
          width: '宽度',
          height: '高度',
          dimensionUnit: '尺寸单位',
          dimensionPreview: '尺寸预览',
          inspectionRule: '质检规则',
          inspectionRuleHint: 'hint',
          inspectionRequired: '需要质检',
          inspectionNotRequired: '免检直通',
          packingRule: '打包规则',
          packingRuleHint: 'hint',
          packingRequired: '需要打包',
          packingNotRequired: '免打包直通',
          remark: '备注',
          packagingConfig: '包材配置',
          packagingConfigHint: 'hint',
          addPackagingItem: '添加包材',
          productOverview: '产品概览',
          productOverviewHint: 'hint',
          imageStatus: '图片状态',
          imageUploaded: '已上传',
          imagePending: '待上传',
          packagingItemsCount: '包材项数',
          editingScope: '编辑范围',
          editingScopeHint: 'hint',
          cancel: '取消',
          save: '保存'
        },
        productForm: {
          image_url: '',
          seller_sku: '',
          asin: '',
          title: '',
          marketplace: 'US',
          supplier_id: undefined,
          brand_id: undefined,
          category_id: undefined,
          status: 'DRAFT',
          dimension_unit_id: undefined,
          weight_unit_id: undefined,
          is_inspection_required: 1,
          is_packing_required: 1,
          unit_cost: undefined,
          fnsku: '',
          weight: undefined,
          length: undefined,
          width: undefined,
          height: undefined,
          remark: ''
        },
        productFormRules: {},
        packagingItems: [],
        availablePackagingItems: [],
        configOptionsByType: { BRAND: [], SALES_STATUS: [], DIMENSION_UNIT: [], WEIGHT_UNIT: [] },
        salesStatusOptions: [
          { value: 'DRAFT', label: '草稿' },
          { value: 'ON_SALE', label: '正常销售' }
        ],
        categoryOptions: [],
        getConfigItemName: () => '-',
        getCategoryName: () => '-',
        getCategoryPath: () => '-',
        getStatusLabel: () => '草稿',
        formatDimensionSummary: () => '-'
      },
      global: {
        stubs: {
          'el-dialog': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input': Stub,
          'el-input-number': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-table': Stub,
          'el-table-column': Stub,
          'el-empty': Stub,
          'el-cascader': Stub,
          'el-segmented': Stub,
          ImageUpload: Stub,
          SupplierSelector: Stub,
          ProductConfigSelector: Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('销售状态')
  })

  it('does not render packaging remark field', async () => {
    const wrapper = shallowMount(ProductEditorDialog, {
      props: {
        modelValue: true,
        dialogTitle: '新增产品',
        saving: false,
        isEdit: false,
        text: {
          productEditorDescription: 'desc',
          productImage: '产品图片',
          sellerSku: '产品编码',
          asin: 'ASIN',
          title: '标题',
          marketplace: '站点',
          fnsku: 'FNSKU',
          supplier: '供应商',
          unitCostUsd: '基础成本',
          brand: '品牌',
          category: '品类',
          salesStatus: '销售状态',
          weight: '重量',
          weightUnit: '重量单位',
          length: '长度',
          width: '宽度',
          height: '高度',
          dimensionUnit: '尺寸单位',
          dimensionPreview: '尺寸预览',
          inspectionRule: '质检规则',
          inspectionRuleHint: 'hint',
          inspectionRequired: '需要质检',
          inspectionNotRequired: '免检直通',
          packingRule: '打包规则',
          packingRuleHint: 'hint',
          packingRequired: '需要打包',
          packingNotRequired: '免打包直通',
          remark: '备注',
          packagingConfig: '包材配置',
          packagingConfigHint: 'hint',
          addPackagingItem: '添加包材',
          packagingItemsCount: '包材项数',
          packagingName: '包材名称',
          unit: '单位',
          consumptionQuantity: '消耗量',
          quantityPlaceholder: '数量',
          selectPackaging: '选择包材',
          noPackagingConfigured: '暂未配置包材',
          save: '保存'
        },
        productForm: {
          image_url: '',
          seller_sku: '',
          asin: '',
          title: '',
          marketplace: 'US',
          supplier_id: undefined,
          brand_id: undefined,
          category_id: undefined,
          status: 'DRAFT',
          dimension_unit_id: undefined,
          weight_unit_id: undefined,
          is_inspection_required: 1,
          is_packing_required: 1,
          unit_cost: undefined,
          fnsku: '',
          weight: undefined,
          length: undefined,
          width: undefined,
          height: undefined,
          remark: ''
        },
        productFormRules: {},
        packagingItems: [{ packaging_item_id: 1, quantity_per_unit: 1 }],
        availablePackagingItems: [{ id: 1, item_name: '纸箱', item_code: 'BX-1', specification: '10x10', unit: '个' }],
        configOptionsByType: { BRAND: [], SALES_STATUS: [], DIMENSION_UNIT: [], WEIGHT_UNIT: [] },
        salesStatusOptions: [{ value: 'DRAFT', label: '草稿' }],
        categoryOptions: [],
        getConfigItemName: () => '-',
        getCategoryName: () => '-',
        getCategoryPath: () => '-',
        getStatusLabel: () => '草稿',
        formatDimensionSummary: () => '-'
      },
      global: {
        stubs: {
          'el-dialog': Stub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-input': Stub,
          'el-input-number': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-table': Stub,
          'el-table-column': Stub,
          'el-empty': Stub,
          'el-cascader': Stub,
          'el-segmented': Stub,
          ImageUpload: Stub,
          SupplierSelector: Stub,
          ProductConfigSelector: Stub
        }
      }
    })

    await wrapper.findAll('button').find((node) => node.text().includes('包材配置'))?.trigger('click')
    await wrapper.vm.$nextTick()

    const packagingGrid = wrapper.find('.packaging-editor-grid')
    expect(packagingGrid.exists()).toBe(true)
    expect(packagingGrid.text()).toContain('包材名称')
    expect(packagingGrid.text()).toContain('消耗量')
    expect(packagingGrid.text()).not.toContain('备注')
  })
})
