import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, ref } from 'vue'
import ProductList from '@/modules/product/views/ProductList.vue'
import { useI18nStore } from '@/modules/common/stores/i18nStore'
import { useLocaleStore } from '@/modules/common/stores/localeStore'

const {
  mockGetProductList,
  mockCreateProduct,
  mockUpdateProduct,
  mockSavePackagingItems,
  mockGetProductQuoteList,
  mockGetProductSupplierQuote,
  mockGetProductImageList
} = vi.hoisted(() => ({
  mockGetProductList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  mockCreateProduct: vi.fn(),
  mockUpdateProduct: vi.fn(),
  mockSavePackagingItems: vi.fn().mockResolvedValue(undefined),
  mockGetProductQuoteList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  mockGetProductSupplierQuote: vi.fn().mockResolvedValue({ success: true, data: null }),
  mockGetProductImageList: vi.fn().mockResolvedValue({ success: true, data: [] })
}))

vi.mock('@/modules/product/api/products', () => ({
  getProductList: mockGetProductList,
  createProduct: mockCreateProduct,
  updateProduct: mockUpdateProduct,
  deleteProduct: vi.fn(),
  getProductAuditLogs: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } })
}))

vi.mock('@/modules/product/api/configs', () => ({
  getProductConfigList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  getProductCategoryTree: vi.fn().mockResolvedValue({ success: true, data: [] })
}))

vi.mock('@/modules/supplier/api/quotes', () => ({
  getProductQuoteList: mockGetProductQuoteList,
  getProductSupplierQuote: mockGetProductSupplierQuote
}))

vi.mock('@/modules/product/api/images', () => ({
  getProductImageList: mockGetProductImageList
}))

vi.mock('@/modules/common/composables/useAuditLogFormatter', () => ({
  useAuditLogFormatter: () => ({
    getFieldLabel: () => '',
    getActionLabel: () => '',
    formatAuditChanges: () => '',
    formatAuditFieldValue: () => '',
    getChangePairs: () => [],
    getChangeRows: () => []
  })
}))

vi.mock('@/modules/product/composables/useProductPackaging', () => ({
  useProductPackaging: () => ({
    packagingItems: ref([]),
    availablePackagingItems: ref([]),
    resetPackagingItems: vi.fn(),
    loadAvailablePackagingItems: vi.fn().mockResolvedValue(undefined),
    loadProductPackagingItems: vi.fn().mockResolvedValue(undefined),
    handleAddPackagingItem: vi.fn(),
    handleRemovePackagingItem: vi.fn(),
    handlePackagingItemSelect: vi.fn(),
    savePackagingItems: mockSavePackagingItems
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn()
  })
}))

const CardStub = defineComponent({
  template: '<div><slot name="header" /><slot /></div>'
})

const Stub = defineComponent({
  template: '<div><slot /></div>'
})

const NoSlotStub = defineComponent({
  template: '<div />'
})

describe('ProductList', () => {
  beforeEach(() => {
    mockGetProductList.mockClear()
    mockCreateProduct.mockReset()
    mockUpdateProduct.mockReset()
    mockSavePackagingItems.mockReset()
    mockSavePackagingItems.mockResolvedValue(undefined)
    mockGetProductQuoteList.mockReset()
    mockGetProductQuoteList.mockResolvedValue({ success: true, data: { data: [], total: 0 } })
    mockGetProductSupplierQuote.mockReset()
    mockGetProductSupplierQuote.mockResolvedValue({ success: true, data: null })
    mockGetProductImageList.mockReset()
    mockGetProductImageList.mockResolvedValue({ success: true, data: [] })
  })

  it('includes image url in create and update payloads', async () => {
    setActivePinia(createPinia())
    mockCreateProduct.mockResolvedValue({ success: true, data: { id: 101 } })
    mockUpdateProduct.mockResolvedValue({ success: true, data: { id: 102 } })
    mockSavePackagingItems.mockResolvedValue(undefined)

    const wrapper = shallowMount(ProductList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-empty': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-cascader': Stub,
          'el-tag': Stub,
          'el-tooltip': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub,
          'el-image': Stub,
          SupplierSelector: Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'ImageUpload': Stub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any

    vm.productForm.seller_sku = 'SKU-IMG-001'
    vm.productForm.title = '带图片产品'
    vm.productForm.marketplace = 'US'
    vm.productForm.status = 'DRAFT'
    vm.productForm.supplier_id = 9
    vm.productForm.image_url = '/uploads/products/UPL2026031412301234.png'

    await vm.handleSave()

    expect(mockCreateProduct).toHaveBeenCalledWith(expect.objectContaining({
      image_url: '/uploads/products/UPL2026031412301234.png',
      is_combo_main: 0,
      is_packing_required: 1
    }))

    vm.isEdit = true
    vm.productForm.id = 102
    vm.productForm.image_url = '/uploads/products/UPL2026031412315678.png'

    await vm.handleSave()

    expect(mockUpdateProduct).toHaveBeenCalledWith(
      102,
      expect.objectContaining({
        image_url: '/uploads/products/UPL2026031412315678.png',
        is_combo_main: 0,
        is_packing_required: 1
      })
    )
  })

  it('syncs unit cost from selected supplier quote when editing product', async () => {
    setActivePinia(createPinia())
    mockGetProductSupplierQuote.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        product_id: 101,
        supplier_id: 11,
        price: 18.6,
        currency: 'USD',
        qty_moq: 1,
        lead_time_days: 7,
        status: 'ACTIVE'
      }
    })

    const wrapper = shallowMount(ProductList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-empty': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-cascader': Stub,
          'el-tag': Stub,
          'el-tooltip': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub,
          'el-image': Stub,
          SupplierSelector: Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'ImageUpload': Stub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    vm.productForm.id = 101
    vm.productForm.supplier_id = 11
    vm.productForm.unit_cost = 0

    await vm.handleProductSupplierChange(11)

    expect(mockGetProductSupplierQuote).toHaveBeenCalledWith(101, 11)
    expect(vm.productForm.unit_cost).toBe(18.6)
  })

  it('preserves combo and parent relations when saving an unchanged product edit', async () => {
    setActivePinia(createPinia())
    mockUpdateProduct.mockResolvedValue({ success: true, data: { id: 202 } })
    mockSavePackagingItems.mockResolvedValue(undefined)

    const wrapper = shallowMount(ProductList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-empty': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-cascader': Stub,
          'el-tag': Stub,
          'el-tooltip': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub,
          'el-image': Stub,
          SupplierSelector: Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          ImageUpload: Stub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    await vm.handleEdit({
      id: 202,
      seller_sku: 'COMBO-CHILD-202',
      asin: 'B0TEST202',
      title: '组合子产品',
      marketplace: 'US',
      status: 'ON_SALE',
      supplier_id: 9,
      combo_id: 77,
      is_combo_main: 0,
      parent_id: 33,
      image_url: '',
      remark: ''
    })

    await vm.handleSave()

    expect(mockUpdateProduct).toHaveBeenCalledWith(
      202,
      expect.objectContaining({
        parent_id: 33,
        combo_id: 77,
        is_combo_main: 0
      })
    )
  })

  it('loads product image list when opening detail dialog', async () => {
    setActivePinia(createPinia())
    mockGetProductImageList.mockResolvedValue({
      success: true,
      data: ['/uploads/products/main.png', '/uploads/products/extra-1.png']
    })

    const wrapper = shallowMount(ProductList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-empty': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-cascader': Stub,
          'el-tag': Stub,
          'el-tooltip': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub,
          'el-image': Stub,
          SupplierSelector: Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'ImageUpload': Stub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    await vm.handleView({
      id: 101,
      seller_sku: 'SKU-101',
      image_url: '/uploads/products/main.png'
    })

    expect(mockGetProductImageList).toHaveBeenCalledWith(101)
    expect(vm.currentProduct.images).toEqual(['/uploads/products/main.png', '/uploads/products/extra-1.png'])
  })

  it('renders product master page header and search workspace', async () => {
    setActivePinia(createPinia())
    const i18nStore = useI18nStore()
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')
    i18nStore.setLabels({
      'product.list.keyword': '关键词',
      'product.list.keywordPlaceholder': '产品编码 / ASIN / 标题',
      'product.list.combo': '组合',
      'product.list.all': '全部',
      'product.list.mainOnly': '主产品',
      'product.list.comboOnly': '组合产品',
      'product.list.marketplace': '站点',
      'product.list.status': '销售状态',
      'global.search': '查询',
      'global.reset': '重置'
    })

    const wrapper = shallowMount(ProductList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-empty': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-cascader': Stub,
          'el-tag': Stub,
          'el-tooltip': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub,
          'el-image': Stub,
          SupplierSelector: Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'ImageUpload': Stub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('产品管理')
    expect(wrapper.text()).toContain('产品档案')
    expect(wrapper.text()).toContain('查询')
    expect(wrapper.text()).toContain('重置')
  })

  it('renders split editor and detail dialogs', async () => {
    setActivePinia(createPinia())

    const wrapper = shallowMount(ProductList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': NoSlotStub,
          'el-table-column': NoSlotStub,
          'el-pagination': Stub,
          'el-dialog': Stub,
          'el-empty': Stub,
          'el-button': Stub,
          'el-icon': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-cascader': Stub,
          'el-tag': Stub,
          'el-tooltip': Stub,
          'el-dropdown': Stub,
          'el-dropdown-menu': Stub,
          'el-dropdown-item': Stub,
          'el-image': Stub,
          SupplierSelector: Stub,
          'el-input-number': Stub,
          'el-divider': Stub,
          'el-descriptions': Stub,
          'el-descriptions-item': Stub,
          'ImageUpload': Stub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toContain('product-editor-dialog-stub')
    expect(wrapper.html()).toContain('product-detail-dialog-stub')
  })
})
