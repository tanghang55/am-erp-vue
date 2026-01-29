import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, provide, inject, ref, toRef } from 'vue'
import { useLocaleStore } from '@/modules/common/stores/localeStore'
import PurchaseOrderForm from '@/modules/procurement/components/PurchaseOrderForm.vue'

vi.mock('@/modules/supplier/api', () => ({
  getSupplierList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } })
}))

vi.mock('@/modules/product/api', () => ({
  getSkuList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  getProductComboDetail: vi.fn()
}))

vi.mock('@/modules/procurement/api', () => ({
  createPurchaseOrder: vi.fn(),
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

describe('PurchaseOrderForm', () => {
  it('renders sku picker entry', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderForm, {
      props: {
        mode: 'create'
      },
      global: {
        stubs: {
          'el-form': Stub,
          'el-form-item': Stub,
          'el-row': Stub,
          'el-col': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': Stub,
          'el-input-number': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-button': Stub,
          SkuPickerDialog: Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('选择SKU')
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
        stubs: {
          'el-form': Stub,
          'el-form-item': Stub,
          'el-row': Stub,
          'el-col': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': Stub,
          'el-input-number': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-button': Stub,
          SkuPickerDialog: Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    vm.form.items = [
      {
        sku_id: 1,
        qty_ordered: 1,
        unit_cost: 1,
        sku: {
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
        stubs: {
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
          SkuPickerDialog: Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    vm.form.items = [
      {
        sku_id: 1,
        qty_ordered: 1,
        unit_cost: 1,
        sku: {
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

  it('renders sku image when provided', async () => {
    setActivePinia(createPinia())
    const localeStore = useLocaleStore()
    localeStore.setLocale('zh-CN')

    const wrapper = shallowMount(PurchaseOrderForm, {
      props: {
        mode: 'create'
      },
      global: {
        stubs: {
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
          SkuPickerDialog: Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    const vm = wrapper.vm as any
    vm.form.items = [
      {
        sku_id: 1,
        qty_ordered: 1,
        unit_cost: 1,
        sku: {
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

    const image = wrapper.find('img.sku-image')
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
          'el-form': Stub,
          'el-form-item': FormItemStub,
          'el-row': Stub,
          'el-col': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-input': Stub,
          'el-input-number': InputNumberStub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-button': Stub,
          SkuPickerDialog: Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('默认供应商')
  })
})
