import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import SupplierProductQuoteList from '@/modules/supplier/views/SupplierProductQuoteList.vue'

vi.mock('@/modules/supplier/api', () => ({
  getProductQuoteList: vi.fn().mockResolvedValue({ success: true, data: { data: [], total: 0 } }),
  createQuote: vi.fn(),
  updateQuote: vi.fn(),
  deleteQuote: vi.fn(),
  setDefaultSupplier: vi.fn()
}))

const CardStub = defineComponent({ template: '<div><slot name="header" /><slot /></div>' })
const Stub = defineComponent({ template: '<div><slot /></div>' })
const TableStub = defineComponent({ template: '<div><slot /></div>' })
const ColumnStub = defineComponent({
  setup(_, { slots }) {
    return () => (slots.default ? slots.default({ row: {} }) : null)
  }
})
const SupplierSelectorStub = defineComponent({
  name: 'SupplierSelector',
  template: '<div class="supplier-selector-stub" />'
})

describe('SupplierProductQuoteList', () => {
  it('renders supplier selector instead of supplier id input', async () => {
    const wrapper = shallowMount(SupplierProductQuoteList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-button': Stub,
          'el-input': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-tag': Stub,
          'el-dialog': Stub,
          'el-pagination': Stub,
          'el-input-number': Stub,
          SupplierSelector: SupplierSelectorStub
        },
        directives: {
          loading: () => {}
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('供应商报价')
    expect(wrapper.find('.supplier-selector-stub').exists()).toBe(true)
  })
})
