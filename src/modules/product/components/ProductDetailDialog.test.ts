import { describe, expect, it } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import ProductDetailDialog from '@/modules/product/components/ProductDetailDialog.vue'

const Stub = defineComponent({
  template: '<div><slot /><slot name="default" /></div>'
})

describe('ProductDetailDialog', () => {
  it('renders human readable audit change values for product fields', async () => {
    const wrapper = shallowMount(ProductDetailDialog, {
      props: {
        modelValue: true,
        currentProduct: {
          id: 1,
          seller_sku: 'P-001',
          asin: 'B001',
          title: '测试产品',
          marketplace: 'US',
          status: 'ON_SALE',
          gmt_create: '2026-03-13 10:00:00',
          gmt_modified: '2026-03-13 11:00:00'
        },
        currentProductSummaryCards: [],
        text: {
          productDetails: '产品详情',
          noImage: '暂无图片',
          basicArchive: '基础档案',
          basicArchiveHint: 'hint',
          sellerSku: '产品编码',
          asin: 'ASIN',
          fnsku: 'FNSKU',
          salesStatus: '销售状态',
          brand: '品牌',
          category: '品类',
          weight: '重量',
          dimensions: '尺寸',
          dimensionUnit: '尺寸单位',
          supplier: '供应商',
          title: '标题',
          remark: '备注',
          auditLogs: '操作日志',
          auditLogsHint: 'hint',
          time: '时间',
          operator: '操作人',
          action: '操作',
          changes: '变更内容',
          systemOperator: '系统',
          noChanges: '无字段变更',
          packagingConfig: '包材配置',
          packagingConfigHint: 'hint',
          packagingName: '包材',
          code: '编码',
          specification: '规格',
          consumptionQuantity: '消耗量',
          unit: '单位',
          productTimeline: '归档',
          productTimelineHint: 'hint',
          createdAt: '创建时间',
          updatedAt: '更新时间',
          image: '图片',
          imageUploaded: '已上传',
          imagePending: '待上传',
          noPackagingConfigured: '未配置包材'
        },
        auditLogs: [
          {
            id: 9,
            action: 'UPDATE_PRODUCT',
            changes: JSON.stringify({
              before: {
                brand_id: 1,
                category_id: 11,
                status: 'DRAFT',
                combo_id: 27,
                parent_id: 1,
                is_combo_main: 1,
                unit_cost: null,
                reference_count: 12
              },
              after: {
                brand_id: 2,
                category_id: 22,
                status: 'ON_SALE',
                combo_id: null,
                parent_id: null,
                is_combo_main: 0,
                unit_cost: 0,
                reference_count: 45
              }
            }),
            created_at: '2026-03-13 12:00:00',
            username: 'admin'
          }
        ],
        auditLoading: false,
        auditPagination: { page: 1, page_size: 10, total: 1 },
        packagingItems: [],
        getFullImageUrl: (value: string) => value,
        getStatusType: () => 'success',
        getStatusLabel: (value: string) => (value === 'ON_SALE' ? '正常销售' : '草稿'),
        formatDateTime: (value?: string) => value || '-',
        formatOptional: (value?: string | number | null) => String(value ?? '-'),
        formatDimensionSummary: () => '-',
        getCategoryPath: (id?: number) => (id === 22 ? '一级 / 二级 / 三级' : id === 11 ? '旧品类' : '-'),
        getActionLabel: () => '编辑产品',
        formatAuditChanges: () => '',
        formatAuditFieldValue: (key: string, value: unknown) => {
          if (key === 'brand_id') return value === 1 ? '旧品牌' : '新品牌'
          if (key === 'category_id') return value === 11 ? '旧品类' : '一级 / 二级 / 三级'
          if (key === 'status') return value === 'DRAFT' ? '草稿' : '正常销售'
          if (key === 'unit_cost') return value === null ? '空' : '0.00'
          return String(value ?? '')
        },
        getFieldLabel: (key: string) => ({
          brand_id: '品牌',
          category_id: '品类',
          status: '销售状态',
          combo_id: '组合关系',
          parent_id: '产品归组',
          is_combo_main: '组合角色',
          unit_cost: '默认供应商报价',
          reference_count: '引用数'
        }[key] || key),
        getChangePairs: (changes?: string | null) => {
          if (!changes) return []
          const parsed = JSON.parse(changes)
          return [
            { key: 'brand_id', before: parsed.before.brand_id, after: parsed.after.brand_id },
            { key: 'category_id', before: parsed.before.category_id, after: parsed.after.category_id },
            { key: 'status', before: parsed.before.status, after: parsed.after.status },
            { key: 'combo_id', before: parsed.before.combo_id, after: parsed.after.combo_id },
            { key: 'parent_id', before: parsed.before.parent_id, after: parsed.after.parent_id },
            { key: 'is_combo_main', before: parsed.before.is_combo_main, after: parsed.after.is_combo_main },
            { key: 'unit_cost', before: parsed.before.unit_cost, after: parsed.after.unit_cost },
            { key: 'reference_count', before: parsed.before.reference_count, after: parsed.after.reference_count }
          ]
        },
        getChangeRows: () => []
      },
      global: {
        stubs: {
          'el-dialog': Stub,
          'el-tabs': Stub,
          'el-tab-pane': Stub,
          'el-card': Stub,
          'el-tag': Stub,
          'el-image': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'el-table': Stub,
          'el-table-column': Stub,
          'el-pagination': Stub,
          'el-empty': Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('品牌')
    expect(wrapper.text()).toContain('旧品牌')
    expect(wrapper.text()).toContain('新品牌')
    expect(wrapper.text()).toContain('一级 / 二级 / 三级')
    expect(wrapper.text()).toContain('正常销售')
    expect(wrapper.text()).toContain('组合关系')
    expect(wrapper.text()).toContain('已关联组合')
    expect(wrapper.text()).toContain('未关联组合')
    expect(wrapper.text()).toContain('产品归组')
    expect(wrapper.text()).toContain('已挂载归组')
    expect(wrapper.text()).toContain('未挂载归组')
    expect(wrapper.text()).toContain('组合角色')
    expect(wrapper.text()).toContain('主产品')
    expect(wrapper.text()).toContain('非主产品')
    expect(wrapper.text()).toContain('默认供应商报价')
    expect(wrapper.text()).toContain('0.00')
    expect(wrapper.text()).not.toContain('reference_count')
    expect(wrapper.text()).not.toContain('引用数')
  })

  it('renders product image gallery from image list', async () => {
    const wrapper = shallowMount(ProductDetailDialog, {
      props: {
        modelValue: true,
        currentProduct: {
          id: 1,
          seller_sku: 'P-IMG-001',
          asin: 'BIMG001',
          title: '图片产品',
          marketplace: 'US',
          status: 'ON_SALE',
          image_url: '/uploads/products/main.png',
          images: ['/uploads/products/main.png', '/uploads/products/extra-1.png', '/uploads/products/extra-2.png'],
          gmt_create: '2026-03-13 10:00:00',
          gmt_modified: '2026-03-13 11:00:00'
        },
        text: {
          productDetails: '产品详情',
          noImage: '暂无图片',
          basicArchive: '基础档案',
          basicArchiveHint: 'hint',
          sellerSku: '产品编码',
          asin: 'ASIN',
          fnsku: 'FNSKU',
          salesStatus: '销售状态',
          brand: '品牌',
          category: '品类',
          weight: '重量',
          dimensions: '尺寸',
          dimensionUnit: '尺寸单位',
          supplier: '供应商',
          title: '标题',
          remark: '备注',
          auditLogs: '操作日志',
          auditLogsHint: 'hint',
          time: '时间',
          operator: '操作人',
          action: '操作',
          changes: '变更内容',
          systemOperator: '系统',
          noChanges: '无字段变更',
          packagingConfig: '包材配置',
          packagingConfigHint: 'hint',
          packagingName: '包材',
          code: '编码',
          specification: '规格',
          consumptionQuantity: '消耗量',
          unit: '单位',
          productTimeline: '归档',
          productTimelineHint: 'hint',
          createdAt: '创建时间',
          updatedAt: '更新时间',
          image: '图片',
          imageUploaded: '已上传',
          imagePending: '待上传',
          noPackagingConfigured: '未配置包材',
          inventoryInfo: '库存',
          productImages: '产品图片',
          productImagesHint: '显示主图和已上传的产品图片。'
        },
        auditLogs: [],
        auditLoading: false,
        auditPagination: { page: 1, page_size: 10, total: 0 },
        packagingItems: [],
        getFullImageUrl: (value: string) => `http://test${value}`,
        getStatusType: () => 'success',
        getStatusLabel: () => '正常销售',
        formatDateTime: (value?: string) => value || '-',
        formatOptional: (value?: string | number | null) => String(value ?? '-'),
        formatDimensionSummary: () => '-',
        getCategoryPath: () => '-',
        getActionLabel: () => '编辑产品',
        formatAuditChanges: () => '',
        formatAuditFieldValue: (_key: string, value: unknown) => String(value ?? ''),
        getFieldLabel: (key: string) => key,
        getChangePairs: () => [],
        getChangeRows: () => []
      },
      global: {
        stubs: {
          'el-dialog': Stub,
          'el-tag': Stub,
          'el-image': defineComponent({
            props: ['src'],
            template: '<img class="el-image-stub" :src="src" />'
          }),
          'el-table': Stub,
          'el-table-column': Stub,
          'el-pagination': Stub,
          'el-empty': Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    const images = wrapper.findAll('.detail-gallery__image')
    expect(wrapper.text()).toContain('产品图片')
    expect(images).toHaveLength(3)
  })
})
