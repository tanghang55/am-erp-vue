import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, provide, inject, ref, toRef } from 'vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import PurchaseOrderForm from '@/modules/procurement/components/PurchaseOrderForm.vue'
import { getProductQuoteList } from '@/modules/supplier/api'
import { createPurchaseOrderBatch, getPurchaseOrderDetail } from '@/modules/procurement/api'

vi.mock('@/modules/supplier/api', () => ({
  getSupplierList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  getProductQuoteList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } })
}))

vi.mock('@/modules/product/api', () => ({
  getProductList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  getProductComboDetail: vi.fn()
}))

vi.mock('@/modules/procurement/api', () => ({
  createPurchaseOrder: vi.fn(),
  createPurchaseOrderBatch: vi.fn(),
  updatePurchaseOrder: vi.fn(),
  getPurchaseOrderDetail: vi.fn().mockResolvedValue({ success: true, data: {} })
}))

const Stub = defineComponent({ template: '<div><slot /></div>' })
const FormItemStub = defineComponent({
  props: ['label'],
  template: '<div><span v-if="label">{{ label }}</span><slot /></div>'
})
const TableStub = defineComponent({
  props: ['data'],
  setup(props, { slots }) {
    const tableData = toRef(props, 'data')
    provide('tableData', tableData)
    return () => (slots.default ? slots.default() : null)
  }
})
const ColumnStub = defineComponent({
  setup(_, { slots }) {
    const rows = inject('tableData', ref<any[]>([]))
    return () =>
      rows.value.map((row, index) => (slots.default ? slots.default({ row, $index: index }) : null))
  }
})
const InputNumberStub = defineComponent({ template: '<div data-test="input-number"></div>' })
const BasicSectionStub = defineComponent({
  props: ['labels'],
  template: '<div>{{ labels.marketplace }}</div>'
})
const ItemsSectionStub = defineComponent({
  props: ['labels', 'displayItems'],
  template: `
    <div>
      <div>{{ labels.selectProduct }}</div>
      <div>{{ labels.switchSupplier }}</div>
      <div v-for="row in displayItems" :key="row.product_id">
        <img v-if="row.product?.image_url" class="product-image" :src="row.product.image_url" />
        <div data-test="input-number"></div>
      </div>
    </div>
  `
})
const SummaryPanelStub = defineComponent({ template: '<div>summary</div>' })

const globalStubs = {
  'el-form': Stub,
  'el-form-item': Stub,
  'el-row': Stub,
  'el-col': Stub,
  'el-select': Stub,
  'el-option': Stub,
  'el-input': Stub,
  'el-input-number': InputNumberStub,
  'el-table': TableStub,
  'el-table-column': ColumnStub,
  'el-button': Stub,
  'el-dialog': Stub,
  ProductPickerDialog: Stub,
  PurchaseOrderBasicSection: BasicSectionStub,
  PurchaseOrderItemsSection: ItemsSectionStub,
  PurchaseOrderSummaryPanel: SummaryPanelStub
}

describe('PurchaseOrderForm', () => {
  it('loads quotes by exact product ids instead of keyword lookup', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    vi.mocked(getProductQuoteList).mockResolvedValueOnce({
      success: true,
      data: {
        data: [
          {
            product_id: 12,
            seller_sku: 'SKU-12',
            asin: 'ASIN12',
            marketplace: 'US',
            title: 'Product 12',
            image_url: '',
            default_supplier_id: 8,
            quotes: []
          }
        ],
        total: 1,
        page: 1,
        page_size: 50
      }
    } as any)

    vi.mocked(getPurchaseOrderDetail).mockResolvedValueOnce({
      success: true,
      data: {
        id: 12,
        supplier_id: 8,
        marketplace: 'US',
        currency: 'USD',
        remark: '',
        items: [
          {
            id: 1,
            product_id: 12,
            qty_ordered: 5,
            unit_cost: 8.5,
            product: {
              id: 12,
              seller_sku: 'SKU-12',
              title: 'Product 12',
              image_url: '',
              marketplace: 'US'
            }
          }
        ]
      }
    } as any)

    const wrapper = shallowMount(PurchaseOrderForm, {
      props: {
        mode: 'edit',
        orderId: 12
      },
      global: {
        stubs: globalStubs
      }
    })

    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await Promise.resolve()

    expect(getProductQuoteList).toHaveBeenCalled()
    expect(vi.mocked(getProductQuoteList).mock.calls[0]?.[0]).toMatchObject({
      product_ids: [12]
    })
    expect(vi.mocked(getProductQuoteList).mock.calls[0]?.[0]).not.toHaveProperty('keyword')
  })

  it('renders product picker entry', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderForm, {
      props: {
        mode: 'create'
      },
      global: {
        stubs: globalStubs
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('选择产品')
  })

  it('renders supplier switch label', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderForm, {
      props: {
        mode: 'create'
      },
      global: {
        stubs: globalStubs
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    vm.form.items = [
      {
        product_id: 1,
        qty_ordered: 1,
        unit_cost: 1,
        product: {
          id: 1,
          seller_sku: 'SKU-1',
          asin: '',
          title: 'Test',
          marketplace: 'US',
          status: 'ACTIVE',
          gmt_create: '',
          gmt_modified: ''
        }
      }
    ]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('切换供应商')
  })

  it('keeps unit cost read-only', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderForm, {
      props: {
        mode: 'create'
      },
      global: {
        stubs: globalStubs
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    vm.form.items = [
      {
        product_id: 1,
        qty_ordered: 1,
        unit_cost: 1,
        product: {
          id: 1,
          seller_sku: 'SKU-1',
          asin: '',
          title: 'Test',
          marketplace: 'US',
          status: 'ACTIVE',
          gmt_create: '',
          gmt_modified: ''
        }
      }
    ]
    await wrapper.vm.$nextTick()

    const inputs = wrapper.findAll('[data-test="input-number"]')
    expect(inputs).toHaveLength(1)
  })

  it('renders product image when provided', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderForm, {
      props: {
        mode: 'create'
      },
      global: {
        stubs: globalStubs
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    vm.form.items = [
      {
        product_id: 1,
        qty_ordered: 1,
        unit_cost: 1,
        product: {
          id: 1,
          seller_sku: 'SKU-IMG',
          asin: '',
          title: 'With Image',
          marketplace: 'US',
          status: 'ACTIVE',
          image_url: 'https://example.com/sku.png',
          gmt_create: '',
          gmt_modified: ''
        }
      }
    ]
    await wrapper.vm.$nextTick()

    const image = wrapper.find('img.product-image')
    expect(image.exists()).toBe(true)
    expect(image.attributes('src')).toBe('https://example.com/sku.png')
  })

  it('does not render default supplier field', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderForm, {
      props: {
        mode: 'create'
      },
      global: {
        stubs: {
          'el-form-item': FormItemStub,
          ...globalStubs
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('默认供应商')
  })

  it('creates purchase orders through batch endpoint', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    vi.mocked(createPurchaseOrderBatch).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 101,
          po_number: 'PO202603150001-1',
          batch_no: 'PO202603150001',
          status: 'DRAFT',
          currency: 'USD',
          total_amount: '10.0000',
          created_at: '',
          updated_at: ''
        }
      ]
    } as any)

    const wrapper = shallowMount(PurchaseOrderForm, {
      props: { mode: 'create' },
      global: { stubs: globalStubs }
    })

    const vm = wrapper.vm as any
    vm.form.marketplace = 'US'
    vm.form.currency = 'USD'
    vm.form.items = [
      {
        product_id: 1,
        qty_ordered: 2,
        unit_cost: 5,
        supplier_id: 8,
        product: {
          id: 1,
          seller_sku: 'SKU-1',
          asin: '',
          title: 'Test',
          marketplace: 'US',
          status: 'ACTIVE',
          gmt_create: '',
          gmt_modified: ''
        }
      }
    ]

    await vm.handleSubmit()

    expect(createPurchaseOrderBatch).toHaveBeenCalledWith({
      orders: [
        {
          supplier_id: undefined,
          marketplace: 'US',
          currency: 'USD',
          remark: undefined,
          items: [{ product_id: 1, qty_ordered: 2, unit_cost: 5 }]
        }
      ]
    })
  })
})
