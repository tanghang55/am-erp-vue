import { describe, it, expect, vi } from 'vitest'
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
  props: ['label'],
  setup(props, { slots }) {
    return () => [
      props.label ? String(props.label) : '',
      slots.default ? slots.default({ row: {} }) : null
    ]
  }
})

describe('SupplierProductQuoteList', () => {
  it('renders basic labels and actions', async () => {
    const wrapper = shallowMount(SupplierProductQuoteList, {
      global: {
        stubs: {
          'el-card': CardStub,
          'el-form': Stub,
          'el-form-item': Stub,
          'el-table': TableStub,
          'el-table-column': ColumnStub,
          'el-tag': Stub,
          'el-button': Stub,
          'el-input': Stub,
          'el-input-number': Stub,
          'el-select': Stub,
          'el-option': Stub,
          'el-dialog': Stub,
          'el-divider': Stub,
          'el-pagination': Stub,
          'el-icon': Stub,
          'el-radio-group': Stub,
          'el-radio': Stub
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Supplier Quotes')
    expect(wrapper.text()).toContain('Product')
    expect(wrapper.text()).toContain('Add Quote')
  })
})
